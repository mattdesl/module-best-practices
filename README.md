# module best practices

This is a set of "best practices" I've found for writing new JavaScript modules. This guide deals specifically with front- and back-end Node/CommonJS modules hosted on npm, but the same concepts may apply elsewhere. 

### contents

- [module basics](#module-basics)
- [naming conventions](#naming-conventions)
- [small focus](#small-focus)
- [prefer dependencies](#prefer-dependencies)
- [discoverability](#discoverability)
- [constructor best practices](#constructor-best-practices)
- [avoid global state](#avoid-global-state)
- [testing](#testing)
- [versioning](#versioning)
- [environments](#environments)
- [data types](#data-types)
- [npmignore](#npmignore)
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

## prefer dependencies

Although the above code is terse, it could be improved by depending on a module that already exists. For example: [randf](https://www.npmjs.org/package/randf) or [rnd](https://www.npmjs.org/package/rnd) (for integers). 

There are some benefits to this approach:

- The other module is already being used and depended on in the wild
- The other module has (often) gone through revisions to fix edge cases
- The other module has its own tests, versioning, documentation, issue tracking, etc
- It reduces code duplication (e.g. in the case of browserify)

When you can't find a suitable dependency, or when the only dependencies are dangerous to depend on (i.e. no testing, unstable API, poorly written), this is where you could take it upon yourself to split the code into its own module. 

It is also better to prefer small dependencies rather than broad "libraries." For example, if your module needs a debounce function, it would be best to depend on [debounce](https://www.npmjs.org/package/debounce) or [lodash.debounce](https://www.npmjs.org/package/lodash.debounce) rather than all of lodash.

## discoverability

You should make sure your module has these things:

- a `README.md` file that describes the module, gives a short code example, and documents its public API
- a `repository` field in package.json 
- common `keywords` listed in package.json
- a clear `description` in package.json
- a `license` field in package.json

This will improve the discoverability of your module through Google and npm search, and also give more confidence to people who may want to depend on your code. Better discoverability means less fragmentation overall, which means tighter and better tested application code.

The license is also important for large companies to justify using your module to their legal teams.

For more tips on module creation workflow, [see here](http://mattdesl.svbtle.com/faster-and-cleaner-modules).

## constructor best practices

This is a controversial topic for a lot of devs; but I've found the best approach is to hide the `new` keyword when you need to export a class, and parameters should be passed in an `options` object. This leads to a clear and consistent end-user API, and hides internal implementation details of your module. 

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

This allows the module to be required and instantiated inline, like so:

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

For front-end modules, you may need to test in the browser. For this I encourage [beefy](https://www.npmjs.org/package/beefy) to avoid redundant HTML and build step boilerplate. You can use modules like [lorem-ipsum](https://www.npmjs.org/package/lorem-ipsum), [baboon-image](https://www.npmjs.org/package/baboon-image) and [baboon-image-uri](https://www.npmjs.org/package/baboon-image-uri) for placeholder text and images.

For 2D and WebGL canvas-based demos, I tend to use [canvas-testbed](https://www.npmjs.org/package/canvas-testbed) to reduce boilerplate and produce consistent results across device pixel ratios. Example [here](https://github.com/mattdesl/gl-vignette-background/blob/master/demo/index.js).

Dependencies used in tests and demos should be installed as `devDependencies` like so:  

```npm install canvas-testbed --save-dev```

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

This makes it easier to compose with other modules, and avoids the problems of constantly "boxing and unboxing" objects across different libraries. 

For more advanced data types, like [simplicial-complex](https://www.npmjs.org/package/simplicial-complex), you should still aim to be generic where possible, using bare objects.

If you need a higher level wrapper (for example, a Sphere class which has its own color, transforms, WebGL buffers, etc) it would be better to build that wrapper on top of a generic module. See [icosphere](https://www.npmjs.org/package/icosphere) for example:

```js
//gives us { positions, cells }
var mesh = require('icosphere')(2)

module.exports = function sphere() {
    // .. app-specific code that uses generic mesh
}
```

For low-level and performance critical functions operating on these data types, you may want to provide an optional `out` parameter for re-using arrays/objects, to avoid thrashing the garbage collector. Examples: [texcoord](https://www.npmjs.org/package/texcoord), [lerp-array](https://www.npmjs.org/package/lerp-array). Be weary of Array `map/reduce/forEach` which could cause problems if your second or third parameter is the optional `out`. 

## npmignore

It is a good idea to add an `.npmignore` to your package, which leads to quicker installs. You can ignore most files, like tests, example code, generated API docs, etc. This way, users installing your module just get the bare essentials.

## task running

If you have a build task (like [UMD](https://github.com/umdjs/umd) or a test runner) it is better to keep this small and light by just adding it to your `npm scripts`. For these simple tasks, gulp/grunt is often overkill and increases the bloat and install time of your module. 

In `package.json`:

```js
  "scripts": {
    "bundle": "browserify foo.js -s Foo -o build/foo.js",
    "uglify": "uglifyjs build/foo.js -cm > build/foo.min.js",
    "build": "npm run bundle && npm run uglify"
  }
```

And then, to build:

```npm run build```

If you're writing small CommonJS modules, you typically won't need to have any tasks except a test runner. You don't need to list `browserify` as a devDependency since the module is assumed to work in any CommonJS bundler (webpack, DuoJS, browserify, etc). 

**Note:** One drawback of this approach is that it often encourages Unix-only features like piping. 

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

Occasionally you will find it useful to provide end users with a non-standard entry point, such as a higher-order function or explicit requires. This is especially useful for front-end code, where bundle size and non-Node frameworks becomes a concern.

Examples:  

- [gl-mat4](https://www.npmjs.org/package/gl-mat4) - splitting @toji's gl-matrix library into separate files for smaller bundle size
- [three-effectcomposer](https://www.npmjs.org/package/three-effectcomposer) - a ThreeJS plugin using a higher-order function 
- [global](https://github.com/Raynos/global) - multiple entry points for different globals

The subject is discussed in more detail in the [Entry Points](https://github.com/mattdesl/module-best-practices/wiki/Entry-Points) wiki page.

## more ... ? 

Feel free to submit issues/PRs to this repo if you have suggestions or comments. 