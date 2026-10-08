// Step-by-step slides of the time-domain rational filter, Eq. (N17) of Cheung (2608.29466).
//
// td-filter-n17: a 220 QNM that starts abruptly at t = 0. For t >= 0 the waveform to the
// future of t, rescaled to unit amplitude, is exactly Q_220, so the mismatch term and the
// filtered waveform vanish. For t < 0, Psi(t) = 0 and the filter returns minus the
// least-squares amplitude of a QNM fitted to the waveform after t: the ringdown flipped
// in time, -A e^{-i omega^* t}.
// td-filter-diff: the same filter on a QNM of another frequency omega' (t >= 0 only).
// There psi = Q' and the mismatch is the constant F(omega') = (omega' - omega_220) /
// (omega' - omega_220^*), so the filtered waveform is the same QNM rescaled by F(omega').
// td-filter-plunge: the same filter on the plunge waveform of 2608.29466 (data and the
// filtered waveform precomputed by tasks/t04-td-filter/plunge_data.py).
//
// All panels show |.| (black) and |Re .| (gray) on a log axis; on the first two slides
// exact zeros go on a separate "0" row below an axis break.
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  // Toy 220 mode: same quality factor as Schwarzschild 220 (M omega = 0.3737 - 0.0890 i),
  // time unit rescaled so that a step of 1 in t is visible.
  var WR = 2.0, WI = -0.475;      // omega_220 = WR + i WI
  var W220 = [WR, WI];
  // Schwarzschild 330 (M omega = 0.5994 - 0.0927 i) in the same rescaled units:
  // each part scaled by the ratio of the 330 and 220 parts
  var W330 = [WR * 0.5994 / 0.3737, WI * 0.0927 / 0.0890];
  var AR = Math.cos(0.2), AI = -Math.sin(0.2);  // complex amplitude A; phase keeps t = 0, 1, 2 off the zeros of Re

  // Per-slide axes, set by base(): time range, x range in slide px, log10 range, "0" row
  var T0, T1, X0, X1, LMIN, LMAX = Math.log10(2), ZERO;
  // y0: top of the frame; lb: bottom of the log region; z: the "0" row; y1: the x axis
  var TOPZ = { y0: 250, lb: 465, z: 510, y1: 540, id: "top" };
  var BOTZ = { y0: 635, lb: 850, z: 895, y1: 925, id: "bot" };
  // the same frames with no "0" row: the log region fills the frame
  var TOPN = { y0: 250, lb: 530, y1: 540, id: "top" };
  var BOTN = { y0: 635, lb: 915, y1: 925, id: "bot" };
  var TOP, BOT;
  var BRK = 237;                  // offset of the axis break below y0
  var XL = 270, XR = 1250;        // x range of a slide with equations on the right
  var DX = 282;                   // shift that centres a slide with nothing on the right

  function X(t) { return X0 + (t - T0) / (T1 - T0) * (X1 - X0); }
  function LY(p, v) {
    var l = v > 0 ? Math.log10(v) : -99;
    return p.y0 + (LMAX - l) / (LMAX - LMIN) * (p.lb - p.y0);
  }

  // Re[a e^{-i omega (t - ts)}] for complex a = (ar, ai), omega = w[0] + i w[1]
  function qnm(ar, ai, ts, t, w) {
    var s = t - ts, e = Math.exp(w[1] * s), c = Math.cos(w[0] * s), sn = Math.sin(w[0] * s);
    // e^{-i omega s} = e^{w1 s} (cos w0 s - i sin w0 s)
    return e * (ar * c + ai * sn);
  }
  // |a e^{-i omega (t - ts)}|
  function env(ar, ai, ts, t, w) { return Math.hypot(ar, ai) * Math.exp(w[1] * (t - ts)); }
  // Psi(ts) = A e^{-i omega ts} as a complex number
  function psiAt(ts, w) {
    var e = Math.exp(w[1] * ts), c = Math.cos(w[0] * ts), sn = Math.sin(w[0] * ts);
    return [e * (AR * c + AI * sn), e * (AI * c - AR * sn)];
  }

  // c(ts) = (Q_220 | Psi(ts + tau))_tau / (Q_220 | Q_220)_tau for ts < 0, the least-squares
  // amplitude of a QNM starting at ts fitted to Psi after ts: c = A e^{-i omega^* ts}.
  // The filtered waveform there is -c. (Checked numerically against Eq. N12.)
  function fitAt(ts) {
    var e = Math.exp(-WI * ts), c = Math.cos(WR * ts), sn = Math.sin(WR * ts);
    return [e * (AR * c + AI * sn), e * (AI * c - AR * sn)];
  }

  // complex product
  function mul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  // F(omega') = (omega' - omega_220) / (omega' - omega_220^*)
  function filterAt(w) {
    var nr = w[0] - WR, ni = w[1] - WI, dr = w[0] - WR, di = w[1] + WI, d2 = dr * dr + di * di;
    return [(nr * dr + ni * di) / d2, (ni * dr - nr * di) / d2];
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }

  // |fn| on the log axis, from ta to tb, clipped to the log region of panel p
  function logPath(fn, ta, tb, p) {
    var d = "", n = 5000;
    for (var i = 0; i <= n; i++) {
      var t = ta + (tb - ta) * i / n;
      var y = Math.min(LY(p, Math.abs(fn(t))), p.lb + 400);
      d += (i ? "L" : "M") + X(t).toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  function clipOf(svg, p) { return "url(#" + svg.getAttribute("data-clip") + p.id + ")"; }

  // a curve given as |.| and |Re .| functions of t, from ta to tb
  function curve(svg, p, fAbs, fRe, ta, tb, col, colRe, dash) {
    var clip = clipOf(svg, p);
    var re = { d: logPath(fRe, ta, tb, p), fill: "none", stroke: colRe, "stroke-width": 4, "clip-path": clip };
    var ab = { d: logPath(fAbs, ta, tb, p), fill: "none", stroke: col, "stroke-width": 5, "clip-path": clip };
    if (dash) { re["stroke-dasharray"] = "18 12"; ab["stroke-dasharray"] = "18 12"; }
    el("path", re, svg);
    el("path", ab, svg);
  }

  // a QNM a e^{-i omega (t - ts)} from ts on
  function pair(svg, p, ar, ai, ts, w, col, colRe, dash) {
    curve(svg, p, function (t) { return env(ar, ai, ts, t, w); },
          function (t) { return qnm(ar, ai, ts, t, w); }, ts, T1, col, colRe, dash);
  }

  function frame(svg, p, tick) {
    var k = "#000", w = 3, brk = p.y0 + BRK;
    var clip = el("clipPath", { id: svg.getAttribute("data-clip") + p.id }, svg);
    el("rect", { x: X0, y: p.y0, width: X1 - X0, height: p.lb - p.y0 }, clip);
    // frame: top and bottom spines, side spines interrupted at the break if there is a "0" row
    el("line", { x1: X0, x2: X1, y1: p.y0, y2: p.y0, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X0, x2: X1, y1: p.y1, y2: p.y1, stroke: k, "stroke-width": w }, svg);
    [X0, X1].forEach(function (x) {
      if (!ZERO) {
        el("line", { x1: x, x2: x, y1: p.y0, y2: p.y1, stroke: k, "stroke-width": w }, svg);
        return;
      }
      el("line", { x1: x, x2: x, y1: p.y0, y2: brk - 7, stroke: k, "stroke-width": w }, svg);
      el("line", { x1: x, x2: x, y1: brk + 7, y2: p.y1, stroke: k, "stroke-width": w }, svg);
      [-7, 7].forEach(function (o) {
        el("line", { x1: x - 12, x2: x + 12, y1: brk + o + 5, y2: brk + o - 5, stroke: k, "stroke-width": w }, svg);
      });
    });
    // x ticks, inward, on both spines
    for (var t = Math.ceil(T0 / tick) * tick; t <= T1; t += tick) {
      el("line", { x1: X(t), x2: X(t), y1: p.y1, y2: p.y1 - 14, stroke: k, "stroke-width": w }, svg);
      el("line", { x1: X(t), x2: X(t), y1: p.y0, y2: p.y0 + 14, stroke: k, "stroke-width": w }, svg);
    }
    // log y ticks: major at each decade, minor at 2..9
    for (var e = LMIN; e <= 0; e++) {
      for (var m = 1; m <= 9; m++) {
        var v = m * Math.pow(10, e);
        if (Math.log10(v) > LMAX) break;
        var y = LY(p, v), len = m === 1 ? 16 : 8;
        el("line", { x1: X0, x2: X0 + len, y1: y, y2: y, stroke: k, "stroke-width": w }, svg);
        el("line", { x1: X1, x2: X1 - len, y1: y, y2: y, stroke: k, "stroke-width": w }, svg);
      }
    }
    if (!ZERO) return;
    // the "0" row
    el("line", { x1: X0, x2: X0 + 16, y1: p.z, y2: p.z, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X1, x2: X1 - 16, y1: p.z, y2: p.z, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X0, x2: X1, y1: p.z, y2: p.z, stroke: "#ccc", "stroke-width": 2 }, svg);
  }

  // tick and axis labels, rendered once with KaTeX; the panel names placed at the right edge
  function labels(slide, cfg) {
    var box = slide.querySelector(".td-filter-axes");
    if (box.firstChild) return;
    function put(tex, x, y, cls, tf) {
      var s = document.createElement("span");
      s.className = cls;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.transform = tf;
      katex.render(tex, s);
      box.appendChild(s);
    }
    [TOP, BOT].forEach(function (p) {
      for (var e = LMIN; e <= 0; e++) {
        put("10^{" + e + "}", X0 - 12, LY(p, Math.pow(10, e)), "td-filter-tick", "translate(-100%,-50%)");
      }
      if (ZERO) put("0", X0 - 12, p.z, "td-filter-tick", "translate(-100%,-50%)");
    });
    for (var t = Math.ceil(T0 / cfg.tlab) * cfg.tlab; t <= T1; t += cfg.tlab) {
      put(String(t), X(t), BOT.y1 + 8, "td-filter-tick", "translate(-50%,0)");
    }
    put(cfg.xlabel, (X0 + X1) / 2, BOT.y1 + 46, "td-filter-axlabel", "translate(-50%,0)");
    put("|\\Psi|,\\ {\\color{#999}|\\mathrm{Re}\\,\\Psi|}", X0 - 140, (TOP.y0 + TOP.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
    put("|\\hat{\\Psi}|,\\ {\\color{#999}|\\mathrm{Re}\\,\\hat{\\Psi}|}", X0 - 140, (BOT.y0 + BOT.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
    // panel names inside the frame at the top right, or just outside it on the right
    slide.querySelectorAll(".td-filter-label").forEach(function (l) {
      l.style.left = (cfg.labelOut ? X1 + 30 : X1 - 390) + "px";
      if (cfg.labelOut) l.style.textAlign = "left";
    });
  }

  // set the slide's axes, draw empty frames and labels; return the svg
  function base(slide, cfg) {
    T0 = cfg.t0; T1 = cfg.t1; LMIN = cfg.lmin; ZERO = cfg.zero;
    X0 = XL + (cfg.centre ? DX : 0); X1 = XR + (cfg.centre ? DX : 0);
    TOP = ZERO ? TOPZ : TOPN; BOT = ZERO ? BOTZ : BOTN;
    labels(slide, cfg);
    var svg = slide.querySelector(".td-filter-plot");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    frame(svg, TOP, cfg.tick);
    frame(svg, BOT, cfg.tick);
    return svg;
  }

  // the original of the first two slides: zero before t = 0 (on the "0" row), the QNM
  // after, with the jump at t = 0
  function abrupt(svg, w) {
    el("line", { x1: X(T0), x2: X(0), y1: TOP.z, y2: TOP.z, stroke: "#000", "stroke-width": 5 }, svg);
    el("line", { x1: X(0), x2: X(0), y1: TOP.z, y2: LY(TOP, Math.hypot(AR, AI)), stroke: "#000", "stroke-width": 5 }, svg);
    pair(svg, TOP, AR, AI, 0, w, "#000", "#999", false);
  }

  // arrow under the top panel at time ts, with its label; ts === null hides it
  function arrow(slide, svg, ts) {
    var tl = slide.querySelector(".td-filter-tlabel");
    if (ts === null) { tl.style.visibility = "hidden"; return; }
    var x = X(ts), yTip = TOP.y1 + 6, yTail = TOP.y1 + 80;
    el("line", { x1: x, x2: x, y1: yTail, y2: yTip + 22, stroke: "#000", "stroke-width": 6 }, svg);
    el("path", { d: "M" + x + " " + yTip + "L" + (x - 15) + " " + (yTip + 28) + "L" + (x + 15) + " " + (yTip + 28) + "Z",
                 fill: "#000" }, svg);
    katex.render("t = " + ts, tl);
    tl.style.left = (x + 20) + "px";
    tl.style.visibility = "visible";
  }

  // ---------------------------------------------------------------- td-filter-n17
  var TIMES = [0, 1, 2];          // times visited one after another, t >= 0
  var NEG = [-1, -2, -3];         // then these, t < 0
  var SUB = 3;                    // stages per time: arrow, dashed QNM, point
  var KZERO = TIMES.length * SUB + 1;        // stage: the filtered waveform is 0 for t >= 0
  var KFLIP = KZERO + NEG.length * SUB + 1;  // stage: the flipped ringdown for t < 0
  var CFG_N17 = { t0: -8, t1: 8, lmin: -3, zero: true, centre: true, tick: 1, tlab: 4, xlabel: "t" };

  function draw(slide, k) {
    var svg = base(slide, CFG_N17);
    abrupt(svg, W220);

    // which time and sub-stage k shows; neg: the t < 0 round
    var neg = k > KZERO && k < KFLIP;
    var r = neg ? k - KZERO - 1 : k - 1;
    var list = neg ? NEG : TIMES;
    var idx = Math.floor(r / SUB);
    var sub = (k === 0 || k === KZERO || k >= KFLIP) ? 0 : r % SUB + 1;
    var ts = list[idx];

    if (sub >= 2) {
      // t >= 0: the QNM with amplitude Psi(t_k); t < 0: the unit template Q_220(t - t_k)
      var a = neg ? [1, 0] : psiAt(ts, W220);
      pair(svg, TOP, a[0], a[1], ts, W220, "#d62728", "#f2a3a3", true);
    }

    // filtered for t >= 0: exactly zero, on the "0" row
    if (k >= KZERO) {
      el("line", { x1: X(0), x2: X1, y1: BOT.z, y2: BOT.z, stroke: "#000", "stroke-width": 5 }, svg);
    }
    // filtered for t < 0: -A e^{-i omega^* t}, the flipped ringdown, with the jump at t = 0
    if (k >= KFLIP) {
      curve(svg, BOT, function (t) { var c = fitAt(t); return Math.hypot(c[0], c[1]); },
            function (t) { return fitAt(t)[0]; }, T0, 0, "#000", "#999", false);
      el("line", { x1: X(0), x2: X(0), y1: BOT.z, y2: LY(BOT, Math.hypot(AR, AI)), stroke: "#000", "stroke-width": 5 }, svg);
    }
    // points: |filtered| at the times visited
    var npos = k >= KZERO ? TIMES.length : idx + (sub === SUB ? 1 : 0);
    for (var j = 0; j < npos; j++) {
      el("circle", { cx: X(TIMES[j]), cy: BOT.z, r: 13, fill: "#000" }, svg);
    }
    var nneg = k >= KFLIP ? NEG.length : neg ? idx + (sub === SUB ? 1 : 0) : 0;
    for (j = 0; j < nneg; j++) {
      var c = fitAt(NEG[j]);
      el("circle", { cx: X(NEG[j]), cy: LY(BOT, Math.hypot(c[0], c[1])), r: 13, fill: "#000" }, svg);
    }

    arrow(slide, svg, sub >= 1 ? ts : null);
  }

  Deck.widget("td-filter-n17", {
    steps: KFLIP,
    step: function (slide, k) { draw(slide, k); }
  });

  // ---------------------------------------------------------------- td-filter-diff
  // Waveform 330, filter 220. Per time: arrow, dashed Psi(t_k) Q_220, point at
  // |F(omega_330) Psi(t_k)|; then the whole filtered waveform for t >= 0.
  var DSUB = 3, DLAST = TIMES.length * DSUB + 1;
  var CFG_DIFF = { t0: -2, t1: 8, lmin: -3, zero: true, centre: true, tick: 1, tlab: 2, xlabel: "t" };

  function drawDiff(slide, k) {
    var svg = base(slide, CFG_DIFF);
    abrupt(svg, W330);
    var F = filterAt(W330);
    var last = k >= DLAST, idx = last ? TIMES.length : Math.floor((k - 1) / DSUB);
    var sub = (k === 0 || last) ? 0 : (k - 1) % DSUB + 1;
    var ts = TIMES[idx];
    if (sub >= 2) {
      var a = psiAt(ts, W330);
      pair(svg, TOP, a[0], a[1], ts, W220, "#d62728", "#f2a3a3", true);
    }
    // filtered for t >= 0: F(omega_330) times the original
    if (last) {
      var b = mul(F, [AR, AI]);
      pair(svg, BOT, b[0], b[1], 0, W330, "#000", "#999", false);
    }
    var npts = last ? TIMES.length : idx + (sub === DSUB ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      var v = mul(F, psiAt(TIMES[j], W330));
      el("circle", { cx: X(TIMES[j]), cy: LY(BOT, Math.hypot(v[0], v[1])), r: 13, fill: "#000" }, svg);
    }
    arrow(slide, svg, sub >= 1 ? ts : null);
  }

  Deck.widget("td-filter-diff", {
    steps: DLAST,
    step: function (slide, k) { drawDiff(slide, k); }
  });

  // ---------------------------------------------------------------- td-filter-plunge
  // Plunge waveform (chi = 0.7), filter 220 (Kerr chi = 0.7, M = 1), t in M from the
  // light-ring crossing, both waveforms divided by max |Psi| in the window.
  // Per time: arrow, dashed Psi(t_k) Q_220, point at |hat Psi(t_k)|; then the whole
  // filtered waveform.
  var PT = [40, 20, 0, -20, -40];  // visited from late to early
  var PSUB = 3, PLAST = PT.length * PSUB + 1;
  var CFG_PL = { t0: -80, t1: 60, lmin: -4, zero: false, centre: true, tick: 10, tlab: 20, xlabel: "t/M",
                 labelOut: true };   // the waveform fills the top right of the panels

  // a stored series, linearly interpolated at t
  function sample(arr, t) {
    var D = window.td_filter_plunge, x = (t - D.t0) / D.dt, i = Math.max(0, Math.min(arr.length - 2, Math.floor(x)));
    return arr[i] + (x - i) * (arr[i + 1] - arr[i]);
  }

  function drawPlunge(slide, k) {
    var D = window.td_filter_plunge, W = D.omega;
    var svg = base(slide, CFG_PL);
    curve(svg, TOP, function (t) { return Math.hypot(sample(D.re, t), sample(D.im, t)); },
          function (t) { return sample(D.re, t); }, T0, T1, "#000", "#999", false);
    var last = k >= PLAST, idx = last ? PT.length : Math.floor((k - 1) / PSUB);
    var sub = (k === 0 || last) ? 0 : (k - 1) % PSUB + 1;
    var ts = PT[idx];
    if (sub >= 2) {
      pair(svg, TOP, sample(D.re, ts), sample(D.im, ts), ts, W, "#d62728", "#f2a3a3", true);
    }
    if (last) {
      curve(svg, BOT, function (t) { return Math.hypot(sample(D.fre, t), sample(D.fim, t)); },
            function (t) { return sample(D.fre, t); }, T0, T1, "#000", "#999", false);
    }
    var npts = last ? PT.length : idx + (sub === PSUB ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      var v = Math.hypot(sample(D.fre, PT[j]), sample(D.fim, PT[j]));
      el("circle", { cx: X(PT[j]), cy: LY(BOT, v), r: 13, fill: "#000" }, svg);
    }
    arrow(slide, svg, sub >= 1 ? ts : null);
  }

  Deck.widget("td-filter-plunge", {
    steps: PLAST,
    step: function (slide, k) { drawPlunge(slide, k); }
  });
})();
