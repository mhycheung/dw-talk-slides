// horizon-modes-main: left, the chi = 0.7 plunge of Cheung (2608.29466) in Boyer-Lindquist
// coordinates, played in coordinate time t (faster far out, slower near the horizon), one colour, with a fading tail. After
// the recorded worldline ends (r = r_+ (1 + 1e-6)) the particle stays on r = r_+ and rotates
// at Omega_H, for as long as the slide is shown.
// Stage 1: the particle fades (exponentially, over several orbits), reappears abruptly on the
// horizon at full brightness, and fades again, indefinitely. Right: the complex plane with
// omega_H^(1) (data-step in part.html). Stage 2: the equation. Stage 3: omega_H^(2..5).
(function () {
  "use strict";

  var D = horizon_modes_traj;        // tasks/t05-horizon-modes/S1/make_traj.py; M = 1
  var COL = "84,13,110";             // #540d6e, as in the SBU plunge slide
  // Coordinate time per second of animation, M/s: R_FAR far out, R_NEAR near the horizon,
  // switched smoothly around t = T_SW (the light-ring crossing is at t = 172.5 M), so that
  // the plunge is quick but the horizon orbit (period 2 pi/(Omega_H R_NEAR) = 2.05 s) is slow.
  var R_FAR = 40, R_NEAR = 15, T_SW = 170, W_SW = 8;
  var T_TAIL = 1.8;                  // s, a tail point fades to nothing over this time (< 1 horizon orbit)
  var TAU_FADE = 2.5;                // s, e-folding time of the particle's fade (stage >= 1)
  var T_FADE = 9.0;                  // s, the particle is cut off after this long (about 4 orbits) ...
  var T_GAP = 0.5;                   // s, ... stays invisible this long, then reappears
  var L = 3.9;                       // half-width of the view, in M
  var LW = 5.5;                      // tail width, px of the 860 px canvas
  var DOT = 11;                      // particle radius, px
  var N = D.xy.length;
  var PHI_END = Math.atan2(D.xy[N - 1][1], D.xy[N - 1][0]);
  var T_END = (N - 1) * D.dt;        // last resampled time, M

  var raf = null, last = 0;
  var t = 0;                         // coordinate time of the particle, M
  var fading = false, fadeAge = 0;   // stage >= 1: time since the particle last reappeared, s
  var tail = [];                     // [x, y, brightness, age in s]

  function fit(c) {
    var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var w = Math.max(50, Math.round(r.width * dpr)), h = Math.max(50, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return w / c.offsetWidth;
  }

  function pos(tc) {
    if (tc >= T_END) {
      var a = PHI_END + D.Omega_H * (tc - T_END);
      return [D.r_plus * Math.cos(a), D.r_plus * Math.sin(a)];
    }
    var f = tc / D.dt, i = Math.min(N - 2, Math.floor(f)), u = f - i;
    var p = D.xy[i], q = D.xy[i + 1];
    return [p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])];
  }

  function brightness() {
    if (!fading) return 1;
    return fadeAge < T_FADE ? Math.exp(-fadeAge / TAU_FADE) : 0;
  }

  function advance(dt) {
    if (dt <= 0) return;
    var n = Math.ceil(dt / 0.004);      // sub-steps keep the tail smooth
    for (var j = 0; j < n; j++) {
      var h = dt / n;
      t += (R_NEAR + (R_FAR - R_NEAR) / (1 + Math.exp((t - T_SW) / W_SW))) * h;
      if (fading) {
        fadeAge += h;
        if (fadeAge >= T_FADE + T_GAP) fadeAge = 0;   // reappear on the horizon
      }
      for (var k = 0; k < tail.length; k++) tail[k][3] += h;
      var p = pos(t);
      tail.push([p[0], p[1], brightness(), 0]);
    }
    while (tail.length && tail[0][3] > T_TAIL) tail.shift();
  }

  function draw(slide) {
    var c = slide.querySelector(".horizon-modes-canvas"), k = fit(c), g = c.getContext("2d");
    var W = c.width, s = W / (2 * L), cx = W / 2, cy = c.height / 2;
    g.clearRect(0, 0, W, c.height);
    g.fillStyle = "#000";
    g.beginPath(); g.arc(cx, cy, s * D.r_plus, 0, 2 * Math.PI); g.fill();

    g.lineCap = "round"; g.lineWidth = LW * k;
    for (var i = 1; i < tail.length; i++) {
      var a = tail[i - 1], b = tail[i];
      var al = b[2] * (1 - b[3] / T_TAIL);
      if (al <= 0.003) continue;
      g.strokeStyle = "rgba(" + COL + "," + al.toFixed(3) + ")";
      g.beginPath();
      g.moveTo(cx + s * a[0], cy - s * a[1]);
      g.lineTo(cx + s * b[0], cy - s * b[1]);
      g.stroke();
    }
    var p = pos(t), br = brightness();
    if (br > 0) {
      g.fillStyle = "rgba(" + COL + "," + br.toFixed(3) + ")";
      g.beginPath(); g.arc(cx + s * p[0], cy - s * p[1], DOT * k, 0, 2 * Math.PI); g.fill();
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function run(slide) {
    if (raf) return;
    last = performance.now();
    function frame(now) {
      advance(Math.max(0, Math.min(0.1, (now - last) / 1000)));
      last = now;
      draw(slide);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  Deck.widget("horizon-modes-main", {
    steps: 3,
    enter: function () {},
    leave: function () { stop(); },
    step: function (slide, k, dir) {
      if (k === 0) {
        fading = false;
        if (dir !== -1) { t = 0; tail = []; }               // arrival: play the plunge
        else if (t < T_END) { t = T_END; tail = []; }       // back: already on the horizon
      } else if (!fading) {
        fading = true; fadeAge = 0;
        if (t < T_END) { t = T_END; tail = []; }            // a pressed key ends the plunge
      }
      run(slide);
    }
  });
})();
