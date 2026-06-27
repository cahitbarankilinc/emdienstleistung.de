/* ============================================================
   V4 — Horizontal Journey
   ============================================================ */
(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll("[data-scroll]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (!id || id.charAt(0) !== "#") return;
      const t = document.querySelector(id); if (t) { e.preventDefault(); if (lenis) lenis.scrollTo(t, { duration: 1.3 }); else t.scrollIntoView({ behavior: "smooth" }); }
    });
  });

  /* kinetic intro title */
  document.querySelectorAll(".kinetic").forEach((el) => {
    const out = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) node.textContent.split(/(\s+)/).forEach((p) => {
        if (!p) return; if (!p.trim()) { out.push(document.createTextNode(p)); return; }
        const w = document.createElement("span"); w.className = "word"; const s = document.createElement("span"); s.textContent = p; w.appendChild(s); out.push(w);
      });
      else if (node.nodeType === 1) { const w = document.createElement("span"); w.className = "word"; const inner = node.cloneNode(true); inner.style.display = "inline-block"; w.appendChild(inner); out.push(w); }
    });
    el.innerHTML = ""; out.forEach((n) => el.appendChild(n));
  });
  if (!reduce) {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.set(".reveal", { opacity: 0 });
    tl.fromTo(".kinetic .word > *", { yPercent: 118 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: "power3.out" }, 0);
    tl.fromTo(".vintro .reveal", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.3);
  } else gsap.set(".reveal", { opacity: 1 });

  /* ---------- HORIZONTAL TRACK ---------- */
  const rail = document.getElementById("rail");
  const pin = document.getElementById("pin");
  const hbar = document.getElementById("hbar");
  const panels = gsap.utils.toArray(".panel");
  let track = null;

  if (!reduce && rail) {
    const amount = () => rail.scrollWidth - window.innerWidth;
    track = gsap.to(rail, {
      x: () => -amount(), ease: "none",
      scrollTrigger: {
        trigger: pin, start: "top top", end: () => "+=" + amount(),
        pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => { if (hbar) hbar.style.width = (self.progress * 100).toFixed(1) + "%"; }
      }
    });
    panels.forEach((p) => {
      const v = p.querySelector(".panel__bg");
      if (v) gsap.fromTo(v, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: p, containerAnimation: track, start: "left right", end: "right left", scrub: true } });
      ScrollTrigger.create({
        trigger: p, containerAnimation: track, start: "left 70%", end: "right 30%",
        onToggle: (s) => { if (v) { if (s.isActive) { if (v.preload === "none") { v.preload = "auto"; v.load(); } v.play().catch(() => {}); } else v.pause(); } }
      });
      const card = p.querySelector(".panel__card");
      if (card) gsap.fromTo(card, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, ease: "power2.out", duration: 0.6, scrollTrigger: { trigger: p, containerAnimation: track, start: "left 75%", toggleActions: "play none none reverse" } });
    });
  }

  /* counters (stat panel) */
  gsap.utils.toArray(".bigstat b").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-count")) || 0, suffix = el.getAttribute("data-suffix") || "", o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, containerAnimation: track || undefined, start: "left 80%", once: true,
      onEnter: () => { if (reduce) { el.textContent = target + suffix; return; } gsap.to(o, { v: target, duration: 1.5, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } }); }
    });
  });

  /* reveals (outside track) */
  if (!reduce) gsap.utils.toArray(".cta .reveal").forEach((el) => gsap.fromTo(el, { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } }));

  /* nav + scrollbar */
  const nav = document.getElementById("nav"), bar = document.querySelector("#scrollbar span");
  function onScroll(y) { nav.classList.toggle("is-scrolled", y > 30); const lim = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = (lim > 0 ? (y / lim) * 100 : 0) + "%"; }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll)); else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  window.addEventListener("load", () => ScrollTrigger.refresh());

  if (!fine || reduce) return;
  /* cursor + magnetic + tilt */
  const cur = document.getElementById("cursor");
  const xT = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" }), yT = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
  window.addEventListener("mousemove", (e) => { xT(e.clientX); yT(e.clientY); });
  document.querySelectorAll("a,button,[data-magnetic],[data-tilt],.panel__card").forEach((el) => { el.addEventListener("mouseenter", () => cur.classList.add("is-hover")); el.addEventListener("mouseleave", () => cur.classList.remove("is-hover")); });
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.4, ease: "power3.out" }); });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
  });
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    el.style.transformStyle = "preserve-3d";
    el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 8, duration: 0.5, ease: "power3.out", transformPerspective: 900 }); });
    el.addEventListener("mouseleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power3.out" }));
  });
})();
