// Metaballs: Three animated spheres that melt into
// each other, rendered with sphere tracing.
//
// The scene is not made of triangles. It is described by a function,
// sdfScene(), which returns for any point in space the distance to the
// closest surface. For every fragment, this shader
//   1. shoots a ray from the camera through the fragment into the scene,
//   2. follows the ray until it hits a surface (sphereTracing()),
//   3. computes how much light that surface point gets (getDiffuseShading()),
//   4. adds the shading to an animated color overlay.
//
// The comments marked with "METABALLS:" explain the
// parts that create the look of this specific scene.

precision highp float;

uniform vec2 u_resolution;

// For animating the spheres and the colors
// (the time in seconds since the start)
uniform float u_time;

// For the sphere tracing
// The maximal number of steps along a ray
#define STEPS_MAX 100
// If we have moved further than this, the ray didn't hit anything
#define DISTANCE_MAX 100.
// If a surface is closer than this, we count it as a hit
#define DISTANCE_MIN .01

// For the shadow
// How far we move a point away from
// the surface before tracing to the light
#define MOVE_POINT .02

// For the normal computation
// The tiny step we take to each side of a point
#define EPSILON 0.0001


// Signed distance function (SDF) between
// point and sphere around the origin.
// The result is the distance to the surface:
// negative inside, 0 on the surface, positive outside.
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}

// Signed distance function between
// point and box (size is half the
// edge length in each direction)
// This scene doesn't use the box,
// but you can try to add it to sdfScene().
float sdfCube(vec3 p, vec3 size) {
    vec3 q = abs(p) - size;
    // Outside: distance to the closest point on the box
    // Inside: negative distance to the closest face
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}


// METABALLS: Smooth minimum
// min(a, b) gives a hard edge where two shapes meet.
// smin(a, b, k) blends the two shapes into each other instead.
// k is the size of the blending zone: the larger k, the
// further apart the shapes start to melt together.
// See https://iquilezles.org/articles/smin/
float smin(float a, float b, float k) {
    // h is 1 where a and b are equal (exactly between the two
    // shapes) and falls to 0 when they differ by k or more
    float h = max(k - abs(a - b), 0.) / k;

    // Far away from the other shape, h is 0 and this is
    // simply min(a, b). Close to the other shape, we subtract
    // a bit from the distance. A smaller distance means the
    // surface is closer, so the surface swells up and forms
    // the soft "bridge" between the shapes.
    return min(a, b) - h * h * k * (1. / 4.);
}


// This function computes the
// minimal distance to all
// surfaces in the scene.
float sdfScene(vec3 p) {
    // We need to compute the distance to all surfaces
    // in the scene and keep the smallest distance
    float distance_to_scene = 1e20;

    // In this specific scene, we have
    // three spheres and a plane

    // METABALLS: The animation of the spheres
    // A smaller factor makes the movement slower and calmer
    float time = u_time * .5;

    // How far the spheres move away from the origin on x, y and z.
    // We keep this small compared to the radii below, so that
    // the spheres stay close and keep intersecting.
    vec3 movement = vec3(.4, .4, .4);

    // The center of each sphere moves with sin() and cos().
    // Each coordinate gets its own speed (.7, 1.3, ...), and each
    // sphere gets different speeds. These speeds don't line up,
    // so the spheres don't move in circles but on winding paths,
    // and the shape keeps changing without obviously repeating.
    vec3 center_1 = movement * vec3(sin(time),       cos(time * 1.3), sin(time * .7));
    vec3 center_2 = movement * vec3(cos(time * .8),  sin(time * 1.1), cos(time * .5));
    vec3 center_3 = movement * vec3(sin(time * 1.2), sin(time * .6),  cos(time * .9));

    // METABALLS: The three spheres
    // sdfSphere() assumes a sphere at the origin. To move a sphere
    // to a center, we move the point in the opposite direction
    // with p - center. Different radii make the shape more interesting.
    float sphere_1 = sdfSphere(p - center_1, .6);
    float sphere_2 = sdfSphere(p - center_2, .5);
    float sphere_3 = sdfSphere(p - center_3, .3);

    // METABALLS: Melting the spheres together
    // smin() combines two shapes, so we first blend
    // two spheres and then blend the result with the third.
    float blend_size = .3;
    float metaballs = smin(sphere_1, sphere_2, blend_size);
    metaballs = smin(metaballs, sphere_3, blend_size);

    // We use the normal min() here as we
    // don't want to blend with the plane below
    distance_to_scene = min(distance_to_scene, metaballs);

    // Plane
    // A horizontal plane at y = -1.1. For a point above the plane, the
    // distance is simply its height over the plane. The plane is
    // low enough so that the spheres never move through it.
    distance_to_scene = min(distance_to_scene, p.y + 1.1); // Axis aligned

    return distance_to_scene;
}


