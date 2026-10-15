import * as THREE from 'three';

export const WATER_SURFACE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWaterLevel;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;

  attribute float aTerrainHeight;

  varying vec3 vWorldPos;
  varying float vTerrainHeight;
  varying float vWaveDisp;
  varying vec2 vUv;

  float waveFunc(vec2 p, float t) {
    float w1 = sin(p.x * 0.75 + p.y * 0.55 + t * 1.65) * 0.42;
    float w2 = cos(p.x * 0.45 - p.y * 0.88 + t * 1.25) * 0.35;
    float w3 = sin(p.x * 1.65 - p.y * 1.35 - t * 2.15) * 0.15;
    float w4 = cos(p.x * 2.40 + p.y * 2.10 + t * 2.80) * 0.08;
    return (w1 + w2 + w3 + w4);
  }

  void main() {
    vUv = uv;
    vTerrainHeight = aTerrainHeight;
    float rawDepth = max(0.0, uWaterLevel - aTerrainHeight);
    float shoreDamp = smoothstep(0.0, 0.35, rawDepth);

    float t = uTime * uWaveSpeed;
    float disp = waveFunc(position.xz, t) * uWaveHeight * shoreDamp;
    vWaveDisp = disp;

    vec3 displaced = vec3(position.x, uWaterLevel + disp, position.z);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const WATER_SURFACE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uWaterLevel;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;
  uniform float uClarity;
  uniform float uFoamIntensity;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform vec3 uSkyColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uObstaclePos[10];

  varying vec3 vWorldPos;
  varying float vTerrainHeight;
  varying float vWaveDisp;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.07 + vec2(13.1, 7.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float waterDepth = (uWaterLevel + vWaveDisp) - vTerrainHeight;
    if (waterDepth < -0.008) {
      discard;
    }
    float depth = max(0.0, waterDepth);
    float t = uTime * uWaveSpeed;
    vec2 xz = vWorldPos.xz;

    float eps = 0.09;
    float n0 = fbm(xz * 0.92 + vec2(t * 0.32, -t * 0.24)) + 0.45 * fbm(xz * 2.2 - vec2(t * 0.45, t * 0.38));
    float nx = fbm((xz + vec2(eps, 0.0)) * 0.92 + vec2(t * 0.32, -t * 0.24)) - n0;
    float nz = fbm((xz + vec2(0.0, eps)) * 0.92 + vec2(t * 0.32, -t * 0.24)) - n0;

    float pillarFoam = 0.0;
    vec2 rippleGrad = vec2(0.0);
    for (int i = 0; i < 10; i++) {
      vec2 obsXZ = uObstaclePos[i].xy;
      float obsR = uObstaclePos[i].z;
      if (obsR > 0.01) {
        vec2 dVec = xz - obsXZ;
        float d = length(dVec) - obsR;
        if (d < 1.35 && d > -obsR) {
          float falloff = exp(-max(0.0, d) * 2.8);
          float warp = (n0 - 0.45) * 0.35;
          float phase = (d + warp) * 20.0 - t * 3.4;
          float ring = sin(phase) * falloff;
          vec2 dir = dVec / max(length(dVec), 0.001);
          rippleGrad += dir * cos(phase) * falloff * 0.12;
          float collar = smoothstep(0.18, 0.0, max(0.0, d - warp * 0.18)) * smoothstep(0.28, 0.65, n0);
          float wake = smoothstep(0.68, 0.95, ring) * smoothstep(0.95, 0.08, d) * smoothstep(0.35, 0.72, n0) * 0.38;
          pillarFoam = max(pillarFoam, collar * 0.85 + wake);
        }
      }
    }

    float normStrength = mix(0.24, 0.52, clamp(uWaveHeight / 0.08, 0.3, 1.8));
    vec3 N = normalize(vec3(
      -(nx * normStrength + rippleGrad.x),
      1.0,
      -(nz * normStrength + rippleGrad.y)
    ));

    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    float depthFactor = smoothstep(0.04, 0.92 * max(0.35, uClarity), depth);
    vec3 waterCol = mix(uShallowColor, uDeepColor, clamp(depthFactor, 0.0, 1.0));

    float waveCrest = smoothstep(0.46, 0.78, n0);
    waterCol = mix(waterCol, uShallowColor * 1.12, waveCrest * 0.22);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);
    vec3 reflCol = mix(waterCol * 1.18, uSkyColor, 0.68);

    float toriiReflDist = length((xz - vec2(-1.65, 3.65)) * vec2(0.75, 0.85));
    if (toriiReflDist < 2.2) {
      float rMask = (1.0 - smoothstep(0.3, 2.2, toriiReflDist)) * (0.5 + 0.5 * sin(xz.x * 9.0 + n0 * 5.0));
      reflCol = mix(reflCol, vec3(0.84, 0.24, 0.16), rMask * 0.32);
    }

    vec3 surfaceCol = mix(waterCol, reflCol, clamp(fresnel * 0.68 + 0.10, 0.0, 0.80));

    float foamNoise = fbm(xz * 4.2 + vec2(t * 0.38, -t * 0.32));
    float shoreLine = 1.0 - smoothstep(0.0, 0.16, depth - (foamNoise - 0.45) * 0.08);
    float surfRipple = sin(depth * 32.0 + t * 3.0 + foamNoise * 4.5);
    float secondarySurf = smoothstep(0.62, 0.94, surfRipple) * (1.0 - smoothstep(0.04, 0.36, depth)) * smoothstep(0.32, 0.68, foamNoise) * 0.52;
    float totalFoam = clamp((shoreLine * 0.82 + secondarySurf + pillarFoam) * uFoamIntensity, 0.0, 1.0);

    vec3 foamColor = mix(vec3(0.95, 0.98, 0.98), uSunColor, 0.16);
    surfaceCol = mix(surfaceCol, foamColor, totalFoam);

    vec3 H = normalize(L + V);
    float spec1 = pow(max(dot(N, H), 0.0), 120.0) * 0.78;
    float spec2 = pow(max(dot(N, H), 0.0), 24.0) * 0.15;
    surfaceCol += uSunColor * (spec1 + spec2);

    float edgeX = abs(xz.x) - (11.0 - 2.0);
    float edgeZ = abs(xz.y) - (11.0 - 2.0);
    float sdEdge = length(max(vec2(edgeX, edgeZ), 0.0)) + min(max(edgeX, edgeZ), 0.0) - 2.0;
    float rimHighlight = smoothstep(-0.24, 0.0, sdEdge);
    surfaceCol = mix(surfaceCol, mix(uShallowColor, vec3(1.0), 0.58), rimHighlight * 0.48);

    float baseAlpha = mix(0.46, 0.84, clamp(depthFactor * 0.88 + fresnel * 0.32, 0.0, 1.0));
    float edgeFade = smoothstep(-0.008, 0.025, waterDepth);
    float finalAlpha = clamp(mix(baseAlpha, 0.94, totalFoam) * edgeFade, 0.0, 0.95);

    gl_FragColor = vec4(surfaceCol, finalAlpha);
  }
