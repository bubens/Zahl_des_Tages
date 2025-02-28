
/**
 * A Source is a function that upon calling returns a (random) value of type A.
 * 
 * @typeParam A Return type of Source
 *  
 */
export type Source<A> = () => A;

/**
 * @internal
 */
type Transformer<A, B> = (a: A) => B;

/**
 * Imagine a generator to be something like a machine that generates random values of a certain kind.
 * You can use generators and/or transformer-functions to plug new generators together.
 * 
 * @typeParam A Type of random value the generator generates.
 * 
 */
export interface Generator<A> {
    /**
     * Transforms the values produced by a generator.
     * Returns a generator that continously produces transformed values.
     * 
     * ```ts
     * // NOTE: The .> arrow symbolizes the method-chaining (does it?)
     * // map :: Generator a .> (a -> b) -> Generator b
     * const strGenerator = intGenerator.map(x => x.toString());
     * strGenerator.next(); // -> "32"
     * strGenerator.next(); // -> "18"
     * ```
     */
    map: <B>(transformer: Transformer<A, B>) => Generator<B>,

    /**
     * Feeds values of the current generators type into a function that creates a generator of a new type.
     * Returns a generator that continously produces values of the new type.
     * 
     * ```ts
     * // NOTE: The .> arrow symbolizes the method-chaining (does it?)
     * // then : Generator a .> (a -> Generator b) -> Generator b
     * 
     * // Example : Generator for a list of random length 1-5 filled with random ints 0-99
     * const randomList = 
     *    int(1,5)
     *       .then(l => list(l, int(0,99)));
     * 
     * randomList.next(); // -> [21, 76]
     * randomList.next(); // -> [9, 43, 31, 93]
     * ```
     *   
     */
    then: <B>(transformer: Transformer<A, Generator<B>>) => Generator<B>,

    /**
     * Generates a random value of the generator's type.
     * Each invidual value can be transformed by passing a transformer to next().
     * 
     * ```ts
     * // without tranformer
     * int(0,10).next(); // -> 7;
     * floatWithPrecision(0,10,3).next(); // -> 5.291
     * bool().next(); // -> true
     * 
     * // with transformer
     * const numbers = int(1,99);
     * console.log(numbers.next(x => x + " Bottles of beer")); // -> "67 Bottles of beer"
     * console.log(numbers.next(x => x + " Pirates on a ship")); // -> "11 Pirates on a ship"
     * ```
     */
    next: Source<A>
};

// Isn't this a good example for how beautiful and elegant FP is?
// It looks a bit ugly in JS/TS without the help of rambda or so.
// It's 10 lines of code and look what you can build on it just by using and combining it.
/**
 * Not exporting generate() seems to be closest to keeping the type opaque.
 * @internal
 */
const generate = <A>(source: Source<A>): Generator<A> => {
    const obj = Object.create(null);
    obj.map = <B>(transformer: (a: A) => B): Generator<B> =>
        generate(() => transformer(source()));

    obj.then = <B>(transformer: (a: A) => Generator<B>): Generator<B> =>
        generate(() => transformer(source()).next());

    obj.next = (): A =>
        source();

    return obj;
};


/**
 * Very simple seeded source for pseudo randomness.
 * Don't use this for any serious involving randomness.
 * (The "simple" is in the function-name to emphasize this.)
 */
export const simpleSeeded = (seed: number): Source<number> => () => {
    seed = Math.sin(seed) * 10000;
    return seed - Math.floor(seed);
};

/**
 * Create generator for floats in a given range.
 * 
 * ```ts
 * // float : Float -> Float -> [-> Source Float] -> Generator Float
 * // Example
 * const generator = float(0, 10, simpleSeeded(123));
 * console.log(generator.next()); // -> e.g. 3.2427879012
 * console.log(generator.next()); // -> e.g. 8.1329180219
 * console.log(generator.next()); // -> e.g. 1.4929187987
 * ```
 */
export const float = (min: number, max: number, source: Source<number> = Math.random): Generator<number> =>
    generate(source)
        .map(f => min + (max - min) * f);

/**
 * Create generator for floats in a given range with given precision.
 * 
 * ```ts
 * // floatWithPrecision : Int -> Int -> Int [-> Source Float] -> Generator Float
 * // Example
 * const generator = floatWithPrecision(0, 10, 2, simpleSeeded(123));
 * console.log(generator.next()); // -> e.g. 3.24
 * console.log(generator.next()); // -> e.g. 8.13
 * console.log(generator.next()); // -> e.g. 1.49
 * ```
 */
export const floatWithPrecision = (min: number, max: number, precision: number, source: Source<number> = Math.random): Generator<number> =>
    float(min, max, source)
        .map(toPrecision(precision));

/**
 * Returns float with precision digits after the decimal point.
 * 
 * @internal
 */
const toPrecision = (precision: number) => (x: number): number => {
    const power = 10 ** precision;
    return Math.floor(x * power) / power;
};

/**
 * Create generator for ints in given range.
 * 
 * ```ts
 * // int : Int -> Int [-> Source Float] -> Generator Int
 * // Example
 * const generator = int(0, 10, simpleSeeded(123));
 * console.log(generator.next()); // -> e.g. 3
 * console.log(generator.next()); // -> e.g. 8
 * console.log(generator.next()); // -> e.g. 1
 * ```
 */
export const int = (min: number, max: number, source: Source<number> = Math.random): Generator<number> =>
    floatWithPrecision(min, max + 1, 0, source);


/**
 * Create generator for boolean values.
 * 
 * ```ts
 * // boolean : [Source Float] -> Generator bool
 * // Example:
 * const generator = boolean(simpleSeeded(123));
 * console.log(generator.next()); // -> e.g. false
 * console.log(generator.next()); // -> e.g. true
 * console.log(generator.next()); // -> e.g. false
 * 
 */
