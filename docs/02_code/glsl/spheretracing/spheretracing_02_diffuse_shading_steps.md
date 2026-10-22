---
layout: default
title: Session
nav_exclude: true
---

## Workshop Shader Programming

### Adding Diffuse Shading

## Step 1 - Normals

```glsl
// Computing the normal for
// point p in regard to the 
// surface description of the
// scene.
vec3 estimateNormal(vec3 p) { // p is point_on_surface
    vec3 n = vec3(
        sdfScene(vec3(p.x + EPSILON, p.y, p.z)) - sdfScene(vec3(p.x - EPSILON, p.y, p.z)),
        sdfScene(vec3(p.x, p.y + EPSILON, p.z)) - sdfScene(vec3(p.x, p.y - EPSILON, p.z)),
        sdfScene(vec3(p.x, p.y, p.z  + EPSILON)) - sdfScene(vec3(p.x, p.y, p.z - EPSILON))
    );

    return normalize(n);
}
```

With swiffeling

```glsl
    // The same as above but more 
    // elegantly with swiffeling
    // const vec2 h = vec2(EPSILON,0);
    // vec3 n = vec3(sdfScene(p+h.xyy) - sdfScene(p-h.xyy),
    //               sdfScene(p+h.yxy) - sdfScene(p-h.yxy),
    //               sdfScene(p+h.yyx) - sdfScene(p-h.yyx));
```

For testing:

```glsl
    // Display the normals
    // color = estimateNormal(point_on_surface);
```

## Step 2 - Diffuse Shading

Compute the point on the surface:


```glsl
    //main():

    // Get the point on the surface that
    // we want to compute the shading for.
    // This is the closest point on the surface 
    // from the origin looking along the view ray.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;

    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);

```

Only if we hit something:

```glsl
    // C. Diffuse Shading
    // If we didn't hit anything,
    // set background color and stop.
    if(distance_to_scene > DISTANCE_MAX) {
        gl_FragColor = vec4(0.65, 0.75, 0.9, 1.0);
        return;
    }
```

Compute the shading
```glsl
vec3 getDiffuseShading(vec3 point_on_surface) {
    // The Light
    // Light position
    vec3 light_position = vec3(2, 8, 0);
    // light_position.xz += vec2(sin(u_time), cos(u_time)) * 6.;

    // Light direction
    vec3 light_direction_to_point = normalize(light_position - point_on_surface);

    // Normal of the surface
    vec3 surface_normal = estimateNormal(point_on_surface);
    
    // The reflection behavior
    vec3 color_material = vec3(0.8, 0.8, 0.8);
    float reflection_diffuse = max(dot(surface_normal, light_direction_to_point), 0.);


    return (color_material * reflection_diffuse);
}
```

## Step 3 - Ambient Light

```glsl
    // Ambient Light
    // To lighten up everything a bit
    vec3 color_ambient = vec3(0.06, 0.1, 0.2);
```

```glsl
    // Ambient Light
    // To lighten up everything a bit
    vec3 color_ambient = vec3(0.06, 0.1, 0.2);
    return (color_material * reflection_diffuse) + color_ambient;
```

## Step 4 - Shadows

```glsl
    // The shadow
    // We need to make sure that we are not stuck inside of the shape
    // For that we move the point a tiny bit along the direction 
    // of the surface normal (we are recyceling DISTANCE_MIN here)
    vec3 point_moved_up = vec3 (point_on_surface + surface_normal * MOVE_POINT);

    float distance_to_scene_light_direction = 
                        sphereTracing(point_moved_up, light_direction_to_point);

    // If the distance to the scene is smaller than the distance to the light
    // then there is an object between surface point and light, and
    // with that the surface point is in the shadow
    float shading_shadow = 1.;
    if(distance_to_scene_light_direction < length(light_position-point_on_surface)) {
        // This factor reduces the light
        shading_shadow *= .1;
    }
```

```glsl
return vec3((color_material * reflection_diffuse * shading_shadow) + color_ambient);
```
