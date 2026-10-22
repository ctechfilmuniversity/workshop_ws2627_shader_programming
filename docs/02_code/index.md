---
layout: default
title: Code
nav_order: 3
has_children: false
---

# Code

In this section you find all code examples for the course.

* [Day 1](#day-1)
    * [Setup](#setup)
    * [Run The Examples](#run-the-examples)
    * [three.js](#threejs)
* [Day 2](#day-2)
    * [Setup](#setup-1)
    * [Implicit Geometry Circle](#implicit-geometry-circle)
    * [Sphere Tracing](#sphere-tracing)


## Day 1

### Setup

For working with the code you need npm (this is the same setup that we have used in CC1). If you don't have the setup anymore, have a look at [slides 13 - 16 of Session 07](https://ctechfilmuniversity.github.io/lecture_ws2324_creative_coding_1/03_slides/cc1_ws2324_07_slides.html#44) of CC1. 
  
[Or simply download and install it here.](https://nodejs.org/en/download)

### Run The Examples

For running the code examples:

* Unzip the folder
* With a terminal navigate into the folder 
* Install the dependencies with `npm install`
* Start a local server with `npm run dev`

### three.js

1. Shader Pipeline: [steps](./threejs/01_shader_pipeline/shader_pipeline_steps.md), [code](./threejs/01_shader_pipeline/shader_pipeline_code.zip)
2. A Wavy Situation: [steps](./threejs/02_wavy/wavy_steps.md), [code](./threejs/02_wavy/wavy_steps_code.zip)




## Day 2
  
### Setup

For working with the code, today we simply use [glsl-canvas](https://marketplace.visualstudio.com/items?itemName=circledev.glsl-canvas). 


  
### Implicit Geometry Circle
  
1. Circle SDF: [code](./glsl/circle/circle.frag)
2. Circle Union: [code](./glsl/circle/circle_union.frag)
3. Circle Subtract: [code](./glsl/circle/circle_subtract.frag)
4. Circle SmoothMin: [code](./glsl/circle/circle_smoothmin.frag)
5. Circle Interactive: [code](./glsl/circle/circle_interactive.frag)
6. Circles as Color Blobs: [code](./glsl/circle/circles_colored.frag)


### Sphere Tracing
  
1. Sphere Tracing Puzzling, no Shading: [puzzle](./glsl/spheretracing/spheretracing_01_no_shading_inpieces.md), [code solution](./glsl/spheretracing/spheretracing_01_no_shading.frag)
2. Sphere Tracing with Shading: [steps](./glsl/spheretracing/spheretracing_02_diffuse_shading_steps.md) (start with this [code](./glsl/spheretracing/spheretracing_01_no_shading.frag)), [code solution](./glsl/spheretracing/spheretracing_03_diffuse_shading.frag)
3. Sphere Tracing for Blobs: [code](./glsl/spheretracing/spheretracing_04_diffuse_shading_blobs.frag)