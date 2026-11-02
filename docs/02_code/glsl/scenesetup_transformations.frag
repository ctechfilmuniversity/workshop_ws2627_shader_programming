precision highp float;

uniform vec2 u_resolution;

// For animating the objects
uniform float u_time;

// For the sphere tracing
#define STEPS_MAX 500
#define DISTANCE_MAX 100.
#define DISTANCE_MIN .01

// For the shadow
#define MOVE_POINT .02

// For the normal computation
// (the h from the formula)
#define EPSILON 0.0001


// Rotation matrix around the X
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

// Rotation matrix around the Y
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

// Rotation matrix around the Z
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}

// Rotation matrix around an arbitrary axis
// https://github.com/dmnsgn/glsl-rotate/blob/main/rotation-3d.glsl
mat4 rotation3d(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
        0.0,                                0.0,                                0.0,                                1.0
    );
}


// Signed distance function between
// point and sphere
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}

// Signed distance function between
// point and box (size is half the
// edge length in each direction)
float sdfCube(vec3 p, vec3 size) {
    vec3 q = abs(p) - size;
    // Outside: distance to the closest point on the box
    // Inside: negative distance to the closest face
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}

// Signed distance function between
// point and octahedron
float sdfOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 p) {
    // We need to compute the distance to all surfaces
    // in the scene and keep the smallest distance
    float distance_to_scene = 1e20;

    // Plane
    distance_to_scene = min(distance_to_scene, p.y + 0.5); // Axis aligned

    // Spheres
    // distance_to_scene = min(distance_to_scene, sdfSphere(p, 0.5));
    distance_to_scene = min(distance_to_scene, sdfSphere(p - vec3(3, 1.5, 6), 2.0));

    // Cube
    // distance_to_scene = min(distance_to_scene, sdfCube(p - vec3(-2, 0.5, 3), vec3(1)));
    // Animated Rotate around Y
    // Option 1
    // mat3 transform = rotateY(u_time);
    // distance_to_scene = min(distance_to_scene, sdfCube(transform * (p - vec3(-2, 0.5, 3)), vec3(1)));
    // Option 2
    // mat4 transform = rotation3d(vec3(1., 1., 0.), u_time);
    // vec4 p4 = vec4(p - vec3(-2, 1., 3), 1.);
    // vec3 p3 = vec3((transform * p4).xyz);
    // distance_to_scene = min(distance_to_scene, sdfCube(p3, vec3(1)));
    // Animated Complex
    distance_to_scene = min(distance_to_scene, sdfCube(
        rotateY(u_time) * (p - vec3(-2, max(0.5, 0.5 + sin(u_time)), 3)),
        vec3(1)
    ));

    // Octahedron Animated
    distance_to_scene = min(distance_to_scene, sdfOctahedron(rotateX(u_time) * rotateY(u_time * 0.5) * (p - vec3(1, -0.15, 0.5)), 0.3));


    // Twisting
    float k = sin(u_time) * 3.0;
    float c = cos(k * p.y);
    float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    vec3 q = vec3(m * (p.xz - vec2(.5, 0.2)), p.y);
    distance_to_scene = min(distance_to_scene, sdfCube(q, vec3(0.6)));


    return distance_to_scene;
}


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

        // Move along the ray by half that distance
        // (the twist distorts the distance field, so
        // the full distance could overshoot the surface)
        distance_traveled += distance_to_scene * .5;

        // Did we overshoot?
        if(distance_traveled > DISTANCE_MAX) break;
    }

    return distance_traveled;
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
    // elegantly with swizzling
    // const vec2 h = vec2(EPSILON,0);
    // vec3 n = vec3(sdfScene(p+h.xyy) - sdfScene(p-h.xyy),
    //               sdfScene(p+h.yxy) - sdfScene(p-h.yxy),
    //               sdfScene(p+h.yyx) - sdfScene(p-h.yyx));

    return normalize(n);
}

vec3 getDiffuseShading(vec3 point_on_surface) {
    // The Light
    // Light position
    // vec3 light_position = vec3(2, 8, 0);
    vec3 light_position = vec3(2, 5, -4);
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
    vec3 color_ambient = vec3(0.06, 0.1, 0.2);

    // The shadow
    // We need to make sure that we are not stuck inside of the shape
    // For that we move the point a tiny bit along the direction
    // of the surface normal (MOVE_POINT must be larger than
    // DISTANCE_MIN, otherwise we immediately hit the surface again)
    vec3 point_moved_up = vec3 (point_on_surface + surface_normal * MOVE_POINT);

    float distance_to_scene_light_direction =
                        sphereTracing(point_moved_up, direction_to_light);

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

    // The fragment color we
    // are now going to compute
    vec3 color = vec3(0);


    // The Camera
    // Camera position
    vec3 ray_origin = vec3(0, 0, -2);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // C. Diffuse Shading
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


    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);


    gl_FragColor = vec4(color, 1.0);
}
