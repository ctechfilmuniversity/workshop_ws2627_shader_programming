---
layout: default
title: Code
nav_exclude: true
---


# A Wavy Situation

This tutorial is based on Bruno Simon's excellent course *three.js journey*, specifically on the [lesson "Raging Sea"](https://threejs-journey.com/lessons/raging-sea).

We are going to create a mixture of different waves and make all values controllable through a user interface. The waves are based on sine curves and a Perlin turbulence noise.

This is a good exercise to become more familiar with the basic shader pipeline and how data is send through it.

We start where the [shader pipeline tutorial](../01_shader_pipeline/shader_pipeline_steps.md) ended: a plane with a `ShaderMaterial`, the shader files `shader/wavy.vert` and `shader/wavy.frag`, and a `uTime` uniform.


* [Big Waves](#big-waves)
    * [The GUI (lil-gui)](#the-gui-lil-gui)
    * [Hint](#hint)
* [Colors](#colors)
* [Small Waves](#small-waves)
    * [Turbulence Noise](#turbulence-noise)
* [References](#references)


## Big Waves

The basic idea is something like `modelPosition.y += sin(modelPosition.x);`. But we want to control the waves' amplitude, frequency and speed in a user interface while the scene is running. The overall setup is:

1. Store each value as a custom **uniform** in the material.
2. Connect each uniform to a slider in the **GUI**.
3. Use the uniforms in the **vertex shader**.

Because three.js sends the uniform values to the GPU every frame, any change in the GUI is visible immediately.

**▶ TODO** in `scene.js` -> Add new uniforms for the big waves to the material (and `uTime`, if it isn't there yet):

```js
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {

        uTime: { value: 0 },

        uBigWavesAmplitude: { value: 0.1 },
        uBigWavesFrequency: { value: 6 },
        uBigWavesSpeed: { value: 0.75 }
    }
});
```

* `uBigWavesAmplitude` -- how high the waves are.
* `uBigWavesFrequency` -- how many waves fit on the plane.
* `uBigWavesSpeed` -- how fast the waves move.

**▶ TODO** in `scene.js` -> Only if you haven't set up `uTime` yet: create a timer and update `uTime` in the `animate()` function:

```js
const timer = new THREE.Timer();

// Scene render loop
const animate = () => {

    timer.update();
    const elapsedTime = timer.getElapsed();
    material.uniforms.uTime.value = elapsedTime;

    ...
}
```


### The GUI (lil-gui)

[lil-gui](https://lil-gui.georgealways.com/) is a small library that creates a panel with sliders, color pickers, checkboxes etc. in the top-right corner of the page. It's already installed in the project and imported at the top of `scene.js`:

```js
import GUI from 'lil-gui';
```

**How it works:** lil-gui doesn't get a *value*, it gets an **object and the name of one of its properties**. When you move a slider, lil-gui writes the new number into that property of that object:

```js
gui.add(object, 'propertyName')
```

Internally, every time you move the slider, lil-gui does nothing more than this:

```js
object['propertyName'] = newSliderValue;
```

So we give lil-gui the uniform object and the name of the property that holds the number:

```js
gui.add(material.uniforms.uBigWavesAmplitude,   'value')
//      └──────────── object ──────────────┘  └ property ┘
```

When you move the slider, lil-gui runs `material.uniforms.uBigWavesAmplitude['value'] = newSliderValue`, which changes the number *inside the material*.

Why not just pass the number? In JavaScript, numbers are **copied** when you pass them on, while objects are **shared**:

```js
let amplitude = material.uniforms.uBigWavesAmplitude.value;  // amplitude is a copy: 0.1
amplitude = 0.5;                                             // only the copy changes
// material.uniforms.uBigWavesAmplitude.value is still 0.1
```

With an object, lil-gui and the material both point to the *same* object, so a change made by lil-gui is also a change in the material.

What happens after the slider moves? Every frame, `renderer.render(scene, camera)` reads `material.uniforms.uBigWavesAmplitude.value` and sends it to the GPU, where the shader receives it as `uniform float uBigWavesAmplitude`. 

You don't need to write any extra code for the update. Changing `.value` is enough.

lil-gui picks the kind of control from the type of the property: a number becomes a slider (when you set `min` and `max`) or a number field, `true`/`false` becomes a checkbox, a string becomes a text field, and a function becomes a button.

The settings are added as a chain of methods:

* `.min(0)` / `.max(1)` -- the range of the slider.
* `.step(0.001)` -- the smallest change per step.
* `.name('...')` -- the label shown in the panel. Without it, lil-gui shows the property name, which would be `value` for every uniform.

**▶ TODO** in `scene.js` -> Create the GUI at the top, below the imports:

```js
// User Menu
const gui = new GUI();
```

**▶ TODO** in `scene.js` -> Connect amplitude, frequency and speed to the GUI, **after** the material has been created (the material must exist before you can reference its uniforms):

```js
// GUI
gui.add(material.uniforms.uBigWavesAmplitude, 'value')
    .min(0).max(1).step(0.001)
    .name('Big Waves Amplitude');

gui.add(material.uniforms.uBigWavesFrequency, 'value')
    .min(0).max(12).step(0.001)
    .name('Big Waves Frequency');

gui.add(material.uniforms.uBigWavesSpeed, 'value')
    .min(0).max(4).step(0.001)
    .name('Big Waves Speed');
```

You should now see a panel with three sliders in the top-right corner. They don't do anything visible yet, because the shader doesn't use the uniforms yet.

**Tip (optional):** With many controls, you can group them into collapsible folders: `const bigWavesFolder = gui.addFolder('Big Waves');` and then `bigWavesFolder.add(...)` instead of `gui.add(...)`.

**▶ TODO** in `shader/wavy.vert` -> Declare the uniforms above `main()` and replace the content of `main()`:

```glsl
uniform float uTime;
uniform float uBigWavesAmplitude;
uniform float uBigWavesFrequency;
uniform float uBigWavesSpeed;

...


void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float waves = sin(modelPosition.x * uBigWavesFrequency + uTime * uBigWavesSpeed) *
                  sin(modelPosition.z * uBigWavesFrequency + uTime * uBigWavesSpeed) *
                  uBigWavesAmplitude;

    modelPosition.y += waves;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
```

* The plane lies flat, so its surface spreads along `x` and `z`, and `y` is the height.
* One `sin` creates waves along `x`, the other along `z`. Multiplying them creates a grid of hills and valleys, like an egg carton.
* `* uBigWavesFrequency` sets how many waves there are, `+ uTime * uBigWavesSpeed` moves them over time, and `* uBigWavesAmplitude` scales the height.
* We store the result in a variable `waves` because we will extend it with small waves and also need it for the colors.

Now move the sliders and watch the waves change.

### Hint

The waves would benefit from having separate frequencies for `x` and `z`. Consider splitting `uBigWavesFrequency` into `uBigWavesFrequencyX` and `uBigWavesFrequencyZ` (uniform, GUI slider and vertex shader).


## Colors

Before we add smaller waves, let's improve the coloring, so we can see the details better. We want two colors, one for the depth (low areas) and one for the surface (high areas), and we want to choose both in the GUI.

A color uniform holds a `THREE.Color` object, which stores red, green and blue as numbers from 0 to 1. The color picker of lil-gui works best with a color as a hex string like `'#00d0ff'`. So we keep the colors as strings in a helper object, `guiData`, connect the color picker to that object, and copy every change into the uniform with an `onChange` function.

**▶ TODO** in `scene.js` -> Create the helper object with the two start colors, below `const gui = new GUI();`:

```js
const guiData = { };

guiData.surfaceColor = '#00d0ff';
guiData.depthColor = '#230048';
```

**▶ TODO** in `scene.js` -> Add two uniforms for the colors and two values that control how they are mixed, inside `uniforms: { ... }`:

```js
        uDepthColor: { value: new THREE.Color(guiData.depthColor) },
        uSurfaceColor: { value: new THREE.Color(guiData.surfaceColor) },
        uColorOffset: { value: 0.25 },
        uColorMultiplier: { value: 2 },
```

`new THREE.Color('#230048')` turns the hex string into a `THREE.Color`. In the shader, it arrives as a `vec3` (red, green, blue).

**▶ TODO** in `scene.js` -> Add all four values to the GUI, below the big waves controls:

```js
gui.addColor(guiData, 'surfaceColor')
    .onChange(() => {
        material.uniforms.uSurfaceColor.value.set(guiData.surfaceColor);
    });

gui.addColor(guiData, 'depthColor')
    .onChange(() => {
        material.uniforms.uDepthColor.value.set(guiData.depthColor);
    });

gui.add(material.uniforms.uColorOffset, 'value')
    .min(0).max(1).step(0.001)
    .name('Color Offset');

gui.add(material.uniforms.uColorMultiplier, 'value')
    .min(0).max(10).step(0.001)
    .name('Color Multiplier');
```

* `gui.addColor(...)` creates a color picker instead of a slider.
* `.onChange(() => { ... })` runs the function every time the color is changed in the picker.
* `.value.set(...)` updates the existing `THREE.Color` of the uniform with the new hex string.

The fragment shader needs to know how high each point is to choose its color. The height is calculated in the vertex shader (`waves`), so we pass it on with a **varying**.

**▶ TODO** in `shader/wavy.vert` -> Declare a varying above `main()` and assign it inside `main()`, after `waves` has been calculated:

```glsl
varying float vWaves;               // above main()

...

vWaves = waves;                     // inside main(), after the waves calculation
```

**▶ TODO** in `shader/wavy.frag` -> Declare the uniforms and the varying above `main()`, and replace the content of `main()`:

```glsl
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vWaves;

void main() {

    float colorMix = (vWaves + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, colorMix);

    gl_FragColor = vec4(color, 1.0);
}
```

* `vWaves` is small (around -0.1 to 0.1 with the default amplitude), so we can't use it directly as the mix factor, which should be between 0 and 1.
* `+ uColorOffset` shifts the value up, so that more of the surface gets the surface color.
* `* uColorMultiplier` stretches the value, so that the contrast between depth and surface gets stronger.
* `mix(uDepthColor, uSurfaceColor, colorMix)` blends between the two colors: `0.` gives the depth color, `1.` the surface color.

Play with the offset and multiplier sliders until the waves look good.

<!-- 

### Colors Look Darker Than in the Picker?

three.js converts colors you pick (sRGB, as on the web) into an internal *linear* color space for calculations. Built-in materials convert the result back before it's shown on screen. Our own shader doesn't do this automatically, so the colors may look darker or more saturated than in the color picker.

**▶ TODO (optional)** -> `shader/wavy.frag` -> Add this line at the end of `main()`, after `gl_FragColor`, to convert the output back:

```glsl
    #include <colorspace_fragment>
```

`#include <...>` inserts a piece of shader code that three.js provides. This only works with `ShaderMaterial`, not with `RawShaderMaterial`. 

-->


## Small Waves

For the small waves, we are going to use the [Classic Perlin 3D Noise](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83) by Stefan Gustavson. **Noise** is a function that returns smooth, natural-looking random values: points that are close together get similar values. High-quality noise is notoriously difficult to create, so if possible, use a verified version from an expert.

`cnoise()` takes a 3D position (`vec3`) and returns a value between roughly -1 and 1. Our plane only needs two coordinates (`x` and `z`), so we pass `uTime` as the third coordinate. Moving through that third dimension over time makes the noise change smoothly, like moving water.

**▶ TODO** in `shader/wavy.vert` -> Copy the following code into the vertex shader, above `main()` (functions must be defined before they are used):

```glsl
// Classic Perlin 3D Noise
// by Stefan Gustavson
//
vec4 permute(vec4 x) {

    return mod(((x*34.0)+1.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {

    return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t) {

    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P) {

    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}
```

You don't need to understand this code in detail. What matters is how we *use* it.

**▶ TODO** in `shader/wavy.vert` -> Add the noise to the waves inside `main()`, directly after the big waves calculation:

```glsl
    waves += cnoise(vec3(modelPosition.xz * 6., uTime * 0.1)) * 0.2;
```

* `modelPosition.xz * 6.` -- the position on the plane; `6.` is the frequency (how small the noise details are).
* `uTime * 0.1` -- the third coordinate, which slowly changes the noise over time.
* `* 0.2` -- the amplitude (how strong the noise is).

**▶ TODO (optional)** -> `shader/wavy.vert` -> To create sharp ridges instead of round hills, **replace** the line above with this one (this is up to taste):

```glsl
    waves -= abs(cnoise(vec3(modelPosition.xz * 6., uTime * 0.1)) * 0.2);
```

`abs()` turns all negative noise values into positive ones. Where the noise crosses zero, this creates a sharp V shape. Because we *subtract* it, the V points upwards and forms a sharp crest, like a breaking wave.

### Turbulence Noise

For more detail, we add the small waves from the previous step multiple times, each time with a higher frequency and a lower amplitude. Each layer is called an **octave**, and the result is called **turbulence**: big shapes from the first octave, finer and finer details from the following ones.

**▶ TODO** in `shader/wavy.vert` -> Replace the single noise line with a loop:

```glsl
    for(float i = 1.0; i <= 3.0; i++) {

        waves -= abs(cnoise(vec3(modelPosition.xz * 3.0 * i, uTime * 0.2)) * 0.15 / i);
    }
```

* `i` counts the octaves: 1, 2, 3.
* `* i` multiplies the frequency, so each octave is finer.
* `/ i` divides the amplitude, so each octave is weaker.
* In WebGL shaders, a loop needs a fixed number of steps (here, `3.0`), which the GPU knows before it runs the shader.

**▶ TODO** in `scene.js` -> For finer details, increase the subdivisions of the plane:

```js
const geometry = new THREE.PlaneGeometry(1, 1, 512, 512);
```

The vertex shader can only move vertices that exist. 512 × 512 segments give about 263,000 vertices instead of 16,600, so the small waves get much smoother. On slow computers, try 256 if the animation stutters.

**▶ TODO** in `scene.js` -> As with the big waves, add uniforms for the small waves, inside `uniforms: { ... }`:

```js
        uSmallWavesAmplitude: { value: 0.15 },
        uSmallWavesFrequency: { value: 3 },
        uSmallWavesSpeed: { value: 0.2 },
```

**▶ TODO** in `scene.js` -> Add the GUI controls for them, below the other GUI controls:

```js
gui.add(material.uniforms.uSmallWavesAmplitude, 'value')
    .min(0).max(1).step(0.001)
    .name('Small Waves Amplitude');

gui.add(material.uniforms.uSmallWavesFrequency, 'value')
    .min(0).max(30).step(0.001)
    .name('Small Waves Frequency');

gui.add(material.uniforms.uSmallWavesSpeed, 'value')
    .min(0).max(4).step(0.001)
    .name('Small Waves Speed');
```

**▶ TODO** in `shader/wavy.vert` -> Declare the uniforms above `main()`, and replace the fixed numbers in the loop with them:

```glsl
uniform float uSmallWavesAmplitude;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;

...

    for(float i = 1.0; i <= 3.0; i++) {

        waves -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesAmplitude / i);
    }
```

The uniforms replace exactly the numbers from before: `3.0` → `uSmallWavesFrequency`, `0.2` → `uSmallWavesSpeed`, `0.15` → `uSmallWavesAmplitude`.

Now you have a wavy scene that is fully controllable with the GUI.


## References

[[1] Bruno Simon. 2024. three.js journey - Lesson Raging Sea.](https://threejs-journey.com/lessons/raging-sea)

[[2] lil-gui documentation.](https://lil-gui.georgealways.com/)
