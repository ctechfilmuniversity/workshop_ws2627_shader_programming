precision highp float;

uniform vec2 u_resolution;

// ---- [A] Uniforms & Defines ----

// For animating the light
uniform float u_time;

// For the sphere tracing
#define STEPS_MAX 100
#define DISTANCE_MAX 100.
#define DISTANCE_MIN .01

// For the shadow
#define MOVE_POINT .02

// For the normal computation
// (the h from the formula)
#define EPSILON 0.0001

// For the fog
#define FAR 30.


// ---- [B] Signed Distance Functions ----

// Signed distance function between
// point and sphere
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}


// ---- [C] The Scene ----

// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 p) {
    // Repetition
    // Coordinate transformation: every point
    // in space is mapped into one single cell
    // around the origin
    p = fract(p) - .5;

    // Our only shape: one sphere in that cell
    float distance_to_scene = sdfSphere(p, 0.15);

    return distance_to_scene;
}


// ---- [D] Moving Along the Ray ----

float sphereTracing(vec3 ray_origin, vec3 ray_direction) {
    // How far we have moved along the ray so far
    float distance_traveled = 0.;

    for(int i=0; i < STEPS_MAX; i++) {
        // The current point on the ray
        vec3 point_on_ray = ray_origin + ray_direction * distance_traveled;

        // Compute the minimal distance from the
        // current point to all surfaces in the scene
        // (the radius of the sphere in which we
        // can move freely)
        float distance_to_scene = sdfScene(point_on_ray);

        // Is the step size below the threshold?
        // Then we have a hit with the scene.
        if(distance_to_scene < DISTANCE_MIN) break;

        // Move along the ray by that distance
        distance_traveled += distance_to_scene;

        // Did we overshoot?
        if(distance_traveled > DISTANCE_MAX) break;
    }

    return distance_traveled;
}


// ---- [E] Normals ----

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
    // elegantly with swizzling
    // const vec2 h = vec2(EPSILON,0);
    // vec3 n = vec3(sdfScene(p+h.xyy) - sdfScene(p-h.xyy),
    //               sdfScene(p+h.yxy) - sdfScene(p-h.yxy),
    //               sdfScene(p+h.yyx) - sdfScene(p-h.yyx));

    return normalize(n);
}


// ---- [F] Shading ----

vec3 getDiffuseShading(vec3 point_on_surface) {
    // The Light
    // Light position
    vec3 light_position = vec3(2, 8, 0);
    // light_position.xz += vec2(sin(u_time), cos(u_time)) * 6.;

    // Light direction
    vec3 direction_to_light = normalize(light_position - point_on_surface);

    // Normal of the surface
    vec3 surface_normal = estimateNormal(point_on_surface);

    // The reflection behavior
    vec3 color_material = vec3(0.8, 0.8, 0.8);
    float reflection_diffuse = max(dot(surface_normal, direction_to_light), 0.);

    // Ambient Light
    // To lighten up everything a bit
    // vec3 color_ambient = vec3(0.06, 0.1, 0.2);
    vec3 color_ambient = vec3(0.3);

    // The shadow
    // We need to make sure that we are not stuck inside of the shape
    // For that we move the point a tiny bit along the direction
    // of the surface normal (MOVE_POINT must be larger than
    // DISTANCE_MIN, otherwise we immediately hit the surface again)
    // vec3 point_moved_up = vec3 (point_on_surface + surface_normal * MOVE_POINT);

    // float distance_to_scene_light_direction =
    //                     sphereTracing(point_moved_up, direction_to_light);

    // // If the distance to the scene is smaller than the distance to the light
    // // then there is an object between surface point and light, and
    // // with that the surface point is in the shadow
    // float shading_shadow = 1.;
    // if(distance_to_scene_light_direction < length(light_position-point_on_surface)) {
    //     // This factor reduces the light
    //     shading_shadow *= .1;
    // }


    // return (color_material * reflection_diffuse);
    return vec3((color_material * reflection_diffuse) + color_ambient);
    // return vec3((color_material * reflection_diffuse * shading_shadow) + color_ambient);
}


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

    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // ---- [I] The Fragment Color ----

    // Visualization: a slice through the
    // distance field of the sphere at z = 0
    // float distance_to_sphere = sdfSphere(vec3(p, 0.), 0.5);
    // color = vec3(distance_to_sphere);

    // Visualization: distance value
    // We need to make the value smaller
    // for using it as fragment color
    // distance_to_scene /= 10.;
    // Visualisation of the distance field
    // color = vec3(distance_to_scene);

    // Visualization: flat shading
    // Every fragment whose ray hits
    // the scene gets the same color
    // if(distance_to_scene < DISTANCE_MAX) {
    //     color = vec3(1, 0, 1);
    // }

    // If we didn't hit anything,
    // set background color and stop.
    if(distance_to_scene > DISTANCE_MAX) {
        gl_FragColor = vec4(0.65, 0.75, 0.9, 1.0);
        return;
    }
    // Get the point on the surface that
    // we want to compute the shading for.
    // This is the closest point on the surface
    // from the origin looking along the view ray.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;

    // Visualization: normals
    // color = estimateNormal(point_on_surface);

    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);

    // The fog factor grows with the
    // distance to the camera
    float fog = smoothstep(0., 1., distance_to_scene/FAR);
    // Applying the background fog
    color = mix(color, vec3(0.8), fog);


    gl_FragColor = vec4(color, 1.0);
}
