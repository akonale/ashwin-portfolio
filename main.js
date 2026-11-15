// Generative cover art for every .cover element.
// Usage in HTML:
//   <div class="cover" data-pattern="keys" data-a="#FFB000" data-b="#2A2438" data-label="KEYS"></div>
// Patterns: avatar, scan, waves, bars, nodes, grid, chip, keys
// To use a real photo instead (e.g. from Unsplash), add data-img="https://images.unsplash.com/..."
// and an alt text in data-alt. The scanline overlay still applies.

(function () {
  const S = 200; // viewBox size

  // Small seeded PRNG so each cover is stable between page loads
  function rng(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  const patterns = {
    scan(a, b, r) {
      let s = "";
      for (let y = 0; y < S; y += 10) {
        const w = 40 + r() * 160;
        s += `<rect x="${S - w}" y="${y}" width="${w}" height="5" fill="${a}" opacity="${0.25 + r() * 0.75}"/>`;
      }
      return s;
    },
    waves(a, b, r) {
      let s = "";
      for (let i = 0; i < 7; i++) {
        const y0 = 30 + i * 22, amp = 6 + r() * 14, f = 0.03 + r() * 0.03, ph = r() * 6;
        let d = `M0 ${y0}`;
        for (let x = 0; x <= S; x += 5) d += ` L${x} ${(y0 + Math.sin(x * f + ph) * amp).toFixed(1)}`;
        s += `<path d="${d}" fill="none" stroke="${a}" stroke-width="3" opacity="${1 - i * 0.11}"/>`;
      }
      return s;
    },
    bars(a, b, r) {
      let s = "";
      const n = 12, w = S / n;
      for (let i = 0; i < n; i++) {
        const h = 20 + r() * 130;
        for (let y = S - 14; y > S - 14 - h; y -= 9)
          s += `<rect x="${i * w + 3}" y="${y - 6}" width="${w - 6}" height="6" fill="${a}" opacity="${0.5 + (S - y) / 400}"/>`;
      }
      return s;
    },
    nodes(a, b, r) {
      const pts = Array.from({ length: 9 }, () => [20 + r() * 160, 20 + r() * 130]);
      let s = "";
      pts.forEach((p, i) => {
        const q = pts[(i + 1 + Math.floor(r() * 3)) % pts.length];
        s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${a}" stroke-width="2" opacity=".55"/>`;
      });
      pts.forEach((p, i) => {
        s += `<circle cx="${p[0]}" cy="${p[1]}" r="${i % 3 ? 5 : 9}" fill="${i % 3 ? a : "none"}" stroke="${a}" stroke-width="3"/>`;
      });
      return s;
    },
    grid(a, b, r) {
      let s = "";
      for (let x = 10; x < S; x += 20)
        for (let y = 10; y < S; y += 20)
          if (r() > 0.45) s += `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${a}" opacity="${0.3 + r() * 0.7}"/>`;
      return s;
    },
    chip(a, b, r) {
      let s = `<rect x="55" y="45" width="90" height="90" rx="6" fill="none" stroke="${a}" stroke-width="4"/>`;
      s += `<rect x="75" y="65" width="50" height="50" rx="3" fill="${a}" opacity=".85"/>`;
      for (let i = 0; i < 6; i++) {
        const o = 58 + i * 15;
        s += `<rect x="${o}" y="25" width="5" height="20" fill="${a}"/><rect x="${o}" y="135" width="5" height="20" fill="${a}"/>`;
        s += `<rect x="35" y="${o - 10}" width="20" height="5" fill="${a}"/><rect x="145" y="${o - 10}" width="20" height="5" fill="${a}"/>`;
      }
      return s;
    },
    keys(a, b, r) {
      let s = "";
      const rows = [[0, 10], [6, 10], [10, 9], [16, 8]];
      rows.forEach(([off, n], ri) => {
        for (let i = 0; i < n; i++) {
          const x = 8 + off + i * 19, y = 22 + ri * 30;
          const lit = r() > 0.75;
          s += `<rect x="${x}" y="${y}" width="16" height="16" rx="3" fill="${lit ? a : "none"}" stroke="${a}" stroke-width="2" opacity="${lit ? 1 : 0.6}"/>`;
        }
      });
      s += `<rect x="54" y="142" width="92" height="16" rx="3" fill="none" stroke="${a}" stroke-width="2" opacity=".6"/>`;
      return s;
    },
    avatar(a, b, r) {
      // Pixel-art portrait monitor: amber CRT with initials
      let s = `<defs><linearGradient id="av" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
      s += `<rect width="${S}" height="${S}" fill="url(#av)"/>`;
      for (let x = 0; x < S; x += 10)
        for (let y = 0; y < S; y += 10)
          if (r() > 0.82) s += `<rect x="${x}" y="${y}" width="10" height="10" fill="#15121d" opacity="${0.08 + r() * 0.18}"/>`;
      s += `<rect x="30" y="38" width="140" height="108" rx="10" fill="#15121d"/>`;
      s += `<text x="100" y="112" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="64" fill="${a}">AK</text>`;
      s += `<rect x="126" y="118" width="14" height="6" fill="${a}"/>`;
      s += `<rect x="80" y="146" width="40" height="14" fill="#15121d"/><rect x="60" y="160" width="80" height="8" rx="4" fill="#15121d"/>`;
      return s;
    },
  };

  function render(el) {
    if (el.dataset.img) {
      const img = new Image();
      img.src = el.dataset.img;
      img.alt = el.dataset.alt || "";
      img.loading = "lazy";
      el.prepend(img);
      return;
    }
    const p = el.dataset.pattern || "grid";
    const a = el.dataset.a || "#FFB000";
    const b = el.dataset.b || "#272235";
    const label = el.dataset.label || "";
    const r = rng(p + label + a);
    const art = (patterns[p] || patterns.grid)(a, b, r);
    const bg = p === "avatar" ? "" : `<rect width="${S}" height="${S}" fill="${b}"/>`;
    const text = label && p !== "avatar"
      ? `<text x="14" y="${S - 14}" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="${label.length > 5 ? 26 : 32}" fill="#f3effa" letter-spacing="1">${label}</text>`
      : "";
    el.insertAdjacentHTML("afterbegin",
      `<svg viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg}${art}${text}</svg>`);
  }

  // Wait for the display font so labels inside SVG render in Chakra Petch
  const go = () => document.querySelectorAll(".cover").forEach(render);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(go);

  // Shelf arrows
  document.querySelectorAll(".shelf").forEach((shelf) => {
    const row = shelf.querySelector(".row");
    shelf.querySelectorAll(".arrow").forEach((btn) =>
      btn.addEventListener("click", () =>
        row.scrollBy({ left: Number(btn.dataset.dir) * row.clientWidth * 0.8, behavior: "smooth" })));
  });

  // Highlight the nav item for the section in view
  const links = [...document.querySelectorAll(".nav a")];
  const byId = Object.fromEntries(links.map((l) => [l.getAttribute("href").slice(1), l]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && byId[e.target.id]) {
        links.forEach((l) => l.classList.remove("is-active"));
        byId[e.target.id].classList.add("is-active");
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
