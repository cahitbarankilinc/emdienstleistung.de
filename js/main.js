/* ============================================================
   EM Dienstleistung — scroll engine (GSAP + ScrollTrigger + Lenis)
   ============================================================ */
(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.body.classList.add("anim-ready");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const sections = gsap.utils.toArray(".scene");
  const layers = gsap.utils.toArray(".bg-layer");
  const videos = gsap.utils.toArray(".bg-video");
  let current = 0;

  document.getElementById("year").textContent = new Date().getFullYear();
  // pre-hide animated headline lines
  gsap.set(".reveal-mask .line > span", { yPercent: 116, opacity: 0 });

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95, lerp: 0.09, smoothTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { duration: 1.3 });
    else el.scrollIntoView({ behavior: "smooth" });
  }
  document.querySelectorAll("[data-scroll]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); scrollToEl(t); }
      }
    });
  });

  /* ---------- VIDEO MANAGEMENT (mobile-aware) ---------- */
  function playVideo(idx) {
    videos.forEach((v, j) => {
      const near = Math.abs(j - idx) <= 1; // active + neighbours -> smooth crossfades (desktop & mobile)
      if (near) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        const pr = v.play();
        if (pr && pr.catch) pr.catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }

  /* ---------- BACKGROUND CROSSFADE + PARALLAX ---------- */
  gsap.set(layers[0], { opacity: 1 });
  sections.forEach((sec, i) => {
    if (i > 0) {
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true } })
        .to(layers[i], { opacity: 1, ease: "none" }, 0)
        .to(layers[i - 1], { opacity: 0, ease: "none" }, 0);
    }
    if (!prefersReduced) {
      gsap.fromTo(videos[i], { scale: 1.12, yPercent: -2.5 }, {
        scale: 1.0, yPercent: 2.5, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
      });
      // subtle content parallax (text rises as it leaves -> "exits upward")
      const inner = sec.querySelector(".scene__inner");
      if (inner) gsap.fromTo(inner, { yPercent: 6 }, {
        yPercent: -6, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
      });
    }
    ScrollTrigger.create({
      trigger: sec, start: "top center", end: "bottom center",
      onToggle: (self) => { if (self.isActive) { current = i; playVideo(i); setDot(i); } }
    });
  });

  /* ---------- DIRECTIONAL REVEALS ---------- */
  function animateIn(scope) {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    const mask = scope.querySelectorAll(".reveal-mask .line > span");
    if (mask.length)
      tl.to(mask, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.1 }, 0);
    const items = gsap.utils.toArray(scope.querySelectorAll(".anim"));
    items.forEach((el, i) => {
      const dir = el.dataset.anim || "up";
      const from = { opacity: 0 };
      if (dir === "up") from.y = 46;
      else if (dir === "down") from.y = -46;
      else if (dir === "left") from.x = -64;
      else if (dir === "right") from.x = 64;
      else if (dir === "zoom") from.scale = 0.8;
      tl.fromTo(el, from, { opacity: 1, x: 0, y: 0, scale: 1, duration: 1, clearProps: "transform" }, 0.12 + i * 0.075);
    });
    return tl;
  }
  sections.forEach((sec, i) => {
    if (i === 0) return;
    ScrollTrigger.create({
      trigger: sec, start: "top 70%",
      onEnter: () => { animateIn(sec); playVideo(i); setDot(i); current = i; },
      onEnterBack: () => { animateIn(sec); playVideo(i); setDot(i); current = i; }
    });
  });
  function revealHero() {
    if (prefersReduced) {
      gsap.set("#s0 .anim", { opacity: 1 });
      gsap.set("#s0 .reveal-mask .line > span", { opacity: 1, yPercent: 0 });
      return;
    }
    animateIn(document.getElementById("s0"));
  }

  /* ---------- MARQUEE (horizontal slide on scroll) ---------- */
  const marquee = document.getElementById("marquee");
  if (marquee && !prefersReduced) {
    gsap.to(marquee, {
      xPercent: -50, ease: "none",
      scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: 1 }
    });
  }

  /* ---------- HEADER + PROGRESS ---------- */
  const header = document.getElementById("header");
  const progress = document.querySelector("#progress span");
  function onScroll(y) {
    header.classList.toggle("is-scrolled", y > 40);
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (limit > 0 ? (y / limit) * 100 : 0) + "%";
  }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  /* ---------- DOTS ---------- */
  const dotsWrap = document.getElementById("dots");
  sections.forEach((sec, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Abschnitt " + (i + 1));
    b.addEventListener("click", () => scrollToEl(sec));
    dotsWrap.appendChild(b);
  });
  const dotEls = gsap.utils.toArray("#dots button");
  function setDot(i) { dotEls.forEach((d, j) => d.classList.toggle("is-active", j === i)); }
  setDot(0);

  /* ---------- START SITE ---------- */
  function startSite() {
    if (startSite.done) return;
    startSite.done = true;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    playVideo(0);
    revealHero();
    ScrollTrigger.refresh();
  }

  /* ---------- INTRO (logo reveal) ---------- */
  const intro = document.getElementById("intro");
  const introVideo = document.getElementById("introVideo");
  const introSkip = document.getElementById("introSkip");
  let introDone = false;
  function endIntro() {
    if (introDone) return;
    introDone = true;
    intro.classList.add("is-done");
    try { introVideo.pause(); } catch (e) {}
    startSite();
    setTimeout(() => { intro.style.display = "none"; }, 1000);
  }
  if (intro && introVideo && !prefersReduced) {
    const pr = introVideo.play();
    if (pr && pr.catch) pr.catch(() => setTimeout(endIntro, 1200));
    setTimeout(() => intro.classList.add("show-skip"), 800);
    introVideo.addEventListener("ended", endIntro);
    introSkip.addEventListener("click", endIntro);
    setTimeout(endIntro, 13000); // hard safety
  } else {
    if (intro) intro.style.display = "none";
    startSite();
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
