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
* [Day 3](#day-3)


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
  
1. Sphere Tracing Puzzling, no Shading: [puzzle](./glsl/spheretracing/puzzeling/spheretracing_01_no_shading_inpieces.md), [code solution](./glsl/spheretracing/puzzeling/spheretracing_01_no_shading.frag)


## Day 3
  
1. Sphere Tracing: [steps](./glsl/spheretracing/spheretracing_steps.md), [code start](./glsl/spheretracing/spheretracing_step_00_start.frag)  
Solutions:
    * [The SDF of a Sphere](./glsl/spheretracing/solution/spheretracing_step_01_sdf_sphere.frag)
    * [Ray Marching](./glsl/spheretracing/solution/spheretracing_step_02_ray_marching.frag)
    * [Sphere Tracing](./glsl/spheretracing/solution/spheretracing_step_03_sphere_tracing.frag)
    * [Normals](./glsl/spheretracing/solution/spheretracing_step_04_normals.frag)
    * [Diffuse Shading](./glsl/spheretracing/solution/spheretracing_step_05_shading.frag)
    * [Shadows](./glsl/spheretracing/solution/spheretracing_step_06_shadows.frag)
2. Transformations: [code](./glsl/scenesetup_transformations.frag)
3. Metaballs: [code](./glsl/spheretracing_metaballs_01.frag)
4. Repetition: [steps](./glsl/scenesetup_repetition/scenesetup_repetition_steps.md), [code start](./glsl/scenesetup_repetition/scenesetup_repetition_step_00_start.frag)  
Solutions:
    * [Repetition](./glsl/scenesetup_repetition/solution/scenesetup_repetition_step_01_repetition.frag)
    * [Fog](./glsl/scenesetup_repetition/solution/scenesetup_repetition_step_02_fog.frag)
    * [Gamma Correction](./glsl/scenesetup_repetition/solution/scenesetup_repetition_step_03_gamma.frag)
    * [Animate the Camera](./glsl/scenesetup_repetition/solution/scenesetup_repetition_step_04_camera.frag)
    * [Random Offset](./glsl/scenesetup_repetition/solution/scenesetup_repetition_step_05_offset.frag)
5. Examples:
    * [Heart](./glsl/scenesetup_heart.frag)
    * [Biomine](./glsl/scenesetup_biomine.frag)
6. 3D Fragementshader in Three.js: [code](./threejs/threejs_fragmentshader.zip)
