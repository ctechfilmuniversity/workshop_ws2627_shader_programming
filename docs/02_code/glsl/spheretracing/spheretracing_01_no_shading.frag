#version 300 es 
precision mediump float;

uniform vec2 u_resolution;

#define STEPS_MAX 100
#define DISTANCE_MAX 100.
#define DISTANCE_MIN .01

out vec4 fragColor;

// Signed distance function between
// point and sphere
float sdfSphere(vec3 point_on_ray, float radius) {
    return length(point_on_ray) - radius;
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 point_on_ray) {
    // We need to compute the distance to all surfaces
    // in the scene and keep the smallest distance
    float distance_to_scene = 1e20;

    // Scene
    // In this specific scene, we only have
    // one sphere and a plane

    // Spheres (at the origin)
    distance_to_scene = min(distance_to_scene, sdfSphere(point_on_ray, 0.5));

    // Plane 
    // (moved down by 0.5 - don't worry
    // about this translation just yet, we
    // will cover it in detail next week)
    distance_to_scene = min(distance_to_scene, point_on_ray.y + 0.5); // Axis aligned

    return distance_to_scene;
}


float sphereTracing(vec3 ray_origin, vec3 ray_direction) {
    float distance_to_scene = 0.;

    for(int i=0; i < STEPS_MAX; i++) {
        // We move along the ray 
        // the last distance_to_scene amount
        vec3 point_on_ray = ray_origin + ray_direction * distance_to_scene;

        // Compute the new distance to scene
        // from the just computed point on the 
        // camera ray
        distance_to_scene += sdfScene(point_on_ray);

        // Did we overshoot or have a hit with the scene?
        if(distance_to_scene > DISTANCE_MAX || distance_to_scene < DISTANCE_MIN) break;
    }

    return distance_to_scene;
}



void main() {

    // Scaling the coordinate reference frame so 
    // that x and y run from -1..1 with the
    // 0,0 in the middle of the screen
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // The fragment color we
    // are now going to compute
    vec3 color = vec3(0);
    

    // The Camera
    // Camera position
    vec3 ray_origin = vec3(0, 0.1, -2);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1.));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // 1. Visualize the distance value
    // We need to make the value smaller
    // for using it as fragment color
    distance_to_scene /= 10.;
    // Visualisation of the distance field
    color = vec3(distance_to_scene);

    // 2. Flat shading
    // if(distance_to_scene < DISTANCE_MAX) {
    //     color = vec3(1, 0, 1);
    // }

    fragColor = vec4(color, 1.0);
}