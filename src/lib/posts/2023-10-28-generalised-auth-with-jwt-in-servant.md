---
title: Generalised auth with JWT in Servant
date: '2023-10-28'
tags:
  - haskell
  - servant
  - jwt
published: true
---

[Servant auth server](https://hackage.haskell.org/package/servant-auth-server) provides JWT authentication already but there's no much room for customisation, for example we cannot control expiration times independently of the cookie.
In order to address some of its limitations we'll be building a JWT authentication scheme on top of Servant's generalised authentication.

Our goal is to gain more control over the JWT claim set to customise expire times and to be able to provide two tokens:
- an *authentication token* with a shorter expiration time used to authenticate against the protected endpoints.
- a *refresh token* with a longer expiration time used to obtain new authentication tokens.

And our flow is as follows: we first want our users to log in using their credentials, we then provide them with the two tokens on success so they don't need to re-enter their username and password for every request. Thereafter they have to send a non-expired authentication token on each request to a protected endpoint and they should get a new one using a refresh endpoint where a non-expired refresh token must be sent. Once the refresh token is expired, they are forced to log in using their credentials.

This scheme is an improvement toward securing our tokens, since the most sent token won't be valid for too long and it can be customised further to add additional security measures.

A login request is going to look like this:

```http
POST /login HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Accept: */*
Content-Length: 51

{
  "username": "user123",
  "password": "123Abc"
}
```
```json
{
  "access": "aa.bb.ccc",
  "refresh": "xx.yyy.zzz"
}
```
And a refresh request like this:

```http
POST /refresh HTTP/1.1
Host: localhost:8000
Authorization: Bearer xx.yyy.zzz
Accept: */*
Content-Length: 0
```
```json
{
  "access": "dd.ee.fff",
  "refresh": "xx.yyy.zzz"
}
```
`POST` is used here as it's common for controller resources. `GET` won't fit at all if this would mean a state change, like storing access tokens for invalidation purposes, since it won't be idempotent.

### JWT

For each token type we want to set the following [registered claims](https://www.iana.org/assignments/jwt/jwt.xhtml#claims):

**Access token**

| Claim | Value                                          |
| ----- | ---------------------------------------------- |
| `sub` | User ID                                        |
| `iat` | The current time                               |
| `exp` | 15 minutes                                     |
| `aud` | `"access"` to identify this as an access token |

**Refresh token**

| Claim | Value                                           |
| ----- | ----------------------------------------------- |
| `sub` | User ID                                         |
| `iat` | The current time                                |
| `exp` | 1 day                                           |
| `aud` | `"refresh"` to identify this as a refresh token |

We'll be using [jose](https://hackage.haskell.org/package/jose) for producing and verifying the JWT. So let's define two newtype wrappers for `ClaimsSet`, one for each token type and their required typeclass intances: `FromJSON`, `ToJSON` and `HasClaimSet`.
Let's also add their smart constructors and validation settings with the correct audience check on top of the default settings.

First, the access token claim set `AccessClaims`:

```hs
newtype AccessClaims = AccessClaims ClaimsSet
  deriving stock (Eq, Show, Generic)
  deriving anyclass (FromJSON, ToJSON)

instance HasClaimsSet AccessClaims where
  claimsSet :: Lens' AccessClaims ClaimsSet
  claimsSet f (AccessClaims claims) = AccessClaims <$> f claims

accessClaims :: UUID -> UTCTime -> AccessClaims
accessClaims userId issuedAt = emptyClaimsSet
  & claimSub ?~ fromString (Uuid.toString userId)
  & claimIat ?~ NumericDate issuedAt
  & claimExp ?~ NumericDate (addUTCTime 900 issuedAt)
  & claimAud ?~ Audience ["access"]
  & AccessClaims

accessSettings :: JWTValidationSettings
accessSettings = defaultJWTValidationSettings (== "access")
```
We'll parameterise the user identifier and the issued-at time to the constructor and set the rest of the claims as we wanted for this token type (expire in 15 minutes since issued and "access" as audience).
And then the refresh token claim set counterpart `RefreshClaims`: 
```hs
newtype RefreshClaims = RefreshClaims ClaimsSet
  deriving stock (Eq, Show, Generic)
  deriving anyclass (FromJSON, ToJSON)

instance HasClaimsSet RefreshClaims where
  claimsSet :: Lens' RefreshClaims ClaimsSet
  claimsSet f (RefreshClaims claims) = RefreshClaims <$> f claims

refreshClaims :: UUID -> UTCTime -> RefreshClaims
refreshClaims userId issuedAt = emptyClaimsSet
  & claimSub ?~ fromString (Uuid.toString userId)
  & claimIat ?~ NumericDate issuedAt
  & claimExp ?~ NumericDate (addUTCTime 86400 issuedAt)
  & claimAud ?~ Audience ["refresh"]
  & RefreshClaims

refreshSettings :: JWTValidationSettings
refreshSettings = defaultJWTValidationSettings (== "refresh")
```
The important bits here are the expiration time set to 1 day and it's "refresh" audience, also changed for the validation settings. 
With this distinction in audience, we are able to require a concrete token type and to reject the use of one type in place of another, i.e. refresh tokens won't be valid access tokens and viceversa.

### Generalised auth

Generalised authentication in Servant basically let us run a function whenever a protected endpoint is requested. It requires us to:
  1. add a tagged `AuthProtect` combinator to the protected endpoint(s).
  2. provide a function `Request -> Handler a` that handles the authentication and returns the desired data on success, wrapped in the `AuthHandler` type.
  3. provide a type family instance (`AuthServerData`) for the combinator.
  4. provide the handler function to the `Context`.

The **AuthProtect** combinator is defined as follows:

```hs
data AuthProtect (tag :: k)
```

We got a phantom type that is uninhabited. Its kind is `k -> Type` so that means it expects some type to be applied to it in order to get a concrete type, and so its type constructor has a type parameter `tag`.
For our particular case, we're going to define two type synonyms for the combinator and tag each one with a type-level string literal[^1].

```hs
type AuthJwtAccess = AuthProtect "jwt-access"
type AuthJwtRefresh = AuthProtect "jwt-refresh"
```
Now we can use them to protect the endpoint `POST /refresh` with `AuthJwtRefresh` and some sub-API with `AuthJwtAccess`. The login endpoint won't be protected, naturally.
```hs
data Api mode = Api
  { login :: mode
      -- POST /login
      :- "login"
      :> ReqBody Json LoginRequest
      :> Post Json LoginResponse
  , refresh :: mode
      -- POST /refresh
      :- "refresh"
      :> AuthJwtRefresh
      :> Post Json LoginResponse
  , secured :: mode
      :- AuthJwtAccess
      :> NamedRoutes SecuredRoutes
  }
  deriving Generic

newtype SecuredRoutes mode = SecuredRoutes
  { getUser :: mode
      -- GET /users/{userId}
      :- "users"
      :> Capture "userId" UUID
      :> Http.Get Json User
  }
  deriving Generic
```

**AuthHandler** is the wrapper type for the authentication handler function that Servant exhibits in addition to the `mkAuthHandler` constructor function:

```hs
newtype AuthHandler r usr = AuthHandler
  { unAuthHandler :: r -> Handler usr }

mkAuthHandler :: (r -> Handler usr) -> AuthHandler r usr
mkAuthHandler = AuthHandler
```

First we need to decide what our result type will be on success. Since we're going to need to recover some data from the claim sets later (precisely the subject), that's what we're returning, and also this choice help us abstract our handler out for both claim sets by means of typeclasses:

```hs
authHandler :: (HasClaimsSet a, FromJSON a)
  => JWK -> JWTValidationSettings -> AuthHandler Request (Maybe a)
authHandler jwk settings = mkAuthHandler $ \\case
  (getToken -> Just token) -> liftIO (verifyToken jwk settings token)
  _ -> pure Nothing
```
For our handler function we simply try to get the token, here with [view patterns](https://ghc.gitlab.haskell.org/ghc/doc/users_guide/exts/view_patterns.html) to match on the request, and then verify it using the actual JWK and validation settings for this token. As we don't want to bottom here we just use `Maybe` to indicate the possibility of failure.

`getToken` tries to read the request's authorization header and get the token out of it. Recall the header has the form `Authorization: Bearer xx.yyy.zzz`.
```hs
getToken :: Request -> Maybe ByteString
getToken req = do
  (scheme, token) <- split <$> lookup "Authorization" (requestHeaders req)
  guard (scheme == "Bearer")
  pure token
  where
    split = ByteString.break (== ' ') >>> second (ByteString.drop 1)
```

`verifyToken` runs the `JOSE` computation `verifyJWT` that takes a decoded token after some strict to lazy bytestring conversion along with the validation settings and the JWK. This is were we actually validate the token.

```hs
verifyToken :: (HasClaimsSet a, FromJSON a)
  => JWK -> JWTValidationSettings -> ByteString -> IO (Maybe a)
verifyToken jwk settings token = maybeRight <$> runJOSE @JWTError verify
  where
    verify = decodeCompact lazy >>= verifyJWT settings jwk
    lazy = LazyByteString.fromString (ByteString.toString token)
```

**AuthServerData** is an open type family for a `HasServer` instance that binds the `AuthHandler` from the context to the `AuthProtect` combinator.

```hs
type family AuthServerData a :: Type
```

The type family instance we need to provide tells what type the context will supply. For our case, this means one instance for each token type:

```hs
type instance AuthServerData AuthJwtAccess = Maybe AccessClaims
type instance AuthServerData AuthJwtRefresh = Maybe RefreshClaims
```

**Context** is used to pass values to combinators so we compose our context with two `authHandler`s with a visible type application to let the compiler know what type our handler is going to return and taking the JWK and the validation settings related to each type.

```hs
ctx = authHandler @AccessClaims jwk accessSettings
  :. authHandler @RefreshClaims jwk refreshSettings
  :. EmptyContext
```
And we finally serve our application with this context:

```hs
genericServeTWithContext appToHandler (api jwk) ctx
```

We're all set for generalised auth, so we can now proceed to define our `api` handler.

### API handler

```hs
api :: JWK -> Api (AsServerT App)
api jwk = Api
  { login = loginHandler jwk
  , refresh = refreshTokenHandler jwk
  , secured = securedHandlers
  }
```

On login, we check the credentials provided in the login request to be valid for a registered user (a dummy check for the sake of simplicity) and then construct the login response with the access and refresh claims for this user.

```hs
loginHandler :: (MonadThrow m, MonadIO m) 
  => JWK -> LoginRequest -> m LoginResponse
loginHandler jwk LoginRequest {..} = do
  unless (username == "user" && password == "12345") (throwM err401)
  do
    now <- liftIO getCurrentTime
    loginResponse jwk (accessClaims nil now) (refreshClaims nil now)
```
The login response is constructed by signing both claim sets with the JWK:

```hs
loginResponse :: (ToJSON a, ToJSON b, MonadThrow m, MonadIO m) 
  => JWK -> a -> b -> m LoginResponse
loginResponse jwk acc refr = do
  signedAccess <- liftIO (signToken jwk acc)
  signedRefresh <- liftIO (signToken jwk refr)
  case (signedAccess, signedRefresh) of
    (Just (toText -> access), Just (toText -> refresh)) -> pure LoginResponse {..}
    _ -> throwM err401
  where
    toText = pack . toString . encodeCompact
```

For the `refreshTokenHandler` we expect the refresh claims to be provided by the `authHandler` or fail otherwise (remember we're getting `Just claims` on success and `Nothing` on failure form this authentication handler function).
We will be constructing a login response with a new access token for the same user we got from the refresh token and for the current time for it to be fresh, in addition to the same refresh token we got since we want it to last for its expiration time. A more comprehensive flow may create a new refresh token each time and invalidate previously used tokens.

```hs
refreshTokenHandler :: (MonadThrow m, MonadIO m)
  => JWK -> Maybe RefreshClaims -> m LoginResponse
refreshTokenHandler jwk (Just claims@(subjectClaim -> Just uid)) = do
  now <- liftIO getCurrentTime
  loginResponse jwk (accessClaims uid now) claims
refreshTokenHandler _ _ = throwM err401
```
`subjectClaim` is a convenience function to get the subject claim back.

Finally, for the secured endpoints we just check the result of the `authHandler` and fail if no access claim was provided.

```hs
securedHandlers :: Maybe AccessClaims -> SecuredRoutes (AsServerT App)
securedHandlers (Just _) = SecuredRoutes { getUser = getUserHandler }
securedHandlers _ = throw err401
```

### Final notes

Bear in mind that Servant's generalised authentication API is considered experimental nowadays. It's simple yet powerful, it gave us the means to work out our particular atuhentication scheme without any hassle.
There's one thing we will be missing from Servant auth server and that is its `ThrowAll` typeclass that helps in reducing the boilerplate needed to throw authentication errors for a whole sub-API.
You can find the full implementation [here](https://github.com/unicolas/example-generalised-auth).

[^1]: If `tag` was to be of kind `Type` we won't be able to use type-level strings since these are of kind `Symbol`.
