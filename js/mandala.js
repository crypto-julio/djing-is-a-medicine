// ==========================================
// FULL-SCREEN MANDALA — Canvas sacred geometry
// Optimized: IntersectionObserver pauses when off-screen
// ==========================================
(function () {
  const canvas = document.getElementById('sound-waves-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const GLOW = isMobile ? 0.3 : 1;

  let W, H, CX, CY, R;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    W = parent.clientWidth || window.innerWidth;
    H = parent.clientHeight || window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2;
    CY = H / 2;
    R = Math.max(W, H) * 0.55;
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 150); });

  var AMBER = [196, 122, 46];
  var MAGENTA = [139, 58, 122];
  var TEAL = [30, 160, 200];
  var GOLD = [232, 200, 114];
  var VIOLET = [107, 45, 91];
  var FUCHSIA = [220, 50, 140];

  var angle = 0;
  var SPEED = 0.0003;

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  function drawMandala(time) {
    ctx.save();
    ctx.translate(CX, CY);
    var breath = 0.96 + 0.04 * Math.sin(time * 0.0008);
    var unit = R * 0.275;

    // Outer rings (amber) — counter-clockwise
    ctx.save(); ctx.rotate(-angle);
    ctx.shadowBlur = 25 * GLOW; ctx.shadowColor = rgba(AMBER, 0.35);
    ctx.strokeStyle = rgba(AMBER, 0.18); ctx.lineWidth = 3;
    circle(0, 0, R * 0.97);
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(AMBER, 0.1);
    circle(0, 0, R * 0.91);
    ctx.strokeStyle = rgba(GOLD, 0.08); circle(0, 0, R * 0.83);
    ctx.strokeStyle = rgba(AMBER, 0.06); circle(0, 0, R * 0.73);
    ctx.restore();

    // 12 Rays (gold) — clockwise
    ctx.save(); ctx.rotate(angle * 2);
    ctx.shadowBlur = 15 * GLOW; ctx.shadowColor = rgba(GOLD, 0.25);
    ctx.strokeStyle = rgba(GOLD, 0.1); ctx.lineWidth = 2;
    var rayN = isMobile ? 6 : 12;
    for (var i = 0; i < rayN; i++) {
      var a = (i / rayN) * Math.PI * 2;
      line(0, 0, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
    }
    ctx.restore();

    // Flower of Life layer 2 (magenta) — counter-clockwise
    ctx.save(); ctx.rotate(-angle * 1.5);
    ctx.shadowBlur = 22 * GLOW; ctx.shadowColor = rgba(MAGENTA, 0.3);
    ctx.strokeStyle = rgba(MAGENTA, 0.15); ctx.lineWidth = 3;
    var d2 = unit * 2 * breath;
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      circle(Math.cos(a) * d2, Math.sin(a) * d2, unit);
    }
    ctx.restore();

    // Flower of Life layer 1 (teal) — clockwise
    ctx.save(); ctx.rotate(angle * 3);
    ctx.shadowBlur = 22 * GLOW; ctx.shadowColor = rgba(TEAL, 0.35);
    ctx.strokeStyle = rgba(TEAL, 0.18); ctx.lineWidth = 3.5;
    var bigUnit = unit * 1.4;
    var d1 = bigUnit * breath;
    circle(0, 0, bigUnit);
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      circle(Math.cos(a) * d1, Math.sin(a) * d1, bigUnit);
    }
    ctx.restore();

    // Inner ring (violet) — counter-clockwise
    ctx.save(); ctx.rotate(-angle * 2);
    ctx.shadowBlur = 15 * GLOW; ctx.shadowColor = rgba(VIOLET, 0.25);
    ctx.strokeStyle = rgba(VIOLET, 0.12); ctx.lineWidth = 2.5;
    circle(0, 0, R * 0.47);
    ctx.restore();

    // Seed of Life (fuchsia) — counter-clockwise (opposite to teal)
    ctx.save(); ctx.rotate(-angle * 4);
    ctx.shadowBlur = 20 * GLOW; ctx.shadowColor = rgba(FUCHSIA, 0.35);
    ctx.strokeStyle = rgba(FUCHSIA, 0.16); ctx.lineWidth = 2.5;
    var sR = unit * 0.4 * breath;
    circle(0, 0, sR);
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      circle(Math.cos(a) * sR, Math.sin(a) * sR, sR);
    }
    ctx.restore();

    // Inner ring + center dot
    ctx.shadowBlur = 12 * GLOW; ctx.shadowColor = rgba(GOLD, 0.3);
    ctx.strokeStyle = rgba(GOLD, 0.12); ctx.lineWidth = 2;
    circle(0, 0, unit * 0.5);
    ctx.shadowBlur = 30 * GLOW; ctx.shadowColor = rgba(FUCHSIA, 0.45);
    ctx.fillStyle = rgba(FUCHSIA, 0.1);
    ctx.beginPath(); ctx.arc(0, 0, R * 0.02, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // --- IntersectionObserver: pause when canvas parent is off-screen ---
  var isVisible = true;
  var rafId = null;
  var time = 0;

  var visibilityObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      isVisible = entry.isIntersecting;
      if (isVisible && !rafId && !prefersReduced) {
        rafId = requestAnimationFrame(animate);
      }
    });
  }, { threshold: 0 });

  visibilityObserver.observe(canvas.parentElement);

  // Also pause when tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      isVisible = false;
    } else {
      isVisible = true;
      if (!rafId && !prefersReduced) {
        rafId = requestAnimationFrame(animate);
      }
    }
  });

  function animate() {
    rafId = null;
    if (!isVisible) return;
    ctx.clearRect(0, 0, W, H);
    angle += SPEED;
    drawMandala(time);
    time++;
    rafId = requestAnimationFrame(animate);
  }

  if (prefersReduced) {
    drawMandala(0);
  } else {
    animate();
  }
})();
