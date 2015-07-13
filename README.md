# module best practices

This is a set of "best practices" I've found for writing new JavaScript modules. This guide deals specifically with front- and back-end Node/CommonJS modules hosted on npm, but the same concepts may apply elsewhere. 

### contents

- [module basics](#module-basics)
- [naming conventions](#naming-conventions)
- [small focus](#small-focus)
- [prefer dependencies](#prefer-dependencies)
- [discoverability](#discoverability)
- [API best practices](#api-best-practices)
- [avoid global state](#avoid-global-state)
- [testing](#testing)
- [versioning](#versioning)
- [environments](#environments)
- [data types](#data-types)
- [npm ignores](#npm-ignores)
- [task running](#task-running)
- [UMD builds](#umd-builds)
- [entry points](#entry-points)

## module basics

A "module" is just a reusable chunk of code, abstracted into a more user-friendly API. 

Modules should have a *very specific* purpose. Don't aim to build a large *framework*, instead; imagine you're building its underlying parts as separate pieces (which could, if desired, be composed together to mimic the scope of a framework).

This is the core of the Unix Philosophy: building small programs that do one thing, do it well, and compose easily with other programs.

## naming conventions

Modules are lower case and usually dash-separated. If your module is a pure utility, you should *generally* favour clear and "boring" names for better discoverability and code clarity. 

e.g. The following code is easy to read:

```js
var collides = require('point-in-circle')
var data = require('get-image-pixels')(image)
```

This is not as clear:

```js
var collides = require('collides')
var data = require('pixelmate')(image)
```

## small focus

Writing modules with a *single* focus might be tricky if you've only ever worked with large frameworks (like jQuery, ThreeJS, etc). 

One easy way to enforce this is to break your code into separate files. For example, a function that is not directly tied to the rest of the module can be split into its own file:  

```js
function random(start, end) {
    return start + Math.random() * (end - start)
}

//.. your module code ..
```

You could move `random` into its own file: `random.js`

```js
var random = require('./random')

//.. your module code ..
```

This forces you to strip away code that doesn't belong in the module, keeping the entry point focused and narrow. It also makes it easy to move the separated functions into their own modules if you later feel the need. 

<sup>*Note:* The `random()` one-liner is for demonstration; often you would be dealing with larger functions.</sup>

## prefer dependencies

Although the above code is terse, it could be improved by depending on a module that already exists. For example: [random-float](https://www.npmjs.org/package/random-float) or [random-int](https://www.npmjs.org/package/random-int).

There are some benefits to this approach:

- The other module is already being used and depended on in the wild
- The other module has (often) gone through revisions to fix edge cases
- The other module has its own tests, versioning, documentation, issue tracking, etc
- It reduces code duplication (e.g. in the case of browserify)

When you can't find a suitable dependency, or when the only dependencies are dangerous to depend on (i.e. no testing, unstable API, poorly written), this is where you could take it upon yourself to split the code into its own module. 

It is also better to prefer small dependencies rather than broad "libraries." For example, if you need to shuffle an array or merge objects, it would be better to depend on [array-shuffle](https://www.npmjs.com/package/array-shuffle) or [object-assign](https://www.npmjs.com/package/object-assign) rather than all of [underscore](http://underscorejs.org/#shuffle) for those sole functions. 

## discoverability

You should make sure your module has these things:

- a `README.md` file that describes the module, gives a short code example, and documents its public API
- a `repository` field in package.json 
- common `keywords` listed in package.json
- a clear `description` in package.json
- a `license` field in package.json and `LICENSE.md` in the repository

This will improve the discoverability of your module through Google and npm search, and also give more confidence to people who may want to depend on your code. Better discoverability means less fragmentation overall, which means tighter and better tested application code.

The license is important for large companies to justify using your module to their legal teams.

For more tips on module creation workflow, [see here](http://mattdesl.svbtle.com/faster-and-cleaner-modules).

## API best practices

Keep your APIs short, simple, and easy to remember. If you've got a hundred functions in your module, you might want to rethink your design and split those into other modules. 

You can use a default export to handle the most common use-case, for example: [color-luminance](https://github.com/mattdesl/color-luminance/blob/master/index.js) provides different coefficients, but the default export is the most common case.

Classes and constructors can be a controversial topic, and it often comes down to preference. I've found the best approach is to avoid forcing the `new` operator on your end-user, and have parameters passed in an `options` object. This leads to a clear and consistent API, and hides internal implementation details of your module. 

```js
function FunkyParser(opt) {
    //hide "new"
    if (!(this instanceof FunkyParser))
        return new FunkyParser(opt)
    //make params optional
    opt = opt||{}

    this.foo = opt.foo || 'default'
    // handle other options...
}

module.exports = FunkyParser
```

Alternatively, you could export a factory function to achieve the same thing, and explicitly disallow `new`. 

```js
module.exports = function createFunkyParser(opt) {
    return new FunkyParser(opt)
}

function FunkyParser(opt) {
    opt = opt||{}
}
```

Or, you can simply [use closures](https://github.com/stackgl/gl-clear/blob/4041e1288315a9b10ac6010bd73480e1e0fb0dbb/index.js) instead of relying on prototypes and `this` references. 

The above examples allow your module to be required and instantiated inline, like so:

```js
var parser = require('funky-parser')({ foo: 'bar' })
console.log(parser.foo)
```

## avoid global state

Globals, static fields, and singletons are dangerous in module code, and should be avoided. For example:

```js
var Parser = require('funky-parser')

//a "static" field
Parser.MAX_CHUNK = 250

var p = Parser()
```

Here, `MAX_CHUNK` is a global. If two modules both depend on `funky-parser`, and both of them mutate the global state, only one would succeed. In this case it's better as an instance member, so that both modules could modify it independently of the other.

```js
var p = Parser({ maxChunk: 250 })
```

## testing

This is a large topic that really deserves its own section.

In brief: add tests for your modules. [tape](https://www.npmjs.org/package/tape) is usually suitable for small modules. More info [here](http://www.macwright.org/2014/03/11/tape-is-cool.html). You can use [nodemon](https://www.npmjs.org/package/nodemon) during development to live-reload your tests. 

For front-end modules, you may need to test in the browser. During development I often use [budo](https://www.npmjs.org/package/budo), [wzrd](https://www.npmjs.com/package/wzrd) or [prova](https://www.npmjs.com/package/prova) to avoid redundant HTML and build step boilerplate. For command-line testing (i.e. PhantomJS) you can use [smokestack](https://www.npmjs.com/package/smokestack) or [testling](https://www.npmjs.com/package/testling). You can use modules like [faucet](https://www.npmjs.com/package/faucet) to pretty-print the output. For example, in your package.json:    

```json
  "scripts": {
    "test": "browserify test/*.js | testling | faucet"
  }
```

You can use modules like [lorem-ipsum](https://www.npmjs.org/package/lorem-ipsum), [baboon-image](https://www.npmjs.org/package/baboon-image) and [baboon-image-uri](https://www.npmjs.org/package/baboon-image-uri) for placeholder text and images.

For prototyping in WebGL/Canvas, you can use modules like [game-shell](https://www.npmjs.org/package/game-shell) or [raf-loop](https://www.npmjs.org/package/raf-loop) to reduce boilerplate. Example [here](https://github.com/Jam3/touch-scroll-physics/blob/9459f4bf3a2b68cd0a5bfa74688f2b5ba663a13f/test.js). 

Dependencies used in tests and demos should be installed as `devDependencies` like so:  

```npm install domready testling faucet --save-dev```

See [here](https://github.com/Jam3/jam3-testing-tools) and [here](https://mattdesl.svbtle.com/rapid-prototyping) for a more detailed approach to unit testing and developing Node/Browser modules.

## versioning

It's important to follow SemVer when you publish changes to your module. Others are expecting that they can safely update patch and minor versions of your module without the user-facing API breaking. 

If you are adding new backward-compatible features, be sure to list them as a `minor` version. If you are changing or adding something that breaks the documented API, you should list it as a `major` (breaking) version. For small bug fixes and non-code updates, you can update the `patch` number. 

Use the following npm command for updating — it will modify `package.json` and commit a new git tag:

```npm version major|minor|patch```

You should start modules with version `1.0.0`. The exception to this is when you know your module will be going under a lot of major API changes before stabilizing (i.e. for experimental packages). In that case, you can start with `0.0.0` and only promote to `1.0.0` once the API is a little more stable.

## environments

Your code should aim to work server-side and client-side where possible. For example; a color palette generator should not have any DOM dependencies; instead, those should be built separately, on top of your base module.

The closer you follow Node's standards and module patterns, the more likely your code will be useful in a variety of environments (like Ejecta/Cocoon, ExtendScript for AfterEffects, Browserify, etc).

You can use the [`browser` field](https://gist.github.com/defunctzombie/4339901) if you have a Node module which needs to be treated differently for the browser.

## data types

It's best to assume generic types for vectors, quaternions, matrices, and so forth. For example:

```js
var point = [25, 25]
var polyline2D = [ [25, 25], [50, 10], [10, 10] ]
var rgb = [0, 255, 0]
var rgba = [1.0, 1.0, 1.0, 0.5]
```

This makes it easier to compose with other modules, and avoids the problems of constantly "boxing and unboxing" objects across different modules with potentially conflicting versions. 

A good example of this can be seen with *simplicial complexes* such as [icosphere](https://www.npmjs.org/package/icosphere) and [cube-mesh](https://www.npmjs.com/package/cube-mesh). These are render-engine independent, and can be manipulated with modules like [mesh-combine](https://www.npmjs.com/package/mesh-combine), [simplicial-disjoint-union](https://www.npmjs.com/package/simplicial-disjoint-union), [normals](https://www.npmjs.com/package/normals). 

## npm ignores

For quicker installs, you should only publish the bare minimum to npm. You can ignore most files, like tests, example code, generated API docs, etc.

With the [`files`](https://www.npmjs.org/doc/files/package.json.html#files) entry in `package.json`, you can whitelist specific files to be published. This often leads to the tightest and smallest repos/packages. Alternatively, you can blacklist files from your module with an `.npmignore` file. 

## task running

If you have a build task (like [UMD](#umd-builds) or a test runner) it is better to keep this small and light by just adding it to your `npm scripts`. For these simple tasks, you might find gulp/grunt to be overkill.

In `package.json`:

```js
  "scripts": {
    "bundle": "browserify foo.js -s Foo -o build/foo.js",
    "uglify": "uglifyjs build/foo.js -cm > build/foo.min.js",
    "build": "npm run bundle && npm run uglify"
  }
```

These tools would be saved locally with `--save-dev` so that others cloning the repo can run the same versions. Then run the following to build:  

```npm run build```

If you're writing small CommonJS modules, you typically won't need to have any tasks except a test runner. In this case you don't need to list `browserify` as a devDependency, since the source is assumed to work in any CommonJS bundler (webpack, DuoJS, browserify, etc). 

Many npm scripts depend on Unix-only or bash-only features. If you want to make sure your scripts are platform-independent, keep to two rules:

* Only use cross-shell operators: `>`, `>>`, `<` and `|` – they work in bash, fish, the windows command prompt and others.
* Instead of platform-specific tools use node modules with a CLI – for example [`mkdirp`](https://www.npmjs.com/package/mkdirp) instead of `mkdir`, [`cpy`](https://www.npmjs.com/package/cpy) instead of `cp`, [`mve`](https://www.npmjs.com/package/mve) instead of `mv`.

## UMD builds

A [UMD](https://github.com/umdjs/umd) build is a JS bundle that works in multiple environments, like Node/CommonJS, AMD/RequireJS, and just a regular `<script>` tag. Instead of bloating your module code with [the wrapper boilerplate](https://github.com/umdjs/umd), and potentially making errors in the process, you should let tools handle this. This also means you will be using the latest wrappers (they may change as new environments become popular). Example:

```sh
# with browserify
browserify index.js --standalone FunkyParser -o build/funky-parser.js

# with webpack
webpack --output-library FunkyParser \ 
    --output-library-target umd \
    --outfile build/funky-parser.js
```

Generally speaking, UMD builds are not very useful for small modules. Adding bundle files leads to heavier repos and another channel you need to support. If somebody wants to use your module, encourage them to depend on it via npm so they can receive patches, or build it themselves with their tool of choice. 

## entry points

Occasionally you'll see modules using unusual entry points. This is especially useful for modules targeting front-end code, to reduce the bundle size and only pull in methods as needed. This should be used sparingly; if you have a lot of different functions, you should consider whether they need to be in their own modules.

Examples:  

- [gl-mat3](https://www.npmjs.org/package/gl-mat3) - splitting @toji's gl-matrix library into separate files for smaller bundle size
- [eases](https://www.npmjs.com/package/eases) - Robert Penner's easing equations

## more ... ? 

Feel free to submit issues/PRs to this repo if you have suggestions or comments. 