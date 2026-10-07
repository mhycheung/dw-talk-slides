// Slide td-filter-n17: Eq. (N17) of Cheung (2608.29466) applied step by step to a QNM that
// starts abruptly at t = 0. For t >= 0 the waveform to the future of t, rescaled to unit
// amplitude, is exactly Q_220, so the mismatch term and the filtered waveform vanish.
// Both panels show |Re| on a log axis; exact zeros go on a separate "0" row below a break.
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  // Toy 220 mode: same quality factor as Schwarzschild 220 (M omega = 0.3737 - 0.0890 i),
  // time unit rescaled so that a step of 1 in t is visible.
  var WR = 2.0, WI = -0.475;      // omega_220 = WR + i WI
  var AR = Math.cos(0.2), AI = -Math.sin(0.2);  // complex amplitude A; phase keeps t = 0, 1, 2 off the zeros of Re
  var T0 = -2, T1 = 8;            // time range shown
  var X0 = 270, X1 = 1250;        // plot x range in slide px
  var LMIN = -3, LMAX = Math.log10(2);  // log10 range of the log region
  // y0: top of the frame; lb: bottom of the log region; z: the "0" row; y1: the x axis
  var TOP = { y0: 250, lb: 465, z: 510, y1: 540, id: "top" };
  var BOT = { y0: 635, lb: 850, z: 895, y1: 925, id: "bot" };
  var BRK = 487;                  // offset of the axis break from y0 is (BRK - TOP.y0)
  var TIMES = [0, 1, 2];          // times visited one after another
  var SUB = 5;                    // stages per time: arrow, dashed QNM, psi = Q, mismatch = 0, point

  function X(t) { return X0 + (t - T0) / (T1 - T0) * (X1 - X0); }
  function LY(p, v) {
    var l = v > 0 ? Math.log10(v) : -99;
    return p.y0 + (LMAX - l) / (LMAX - LMIN) * (p.lb - p.y0);
  }

  // Re[a e^{-i omega (t - ts)}] for complex a = (ar, ai)
  function qnm(ar, ai, ts, t) {
    var s = t - ts, e = Math.exp(WI * s), c = Math.cos(WR * s), sn = Math.sin(WR * s);
    // e^{-i omega s} = e^{WI s} (cos WR s - i sin WR s)
    return e * (ar * c + ai * sn);
  }
  // Psi(ts) as a complex number
  function psiAt(ts) {
    var e = Math.exp(WI * ts), c = Math.cos(WR * ts), sn = Math.sin(WR * ts);
    return [e * (AR * c + AI * sn), e * (AI * c - AR * sn)];
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }

  // |fn| on the log axis, from ta to tb, clipped to the log region of panel p
  function logPath(fn, ta, tb, p) {
    var d = "", n = 3000;
    for (var i = 0; i <= n; i++) {
      var t = ta + (tb - ta) * i / n;
      var y = Math.min(LY(p, Math.abs(fn(t))), p.lb + 400);
      d += (i ? "L" : "M") + X(t).toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  function frame(svg, p) {
    var k = "#000", w = 3, brk = p.y0 + (BRK - TOP.y0);
    var clip = el("clipPath", { id: "td-filter-clip-" + p.id }, svg);
    el("rect", { x: X0, y: p.y0, width: X1 - X0, height: p.lb - p.y0 }, clip);
    // frame: top and bottom spines, side spines interrupted at the break
    el("line", { x1: X0, x2: X1, y1: p.y0, y2: p.y0, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X0, x2: X1, y1: p.y1, y2: p.y1, stroke: k, "stroke-width": w }, svg);
    [X0, X1].forEach(function (x) {
      el("line", { x1: x, x2: x, y1: p.y0, y2: brk - 7, stroke: k, "stroke-width": w }, svg);
      el("line", { x1: x, x2: x, y1: brk + 7, y2: p.y1, stroke: k, "stroke-width": w }, svg);
      [-7, 7].forEach(function (o) {
        el("line", { x1: x - 12, x2: x + 12, y1: brk + o + 5, y2: brk + o - 5, stroke: k, "stroke-width": w }, svg);
      });
    });
    // x ticks, inward, on both spines
    for (var t = T0; t <= T1; t++) {
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
    // the "0" row
    el("line", { x1: X0, x2: X0 + 16, y1: p.z, y2: p.z, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X1, x2: X1 - 16, y1: p.z, y2: p.z, stroke: k, "stroke-width": w }, svg);
    el("line", { x1: X0, x2: X1, y1: p.z, y2: p.z, stroke: "#ccc", "stroke-width": 2 }, svg);
  }

  // tick and axis labels, rendered once with KaTeX
  function labels(slide) {
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
      put("0", X0 - 12, p.z, "td-filter-tick", "translate(-100%,-50%)");
    });
    for (var t = T0; t <= T1; t += 2) {
      put(String(t), X(t), BOT.y1 + 8, "td-filter-tick", "translate(-50%,0)");
    }
    put("t", (X0 + X1) / 2, BOT.y1 + 46, "td-filter-axlabel", "translate(-50%,0)");
    put("|\\mathrm{Re}\\,\\Psi|", X0 - 140, (TOP.y0 + TOP.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
    put("|\\mathrm{Re}\\,\\hat{\\Psi}|", X0 - 140, (BOT.y0 + BOT.y1) / 2, "td-filter-axlabel",
        "translate(-50%,-50%) rotate(-90deg)");
  }

  function draw(slide, k) {
    labels(slide);
    var svg = slide.querySelector(".td-filter-plot");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    frame(svg, TOP);
    frame(svg, BOT);
    var clipTop = "url(#td-filter-clip-top)";

    // original: zero before t = 0 (on the "0" row), the QNM after, with the jump at t = 0
    el("line", { x1: X(T0), x2: X(0), y1: TOP.z, y2: TOP.z, stroke: "#000", "stroke-width": 5 }, svg);
    el("line", { x1: X(0), x2: X(0), y1: TOP.z, y2: LY(TOP, Math.abs(AR)), stroke: "#000", "stroke-width": 5 }, svg);
    el("path", { d: logPath(function (t) { return qnm(AR, AI, 0, t); }, 0, T1, TOP),
                 fill: "none", stroke: "#000", "stroke-width": 5, "clip-path": clipTop }, svg);

    var last = k > TIMES.length * SUB;            // final stage: the whole filtered waveform
    var idx = last ? TIMES.length : Math.floor((k - 1) / SUB);
    var sub = last || k === 0 ? 0 : (k - 1) % SUB + 1;
    var ts = TIMES[idx];

    if (sub >= 2) {
      var a = psiAt(ts);
      el("path", { d: logPath(function (t) { return qnm(a[0], a[1], ts, t); }, ts, T1, TOP),
                   fill: "none", stroke: "#d62728", "stroke-width": 5, "stroke-dasharray": "18 12",
                   "clip-path": clipTop }, svg);
    }

    // filtered: exactly zero for t >= 0, so it lives on the "0" row
    if (last) {
      el("line", { x1: X(0), x2: X1, y1: BOT.z, y2: BOT.z, stroke: "#000", "stroke-width": 5 }, svg);
    }
    var npts = idx + (sub === SUB ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      el("circle", { cx: X(TIMES[j]), cy: BOT.z, r: 13, fill: "#000" }, svg);
    }

    var tl = slide.querySelector(".td-filter-tlabel");
    if (sub >= 1) {
      var x = X(ts), yTip = TOP.y1 + 6, yTail = TOP.y1 + 80;
      el("line", { x1: x, x2: x, y1: yTail, y2: yTip + 22, stroke: "#000", "stroke-width": 6 }, svg);
      el("path", { d: "M" + x + " " + yTip + "L" + (x - 15) + " " + (yTip + 28) + "L" + (x + 15) + " " + (yTip + 28) + "Z",
                   fill: "#000" }, svg);
      katex.render("t = " + ts, tl);
      tl.style.left = (x + 20) + "px";
      tl.style.visibility = "visible";
    } else {
      tl.style.visibility = "hidden";
    }

    slide.querySelector(".td-filter-psi").classList.toggle("td-filter-on", sub >= 3);
    slide.querySelector(".td-filter-mis").classList.toggle("td-filter-on", sub >= 4);
  }

  Deck.widget("td-filter-n17", {
    steps: TIMES.length * SUB + 1,
    step: function (slide, k) { draw(slide, k); }
  });
})();
