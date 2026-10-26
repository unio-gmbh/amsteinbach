/* Am Steinbach, Motion und Interaktion. Aufbau wie Am Wolfersberg (System Zimmermannplatz 6). */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const animate = hasGsap && !reduced;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const SVGNS = "http://www.w3.org/2000/svg";
  const fmtNum = (n, dec = 0) => Number(n).toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (animate && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const headerH = () => $("#header").offsetHeight;
  function scrollToEl(el, extra = 0) {
    if (!el) return;
    const off = -(headerH() + 10) + extra;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: reduced ? "auto" : "smooth" });
  }

  /* ---------- Lage ---------- */
  /* Orte und Entfernungen stehen im HTML (#spots), damit Suchmaschinen und KI-Crawler sie ohne Skript lesen.
     Luftlinie ab Berggasse 17 (48.24689, 16.19405), OpenStreetMap. Die Distanzleiste liest data-dist und data-lvl. */
  const SPOTS = $$("#spots .spot").map((li) => ({ n: +li.dataset.pin, d: +li.dataset.dist, lvl: +li.dataset.lvl, name: $(".spot__name", li).textContent }));
  const fmtDist = (d) => (d < 1000 ? fmtNum(d) + " m" : d >= 10000 ? fmtNum(d / 1000) + " km" : fmtNum(d / 1000, 1) + " km");
  const L0 = 2, L1 = Math.log10(15000);
  const t = (d) => (Math.log10(d) - L0) / (L1 - L0);

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVGNS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(name, attrs, content, parent) { const n = el(name, attrs, parent); n.textContent = content; return n; }

  const TICKS = [[100, "100 m"], [250, "250 m"], [500, "500 m"], [1000, "1 km"], [2000, "2 km"], [5000, "5 km"], [10000, "10 km"]];
  const BANDS = [[100, 1000, "zu Fuß"], [1000, 3000, "mit dem Rad"], [3000, 15000, "mit Auto oder Öffis"]];

  function buildScale(vertical) {
    const W = vertical ? 360 : 1200, H = vertical ? 660 : 250;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "scale__svg", role: "img", "aria-label": "Entfernungen vom Haus zu neun Orten auf einer logarithmischen Skala von 100 Metern bis 15 Kilometern" });
    const a0 = vertical ? 50 : 150, a1 = vertical ? 630 : 1170, axis = vertical ? 80 : 190;
    const pos = (d) => a0 + t(d) * (a1 - a0);
    const P = (along, across) => (vertical ? { x: across, y: along } : { x: along, y: across });

    BANDS.forEach(([from, to, label], i) => {
      const s = pos(from) + (i ? 3 : 0), e = pos(to) - 3;
      const r = vertical ? { x: axis - 4, y: s, width: 8, height: e - s } : { x: s, y: axis - 4, width: e - s, height: 8 };
      el("rect", Object.assign({ class: "scale__band" }, r), svg);
      const m = (s + e) / 2;
      if (vertical) txt("text", { class: "scale__bandlabel", x: 14, y: m, transform: `rotate(-90 14 ${m})`, "text-anchor": "middle" }, label, svg);
      else txt("text", { class: "scale__bandlabel", x: m, y: 244, "text-anchor": "middle" }, label, svg);
    });
    const p0 = P(a0, axis), p1 = P(a1, axis);
    el("line", { class: "scale__axis", x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y }, svg);
    const prog = el("line", { class: "scale__progress", x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y }, svg);
    TICKS.forEach(([d, label]) => {
      const a = pos(d), q0 = P(a, axis - 8), q1 = P(a, axis + 8);
      el("line", { class: "scale__tick", x1: q0.x, y1: q0.y, x2: q1.x, y2: q1.y }, svg);
      if (vertical) txt("text", { class: "scale__ticklabel", x: axis - 14, y: a + 4, "text-anchor": "end" }, label, svg);
      else txt("text", { class: "scale__ticklabel", x: a, y: 220, "text-anchor": "middle" }, label, svg);
    });
    /* Haus als Ausgangspunkt vor dem Massstab */
    const home = vertical ? { x: axis - 9, y: 6 } : { x: 44, y: axis - 30 };
    const homeG = el("g", { transform: `translate(${home.x} ${home.y + 6}) scale(${vertical ? 0.23 : 0.34})` }, svg);
    el("use", { href: "#mark", width: 96, height: 82, class: "scale__home" }, homeG);
    if (vertical) txt("text", { class: "scale__homelabel", x: axis + 18, y: 22 }, "Haus", svg);
    else {
      txt("text", { class: "scale__homelabel", x: 59, y: 220, "text-anchor": "middle" }, "Haus", svg);
      el("line", { class: "scale__tick", x1: 82, y1: axis, x2: a0 - 6, y2: axis, "stroke-dasharray": "2 4" }, svg);
    }
    const pins = SPOTS.map((s) => {
      const a = pos(s.d);
      const off = vertical ? 46 + s.lvl * 54 : 58 + s.lvl * 42;
      const g = el("g", { class: "scale__pin", "data-pin": s.n, tabindex: "-1" }, svg);
      const c = vertical ? { x: axis + off, y: a } : { x: a, y: axis - off };
      const st = P(a, axis);
      el("line", { x1: st.x, y1: st.y, x2: c.x, y2: c.y }, g);
      const body = el("g", { class: "pinbody" }, g);
      el("circle", { cx: c.x, cy: c.y, r: 12 }, body);
      txt("text", { class: "n", x: c.x, y: c.y + 0.5 }, String(s.n), body);
      txt("title", {}, `${s.n} ${s.name}, ${fmtDist(s.d)}`, g);
      return { g, a };
    });
    return { svg, prog, pins, a0, a1, vertical };
  }

  const scaleBox = $("#scale");
  const scales = [];
  function bindPins() {
    $$(".scale__pin").forEach((p) => {
      p.addEventListener("mouseenter", () => focusPin(p.dataset.pin));
      p.addEventListener("mouseleave", () => focusPin(null));
      p.addEventListener("click", () => { const s = $(`.spot[data-pin="${p.dataset.pin}"]`); if (s) scrollToEl(s, -window.innerHeight * 0.25); });
    });
  }
  /* Fokus: Liste und Massstab heben denselben Ort hervor */
  function focusPin(n) {
    $$(".scale__pin").forEach((p) => p.classList.toggle("is-on", p.dataset.pin === String(n)));
    $$(".spot").forEach((p) => p.classList.toggle("is-on", p.dataset.pin === String(n)));
    if (scaleBox) scaleBox.classList.toggle("has-focus", n != null);
  }
  $$(".spot").forEach((s) => {
    s.addEventListener("mouseenter", () => focusPin(s.dataset.pin));
    s.addEventListener("focus", () => focusPin(s.dataset.pin));
    s.addEventListener("mouseleave", () => focusPin(null));
    s.addEventListener("blur", () => focusPin(null));
  });

  /* ---------- Text splitting ---------- */
  $$('[data-reveal="words"]').forEach((node) => {
    const nodes = Array.from(node.childNodes);
    node.innerHTML = "";
    /* Text in Woerter teilen; einfache Auszeichnungen wie <em> bleiben erhalten */
    const split = (text, parent) => text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { parent.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span"); w.className = "w";
      const i = document.createElement("span"); i.textContent = part; w.appendChild(i); parent.appendChild(w);
    });
    nodes.forEach((n) => {
      if (n.nodeType === 3) split(n.textContent, node);
      else if (n.nodeType === 1 && n.children.length === 0) { const c = n.cloneNode(false); split(n.textContent, c); node.appendChild(c); }
      else node.appendChild(n);
    });
    const spans = $$(".w > span", node);
    spans.forEach((s, i) => { s.style.transitionDelay = `${i * 0.06}s`; });
  });
  function markDone(node) {
    const n = $$(".w", node).length;
    setTimeout(() => $$(".w", node).forEach((w) => w.classList.add("is-done")), 1150 + n * 60 + 200);
  }
  function reveal(node) {
    if (node.classList.contains("is-in")) return;
    node.classList.add("is-in");
    if (node.dataset.reveal === "words") markDone(node);
  }

  /* ---------- Reveal: nur was beim Laden nicht sichtbar ist, startet versteckt ---------- */
  const hero = $("#hero");
  const loader = $("#loader");
  const revealAll = $$("[data-reveal], .media-reveal");
  if (animate) {
    const vh = window.innerHeight;
    revealAll.forEach((n) => {
      if (hero.contains(n) || n.getBoundingClientRect().top > vh * 0.92) n.classList.add("pre");
      else reveal(n);
    });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -10% 0px" });
    revealAll.filter((n) => !hero.contains(n) && n.classList.contains("pre")).forEach((n) => io.observe(n));
  }

  /* ---------- Preloader ---------- */
  let loaderDone = false;
  function revealHero() {
    $$("[data-reveal]", hero).forEach((n, i) => setTimeout(() => reveal(n), i === 0 ? 100 : 600 + i * 180));
  }
  function finishLoader() {
    if (loaderDone || !loader) return;
    loaderDone = true;
    loader.classList.add("is-done");
    if (animate) {
      gsap.to(loader, { yPercent: -100, duration: 1.1, ease: "power4.inOut", delay: 0.15, onComplete: () => loader.remove() });
      setTimeout(revealHero, 700);
    } else { loader.remove(); revealHero(); }
    if (lenis) lenis.start();
  }
  let seen = false;
  try { seen = sessionStorage.getItem("as-loader") === "1"; sessionStorage.setItem("as-loader", "1"); } catch (err) { /* ohne Speicher immer zeigen */ }
  if (loader) {
    if (!animate || seen) finishLoader();
    else {
      if (lenis) lenis.stop();
      const fill = $("#loaderFill"); const cnt = $("#loaderCount");
      const st = { v: 0 };
      gsap.to(st, { v: 100, duration: 0.9, ease: "power2.inOut", onUpdate() {
        const p = Math.round(st.v); cnt.textContent = p; fill.style.clipPath = `inset(${100 - p}% 0 0 0)`;
      }, onComplete: finishLoader });
      setTimeout(finishLoader, 2500);
    }
  }

  /* ---------- Header ---------- */
  const header = $("#header");
  function onScroll(y) {
    header.classList.toggle("is-scrolled", y > 40);
  }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll)); else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  if (hasGsap) {
    $$(".footer").forEach((sec) => {
      ScrollTrigger.create({ trigger: sec, start: () => `top ${headerH() * 0.6}px`, end: () => `bottom ${headerH() * 0.6}px`, onToggle: (self) => header.classList.toggle("is-light", self.isActive) });
    });
    $$("main section[id]").forEach((sec) => {
      ScrollTrigger.create({ trigger: sec, start: "top 45%", end: "bottom 45%", onToggle(self) {
        const a = $(`.nav a[data-nav="${sec.id}"]`); if (a) a.classList.toggle("is-active", self.isActive);
      } });
    });
  }

  /* ---------- Anker und Menue ---------- */
  const burger = $("#burger");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1); if (!id) return;
      const target = document.getElementById(id); if (!target) return;
      e.preventDefault();
      setMenu(false);
      scrollToEl(target, id === "top" ? headerH() + 10 : 0);
    });
  });
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));

  /* ---------- Hero ---------- */
  const heroFrame = $("#heroFrame"); const heroImg = $("#heroImg");
  if (animate && heroFrame) {
    const gutter = () => getComputedStyle(document.documentElement).getPropertyValue("--gutter");
    const mm = gsap.matchMedia();
    mm.add("(min-width: 821px)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: "#heroMedia", start: "top 72%", end: "bottom 60%", scrub: 1.1 } });
      tl.fromTo(heroFrame, { left: `calc(${gutter()} + 8.333%)`, right: `calc(${gutter()} + 8.333%)` }, { left: 0, right: 0, ease: "none", duration: 0.6 }, 0)
        .fromTo(heroImg, { scale: 1.12 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .fromTo(".hero__caption", { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0.4);
    });
    gsap.to(".hero__top", { yPercent: -12, opacity: 0.4, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: true } });
  }

  /* ---------- Parallax und Collage ---------- */
  if (animate) {
    $$("[data-parallax]").forEach((img) => {
      const amt = parseFloat(img.dataset.parallax || 10);
      gsap.set(img, { scale: 1 + amt / 60 });
      gsap.fromTo(img, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    const dmm = gsap.matchMedia();
    dmm.add("(min-width: 821px)", () => {
      $$("#drift [data-speed]").forEach((n) => {
        const sp = parseFloat(n.dataset.speed);
        gsap.fromTo(n, { y: (sp - 1) * 160 }, { y: (1 - sp) * 160, ease: "none", scrollTrigger: { trigger: "#drift", start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    dmm.add("(max-width: 820px)", () => {
      const stage = $("#driftStage"); const drift = $("#drift"); if (!stage) return;
      const dist = () => Math.max(0, stage.scrollWidth - drift.clientWidth + parseFloat(getComputedStyle(drift).paddingLeft) * 2);
      gsap.fromTo(stage, { x: 0 }, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: drift, start: "top 85%", end: "bottom 15%", scrub: 0.7, invalidateOnRefresh: true } });
    });
  }

  /* ---------- Zaehler ---------- */
  $$("[data-count]").forEach((n) => {
    const target = parseFloat(n.dataset.count); const dec = parseInt(n.dataset.decimals || "0", 10);
    n.textContent = fmtNum(target, dec);
    if (!animate) return;
    const box = n.closest("[data-reveal]") || n;
    if (!box.classList.contains("pre")) return;
    const st = { v: 0 };
    n.textContent = fmtNum(0, dec);
    ScrollTrigger.create({ trigger: n, start: "top 88%", once: true, onEnter() {
      gsap.to(st, { v: target, duration: 1.8, ease: "power3.out", onUpdate() { n.textContent = fmtNum(st.v, dec); }, onComplete() { n.textContent = fmtNum(target, dec); } });
    } });
  });

  /* ---------- Distanzleiste: erst einhaengen, wenn sie sichtbar sein kann, dann beim Scrollen zeichnen ---------- */
  function mountScale() {
    if (!scaleBox || scales.length) return;
    const d = buildScale(false);
    $("#scaleDesktop").appendChild(d.svg); scales.push(d); bindPins();
    if (!animate) return;
    const draw = (p) => scales.forEach((s) => {
      const end = s.a0 + p * (s.a1 - s.a0);
      if (s.vertical) s.prog.setAttribute("y2", end); else s.prog.setAttribute("x2", end);
      s.pins.forEach((pin) => { pin.g.style.opacity = pin.a <= end + 1 ? 1 : 0.18; });
    });
    if (scaleBox.classList.contains("pre")) {
      draw(0);
      const st = { p: 0 };
      gsap.to(st, { p: 1, ease: "none", onUpdate: () => draw(st.p), scrollTrigger: { trigger: scaleBox, start: "top 80%", end: "bottom 35%", scrub: 0.6 } });
    }
  }
  const wide = window.matchMedia("(min-width: 821px)");
  if (wide.matches) mountScale(); else wide.addEventListener("change", (ev) => { if (ev.matches) { mountScale(); if (hasGsap) ScrollTrigger.refresh(); } });

  /* ---------- Ausstattung: Bild folgt der Liste ---------- */
  const specImgs = $$("#specMedia img"); const specCap = $("#specCaption");
  function setSpec(i, cap) {
    specImgs.forEach((img) => img.classList.toggle("is-on", img.dataset.spec === String(i)));
    $$(".spec-item").forEach((it) => it.classList.toggle("is-on", it.dataset.spec === String(i)));
    if (cap) specCap.textContent = cap;
  }
  $$(".spec-item").forEach((it) => it.addEventListener("mouseenter", () => setSpec(it.dataset.spec, it.dataset.caption)));
  if (hasGsap) $$(".spec-item").forEach((it) => ScrollTrigger.create({ trigger: it, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setSpec(it.dataset.spec, it.dataset.caption) }));

  /* ---------- Hausfinder ---------- */
  /* Flaechen laut Vorentwurf EUROPROJECT ZT GmbH vom 09.09.2026 (Haus 1 = Bauplatz I, Haus 2 = Bauplatz II).
     UG Haus 1: Zimmer 4 laut Plan 16,87 m², damit 97,73 m² wie bei Haus 2 (die Flaechenaufstellung nennt 29,48 m², bitte klaeren).
     Preis und Status vor Livegang mit dem Vertrieb bestaetigen; Grundrisse eintragen, sobald die Verkaufsplaene vorliegen. */
  const CONTACT = { name: "Marcus Weiss", mail: "office@unio.at" }; /* Zwischenloesung, bis die E-Mail von Marcus Weiss feststeht */
  const LEVELS = { eg: { label: "Erdgeschoss", area: 89.47, note: "Straßenseite, Terrasse 36,40 m²" }, ug: { label: "Gartengeschoss", area: 97.73, note: "Hangseite, Terrassen 26,00 und 30,00 m²" } };
  const EG = [["Wohnen", 31.35], ["Küche, Essen", 25.90], ["Eingang", 16.95], ["Büro", 10.36], ["Garderobe", 3.41], ["WC", 1.50]];
  const UNITS = [
    { id: 1, name: "Haus 1", lot: 950, rooms: 6, baths: "1 Bad, 1 Duschbad, 2 WCs", price: null, status: "In Planung",
      rooms_: { eg: EG, ug: [["Zimmer 4", 16.87], ["Gang", 16.47], ["Zimmer 2", 12.26], ["Zimmer 3", 12.26], ["Zimmer 1", 11.86], ["Bad, WC", 8.50], ["Keller", 7.96], ["Technik", 6.39], ["Dusche, WC", 3.11], ["WC", 2.05]] },
      plans: { eg: null, ug: null } },
    { id: 2, name: "Haus 2", lot: 930, rooms: 5, baths: "3 Duschbäder, 1 WC", price: null, status: "In Planung",
      rooms_: { eg: EG, ug: [["Zimmer 1", 15.65], ["Zimmer 3", 15.65], ["Gang", 15.64], ["Zimmer 2", 15.31], ["Keller", 10.87], ["Keller", 7.96], ["Technik", 7.32], ["Dusche, WC 1", 3.11], ["Dusche, WC 2", 3.11], ["Dusche, WC 3", 3.11]] },
      plans: { eg: null, ug: null } }
  ];
  const TERR = { eg: 36.40, ug: 26.00, ugc: 30.00 };
  const AREA = LEVELS.eg.area + LEVELS.ug.area;
  const m2 = (v) => `${fmtNum(v, 2)}<span class="m2">m²</span>`;
  const terrTotal = TERR.eg + TERR.ug + TERR.ugc;
  /* Tops starten eingeklappt, erst der Klick oeffnet das Detail */
  const finder = { open: null, level: { 1: "eg", 2: "eg" } };
  const mailFor = (u) => `mailto:${CONTACT.mail}?subject=${encodeURIComponent(`Anfrage ${u.name}, Am Steinbach, Berggasse 17-19, Mauerbach`)}`;
  const priceTxt = (u) => (u.price ? `${fmtNum(u.price)} €` : "Auf Anfrage");
  /* Grundriss als Bild, sobald vorhanden (assets/plaene/haus-<n>-<ebene>.jpg plus Varianten aus tools/images.py) */
  function planHtml(u, lv) {
    const src = u.plans[finder.level[u.id]];
    if (!src) return `<div class="detail__plan detail__plan--empty"><div class="detail__empty"><svg viewBox="0 6 96 82" aria-hidden="true"><use href="#mark"/></svg><b>Grundriss ${lv.label} folgt</b><span>Die Verkaufspläne werden gerade ausgearbeitet. Aktueller Stand: Vorentwurf vom 09.09.2026. Gerne senden wir Ihnen die Pläne auf Anfrage.</span></div></div>`;
    const stem = src.split("/").pop().replace(".jpg", "");
    return `<button type="button" class="detail__plan" data-zoom="${u.id}" aria-label="Grundriss ${lv.label} von ${u.name} vergrößern"><picture><source type="image/webp" srcset="assets/plaene/r/${stem}-800.webp 800w, assets/plaene/r/${stem}-1400.webp 1400w" sizes="(max-width: 1100px) 92vw, 58vw"><img src="assets/plaene/r/${stem}-800.jpg" alt="Grundriss ${lv.label}, ${u.name}" loading="lazy" decoding="async"></picture><span class="detail__zoom">Vergrößern</span></button>`;
  }
  function detailHtml(u) {
    const l = finder.level[u.id]; const lv = LEVELS[l];
    return `<tr class="detail" id="detail-${u.id}"><td colspan="8"><div class="detail__inner">
      <div class="detail__plans">
        <div class="detail__tabs">
          <div class="seg" role="tablist" aria-label="Ebene von ${u.name}">${Object.keys(LEVELS).map((k) => `<button type="button" role="tab" aria-selected="${k === l}" class="${k === l ? "is-on" : ""}" data-level="${k}" data-unit="${u.id}">${k === "eg" ? "EG" : "UG"}</button>`).join("")}</div>
          <span class="detail__cap">${lv.label}, ${lv.note}</span>
        </div>
        ${planHtml(u, lv)}
      </div>
      <div class="detail__facts">
        <div class="detail__price"><span class="label">Kaufpreis</span><span class="detail__pricev">${priceTxt(u)}</span></div>
        <table class="areas">
          <caption>${lv.label}<span>${fmtNum(lv.area, 2)} m²</span></caption>
          <tbody>
            ${u.rooms_[l].map(([k, v]) => `<tr><th scope="row">${k}</th><td>${fmtNum(v, 2)} m²</td></tr>`).join("")}
            <tr class="sum"><th scope="row">${lv.label} gesamt</th><td>${fmtNum(lv.area, 2)} m²</td></tr>
            <tr class="group"><th scope="row" colspan="2">Außen, ${u.name}</th></tr>
            ${l === "eg" ? `<tr><th scope="row">Terrasse Erdgeschoss</th><td>${fmtNum(TERR.eg, 2)} m²</td></tr>` : `<tr><th scope="row">Terrasse Gartengeschoss</th><td>${fmtNum(TERR.ug, 2)} m²</td></tr>
            <tr><th scope="row">Terrasse, überdacht</th><td>${fmtNum(TERR.ugc, 2)} m²</td></tr>`}
            <tr><th scope="row">Bauplatz</th><td>${fmtNum(u.lot)} m²</td></tr>
          </tbody>
        </table>
        <p class="detail__total">Nutzfläche gesamt ${fmtNum(AREA, 2)} m² auf zwei Ebenen, ${u.rooms} Zimmer, ${u.baths}</p>
        <div class="detail__actions">
          <a class="btn" href="${mailFor(u)}">${u.name} anfragen <svg class="arr"><use href="#arrow"/></svg></a>
        </div>
        <p class="detail__note">Ihre Anfrage geht direkt an ${CONTACT.name}, Vertrieb powered by UNIO. Sie erhalten Pläne, Preis und Zeitplan persönlich.</p>
      </div>
    </div></td></tr>`;
  }
  /* Die Zeilen stehen auch statisch im HTML (gleiches Markup), das Skript ergaenzt das aufgeklappte Detail */
  function renderUnits(refresh = true, focusSel = null) {
    const body = $("#unitsBody"); if (!body) return;
    body.innerHTML = UNITS.map((u) => {
      const open = finder.open === u.id;
      return `<tr class="unit${open ? " is-open" : ""}" data-unit="${u.id}">
          <td class="top">${u.name}</td><td>${u.rooms}</td><td>${m2(AREA)}</td><td>${fmtNum(u.lot)}<span class="m2">m²</span></td><td>${m2(terrTotal)}</td>
          <td class="cost">${priceTxt(u)}</td><td><span class="status">${u.status}</span></td>
          <td class="chev"><button type="button" class="chev__btn" aria-expanded="${open}" aria-controls="detail-${u.id}" aria-label="Details zu ${u.name}"><svg aria-hidden="true"><use href="#plus"/></svg></button></td>
        </tr>` + (open ? detailHtml(u) : "");
    }).join("");
    if (focusSel) { const f = $(focusSel, body); if (f) f.focus(); }
    if (refresh && hasGsap) setTimeout(() => ScrollTrigger.refresh(), 300);
  }
  const unitsBody = $("#unitsBody");
  if (unitsBody) {
    renderUnits(false);
    const toggle = (id) => { finder.open = finder.open === id ? null : id; renderUnits(true, `tr.unit[data-unit="${id}"] .chev__btn`); };
    unitsBody.addEventListener("click", (e) => {
      const lb = e.target.closest("[data-level]"); if (lb) { finder.level[lb.dataset.unit] = lb.dataset.level; renderUnits(true, `[data-level="${lb.dataset.level}"][data-unit="${lb.dataset.unit}"]`); return; }
      const zb = e.target.closest("[data-zoom]"); if (zb) { const u = UNITS.find((x) => x.id === +zb.dataset.zoom); openPlan(u.plans[finder.level[u.id]], `${u.name}, ${LEVELS[finder.level[u.id]].label}`); return; }
      const row = e.target.closest("tr.unit"); if (row) toggle(+row.dataset.unit);
    });
  }

  /* Plan im Vollbild */
  const planbox = $("#planbox"); const planboxImg = $("#planboxImg");
  if (!planbox) return;
  let planOpener = null;
  function openPlan(src, title) {
    planOpener = document.activeElement;
    planboxImg.src = src; planboxImg.alt = "Grundriss " + title;
    $("#planboxTitle").textContent = "Grundriss " + title;
    planbox.hidden = false; planbox.classList.remove("is-zoom");
    requestAnimationFrame(() => planbox.classList.add("is-open"));
    if (lenis) lenis.stop();
    $(".planbox__close").focus();
  }
  function closePlan() {
    planbox.classList.remove("is-open");
    setTimeout(() => { planbox.hidden = true; }, 250);
    if (lenis) lenis.start();
    if (planOpener && planOpener.focus) planOpener.focus();
  }
  $$("[data-planbox-close]").forEach((b) => b.addEventListener("click", closePlan));
  planboxImg.addEventListener("click", () => planbox.classList.toggle("is-zoom"));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!planbox.hidden) closePlan();
    if (document.body.classList.contains("menu-open")) setMenu(false);
  });

  if (hasGsap) window.addEventListener("load", () => ScrollTrigger.refresh());
})();
