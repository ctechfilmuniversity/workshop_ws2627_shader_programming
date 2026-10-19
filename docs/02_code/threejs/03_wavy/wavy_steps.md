---
layout: default
title: Code
nav_exclude: true
---


# A Wavy Situation

Tutorial is based on Brunos excellent tutorial three.js journey, specifically on [Lesson - Shader] (https://threejs-journey.com/lessons/shaders).

We are going to create a mixture of different waves and make all values controllable by an user interface. The waves are based on sin curves and a Perlin turbulence noise.

* [A Wavy Situation](#a-wavy-situation)
    * [Big Waves](#big-waves)
        * [Hint](#hint)
    * [Colors](#colors)
    * [Small Waves](#small-waves)
        * [Turbulence Noise](#turbulence-noise)
    * [References](#references)


## Big Waves

The base code is along the lines of `modelPosition.y += sin(modelPosition.x);`. But we want to make the waves' frequency controllable in the interface. The overall setup is to add custom uniforms that can be adjusted through the UI and sending those uniforms to the shaders.

* Create new uniforms for the big waves in `scene.js` (also add the time, while we are at it):

```
const material = new THREE.RawShaderMaterial({
    vertexShader:wavyVertexShader,
    fragmentShader:wavyFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {

        uTime: { value: 0 },

        uBigWavesAmplitude: { value: 0.1 },
        uBigWavesFrequency: { value: 6 },
        uBigWavesSpeed: { value: 0.75 }
    } 
});
```

In case you haven't set up `uTime` yet:

```
const clock = new THREE.Clock();

const animate = () => {

    const elapsedTime = clock.getElapsedTime();
    material.uniforms.uTime.value = elapsedTime;
    ...
}
```

* Make amplitude, frequency and speed accessible through the UI in in `scene.js`:

```
const gui = new GUI();
const guiData = { };

...
gui.add(material.uniforms.uBigWavesAmplitude, 'value')
    .min(0).max(1).step(0.001)
    .name('Big Waves Amplitude ');

gui.add(material.uniforms.uBigWavesFrequency, 'value')
    .min(0).max(12).step(0.001)
    .name('Big Waves Frequency');

gui.add(material.uniforms.uBigWavesSpeed, 'value')
    .min(0).max(4).step(0.001)
    .name('Big Waves Speed');
```

* Use those uniforms in the vertex shader

```
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

### Hint

The waves would benefit from having separate values for the frequency in x and z. Consider to separate `uBigWavesFrequency` in uBigWavesFrequencyX and `uBigWavesFrequencyZ` in `scene.js`.

## Colors

Before we add smaller waves, let's adjust the coloring to see details better. We want two colors, one for the depth and one for the surface.

To make colors accessible through the UI, we have to use a workaround through a helper object and an `onChange` event to pipe changes:

```
const guiData = { };

guiData.surfaceColor = '#00d0ff';
guiData.depthColor = '#230048';
```


* Add two custom uniforms for the colors and two more control values for the mixing between the color:

```
        uDepthColor: { value: new THREE.Color(guiData.depthColor) },
        uSurfaceColor: { value: new THREE.Color(guiData.surfaceColor) },
        uColorOffset: { value: 0.25 },
        uColorMultiplier: { value: 2 },
```

* Add all values to the UI:

```
gui.addColor(guiData, 'surfaceColor')
    .onChange(() => { 
        material.uniforms.uSurfaceColor.value.set(guiData.surfaceColor) 
    });
    
gui.addColor(guiData, 'depthColor')
    .onChange(() => { 
        material.uniforms.uDepthColor.value.set(guiData.depthColor) 
    });

gui.add(material.uniforms.uColorOffset, 'value')
    .min(0).max(1).step(0.001)
    .name('Color Offset');

gui.add(material.uniforms.uColorMultiplier, 'value')
    .min(0).max(10).step(0.001)
    .name('Color Multiplier');
```

* Access and use them in the fragment shader with a new varying for the waves from the vertex shader:

```
varying float vWaves;

...
vWaves = waves;
```

```
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vWaves;

...

float colormix = (vWaves + uColorOffset) * uColorMultiplier;
vec3 color = mix(uDepthColor, uSurfaceColor, colormix);

gl_FragColor = vec4(color, 1.0);
```

## Small Waves

For the small waves, we are going to use the [Classic Perlin 3D Noise](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83) by Stefan Gustavson. High-quality noise are notoriously difficult to create and if possible, I recommend just to go with a verified version from an expert.

Even though, we only need 2D coordinates for creating a noise value in our scene as we are working with a 2D plane, we are passing uTime to the third coordinate, to create time-based variation within the noise.

* Copy the following code into the vertex shader (before the main):

```
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

* Integrate the `cnoise` function for the computation of the waves:

```
 waves += cnoise(vec3(modelPosition.xz * 6., uTime * 0.1)) * 0.2;
```

* To create ridges instead of round hills, subtract the absolute value of the noise instead of the above line (this is up to taste):

```
waves -= abs(cnoise(vec3(modelPosition.xz * 6., uTime * 0.1)) * 0.2);
```

### Turbulence Noise

For adding more details, we add the small waves that we have created in the previous step multiple times with different frequencies and amplitudes as turbulence noise.

* For each octave we increase the frequency and decrease the amplitude in the vertex shader:

```
for(float i = 1.0; i <= 3.0; i++) {

    waves -= abs(cnoise(vec3(modelPosition.xz * 3.0 * i, uTime * 0.2)) * 0.15 / i);
}
```

* For getting better details, try to increase the sub-divisions of the plane:

```
const geometry = new THREE.PlaneGeometry(1, 1, 512, 512);
```

* Similar to the big waves, add UI controls for the small ones:

```
uniforms: {

    ...

    uSmallWavesAmplitude: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
}

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

* Add the values to the vertex shader according to their names:

```
uniform float uSmallWavesAmplitude;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;


...

waves -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency 
                            * i, uTime * uSmallWavesSpeed)) * uSmallWavesAmplitude / i);
```

Now, you have a wavy scene that is fully controllable with the UI parameters.


## References

[[1] Bruno Simon. 2024. three.js journey - Lesson Raging Sea.](https://threejs-journey.com/lessons/raging-sea)