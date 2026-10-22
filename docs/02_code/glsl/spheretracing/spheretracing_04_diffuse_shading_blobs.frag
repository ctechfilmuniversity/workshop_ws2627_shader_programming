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

// For the fog
#define FAR 30.


// Signed distance function between
// point and sphere
float sdfSphere(vec3 point_on_ray, float radius) {
    return length(point_on_ray) - radius;
}

float sdfCube(vec3 point_on_ray, vec3 size) {
    return length(max(abs(point_on_ray) - size, 0.));
}

float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * (1.0 / 4.0);
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
    // distance_to_scene = min(distance_to_scene, sdfSphere(point_on_ray, 0.5));
    float circle1 = sdfSphere(point_on_ray - vec3(0.5* sin(u_time), 0.0, 0.5 * cos(u_time)), 0.2);
    float circle2 = sdfSphere(point_on_ray - vec3(.2) + vec3(0.2 * sin(u_time)), 0.4);
    float circle3 = sdfSphere(point_on_ray - vec3(0.5 * sin(u_time), 0.5 * cos(u_time * 1.1), 0.5 * cos(u_time)), 0.5);

    vec3 pos_adjust = vec3(-.5, -1., 1.);
    float time  = u_time * 0.5;
    float s1 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(cos(time*.1), cos(time*.3),cos(time*.5)), 1.);
    float s2 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(cos(time*.7), 1.+cos(time*.7),cos(time*.3)), 1.);
    float s3 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(cos(time*.2), 1.5+cos(time*.5),sin(time*.6)), .5);
    float s4 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(sin(time*.3), 1.5+sin(time*1.6),sin(time*0.8)), .4);
    float s5 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(sin(time*.6), 1.5+sin(time*.9),sin(time*.9)), 1.2);
    float s6 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(1.5+sin(time*.3), cos(time*1.5),sin(time*0.8)), .4);
    float s7 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(cos(time*.3), 1.5 + sin(time*1.5),1.5+ sin(time*0.8)), .4);
    float s8 = sdfSphere(point_on_ray + pos_adjust 
                            * vec3(1.5 + cos(time*3.), sin(time*.5),sin(time*0.8)), .4);


    float merge = 0.3;
    distance_to_scene = min(distance_to_scene, s1);
    distance_to_scene = smin(distance_to_scene, s2, merge);
    distance_to_scene = smin(distance_to_scene, s3, merge);
    distance_to_scene = smin(distance_to_scene, s4, merge);
    distance_to_scene = smin(distance_to_scene, s5, merge);
    distance_to_scene = smin(distance_to_scene, s6, merge);
    distance_to_scene = smin(distance_to_scene, s7, merge);
    distance_to_scene = smin(distance_to_scene, s8, merge);

    // distance_to_scene = max(distance_to_scene, -1.*s6);
    // distance_to_scene = max(distance_to_scene, -1.*s7);
    // distance_to_scene = max(distance_to_scene, -1.*s8);

    // Plane
    distance_to_scene = min(distance_to_scene, point_on_ray.y + 2.); // Axis aligned

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
    vec3 light_position = vec3(8, 10, -10);
    // light_position.xz += vec2(sin(0.5* u_time), 1.) * 2.;

    // Light direction
    vec3 light_direction_to_point = normalize(light_position - point_on_surface);

    // Normal of the surface
    vec3 surface_normal = estimateNormal(point_on_surface);
    
    // The reflection behavior
    vec3 color_material = vec3(0.5, 0.5, 0.5);
    float reflection_diffuse = max(dot(surface_normal, light_direction_to_point), 0.);

    // Ambient Light
    // To lighten up everything a bit
    vec3 color_ambient = vec3(0.01, 0.01, 0.01);

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
    vec3 ray_origin = vec3(0, 1., -5);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);
    float d = smoothstep(0., .5, distance_to_scene);

   
    // C. Diffuse Shading
    // If we didn't hit anything,
    // set background color and stop.
    vec3 overlay = 0.5 + 0.5 * cos(u_time * 0.2 + p.xyx * 0.01 +vec3(0,2,4));
    if(distance_to_scene > DISTANCE_MAX) {
        fragColor = vec4(overlay * 0.9, 1.0);
        return;
    }
    // Get the point on the surface that
    // we want to compute the shading for.
    // This is the closest point on the surface 
    // from the origin looking along the view ray.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;


    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);

    color = overlay + color;


    fragColor = vec4(color, 1.0);
    // fragColor = vec4(overlay, 1.0);
}