export const boolean = (source: Source<number> = Math.random): Generator<boolean> =>
    generate(source)
        .map(f => f > .5);

/**
 * Create generator for values with equal probability.
 * 
 * ```ts
 * // uniform : a -> Array a [-> Source Float] -> Generator a
 * // Example
 * type Suit = "Club" | "Diamond" | "Spade" | "Heart";
 * 
 * const suits:Generator<Suit> = uniform("Club", ["Diamond", "Spade", "Heart"], simpleSeed(123));
 * console.log(suits()); // "Club"
 * console.log(suits()); // "Diamond"
 * console.log(suits()); // "Heart"
 * ```
 * 
 * **NOTE:** Why not have uniform `<A>uniform(list: Array<A>): Generator<A>` as the API? It looks a little prettier in code, but it leads to an awkward question. What do you do with `uniform([])`? How can it produce a value? The current API guarantees that we always have at least one value, so we never run into that question!
 */
export const uniform = <A>(first: A, rest: Array<A>, source: Source<number> = Math.random): Generator<A> =>
    rest.length === 0
        ? constant(first)
        : int(0, rest.length, source)
            .map(i => [first, ...rest][i]);


/**
 * Create generator for values with a *weighted* probabilty.
 * 
 * ```ts
 * // weighted : [a, Float] -> Array [a, Float] [-> Source Float] -> Generator a
 * // Example
 * // A loaded dice that lands on 5 and 6 more often:
 * const loadedDice =
 *    weighted( ["1", 10], [["2", 10], ["3", 10], ["4", 10], ["5", 20], ["6", 40]);
 * console.log(loadedDice.next()); // -> 5
 * console.log(loadedDice.next()); // -> 2
 * console.log(loadedDice.next()); // -> 6
 * console.log(loadedDice.next()); // -> 6
 * ```
 * 
 * **NOTE**: The weights in the example add up to 100, but that's not necessary. The weights are added up into a total, and from there, the probability of each case is `weight/total`.
 
 */
export const weighted = <A>(first: [A, number], rest: Array<[A, number]>, source: Source<number> = Math.random): Generator<A> => {
    if (rest.length === 0) {
        return constant(first[0]);
    }
    else {
        const sum =
            rest.reduce((acc, pair) => acc + pair[1], first[1]);


        const normalized: Array<[A, number]> =
            continiousSum([first, ...rest]);

        //console.log(normalized);
        return float(0, sum, source)
            .map(x => getByWeight(normalized, x));

    }
}

const continiousSum = <A>(source: Array<[A, number]>, target: Array<[A, number]> = [], i: number = 0, sum: number = 0): Array<[A, number]> =>
    i === source.length
        ? target
        : continiousSum(source, [...target, [source[i][0], source[i][1] + sum]], i + 1, sum + source[i][1]);

const getByWeight = <A>(source: Array<[A, number]>, weight: number, i: number = 0): A => {
    if (i < source.length) {
        // console.log(weight);
        return weight <= source[i][1]
            ? source[i][0]
            : getByWeight(source, weight, i + 1);
    }
    else {
        throw new Error("Uhhh... bad!!!!");
    }
};

/**
 * Create a generator for the same value every time.
 * 
 * ```ts
 * // constant : a -> Generator a
 * // Example
 * const alwaysHelloWorld = constant("Hello World!");
 * console.log(alwaysHelloWorld.next()); // -> "Hello World!";
 * console.log(alwaysHelloWorld.next()); // -> "Hello World!";
 * console.log(alwaysHelloWorld.next()); // -> "Hello World!";
 * ```
 * 
 * **NOTE:** You might be asking yourself "But why?". It is useful. See `uniform` and `weighted` for examples.
 */
export const constant = <A>(value: A): Generator<A> =>
    generate(() => value);

/**
 * Create a generator for a pair of random values.
 * A common use of this might be to generate a point in a certain 2D space:
 * 
 * ```ts
 * const points: Generator<[number, number]> = pair(int(0,100), int(0,100));
 * 
 * console.log(points()); // [ 73, 21 ]
 * console.log(points()); // [ 65, 68 ]
 * console.log(points()); // [ 7, 28 ]
 * ```
 * @param leftGenerator Generator for the left/first value.
 * @param rightGenerator Generator for the right/second value.
 */
export const pair = <A, B>(leftGenerator: Generator<A>, rightGenerator: Generator<B>): Generator<[A, B]> =>
    generate(() => [leftGenerator.next(), rightGenerator.next()]);


/**
 * Create a generator for lists/arrays of random values.
 * 
 * ```ts
 * const lists: Generator<number[]> = list(5, int(0,100));
 * 
 * console.log(lists()); // [ 23, 25, 1, 76, 34 ]
 * console.log(lists()); // [ 3, 38, 33, 12, 68 ]
 * console.log(lists()); // [ 40, 60, 90, 37, 86 ]
 * ```
 * 
 * If you want to generate a list with a random length, you need to use `then`:
 * 
 * ```ts
 * const lists = then(l => list(l, int(0,100)), int(1,10));
 * 
 * console.log(lists()); // [ 39, 35, 31, 14, 34, 99 ]
 * console.log(lists()); // [ 82, 52, 96, 20 ]
 * console.log(lists()); // [ 86, 86, 94, 44, 55, 23, 7, 23, 86 ]
 * ```
 * 
 * @param len Array length.
 * @param generator Generator for the values that fill the list.
 */
export const list = <A>(len: number, generator: Generator<A>): Generator<A[]> =>
    generate(() => {
        const result = Array(len).fill(0).map(() => generator.next());
        return result
    });