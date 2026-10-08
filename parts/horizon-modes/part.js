// horizon-modes-main: left, the chi = 0.7 plunge of Cheung (2608.29466) in Boyer-Lindquist
// coordinates, played in coordinate time t at a constant rate, one
// colour, with a fading tail. After the recorded worldline ends (r = r_+ (1 + 1e-6)) the
// particle stays on r = r_+ and rotates at Omega_H, for as long as the slide is shown.
// Stage 1: the particle fades (exponentially, over several orbits), reappears abruptly on the
// horizon at full brightness, and fades again, indefinitely. Right: the schematic equation with
// its first term c_1 eps (no brackets until the second term), and the plot of -Im(M omega) against Re(M omega) with omega_H^(1).
// Stage 2: the terms c_n eps^n and the modes omega_H^(n) = m Omega_H - i n kappa, n = 2..5,
// then "+ ..." and a vertical ellipsis, appear one pair at a time without further key presses.
(function () {
  "use strict";

  var D = horizon_modes_traj;        // tasks/t05-horizon-modes/S1/make_traj.py; M = 1
  var COL = "84,13,110";             // #540d6e, as in the SBU plunge slide
  // Coordinate time per second of animation, M/s, the same throughout, so that the angular
  // speed on screen is d phi/dt (horizon orbit period 2 pi/(Omega_H RATE) = 0.77 s).
  var RATE = 40;
  var T_TAIL = 0.7;                  // s, a tail point fades to nothing over this time (< 1 horizon orbit)
  var TAU_FADE = 2.5;                // s, e-folding time of the particle's fade (stage >= 1)
  var T_FADE = 9.0;                  // s, the particle is cut off after this long (about 12 orbits) ...
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
      t += RATE * h;
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

  // ---------------------------------------------------------------- the frequency plot
  var NMODE = 5, T_ADD = 0.7;        // modes shown; s between successive terms at stage 2
  var COLS = ["#ee4266", "#ff8c00", "#2a9d8f", "#3a86ff", "#8338ec"];
  var PX0 = 1100, PX1 = 1830, PY0 = 865, PY1 = 400;   // frame: left, right, bottom, top (px)
  var XR = [0, 1.0], YR = [0, 1.4];  // Re(M omega), -Im(M omega)
  var NS = "http://www.w3.org/2000/svg";
  var built = false, shown = 0, timers = [];
  function PX(x) { return PX0 + (x - XR[0]) / (XR[1] - XR[0]) * (PX1 - PX0); }
  function PY(y) { return PY0 - (y - YR[0]) / (YR[1] - YR[0]) * (PY0 - PY1); }

  function el(parent, name, at) {
    var n = document.createElementNS(NS, name);
    for (var k in at) n.setAttribute(k, at[k]);
    parent.appendChild(n);
    return n;
  }
  function lab(box, tex, x, y, opt) {
    var d = document.createElement("div");
    d.className = "horizon-modes-lab";
    d.style.left = x + "px"; d.style.top = y + "px";
    d.style.fontSize = (opt && opt.fs || 34) + "px";
    if (opt && opt.tf) d.style.transform = opt.tf;
    katex.render(tex, d);
    box.appendChild(d);
    return d;
  }

  function build(slide) {
    if (built) return;
    built = true;
    var svg = slide.querySelector(".horizon-modes-plane");
    var box = slide.querySelector(".horizon-modes-labs");
    var ln = { stroke: "#000", "stroke-width": 2.5 };
    // guide at Re(M omega) = m Omega_H, under everything else
    el(svg, "line", { x1: PX(D.m * D.Omega_H), y1: PY0, x2: PX(D.m * D.Omega_H), y2: PY1,
                      stroke: "#aaa", "stroke-width": 2, "stroke-dasharray": "8 8" });
    el(svg, "rect", { x: PX0, y: PY1, width: PX1 - PX0, height: PY0 - PY1, fill: "none",
                      stroke: "#000", "stroke-width": 2.5 });
    var v, maj, L;
    for (v = 0; v <= 100; v += 5) {            // x ticks every 0.05, major every 0.2
      var x = XR[0] + v / 100;
      if (x > XR[1] + 1e-9) break;
      maj = v % 20 === 0; L = maj ? 18 : 9;
      el(svg, "line", { x1: PX(x), y1: PY0, x2: PX(x), y2: PY0 - L, stroke: ln.stroke, "stroke-width": ln["stroke-width"] });
      el(svg, "line", { x1: PX(x), y1: PY1, x2: PX(x), y2: PY1 + L, stroke: ln.stroke, "stroke-width": ln["stroke-width"] });
      if (maj) lab(box, x.toFixed(1), PX(x), PY0 + 26, { fs: 32, tf: "translate(-50%, 0)" });
    }
    for (v = 0; v <= 140; v += 5) {            // y ticks every 0.05, major every 0.2
      var y = YR[0] + v / 100;
      maj = v % 20 === 0; L = maj ? 18 : 9;
      el(svg, "line", { x1: PX0, y1: PY(y), x2: PX0 + L, y2: PY(y), stroke: ln.stroke, "stroke-width": ln["stroke-width"] });
      el(svg, "line", { x1: PX1, y1: PY(y), x2: PX1 - L, y2: PY(y), stroke: ln.stroke, "stroke-width": ln["stroke-width"] });
      if (maj) lab(box, y.toFixed(1), PX0 - 12, PY(y), { fs: 32, tf: "translate(-100%, -50%)" });
    }
    lab(box, "\\mathrm{Re}(M\\omega)", (PX0 + PX1) / 2, PY0 + 68, { fs: 36, tf: "translate(-50%, 0)" });
    lab(box, "-\\mathrm{Im}(M\\omega)", PX0 - 95, (PY0 + PY1) / 2, { fs: 36, tf: "translate(-50%, -50%) rotate(-90deg)" });
    lab(box, "\\chi = " + D.chi + ",\\ m = " + D.m, PX1 - 24, PY1 + 40, { fs: 32, tf: "translate(-100%, -50%)" });
    for (var n = 1; n <= NMODE; n++) {
      var cx = PX(D.m * D.Omega_H), cy = PY(n * D.kappa);
      var c = el(svg, "circle", { cx: cx, cy: cy, r: 12, fill: COLS[n - 1] });
      c.setAttribute("data-n", n); c.classList.add("horizon-modes-term");
      var t = lab(box, "\\color{" + COLS[n - 1] + "}\\omega_H^{(" + n + ")} = m\\Omega_H - " +
                  (n === 1 ? "" : n) + "i\\kappa", cx + 26, cy, { fs: 34 });
      t.setAttribute("data-n", n); t.classList.add("horizon-modes-term");
    }
    var e = lab(box, "\\vdots", PX(D.m * D.Omega_H) - 6, PY((NMODE + 0.75) * D.kappa), { fs: 34 });
    e.setAttribute("data-n", NMODE + 1); e.classList.add("horizon-modes-term");
  }

  function upto(slide, n) {          // show terms and modes 1..n (n = NMODE + 1: the ellipses)
    shown = n;
    slide.querySelector(".horizon-modes-sum").classList.toggle("horizon-modes-nobr", n < 2);
    var els = slide.querySelectorAll(".horizon-modes-term");
    for (var i = 0; i < els.length; i++)
      els[i].classList.toggle("horizon-modes-hid", Number(els[i].getAttribute("data-n")) > n);
  }

  function clearTimers() {
    while (timers.length) clearTimeout(timers.pop());
  }

  Deck.widget("horizon-modes-main", {
    steps: 2,
    enter: function () {},
    leave: function () { stop(); clearTimers(); },
    step: function (slide, k, dir) {
      build(slide);
      clearTimers();
      slide.querySelector(".horizon-modes-right").classList.toggle("horizon-modes-on", k >= 1);
      if (k <= 1) upto(slide, 1);
      else if (dir === 1 && shown < NMODE + 1) {
        for (var j = shown + 1; j <= NMODE + 1; j++)
          timers.push(setTimeout(upto.bind(null, slide, j), (j - shown - 1) * T_ADD * 1000));
      } else upto(slide, NMODE + 1);
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

// horizon-modes-screened: six tiles, one per key press (data-step in part.html), one per paper;
// a seventh key press updates the Sun+ tile (see the widget below).
// Each tile: credit, schematic equation, and a schematic plot of -Im(omega) against Re(omega)
// with omega_H^(1..4) (on the imaginary axis for the Schwarzschild papers), red crosses on the
// modes the paper finds screened (dashed: screened only at leading order), and a purple track for the
// instantaneous frequency and the mode it approaches. Positions are schematic, not to scale.
(function () {
  "use strict";

  var TILES = [                      // record: tasks/t05-horizon-modes/context.md, subcontext/lit_*.md
    { schw: false, cross: [1], dcross: [2], ring: [], track: 0 }, // Zimmerman+: omega_H^(1) cancelled exactly; omega_H^(2) cancelled at leading order only (dashed), returns at next order
    { schw: false, cross: [1, 2, 3, 4], ring: [], track: 1 }, // Oshita+: omega_G -> omega_H^(1) (their l.204)
    { schw: true, cross: [1, 2, 3, 4], ring: [], track: 0 },  // Kuntz+: all vanish, Schwarzschild
    { schw: true, cross: [1], ring: [], track: 1, fade: true }, // Ma+: e^{-kappa u} pieces cancel; omega ~ omega_G(u), no limit stated: the track fades out before omega_H^(1)
    { schw: false, cross: [1, 2, 3, 4], ring: [], track: 2, track2: 3 }, // Sun+: v1 omega_DW -> omega_H^(2); last stage: -> omega_H^(3) (v2, Weller+)
    { schw: false, cross: [1, 2, 3, 4], ring: [], track: 0 }  // Kubota+: all cancel
  ];
  var NS = "http://www.w3.org/2000/svg";
  var X0 = 42, X1 = 292, Y0 = 252, Y1 = 14;   // plot frame in the 300 x 290 svg
  var RE_H = 0.42, DK = 0.205;                // schematic m Omega_H and kappa, in plot units
  var PURPLE = "#540d6e", RED = "#d00000";
  var SVG_L = 610, SVG_T = 4;                 // svg position in the tile: 916 - 6 (right) - 300; top 4
  var built = false;

  function X(re) { return X0 + re * (X1 - X0); }
  function Y(mi) { return Y0 - mi * (Y0 - Y1); }
  function el(parent, name, at) {
    var n = document.createElementNS(NS, name);
    for (var k in at) n.setAttribute(k, at[k]);
    parent.appendChild(n);
    return n;
  }
  function lab(tile, svg, tex, x, y, tf) {   // KaTeX label at svg coordinates (x, y)
    var d = document.createElement("div");
    d.style.position = "absolute";
    d.style.left = (SVG_L + x) + "px";      // fixed offsets: the tiles are hidden when this runs
    d.style.top = (SVG_T + y) + "px";
    d.style.fontSize = "24px";
    d.style.whiteSpace = "nowrap";
    d.style.transform = tf || "translate(0, -50%)";
    katex.render(tex, d);
    tile.appendChild(d);
  }

  // A track that is solid at first, then breaks into dashes that fade out, ending with a
  // faint arrowhead short of the target: a frequency that follows omega_G(u) with no stated limit.
  function fadingTrack(svg, p0, p1, p2, p3) {
    var N = 48, T_SOLID = 0.4, T_END = 0.85, A_END = 0.08;
    function P(t) {
      var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
    }
    function alpha(t) { return t < T_SOLID ? 1 : 1 - (1 - A_END) * (t - T_SOLID) / (T_END - T_SOLID); }
    for (var k = 0; k < N; k++) {
      var t0 = T_END * k / N, t1 = T_END * (k + 1) / N;
      if (t0 >= T_SOLID && k % 2 === 1) continue;        // dashes after the solid part
      var q0 = P(t0), q1 = P(t1);
      el(svg, "line", { x1: q0[0], y1: q0[1], x2: q1[0], y2: q1[1], stroke: PURPLE, "stroke-width": 4,
                        "stroke-linecap": "butt", opacity: alpha(t0).toFixed(3) });
    }
    var pe = P(T_END), pd = P(T_END - 0.02), dx = pe[0] - pd[0], dy = pe[1] - pd[1];
    var L = Math.hypot(dx, dy); dx /= L; dy /= L;
    var h = 11, w = 6;
    el(svg, "path", { d: "M" + (pe[0] + dx * h) + "," + (pe[1] + dy * h) +
                         " L" + (pe[0] - dy * w) + "," + (pe[1] + dx * w) +
                         " L" + (pe[0] + dy * w) + "," + (pe[1] - dx * w) + " z",
                      fill: PURPLE, opacity: A_END });
  }

  function build(slide) {
    if (built) return;
    built = true;
    var tiles = slide.querySelectorAll(".horizon-modes-tile");
    for (var i = 0; i < tiles.length; i++) {
      var T = TILES[i], tile = tiles[i], svg = tile.querySelector(".horizon-modes-tplot");
      var defs = el(svg, "defs", {});
      var mk = el(defs, "marker", { id: "horizon-modes-tarrow-" + i, viewBox: "0 0 10 10", refX: 8, refY: 5,
                                    markerWidth: 4.5, markerHeight: 4.5, orient: "auto" });
      el(mk, "path", { d: "M0,0 L10,5 L0,10 z", fill: PURPLE });
      var ax = el(defs, "marker", { id: "horizon-modes-taxis-" + i, viewBox: "0 0 10 10", refX: 9, refY: 5,
                                    markerWidth: 6, markerHeight: 6, orient: "auto" });
      el(ax, "path", { d: "M0,0 L10,5 L0,10 z", fill: "#000" });
      var axm = "url(#horizon-modes-taxis-" + i + ")";
      el(svg, "line", { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: "#000", "stroke-width": 2.5, "marker-end": axm });
      el(svg, "line", { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: "#000", "stroke-width": 2.5, "marker-end": axm });
      lab(tile, svg, "\\mathrm{Re}\\,\\omega", X1 - 4, Y0 + 4, "translate(-100%, 0)");
      lab(tile, svg, "-\\mathrm{Im}\\,\\omega", X0 - 10, (Y0 + Y1) / 2, "translate(-50%, -50%) rotate(-90deg) translate(0, -60%)");
      var re = T.schw ? 0 : RE_H;
      var targets = T.track2 ? [T.track, T.track2] : (T.track ? [T.track] : []);
      for (var q = 0; q < targets.length; q++) {   // from the right at low damping, then in along a straight diagonal
        var tx = X(re), ty = Y(targets[q] * DK), sx = X(0.98), sy = Y(0.04);
        var ux = 0.6 / Math.hypot(0.6, 1), uy = 1 / Math.hypot(0.6, 1);   // unit vector from the dot, down and right
        var ex = tx + 16 * ux, ey = ty + 16 * uy;                          // stop short of the dot
        var D = Math.min(55, 0.9 * (sy - ey) / uy);                         // straight run in, never below the start
        var c2x = ex + D * ux, c2y = ey + D * uy;
        var c1x = c2x + 0.45 * (sx - c2x), c1y = sy;                        // leave the start horizontally
        if (T.fade) { fadingTrack(svg, [sx, sy], [c1x, c1y], [c2x, c2y], [ex, ey]); continue; }
        el(svg, "path", { d: "M" + sx + "," + sy + " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + ex + "," + ey,
                          fill: "none", stroke: PURPLE, "stroke-width": 4,
                          "class": "horizon-modes-track" + (q + 1),
                          "marker-end": "url(#horizon-modes-tarrow-" + i + ")" });
      }
      for (var n = 1; n <= 4; n++) {
        var px = X(re), py = Y(n * DK);
        el(svg, "circle", { cx: px, cy: py, r: 7, fill: "#000" });
        if (T.ring.indexOf(n) >= 0)
          el(svg, "circle", { cx: px, cy: py, r: 15, fill: "none", stroke: PURPLE, "stroke-width": 4 });
        var dashed = (T.dcross || []).indexOf(n) >= 0;
        if (T.cross.indexOf(n) >= 0 || dashed) {
          var c = 13;
          el(svg, "path", { d: "M" + (px - c) + "," + (py - c) + " L" + (px + c) + "," + (py + c) +
                               " M" + (px - c) + "," + (py + c) + " L" + (px + c) + "," + (py - c),
                            stroke: RED, "stroke-width": 4.5,
                            "stroke-dasharray": dashed ? "7 4" : "none",
                            "stroke-linecap": dashed ? "butt" : "round" });
        }
        if (T.schw) lab(tile, svg, "\\omega_H^{(" + n + ")}", px + 20, py);
        else lab(tile, svg, "\\omega_H^{(" + n + ")}", px - 20, py, "translate(-100%, -50%)");  // left: clear of the track
      }
    }
  }

  // Stage 7: in the Sun+ tile the omega_H^(2) arrow turns dashed and faint, an arrow to omega_H^(3)
  // appears, the equation line changes to omega_H^(3), and the Weller+ credit appears.
  Deck.widget("horizon-modes-screened", {
    steps: 7,
    enter: function (slide) { build(slide); },
    step: function (slide, k) {
      build(slide);
      var tile = slide.querySelector('.horizon-modes-tile[data-tile="4"]'), v2 = k >= 7;
      tile.classList.toggle("horizon-modes-v2", v2);
      var t1 = tile.querySelector(".horizon-modes-track1"), t2 = tile.querySelector(".horizon-modes-track2");
      t1.setAttribute("stroke-dasharray", v2 ? "9 7" : "none");
      t1.setAttribute("opacity", v2 ? 0.35 : 1);
      t2.style.visibility = v2 ? "" : "hidden";
    }
  });
})();
