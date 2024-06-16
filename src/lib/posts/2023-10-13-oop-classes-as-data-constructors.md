---
title: OOP classes as data constructors
date: '2023-10-13'
tags:
  - case analysis
  - smalltalk
  - haskell
published: true
description: 'Comparison of case analysis techniques in a functional language and an object-oriented one: pattern-matching and subtyping.'
updated: '2023-12-29'
---

In functional programming (FP), pattern matching is used to act based on the structure of data, to know what the constructor of a value is. In object-oriented programming (OOP) this mechanism is not available but this intent can be achieved with subtyping, and this is possible because we can encode the same semantics with both data constructors and classes.

To see what this means, let's start by comparing how operations on booleans are solved in these two languages: Haskell for FP and Smalltalk for OOP.

Consider the following algebraic data type (ADT) that represents booleans in Haskell:

```hs
data Bool = False | True
```

This defines a `Bool` type constructor and two data constructors: `True` and `False` for both logical values in boolean algebra (i.e. _true_ and _false_).

For the negation logical operation, or simply put `not`, we have:

```hs
not :: Bool -> Bool
not True = False
not False = True
```

That is, a function that takes a bool and gives you back another bool. Here we pattern-match against the argument to determine if it was constructed by means of `True` or `False` and produce a new value accordingly: if the argument was constructed using `True` we know we encoded a _true_ whose negation is _false_ and the constructor encoding this value is `False`. On the contrary, if the argument was constructed using `False` we have the other way round.

Now, let's see booleans implemented in Smalltalk[^1]:

```class.st
Class {
	#name : #Boolean,
	#superclass : #Object
}
```

```class.st
Class {
	#name : #True,
	#superclass : #Boolean
}
```

```class.st
Class {
	#name : #False,
	#superclass : #Boolean
}
```

We have a class hierarchy consisting of one abstract class (`Boolean`) and two concrete subclasses (`True` and `False`) each encoding the logical values. Observe that there's no construct in the language to declare a class as abstract, so that the class method `new` inherited from `Object` is just overridden to throw an error for this purpose, and that the sole instances of `True` and `False` are the pseudo-variables `true` and `false` respectively (i.e. they are singleton instances).

This use of classes to encode values is what let us decide in a similar fashion with the aid of dynamic dispatch, since there's one &#8220;constructor&#8221; class for each possible value, the object oriented implementation for `not` should be of no surprise:

```class.st
True >> not [

	^false
]
```

```class.st
False >> not [

	^true
]
```

As it is characteristic of OOP, we don't need an argument here, the value to negate is the receiver of the message: if `true` is the receiver, `not` will be looked up from class `True` where _true_ is encoded so it can only evaluate to _false_ (i.e. return `false`, `False` singleton instance); if `false` is the receiver, it will be looked up from `False` so we do the opposite by returning `true`.

Interestingly, also conditionals are implemented this way in Smalltalk, `ifTrue:ifFalse:` takes two blocks (its own flavour of lambdas[^2]) as arguments and evaluates the one corresponding with the receiver:

```class.st
False >> ifTrue: trueAlternativeBlock ifFalse: falseAlternativeBlock [

	^falseAlternativeBlock value
]
```

```class.st
True >> ifTrue: trueAlternativeBlock ifFalse: falseAlternativeBlock [

	^trueAlternativeBlock value
]
```

On the contrary, Haskell has a language construct but a function for case analysis also exists and it's called `bool`:

```hs
bool :: a -> a -> Bool -> a
bool f _ False = f
bool _ t True  = t
```
Here the order of arguments is false alternative, true alternative and the boolean. `f`, `t` and `_` match on anything, the difference is that `f` and `t` are bound to the match when successful while `_` is not bound.

So far, so good. We've been doing case analysis on only one argument, bringing another one to the party with pattern matching is straightforward, take for instance the `zip` function on lists: we check if either of the two lists is an empty list (`[]`) or a non-empty list (`head:tail`).

```hs
zip :: [a] -> [b] -> [(a,b)]
zip [] _ = []
zip _ [] = []
zip (a:as) (b:bs) = (a,b) : zip as bs
```

But how can we change behaviour based not only on the receiver of the message but also on the type of the parameter with the subtyping approach?

### Enter double dispatch

The solution consists in reducing polymorphism by dispatching multiple messages, first to the receiver and from there to its argument, but this time introducing a family of methods that uses the information we gained from the first dispatch.

