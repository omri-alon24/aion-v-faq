(() => {
  const CATEGORIES = {
    charging: "טעינה",
    battery: "סוללה וטווח",
    climate: "מזגן ואקלים",
    app: "האפליקציה",
    software: "עדכוני תוכנה",
    multimedia: "מולטימדיה ואנדרואיד אוטו / קארפליי",
    key: "מפתח, כרטיס וכניסה",
    driving: "נהיגה ומערכות עזר",
    defects: "רעשים ותקלות",
    tires: "צמיגים",
    service: "שירות, אחריות ויבואן",
    insurance: "ביטוח וליסינג",
    accessories: "אביזרים",
    delivery: "קבלת הרכב",
    general: "כללי",
  };
  const FLAGS = { open: "אין עדיין תשובה", disputed: "יש דעות שונות" };

  const $ = (s) => document.querySelector(s);
  const input = $("#q"), list = $("#list"), chips = $("#chips"),
        status = $("#status"), empty = $("#empty");

  let items = [];
  let activeCat = "";

  // ---- Hebrew-aware normalisation ----
  const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  const norm = (s) => (s || "")
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")          // niqqud / cantillation
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[״׳"'`.,:;!?()\[\]{}\/\\\-–—_+]/g, " ");
  const tokens = (s) => norm(s).split(/\s+/).filter(Boolean);
  const PREFIX = /^[והבלמשכ]{1,2}(?=[א-ת]{3,})/;
  const variants = (t) => {
    const v = [t];
    const stripped = t.replace(PREFIX, "");
    if (stripped !== t) v.push(stripped);
    if (stripped.length > 3 && /^ה/.test(stripped)) v.push(stripped.slice(1));
    return v;
  };

  const index = (it) => {
    const f = (arr) => [...new Set(arr.flatMap((w) => variants(w)))];
    it._q = f(tokens(it.question));
    it._k = f(tokens((it.keywords || []).join(" ")));
    it._a = f(tokens(it.answer + " " + (it.steps || []).join(" ")));
  };

  const hit = (words, qv) => words.some((w) => qv.some((q) => w.startsWith(q)));

  const score = (it, qTokens) => {
    let total = 0, matched = 0;
    for (const t of qTokens) {
      const qv = variants(t);
      let s = 0;
      if (hit(it._q, qv)) s += 5;
      if (hit(it._k, qv)) s += 4;
      if (hit(it._a, qv)) s += 1;
      if (s) matched++;
      total += s;
    }
    return { total, matched };
  };

  // ---- Rendering ----
  const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const highlight = (text, qTokens) => {
    let html = esc(text);
    if (!qTokens.length) return html;
    const parts = qTokens.flatMap(variants).filter((t) => t.length > 1)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .map((t) => t.replace(/[כמנפצ]/g, (c) => `[${c}${Object.keys(FINALS).find((k) => FINALS[k] === c)}]`));
    if (!parts.length) return html;
    return html.replace(new RegExp(`(${parts.join("|")})`, "gi"), "<mark>$1</mark>");
  };

  const monthLabel = (ym) => {
    if (!ym) return "";
    const [y, m] = ym.split("-");
    return `${m}/${y}`;
  };

  const renderItem = (it, qTokens) => {
    const d = document.createElement("details");
    d.id = it.id;
    const flag = FLAGS[it.status] ? `<span class="flag">${FLAGS[it.status]}</span>` : "";
    const steps = (it.steps || []).length
      ? `<ol>${it.steps.map((s) => `<li>${highlight(s, qTokens)}</li>`).join("")}</ol>` : "";
    const answer = it.answer
      ? `<p>${highlight(it.answer, qTokens)}</p>`
      : `<p>עדיין אין בקבוצה תשובה מוסכמת. אם מצאתם פתרון – שתפו בקבוצה ונעדכן כאן.</p>`;
    const url = location.origin + location.pathname + "#" + it.id;
    d.innerHTML = `
      <summary>${flag}<span>${highlight(it.question, qTokens)}</span></summary>
      <div class="body">
        ${answer}${steps}
        <div class="meta">
          ${it.last_seen ? `<span>עודכן לאחרונה: ${monthLabel(it.last_seen)}</span>` : ""}
          <button type="button" data-copy="${esc(url)}">העתקת קישור</button>
          <a href="https://wa.me/?text=${encodeURIComponent(it.question + "\n" + url)}" target="_blank" rel="noopener">שליחה בוואטסאפ</a>
        </div>
      </div>`;
    d.addEventListener("toggle", () => {
      if (d.open) history.replaceState(null, "", location.pathname + location.search + "#" + it.id);
    });
    return d;
  };

  const render = () => {
    const qTokens = tokens(input.value);
    let shown = items.filter((it) => !activeCat || it.category === activeCat);

    if (qTokens.length) {
      const scored = shown.map((it) => ({ it, ...score(it, qTokens) }));
      let res = scored.filter((r) => r.matched === qTokens.length);
      if (!res.length) res = scored.filter((r) => r.matched > 0);   // fall back to partial match
      res.sort((a, b) => b.matched - a.matched || b.total - a.total);
      shown = res.map((r) => r.it);
    }

    list.replaceChildren();
    empty.hidden = shown.length > 0;

    if (qTokens.length) {
      status.textContent = shown.length === 1 ? "תוצאה אחת" : shown.length ? `${shown.length} תוצאות` : "";
      const wrap = document.createElement("div");
      wrap.className = "items";
      shown.forEach((it) => wrap.append(renderItem(it, qTokens)));
      if (shown.length) list.append(wrap);
      if (shown.length === 1) wrap.firstChild.open = true;
      return;
    }

    status.textContent = `${shown.length} שאלות ותשובות`;
    for (const cat of Object.keys(CATEGORIES)) {
      const group = shown.filter((it) => it.category === cat);
      if (!group.length) continue;
      const sec = document.createElement("section");
      sec.className = "group";
      sec.innerHTML = `<h2>${CATEGORIES[cat]}</h2>`;
      const wrap = document.createElement("div");
      wrap.className = "items";
      group.forEach((it) => wrap.append(renderItem(it, [])));
      sec.append(wrap);
      list.append(sec);
    }
  };

  const renderChips = () => {
    const counts = {};
    items.forEach((it) => (counts[it.category] = (counts[it.category] || 0) + 1));
    const mk = (cat, label, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", String(activeCat === cat));
      b.innerHTML = `${label}${n != null ? `<small>${n}</small>` : ""}`;
      b.onclick = () => {
        activeCat = activeCat === cat ? "" : cat;
        chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", String(activeCat === cat));
        render();
      };
      return b;
    };
    chips.replaceChildren(mk("", "הכול", items.length));
    Object.entries(CATEGORIES).forEach(([cat, label]) => {
      if (counts[cat]) chips.append(mk(cat, label, counts[cat]));
    });
  };

  // ---- Events ----
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const u = new URL(location.href);
      input.value ? u.searchParams.set("q", input.value) : u.searchParams.delete("q");
      u.hash = "";
      history.replaceState(null, "", u);
      render();
    }, 120);
  });

  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = "הקישור הועתק";
      setTimeout(() => (b.textContent = "העתקת קישור"), 1800);
    } catch { prompt("העתיקו את הקישור:", b.dataset.copy); }
  });

  const openFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      el.scrollIntoView({ block: "start" });
    }
  };

  // ---- Load ----
  fetch("faq.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      items = data.items;
      items.forEach(index);
      if (data.updated) $("#updated").textContent = `עדכון אחרון של המדריך: ${data.updated}`;
      const q = new URLSearchParams(location.search).get("q");
      if (q) input.value = q;
      renderChips();
      render();
      openFromHash();
    })
    .catch(() => {
      status.textContent = "לא הצלחנו לטעון את השאלות. רעננו את הדף ונסו שוב.";
    });
  window.addEventListener("hashchange", openFromHash);
})();
