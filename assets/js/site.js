/* enricobergamini.it — theme toggle + static network drawings (no animation) */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- theme toggle ---------- */
  var btn = document.querySelector(".theme-toggle");
  function label() {
    if (btn) btn.setAttribute("aria-label", root.getAttribute("data-theme") === "light" ? "Switch to dark theme" : "Switch to light theme");
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  }
  label();

  /* ---------- background networks ----------
     Drawn once and deterministic (same picture on every visit), never animated.
     Edit PLACEMENTS to move, resize or swap them (size = height; aspect = width / height; tilt leans a community graph, in degrees); colours are the --net-* variables in style.css.
     Motifs: communities (force-directed graph with groups), bipartite (regions x green
     technologies), matrix (adjacency matrix), arcs (arc diagram), radial (radial tree). */
  var PLACEMENTS = [
    { motif: "bipartite",   side: "right", top: "10%", size: 360, under: 0, bleed: 0 },
    { motif: "communities", side: "right", top: "21%",  size: 600, aspect: 1, elong: 0.5, tilt: 270, groups: [10, 9, 8], under: 0.4, bleed: 0},
    { motif: "matrix",      side: "right", top: "70%",  size: 250, under: 0.05, bleed: 0 },
    { motif: "arcs",        side: "left",  top: "32%",  size: 420 },
    { motif: "radial",      side: "right", top: "45%",  size: 420 },
    { motif: "communities", side: "left",  top: "57%",  size: 420, groups: [11, 10] },
    { motif: "communities", side: "left",  top: "1.35%", size: 540, groups: [9, 8, 8, 7] },
    { motif: "radial",      side: "left",  top: "84%",  size: 360 }
  ];
  var UNDER_TEXT = 0.3;  /* default share of each drawing under the text column (override per placement with "under") */
  var BLEED = 0.25;      /* default share allowed to run off the window edge (labelled drawings use 0) */

  function rng(seed) { /* mulberry32 */
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var NS = "http://www.w3.org/2000/svg";
  function el(parent, name, attrs) {
    var x = document.createElementNS(NS, name);
    for (var k in attrs) x.setAttribute(k, attrs[k]);
    parent.appendChild(x);
    return x;
  }
  function f(v) { return Math.round(v * 100) / 100; }
  function bend(a, b, amt) { /* quadratic curve between two points */
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    return "M" + f(a.x) + " " + f(a.y) + " Q" + f(mx - dy * amt) + " " + f(my + dx * amt) + " " + f(b.x) + " " + f(b.y);
  }
  function degrees(n, e) {
    var d = n.map(function () { return 0; });
    e.forEach(function (x) { d[x[0]]++; d[x[1]]++; });
    return d;
  }

  /* stochastic block model: dense inside groups, sparse between */
  function sbm(r, sizes, pin, pout) {
    var n = [], e = [], a, b;
    sizes.forEach(function (s, c) { for (var i = 0; i < s; i++) n.push({ c: c }); });
    for (a = 0; a < n.length; a++) for (b = a + 1; b < n.length; b++) {
      if (r() < (n[a].c === n[b].c ? pin : pout)) e.push([a, b]);
    }
    var d = degrees(n, e);
    n.forEach(function (nd, i) {
      if (d[i]) return;
      var mates = []; n.forEach(function (m, j) { if (j !== i && m.c === nd.c) mates.push(j); });
      e.push([i, mates[Math.floor(r() * mates.length)]]);
    });
    var start = 0;
    for (var c = 1; c < sizes.length; c++) { start += sizes[c - 1]; e.push([start - 1 - Math.floor(r() * sizes[c - 1]), start]); }
    return { n: n, e: e };
  }

  /* Fruchterman-Reingold layout, fitted into the 100x100 box */
  function layout(g, r, iters, W, H) {
    W = W || 100; H = H || 100;
    var N = g.n.length, k = 0.95 * Math.sqrt(W * H / N), i, j, it;
    var gx = 0.6 * Math.max(1, H / W), gy = 0.6 * Math.max(1, W / H) * (W < H ? 0.45 : 1);
    g.n.forEach(function (p) { p.x = W * (0.3 + r() * 0.4); p.y = H * (0.3 + r() * 0.4); });
    for (it = 0; it < iters; it++) {
      var t = 5 * (1 - it / iters) + 0.15, dx = [], dy = [];
      for (i = 0; i < N; i++) { dx[i] = 0; dy[i] = 0; }
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
        var ex = g.n[i].x - g.n[j].x, ey = g.n[i].y - g.n[j].y, d = Math.max(0.5, Math.sqrt(ex * ex + ey * ey)), fr = k * k / d;
        dx[i] += ex / d * fr; dy[i] += ey / d * fr; dx[j] -= ex / d * fr; dy[j] -= ey / d * fr;
      }
      g.e.forEach(function (x) {
        var a = g.n[x[0]], b = g.n[x[1]], ex = a.x - b.x, ey = a.y - b.y, d = Math.max(0.5, Math.sqrt(ex * ex + ey * ey)), fa = d * d / k;
        dx[x[0]] -= ex / d * fa; dy[x[0]] -= ey / d * fa; dx[x[1]] += ex / d * fa; dy[x[1]] += ey / d * fa;
      });
      for (i = 0; i < N; i++) {
        dx[i] -= (g.n[i].x - W / 2) * gx; dy[i] -= (g.n[i].y - H / 2) * gy;
        var len = Math.max(0.01, Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]));
        g.n[i].x += dx[i] / len * Math.min(len, t); g.n[i].y += dy[i] / len * Math.min(len, t);
      }
    }
    fit(g.n, W, H);
  }

  function fit(nodes, W, H) { /* scale uniformly and centre inside a W x H box (8% margin) */
    var xs = nodes.map(function (p) { return p.x; }), ys = nodes.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    var rx = Math.max(Math.max.apply(null, xs) - x0, 1), ry = Math.max(Math.max.apply(null, ys) - y0, 1);
    var s = Math.min(W * 0.84 / rx, H * 0.84 / ry);
    var ox = (W - rx * s) / 2, oy = (H - ry * s) / 2;
    nodes.forEach(function (p) { p.x = ox + (p.x - x0) * s; p.y = oy + (p.y - y0) * s; });
  }

  function node(svg, p, rpx, px, cls) {
    return el(svg, "circle", { cx: f(p.x), cy: f(p.y), r: f(rpx * px), "class": "n " + (cls || "") });
  }

  var MOTIFS = {
    communities: function (svg, r, px, opt, W, H) {
      var g = sbm(r, opt.groups || [8, 7, 6], 0.42, 0.03);
      if (opt.tilt) { /* lay out as a long vertical shape, then lean it (top-left to bottom-right) */
        var Wv = 100 * (opt.elong || 0.5), Hv = 100, a = -opt.tilt * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        layout(g, r, 260, Wv, Hv);
        g.n.forEach(function (p) {
          var x = p.x - Wv / 2, y = p.y - Hv / 2;
          p.x = x * ca - y * sa; p.y = x * sa + y * ca;
        });
        fit(g.n, W, H);
      } else {
        layout(g, r, 260, W, H);
      }
      var d = degrees(g.n, g.e);
      g.e.forEach(function (x) {
        var a = g.n[x[0]], b = g.n[x[1]], same = a.c === b.c;
        el(svg, "path", { d: bend(a, b, (r() - 0.5) * 0.3), "class": "e" + (same ? " c" + (a.c % 3) : " soft") });
      });
      var best = {};
      g.n.forEach(function (p, i) { if (best[p.c] === undefined || d[i] > d[best[p.c]]) best[p.c] = i; });
      g.n.forEach(function (p, i) {
        var rp = 1.6 + 1.05 * Math.sqrt(d[i]);
        node(svg, p, rp, px, "c" + (p.c % 3));
        if (best[p.c] === i) el(svg, "circle", { cx: f(p.x), cy: f(p.y), r: f((rp + 3.5) * px), "class": "halo c" + (p.c % 3) });
      });
    },

    bipartite: function (svg, r, px) {
      /* NUTS-2 regions (Catalonia, Piedmont, Upper Bavaria, Ile-de-France, Noord-Brabant)
         x CPC Y02 green-technology classes */
      var R = ["ES51", "ITC1", "DE21", "FR10", "NL41"], T = ["Y02E", "Y02T", "Y02B", "Y02P", "Y02W", "Y02A"];
      var reg = R.map(function (_, i) { return { x: 26, y: 14 + i * 18 }; });
      var tec = T.map(function (_, j) { return { x: 74, y: 10 + j * 16 }; });
      var e = [], i, j;
      for (i = 0; i < R.length; i++) for (j = 0; j < T.length; j++) if (r() < 0.38 || (i + j) % 5 === 0) e.push([i, j]);
      var dr = R.map(function () { return 0; }), dt = T.map(function () { return 0; });
      e.forEach(function (x) {
        var a = reg[x[0]], b = tec[x[1]];
        dr[x[0]]++; dt[x[1]]++;
        el(svg, "path", {
          d: "M" + a.x + " " + a.y + " C50 " + a.y + " 50 " + b.y + " " + b.x + " " + b.y,
          "class": "e" + (x[0] === 0 ? " c0" : x[1] === 0 ? " c1" : " soft")
        });
      });
      reg.forEach(function (p, i) {
        var s = (2 + 0.8 * Math.sqrt(dr[i])) * px;
        el(svg, "rect", { x: f(p.x - s), y: f(p.y - s), width: f(2 * s), height: f(2 * s), "class": "n" + (i === 0 ? " c0" : "") });
        el(svg, "text", { x: f(p.x - s - 2.2 * px * 3), y: f(p.y + 2.6 * px), "text-anchor": "end", "font-size": f(8 * px), "class": "lbl" }).textContent = R[i];
      });
      tec.forEach(function (p, j) {
        node(svg, p, 2 + 0.8 * Math.sqrt(dt[j]), px, j === 0 ? "c1" : "o");
        el(svg, "text", { x: f(p.x + 6 * px * 1.6), y: f(p.y + 2.6 * px), "font-size": f(8 * px), "class": "lbl" }).textContent = T[j];
      });
    },

    matrix: function (svg, r, px) {
      var sizes = [5, 4, 3], g = sbm(r, sizes, 0.62, 0.07), N = g.n.length, cell = 80 / N, adj = {};
      g.e.forEach(function (x) { adj[x[0] + "-" + x[1]] = adj[x[1] + "-" + x[0]] = 1; });
      el(svg, "rect", { x: 10, y: 10, width: 80, height: 80, "class": "frame" });
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
        if (i === j || !adj[i + "-" + j]) continue;
        var same = g.n[i].c === g.n[j].c;
        el(svg, "rect", { x: f(10 + j * cell + 0.6), y: f(10 + i * cell + 0.6), width: f(cell - 1.2), height: f(cell - 1.2),
                          "class": "cell" + (same ? " c" + g.n[i].c : "") });
      }
      var off = 0;
      sizes.forEach(function (s, c) { /* outline the diagonal blocks */
        el(svg, "rect", { x: f(10 + off * cell), y: f(10 + off * cell), width: f(s * cell), height: f(s * cell), "class": "block c" + c });
        off += s;
      });
    },

    arcs: function (svg, r, px) {
      var N = 14, y = 86, pts = [], e = [], i, j;
      for (i = 0; i < N; i++) pts.push({ x: 6 + i * (88 / (N - 1)), y: y, c: i < 5 ? 0 : i < 10 ? 1 : 2 });
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
        var gap = j - i;
        if ((gap <= 2 && r() < 0.55) || (gap > 2 && r() < 0.11)) e.push([i, j]);
      }
      el(svg, "line", { x1: 4, y1: y, x2: 96, y2: y, "class": "e soft" });
      var d = degrees(pts, e);
      e.forEach(function (x) {
        var a = pts[x[0]], b = pts[x[1]], rx = (b.x - a.x) / 2;
        el(svg, "path", { d: "M" + f(a.x) + " " + y + " A" + f(rx) + " " + f(rx * 0.95) + " 0 0 1 " + f(b.x) + " " + y,
                          "class": "e" + (a.c === b.c ? " c" + a.c : " soft") });
      });
      pts.forEach(function (p, i) { node(svg, p, 1.8 + 0.9 * Math.sqrt(d[i]), px, "c" + p.c); });
    },

    radial: function (svg, r, px) {
      var c = { x: 50, y: 50 }, rings = [17, 32, 45], nodes = [], i;
      rings.forEach(function (rr) { el(svg, "circle", { cx: 50, cy: 50, r: rr, "class": "ring" }); });
      var k1 = 5, a0 = r() * 6.283;
      for (i = 0; i < k1; i++) {
        var a1 = a0 + (i / k1) * 6.283, p1 = { x: 50 + rings[0] * Math.cos(a1), y: 50 + rings[0] * Math.sin(a1), c: i % 3 };
        el(svg, "path", { d: bend(c, p1, 0.08), "class": "e c" + p1.c }); nodes.push([p1, 2.8]);
        var k2 = 2 + Math.floor(r() * 2);
        for (var j = 0; j < k2; j++) {
          var a2 = a1 + (j - (k2 - 1) / 2) * 0.42, p2 = { x: 50 + rings[1] * Math.cos(a2), y: 50 + rings[1] * Math.sin(a2), c: p1.c };
          el(svg, "path", { d: bend(p1, p2, 0.1), "class": "e c" + p1.c }); nodes.push([p2, 2.2]);
          if (r() < 0.6) {
            var k3 = 1 + Math.floor(r() * 2);
            for (var m = 0; m < k3; m++) {
              var a3 = a2 + (m - (k3 - 1) / 2) * 0.2, p3 = { x: 50 + rings[2] * Math.cos(a3), y: 50 + rings[2] * Math.sin(a3), c: p1.c };
              el(svg, "path", { d: bend(p2, p3, 0.1), "class": "e soft" }); nodes.push([p3, 1.6]);
            }
          }
        }
      }
      nodes.forEach(function (x) { node(svg, x[0], x[1], px, x[1] < 2 ? "o" : "c" + x[0].c); });
      node(svg, c, 4.4, px, "c0");
      el(svg, "circle", { cx: 50, cy: 50, r: f(8.5 * px), "class": "halo c0" });
    }
  };

  /* Size each drawing to the margin beside the column: up to BLEED of it may run off the
     window edge (never for labelled drawings); skip it if there is no room. Redrawn on resize. */
  function draw() {
    var old = document.querySelector(".bg-net");
    if (old) old.parentNode.removeChild(old);
    var remPx = parseFloat(getComputedStyle(root).fontSize) || 16;
    var colPx = parseFloat(getComputedStyle(root).getPropertyValue("--maxw")) * remPx;
    var margin = (root.clientWidth - colPx) / 2 - 12;
    var layer = document.createElement("div");
    layer.className = "bg-net";
    layer.setAttribute("aria-hidden", "true");
    PLACEMENTS.forEach(function (p, idx) {
      var under = p.under !== undefined ? p.under : UNDER_TEXT;
      var bleed = p.bleed !== undefined ? p.bleed : BLEED;
      var aspect = p.aspect || 1;
      var w = Math.min(p.size * aspect, margin / (1 - under - bleed));
      var h = w / aspect;
      if (w < 130) return;
      var W = 100 * aspect, H = 100;
      var svg = el(layer, "svg", { viewBox: "0 0 " + f(W) + " " + H, width: Math.round(w), height: Math.round(h), focusable: "false" });
      svg.style.top = p.top;
      svg.style[p.side === "left" ? "right" : "left"] = "calc(50% + var(--maxw) / 2 - " + Math.round(w * under) + "px)";
      MOTIFS[p.motif](svg, rng(idx * 7919 + 101), 100 / h, p, W, H);
    });
    document.body.insertBefore(layer, document.body.firstChild);
  }
  draw();
  var resizeTimer;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 200); });
})();