Following the `zip` example and in order to do case analysis on both lists, we'll define a list as an empty list or a non-empty list consisting of its first element (its head) and the rest of the list (its tail).

Before writing any code, let's enumerate the cases for `zip` and how they're supposed to behave:

1. `zip empty empty` produces an empty list, nothing to zip.
2. `zip empty non-empty` produces an  empty list, second is discarded since there's no pairing possible.
3. `zip non-empty empty` produces an empty list, first is discarded since there's no pairing possible.
4. `zip non-empty non-empty` produces a non-empty list, heads from each list are paired and their tails are zipped.

From here we know that when the first list is empty we don't need to go further, a single dispatch will suffice, but when it's non-empty we need to know what type the second list is, so we introduce a *zip-with-a-non-empty-list* method that both need to implement to solve accordingly.

We're going to encode these values in a hierarchy consisting of an abstract class `List` and two concrete subclasses: `Empty` for the empty list and `Cons` for the non-empty. Then our protocol consists of a `zip:` method between any two lists and `zipCons:` between any list and a non-empty list. For this particular case and from what we saw above, there's no need to add `zipEmpty:` to the family of methods.

```class.st
Class {
	#name : #List,
	#superclass : #Object
}

List >> zip: list [

  ^self subclassResponsibility
]

List >> zipCons: list [

  ^self subclassResponsibility
]
```

`zip:` and `zipCons:` implementations for `Empty` are as simple as returning a new empty list, cases 1 and 2:


```class.st
Class {
	#name : #Empty,
	#superclass : #List
}

Empty >> zip: list [
  "Zips a list with an empty list"

  ^self class new
]

Empty >> zipCons: list [
  "Zips a non-empty list with an empty list"

  ^self class new
]
```

For `Cons`, `zip:` will dispatch a `zipCons:` method to its argument and delegate its resolution to this receiver: when `Empty` it will be handled by its implementation of `zipCons:` by returning an empty list (case 3) and when not, it will be done by `zipCons:` of `Cons` class by returning a new non-empty list where its head is a `Pair` with the head from each list and the tail is built recursively through zipping (case 4).


```class.st
Class {
	#name : #Cons,
	#superclass : #List,
	#instVars : [
		'head',
		'tail'
	]
}

Cons class >> head: element tail: list [
  
  ^self new initializeHead: element tail: list
]

Cons >> initializeHead: element tail: list [

  head := element.
  tail := list.
  ^self
]

Cons >> head [

  ^head
]

Cons >> tail [

  ^tail
]

Cons >> zip: list [
  "Zips a list with a non-empty list"

  ^list zipCons: self
]

Cons >> zipCons: list [
  "Zips a non-empty list with another non-empty list"

  ^self class 
    head: (Pair first: list head second: self head) 
    tail: (list tail zip: self tail)
]
```
Let `Pair` be a class for 2-tuples that has `first:second:` as constructor. The full code for this example can be found [here](https://github.com/unicolas/example-case-analysis-st).

We may notice that this solution resembles the Special Case[^3] (or Null Object) pattern and in fact, an implementation like the above is what we're going to get by applying it to this list representation problem.

### Final notes

Even though this is the object-oriented way of doing case analysis, it is not seen as often as pattern matching since most of the time values are not encoded this way. And besides the overhead that introduces dynamic dispatch, there're some differences in both approaches worth mentioning:

- With pattern matching we have all the cases present in the same function instead of distributed across different methods.
- Case analysis with subtyping is done on the receiver of the message and to do it on more arguments we need to introduce multiple dispatch.
- Exhaustiveness can be checked with pattern matching but not using subtyping since we cannot know in advance all the implementors for the method[^4].

[^1]: Specifically in [Pharo](https://pharo.org) and its [tonel](https://github.com/pharo-vcs/tonel) file format, but this examples can be adapted to any Smalltalk-80 implementation.
[^2]: For completeness, *λx. t*  would be written as `[:x | t]`, a `BlockClosure` instance that gets evaluated using its `value` method family, so that *(λx. t) s* translates to `[:x | t] value: s`.
[^3]: &#8220;A subclass that provides special behavior for particular cases&#8221; &#8212; see [Special Case](https://martinfowler.com/eaaCatalog/specialCase.html) entry in Martin Fowler's Catalog of Patterns of Enterprise Application Architecture.
[^4]: Scala addresses this problem with sealed classes and traits.
