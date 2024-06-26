---
title: Generalised factories for extensibility
date: '2024-01-15'
tags:
  - object algebra
  - typescript
  - haskell
published: true
description: 'An exploration of extensibility with object algebras in TypeScript and its relation to visitors and typed tagless final interpreters in Haskell.'
updated: '2024-06-12'
---

<script>
  import img from '$lib/assets/object-algebra.svg?raw';
  import { Graphic } from '$lib/components';
</script>

Object algebras are presented as a solution to the [expression problem](https://en.wikipedia.org/wiki/Expression_problem) in object-oriented programming, that is they allow extensibility in terms of representation and operations without modifying existing code. They define the abstract syntax of a language as *a generic abstract factory*.

To illustrate this, suppose we want to model a simple language (i.e. its abstract syntax) for numeric expressions supporting only literals and addition. For example, this expressions

```
1
1 + 2
3 + 1 + 2
```
can be encoded in this language like this
```
Lit 1
Add (Lit 1) (Lit 2)
Add (Lit 3) (Add (Lit 1) (Lit 2)) 
```
Also we want to have multiple interpreters for this expressions: *evaluation* to actually compute its value and *pretty-printing* to get a representation closer to the language we are modelling. For some expression we can get different interpretations like so:

```
eval  (Add (Lit 1) (Lit 2)) = 3
print (Add (Lit 1) (Lit 2)) = "1 + 2"
```

We start by defining the abstract syntax as a generic factory interface (i.e. the object algebra interface) correlated to the following [signature](https://en.wikipedia.org/wiki/Signature_(logic)):

```
Expr E
  Lit : Integer → E
  Add : E × E → E
```
which translated into TypeScript (we use generics and eventually take advantage of its structural subtyping to avoid the definition of additional classes) looks like this:

```ts
interface Expr<E> {
  lit(x: number): E;
  add(e1: E, e2: E): E;
}
```
Compare this definition with an [abstract factory](https://en.wikipedia.org/wiki/Abstract_factory_pattern) where our expression type is fixed

```ts
interface ExprFactory {
  lit(x: number): Expr;
  add(e1: Expr, e2: Expr): Expr;
}
```
The issue here is that the concrete objects created need to be related (i.e. subtypes of `Expr`) and that the type of the parameters accepted for `add` is too general, for the concrete implementations we'll want to restrict them to accept the same concrete expression type. Hence the generalisation.

Then we define concrete algebras for the interpreters as implementations of this generic interface.

For the evaluation interpreter we introduce its interface. Here we want to get the computed value of the expressions so that the result type on evaluation is a number.

```ts
interface Eval {
  eval: () => number;
}
```

And then implement the concrete algebra for this interface: when evaluating literals (i.e. numbers) we simply return the value; for addition, we add the evaluation of both expressions.
```ts
class ExprEval implements Expr<Eval> {
  lit(x: number): Eval {
    return { eval: () => x };
  }
  add(e1: Eval, e2: Eval): Eval {
    return { eval: () => e1.eval() + e2.eval() };
  }
}
```
The same applies to pretty-printing. This time the result type being string and the result of printing, the textual representation of the expressions.

```ts
interface Print {
  print: () => string;
}
```

```ts
class ExprPrint implements Expr<Print> {
  lit(x: number): Print {
    return { print: () => x.toString() };
  }
  add(e1: Print, e2: Print): Print {
    return { print: () => `${e1.print()} + ${e2.print()}` };
  }
}
```
We build an expression (e.g. `3 + 1 + 2`) as follows

```ts
const expr = <E>(e: Expr<E>): E => e.add(e.lit(3), e.add(e.lit(1), e.lit(2)));
```
where `expr` expects to be applied to an interpreter, so that we can evaluate or print it like this

```ts
const r1 = expr(new ExprPrint()).print(); // "3 + 1 + 2"
const r2 = expr(new ExprEval()).eval();   // 6
```

We can observe that the addition of a new interpreter, as is the case with printing, did not require us to modify any of the existing code.
In order to see extensibility in the other direction, let's expand the definition of the language by adding another node to its abstract syntax: the negate operation.
Here are some interpretations including it:

```
eval  (Neg (Lit 1)) = -1
print (Neg (Lit 1)) = "(-1)"
eval  (Add (Lit 3) (Neg (Lit 1))) = 2
print (Add (Lit 3) (Neg (Lit 1))) = "3 + (-1)"
```
The language with the negate operation conforms to the next signature:
```
NegExpr E
  Lit : Integer → E
  Add : E × E → E
  Neg : E → E
```

Its implementation is straightforward, we extend the initial interface `Expr`

```ts
interface NegExpr<E> extends Expr<E> {
  neg(e: E): E;
}
```

and provide the concrete implementations for `Print` and `Eval`
```ts
class NegExprPrint extends ExprPrint implements NegExpr<Print> {
  neg(e: Print): Print {
    return { print: () => `(-${e.print()})` };
  }
}
```

```ts
class NegExprEval extends ExprEval implements NegExpr<Eval> {
  neg(e: Eval): Eval {
    return { eval: () => -e.eval() };
  }
}
```
Then, an expression for this language (e.g. `3 + (-1)`) can be built, evaluated and printed:

```ts
const negexpr = <E>(e: NegExpr<E>): E => e.add(e.lit(3), e.neg(e.lit(1)));

const r3 = negexpr(new NegExprPrint()).print(); // "3 + (-1)"
const r4 = negexpr(new NegExprEval()).eval();   // 2
```

Again, we see that when we added another representation we did not need to alter any of the existing code.

We can visualise the structure of the solution as three independent modules with the following diagram:

<Graphic>{@html img}</Graphic>

In the top left is the initial implementation with two operations (`lit` and `add`) and the first interpreter (`eval`), in the top right a new interpreter (`print`) and at the bottom a new operation (`neg`). All achieved by extension.

### Combining interpreters

If we look at the expression builders `expr`/`negexpr` we note that once applied they are fixed to an interpreter instance. But what if we want them to return expressions that can be interpreted in more than one way, like printed and evaluated? We could do that with support of intersection types.

We introduce `lift` as the combining operation for two algebras
```ts
interface Lift<A, B> {
  lift(a: A, b: B): A & B;
}
```
Then we can generalise merged algebras to two interpreters `A` and `B` as an abstract class, implementing the syntax nodes in terms of `lift`, and let the concrete implementations define what the merged algebras are.
This is, for instance, how we define the merge of two `Expr` algebras (`ExprMerge`):

```ts
abstract class ExprMerge<A, B> implements Expr<A & B>, Lift<A, B> {
  abstract a: Expr<A>;
  abstract b: Expr<B>;
  lift(a: A, b: B) {
    return {...a, ...b};
  }
  lit(x: number): A & B {
    return this.lift(this.a.lit(x), this.b.lit(x));
  }
  add(e1: A & B, e2: A & B): A & B {
    return this.lift(this.a.add(e1, e2), this.b.add(e1, e2));
  }
}
```
`lift` is rather generic as is, and so easily implemented by destructuring both arguments into a new object. `lit` and `add` simply return the combination of the operation applied to each algebra.
For the concrete merge between algebras for `Eval` and `Print` interpreters we only need to assign the concrete algebra implementations.

```ts
class ExprEvalPrint extends ExprMerge<Eval, Print> {
  a = new ExprEval();
  b = new ExprPrint();
}
```
Now we can use `ExprEvalPrint` to both evaluate and print an expression:

```ts
const e = expr(new ExprEvalPrint());
const r5 = e.evaluate();
const r6 = e.print();
```

There's further development on this direction in &ldquo;Feature-Oriented Programming With Object Algebras&rdquo;, although in Scala with a different set of typing features.

### Visitor pattern

The [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern) is another way to achieve extensibility but it fails to do so in both directions.

Here's an attempt to solve the expression problem through this pattern.
`Interpreter` is the visitor interface and is generic since we need to be polymorphic on the return type (this is usually addressed through side effects). `Expr` is the element/visitable interface where `accept` implements double dispatch (i.e. case analysis on both expression and interpreter).

```ts
interface Interpreter<E> {
  visitLit(lit: Lit): E;
  visitAdd(add: Add): E;
}

class Eval implements Interpreter<number> {
  visitLit(lit: Lit): number {
    return lit.x;
  }
  visitAdd(add: Add): number {
    return add.e1.accept(this) + add.e2.accept(this);
  }
}

class Print implements Interpreter<string> {
  visitLit(lit: Lit): string {
    return lit.x.toString();
  }
  visitAdd(add: Add): string {
    return `${add.e1.accept(this)} + ${add.e2.accept(this)}`;
  }
}

interface Expr {
  accept<E>(v: Interpreter<E>): E;
}

class Lit implements Expr {
  constructor(readonly x: number) {}
  accept<E>(v: Interpreter<E>): E {
    return v.visitLit(this);
  }
}

class Add implements Expr {
  constructor(readonly e1: Expr, readonly e2: Expr) {}
  accept<E>(v: Interpreter<E>): E {
    return v.visitAdd(this);
  }
}

const expr = new Add(new Lit(3), new Add(new Lit(1), new Lit(2)));
const r1 = expr.accept(new Eval());   // 6
const r2 = expr.accept(new Print());  // "3 + 1 + 2"
```
See we can add new interpreters without modifying existing code but can't do the same if we want to add new expressions. If we were to add for instance `Neg`, we would need to alter the `Interpreter` interface and all its implementations.

Besides not solving the problem in its entirety, the relation we can draw between the object algebra and this pattern is that of data and codata: with the visitor, expressions are defined as codata while with object algebras, they are as data.

Let's switch to Haskell now and compare an implementation of expressions as data and its transformation into codata using its [Church/Böhm-Berarducci encoding](https://okmij.org/ftp/tagless-final/course/Boehm-Berarducci.html).

First we give `Expr` as data, using GADT syntax for clarity. Here, it's definition is *by construction* as also is the implementation with object algebras (the abstract factory interface is the equivalent of this one). We conveniently define `eval` and `print` in terms of an eliminator function we're going to call `accept` for ease of comparison.

```hs
data Expr where
  Lit :: Int -> Expr
  Add :: Expr -> Expr -> Expr

accept :: (Int -> e) -> (Expr -> Expr -> e) -> Expr -> e
accept l _ (Lit x) = l x
accept _ a (Add e1 e2) = a e1 e2

eval :: Expr -> Int
eval = accept id (\\e1 e2 -> eval e1 + eval e2)

print :: Expr -> String
print = accept show (\\e1 e2 -> print e1 <> " + " <> print e2)

-- >>> eval (Add (Lit 1) (Lit 2))
-- 3
-- >>> print (Add (Lit 1) (Add (Lit 3) (Lit 2)))
-- "1 + 3 + 2"
```
Next, `CoExpr` as codata, defined *by elimination* (i.e. by `accept`) as also is with the visitor pattern, where we're roughly turning `(Int -> e)` into `visitLit()` and `(e -> e -> e)` into `visitAdd()` of the `Interpreter` interface and solving case analysis on both `Expr` and `Interpreter` concrete implementations through double dispatch.

```hs
newtype CoExpr = CoExpr { accept :: forall e. (Int -> e) -> (e -> e -> e) -> e }

lit :: Int -> CoExpr
lit x = CoExpr (\\l _ -> l x)

add :: CoExpr -> CoExpr -> CoExpr
add e1 e2 = CoExpr (\\l a -> a (accept e1 l a) (accept e2 l a))

eval :: CoExpr -> Int
eval c = accept c id (+)

print :: CoExpr -> String
print c = accept c show (\\e1 e2 -> e1 <> " + " <> e2)

-- >>> eval (add (lit 1) (lit 2))
-- 3
-- >>> print (add (lit 1) (add (lit 3) (lit 2)))
-- "1 + 3 + 2"
```
We can make the relation clearer if we define a data type for the product `(Int -> e) × (e -> e -> e)` (the uncurried `accept`) using a record:

```hs
data Interpreter e = Interpreter
  { visitLit :: Int -> e
  , visitAdd :: e -> e -> e
  }

newtype CoExpr = CoExpr { accept :: forall e. Interpreter e -> e }

lit :: Int -> CoExpr
lit x = CoExpr (`visitLit` x)

add :: CoExpr -> CoExpr -> CoExpr
add e1 e2 = CoExpr (\\i -> visitAdd i (accept e1 i) (accept e2 i))

eval :: CoExpr -> Int
eval c = accept c Interpreter { visitLit = id, visitAdd = (+) }

print :: CoExpr -> String
print c = accept c Interpreter 
  { visitLit = show
  , visitAdd = \\e1 e2 -> e1 <> " + " <> e2
  }
```

### Typed tagless final interpreters

The [tagless-final](https://okmij.org/ftp/tagless-final/index.html) approach also provides a solution to the expression problem, in Haskell it is done through type classes for extension. This and object algebras both develop the same idea; if we were to implement our language using tagless-final we'll get soon to a quite familiar representation.

```hs
class Expr e where
  lit :: Int -> e
  add :: e -> e -> e

newtype Eval = Eval { eval :: Int }

instance Expr Eval where
  lit = Eval
  add e1 e2 = Eval (eval e1 + eval e2)

newtype Print = Print { print :: String }

instance Expr Print where
  lit x = Print (show x)
  add e1 e2 = Print (print e1 <> " + " <> print e2)

class Expr e => NegExpr e where
  neg :: e -> e

instance NegExpr Eval where
  neg e = Eval (eval e * (-1))

instance NegExpr Print where
  neg e = Print ("(-" <> print e <> ")")
```
We can add interpreters with new instances of the `Expr` type class (e.g. `Expr Print`) and representations by defining new type classes (e.g. `NegExpr`), both without the need to change existing code.
Finally, we can construct and interpret expressions as follows: 

```hs
expr :: Expr e => e
expr = add (lit 3) (add (lit 1) (lit 2))

-- >>> eval expr
-- 6
-- >>> print expr
-- "3 + 1 + 2"

negexpr :: NegExpr e => e
negexpr = add (lit 3) (neg (lit 1))

-- >>> eval negexpr
-- 2
-- >>> print negexpr
-- "3 + (-1)"
```
Here the expressions `expr`/`negexpr` are constrained by type classes and the correct instance is implicitly selected on application, any type that instantiates `Expr`/`NegExpr` can be used for `e`. So that when applying `eval` to the expression, `Eval` is selected for `e`. With object algebras the concrete interpreter for `expr` is parameterised, we need to explicitly provide the concrete instance that determines the type for `E`.

### Closing thoughts

Despite that object algebras require only features present in most modern object-oriented languages, they end up appearing unappealing because even for libraries we see that their type systems seem not to suffice, as for instance higher-kinded polymorphism becomes a requirement. Apart from that, extensibility is indeed served.

### Further reading

- Oliveira, Bruno & Cook, William. (2012). Extensibility for the masses: practical extensibility with object algebras. 2-27. 10.1007/978-3-642-31057-7_2. 
- Oliveira, Bruno & van der Storm, Tijs & Loh, Alex & Cook, William. (2013). Feature-Oriented Programming With Object Algebras. 27-51. 10.1007/978-3-642-39038-8_2. 
- Downen, Paul & Sullivan, Zachary & Ariola, Zena & Peyton Jones, Simon. (2019). Codata in Action. 10.1007/978-3-030-17184-1_5. 
- Kiselyov, Oleg. (2012). Typed Tagless Final Interpreters. 10.1007/978-3-642-32202-0_3. 
- Biboudis, Aggelos & Palladinos, Nick & Fourtounis, George & Smaragdakis, Yannis. (2015). Streams à la carte: Extensible Pipelines with Object Algebras (Artifact). 10.4230/DARTS.1.1.9.

