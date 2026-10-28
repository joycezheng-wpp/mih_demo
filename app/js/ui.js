/* Shared UI components — every module builds from these so the look stays consistent. */
(function () {
  const M = window.MIH;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tables = {};

  M.ui = {
    esc,
    pageHead({ eyebrow, title, sub }) {
      return `<div class="page-head"><div>
          <div class="eyebrow">${esc(eyebrow)}</div>
          <h1 class="page-title">${esc(title)}</h1>
          ${sub ? `<p class="page-sub">${sub}</p>` : ''}
        </div>
        <div class="refresh-note">Data last refreshed<br><b>${M.APP.lastRefreshed}</b></div></div>`;
    },

    sectionHead(title, link) {
      return `<div class="section-head"><h2>${esc(title)}</h2><div class="rule"></div>${link ? `<a href="${link.href}">${esc(link.label)} →</a>` : ''}</div>`;
    },

    kpi({ label, sub, value, delta, deltaLabel, span = 2, accent }) {
      let d = '';
      if (delta != null && !isNaN(delta)) {
        const cls = Math.abs(delta) < 0.0005 ? 'flat' : delta > 0 ? 'up' : 'down';
        const arrow = cls === 'up' ? '▲' : cls === 'down' ? '▼' : '■';
        d = `<div class="kpi-delta ${cls}">${arrow} ${deltaLabel}</div>`;
      }
      return `<div class="card kpi span-${span} ${accent ? 'accent-' + accent : ''}">
        <div class="kpi-label">${esc(label)}</div><div class="kpi-sub">${sub || ''}</div>
        <div class="kpi-value">${value}</div>${d}</div>`;
    },

    /* A chart card. `table` is a function returning {cols, rows} for the table view. */
    card({ id, title, sub, span = 6, height = '', legend, insight, body, table }) {
      if (table) tables[id] = table;
      const legendHtml = legend ? `<div class="legend">${legend.map(l =>
        `<span><i class="${l.line ? 'line' : ''}" style="background:${l.color}"></i>${esc(l.name)}</span>`).join('')}</div>` : '';
      return `<div class="card span-${span}">
        <div class="card-head"><div><h3 class="card-title">${esc(title)}</h3>${sub ? `<p class="card-sub">${sub}</p>` : ''}</div>
          ${table ? `<div class="card-tools"><button class="icon-btn" data-table-toggle="${id}" aria-pressed="false" title="Show the data as a table">Table</button></div>` : ''}
        </div>
        ${legendHtml}
        ${body != null ? body : `<div class="chart ${height}" id="${id}" role="img" aria-label="${esc(title)}"></div>`}
        ${table ? `<div class="tbl-wrap" id="${id}-tbl" hidden></div>` : ''}
        ${insight ? `<div class="insight"><b class="tag">So what?</b><span>${insight}</span></div>` : ''}
      </div>`;
    },

    table({ cols, rows, totalRow }) {
      const th = cols.map(c => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('');
      const tr = (r, cls = '') => `<tr class="${cls}">${cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key] ?? '–')}</td>`).join('')}</tr>`;
      return `<table class="tbl"><thead><tr>${th}</tr></thead><tbody>${rows.map(r => tr(r)).join('')}${totalRow ? tr(totalRow, 'total') : ''}</tbody></table>`;
    },

    status(v) {
      if (v == null) return '<span class="status na">–</span>';
      const t = M.ADHERENCE_TARGET;
      const [cls, icon, word] = v >= t ? ['good', '✓', 'On target'] : v >= t - 0.1 ? ['warn', '!', 'Close'] : ['bad', '✕', 'Below target'];
      return `<span class="status ${cls}" title="${word}"><span aria-hidden="true">${icon}</span>${Math.round(v * 100)}%</span>`;
    },
    statusKey() {
      return `<div class="status-key">
        <span><span class="status bad">✕</span> Below 70%</span>
        <span><span class="status warn">!</span> 70–79% · close</span>
        <span><span class="status good">✓</span> 80%+ · on target</span></div>`;
    },

    /* Filter bar: defs = [{key,label,options:[{value,label}]}] */
    filterBar(defs, state, context, extra = '') {
      return `<div class="filter-bar" role="group" aria-label="Filters">
        ${defs.map(d => d.html ? d.html : `<div class="filter"><label for="f-${d.key}">${esc(d.label)}</label>
          <select id="f-${d.key}" data-filter="${d.key}">${d.options.map(o =>
            `<option value="${o.value}" ${String(state[d.key]) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>`).join('')}
        <button class="reset-link" data-filter-reset>Reset</button>
        ${context ? `<div class="filter-context">${context}</div>` : ''}
      </div>${extra}`;
    },

    /* Page-level picker (not a global filter), e.g. KPI or metric selector */
    localSelect(key, label, options, value) {
      return `<div class="filter"><label for="l-${key}">${esc(label)}</label><select id="l-${key}" data-local="${key}">${options.map(o => {
        const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o;
        return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
      }).join('')}</select></div>`;
    },
    /* Pill toggle: options [{value,label}] */
    toggle(key, options, value, cls = '') {
      return `<div class="subtabs ${cls}" role="group">${options.map(o =>
        `<button type="button" class="${String(o.value) === String(value) ? 'active' : ''}" data-local-key="${key}" data-local-value="${esc(o.value)}" aria-pressed="${String(o.value) === String(value)}">${esc(o.label)}</button>`).join('')}</div>`;
    },
    subnav(mod, tabs, active) {
      return `<nav class="subtabs" aria-label="Sections">${tabs.map(t => `<a href="#/${mod}/${t.key}" class="${t.key === active ? 'active' : ''}">${esc(t.label)}</a>`).join('')}</nav>`;
    },
    /* Sequential shading (one hue, light -> dark) for matrix cells */
    heat(v, lo, hi, fmt = (x) => M.fmt.pct(x)) {
      if (v == null || isNaN(v)) return '<span class="heat na">–</span>';
      const t = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
      const a = 0.06 + t * 0.74;
      return `<span class="heat" style="background:rgba(84,101,255,${a.toFixed(2)});color:${a > 0.5 ? '#fff' : 'var(--ink)'}">${fmt(v)}</span>`;
    },
    note(html) { return `<div class="note">${html}</div>`; },
    downloadCsv(filename, cols, rows) {
      const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [cols.map(c => cell(c.label)).join(',')].concat(rows.map(r => cols.map(c => cell(c.raw ? c.raw(r[c.key], r) : r[c.key])).join(','))).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    },

    // standard option lists
    opts: {
      years(from = 2025) { return [...new Set(M.MONTHS.map(m => m.y))].filter(y => y >= from).map(y => ({ value: y, label: String(y) })); },
      months(year) { return [{ value: 'all', label: 'All (YTD)' }].concat(M.q.monthsOfYear(year).map(m => ({ value: m.m, label: m.label }))); },
      markets() { return [{ value: 'all', label: 'All markets' }].concat(M.MARKETS.map(m => ({ value: m.code, label: m.name }))); }
    },

    marketName(code) { return code === 'all' ? 'All markets' : (M.MARKETS.find(m => m.code === code) || {}).name; },
    periodLabel(f) {
      if (f.month !== 'all') return `${M.MONTH_NAMES[f.month - 1]} ${f.year}`;
      const ms = M.q.monthsOfYear(f.year);
      return `${ms[0].label}–${ms[ms.length - 1].label} ${f.year}`;
    }
  };

  // Table toggle (delegated)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-table-toggle]');
    if (!b) return;
    const id = b.dataset.tableToggle;
    const chart = document.getElementById(id), tbl = document.getElementById(id + '-tbl');
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    if (on) { tbl.innerHTML = M.ui.table(tables[id]()); }
    tbl.hidden = !on;
    if (chart) chart.style.display = on ? 'none' : '';
    if (!on) M.charts.resizeAll();
  });
})();