// This function follows a ray until it hits a surface
// and returns how far it has traveled along the ray.
// If it didn't hit anything, the result is larger than DISTANCE_MAX.
// It is called sphere tracing because the distance to the closest
// surface is the radius of a sphere around the current point, in
// which we can move freely without ever intersecting with a surface.
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

// Computing the normal for
// point p in regard to the
// surface description of the
// scene.
// The normal points in the direction in which the distance to
// the scene grows the fastest. To find that direction, we take a
// tiny step to both sides along each axis and compare the distances
// (central differences). The result only needs to be
// normalized, as we are only interested in the direction.
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

// Computing how much light a point
// on a surface reflects to the camera
vec3 getDiffuseShading(vec3 point_on_surface) {
    // The Light
    // Light position
    // METABALLS: A fixed light in front of the scene, on the side of
    // the camera. This way we always see the lit side of the spheres.
    vec3 light_position = vec3(8, 10, -10);

    // Light direction
    // From the surface point to the light
    vec3 direction_to_light = normalize(light_position - point_on_surface);

    // Normal of the surface
    vec3 surface_normal = estimateNormal(point_on_surface);

    // The reflection behavior
    // METABALLS: A medium grey material. In main(), we add the
    // shading on top of a colorful overlay. With a brighter
    // material, the sum would quickly go above 1 and turn white.
    vec3 color_material = vec3(0.5, 0.5, 0.5);

    // Diffuse (Lambert) reflection: the more directly a surface faces
    // the light, the brighter it is. The dot product of the two
    // normalized vectors is the cosine of the angle between them.
    // It is negative if the surface faces away from
    // the light, so we clamp the result to 0.
    float reflection_diffuse = max(dot(surface_normal, direction_to_light), 0.);

    // Ambient Light
    // A constant amount of light that reaches
    // every point, to lighten up everything a bit
    // METABALLS: This is very low as we
    // have the overlay as the base color.
    vec3 color_ambient = vec3(0.01, 0.01, 0.01);

    // The shadow
    // We check if there is an object between the point and the light by
    // sphere tracing from the point towards the light.
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


    return vec3((color_material * reflection_diffuse * shading_shadow) + color_ambient);
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
    vec3 ray_origin = vec3(0, 0.1, -2);

    // Camera direction
    // Shooting a ray "through" the current fragment
    // The camera looks along the positive z-axis, and we imagine
    // the image plane at a distance of 1 in front of the camera.
    vec3 ray_direction = normalize(vec3(p, 1));


    float distance_to_scene = sphereTracing(ray_origin, ray_direction);


    // METABALLS: The animated color overlay
    // cos() runs from -1 to 1, so 0.5 + 0.5 * cos() runs from 0 to 1,
    // which is the range we need for a color. We compute this
    // for all three color channels at once with a vec3:
    //
    // - u_time * 0.2 moves all channels along their cosine over time,
    //   so the color slowly changes (smaller factor = slower).
    // - p.xyx * 0.4 adds the position of the fragment, which is
    //   vec3(p.x, p.y, p.x). Each channel is a bit further along its
    //   cosine depending on where we are on the screen, which gives
    //   us a color gradient (0. would give one color for the whole screen).
    // - vec3(0, 2, 4) starts each channel at a different point of its
    //   cosine. If all channels were the same, we would only see grey.
    //   As they are out of step with each other, red, green and blue
    //   take turns in being bright, and we run through all the hues.
    vec3 overlay = 0.5 + 0.5 * cos(u_time * 0.2 + p.xyx * 0.4 + vec3(0, 2, 4));

    // Diffuse Shading
    // If we didn't hit anything,
    // set background color and stop.
    // METABALLS: The background is the overlay, made a bit darker,
    // so that the lit surfaces stand out from it.
    if(distance_to_scene > DISTANCE_MAX) {
        gl_FragColor = vec4(overlay * 0.9, 1.0);
        return;
    }
    // Get the point on the surface that
    // we want to compute the shading for.
    // This is the closest point on the surface
    // from the origin looking along the view ray.
    vec3 point_on_surface = ray_origin + ray_direction * distance_to_scene;


    // Compute the lambert shading
    color = getDiffuseShading(point_on_surface);

    // METABALLS: Adding the shading on top of the overlay
    // The shading has no color of its own, it only makes
    // the overlay brighter where light hits the surface.
    // Where the shading is close to 0 (the dark sides and the
    // shadows), we simply see the pure color of the overlay.
    color = overlay + color;


    gl_FragColor = vec4(color, 1.0);
}
