// Slide bg-filter-td: Eq. (N17) of Cheung (2608.29466) applied step by step to a QNM that
// starts abruptly at t = 0. For t >= 0 the waveform to the future of t, rescaled to unit
// amplitude, is exactly Q_220, so the mismatch term and the filtered waveform vanish.
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  // Toy 220 mode: same quality factor as Schwarzschild 220 (M omega = 0.3737 - 0.0890 i),
  // time unit rescaled so that a step of 1 in t is visible.
  var WR = 2.0, WI = -0.475;      // omega_220 = WR + i WI
  var AR = Math.cos(0.6), AI = -Math.sin(0.6);  // complex amplitude A
  var T0 = -2, T1 = 8;            // time range shown
  var X0 = 110, X1 = 1270;        // plot x range in slide px
  var TOP = { y0: 230, y1: 560 }, BOT = { y0: 660, y1: 990 };
  var YMAX = 1.15;
  var TIMES = [0, 1, 2];          // times visited one after another
  var SUB = 5;                    // stages per time: arrow, dashed QNM, psi = Q, mismatch = 0, point

  function X(t) { return X0 + (t - T0) / (T1 - T0) * (X1 - X0); }
  function Y(p, v) { var c = (p.y0 + p.y1) / 2; return c - v / YMAX * (p.y1 - p.y0) / 2; }

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

  function path(fn, ta, tb, p) {
    var d = "", n = 600;
    for (var i = 0; i <= n; i++) {
      var t = ta + (tb - ta) * i / n;
      d += (i ? "L" : "M") + X(t).toFixed(1) + " " + Y(p, fn(t)).toFixed(1);
    }
    return d;
  }

  function frame(svg, p) {
    el("line", { x1: X0, x2: X1, y1: Y(p, 0), y2: Y(p, 0), stroke: "#bbb", "stroke-width": 2 }, svg);
    el("line", { x1: X0, x2: X1, y1: p.y1, y2: p.y1, stroke: "#000", "stroke-width": 3 }, svg);
    for (var t = T0; t <= T1; t++) {
      el("line", { x1: X(t), x2: X(t), y1: p.y1, y2: p.y1 - 14, stroke: "#000", "stroke-width": 3 }, svg);
    }
  }

  function draw(slide, k) {
    var svg = slide.querySelector(".bg-filter-td-plot");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    frame(svg, TOP);
    frame(svg, BOT);

    // original: zero before t = 0, the QNM after, with the jump at t = 0
    var orig = path(function (t) { return 0; }, T0, 0, TOP) +
               path(function (t) { return qnm(AR, AI, 0, t); }, 0, T1, TOP).replace(/^M/, "L");
    el("path", { d: orig, fill: "none", stroke: "#000", "stroke-width": 5 }, svg);

    var last = k > TIMES.length * SUB;            // final stage: the whole filtered waveform
    var idx = last ? TIMES.length : Math.floor((k - 1) / SUB);
    var sub = last || k === 0 ? 0 : (k - 1) % SUB + 1;
    var ts = TIMES[idx];

    if (sub >= 2) {
      var a = psiAt(ts);
      el("path", { d: path(function (t) { return qnm(a[0], a[1], ts, t); }, ts, T1, TOP),
                   fill: "none", stroke: "#d62728", "stroke-width": 5, "stroke-dasharray": "18 12" }, svg);
    }

    if (last) {
      el("line", { x1: X(0), x2: X1, y1: Y(BOT, 0), y2: Y(BOT, 0), stroke: "#000", "stroke-width": 5 }, svg);
    }
    var npts = idx + (sub === SUB ? 1 : 0);
    for (var j = 0; j < npts; j++) {
      el("circle", { cx: X(TIMES[j]), cy: Y(BOT, 0), r: 13, fill: "#000" }, svg);
    }

    var tl = slide.querySelector(".bg-filter-td-tlabel");
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

    slide.querySelector(".bg-filter-td-psi").classList.toggle("bg-filter-td-on", sub >= 3);
    slide.querySelector(".bg-filter-td-mis").classList.toggle("bg-filter-td-on", sub >= 4);
  }

  Deck.widget("bg-filter-td", {
    steps: TIMES.length * SUB + 1,
    step: function (slide, k) { draw(slide, k); }
  });
})();
