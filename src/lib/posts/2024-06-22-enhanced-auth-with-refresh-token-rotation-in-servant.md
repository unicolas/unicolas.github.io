---
title: "Enhanced auth with refresh token rotation in Servant"
date: '2024-06-22'
tags:
  - haskell
  - servant
  - jwt
published: true
description: 'A follow-up of the how-to guide using generalised auth in Servant with refresh token rotation in a custom JWT authentication scheme.'
---

<script>
	import authHandler from '$lib/assets/auth-handler.svg?raw';
	import acceptAccess from '$lib/assets/accept-access-token.svg?raw';
	import acceptRefresh from '$lib/assets/accept-refresh-token.svg?raw';
  import { Graphic } from '$lib/components';
</script>

In [a previous post](2023-10-28-generalised-auth-with-jwt-in-servant) we implemented a JWT authentication scheme using generalised authentication in Servant providing a short-lived access token on login for the protected endpoints and a long-lived refresh token to get new access tokens once they expire, as a better alternative to a single long-lived access token.
Yet we can take security a bit further if we minimise the chances of compromising this long-lived token to unauthorised usage, and one way to do so is through token rotation and revocation. That is, once a new access token is requested, a new refresh token is also returned and the previous one is revoked so it is no longer valid.

Now we have this new piece of information: a token may be revoked and, consequently, be invalid. Then we need to perform a check against this condition before resolving the authentication. Recall this process is performed by the authentication handler function and can be represented in the following activity with the addition of this check we're calling &ldquo;accept&rdquo;:

<Graphic>{@html authHandler}</Graphic>

There may be several approaches to this, but at the end all we want is to be able to inject any post-verification action into the authentication handler in the most general way.

In short, this action must take a token (a `ByteString`) and return a result (a `Bool`) to indicate whether the provided token is accepted or not. 
Note that the action will need to run in a monad of some sort in order to, for example, query a database to check if a token is revoked and since we don't want to restrict the action to any specific monad we leave it as generic as `ByteString -> m Bool` and require a natural transformation from this monad `m` to `Handler` (just as we do when using a custom monad for our server).

We can then define the handler as follows:

```hs
authHandler :: (HasClaimsSet a, FromJSON a)
  => JWK
  -> JWTValidationSettings
  -> (ByteString -> m Bool)
  -> (forall b. m b -> Handler b)
  -> AuthHandler Request (Maybe a)
authHandler jwk settings accept nt = mkAuthHandler $ \\case
  (getToken -> Just token) -> liftA2 (<*)
    (verifyToken jwk settings token)
    (runAccept accept nt token)
  _ -> pure Nothing
```
> We do not expose the token out of the authentication handler function, so every action that needs it has to be performed within `accept`. Alternatively, a pair `(a, ByteString)` could be used instead of simply `a` as the result type to make the token available to the protected endpoints.

Once we got the token from the request header we sequence two `Maybe` actions lifted to the `Handler` monad and keep the result of the first, the one that wraps the claims set.

The first action, `verifyToken` yet runs the `JOSE` verification, we've only pushed the lifting from `IO` to `Handler` from `authHandler` into this function so it returns `Handler (Maybe a)`:
- `Handler (Just a)` on success
- `Handler Nothing` on failure

```hs
verifyToken :: (HasClaimsSet a, FromJSON a)
  => JWK
  -> JWTValidationSettings
  -> ByteString
  -> Handler (Maybe a)
verifyToken jwk settings token = liftIO (maybeRight <$> runJOSE @JWTError verify)
  where
    verify = decode token >>= verifyJWT settings jwk
    decode = ByteString.toString >>> LazyByteString.fromString >>> decodeCompact
```

The second action, `runAccept` runs the given accept action and returns `Handler (Maybe ())`. It is simply a `Maybe` guard on the result of accept, we get:
- `Handler (Just ())` on acceptance 
- `Handler Nothing` on rejection

```hs
runAccept :: (ByteString -> m Bool)
  -> (forall a. m a -> Handler a)
  -> ByteString
  -> Handler (Maybe ())
runAccept accept nt = fmap guard . nt . accept
```

This way, we get to fail the whole authentication whatever action fails and to succeed with the claims set when all of them succeed.

> We may change the result type for the authentication if we need to track what kind of error made it fail to like, say, `Either AuthError a` so in case of failure we can produce a `Left` value with the corresponding error:
>
> ```hs
> data AuthError
>   = NoAuthorizationHeaderError -- The authorization header is not present
>   | UnsupportedSchemeError     -- Not a bearer token
>   | RejectedTokenError         -- The accept function rejected the token
>   | JwtError JWTError          -- An error produced by the JOSE computation
> ```

