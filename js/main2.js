/* ============================================================
   EM Dienstleistung — V2 CINEMATIC (step scroll + slide)
   - Preload everything -> "Start".
   - Inside a scene each scroll reveals the NEXT message (sliding
     in from the side). The clip keeps playing smoothly (1x, native)
     and freezes on its last frame.
   - Only AFTER the last message of a scene does the next scroll
     move on — with a smooth VERTICAL SLIDE (next scene pushes up
     from below). No black flash, no two clips blended.
   - Idle: messages advance on their own; the scene advances ~5s
     after its clip ends.
   ============================================================ */
(function () {
  "use strict";
  const HOLD_AFTER_END = 5;     // seconds frozen on last frame before scene auto-advances
  const MSG_TIME = 6.0;         // seconds each message stays (idle auto-advance)
  const XFADE = 0.75;           // scene crossfade duration (seconds)

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  const layers = Array.prototype.slice.call(document.querySelectorAll(".bg-layer"));
  const videos = Array.prototype.slice.call(document.querySelectorAll(".bg-video"));
  const N = scenes.length;
  const sceneBoxes = scenes.map(function (s) { return Array.prototype.slice.call(s.querySelectorAll(".slide > *")); });
  const allBoxes = sceneBoxes.reduce(function (a, b) { return a.concat(b); }, []);
  function steps(i) { return Math.max(1, sceneBoxes[i].length); }

  const offsets = []; let totalSteps = 0;
  for (let i = 0; i < N; i++) { offsets[i] = totalSteps; totalSteps += steps(i); }

  let cur = -1, step = 0, started = false, busy = false, stepTimer = null;
  let bgMode = (window.localStorage && localStorage.getItem("emBgMode")) || "cinematic"; // "cinematic" | "scroll"

  document.getElementById("year").textContent = new Date().getFullYear();
  gsap.set(".reveal-mask .line > span", { yPercent: 0, opacity: 1 });
  gsap.set(allBoxes, { autoAlpha: 0 });
  layers.forEach(function (l) { l.style.opacity = 0; });

  const launch = document.getElementById("launch");
  const launchBar = document.getElementById("launchBar");
  const launchStatus = document.getElementById("launchStatus");
  const launchStart = document.getElementById("launchStart");
  const header = document.getElementById("header");
  const progressBar = document.querySelector("#progress span");
  const navHint = document.getElementById("navHint");

  /* ---------- DOTS ---------- */
  const dotsWrap = document.getElementById("dots");
  scenes.forEach(function (s, i) {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Abschnitt " + (i + 1));
    b.addEventListener("click", function () { if (started) goScene(i, false); });
    dotsWrap.appendChild(b);
  });
  const dotEls = Array.prototype.slice.call(dotsWrap.querySelectorAll("button"));
  function setDot(i) { dotEls.forEach(function (d, j) { d.classList.toggle("is-active", j === i); }); }

  /* ---------- PRELOAD ---------- */
  let readyCount = 0;
  function bump(v) {
    if (v.__counted) return; v.__counted = true; readyCount++;
    launchBar.style.width = Math.round((readyCount / N) * 100) + "%";
    launchStatus.textContent = readyCount >= N ? "Bereit" : readyCount + " / " + N + " geladen";
    if (readyCount >= N) allReady();
  }
  function allReady() {
    if (allReady.done) return; allReady.done = true;
    launchBar.style.width = "100%"; launchStatus.textContent = "Bereit"; launchStart.hidden = false;
  }
  videos.forEach(function (v) {
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.loop = false;
    if (v.readyState >= 3) bump(v);
    else v.addEventListener("canplaythrough", function () { bump(v); }, { once: true });
    v.addEventListener("loadeddata", function () { setTimeout(function () { if (v.readyState >= 3) bump(v); }, 50); }, { once: true });
    try { v.load(); } catch (e) {}
  });
  setTimeout(allReady, 16000);

  videos[0].addEventListener("timeupdate", function () {
    const v = videos[0];
    if (cur === 0 && v.duration && v.currentTime > v.duration - 2.2) v.playbackRate = 0.55;
  });

  /* ---------- START ---------- */
  launchStart.addEventListener("click", start);
  function start() {
    if (started) return; started = true;
    launch.classList.add("is-done");
    setTimeout(function () { launch.style.display = "none"; }, 800);
    videos.forEach(function (v, i) { const p = v.play(); if (p && p.then) p.then(function () { if (i !== 0) v.pause(); }).catch(function () {}); });
    cur = 0;
    scenes[0].classList.add("is-active");
    header.classList.remove("is-scrolled");
    playClip(0);
    showMsg(0, 0, true);
    gsap.fromTo(layers[0], { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "power1.inOut" });
    showHint();
  }

  /* ---------- COUNT-UP (stats) ---------- */
  function countUp(box) {
    const el = box.querySelector(".stat__num[data-count]");
    if (!el || el.__running) return;
    el.__running = true; el.__done = true;
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 1.5, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }, onComplete: function () { el.__running = false; } });
  }

  /* ---------- VIDEO ---------- */
  function playClip(i) {
    const v = videos[i];
    videos.forEach(function (vv, k) { if (k !== i && !vv.paused) { try { vv.pause(); } catch (e) {} } });
    v.loop = false; v.playbackRate = 1;
    if (v.__ctTween) { v.__ctTween.kill(); v.__ctTween = null; }
    try { v.currentTime = 0; } catch (e) {}
    if (bgMode === "cinematic") { const p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else { try { v.pause(); } catch (e) {} }   // scroll mode: paused, advanced by scrolling
  }

  // SCROLL mode: move the clip forward to match the current message
  function applyVideoForStep(i, k) {
    if (bgMode !== "scroll") return;
    const v = videos[i];
    const d = (v.duration && isFinite(v.duration)) ? v.duration : 8;
    const n = steps(i);
    const target = n > 1 ? (k / (n - 1)) * (d - 0.12) : Math.min(d - 0.12, 1.0);
    if (v.__ctTween) v.__ctTween.kill();
    try { v.pause(); } catch (e) {}
    const o = { t: v.currentTime || 0 };
    v.__ctTween = gsap.to(o, { t: target, duration: 0.6, ease: "power2.out", onUpdate: function () { try { v.currentTime = o.t; } catch (e) {} } });
  }

  /* ---------- SHOW A MESSAGE within a scene ---------- */
  function showMsg(i, k, instant) {
    step = k;
    const boxes = sceneBoxes[i];
    boxes.forEach(function (b, j) { if (j !== Math.min(k, boxes.length - 1)) gsap.set(b, { autoAlpha: 0 }); });
    if (boxes.length) {
      const box = boxes[Math.min(k, boxes.length - 1)];
      const dir = k % 2 === 0 ? 1 : -1;
      if (instant || prefersReduced) gsap.set(box, { autoAlpha: 1, xPercent: 0, yPercent: 0 });
      else gsap.fromTo(box, { xPercent: dir * 16, yPercent: 26, autoAlpha: 0 }, { xPercent: 0, yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" });
      countUp(box);
    }
    setDot(i);
    progressBar.style.width = ((offsets[i] + k + 1) / totalSteps) * 100 + "%";
    applyVideoForStep(i, k);
    scheduleAuto(i, k);
  }

  function scheduleAuto(i, k) {
    clearTimeout(stepTimer);
    const last = steps(i) - 1;
    const v = videos[i];
    if (k < last) {
      const dur = (v.duration && isFinite(v.duration)) ? v.duration : 9;
      const t = Math.max(MSG_TIME, dur / steps(i));
      stepTimer = setTimeout(function () { advance(1, true); }, t * 1000);
    } else if (i < N - 1) {
      const left = (v.duration && isFinite(v.duration)) ? Math.max(0, v.duration - v.currentTime) : 2;
      stepTimer = setTimeout(function () { if (cur === i && !busy) goScene(i + 1, false); }, (left + HOLD_AFTER_END) * 1000);
    }
  }

  /* ---------- SCENE-TO-SCENE: soft in-place crossfade (no slide, no black) ---------- */
  function goScene(i, toLast) {
    if (busy || i < 0 || i >= N || i === cur) return;
    busy = true;
    clearTimeout(stepTimer);
    const from = cur;
    const startK = toLast ? steps(i) - 1 : 0;

    cur = i; step = startK;
    scenes[i].classList.add("is-active");
    header.classList.toggle("is-scrolled", i >= 1);
    setDot(i);
    progressBar.style.width = ((offsets[i] + startK + 1) / totalSteps) * 100 + "%";
    playClip(i);
    applyVideoForStep(i, startK);

    // incoming message: gently fade in (matches the dissolve, no sliding)
    const boxes = sceneBoxes[i];
    boxes.forEach(function (b) { gsap.set(b, { autoAlpha: 0, xPercent: 0, yPercent: 0 }); });
    const inBox = boxes[Math.min(startK, boxes.length - 1)];
    if (inBox) { if (prefersReduced) gsap.set(inBox, { autoAlpha: 1 }); else gsap.to(inBox, { autoAlpha: 1, duration: XFADE, ease: "power1.inOut" }); countUp(inBox); }

    // crossfade the backgrounds IN PLACE — old dissolves out while new dissolves in
    layers[i].style.opacity = 0;
    gsap.to(layers[from], { opacity: 0, duration: XFADE, ease: "power1.inOut" });
    gsap.to(layers[i], { opacity: 1, duration: XFADE, ease: "power1.inOut" });
    gsap.to(sceneBoxes[from], { autoAlpha: 0, duration: XFADE * 0.6 });

    scheduleAuto(i, startK);
    setTimeout(function () {
      scenes[from].classList.remove("is-active");
      sceneBoxes[from].forEach(function (b) { gsap.set(b, { autoAlpha: 0 }); });
      layers[from].style.opacity = 0;
      layers[i].style.opacity = 1;            // guarantee incoming is fully visible
      if (inBox) gsap.set(inBox, { autoAlpha: 1 });
      try { videos[from].pause(); } catch (e) {}
      busy = false;
    }, XFADE * 1000 + 40);
  }

  /* ---------- NAVIGATION ---------- */
  function advance(dir, auto) {
    if (busy || !started) return;
    const last = steps(cur) - 1;
    if (dir > 0) {
      if (step < last) showMsg(cur, step + 1, false);
      else if (cur < N - 1) goScene(cur + 1, false);
    } else {
      if (step > 0) showMsg(cur, step - 1, false);
      else if (cur > 0) goScene(cur - 1, true);
    }
    if (!auto) showHint();
  }
  // ONE wheel gesture = ONE step. A trackpad/mouse fires a burst of wheel
  // events (momentum); we act on the first and ignore the rest until the
  // gesture has been quiet for a moment.
  let wheelLock = false, wheelTimer = null;
  window.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaY) < 8) return;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function () { wheelLock = false; }, 140);
    if (wheelLock) return;
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1, false);
  }, { passive: true });
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); advance(1, false); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); advance(-1, false); }
  });
  let ty = null;
  window.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", function (e) {
    if (ty == null) return;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 42) advance(dy > 0 ? 1 : -1, false);
    ty = null;
  }, { passive: true });
  document.querySelectorAll("[data-goto]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (started) goScene(parseInt(a.getAttribute("data-goto"), 10), false); });
  });

  /* ---------- BACKGROUND MODE TOGGLE (Kino <-> Scroll) ---------- */
  const bgToggle = document.getElementById("bgToggle");
  const bgModeLabel = document.getElementById("bgModeLabel");
  if (bgModeLabel) bgModeLabel.textContent = bgMode === "cinematic" ? "Kino" : "Scroll";
  if (bgToggle) bgToggle.addEventListener("click", function () {
    bgMode = bgMode === "cinematic" ? "scroll" : "cinematic";
    try { localStorage.setItem("emBgMode", bgMode); } catch (e) {}
    if (bgModeLabel) bgModeLabel.textContent = bgMode === "cinematic" ? "Kino" : "Scroll";
    if (started) { playClip(cur); applyVideoForStep(cur, step); }
  });

  let hintTimer = null;
  function showHint() {
    navHint.classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { navHint.classList.remove("show"); }, 4500);
  }
})();
