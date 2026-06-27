/* ============================================================
   EM Dienstleistung — Final engine
   V2-style stepped scroll + smooth lerp-scrub of a dense-keyframe,
   low-bitrate video (same technique as the em-dienstleistung.de film).
   ============================================================ */
(function () {
  "use strict";
  var VID = document.getElementById("bgvid");
  var load = document.getElementById("load");
  var loadbar = document.getElementById("loadbar");
  var loadgo = document.getElementById("loadgo");
  var rot = document.getElementById("rot");
  var dotsWrap = document.getElementById("dots");
  var sponge = document.getElementById("sponge");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* rest-time of each scene (seconds) for steps 0..6; step 7 (CTA) holds at last */
  var anchors = [0.5, 7.5, 13.5, 21.5, 29.0, 36.0, 43.5];
  var LASTV = 6, LAST = 7;
  var cur = 0, animating = false, started = false, ready = false;

  var overlays = [];
  document.querySelectorAll(".ov").forEach(function (o) { overlays[+o.dataset.step] = o; });

  /* ---------- loading ---------- */
  function setReady() { if (ready) return; ready = true; load.classList.add("ready"); }
  function prog() {
    try {
      if (VID.duration) {
        var b = VID.buffered.length ? VID.buffered.end(VID.buffered.length - 1) : 0;
        loadbar.style.width = Math.min(100, (b / VID.duration) * 100) + "%";
        if (b / VID.duration > 0.25 || VID.readyState >= 3) setReady();
      }
    } catch (e) {}
  }
  VID.addEventListener("loadeddata", function () { VID.pause(); try { VID.currentTime = anchors[0]; } catch (e) {} });
  VID.addEventListener("progress", prog);
  VID.addEventListener("canplaythrough", setReady);
  setInterval(prog, 350);
  setTimeout(setReady, 9000);
  loadgo.addEventListener("click", startSite);
  function startSite() { if (started || !ready) return; started = true; document.body.classList.add("started"); load.classList.add("hidden"); try { VID.pause(); VID.currentTime = anchors[0]; } catch (e) {} }

  /* ---------- smooth lerp scrub (the smoothness secret) ---------- */
  var targetTime = anchors[0], curTime = anchors[0], rafOn = false, scrubDone = null;
  function scrubTick() {
    curTime += (targetTime - curTime) * 0.16;
    var done = Math.abs(targetTime - curTime) < 0.01;
    if (done) curTime = targetTime;
    if (VID.readyState >= 2 && isFinite(VID.duration)) {
      var t = Math.min(VID.duration - 0.05, Math.max(0, curTime));
      if (Math.abs(VID.currentTime - t) > 0.012) { try { VID.currentTime = t; } catch (e) {} }
    }
    if (!done) requestAnimationFrame(scrubTick);
    else { rafOn = false; var d = scrubDone; scrubDone = null; if (d) d(); }
  }
  function scrubTo(time, done) {
    targetTime = time; scrubDone = done;
    if (reduce) { curTime = time; try { VID.currentTime = time; } catch (e) {} if (done) done(); return; }
    if (!rafOn) { rafOn = true; requestAnimationFrame(scrubTick); }
  }

  /* ---------- dots ---------- */
  var dotsEls = [];
  for (var i = 0; i <= LAST; i++) {
    (function (k) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Schritt " + (k + 1));
      if (k === 0) b.className = "on";
      b.addEventListener("click", function () { if (!started || locked) return; lock(); goStep(k, k > cur ? 1 : -1, unlockSoon); });
      dotsWrap.appendChild(b); dotsEls.push(b);
    })(i);
  }

  /* ---------- seamless ribbon (V1) ---------- */
  var rib = document.querySelector(".ribbon__row");
  if (rib) {
    var rw = ["Vertrauen", "Präzision", "Zuverlässigkeit", "Sauberkeit", "Qualität"], unit = "";
    for (var u = 0; u < 4; u++) rw.forEach(function (x) { unit += "<span>" + x + "</span><i>✦</i>"; });
    rib.innerHTML = unit + unit;
  }

  /* ---------- rotating headline (V8) ---------- */
  var words = ["überzeugt.", "begeistert.", "glänzt.", "Vertrauen schafft."], wi = 0;
  rot.innerHTML = '<span class="in">' + words[0] + "</span>";
  if (!reduce) setInterval(function () {
    var old = rot.querySelector("span.in");
    var nw = document.createElement("span");
    wi = (wi + 1) % words.length; nw.textContent = words[wi]; rot.appendChild(nw);
    requestAnimationFrame(function () {
      nw.classList.add("in");
      if (old) { old.classList.remove("in"); old.classList.add("out"); setTimeout(function () { old.remove(); }, 700); }
    });
  }, 2600);

  /* ---------- step engine ---------- */
  function setActive(i) {
    overlays.forEach(function (o) { o.classList.toggle("is-active", +o.dataset.step === i); });
    document.body.dataset.step = i;
    var o = overlays[i], side = "";
    if (o.classList.contains("left")) side = "left"; else if (o.classList.contains("right")) side = "right";
    document.body.dataset.side = side;
    dotsEls.forEach(function (d, k) { d.classList.toggle("on", k === i); });
  }
  function goStep(target, dir, done) {
    target = Math.max(0, Math.min(LAST, target));
    if (target === cur) { if (done) done(); return; }
    animating = true; cur = target;
    setActive(target);
    scrubTo(anchors[Math.min(target, LASTV)], function () { animating = false; if (done) done(); });
  }

  /* ---------- input lock (V2 anti-burst) ---------- */
  var locked = false, lastWheel = 0;
  function lock() { locked = true; }
  function unlockSoon() { setTimeout(function () { locked = false; }, 130); }
  function unlockWhenQuiet() { (function w() { if (performance.now() - lastWheel > 150) locked = false; else setTimeout(w, 60); })(); }
  function gesture(dir) { if (locked) return; lock(); goStep(cur + dir, dir, unlockWhenQuiet); }

  addEventListener("wheel", function (e) {
    if (!started) { if (ready) startSite(); return; }
    if (Math.abs(e.deltaY) < 10) return;
    lastWheel = performance.now();
    gesture(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  var ty = null;
  addEventListener("touchstart", function (e) { if (!started) { if (ready) startSite(); return; } ty = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchend", function (e) {
    if (ty == null || !started) return;
    var dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 42 && !locked) { lock(); goStep(cur + (dy > 0 ? 1 : -1), dy > 0 ? 1 : -1, unlockSoon); }
    ty = null;
  }, { passive: true });

  addEventListener("keydown", function (e) {
    if (!started) { if (ready && (e.key === " " || e.key === "Enter" || e.key.indexOf("Arrow") === 0)) { startSite(); e.preventDefault(); } return; }
    var d = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") d = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp") d = -1;
    else if (e.key === "Home") { if (!locked) { lock(); goStep(0, -1, unlockSoon); } return; }
    else if (e.key === "End") { if (!locked) { lock(); goStep(LAST, 1, unlockSoon); } return; }
    if (d) { e.preventDefault(); if (!locked) { lock(); goStep(cur + d, d, unlockSoon); } }
  });

  /* ---------- sponge cursor + tilt (V3) ---------- */
  if (fine && !reduce) {
    document.body.classList.add("ready");
    var mx = innerWidth / 2, my = innerHeight / 2, sx = mx, sy = my;
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function follow() {
      sx += (mx - sx) * 0.22; sy += (my - sy) * 0.22;
      sponge.style.transform = "translate(" + (sx - 18) + "px," + (sy - 13) + "px)";
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll("a,button,[data-hot]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { sponge.classList.add("hot"); });
      el.addEventListener("mouseleave", function () { sponge.classList.remove("hot"); });
    });
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var rx = -((e.clientY - r.top) / r.height - 0.5) * 10;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        el.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();
