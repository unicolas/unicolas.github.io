---
title: "Taking the ƒun out of it"
date: '2025-09-21'
tags:
  - defunctionalisation
  - typescript
published: true
description: 'Defunctionalisation of higher-order functions and higher-kinded types in TypeScript'
---

A rather usual question that arises when we pick some programming language is how do we express certain things that are not directly supported by it. One of those things is higher-kinded types and in this pursuit one may (or may not) come across a technique called _defunctionalisation_ that makes a higher-order to first-order program transformation and by bringing it to the type-level allows us to simulate them.
We'll target TypeScript and start with the general form that eliminates higher-order functions to have a good grasp of how it works &mdash;and probably learn some tricks along the way&mdash; to finally conclude with higher-kinded types.

### Higher order functions

The main idea is to remove higher-order functions from a source program by replacing them with data types, so we proceed as follows.

> We define a sum type `Arrow(A, B)` that holds a variant for every function arrow of type `A → B` found in the program, together with its free variables (i.e. its environment).
> We then replace these function arrows by the corresponding injection/constructor of `Arrow(A, B)` and their application by evaluation of an elimination/case analysis function `apply` of type `Arrow(A, B) × A → B`.

Let's take the next piece of code as our source program:

```ts
const map = <A, B>(f: (_: A) => B, a: A[]): B[] => {
  const [x, ...xs] = a;
  return x === undefined ? [] : [f(x), ...map(f, xs)];
};
const replace = <A, B>(a: A[], b: B) => map(() => b, a);
const main = <A>(a: A[]): number[] => {
  const numbers = replace(a, 0);
  let x = 0;
  const from1 = map((n) => ((x = x + 1), n + x), numbers);
  const squared = map((n) => n * n, from1);
  return squared;
};
main([[], [], [], []]);
```
Which briefly consists of the following:
- a higher order function `map`, that applies a function to every element of an input array and returns an array with the result of each application. 
- a function `replace` that sets a constant value for every element of the input array.
- a function `main` that produces an array with the squares of the first length<sub>a</sub> natural numbers.
- an application of `main` to an array of 0-tuples.

Initially, we're looking for a type that will be a substitute for `f` in `map`, that is `Arrow<A, B>` and to come up with its variants we need to take into account all three function arrows:
- `() => b` from type A to type B and a free variable _b_ of type B: constructed with `b: B` and tagged `Const`.
- `(n) => ((x = x + 1), n + x)` from number to number and a free variable _x_ of type number: constructed with `x: number` and tagged `Next`.
- `(n) => n * n` from number to number and no free variables: constructed with no values and tagged `Squared`.

This leads us to the definition of this sum type and its constructors:
```ts
type Arrow<A, B> = 
  | { tag: 'Const'; b: B }
  | { tag: 'Next'; x: number }
  | { tag: 'Squared' }

const Const = <A, B>(b: B): Arrow<A, B> => ({ tag: 'Const', b });
const Next = (x: number): Arrow<number, number> => ({ tag: 'Next', x });
const Squared = (): Arrow<number, number> => ({ tag: 'Squared' });
```
We can suspect already by the return type of these constructors and also by the lack of type witnesses for A and B in our variants (except for `Const`) that our case analysis function `apply` won't easily type-check.

```ts
const apply = <A, B>(arr: Arrow<A, B>, n: A): B => {
  switch (arr.tag) {
    case 'Const':
      return arr.b;
    case 'Next':
      return (arr.x = arr.x + 1, n + arr.x);
//                               ^^^^^^^^^
//                               Operator '+' cannot be applied to types 'A' 
//                               and 'number'.
    case 'Squared':
      return n * n;
//           ^^^^^
//           The left-hand side of an arithmetic operation must be of type 
//           'any', 'number', 'bigint' or an enum type.
  }
}
```
At least we convince the compiler that we know best:

```ts
const apply = <A, B>(arr: Arrow<A, B>, n: A): B => {
  switch (arr.tag) {
    case 'Const':
      return arr.b;
    case 'Next':
        return (arr.x = arr.x + 1, (n as number + arr.x) as B);
    case 'Squared':
      return ((n as number) * (n as number)) as B;
  }
}
```
Finally, we have to update the higher-order `map` function to use the type `Arrow<A, B>`, then replace the application of the original function `f` to `x` for an application of `apply` to the `Arrow` `f` and `x`, and change the function arrows for the constructors counterparts `Const`, `Next` and `Squared`:

