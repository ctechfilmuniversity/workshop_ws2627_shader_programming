// Heart: Colorful hearts that seem to move through a tunnel.
//
// The scene is one 2D heart that moves down with
// the depth z, which creates the look of a tunnel. We use
// sphere tracing to find the surface, and the depth of
// the hit point selects a color from a palette.
//
// Based on work of ?

precision highp float;

uniform vec2 u_resolution;

// For animating the colors
// (the time in seconds since the start)
uniform float u_time;

// For the sphere tracing
// The maximal number of steps along a ray
#define STEPS_MAX 50
// If we have moved further than this, the ray didn't hit anything
#define DISTANCE_MAX 50.
// If a surface is closer than this, we count it as a hit
#define DISTANCE_MIN .001

// For the animation
// The larger, the faster the colors move
#define SPEED .8


// The squared length of a vector
float dot2(vec2 p) {
    return dot(p, p);
}

// Signed distance function between
// point and a 2D heart
// from iq https://www.shadertoy.com/view/3tyBzV
float sdfHeart(vec2 p) {
    p.x = abs(p.x);

    if(p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;

    return sqrt(min(dot2(p - vec2(0.00, 1.00)),
                    dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 p) {
    // The sdf is actually 2D!
    // The z value adjusts the position
    // of the 2D heart, moving it down
    // creating the animation

    // STEPS TO GET TO THE LINE BELOW
    // 1. Place the heart in the middle:
    // p.y += 0.5;

    // 2. Move the heart down y, depending on z
    // (the larger z, the more we move y)
    // p.y += 0.5 + abs(p.z);

    // 3. Scale that movement, to make it less extreme
    // p.y += 0.5 + 0.13 * abs(p.z);

    // 4. Reshape the above placement down y
    // to first change very slowly and then change a lot
    // (have a look at the function on graphtoy https://graphtoy.com)
    // p.y += 0.5 + pow(0.13 * abs(p.z), 2.7);

    // 5. Multiplying the value depending on z (with 6)
    // makes the function even steeper, so that it changes faster.
    // The effect is that the going down a tunnel effect is
    // emphasized
    p.y += 0.5 + 6.0 * pow(0.13 * abs(p.z), 2.7);

    // SDFs are negative inside and positive outside
    // We start inside the heart and want to find
    // the surface from there, so we need the opposite.
    // Hence, the -
    return -sdfHeart(p.xy);
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

        // Move along the ray by that distance
        distance_traveled += distance_to_scene;

        // Did we overshoot?
        if(distance_traveled > DISTANCE_MAX) break;
    }

    return distance_traveled;
}


// This function selects one of
// 16 colors depending on the value z
vec3 colorPalette(float z) {
    // Transform z to be between 0..1
    z = fract(z); // Same as: z = mod(z, 1.0);

    // Index between 0..15
    int index = int(floor(z * 15.99));

    // For optimization, move these color conversions
    // to main, for them being done only once
    if(index == 0) return vec3(140, 34, 85) / 256.0;
    else if(index == 1) return vec3(214, 34, 124) / 256.0;
    else if(index == 2) return vec3(171, 37, 49) / 256.0;
    else if(index == 3) return vec3(218, 63, 56) / 256.0;
    else if(index == 4) return vec3(223, 85, 79) / 256.0;
    else if(index == 5) return vec3(233, 139, 49) / 256.0;
    else if(index == 6) return vec3(239, 168, 72) / 256.0;
    else if(index == 7) return vec3(244, 234, 65) / 256.0;
    else if(index == 8) return vec3(131, 190, 69) / 256.0;
    else if(index == 9) return vec3(61, 171, 72) / 256.0;
    else if(index == 10) return vec3(22, 138, 68) / 256.0;
    else if(index == 11) return vec3(45, 172, 111) / 256.0;
    else if(index == 12) return vec3(29, 157, 143) / 256.0;
    else if(index == 13) return vec3(57, 159, 204) / 256.0;
    else if(index == 14) return vec3(41, 107, 167) / 256.0;
    return vec3(40, 52, 116) / 256.0;
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

    // Adjusting the speed
    float time = u_time * SPEED;


    // The Camera
    // Camera position
    vec3 ray_origin = vec3(0, 0, 0);

    // Camera direction
    // Shooting a ray "through" the current fragment
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);

    // Visualization: distance value
    // color = vec3(distance_to_scene * 0.4);


    // Get the point on the surface that
    // we want to compute the color for.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;

    // Visualization: depth of the surface point
    // z has about the same value as the distance
    // color = vec3(point_on_surface.z * 0.5);

    // The depth of the surface point selects the color. As we add
    // the time, the colors keep moving through the tunnel.
    // color = colorPalette(point_on_surface.z);
    color = colorPalette(time + point_on_surface.z);


    // Visualization: only the 2D heart shape
    // (comment out everything above, starting with the camera)
    // p.y += 0.5;
    // float distance_to_heart = sdfHeart(p);
    // color = vec3(distance_to_heart);
    // color = (distance_to_heart < 0.0) ? vec3(0.5, 0.0, 0.1) : vec3(0.3, 0.8, 0.9);


    gl_FragColor = vec4(color, 1.0);
}
