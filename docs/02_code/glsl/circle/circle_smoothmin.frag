// #version 300 es 
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;


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

    float radius = 0.2;

    // The circles
    vec2 circle1_center = p - vec2(.5, 0.);
    vec2 circle2_center = p - vec2(-0.5, 0.);
    vec2 circle3_center = p - vec2(sin(u_time) * 0.4, 0.);

    float circle1 = sdf_circle(circle1_center, radius);
    float circle2 = sdf_circle(circle2_center, radius);
    float circle3 = sdf_circle(circle3_center, radius / 1.8);

    // Smooth Minimum
    float d = min(circle1, circle2);
    d = smin(d, circle3, 0.2);

    // threshold color based on distance
    vec3 color = d < 0. ? vec3(0.) : vec3(1.);
    gl_FragColor = vec4(color, 1.0);
}