```ts
const map = <A, B>(f: Arrow<A, B>, a: A[]): B[] => {
  const [x, ...xs] = a;
  return x === undefined ? [] : [apply(f, x), ...map(f, xs)];
}
const replace = <A, B>(list: A[], b: B) => map(Const(b), list);
const fn = <A>(list: A[]): number[] => {
  const numbers = replace(list, 0);
  let x = 0;
  const from1 = map(Next(x), numbers);
  const squared = map(Squared(), from1);
  return squared;
}
fn([[], [], [], []]);
```
And that's it, we've completed the defunctionalisation of our source program into this first-order version. 

Now let's address the elephant in the room: can we avoid those type assertions?
This problem arises because we're dealing with polymorphic code in the first place and defunctionalising such code introduces the definition of a [generalised algebraic data type](https://en.wikipedia.org/wiki/Generalized_algebraic_data_type). So, we have two alternatives, either we remove polymorphism by monomorphisation or we approximate generalized algebraic data types by means of an equality proof. Let's explore both options.

**1. Monomorphisation**

This transformation is straightforward, we account all the types the function arrows operate on and create specialised versions of the `apply` function. Something that it is possible because this is a whole-program transformation.

- the _Const_ function takes an array of 0-tuples/units and returns an array of numbers.
- the _Next_ and _Squared_ functions both take an array of numbers and return an array of numbers.

So we define two distinct `ArrowAB` types and create two specialised versions of `apply` for each type, one for the combination unit-number and one for number-number:

```ts
type ArrowUnitNum = { tag: 'Const'; b: number };
const Const = (b: number): ArrowUnitNum => ({ tag: 'Const', b });

type ArrowNumNum = { tag: 'Next'; x: number } | { tag: 'Squared' };
const Next = (x: number): ArrowNumNum => ({ tag: 'Next', x });
const Squared = (): ArrowNumNum => ({ tag: 'Squared' });

const applyUnitNum = (arr: ArrowUnitNum, _: []): number => arr.b;

const applyNumNum = (arr: ArrowNumNum, n: number): number => {
  switch (arr.tag) {
    case 'Next':
      return (arr.x = arr.x + 1, n + arr.x);
    case 'Squared':
      return n * n;
  }
};
```
Same as before, now we do the replacements of the original function and the function arrows, the downside here is that also specialised versions of `map` are necessary:

```ts
const mapUnitNum = (arr: ArrowUnitNum, a: [][]): number[] => {
  const [x, ...xs] = a;
  return x === undefined ? [] : [applyUnitNum(arr, x), ...mapUnitNum(arr, xs)];
}
const mapNumNum = (arr: ArrowNumNum, a: number[]): number[] => {
  const [x, ...xs] = a;
  return x === undefined ? [] : [applyNumNum(arr, x), ...mapNumNum(arr, xs)];
}
const replace = (list: [][], b: number) => mapUnitNum(Const(b), list);
const fn = (list: [][]): number[] => {
  const numbers = replace(list, 0);
  let x = 0;
  const from1 = mapNumNum(Next(x), numbers);
  const squared = mapNumNum(Squared(), from1);
  return squared;
}
fn([[], [], [], []]);
```

**2. GADT approximation**

Generalised algebraic data types can be approximated by using values as proof of equality. Here we use Martin-Löf identity that states that a type `Identity(A, B)` relating two values `a: A` and `B: b` is inhabited if `a` and `b` are identical. The only constructor for this type is `refl`: it encodes the reflexivity property and it's implemented by the identity function.
Consequently, we get to the following implementation[^1], where `Id<A, B>` encodes the symmetry property that allows us to prove equality either way:

```ts
type Id<A, B> = ((a: A) => B) & ((b: B) => A);
const Refl = <A>(): Id<A, A> => (a: A): A => a;
```

Now we can introduce type equalities to the `Arrow<A, B>` sum type for both `A` and `B` in order to state what types these type variables will equal to in each variant, then update its constructors to set the values through `Refl`:

