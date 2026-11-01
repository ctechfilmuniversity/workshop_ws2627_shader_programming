precision highp float;

uniform vec2 u_resolution;

// ---- [A] Uniforms & Defines ----

// For the ray marching
#define STEPS_MAX 1000
#define DISTANCE_MAX 5.
#define DISTANCE_MIN .01
#define STEP_SIZE 0.01


// ---- [B] Signed Distance Functions ----

// Signed distance function between
// point and sphere
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}


// ---- [C] The Scene ----



// ---- [D] Moving Along the Ray ----

float rayMarching(vec3 ray_origin, vec3 ray_direction) {
    // How far we have moved along the ray so far
    float distance_traveled = 0.;

    for(int i=0; i < STEPS_MAX; i++) {
        // The current point on the ray
        vec3 point_on_ray = ray_origin + ray_direction * distance_traveled;

        // Compute the distance from the
        // current point to the surface
        // (for now our scene is only the sphere)
        float distance_to_scene = sdfSphere(point_on_ray, 0.5);

        // Are we close enough to the surface (or already inside)?
        // Then we have a hit with the scene.
        if(distance_to_scene < DISTANCE_MIN) break;

        // Move along the ray by a fixed step
        distance_traveled += STEP_SIZE;

        // Did we overshoot?
        if(distance_traveled > DISTANCE_MAX) break;
    }

    return distance_traveled;
}


// ---- [E] Normals ----



// ---- [F] Shading ----



void main() {
    // Scaling the coordinate reference frame so
    // that x and y run from -1..1 with the
    // 0,0 in the middle of the screen
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // The fragment color we
    // are now going to compute
    vec3 color = vec3(0);


    // ---- [G] The Camera ----

    // The Camera
    // Camera position
    vec3 ray_origin = vec3(0, 0.1, -2);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    // ---- [H] Tracing the Ray ----

    float distance_to_scene = rayMarching(ray_origin, ray_direction);


    // ---- [I] The Fragment Color ----

    // Visualization: a slice through the
    // distance field of the sphere at z = 0
    // float distance_to_sphere = sdfSphere(vec3(p, 0.), 0.5);
    // color = vec3(distance_to_sphere);

    // Visualization: flat shading
    // Every fragment whose ray hits
    // the scene gets the same color
    if(distance_to_scene < DISTANCE_MAX) {
        color = vec3(1, 0, 1);
    }


    gl_FragColor = vec4(color, 1.0);
}