That's all we need for `authHandler` to perform additional actions on the token. Let's write some tests with [Hspec](https://hspec.github.io) to exhibit how the result of this check should affect the outcome, just before we get into the accept functions of our interest.

```hs
spec :: Spec
spec = do
  before generateKeyAndToken $ do
    describe "Given a valid JWT" $ do
      it "Authorises the request if the token is accepted" $ \\(jwk, jwt) -> do
        let
          pass _ = pure True
          authHeader = ("Authorization" , "Bearer " <> jwt)
          request = defaultRequest {requestHeaders = [authHeader]}
          settings = defaultJWTValidationSettings (== "test")
          handler = unAuthHandler (authHandler @ClaimsSet jwk settings pass id)

        (Right result) <- runHandler (handler request)

        result `shouldSatisfy` isJust

      it "Rejects the request if the token is not accepted" $ \\(jwk, jwt) -> do
        let
          block _ = pure False
          authHeader = ("Authorization" , "Bearer " <> jwt)
          request = defaultRequest {requestHeaders = [authHeader]}
          settings = defaultJWTValidationSettings (== "test")
          handler = unAuthHandler (authHandler @ClaimsSet jwk settings block id)

        (Right result) <- runHandler (handler request)

        result `shouldSatisfy` isNothing
```
Here, `generateKeyAndToken` provides a JWK and a JWT with `"test"` as audience, hence the check in `settings`. In both of these tests we're using a valid JWT in the request's authorization header, the only difference between the two setups is that we provide to the authentication handler `pass` for the first (it always accepts the token) and `block` for the second (it always rejects it), unsurprisingly we expect the authentication to succeed with the former and fail with the latter.
As `pass` and `block` are not tied to any monad, we conveniently pick `Handler` so we can use `id` as natural transformation.

\* \* \*

Next, we have to see what accept functions we need to pass for both of the two handlers we set in the server's context.

Accepting access tokens is straightforward: since we are not revoking them, they must be accepted every time.

<Graphic>{@html acceptAccess}</Graphic>

So for those tokens we just `pass`:

```hs
pass :: Applicative f => ByteString -> f Bool
pass _ = pure True
```

With refresh tokens it gets a little more interesting: we first need to check if this token was revoked and also revoke it in case it wasn't, note that the refresh token has already been used once we got here so it is safe to state at this point it should not be reused. For this purpose we have to keep a blacklist of tokens.

<Graphic>{@html acceptRefresh}</Graphic>

This time we get to `revoke`:

```hs
revoke :: Blacklist m => ByteString -> m Bool
revoke token = do
  blacklisted <- isBlacklisted token
  unless blacklisted (addToBlacklist token)
  pure (not blacklisted)
```

Instead of directly define revoke in terms of the application monad, and because we can, we're going to abstract over the blacklist operations in terms of a type class.

```hs
class Monad m => Blacklist m where
  isBlacklisted :: ByteString -> m Bool
  addToBlacklist :: ByteString -> m ()
```
At the end, it just means we need to define an instance for the application monad we're using and let it resolve however the blacklist is stored. As an example, lets consider we're defining our monad with a combination of reader and [STM](https://hackage.haskell.org/package/stm) to handle state:

```hs
newtype App a = App (ReaderT AppState IO a)
newtype AppState = AppState {blacklist :: TVar [ByteString]}
```
Then is the `Blacklist` instance for our app the one that takes care of accessing the reader's environment and get or update the blacklist state through the `TVar`.

```hs
instance Blacklist App where
  isBlacklisted :: ByteString -> App Bool
  isBlacklisted token = do
    tokens <- asks blacklist
    elem token <$> readTVarIO tokens
      & liftIO

  addToBlacklist :: ByteString -> App ()
  addToBlacklist token = do
    tokens <- asks blacklist
    atomically (modifyTVar tokens (token:))
      & liftIO
```

> Once a token is expired (i.e. its `exp` is past) there's no need to keep it blacklisted because the verification will fail before we even get to check if it is revoked. So a good storage choice here may be a database like Redis that allows us to set a timeout for the keys we're storing.

Clearly we have to update the handler functions we provided to the context with the correct accept functions and the natural transformation of our monad:

```hs
ctx = authHandler @AccessClaims jwk accessSettings pass nt
  :. authHandler @RefreshClaims jwk refreshSettings revoke nt
  :. EmptyContext
```

\* \* \*

Last but not least, we need to actually rotate the refresh tokens in our refresh handler (the one handling the endpoint `POST /refresh`) otherwise the client will be forced to log in again for not being able to get new access tokens. This just translates into signing a new one instead of giving back the same as we've been doing.

```hs
refreshTokenHandler :: (MonadThrow m, MonadIO m)
  => JWK
  -> Maybe RefreshClaims
  -> m LoginResponse
refreshTokenHandler jwk (Just (subjectClaim -> Just uid)) = liftIO $ do
  makeLoginResponse =<< signNewTokens jwk uid
refreshTokenHandler _ _ = throwM err401

signNewTokens :: MonadIO m => JWK -> UUID -> m [Maybe SignedJWT]
signNewTokens jwk userId = liftIO $ do
  now <- getCurrentTime
  sequence
    [ signToken jwk (accessClaims userId now)
    , signToken jwk (refreshClaims userId now)
    ]
```

### Summing up

Every time a new access token is requested to the refresh endpoint, the authentication handler for the refresh claims will be run, its claims will be verified by the [jose](https://hackage.haskell.org/package/jose) library and if passed, the token will be looked up in a blacklist and, when not found, added to this blacklist by the `revoke` function, finally giving back the result of the authentication.
Then, this result is provided to `refreshTokenHandler`: when it is a success, two new tokens are signed for the same requester user ID: the access token actually requested and, as a product of the rotation, the refresh token that needs to be used next time to request a new access token; contrarily, an unauthorized response will be returned in case it was a failure. 

The code shown in this post with the omitted bits altogether can be found in [this repository](https://github.com/unicolas/example-generalised-auth/tree/v2), tagged with `v2`.
