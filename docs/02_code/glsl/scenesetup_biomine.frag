// Biomine: A flight through a tunnel of organic, pulsing tubes,
// rendered with sphere tracing and colored by its normals.
//
// Based on work of one of the great: Shane
// https://www.shadertoy.com/view/4lyGzR

precision highp float;

uniform vec2 u_resolution;

// For animating the tubes and the camera
// (the time in seconds since the start)
uniform float u_time;

// For the sphere tracing
// The maximal number of steps along a ray
#define STEPS_MAX 50
// If we have moved further than this, the ray didn't hit anything
#define DISTANCE_MAX 50.
// If a surface is closer than this, we count it as a hit
#define DISTANCE_MIN .001

// For the normal computation
// The tiny step we take to each side of a point
#define EPSILON 0.0001

// For the fog
// From this distance on, everything has disappeared in the fog
#define FAR 30.


// Smooth maximum, based on IQ's smooth minimum function
// max(a, b) gives a hard edge where two shapes meet.
// smax(a, b, k) rounds off that edge. k is the size of the rounding.
// See https://iquilezles.org/articles/smin/
float smax(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0., 1.);
    return mix(b, a, h) + h * (1. - h) * k;
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 p) {
    const float PI = 3.14159;

    // A gyroid lattice as biological tubes
    // A gyroid is an infinite surface that winds through space. Its
    // simple formula is dot(cos(p), sin(p.yzx)). The factor PI / 2
    // scales the pattern, and + 1. shifts the surface.
    // See https://plus.maths.org/content/meet-gyroid
    // and the tutorial https://www.youtube.com/watch?v=-adHIyjIYgk
    float tubes = dot(cos(p * 1.5707963), sin(p.yzx * 1.5707963)) + 1.;

    // Making the tubes irregular and pulse
    // We add a small sine pattern to the distance, which
    // swells the surface up and down. u_time moves that pattern.
    float biotubes = tubes + .25 + dot(sin(p + u_time * PI * 2. + sin(p.yzx * .5)), vec3(.033));

    // From Shane:
    // The tunnel. Created with a bit of trial and error.
    // The smooth maximum against the gyroid rounds it off a bit.
    // The abs term at the end just adds some variation via the beveled edges.
    float tunnel = smax(3.25 - length(p.xy - vec2(0, 1)) + .5 * cos(p.z * PI / 32.),
                        .75 - tubes, 1.) - abs(1.5 - tubes) * .375;

    return min(tunnel, biotubes);
}


// This function follows a ray until it hits a surface
// and returns how far it has traveled along the ray.
float sphereTracing(vec3 ray_origin, vec3 ray_direction) {
    // How far we have moved along the ray so far
    float distance_traveled = 0.;

    for(int i=0; i < STEPS_MAX; i++) {
        // The current point on the ray
        vec3 point_on_ray = ray_origin + ray_direction * distance_traveled;

        // Compute the minimal distance from the
        // current point to all surfaces in the scene
        float distance_to_scene = sdfScene(point_on_ray);

        // Is the step size below the threshold?
        // Then we have a hit with the scene.
        if(distance_to_scene < DISTANCE_MIN) break;

        // Move along the ray by half of that distance
        // The tubes are not an exact distance function, so the
        // value can be too large. With a smaller step
        // we don't accidentally jump through a surface.
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
// The normal points in the direction in which the distance to
// the scene grows the fastest. To find that direction, we take a
// tiny step to both sides along each axis and compare the distances
// (central differences).
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


void main() {
    // Scaling the coordinate reference frame so
    // that y runs from -1..1 (x accordingly to the
    // aspect ratio of the screen) with the
    // 0,0 in the middle of the screen
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // The fragment color we
    // are now going to compute
    vec3 color = vec3(0);


    // The Camera
    // Camera position
    // Moving "into" the scene
    vec3 ray_origin = vec3(0, 1, u_time * 2. - 4.9);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // Get the point on the surface that
    // we want to compute the color for.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;

    // Simple stylized shading with the normal
    // The normal runs from -1..1, and we
    // map it to the color range 0..1
    color = estimateNormal(point_on_surface) * 0.5 + 0.5;

    // The fog factor grows with the
    // distance to the camera
    // Rays that didn't hit anything are further away than FAR,
    // so they get the pure fog color and we don't need a background.
    float fog = smoothstep(0., 1., distance_to_scene/FAR);
    // Applying the background fog
    color = mix(color, vec3(0.97, 0.97, 0.6), fog);

    // Gamma correction
    // 1 / gamma = 1 / 2.2 = 0.4545
    color = pow(color, vec3(.4545));


    gl_FragColor = vec4(color, 1.0);
}
