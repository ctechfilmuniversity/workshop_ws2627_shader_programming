// #version 300 es 
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;


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

    // Union of shapes 
    // float d = min(circle1, circle2); // union of the two big circles
    // d *= max(d, circle3);

    float d1 = min(circle1, circle2); // union of the two big circles
    float d2 = d1 * max(d1, circle3);

    // threshold color based on distance
    vec3 color = d2 < 0. ? vec3(0.) : vec3(1.);
    gl_FragColor = vec4(color, 1.0);
}