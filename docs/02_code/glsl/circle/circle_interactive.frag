// #version 300 es 
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;


// https://iquilezles.org/articles/smin/
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float sdf_circle(vec2 p, float radius) {

    return length(p) - radius;
}

void main() {
    
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // Mouse Normalization
    vec2 mouse = (2.0 * u_mouse - u_resolution.xy) / u_resolution.y;


    float radius = 0.4;

    // The circles
    vec2 circle1_center = p;
    vec2 circle2_center = p - mouse;


    float circle1 = sdf_circle(circle1_center, radius);
    float circle2 = sdf_circle(circle2_center, radius * 0.5);


    // Smooth Minimum
    float d = smin(circle1, circle2, 0.7);

    // threshold color based on distance
    vec3 color = d < 0. ? vec3(0.) : vec3(1.);
    gl_FragColor = vec4(color, 1.0);
}