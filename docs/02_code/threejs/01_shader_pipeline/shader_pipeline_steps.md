---
layout: default
title: Code
nav_exclude: true
---


# A Basic Shader Pipeline with three.js

This tutorial is based on Bruno Simon's excellent course *three.js journey*, specifically on the [lesson "Shaders"](https://threejs-journey.com/lessons/shaders).

We start from the basic scene with a white plane (`MeshBasicMaterial`) and replace its material step by step with our own shaders. At the end, the plane moves in waves and is colored by random values.

**Tip:** Install the Visual Studio Code extension [Shader languages support for VS Code](https://marketplace.visualstudio.com/items?itemName=slevesque.shader) for syntax highlighting in shader files.


* [Raw Shader Material](#raw-shader-material)
* [Add Inline Shader Code](#add-inline-shader-code)
    * [`precision mediump float;`](#precision-mediump-float)
* [Separate Shader Files](#separate-shader-files)
    * [Setup (Explanation Only)](#setup-explanation-only)
        * [`package.json`](#packagejson)
        * [`vite.config.js`](#viteconfigjs)
* [scene.js](#scenejs)
* [Adjustments to the Vertices](#adjustments-to-the-vertices)
* [Uniform](#uniform)
* [Attribute](#attribute)
* [Varying](#varying)
* [ShaderMaterial](#shadermaterial)
* [References](#references)


### Quick recap: what is a shader?

A shader is a small program that runs on the GPU. A material in three.js always consists of two shaders:

| Shader              | Runs ...                  | Job                                           | Main output    |
| ------------------- | ------------------------- | --------------------------------------------- | -------------- |
| **Vertex shader**   | once per vertex           | decides *where* each vertex ends up on screen | `gl_Position`  |
| **Fragment shader** | once per pixel (fragment) | decides *which color* each pixel gets         | `gl_FragColor` |

Between the two, the GPU fills the triangles formed by the vertices with pixels (rasterization).

There are three ways to get data from JavaScript into the shaders, and one way to pass data from the vertex to the fragment shader. They are covered in the sections [Uniform](#uniform), [Attribute](#attribute) and [Varying](#varying):

| Type        | Value is ...                                                   | Available in             | Naming convention |
| ----------- | -------------------------------------------------------------- | ------------------------ | ----------------- |
| `uniform`   | the same for all vertices and pixels                           | vertex + fragment shader | `uName`           |
| `attribute` | different for every vertex                                     | vertex shader only       | `aName`           |
| `varying`   | passed from vertex to fragment shader, interpolated in between | vertex → fragment shader | `vName`           |


## Raw Shader Material

**▶ TODO** in `scene.js` -> Replace the `MeshBasicMaterial` with a `RawShaderMaterial`:

```js
const material = new THREE.RawShaderMaterial({
    vertexShader: ``,
    fragmentShader: ``,
    side: THREE.DoubleSide
});
```

* `vertexShader` and `fragmentShader` take the shader code as a **string**.
* We use backticks (`` ` ``) instead of quotes, because backtick strings (template literals) can span multiple lines.
* *Raw* means that three.js adds nothing to our shader code. We have to declare everything ourselves. (Compare this with [ShaderMaterial](#shadermaterial) at the end.)

With empty shaders, nothing is drawn yet, and the browser console shows a shader error. That's expected.


## Add Inline Shader Code

This is a temporary step for demonstration. We will move the code into separate files in the next section.

**▶ TODO** in `scene.js` -> Fill in the shader code:

```js
const material = new THREE.RawShaderMaterial({
    vertexShader: `
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;

        attribute vec3 position;

        void main() {

            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision mediump float;

        void main() {

            gl_FragColor = vec4(1., 0., 1., 1.);
        }
    `,
    side: THREE.DoubleSide
});
```

The plane should now be **magenta**.

**Vertex shader**

* `position` is an `attribute`: the position of the current vertex, as stored in the geometry. three.js sends it automatically.
* The three matrices are `uniform`s, which three.js also fills in automatically:
    * `modelMatrix` -- moves the vertex from the object's local space into the world (applies the mesh's position, rotation and scale).
    * `viewMatrix` -- moves the world so that it is seen from the camera.
    * `projectionMatrix` -- applies the perspective of the camera (field of view, near/far).
* `vec4(position, 1.0)` turns the 3D position into a 4D vector, which is needed to multiply it with a 4×4 matrix.
* The result goes into `gl_Position`, a built-in output variable.

**Fragment shader**

* `gl_FragColor` is the built-in output for the pixel color, as `vec4(red, green, blue, alpha)` with values from `0.` to `1.`.
* `vec4(1., 0., 1., 1.)` is full red + full blue = magenta, fully opaque.
* Note the dots: in GLSL, `1.` is a float and `1` is an integer. Mixing them up often causes compile errors.


### `precision mediump float;`

This instruction sets how precise a float can be. Possible values are `highp`, `mediump` and `lowp`.

`highp` can create a performance hit and might not even work on some devices. `lowp` can create bugs due to the lack of precision. We ordinarily use `mediump`. We could also set the precision in the vertex shader, but it's not required there. [[1]](https://threejs-journey.com/lessons/shaders)

Today, practically all devices support `highp` in the fragment shader. Switch to `highp` once you use time-based values (see [Uniform](#uniform)): with `mediump`, `sin(... + uTime)` can start to stutter on mobile GPUs after the page has been open for a while.


## Separate Shader Files

Shader code inside JavaScript strings has no syntax highlighting and quickly gets hard to read. So we move it into separate files.

**▶ TODO** in Inside the `src` folder, create a folder `shader` with two empty files:

```
src/
└── shader/
    ├── shader_pipeline.vert    ← vertex shader
    └── shader_pipeline.frag    ← fragment shader
```

**▶ TODO** in `shader/shader_pipeline.vert` -> Copy the vertex shader code from the previous step into the file (without the backticks):

```glsl
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;

void main() {

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
```

**▶ TODO** in `shader/shader_pipeline.frag` -> Copy the fragment shader code into the file:

```glsl
precision mediump float;

void main() {

    gl_FragColor = vec4(1., 0., 1., 1.);
}
```

### Setup (Explanation Only)

The browser can't import a `.vert` or `.frag` file directly. The Vite plugin `vite-plugin-glsl` takes care of this by reading the content of a shader file and handing it to `scene.js` as a string.

The project you start with is already set up for this: `package.json` and `vite.config.js` are complete, and you don't need to change them. Running `npm install` once in the project folder (the folder that contains `package.json`) installs everything. This section explains what's in the two files and why.

#### `package.json`

**(Already done, for your information)**

`package.json` is the project's description file. It lists the scripts (e.g. `npm run dev`) and the packages the project needs:

```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "type": "module",
    "dependencies": {
        "lil-gui": "^0.21.0",
        "three": "^0.186.1"
    },
    "devDependencies": {
        "vite": "^8.3.5",
        "vite-plugin-glsl": "^1.6.2"
    }
}
```

**`"type": "module"`**

Node.js knows two ways of writing JavaScript modules: the older *CommonJS* (`require(...)`, `module.exports`) and the modern *ES modules* (`import ...`, `export ...`). By default, Node.js reads `.js` files as CommonJS. Our `vite.config.js` uses `import` and `export`, so `"type": "module"` tells Node.js that all `.js` files in this project are ES modules. Without it, Vite prints a warning on start, and future Vite versions won't load the config at all. Its position in the file doesn't matter.

**`dependencies` and `devDependencies`**

* `dependencies` -- packages our code uses in the browser: `three` and `lil-gui`. They become part of the finished website.
* `devDependencies` -- tools we only need while developing and building: `vite` (the dev server and bundler) and `vite-plugin-glsl` (the shader import).


#### `vite.config.js`

**(Already done, for your information)**

`vite.config.js` configures Vite, the development server you start with `npm run dev`:

```js
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';


export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    plugins: [glsl()]
});
```

* `import { defineConfig } from 'vite';` -- a helper function that wraps the configuration. Code editors use it to offer autocompletion for the options.
* `import glsl from 'vite-plugin-glsl';` -- loads the shader plugin.
* `root: 'src/'` -- Vite serves the project from the `src` folder.
* `publicDir: '../static/'` -- files in the `static` folder (e.g. textures) are served as they are.
* `build.outDir: '../dist'` -- `npm run build` writes the finished site to `dist` next to `src` (without this line, it would end up inside `src`). `emptyOutDir: true` clears that folder before each build.
* `plugins: [glsl()]` -- activates the shader plugin. From now on, `import ... from './shader/shader_pipeline.vert'` gives you the file's content as a string.

Vite reads `vite.config.js` only when it starts. If you ever change the file or install new packages, stop the dev server (`Ctrl + C`) and restart it with `npm run dev`.

## scene.js

**▶ TODO** in `scene.js` -> Import the shader files at the top, below the other imports:

```js
import vertexShader from './shader/shader_pipeline.vert';
import fragmentShader from './shader/shader_pipeline.frag';
```

**▶ TODO** in `scene.js` -> Use the imported strings in the material (replacing the inline code):

```js
const material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
});
```

(You can adjust file names and paths to your liking.)

Your browser should now show the same magenta plane as before.


## Adjustments to the Vertices

Now you are free to explore creative coding adjustments. Usually, we want to do this in world space, meaning after applying the `modelMatrix`. For this, we split the single `gl_Position` line into two steps.

**▶ TODO** in `shader/shader_pipeline.vert` -> Replace the `gl_Position` line inside `main()` with:

```glsl
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    modelPosition.y += sin(modelPosition.x * 20.) * 0.1;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
```

* `modelPosition` is the vertex position in the world.
* We change its height (`y`) depending on its `x` position, which creates waves along the x axis.
* `20.` is the **frequency** (how many waves), `0.1` is the **amplitude** (how high the waves are). Try other values.
* This only looks smooth because the plane has many vertices (`PlaneGeometry(1, 1, 128, 128)`). The vertex shader can only move vertices that exist.


## Uniform

The goal is to create a time value and pass it to the shader for animation. This time value must be the same for every vertex and every pixel, so we use a `uniform` for it. Uniforms can be accessed in both the vertex and the fragment shader.

**▶ TODO** in `scene.js` -> Add a `uniforms` object to the material:

```js
const material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {

        uTime: { value: 0 }
    }
});
```

Each uniform is an object with a `value` property. three.js sends this value to the GPU every time it draws.

**▶ TODO** in `scene.js` -> Create a timer and update `uTime` in the `animate()` function:

```js
const timer = new THREE.Timer();

const animate = () => {

    timer.update();
    const elapsedTime = timer.getElapsed();
    material.uniforms.uTime.value = elapsedTime;
    ...
}

renderer.setAnimationLoop(animate);
```

`elapsedTime` is the time in seconds since the page was loaded. `THREE.Timer` replaces the older `THREE.Clock`, which has been deprecated since three.js r183. `timer.update()` must be called once per frame, before reading the time.

**▶ TODO** in `shader/shader_pipeline.vert` -> Declare the uniform above `main()` and use it inside `main()`:

```glsl
uniform float uTime;                // above main(), next to the other uniforms

...

modelPosition.y += sin(modelPosition.x * 20. + uTime) * 0.1;   // inside main(), replaces the previous sin line
```

Adding `uTime` inside the `sin` shifts the wave a bit further every frame, so the waves move.

**▶ TODO (optional)** -> `shader/shader_pipeline.frag` -> If your movement is too rough, increase the precision (see [precision](#precision-mediump-float)):

```glsl
precision highp float;
```


## Attribute

The goal is to create a random value for each vertex and send it as an attribute to the vertex shader. In the vertex shader, we use that random value as an offset for the vertex's y position, in addition to the sine animation.

**▶ TODO** in `scene.js` -> Create the random values, after the geometry:

```js
// Random Value Generation for the Shader
const countVertices = geometry.attributes.position.count;
const randoms = new Float32Array(countVertices);

for (let i = 0; i < countVertices; i++) {

    randoms[i] = Math.random();
}
```

* `geometry.attributes.position.count` is the number of vertices of the plane (129 × 129 = 16,641).
* A `Float32Array` is an array of 32-bit floats, the format the GPU expects.
* `Math.random()` returns a value between `0` and `1`.

**▶ TODO** in `scene.js` -> Send the random values as a custom attribute, directly after the loop:

```js
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
```

The name `'aRandom'` must match the attribute name in the shader. The signature of `BufferAttribute` is:

```js
BufferAttribute( array : TypedArray, itemSize : Integer, normalized : Boolean )
```

* `array` -- the data.
* `itemSize` -- the number of values in the array that belong to one vertex. For instance, if the attribute stores a 3-component vector (such as a position, normal or color), `itemSize` should be 3. Here, it's just 1 random value per vertex, so we use 1.
* `normalized` -- (optional) applies to integer data only. It sets how the data in the buffer maps to the values in the GLSL code. For instance, if `array` is a `Uint16Array` and `normalized` is `true`, the values 0 to 65535 in the array are mapped to 0.0 to 1.0 in the GLSL attribute. An `Int16Array` (signed) would map from -32768 to 32767 to -1.0 to 1.0. If `normalized` is `false`, the values are converted to floats unmodified, i.e. 32767 becomes 32767.0.

[[threejs.org - BufferAttribute]](https://threejs.org/docs/#api/en/core/BufferAttribute)

**▶ TODO** in `shader/shader_pipeline.vert` -> Declare the attribute above `main()` and use it inside `main()`:

```glsl
attribute float aRandom;            // above main(), next to attribute vec3 position;

...

modelPosition.y += aRandom * 0.05;  // inside main(), after the sin line
```

Every vertex is now lifted by a different random amount (up to 0.05), which makes the surface spiky.


## Varying

The goal is to reuse `aRandom` in the fragment shader to control the surface color. However, attributes can't be accessed in the fragment shader. Instead, we send the data from the vertex shader to the fragment shader as a `varying`.

**▶ TODO** in `shader/shader_pipeline.vert` -> Declare the varying above `main()` and give it a value inside `main()`:

```glsl
varying float vRandom;              // above main()

...

vRandom = aRandom;                  // inside main()
```

**▶ TODO** in `shader/shader_pipeline.frag` -> Declare the same varying above `main()`:

```glsl
varying float vRandom;
```

**▶ TODO** in `shader/shader_pipeline.frag` -> Use the value inside `main()`, either as a gray value:

```glsl
gl_FragColor = vec4(vec3(vRandom), 1.);
```

or to blend between two colors:

```glsl
// Interpolate with the random values between two colors
vec3 color = mix(vec3(1., 0., 1.), vec3(1.0, 0.9843, 0.0), vRandom);

gl_FragColor = vec4(color, 1.);
```

`mix(a, b, t)` blends linearly between `a` and `b`: for `t = 0.` the result is `a` (magenta), for `t = 1.` it is `b` (yellow), and values in between give a mix of both.

Keep in mind that varying values are interpolated between the vertices. If the GPU is drawing a fragment right between two vertices, one with a varying of 1.0 and the other with 0.0, the fragment gets the value 0.5. [[1]](https://threejs-journey.com/lessons/shaders)


## ShaderMaterial

So far, we have taken all the necessary steps ourselves, as required for `RawShaderMaterial`. `ShaderMaterial` works the same way, but three.js automatically adds commonly used uniforms and attributes at the beginning of the shader code. The precision is also set automatically (to `highp` by default).

**▶ TODO** in `scene.js` -> Replace `RawShaderMaterial` with `ShaderMaterial` (keep everything inside the brackets as it is):

```js
const material = new THREE.ShaderMaterial({
    ...
});
```

**▶ TODO** in `shader/shader_pipeline.vert` and `shader/shader_pipeline.frag` -> Delete these lines (whichever of them are in the file):

```diff
- uniform mat4 projectionMatrix;
- uniform mat4 viewMatrix;
- uniform mat4 modelMatrix;
- attribute vec3 position;
- attribute vec2 uv;
- precision mediump float;
```

(`attribute vec2 uv;` only if you added it; for `precision`, also delete it if you switched to `highp`.)

**Keep your own declarations** (`uniform float uTime;`, `attribute float aRandom;`, `varying float vRandom;`). three.js only adds its built-in ones. If you declare a built-in one again, the shader fails to compile with a "redefinition" error.

Everything should work just like before, because `ShaderMaterial` adds those elements automatically. [[1]](https://threejs-journey.com/lessons/shaders)


## References

[[1] Bruno Simon. 2024. three.js journey - Lesson Shaders.](https://threejs-journey.com/lessons/shaders)
