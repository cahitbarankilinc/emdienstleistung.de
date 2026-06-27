/* ============================================================
   EM Dienstleistung — V3 "Aurora Studio" interactions
   Lenis + GSAP: kinetic type, magnetic cursor & buttons,
   scroll reveals, counters, bento hover-play, 3D tilt.
   ============================================================ */
(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- LENIS ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.09, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll("[data-scroll]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        const t = id === "#top" ? document.body : document.querySelector(id);
        if (t) { e.preventDefault(); if (lenis) lenis.scrollTo(t, { offset: -10, duration: 1.3 }); else t.scrollIntoView({ behavior: "smooth" }); }
      }
    });
  });

  /* ---------- KINETIC HEADLINE ---------- */
  document.querySelectorAll(".kinetic").forEach((el) => {
    const out = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (!part.trim()) { out.push(document.createTextNode(part)); return; }
          const w = document.createElement("span"); w.className = "word";
          const inner = document.createElement("span"); inner.textContent = part;
          w.appendChild(inner); out.push(w);
        });
      } else if (node.nodeType === 1) {
        const w = document.createElement("span"); w.className = "word";
        const inner = node.cloneNode(true); inner.style.display = "inline-block";
        w.appendChild(inner); out.push(w);
      }
    });
    el.innerHTML = ""; out.forEach((n) => el.appendChild(n));
  });

  /* ---------- ENTRANCE ---------- */
  if (!reduce) {
    const heroWords = document.querySelectorAll(".hero .kinetic .word > *");
    const tl = gsap.timeline({ delay: 0.15 });
    tl.set(".reveal, .reveal-media", { opacity: 0 });
    if (heroWords.length) tl.fromTo(heroWords, { yPercent: 118 }, { yPercent: 0, duration: 1.0, stagger: 0.07, ease: "power3.out" }, 0);
    tl.fromTo(".hero .reveal", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.35);
    tl.fromTo(".hero .reveal-media", { y: 40, scale: 0.95, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1.1, ease: "power3.out" }, 0.3);
  } else {
    gsap.set(".reveal, .reveal-media", { opacity: 1 });
  }

  /* ---------- SCROLL REVEALS ---------- */
  if (!reduce) {
    gsap.utils.toArray(".reveal").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.fromTo(el, { y: 46, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });
  }

  /* ---------- COUNTERS ---------- */
  gsap.utils.toArray(".statcard__num").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        if (reduce) { el.textContent = target + suffix; return; }
        gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v) + suffix; } });
      }
    });
  });

  /* ---------- NAV + SCROLLBAR ---------- */
  const nav = document.getElementById("nav");
  const bar = document.querySelector("#scrollbar span");
  function onScroll(y) {
    nav.classList.toggle("is-scrolled", y > 30);
    const lim = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (lim > 0 ? (y / lim) * 100 : 0) + "%";
  }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll)); else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  /* ---------- BENTO HOVER-PLAY ---------- */
  document.querySelectorAll(".tile video").forEach((v) => {
    const tile = v.closest(".tile");
    tile.addEventListener("mouseenter", function () { if (v.preload === "none") { v.preload = "auto"; v.load(); } const p = v.play(); if (p && p.catch) p.catch(() => {}); });
    tile.addEventListener("mouseleave", function () { try { v.pause(); } catch (e) {} });
  });
  // large tile autoplays softly when in view
  const bigV = document.querySelector(".tile--lg video");
  if (bigV) ScrollTrigger.create({ trigger: bigV, start: "top 80%", end: "bottom 20%", onToggle: (s) => { if (s.isActive) { if (bigV.preload === "none") { bigV.preload = "auto"; bigV.load(); } bigV.play().catch(() => {}); } else bigV.pause(); } });

  if (!fine || reduce) return; // cursor / magnet / tilt = desktop pointer only

  /* ---------- CUSTOM CURSOR ---------- */
  const cur = document.getElementById("cursor");
  const xT = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" });
  const yT = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
  window.addEventListener("mousemove", (e) => { xT(e.clientX); yT(e.clientY); });
  document.querySelectorAll("a, button, [data-magnetic], .tile, [data-tilt]").forEach((el) => {
    el.addEventListener("mouseenter", () => cur.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cur.classList.remove("is-hover"));
  });

  /* ---------- MAGNETIC ELEMENTS ---------- */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * strength, y: my * strength, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
  });

  /* ---------- 3D TILT ---------- */
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = 7;
    el.style.transformStyle = "preserve-3d";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: px * max, rotateX: -py * max, duration: 0.5, ease: "power3.out", transformPerspective: 900 });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power3.out" }));
  });
})();
