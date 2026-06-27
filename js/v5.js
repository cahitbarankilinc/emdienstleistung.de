/* ============================================================
   V5 — Daylight interactions
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
    a.addEventListener("click", (e) => { const id = a.getAttribute("href"); if (!id || id.charAt(0) !== "#") return; const t = document.querySelector(id); if (t) { e.preventDefault(); if (lenis) lenis.scrollTo(t, { offset: -10, duration: 1.3 }); else t.scrollIntoView({ behavior: "smooth" }); } });
  });

  /* entrance + reveals */
  if (!reduce) {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.set(".reveal,.reveal-media", { opacity: 0 });
    tl.fromTo(".hero .reveal, .hero .chip", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: "power3.out" }, 0.1);
    tl.fromTo(".hero__title", { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, 0.05);
    tl.fromTo(".hero .reveal-media", { y: 36, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1.1, ease: "power3.out" }, 0.25);
    gsap.utils.toArray(".reveal").forEach((el) => { if (el.closest(".hero")) return; gsap.fromTo(el, { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }); });
  } else gsap.set(".reveal,.reveal-media", { opacity: 1 });

  /* marquee */
  const mrow = document.getElementById("mrow");
  if (mrow && !reduce) gsap.to(mrow, { xPercent: -50, repeat: -1, duration: 34, ease: "none" });

  /* counters */
  gsap.utils.toArray(".stat b").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-count")) || 0, suffix = el.getAttribute("data-suffix") || "", o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => { if (reduce) { el.textContent = target + suffix; return; } gsap.to(o, { v: target, duration: 1.5, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } }); } });
  });

  /* stacking cards: scale the card down as the next one slides over it */
  if (!reduce && window.matchMedia("(min-width:901px)").matches) {
    const cards = gsap.utils.toArray(".card");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: 0.93, filter: "brightness(0.82)", ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top 78%", end: "top 18%", scrub: true } });
    });
  }

  /* bento/card hover-play */
  document.querySelectorAll(".card video, .hero__frame video").forEach((v) => {
    const host = v.closest(".card") || v.closest(".hero__frame");
    if (v.autoplay) return;
    host.addEventListener("mouseenter", () => { if (v.preload === "none") { v.preload = "auto"; v.load(); } v.play().catch(() => {}); });
    host.addEventListener("mouseleave", () => { try { v.pause(); } catch (e) {} });
  });

  /* nav + scrollbar */
  const nav = document.getElementById("nav"), bar = document.querySelector("#scrollbar span");
  function onScroll(y) { nav.classList.toggle("is-scrolled", y > 30); const lim = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = (lim > 0 ? (y / lim) * 100 : 0) + "%"; }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll)); else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  window.addEventListener("load", () => ScrollTrigger.refresh());

  if (!fine || reduce) return;
  const cur = document.getElementById("cursor");
  const xT = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" }), yT = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
  window.addEventListener("mousemove", (e) => { xT(e.clientX); yT(e.clientY); });
  document.querySelectorAll("a,button,[data-magnetic],.card").forEach((el) => { el.addEventListener("mouseenter", () => cur.classList.add("is-hover")); el.addEventListener("mouseleave", () => cur.classList.remove("is-hover")); });
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.3, duration: 0.4, ease: "power3.out" }); });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
  });
})();
