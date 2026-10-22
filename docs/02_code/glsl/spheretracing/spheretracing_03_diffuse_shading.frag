#version 300 es 
precision mediump float;

uniform vec2 u_resolution;

// For animating the light
uniform float u_time;

out vec4 fragColor;

// For the sphere tracing
#define STEPS_MAX 100
#define DISTANCE_MAX 100.
#define DISTANCE_MIN .01

// For the shadow
#define MOVE_POINT .02

// For the normal computation
// (the h from the forumla)
#define EPSILON 0.0001


// Signed distance function between
// point and sphere
float sdfSphere(vec3 point_on_ray, float radius) {
    return length(point_on_ray) - radius;
}

float sdfCube(vec3 point_on_ray, vec3 size) {
    return length(max(abs(point_on_ray) - size, 0.));
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 point_on_ray) {
    // We need to compute the distance to all surfaces
    // in the scene and keep the smallest distance
    float distance_to_scene = 1e20;

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

    // The same as above but more 
    // elegantly with swiffeling
    // const vec2 h = vec2(EPSILON,0);
    // vec3 n = vec3(sdfScene(p+h.xyy) - sdfScene(p-h.xyy),
    //               sdfScene(p+h.yxy) - sdfScene(p-h.yxy),
    //               sdfScene(p+h.yyx) - sdfScene(p-h.yyx));

    return normalize(n);
}

vec3 getDiffuseShading(vec3 point_on_surface) {
    // The Light
    // Light position
    vec3 light_position = vec3(2, 8, 0);
    light_position.xz += vec2(sin(u_time), cos(u_time)) * 6.;

    // Light direction
    vec3 light_direction_to_point = normalize(light_position - point_on_surface);

    // Normal of the surface
    vec3 surface_normal = estimateNormal(point_on_surface);
    
    // The reflection behavior
    vec3 color_material = vec3(0.8, 0.8, 0.8);
    float reflection_diffuse = max(dot(surface_normal, light_direction_to_point), 0.);

    // Ambient Light
    // To lighten up everything a bit
    vec3 color_ambient = vec3(0.06, 0.1, 0.2);

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



    // return (color_material * reflection_diffuse);
    // return vec3((color_material * reflection_diffuse) + color_ambient);
    return vec3((color_material * reflection_diffuse * shading_shadow) + color_ambient);
}

void main() {
    // Scaling the coordinate reference frame so 
    // that x and y run from -1..1 with the
    // 0,0 in the middle of the screen
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // The fragement color we
    // are now going to compute
    vec3 color = vec3(0);
    

    // The Camera
    // Camera position
    vec3 ray_origin = vec3(0, 0.1, -2);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // A. Visualize the distance value
    // We need to make the value smaller
    // for using it as fragment color
    // distance_to_scene /= 10.;
    // Visualisation of the distance field
    // color = vec3(distance_to_scene);

    // B. Flat shading
    // if(distance_to_scene < DISTANCE_MAX) {
    //     color = vec3(1, 0, 1);
    // }

    // Display the normals
    // vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;
    // color = estimateNormal(point_on_surface);


    // C. Diffuse Shading
    // If we didn't hit anything,
    // set background color and stop.
    if(distance_to_scene > DISTANCE_MAX) {
        fragColor = vec4(0.65, 0.75, 0.9, 1.0);
        return;
    }
    // Get the point on the surface that
    // we want to compute the shading for.
    // This is the closest point on the surface 
    // from the origin looking along the view ray.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;


    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);


    fragColor = vec4(color, 1.0);
}