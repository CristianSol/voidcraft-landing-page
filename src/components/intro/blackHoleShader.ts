// El quad se dibuja directo en coordenadas de clip (ignora la cámara),
// así que el plano [2,2] siempre cubre el viewport completo.
export const blackHoleVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const blackHoleFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec2 uWind;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = p * 2.03 + vec2(17.0, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 screen = (vUv - 0.5) * 2.0;
    float aspect = uResolution.x / uResolution.y;
    vec2 p0 = screen;
    p0.x *= aspect;

    // Encuadre en pantallas angostas: la vista arranca más lejos (como si
    // se normalizara por el lado corto) para que se vea la estela y no
    // solo el centro negro. Converge al encuadre estándar en progress 0.8
    // para no romper la calibración del negro total en ~0.85.
    float fitStart = min(max(1.0 / aspect, 1.0), 2.8);
    float fit = mix(fitStart, 1.0, smoothstep(0.0, 0.8, uProgress));
    p0 *= fit;

    // Caída al agujero: zoom exponencial (perceptualmente uniforme).
    // La curva está calibrada para que el horizonte llene la pantalla
    // justo cuando empieza el fade del contenido (~progress 0.85).
    float ease = pow(uProgress, 1.6);
    float zoom = pow(0.1, ease);
    float steady = (1.0 - ease) * (1.0 - ease);

    // Parálax del mouse: se aplica antes del zoom (el desplazamiento se
    // encoge al caer) y se amortigua con la caída para converger al centro.
    vec2 par = uMouse * vec2(0.22, 0.15) * steady;

    // Ráfaga de viento bajo el cursor: uWind es la velocidad suavizada del
    // mouse (0 si está quieto), así que el humo solo se mueve mientras el
    // mouse se mueve y vuelve solo a su posición. El signo negativo en el
    // muestreo hace que el humo se vea empujado A FAVOR del movimiento
    // (repulsión), no atraído hacia el cursor.
    vec2 mNdc = vec2(uMouse.x * aspect, uMouse.y) * fit;
    vec2 dm = p0 - mNdc;
    float gustMask = exp(-dot(dm, dm) / 0.05);
    vec2 smokePush = -uWind * 0.12 * gustMask * steady;

    // Trayectoria parabólica: la cámara se desvía hacia un lado y vuelve
    // al centro antes del negro final (el arco muere en progress 0.8),
    // así la caída no es un dolly estático hacia el centro. El offset va
    // antes del zoom, igual que el parálax.
    float arcT = sin(3.14159265 * smoothstep(0.0, 0.8, uProgress));
    vec2 arc = vec2(-0.5, 0.16) * arcT;

    vec2 p = (p0 + par + arc) * zoom;
    vec2 ps = (p0 + par + arc + smokePush) * zoom;

    float r = length(p);

    const float HOLE = 0.32;

    // Órbita alrededor del disco de acreción: NADA rota en pantalla (rotar
    // la forma del disco se lee como un roll de cámara — rechazado dos
    // veces). Lo que circula es el MATERIAL del disco: las bandas barren
    // en ángulo (orbitSweep dentro de swirl) como cuando rodeas un disco,
    // y la inclinación sube de lateral a semi-cenital porque la cámara se
    // acerca por encima del plano del disco.
    float tilt = mix(0.34, 0.75, ease);
    vec2 pd = vec2(ps.x, ps.y / tilt);
    float rd = length(pd);
    float angleD = atan(pd.y, pd.x);

    // Rotación diferencial (más rápido cerca del horizonte) + barrido
    // orbital acumulado durante la caída.
    float orbitSweep = ease * 2.5;
    float swirl = uTime * 0.25 + orbitSweep + 2.2 / (rd + 0.25);
    vec2 q = vec2(cos(angleD + swirl), sin(angleD + swirl)) * rd;

    float bands = fbm(q * 3.0 + fbm(q * 6.0) * 0.6);
    // Más contraste en las vetas para que el movimiento orbital se lea.
    bands = smoothstep(0.25, 0.85, bands);

    // Disco de acreción: brillo que decae al alejarse del horizonte.
    float d = max(rd - HOLE, 0.0);
    float disk = exp(-d * 2.6) * (0.35 + 0.95 * bands);

    // Halo esférico suave (luz lensada alrededor del horizonte).
    float halo = 0.5 * exp(-max(r - HOLE, 0.0) * 5.0);

    // Anillo de fotones pegado al horizonte.
    float rim = 1.4 * exp(-abs(r - HOLE) * 22.0);

    float glow = disk + halo + rim;

    // Paleta: negro -> morados profundos -> #a855f7 -> lavanda casi blanca.
    vec3 deep   = vec3(0.16, 0.05, 0.35);
    vec3 violet = vec3(0.30, 0.11, 0.58);
    vec3 purple = vec3(0.49, 0.23, 0.93);
    vec3 bright = vec3(0.66, 0.33, 0.97);
    vec3 hot    = vec3(0.91, 0.85, 1.0);

    float t = clamp(glow, 0.0, 2.2);
    vec3 col = mix(vec3(0.0), deep, smoothstep(0.0, 0.35, t));
    col = mix(col, violet, smoothstep(0.25, 0.7, t));
    col = mix(col, purple, smoothstep(0.6, 1.1, t));
    col = mix(col, bright, smoothstep(1.0, 1.6, t));
    col = mix(col, hot, smoothstep(1.5, 2.2, t));

    // Estrellas tenues, solo lejos del disco.
    vec2 sp = p * 14.0;
    vec2 cell = floor(sp);
    float sh = hash(cell);
    vec2 starPos = fract(sp) - 0.5 - (vec2(hash(cell + 1.3), hash(cell + 2.7)) - 0.5) * 0.8;
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + sh * 40.0);
    float star = step(0.985, sh) * smoothstep(0.09, 0.0, length(starPos)) * twinkle;
    col += star * vec3(0.75, 0.65, 0.95) * smoothstep(0.5, 1.2, r);

    // Horizonte de eventos: negro absoluto con borde suave.
    col *= smoothstep(HOLE * 0.92, HOLE, r);

    // Viñeta sobre coordenadas de pantalla (no zoomeadas).
    col *= 1.0 - 0.35 * smoothstep(0.7, 1.6, length(screen));

    // Garantía de negro total al final del scroll.
    col *= 1.0 - smoothstep(0.92, 1.0, uProgress);

    gl_FragColor = vec4(col, 1.0);
  }
`
