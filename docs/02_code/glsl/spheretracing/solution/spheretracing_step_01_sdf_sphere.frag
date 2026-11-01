precision highp float;

uniform vec2 u_resolution;

// ---- [A] Uniforms & Defines ----



// ---- [B] Signed Distance Functions ----

// Signed distance function between
// point and sphere
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}


// ---- [C] The Scene ----



// ---- [D] Moving Along the Ray ----



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



    // ---- [H] Tracing the Ray ----



    // ---- [I] The Fragment Color ----

    // Visualization: a slice through the
    // distance field of the sphere at z = 0
    float distance_to_sphere = sdfSphere(vec3(p, 0.), 0.5);
    color = vec3(distance_to_sphere);


    gl_FragColor = vec4(color, 1.0);
}
