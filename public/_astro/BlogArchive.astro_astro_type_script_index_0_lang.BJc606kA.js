const E = new WeakMap;

function v(a) {
  E.get(a)?.abort();
  const d = new AbortController;
  E.set(a, d);
  const { signal: u } = d,
        m = Array.from(a.querySelectorAll("[data-blog-filter]")),
        s = a.querySelector("[data-blog-sort]"),
        g = a.querySelector("[data-blog-archive-posts]"),
        r = Array.from(a.querySelectorAll("[data-blog-post]")).map((t, e) => ({ item: t, index: e })),
        f = a.querySelector("[data-filter-empty]"),
        i = t => {
          m.forEach(e => {
            if (e !== t) {
              e.setAttribute("aria-expanded", "false");
              e.closest(".archive-filter-control")?.querySelector(".archive-filter-menu")?.setAttribute("hidden", "");
            }
          });
        },
        y = () => {
          const t = {
            category: a.querySelector('[data-blog-filter="category"]')?.dataset.filterValue ?? "",
            year: a.querySelector('[data-blog-filter="year"]')?.dataset.filterValue ?? ""
          };
          const e = s?.dataset.blogSort === "asc" ? "asc" : "desc";
          const l = [...r].sort((o, c) => {
            const h = Number(o.item.dataset.date ?? 0);
            const A = Number(c.item.dataset.date ?? 0);
            return (e === "asc" ? h - A : A - h) || o.index - c.index;
          });
          let n = 0;
          l.forEach(({ item: o }) => {
            const c = (!t.category || o.dataset.category === t.category) && (!t.year || o.dataset.year === t.year);
            o.hidden = !c;
            if (c) n += 1;
            g?.insertBefore(o, f);
          });
          if (f) f.hidden = n > 0;
        },
        b = () => {
          const t = new URLSearchParams(window.location.search);
          t.delete("month");
          for (const n of ["category", "year"]) {
            const o = a.querySelector(`[data-blog-filter="${n}"]`)?.dataset.filterValue ?? "";
            o ? t.set(n, o) : t.delete(n);
          }
          const e = t.toString();
          const l = `${window.location.pathname}${e ? `?${e}` : ""}${window.location.hash}`;
          window.history.replaceState(null, "", l);
        },
        S = (t, e) => {
          const l = t.closest(".archive-filter-control");
          const n = t.querySelector("[data-filter-label]");
          const o = Array.from(l?.querySelectorAll("[data-filter-option]") ?? []);
          t.dataset.filterValue = e.dataset.filterOption ?? "";
          if (n) n.textContent = e.dataset.optionLabel ?? e.textContent?.trim() ?? "";
          o.forEach(c => c.setAttribute("aria-selected", String(c === e)));
        };

  const C = new URLSearchParams(window.location.search);
  m.forEach(t => {
    const e = t.dataset.blogFilter;
    const l = e ? C.get(e) ?? "" : "";
    if (!l) return;
    const o = Array.from(t.closest(".archive-filter-control")?.querySelectorAll("[data-filter-option]") ?? []).find(c => c.dataset.filterOption === l);
    if (o) S(t, o);
  });

  m.forEach(t => {
    const e = t.closest(".archive-filter-control");
    const l = e?.querySelector(".archive-filter-menu");
    const n = Array.from(e?.querySelectorAll("[data-filter-option]") ?? []);
    t.addEventListener("click", () => {
      const o = t.getAttribute("aria-expanded") !== "true";
      i(t);
      t.setAttribute("aria-expanded", String(o));
      l?.toggleAttribute("hidden", !o);
    }, { signal: u });

    n.forEach(o => {
      o.addEventListener("click", () => {
        S(t, o);
        i();
        b();
        y();
      }, { signal: u });
    });
  });

  document.addEventListener("click", t => {
    if (!(t.target instanceof Element && a.contains(t.target.closest(".archive-filter-control")))) {
      i();
    }
  }, { signal: u });

  document.addEventListener("keydown", t => {
    if (t.key === "Escape") i();
  }, { signal: u });

  s?.addEventListener("click", () => {
    const t = s.dataset.blogSort === "asc" ? "desc" : "asc";
    const e = s.querySelector("[data-sort-label]");
    const n = Number(s.dataset.sortRotation ?? 180) + 60;
    s.dataset.blogSort = t;
    s.dataset.sortRotation = String(n);
    s.style.setProperty("--sort-triangle-rotation", `${n}deg`);
    if (e) e.textContent = t === "asc" ? s.dataset.sortLabelAsc ?? "" : s.dataset.sortLabelDesc ?? "";
    y();
  }, { signal: u });

  b();
  y();
}

function p(a = document) {
  a.querySelectorAll("[data-blog-archive]").forEach(d => v(d));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => p(), { once: true });
} else {
  p();
}
document.addEventListener("astro:page-load", () => p());

export { p as initBlogArchive };
