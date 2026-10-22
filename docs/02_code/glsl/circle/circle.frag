// #version 300 es 
precision mediump float;

uniform vec2 u_resolution;


float sdf_circle(vec2 p, float radius) {

    return length(p) - radius;
}

void main() {
    
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
    
    float radius = 0.2;
    float d = sdf_circle(p, radius);

    vec3 color = d < 0. ? vec3(0.) : vec3(1.);
    gl_FragColor = vec4(color, 1.0);
}