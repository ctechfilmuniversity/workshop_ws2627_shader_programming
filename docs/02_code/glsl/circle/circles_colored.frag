// #version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

// Pseudo-random generator: turns a 2D input (e.g. a cell index)
// into a 2D "random" value between 0 and 1.
// Same input -> always the same output, so every cell
// gets its own fixed random point.
vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// Signed distance to a circle centered at the origin:
// positive if p is outside, negative if p is inside,
// zero exactly on the edge
float sdf_circle(vec2 p, float radius) {
    return length(p) - radius;
}

// Smooth minimum: like min(a, b), but blends the two
// shapes into each other instead of a hard edge.
// k = size of the blend zone (0.0 behaves like min)
float smin(float a, float b, float k) {
    // h is 1.0 where a and b are equal, falls to 0.0
    // when they differ by k or more
    float h = max(k - abs(a - b), 0.0) / k;
    // subtract a little extra where the shapes meet -> soft "bridge"
    return min(a, b) - h * h * k * (1.0 / 4.0);
}

void main() {
    // Normalized coordinates: origin in the center,
    // y from -1 to 1, x scaled by the aspect ratio
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
    float radius = .4;
    vec3 color = vec3(0.);

    float cells = 4.;

    // Coordinate transformation: split the screen into a grid
    p *= cells;                     // zoom out -> more cells on screen
    vec2 p_cell_index = floor(p);   // integer id of the cell, e.g. (2, -1)
    vec2 p_cell = fract(p);         // position inside the cell, 0..1
    // gl_FragColor = vec4(vec3(abs(p_cell.x) * abs(p_cell.y)), 1.0); // debug: show the grid

    // Start with a large distance, it gets smaller in the loop
    float d = 1.;

    // For a detailed explanation of the
    // following Worley noise (cellular noise) see
    // https://thebookofshaders.com/12/

    // Check the current cell and its eight neighboring cells
    // for their reference points, compute the distance
    // to each of them and keep the smallest distance
    for (int y = -1; y <= 1; y++) {         // -1, 0, 1
        for (int x = -1; x <= 1; x++) {     // -1, 0, 1
            // Offset to the neighboring cell
            vec2 neighbor = vec2(float(x), float(y));

            // Generate a random point based on the cell id
            vec2 point = random2(p_cell_index + neighbor);
            // Animate it: move the point on a circle-like path
            // (6.2831853 = 2 * PI, a full sine period)
            point = vec2(0.5) + 0.5 * sin(u_time + 6.2831853 * point);

            // Distance from the current pixel to a circle
            // around the random point in the neighboring cell
            float dist = sdf_circle(neighbor + point - p_cell, radius);

            // Keep the closest circle
            // d = min(d, dist);        // hard union of all circles
            d = smin(d, dist, 0.4);     // smooth union -> circles melt together
        }
    }

    // gl_FragColor = vec4(vec3(d), 1.); // debug: show the raw distance

    // Turn the distance into brightness:
    // inside the shapes (d < 0) stays black, outside fades to white
    // color += step(0.1, d);                         // hard edge
    color += smoothstep(0., .5, d);                   // soft gradient
    // color += smoothstep(0., .3, abs(d * 10.));     // outlines

    // Colorful animated background: cos with different
    // phase offsets (0, 2, 4) per RGB channel
    vec3 bg = 0.5 + 0.5 * cos(u_time + p.xyx * 0.4 + vec3(0, 2, 4));
    // gl_FragColor = vec4(bg, 1.); // debug: show only the background

    // Add the shapes on top of the background
    color = bg + color;

    gl_FragColor = vec4(color, 1.);
}
