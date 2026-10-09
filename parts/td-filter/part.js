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
// The red dashed QNM at each visited time t is the least-squares fit A_fit(t) Q_220(. - t) to Psi after t,
// so hat Psi(t) = Psi(t) - A_fit(t); a red double-headed arrow labelled A_fit spans |A_fit(t)| on the
// original panel and a red cross marks |hat Psi(t)| on the filtered one.
// All panels show |.| (dark) and |Re .| (light) on a log axis, original in blue, filtered in red (the red of
// the fitted QNMs); on the first two slides
// exact zeros go on a separate "0" row below an axis break.
(function () {
  "use strict";

  // colours: original panel blue, filtered panel and fitted QNMs red, each |.| dark and |Re .| light;
  // frame a thin grey box; curves kept PX, PY px clear of the frame
  var C_AB = "#1f4e9c", C_RE = "#a9c1e8", C_FAB = "#d62728", C_FRE = "#f2a3a3", C_FRAME = "#666";
  var PX = 36, PY = 26;

  var NS = "http://www.w3.org/2000/svg";
  // Schwarzschild 220 and 330 modes, M omega, with M = 1 (t in units of M)
  var WR = 0.3737, WI = -0.0890;  // omega_220 = WR + i WI
  var W220 = [WR, WI];
  var W330 = [0.5994, -0.0927];
  var AR = Math.cos(0.2), AI = -Math.sin(0.2);  // complex amplitude A; phase keeps t = 0, 5, 10 off the zeros of Re

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

  function X(t) { return X0 + PX + (t - T0) / (T1 - T0) * (X1 - X0 - 2 * PX); }
  function LY(p, v) {
    var l = v > 0 ? Math.log10(v) : -99;
    return p.y0 + PY + (LMAX - l) / (LMAX - LMIN) * (p.lb - p.y0 - PY - (ZERO ? 0 : PY / 2));
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

  // a cross marker at (x, y)
  function cross(svg, x, y, col) {
    var r = 11;
    el("path", { d: "M" + (x - r) + " " + (y - r) + "L" + (x + r) + " " + (y + r) + "M" + (x - r) + " " + (y + r) +
                 "L" + (x + r) + " " + (y - r), stroke: col, "stroke-width": 4, fill: "none" }, svg);
  }

  function frame(svg, p, tick) {
    var k = C_FRAME, w = 2, brk = p.y0 + BRK;
    var clip = el("clipPath", { id: svg.getAttribute("data-clip") + p.id }, svg);
    el("rect", { x: X0, y: p.y0, width: X1 - X0, height: p.lb - p.y0 }, clip);
    if (ZERO) el("line", { x1: X0, x2: X1, y1: p.z, y2: p.z, stroke: "#ddd", "stroke-width": 2 }, svg);
    // box: top and bottom spines, side spines interrupted at the break if there is a "0" row
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
    // y ticks at each decade and at the "0" row
    var ys = [];
    for (var e = LMIN; e <= 0; e++) ys.push(LY(p, Math.pow(10, e)));
    if (ZERO) ys.push(p.z);
    ys.forEach(function (y) {
      el("line", { x1: X0, x2: X0 + 14, y1: y, y2: y, stroke: k, "stroke-width": w }, svg);
      el("line", { x1: X1, x2: X1 - 14, y1: y, y2: y, stroke: k, "stroke-width": w }, svg);
    });
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
    put("{\\color{" + C_AB + "}|\\Psi|},\\ {\\color{" + C_RE + "}|\\mathrm{Re}\\,\\Psi|}", X0 - 140, (TOP.y0 + TOP.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
    put("{\\color{" + C_FAB + "}|\\hat{\\Psi}|},\\ {\\color{" + C_FRE + "}|\\mathrm{Re}\\,\\hat{\\Psi}|}", X0 - 140, (BOT.y0 + BOT.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
    // panel names just outside the frames on the right, in the panel colours
    slide.querySelectorAll(".td-filter-label").forEach(function (l) {
      l.style.left = (X1 + 30) + "px";
      l.style.color = l.classList.contains("td-filter-label-top") ? C_AB : C_FAB;
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
    el("line", { x1: X(T0), x2: X(0), y1: TOP.z, y2: TOP.z, stroke: C_AB, "stroke-width": 5 }, svg);
    el("line", { x1: X(0), x2: X(0), y1: TOP.z, y2: LY(TOP, Math.hypot(AR, AI)), stroke: C_AB, "stroke-width": 5 }, svg);
    pair(svg, TOP, AR, AI, 0, w, C_AB, C_RE, false);
  }

  // a vertical line from y1 to y2 (y1 < y2) with arrow heads at both ends
  function darrow(svg, x, y1, y2, col, sw, hw, hl) {
    el("line", { x1: x, x2: x, y1: y1 + hl - 2, y2: y2 - hl + 2, stroke: col, "stroke-width": sw }, svg);
    el("path", { d: "M" + x + " " + y1 + "L" + (x - hw) + " " + (y1 + hl) + "L" + (x + hw) + " " + (y1 + hl) + "Z", fill: col }, svg);
    el("path", { d: "M" + x + " " + y2 + "L" + (x - hw) + " " + (y2 - hl) + "L" + (x + hw) + " " + (y2 - hl) + "Z", fill: col }, svg);
  }

  // double-headed arrow between the panels at time ts, with its label; ts === null hides it
  function arrow(slide, svg, ts) {
    var tl = slide.querySelector(".td-filter-tlabel");
    if (ts === null) { tl.style.visibility = "hidden"; return; }
    var x = X(ts);
    darrow(svg, x, TOP.y1 + 6, BOT.y0 - 6, "#000", 6, 15, 28);
    katex.render("t = " + ts, tl);
    tl.style.left = (x + 20) + "px";
    tl.style.visibility = "visible";
  }

  // red double-headed arrow on the original panel at ts, from 0 (the "0" row, or the bottom
  // of the log range) up to |a|, labelled A_fit; a === null hides it
  function afitArrow(slide, svg, ts, a) {
    var lab = slide.querySelector(".td-filter-alabel");
    if (a === null) { if (lab) lab.style.visibility = "hidden"; return; }
    var yb = ZERO ? TOP.z : LY(TOP, Math.pow(10, LMIN)), ya = LY(TOP, Math.hypot(a[0], a[1]));
    darrow(svg, X(ts), ya, yb, C_FAB, 4, 11, 20);
    katex.render("A_{\\rm fit}", lab);
    lab.style.left = (X(ts) - 14) + "px";
    lab.style.top = ((ya + yb) / 2) + "px";
    lab.style.color = C_FAB;
    lab.style.visibility = "visible";
  }

  // Stages of a round of visited times: the first nslow times take four clicks (t arrow;
  // fitted QNM; A_fit arrow; cross below), the rest two (t arrow; all three at once).
  // Returns [time index, sub-stage 1..4] per stage.
  function rounds(n, nslow) {
    var out = [];
    for (var i = 0; i < n; i++) {
      if (i < nslow) out.push([i, 1], [i, 2], [i, 3], [i, 4]);
      else out.push([i, 1], [i, 4]);
    }
    return out;
  }

  // the overlays of one stage: t arrow, fitted QNM a Q_220(t - ts), A_fit arrow
  function overlays(slide, svg, ts, sub, a, w) {
    if (sub >= 2) pair(svg, TOP, a[0], a[1], ts, w, C_FAB, C_FRE, true);
    afitArrow(slide, svg, ts, sub >= 3 ? a : null);
    arrow(slide, svg, sub >= 1 ? ts : null);
  }

  // ---------------------------------------------------------------- td-filter-n17
  var TIMES = [0, 5, 10];         // times visited one after another, t >= 0
  var NEG = [-5, -10, -15];       // then these, t < 0
  var RPOS = rounds(TIMES.length, 2), RNEG = rounds(NEG.length, 0);
  var KZERO = RPOS.length + 1;               // stage: the filtered waveform is 0 for t >= 0
  var KFLIP = KZERO + RNEG.length + 1;       // stage: the flipped ringdown for t < 0
  var CFG_N17 = { t0: -40, t1: 40, lmin: -3, zero: true, centre: true, tick: 5, tlab: 20, xlabel: "t/M" };

  // A_fit(t): Psi(t) for t >= 0, A e^{-i omega^* t} for t < 0
  function afit17(t) { return t >= 0 ? psiAt(t, W220) : fitAt(t); }

  function draw(slide, k) {
    var svg = base(slide, CFG_N17);
    abrupt(svg, W220);

    // which time and sub-stage k shows; neg: the t < 0 round
    var neg = k > KZERO && k < KFLIP, cur = null;
    if (k >= 1 && k < KZERO) cur = RPOS[k - 1];
    if (neg) cur = RNEG[k - KZERO - 1];
    var idx = cur ? cur[0] : 0, sub = cur ? cur[1] : 0;
    var ts = (neg ? NEG : TIMES)[idx];
    overlays(slide, svg, ts, sub, afit17(ts), W220);

    // filtered for t >= 0: exactly zero, on the "0" row
    if (k >= KZERO) {
      el("line", { x1: X(0), x2: X1, y1: BOT.z, y2: BOT.z, stroke: C_FAB, "stroke-width": 5 }, svg);
    }
    // filtered for t < 0: -A e^{-i omega^* t}, the flipped ringdown, with the jump at t = 0
    if (k >= KFLIP) {
      curve(svg, BOT, function (t) { var c = fitAt(t); return Math.hypot(c[0], c[1]); },
            function (t) { return fitAt(t)[0]; }, T0, 0, C_FAB, C_FRE, false);
      el("line", { x1: X(0), x2: X(0), y1: BOT.z, y2: LY(BOT, Math.hypot(AR, AI)), stroke: C_FAB, "stroke-width": 5 }, svg);
    }
    // points: |filtered| at the times visited
    var done = idx + (sub === 4 ? 1 : 0);
    var npos = k >= KZERO ? TIMES.length : done;
    for (var j = 0; j < npos; j++) cross(svg, X(TIMES[j]), BOT.z, C_FAB);
    var nneg = k >= KFLIP ? NEG.length : neg ? done : 0;
    for (j = 0; j < nneg; j++) {
      var c = fitAt(NEG[j]);
      cross(svg, X(NEG[j]), LY(BOT, Math.hypot(c[0], c[1])), C_FAB);
    }
  }

  Deck.widget("td-filter-n17", {
    steps: KFLIP,
    step: function (slide, k) { draw(slide, k); }
  });

  // ---------------------------------------------------------------- td-filter-flip
  // The end state of td-filter-n17 (the flipped ringdown), drawn small above the bullets.
  Deck.widget("td-filter-flip", {
    step: function (slide) { draw(slide, KFLIP); }
  });

  // ---------------------------------------------------------------- td-filter-diff
  // Waveform 330, filter 220. Per time: t arrow; then the fit A_fit(t_k) Q_220 with
  // A_fit = (1 - F(omega_330)) Psi(t_k), its A_fit arrow and the point at
  // |F(omega_330) Psi(t_k)|; then the whole filtered waveform for t >= 0.
  var RDIFF = rounds(TIMES.length, 0), DLAST = RDIFF.length + 1;
  var CFG_DIFF = { t0: -10, t1: 40, lmin: -3, zero: true, centre: true, tick: 5, tlab: 10, xlabel: "t/M" };

  function drawDiff(slide, k) {
    var svg = base(slide, CFG_DIFF);
    abrupt(svg, W330);
    var F = filterAt(W330), G = [1 - F[0], -F[1]];  // G = 1 - F: A_fit(t) = G Psi(t)
    var last = k >= DLAST, cur = (k >= 1 && !last) ? RDIFF[k - 1] : null;
    var idx = cur ? cur[0] : 0, sub = cur ? cur[1] : 0, ts = TIMES[idx];
    overlays(slide, svg, ts, sub, mul(G, psiAt(ts, W330)), W220);
    // filtered for t >= 0: F(omega_330) times the original
    if (last) {
      var b = mul(F, [AR, AI]);
      pair(svg, BOT, b[0], b[1], 0, W330, C_FAB, C_FRE, false);
    }
    var npts = last ? TIMES.length : idx + (sub === 4 ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      var v = mul(F, psiAt(TIMES[j], W330));
      cross(svg, X(TIMES[j]), LY(BOT, Math.hypot(v[0], v[1])), C_FAB);
    }
  }

  Deck.widget("td-filter-diff", {
    steps: DLAST,
    step: function (slide, k) { drawDiff(slide, k); }
  });

  // ---------------------------------------------------------------- td-filter-plunge
  // Plunge waveform (chi = 0.7), filter 220 (Kerr chi = 0.7, M = 1), t in M from the
  // light-ring crossing, both waveforms divided by max |Psi| in the window.
  // Per time: t arrow; then the fit A_fit(t_k) Q_220 with A_fit = Psi - hat Psi (equal to
  // a direct least-squares fit to the release data to 1e-3), its A_fit arrow and the point
  // at |hat Psi(t_k)|; then the whole filtered waveform.
  var PT = [40, 20, 0, -20, -40];  // visited from late to early
  var RPL = rounds(PT.length, 0), PLAST = RPL.length + 1;
  var CFG_PL = { t0: -80, t1: 60, lmin: -4, zero: false, centre: true, tick: 10, tlab: 20, xlabel: "t/M" };

  // a stored series, linearly interpolated at t
  function sample(arr, t) {
    var D = window.td_filter_plunge, x = (t - D.t0) / D.dt, i = Math.max(0, Math.min(arr.length - 2, Math.floor(x)));
    return arr[i] + (x - i) * (arr[i + 1] - arr[i]);
  }

  function drawPlunge(slide, k) {
    var D = window.td_filter_plunge, W = D.omega;
    var svg = base(slide, CFG_PL);
    curve(svg, TOP, function (t) { return Math.hypot(sample(D.re, t), sample(D.im, t)); },
          function (t) { return sample(D.re, t); }, T0, T1, C_AB, C_RE, false);
    var last = k >= PLAST, cur = (k >= 1 && !last) ? RPL[k - 1] : null;
    var idx = cur ? cur[0] : 0, sub = cur ? cur[1] : 0, ts = PT[idx];
    overlays(slide, svg, ts, sub, [sample(D.re, ts) - sample(D.fre, ts), sample(D.im, ts) - sample(D.fim, ts)], W);
    if (last) {
      curve(svg, BOT, function (t) { return Math.hypot(sample(D.fre, t), sample(D.fim, t)); },
            function (t) { return sample(D.fre, t); }, T0, T1, C_FAB, C_FRE, false);
    }
    var npts = last ? PT.length : idx + (sub === 4 ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      var v = Math.hypot(sample(D.fre, PT[j]), sample(D.fim, PT[j]));
      cross(svg, X(PT[j]), LY(BOT, v), C_FAB);
    }
  }

  Deck.widget("td-filter-plunge", {
    steps: PLAST,
    step: function (slide, k) { drawPlunge(slide, k); }
  });
})();