```ts
type Arrow<A, B> =
  | { tag: 'Const'; A: Id<A, A>; B: Id<B, B>; b: B }
  | { tag: 'Next'; A: Id<A, number>; B: Id<B, number>; x: number }
  | { tag: 'Squared'; A: Id<A, number>; B: Id<B, number> };
const Const = <A, B>(b: B): Arrow<A, B> => ({
  tag: 'Const',
  A: Refl(),
  B: Refl(),
  b,
});
const Next = (x: number): Arrow<number, number> => ({
  tag: 'Next',
  A: Refl(),
  B: Refl(),
  x,
});
const Squared = (): Arrow<number, number> => ({
  tag: 'Squared',
  A: Refl(),
  B: Refl(),
});
```
Then for `apply` we can evaluate `A` and `B` to coerce the values to the expected types, as they were coerce<sub>A</sub> and coerce<sub>B</sub> respectively, and get an equivalent implementation as we got before but without resorting to type assertions:

```ts
const apply = <A, B>(arr: Arrow<A, B>, a: A): B => {
  switch (arr.tag) {
    case 'Const':
      return arr.b;
    case 'Next':
      return (arr.x = arr.x + 1), arr.B(arr.A(a) + arr.x);
    case 'Squared':
      return arr.B(arr.A(a) * arr.A(a));
  }
};
```
The rest of the source program is defunctionalised just as before, since the type `Arrow<A, B>`, its constructors and the `apply` function remain unchanged in their signatures. For completeness:

```ts
const map = <A, B>(f: Arrow<A, B>, a: A[]): B[] => {
  const [x, ...xs] = a;
  return x === undefined ? [] : [apply(f, x), ...map(f, xs)];
};
const replace = <A, B>(list: A[], b: B) => map(Const(b), list);
const main = <A>(list: A[]): number[] => {
  const numbers = replace(list, 0);
  let x = 0;
  const from1 = map(Next(x), numbers);
  const squared = map(Squared(), from1);
  return squared;
};
main([[], [], [], []]);
```

### Higher-kinded types

