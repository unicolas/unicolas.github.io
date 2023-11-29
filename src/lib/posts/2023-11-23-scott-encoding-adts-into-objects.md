---
title: Scott-encoding ADTs into objects
date: '2023-11-23'
tags:
  - smalltalk
  - case analysis
  - lambda calculus
published: true
updated: '2023-11-29'
---

[Scott encodings](https://en.wikipedia.org/wiki/Mogensen–Scott_encoding) of algebraic data types can be taken as a medium to represent these types in an untyped object-oriented setting that supports lambdas and closures for an alternative to pattern-matching. With this approach we construct λ-terms from the constructors and eliminators of an ADT, to later translate them into a single-class protocol or, for a result more akin to OOP, split by constructor into a hierarchy where the implementation can be derived by observing the reductions of the λ-terms for each value. The latter will lead to the subtyping approach of case analysis observed in [a previous post](2023-10-13-oop-classes-as-data-constructors).

Here, Scott encodings in the λ-calculus for common ADTs and their translations into objects in Smalltalk[^1] will be presented. As long as there's no recursion involved in the definition of the data types, these encodings will not be different to the Church ones.

### Enumerations

**Boolean**

This simple enumeration type has two data constructors, `True` and `False`, a typical pattern-matching function on this type is `if` and this is how we encode them as λ-terms:

```
TRUE  = λt f. t
FALSE = λt f. f

IF = λb. b (λt f. t) (λt f. f)
   = λb. b TRUE FALSE
```
Each constructor is a term that selects one of the two alternatives and the pattern-matching function just applies the boolean we are evaluating to one expression for each alternative.
If we apply `IF` to `TRUE`, it will reduce[^2] to `TRUE`:
```
(λb. b (λt f. t) (λt f. f)) (λt f. t)
  →β (λt f. t) (λt f. t) (λt f. f)
  →α (λt' f'. t') (λt f. t) (λt f. f)
  →β (λf' t f. t) (λt f. f)
  →β λt f. t
```
And if we apply it to `FALSE`, it will reduce to `FALSE`:
```
(λb. b (λt f. t) (λt f. f)) (λt f. f)
  →β (λt f. f) (λt f. t) (λt f. f)
  →β (λf. f) (λt f. f)
  →β λt f. f
```
That means we're getting back what we put, so alternatively we could've had:
```
ID = λx. x
IF = ID
```
To bring this encodings to a class, we add an instance variable that will store the data constructor for each instance, either `TRUE` or `FALSE`. Its protocol includes two instance creation methods, `makeTrue` and `makeFalse`, to set the right constructor and the pattern-matching counterpart of the `IF` term, `caseTrue:caseFalse:`.

```smalltalk
Class {
  #name : #ScottBoolean,
  #superclass : #Object,
  #instVars : ['data']
}

ScottBoolean class >> makeTrue [

  ^self basicNew initialize: [:t :_ | t]
]

ScottBoolean class >> makeFalse [

  ^self basicNew initialize: [:_ :f | f]
]

ScottBoolean >> initialize: value [

  data := value.
  ^self
]

ScottBoolean >> caseTrue: t caseFalse: f [

  ^(data value: t value: f) value
]
```

### Containers

Container types are expressed in λ-calculus by means of closures and continuations.

**Pair**

This product type has only one constructor `Pair` and two eliminators: the projection functions `fst` and `snd` that we get to encode as follows:

```
PAIR = λa b p. p a b

FST = λp. p (λa b. a)
SND = λp. p (λa b. b)
```
If we partially apply `A` and `B` to the constructor `PAIR` we get a closure `λp. p A B` that expects a continuation (in this case a 2-argument function), and that's what we provided for `FST` and `SND`.

Reducing `FST (PAIR 0 1)` we see we get the first element of the pair:
```
(λp. p (λa b. a)) ((λa b p. p a b) 0 1)
  →β (λp. p (λa b. a)) ((λb p. p 0 b) 1)
  →β (λp. p (λa b. a)) (λp. p 0 1)
  →β (λp. p 0 1) (λa b. a)
  →β (λa b. a) 0 1
  →β (λb. 0) 1
  →β 0
```
And reducing `SND (PAIR 0 1)`, we get the second:
```
(λp. p (λa b. b)) ((λa b p. p a b) 0 1)
  →β (λp. p (λa b. b)) ((λb p. p 0 b) 1)
  →β (λp. p (λa b. b)) (λp. p 0 1)
  →β (λp. p 0 1) (λa b. b)
  →β (λa b. b) 0 1
  →β (λb. b) 1
  →β 1
```

The `Pair` class is straightforward, the instance creation is done by `makePair:with:` that stores the closure and each projection provides the continuation.

```smalltalk
Class {
  #name : #ScottPair,
  #superclass : #Object,
  #instVars : ['data']
}

ScottPair class >> makePair: fst with: snd [

  ^self basicNew initialize: [:p | p value: fst value: snd]
]

ScottPair >> fst [

  ^data value: [:fst :_ | fst]
]

ScottPair >> snd [
  
  ^data value: [:_ :snd | snd]
]
```

**Maybe**

This data type let us flag optionality and has two constructors: `Nothing` and `Just` that contains a value[^3]. The pattern-matching function is `maybe`. These are the terms we get:

```
NOTHING = λn j. n
JUST    = λx n j. j x

MAYBE = λm. m (λn j. n) (λx n j. j x)
      = λm. m NOTHING JUST
```
`MAYBE NOTHING` reduces like `BOOL TRUE`, although we could've swapped `n` and `j` so `NOTHING` would representationally equal `FALSE`.
If we reduce for instance `MAYBE (JUST 0)` we get the partial application `JUST 0`: a closure expecting a 1-argument continuation function that will be applied to `0`.

```
(λm. m (λn j. n) (λx n j. j x)) ((λx n j. j x) 0)
  →β ((λx n j. j x) 0) (λn j. n) (λx n j. j x)
  →β (λn j. j 0) (λn j. n) (λx n j. j x)
  →β (λj. j 0) (λx n j. j x)
  →β (λx n j. j x) 0
  →β λn j. j 0
```
Once more, we find `MAYBE = ID`.

The protocol is set to the instance creation methods `makeNothing` and `makeJust:`, plus `caseNothing:caseJust:` for the pattern-matching `MAYBE`.

```smalltalk
Class {
  #name : #ScottMaybe,
  #superclass : #Object,
  #instVars : ['data']
}

ScottMaybe class >> makeNothing [

  ^self basicNew initialize: [:n :_ | n]
]

ScottMaybe class >> makeJust: a [

  ^self basicNew initialize: [:_ :j | j value: a]
]

ScottMaybe >> caseNothing: n caseJust: j [

  ^(data value: n value: j) value
]
```

### Recursive

**List**

`List` has two constructors, the nullary `Nil` for an empty list and the binary `Cons` for a list built from a head element and a tail that is itself a list, hence the recursive definition.
Two eliminators are the functions `head` and `tail`, both undefined for empty lists.

```
NIL  = λn c. n
CONS = λh t n c. c h t

HEAD = λl. l ⊥ (λh t. h)
TAIL = λl. l ⊥ (λh t. t)
```

`CONS` is partially applied so it expects a continuation, that's what we provide for the terms `HEAD` and `TAIL`.

This is how `HEAD NIL` reduces:
```
(λl. l ⊥ (λh t. h)) (λn c. n)
  →β (λn c. n) ⊥ (λh t. h)
  →β (λc. ⊥) (λh t. h)
  →β ⊥
```

and how `HEAD (CONS 0 NIL)`:
```
(λl. l ⊥ (λh t. h)) ((λh t n c. c h t) 0 NIL)
  →β (λl. l ⊥ (λh t. h)) ((λt n c. c 0 t) NIL)
  →β (λl. l ⊥ (λh t. h)) (λn c. c 0 NIL)
  →β (λn c. c 0 NIL) ⊥ (λh t. h)
  →β (λc. c 0 NIL) (λh t. h)
  →β (λh t. h) 0 NIL
  →β (λt. 0) NIL
  →β 0
```

We'll implement `head` and `tail` in terms of a pattern-matching method `caseNil:caseCons:` we're adding to the protocol.

```smalltalk
Class {
  #name : #ScottList,
  #superclass : #Object,
  #instVars : ['data']
}

ScottList class >> makeNil [

  ^self basicNew initialize: [:n :_ | n]
]

ScottList class >> makeCons: h with: t [

  ^self basicNew initialize: [:_ :c | c value: h value: t]
]

ScottList >> caseNil: n caseCons: c [

  ^(data value: n value: c) value
]

ScottList >> head [

  ^self
    caseNil: [self error: 'head called on Nil']
    caseCons: [:h :_ | h]
]

ScottList >> tail [

  ^self
    caseNil: [self error: 'tail called on Nil']
    caseCons: [:_ :t | t]
]
```
Furthermore, we also want to include the fold operation in the list protocol. A fold takes a 2-argument function `f` that will be applied to each element of the list in order to reduce it into some accumulator, an initial value `a` and a list `l`.
This can be achieved in two directions, from left to right or from right to left, thus we define a left fold (`FOLDL`) or a right fold (`FOLDR`) respectively. On both, we apply `l` to the initial value (`NIL` case) and a continuation (`CONS` case).

Let's start with the right fold:

```
FOLDR = λf a l. l a (λh t. f h (FOLDR f a t))
```

The continuation will apply `f` to the head element and the right fold of the tail.
We can apply `FOLDR` to an arbitrary binary function `ADD`, a list with 2 numbers (1 and 2) and an initial value 0 and see how it reduces:

```
(λf a l. l a (λh t. f h (FOLDR f a t))) ADD 0 (CONS 1 (CONS 2 NIL))
  →β (λa l. l a (λh t. ADD h (FOLDR ADD a t))) 0 (CONS 1 (CONS 2 NIL))
  →β (λl. l 0 (λh t. ADD h (FOLDR ADD 0 t))) (CONS 1 (CONS 2 NIL))
  →β (CONS 1 (CONS 2 NIL)) 0 (λh t. ADD h (FOLDR ADD 0 t))
  →δ ((λh t n c. c h t) 1 (CONS 2 NIL)) 0 (λh t. ADD h (FOLDR ADD 0 t))
  →β ((λt n c. c 1 t) (CONS 2 NIL)) 0 (λh t. ADD h (FOLDR ADD 0 t))
  →β (λn c. c 1 (CONS 2 NIL)) 0 (λh t. ADD h (FOLDR ADD 0 t))
  →β (λc. c 1 (CONS 2 NIL)) (λh t. ADD h (FOLDR ADD 0 t))
  →β (λh t. ADD h (FOLDR ADD 0 t)) 1 (CONS 2 NIL)
  →β (λt. ADD 1 (FOLDR ADD 0 t)) (CONS 2 NIL)
  →β ADD 1 (FOLDR ADD 0 (CONS 2 NIL))
  →δ ADD 1 ((λf a l. l a (λh t. f h (FOLDR f a t))) ADD 0 (CONS 2 NIL))
  →β ADD 1 ((λa l. l a (λh t. ADD h (FOLDR ADD a t))) 0 (CONS 2 NIL))
  →β ADD 1 ((λl. l 0 (λh t. ADD h (FOLDR ADD 0 t))) (CONS 2 NIL))
  →β ADD 1 ((CONS 2 NIL) 0 (λh t. ADD h (FOLDR ADD 0 t)))
  →δ ADD 1 (((λh t n c. c h t) 2 NIL) 0 (λh t. ADD h (FOLDR ADD 0 t)))
  →β ADD 1 (((λt n c. c 2 t) NIL) 0 (λh t. ADD h (FOLDR ADD 0 t)))
  →β ADD 1 ((λn c. c 2 NIL) 0 (λh t. ADD h (FOLDR ADD 0 t)))
  →β ADD 1 ((λc. c 2 NIL) (λh t. ADD h (FOLDR ADD 0 t)))
  →β ADD 1 ((λh t. ADD h (FOLDR ADD 0 t)) 2 NIL)
  →β ADD 1 ((λt. ADD 2 (FOLDR ADD 0 t)) NIL)
  →β ADD 1 (ADD 2 (FOLDR ADD 0 NIL))
  →δ ADD 1 (ADD 2 ((λf a l. l a (λh t. f h (FOLDR f a t))) ADD 0 NIL))
  →β ADD 1 (ADD 2 ((λa l. l a (λh t. ADD h (FOLDR ADD a t))) 0 NIL))
  →β ADD 1 (ADD 2 ((λl. l 0 (λh t. ADD h (FOLDR ADD 0 t))) NIL))
  →β ADD 1 (ADD 2 (NIL 0 (λh t. ADD h (FOLDR ADD 0 t))))
  →δ ADD 1 (ADD 2 ((λn c. n) 0 (λh t. ADD h (FOLDR ADD 0 t))))
  →β ADD 1 (ADD 2 ((λc. 0) (λh t. ADD h (FOLDR ADD 0 t))))
  →β ADD 1 (ADD 2 0)
```
Since we have direct support for recursion, we have no need to eliminate it for implementing `FOLDR`.

```smalltalk
ScottList >> foldr: f into: a [

  ^self 
    caseNil: [a]
    caseCons: [:h :t | f value: h value: (t foldr: f into: a)]
]
```
Next is the left fold:
```
FOLDL = λf a l. l a (λh t. FOLDL f (f a h) t)
```
The continuation for `FOLDL` will apply the left fold to the tail and the application of `f` on the head of the list. This is its reduction when applied to the same arguments as `FOLDR`.

```
(λf a l. l a (λh t. FOLDL f (f a h) t)) ADD 0 (CONS 1 (CONS 2 NIL))
  →β (λa l. l a (λh t. FOLDL ADD (ADD a h) t)) 0 (CONS 1 (CONS 2 NIL))
  →β (λl. l 0 (λh t. FOLDL ADD (ADD 0 h) t)) (CONS 1 (CONS 2 NIL)) 
  →β (CONS 1 (CONS 2 NIL)) 0 (λh t. FOLDL ADD (ADD 0 h) t)
  →δ ((λh t n c. c h t) 1 (CONS 2 NIL)) 0 (λh t. FOLDL ADD (ADD 0 h) t)
  →β ((λt n c. c 1 t) (CONS 2 NIL)) 0 (λh t. FOLDL ADD (ADD 0 h) t)
  →β (λn c. c 1 (CONS 2 NIL)) 0 (λh t. FOLDL ADD (ADD 0 h) t)
  →β (λc. c 1 (CONS 2 NIL)) (λh t. FOLDL ADD (ADD 0 h) t)
  →β (λh t. FOLDL ADD (ADD 0 h) t) 1 (CONS 2 NIL)
  →β (λt. FOLDL ADD (ADD 0 1) t) (CONS 2 NIL)
  →β FOLDL ADD (ADD 0 1) (CONS 2 NIL)
  →δ (λf a l. l a (λh t. FOLDL f (f a h) t)) ADD (ADD 0 1) (CONS 2 NIL)
  →β (λa l. l a (λh t. FOLDL ADD (ADD a h) t)) (ADD 0 1) (CONS 2 NIL)
  →β (λl. l (ADD 0 1) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)) (CONS 2 NIL)
  →β (CONS 2 NIL) (ADD 0 1) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)
  →δ ((λh t n c. c h t) 2 NIL) (ADD 0 1) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)
  →β ((λt n c. c 2 t) NIL) (ADD 0 1) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)
  →β (λn c. c 2 NIL) (ADD 0 1) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)
  →β (λc. c 2 NIL) (λh t. FOLDL ADD (ADD (ADD 0 1) h) t)
  →β (λh t. FOLDL ADD (ADD (ADD 0 1) h) t) 2 NIL
  →β (λt. FOLDL ADD (ADD (ADD 0 1) 2) t) NIL
  →β FOLDL ADD (ADD (ADD 0 1) 2) NIL
  →δ (λf a l. l a (λh t. FOLDL f (f a h) t)) ADD (ADD (ADD 0 1) 2) NIL
  →β (λa l. l a (λh t. FOLDL ADD (ADD a h) t)) (ADD (ADD 0 1) 2) NIL
  →β (λl. l (ADD (ADD 0 1) 2) (λh t. FOLDL ADD (ADD (ADD (ADD 0 1) 2) h) t)) NIL
  →β NIL (ADD (ADD 0 1) 2) (λh t. FOLDL ADD (ADD (ADD (ADD 0 1) 2) h) t)
  →δ (λn c. n) (ADD (ADD 0 1) 2) (λh t. FOLDL ADD (ADD (ADD (ADD 0 1) 2) h) t)
  →β (λc. ADD (ADD 0 1) 2) (λh t. FOLDL ADD (ADD (ADD (ADD 0 1) 2) h) t)
  →β ADD (ADD 0 1) 2
```
Again, we can implement this fold with recursion:

```smalltalk
ScottList >> foldl: f into: a [

  ^self 
    caseNil: [a]
    caseCons: [:h :t | t foldl: f into: (f value: a value: h)]
]
```

Nevertheless, we could eliminate recursion if we wanted to as recursive functions can be encoded in λ-calculus by means of the Y-combinator:

```
Y = λf. (λx. f (x x)) (λx. f (x x))
```

The downside of this definition is it will only work with lazy evaluation otherwise it will loop forever. So we need a way to force laziness for `(x x)` and we can achieve this by η-expansion:
> *η-expansion* for `f` yields to `λx. f x`, where `x` does not occur free in `f`.

This let us introduce laziness in an eager evaluation model (call-by-value semantics) since the evaluation of `f` is now delayed until its application.
Then we get the following term[^4]:

```
Y′ = λf. (λx. f (λz. x x z)) (λx. f (λz. x x z))
```

We can visualise its recursive nature by applying `Y′` to `F`:

```
(λf. (λx. f (λz. x x z)) (λx. f (λz. x x z))) F
  →β (λx. F (λz. x x z)) (λx. F (λz. x x z))                    = Y′F
  →α (λx. F (λz1. x x z1)) (λx. F (λz. x x z))
  →β F (λz1. (λx. F (λz. x x z)) (λx. F (λz. x x z)) z1)
  →η F ((λx. F (λz. x x z)) (λx. F (λz. x x z)))                = F (Y′F)
  →α F ((λx. F (λz1. x x z1)) (λx. F (λz. x x z)))
  →β F (F (λz1. (λx. F (λz. x x z)) (λx. F (λz. x x z)) z1))
  →η F (F ((λx. F (λz. x x z)) (λx. F (λz. x x z)))             = F (F (Y′F))
  ...
```

Finally, by β-expansion (i.e. `Y″` β-reduces to `Y′`) we can define the call-by-value Y-combinator as:

```
Y″ = λf. (λx. x x) (λx. f (λz. x x z))
```

and define the folds as follows:

```
FOLDR′ = Y″ (λr f a l. l a (λh t. f h (r f a t)))
FOLDL′ = Y″ (λr f a l. l a (λh t. r f (f a h) t))
```
Note that we need to explicitly pass the fold function so we added it as the parameter `r`.

For the implementation, let's add some variants of `Y″` so we can work with uncurried functions:

```smalltalk
Class {
	#name : #Fix,
	#superclass : #Object
}

Fix class >> rec: f [

  ^[:x | (x value: x)] value: [:x | f value: [:z | (x value: x) value: z]]
]

Fix class >> rec2: f [
  
  ^[:x | (x value: x)]
    value:
  [:x | f value: [:z1 :z2 | (x value: x) value: z1 value: z2]]
]

Fix class >> rec3: f [

  ^[:x | (x value: x)]
    value:
  [:x | f value: [:z1 :z2 :z3 | (x value: x) value: z1 value: z2 value: z3]]
]
```
and then continue with the terms `FOLDR′` and `FOLDL′`:

```smalltalk
ScottList >> fixFoldl: f into: a [

  ^(Fix rec3: [:foldl |
    [:f1 :a1 :l |
      l caseNil: [a1] 
        caseCons: [:h :t |
          foldl value: f1 value: (f1 value: a1 value: h) value: t
        ]
    ]
  ]) value: f value: a value: self
]

ScottList >> fixFoldr: f into: a [

  ^(Fix rec3: [:foldr |
    [:f1 :l :a1 |
      l caseNil: [a1] 
        caseCons: [:h :t |
          f1 value: h value: (foldr value: f1 value: t value: a1)
        ]
    ]
  ]) value: f value: self value: a
]
```

### Corecursive

**Stream**

`Stream` has only one constructor `SCons` that takes a head element and a tail that is itself a stream. It can be viewed as a list with no constructor for the base case and because of this we need its tail to be lazily evaluated. We introduce the `Delay`/`force` constructor/eliminator pair for this purpose.

```
SCONS = λh t c. c h t

DELAY = λa d. d a
FORCE = λd. d (λa. a)

HEAD = λs. s (λh t. h)

TAIL = λs. s (λh t. FORCE t)
  →δ λs. s (λh t. (λd. d (λa. a)) t)
  →β λs. s (λh t. t (λa. a))
```
Its implementation is like that for `List`, `head` and `tail` now becoming total.
```smalltalk
Class {
  #name : #ScottStream,
  #superclass : #Object,
  #instVars : ['data']
}

ScottStream class >> makeSCons: h with: t [
  
  ^self basicNew initialize: [:c | c value: h value: t]
]

ScottStream >> head [

  ^data value: [:h :_ | h]
]

ScottStream >> tail [

  ^data value: [:_ :t | t value: [:force | force]]
]
```
In order to actually produce a stream we're going to add `ITERATE` (as `iterate:from:` in the protocol), which applies a function `f` to a seed `a`. Recall we need to build a lazy tail, hence we introduce `DELAY`:

```
ITERATE = λf a. SCONS a (DELAY (ITERATE f (f a)))
  →δ λf a. SCONS a ((λa d. d a) (ITERATE f (f a)))
  →β λf a. SCONS a (λd. d (ITERATE f (f a)))
```
If we reduce `ITERATE (ADD 1) 0` this is what we get:
```
(λf a. SCONS a (λd. d (ITERATE f (f a)))) (ADD 1) 0
 →β (λa. SCONS a (λd. d (ITERATE (ADD 1) ((ADD 1) a)))) 0
 →β SCONS 0 (λd. d (ITERATE (ADD 1) ((ADD 1) 0)))
 →β SCONS 0 (λd. d (ITERATE (ADD 1) 1))
```
And that's it until we force its tail to produce another element:
```
SCONS 0 (FORCE (λd. d (ITERATE (ADD 1) 1)))
 →δ SCONS 0 ((λd. d (λa. a)) (λd. d (ITERATE (ADD 1) 1)))
 →β SCONS 0 ((λd. d (ITERATE (ADD 1) 1)) (λa. a))
 →β SCONS 0 ((λa. a) (ITERATE (ADD 1) 1))
 →β SCONS 0 (ITERATE (ADD 1) 1)
 →δ SCONS 0 ((λf a. SCONS a (λd. d (ITERATE f (f a)))) (ADD 1) 1)
 →β SCONS 0 ((λa. SCONS a (λd. d (ITERATE (ADD 1) ((ADD 1) a)))) 1)
 →β SCONS 0 (SCONS 1 (λd. d (ITERATE (ADD 1) ((ADD 1) 1))))
 →β SCONS 0 (SCONS 1 (λd. d (ITERATE (ADD 1) 2)))
```
And so on:
```
SCONS 0 (SCONS 1 (FORCE (λd. d (ITERATE (ADD 1) 2))))
 →δ SCONS 0 (SCONS 1 ((λd. d (λa. a)) (λd. d (ITERATE (ADD 1) 2))))
 →β SCONS 0 (SCONS 1 ((λd. d (ITERATE (ADD 1) 2)) (λa. a)))
 →β SCONS 0 (SCONS 1 ((λa. a) (ITERATE (ADD 1) 2)))
 →β SCONS 0 (SCONS 1 (ITERATE (ADD 1) 2))
 →δ SCONS 0 (SCONS 1 ((λf a. SCONS a (λd. d (ITERATE f (f a)))) (ADD 1) 2))
 →β SCONS 0 (SCONS 1 ((λa. SCONS a (λd. d (ITERATE (ADD 1) ((ADD 1) a)))) 2))
 →β SCONS 0 (SCONS 1 (SCONS 2 (λd. d (ITERATE (ADD 1) ((ADD 1) 2)))))
 →β SCONS 0 (SCONS 1 (SCONS 2 (λd. d (ITERATE (ADD 1) (3)))))
```
We can implement it using recursion:
```smalltalk
ScottStream class >> iterate: f from: a [

  ^ScottStream makeCons: a with: [:delay |
    delay value: (ScottStream iterate: f from: (f value: a))
  ]
]
```
Or through `Y″` as:
```
ITERATE′ = Y″ (λi f a. SCONS a (λd. d (i f (f a))))
```

```smalltalk
ScottStream class >> fixIterate: f from: a [

  ^(Fix rec2: [:iterate |
    [:f1 :a1 |
      ScottStream makeCons: a1 with: [:delay |
        delay value: (iterate value: f1 value: (f1 value: a1))
      ]
    ]
  ]) value: f value: a
]
```

Then we could implement a stream consumer like `take` to make a list out of the first n elements produced:

```smalltalk
ScottStream >> take: n [
  
  ^(n < 1)
    ifTrue: [ScottList makeNil]
    ifFalse: [ScottList makeCons: self head with: (self tail take: n - 1)]
]
```
For example:

```smalltalk
(ScottStream iterate: [:x | x + 1] from: 1) take: 5. "[1, 2, 3, 4, 5]" 
(ScottStream iterate: [:x | x * 2] from: 1) take: 5. "[1, 2, 4, 8, 16]" 
(ScottStream iterate: [:x | x] from: 1) take: 5. "[1, 1, 1, 1, 1]" 
```
Another interesting operation is interleaving of two streams, we construct a stream with the head of the first and the interleaving of the second and the tail of the first:
```
INTERLEAVE = λs1 s2. SCONS (HEAD s1) (INTERLEAVE s2 (TAIL s1))
```

Its strategy can be observed by reducing for instance these 2 streams, (0, 1, 2, ...) and (0, -1, -2, ...), where it produces (0, 0, 1, -1, 2, -2, ...):

```
(λs1 s2. SCONS (HEAD s1) (INTERLEAVE s2 (TAIL s1))) (SCONS 0 (ADD 1)) (SCONS 0 (-1))
  →β (λs2. SCONS (HEAD (SCONS 0 (ADD 1))) (INTERLEAVE s2 (TAIL s1))) (SCONS 0 (-1))
  →β SCONS (HEAD (SCONS 0 (ADD 1))) (INTERLEAVE (SCONS 0 (-1)) (TAIL (SCONS 0 (ADD 1))))
  →* SCONS 0 (INTERLEAVE (SCONS 0 (-1)) (TAIL (SCONS 0 (ADD 1))))
  →* SCONS 0 (INTERLEAVE (SCONS 0 (-1)) (SCONS 1 (ADD 1)))
  →δ SCONS 0 ((λs1 s2. SCONS (HEAD s1) (INTERLEAVE s2 (TAIL s1))) (SCONS 0 (-1)) (SCONS 1 (ADD 1)))
  →β SCONS 0 ((λs2. SCONS (HEAD (SCONS 0 (-1))) (INTERLEAVE s2 (TAIL (SCONS 0 (-1))))) (SCONS 1 (ADD 1)))
  →β SCONS 0 (SCONS (HEAD (SCONS 0 (-1))) (INTERLEAVE (SCONS 1 (ADD 1)) (TAIL (SCONS 0 (-1)))))
  →* SCONS 0 (SCONS 0 (INTERLEAVE (SCONS 1 (ADD 1)) (TAIL (SCONS 0 (-1)))))
  →* SCONS 0 (SCONS 0 (INTERLEAVE (SCONS 1 (ADD 1)) (SCONS -1 (-1))))
  →δ SCONS 0 (SCONS 0 ((λs1 s2. SCONS (HEAD s1) (INTERLEAVE s2 (TAIL s1))) (SCONS 1 (ADD 1)) (SCONS -1 (-1))))
  →β SCONS 0 (SCONS 0 ((λs2. SCONS (HEAD (SCONS 1 (ADD 1))) (INTERLEAVE s2 (TAIL (SCONS 1 (ADD 1))))) (SCONS -1 (-1))))
  →β SCONS 0 (SCONS 0 (SCONS (HEAD (SCONS 1 (ADD 1))) (INTERLEAVE (SCONS -1 (-1)) (TAIL (SCONS 1 (ADD 1))))))
  →* SCONS 0 (SCONS 0 (SCONS 1 (INTERLEAVE (SCONS -1 (-1)) (TAIL (SCONS 1 (ADD 1))))))
  →* SCONS 0 (SCONS 0 (SCONS 1 (INTERLEAVE (SCONS -1 (-1)) (SCONS 2 (ADD 1)))))
  →δ SCONS 0 (SCONS 0 (SCONS 1 ((λs1 s2. SCONS (HEAD s1) (INTERLEAVE s2 (TAIL s1))) (SCONS -1 (-1)) (SCONS 2 (ADD 1)))))
  →β SCONS 0 (SCONS 0 (SCONS 1 ((λs2. SCONS (HEAD (SCONS -1 (-1))) (INTERLEAVE s2 (TAIL (SCONS -1 (-1))))) (SCONS 2 (ADD 1)))))
  →β SCONS 0 (SCONS 0 (SCONS 1 (SCONS (HEAD (SCONS -1 (-1))) (INTERLEAVE (SCONS 2 (ADD 1)) (TAIL (SCONS -1 (-1)))))))
  →* SCONS 0 (SCONS 0 (SCONS 1 (SCONS -1 (INTERLEAVE (SCONS 2 (ADD 1)) (TAIL (SCONS -1 (-1)))))))
  →* SCONS 0 (SCONS 0 (SCONS 1 (SCONS -1 (INTERLEAVE (SCONS 2 (ADD 1)) (SCONS -2 (-1))))))
  ...
```

We have to introduce a lazy tail, like so:

```
INTERLEAVE = λs1 s2. SCONS (HEAD s1) (DELAY (INTERLEAVE s2 (TAIL s1)))
  →δ λs1 s2. SCONS (HEAD s1) ((λa d. d a) (INTERLEAVE s2 (TAIL s1)))
  →β λs1 s2. SCONS (HEAD s1) (λd. d (INTERLEAVE s2 (TAIL s1)))
```
And its implementation is then straightforward:

```smalltalk
ScottStream >> interleave: s [

  ^ScottStream makeSCons: self head with: [:delay |
    delay value: (s interleave: self tail)
  ]
]
```
### Recap

Given an algebraic data type with three data constructors (`Nullary`, `Unary x` and `Binary y z`) and a pattern-matching function on it (`match`), we can Scott-encode it in λ-calculus as follows:

```
NULLARY =     λn u b. n
UNARY   =   λx n u b. u x
BINARY  = λy z n u b. b y z

MATCH = λt. t (λn u b. n) (λx n u b. u x) (λy z n u b. b y z)
      = λt. t NULLARY UNARY BINARY
```
Yet we know by reducing each possible value for `t` that `MATCH = ID` and so the encoding for `t` is what will do the selection, then we have

```
MATCH = λt. t B1 (λx. B2) (λy z. B3)
```
where `B1`, `B2` and `B3` are the bodies to evaluate for each case.

The conversion to a class is direct, its protocol will include both data constructors, as instance creation methods, and eliminators (be pattern-matching or projection functions) that will evaluate the data constructor held for each instance.

```smalltalk
Class {
  #name : #Scott,
  #superclass : #Object,
  #instVars : ['data']
}

Scott class >> makeNullary [
  
  ^self basicNew initialize: [:n :_ :__ | n]
]

Scott class >> makeUnary: x [
  
  ^self basicNew initialize: [:_ :u :__ | u value: x]
]

Scott class >> makeBinary: y with: z [
  
  ^self basicNew initialize: [:_ :__ :b | b value: y value: z]
]

Scott >> caseNullary: n caseUnary: u caseBinary: b [

  ^data value: n value: u value: b
]
```

The source code with the implementation for all the presented ADTs can be found in [this repository](https://github.com/unicolas/scott-encoding-st).

### Further reading

- Jansen, Jan Martin. (2013). Programming in the λ-Calculus: From Church to Scott and Back. 10.1007/978-3-642-40355-2_12.
- [Structural Pattern Matching in Java](http://blog.higher-order.com/blog/2009/08/21/structural-pattern-matching-in-java/).
- [Church Encoding](https://blog.ploeh.dk/2018/05/22/church-encoding/) series.

[^1]: [Pharo](https://pharo.org) in [tonel](https://github.com/pharo-vcs/tonel) file format.
[^2]: Where `→α` stands for *α-conversion*, `→β` for *β-reduction*, `→δ` for *δ-reduction*. `→η` *η-reduction* and `→*` for multiple-step reductions.
[^3]: This type is also called `Option` and its constructors `None` and `Some`.
[^4]: Often found as *Z* or *Y<sub>CBV<sub>*.