`;

export const WATER_SIDE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWaterLevel;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;

  attribute float aTerrainHeight;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying float vDepthRatio;

  float waveFunc(vec2 p, float t) {
    float w1 = sin(p.x * 0.75 + p.y * 0.55 + t * 1.65) * 0.42;
    float w2 = cos(p.x * 0.45 - p.y * 0.88 + t * 1.25) * 0.35;
    return (w1 + w2);
  }

  void main() {
    vUv = uv;
    float t = uTime * uWaveSpeed;
    float rawDepth = max(0.0, uWaterLevel - aTerrainHeight);
    float disp = waveFunc(position.xz, t) * uWaveHeight * smoothstep(0.0, 0.35, rawDepth);

    float topY = max(aTerrainHeight, uWaterLevel + disp);
    float botY = min(aTerrainHeight, topY);
    float curY = mix(botY, topY, uv.y);

    vDepthRatio = 1.0 - uv.y;
    vec3 pos = vec3(position.x, curY, position.z);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const WATER_SIDE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying float vDepthRatio;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    vec3 col = mix(uShallowColor * 0.92, uDeepColor * 0.82, pow(vDepthRatio, 0.85));

    float rayCoord = (vWorldPos.x + vWorldPos.z) * 1.35 + vWorldPos.y * 0.9 - uTime * 0.45;
    float rays = pow(0.5 + 0.5 * sin(rayCoord) * cos(rayCoord * 0.65), 3.0);
    col += uShallowColor * rays * 0.14 * (1.0 - vDepthRatio * 0.6);

    float ndl = max(dot(N, L), 0.0) * 0.32 + 0.68;
    col *= ndl;

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    col += vec3(0.85, 0.96, 0.98) * fresnel * 0.20;

    float topMeniscus = smoothstep(0.89, 1.0, vUv.y);
    col = mix(col, mix(uShallowColor, vec3(1.0), 0.62), topMeniscus * 0.65);

    float bottomAO = smoothstep(0.0, 0.14, vUv.y);
    col *= (0.78 + 0.22 * bottomAO);

    float alpha = mix(0.80, 0.92, vDepthRatio);
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createObstacleUniformArray(): THREE.Vector3[] {
  return [
    new THREE.Vector3(-2.65, 3.05, 0.18),
    new THREE.Vector3(-0.65, 3.65, 0.18),
    new THREE.Vector3(-2.85, 3.65, 0.12),
    new THREE.Vector3(-2.45, 2.45, 0.12),
    new THREE.Vector3(-0.85, 4.25, 0.12),
    new THREE.Vector3(-0.45, 3.05, 0.12),
    new THREE.Vector3(-4.25, 0.55, 0.85),
    new THREE.Vector3(2.75, 1.95, 0.95),
    new THREE.Vector3(-2.85, 1.85, 0.20),
    new THREE.Vector3(1.15, 2.55, 0.20)
  ];
}