The intention of type defunctionalisation is to eliminate [higher-kinded polymorphism](https://en.wikipedia.org/wiki/Type_class#Higher-kinded_polymorphism) from a program. That is, transform a program that contains higher-order type operators (kinds of the form `(* → *) → *`) into one where all type operators are first-order (kinds of the form `*`, `* → *`, and so on).
The procedure is as follows:

> We introduce a type constructor `Apply(T', A)` to represent the type-level application `T(A)`, where the type `T'` &mdash;called brand&mdash; identifies the type constructor `T` we want to abstract over.

Let's consider the implementation of functors as a motivating example, where the mapping function `fmap` that applies a transformation to the values of a structure, has the type `(A → B) × F(A) → F(B)` and, once defunctionalised, will have the equivalent type `(A → B) × Apply(T', A) → Apply(T', B)`.
We can get to the following interface:

```ts
interface Functor<F extends Brand> {
  fmap: <A, B>(f: (_: A) => B, a: Apply<F, A>) => Apply<F, B>;
}
```

For `Brand`, we're going to use singleton types/literal strings types that refer to the name of the abstracted type constructors (e.g. `'Identity'` for `Identity<T>`, `'Option'` for `Option<T>`, etc.), then for `Apply<F, A>` an indexed type that resolves this mapping through an object type consisting of `Brand` properties of type of the related constructor, like so:

```ts
type Type<T> = {
  Identity: Identity<T>;
  Option: Option<T>;
  Array: Array<T>;
};
type Brand = keyof Type<never>;
type Apply<B extends Brand, T> = Type<T>[B];
```

Now we can provide functor instances for these types, let's illustrate this with `Option` by defining it as the following sum type:

```ts
type Option<A> = { tag: 'None' } | { tag: 'Some'; a: A };
const None = (): Option<never> => ({ tag: 'None' });
const Some = <A>(a: A): Option<A> => ({ tag: 'Some', a });
```
and its functor instance like this: 

```ts
const functor: Functor<'Option'> = {
  fmap: <A, B>(f: (_: A) => B, o: Option<A>): Option<B> => {
    return o.tag === 'None' ? None() : Some(f(o.a));
  },
};
```
Up to this point, we only took into consideration unary type constructors (i.e. of kind `* → *`), for constructors of higher arities we need specialised definitions for `Apply`, `Brand`, `Type` and `Functor`. For binary type constructors (`* → * → *` kind) we would add:

```ts
type Type2<T, U> = {
  Pair: [T, U];
  Either: Either<T, U>;
};
type Brand2 = keyof Type2<never, never>;
type Apply2<B extends Brand2, T, U> = Type2<T, U>[B];

interface Functor2<F extends Brand2> {
  fmap: <A, B, C>(f: (_: A) => B, a: Apply2<F, C, A>) => Apply2<F, C, B>;
}
```
This enable us to define a functor instance for some `Either` implementation:

```ts
type Either<A, B> = { tag: 'Left'; a: A } | { tag: 'Right'; b: B };
const Left = <A>(a: A): Either<A, never> => ({ tag: 'Left', a });
const Right = <B>(b: B): Either<never, B> => ({ tag: 'Right', b });

const functor: Functor2<'Either'> = {
  fmap: <A, B, C>(f: (_: A) => B, e: Either<C, A>): Either<C, B> => {
    return e.tag === 'Left' ? Left(e.a) : Right(f(e.b));
  },
};
```
Unsurprisingly, the implementations for constructors of other arities can be added by following the same pattern.

Now that we got here, it may be of interest to see how we could write general functions over a constraint. For example &mdash;and to make use of the code we wrote&mdash; a functor constraint. One function that presents this idea very well is the structure-preserving operation `void` that discards the values of the structure. It has the type `F(A) → F(Unit)` where `F` is a functor.

We have two challenges here. In the first place, we cannot just write a functor constraint. In the second place, we have not one but multiple functor interfaces for the different type constructor arities.

To introduce the functor constraint we parameterise the instance as an alternative typeclass dictionary passing, that is, we will create a closure whose context is some `Functor<F>`:

```ts
function void_<F extends Brand>(
  f: Functor<F>
): <A>(fa: Apply<F, A>) => Apply<F, []>;
```

To be able to write a single `void` function that works for the multiple `Functor` interfaces, we have to make use of function overloading, characterised by the following signatures:
- an overload signature for each one of the functor interfaces, `Functor`, `Functor2`, etc.
- an implementation signature for a general `Functor*` interface compatible with the overloads, removing constraints and widening types to `unknown`.

```ts
interface Functor_ {
  fmap: <A, B>(f: (_: A) => B, a: unknown) => unknown;
}

function void_<F extends Brand>(
  f: Functor<F>
): <A>(fa: Apply<F, A>) => Apply<F, []>;
function void_<F extends Brand2>(
  f: Functor2<F>
): <A, B>(fa: Apply2<F, A, B>) => Apply2<F, A, []>;
function void_(f: Functor_): (fa: unknown) => unknown {
  return (fa) => f.fmap(() => [], fa);
}
```

Since implementation signatures can't be called directly, expressions using `void` won't suffer from type loss, the following will be inferred as expected:

```ts
const e1 = void_(option.functor)(option.Some(5))  // e1: Option<[]>
const e2 = void_(option.functor)(option.None()))  // e2: Option<[]>
const e3 = void_(either.functor)(either.Left(1))  // e3: Either<number, []>
const e4 = void_(either.functor)(either.Right(1)) // e4: Either<never, []>
```
And finally, this is how we can express higher-kinded types without having support for it thanks to type defunctionalisation. For real-world examples implementing them see the libraries [fp-ts](https://github.com/gcanti/fp-ts) (TypeScript) and [highj](https://github.com/highj/highj) (Java).

As usual, the code samples for this post are in [this repository](https://github.com/unicolas/example-defunctionalisation).

### Further reading 

- Abel, A., Cockx, J., Devriese, D., Timany, A., & Wadler, P. (2020). Leibniz equality is isomorphic to Martin-Löf identity, parametrically. doi:10.1017/S0956796820000155.
- François Pottier and Nadji Gauthier. 2004. Polymorphic typed defunctionalization. doi:10.1145/982962.964009.
- Olivier Danvy and Lasse R. Nielsen. 2001. Defunctionalization at work. doi:10.1145/773184.773202
- Sulzmann, M. Wang, M. (2006). GADTless Programming in Haskell 98.
- Yallop, J., White, L. (2014). Lightweight Higher-Kinded Polymorphism. doi:10.1007/978-3-319-07151-0_8.
- [Defunctionalization](https://ncatlab.org/nlab/show/defunctionalization) at nLab.
- [Defunctionalization: Everybody Does It, Nobody Talks About It](https://blog.sigplan.org/2019/12/30/defunctionalization-everybody-does-it-nobody-talks-about-it) at Sigplan.

[^1]: Intersection of functions creates overload signatures, the implementation signature must be compatible and it is a characteristic `id` has.
