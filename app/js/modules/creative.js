/* Creative Report — blueprint: PBI "Creative Report" (Hub, Adherence, Performance, Insights, Brand vs Creator, Library). Source: Vidmob. */
(function () {
  const M = window.MIH;
  const q = M.q, fmt = M.fmt;
  const T = () => M.ADHERENCE_TARGET;
  const TABS = [
    { key: 'adherence', label: 'Adherence' }, { key: 'performance', label: 'Performance' },
    { key: 'insights', label: 'Insights' }, { key: 'brand-vs-creator', label: 'Brand vs Creator' }, { key: 'library', label: 'Creative Library' }
  ];
  const vid = (k) => (rs) => q.wavg(rs.filter(r => r[k] != null), k, 'impressions');
  const METRICS = {
    vtr50: { label: 'View-through rate 50%', short: 'VTR 50%', calc: vid('vtr50') },
    ctr: { label: 'Click-through rate', short: 'CTR', calc: rs => { const i = q.sum(rs, 'impressions'); return i ? q.sum(rs, 'clicks') / i : null; }, d: 2 },
    vStart: { label: 'Video start %', short: 'Video start', calc: vid('vStart') },
    completion: { label: 'Video completion %', short: 'Completion', calc: vid('completion') }
  };
  const mf = (k) => (v) => fmt.pct(v, METRICS[k].d || 1);
  const metricOpts = Object.entries(METRICS).map(([k, m]) => ({ value: k, label: m.label }));
  const ELEMENTS = { story: { label: 'Story type', values: () => M.STORY_TYPES }, sound: { label: 'Sound type', values: () => M.SOUND_TYPES.filter(s => s !== 'No sound') }, emotion: { label: 'Emotion', values: () => M.EMOTIONS } };
  const brandGrad = (b) => ['linear-gradient(135deg,#5465FF,#93DFE3)', 'linear-gradient(135deg,#7A3FB8,#788BFF)', 'linear-gradient(135deg,#00929F,#B0F467)', 'linear-gradient(135deg,#D4A000,#FCFE67)'][Math.max(0, M.data.persona.brands.indexOf(b)) % 4];

  function head(tab, extraDefs = [], context) {
    const ui = M.ui, f = M.filters('creative'), p = M.data.persona;
    const defs = [
      { key: 'year', label: 'Year', options: ui.opts.years() },
      { key: 'month', label: 'Month', options: ui.opts.months(f.year) },
      { key: 'market', label: 'Market', options: ui.opts.markets() },
      { key: 'platform', label: 'Platform', options: [{ value: 'all', label: 'All platforms' }].concat(M.PLATFORMS.map(x => ({ value: x, label: x }))) },
      { key: 'brand', label: 'Brand', options: [{ value: 'all', label: 'All brands' }].concat(p.brands.map(x => ({ value: x, label: x }))) }
    ].concat(extraDefs);
    return ui.pageHead({ eyebrow: `${p.client} · ${M.APP.region} · Vidmob`, title: 'Creative Report', sub: 'Creative adherence, performance by element, brand vs creator and a searchable library.' })
      + ui.subnav('creative', TABS, tab) + ui.filterBar(defs, f, context || `<b>${fmt.num(rows().length)}</b> creatives · <b>${ui.periodLabel(f)}</b>`);
  }
  const rows = () => q.filter(M.data.creatives, M.filters('creative'));
  const empty = (el) => el.insertAdjacentHTML('beforeend', `<div class="card placeholder"><h3>No creatives in this selection</h3><p>Creative tracking starts July 2025. Widen the filters to see results.</p></div>`);

  function creativeCards(list, metric) {
    const ui = M.ui;
    return `<div class="cgrid">${list.map(c => `<div class="ccard">
      <div class="cthumb" style="background:${brandGrad(c.brand)}"><span class="fmt">${c.format}</span><span class="plat">${c.platform}</span></div>
      <div class="cbody"><b title="${ui.esc(c.name)}">${ui.esc(c.name)}</b><span>${ui.marketName(c.market)} · ${c.daysLive} days live</span><span>${c.story} · ${c.sound} · ${c.emotion}</span>
      <div class="cmetrics">${metric ? `<span>${METRICS[metric].short} <b>${mf(metric)(c[metric])}</b></span>` : ''}<span>Adherence ${ui.status(c.adherence)}</span></div></div></div>`).join('')}</div>`;
  }

  /* ---------- Adherence ---------- */
  function adherenceTab(el) {
    const ui = M.ui, f = M.filters('creative');
    const metric = M.loc('cr-adh-metric', 'vtr50');
    el.innerHTML = head('adherence');
    const rs = rows();
    if (!rs.length) return empty(el);
    const overall = q.adherence(rs);
    const tile = (label, v, accent) => ui.kpi({ label, sub: v == null ? 'No creatives' : `Target 80% (${fmt.pp(v - T(), 0)})`, value: v == null ? '–' : fmt.pct(v, 0), span: 2, accent, delta: v == null ? null : v - T(), deltaLabel: v == null ? '' : v >= T() ? 'On target' : v >= T() - 0.1 ? 'Close to target' : 'Below target' });
    const months = q.monthsOfYear(f.year).filter(mo => rs.some(r => r.ym === mo.ym));
    const trend = months.map(mo => q.adherence(rs.filter(r => r.ym === mo.ym)));
    const met = rs.filter(r => r.adherence >= T()), unmet = rs.filter(r => r.adherence < T());
    const m = METRICS[metric], avg = m.calc(rs);
    const plats = M.PLATFORMS.filter(pl => rs.some(r => r.platform === pl));
    const passRate = (list, g) => { let s = 0, w = 0; list.forEach(c => { if (c.guidelines[g] == null) return; w += c.impressions; if (c.guidelines[g]) s += c.impressions; }); return w ? s / w : null; };
    const matrix = M.GUIDELINES.map(g => ({ g, v: plats.map(pl => passRate(rs.filter(r => r.platform === pl), g)), all: passRate(rs, g) }));
    const weakest = matrix.slice().sort((a, b) => a.all - b.all).slice(0, 2);
    const creativesAt = met.length / rs.length, spendAt = q.sum(met, 'spend') / q.sum(rs, 'spend');

    el.insertAdjacentHTML('beforeend', `<div class="grid">${tile('Adherence score', overall, 'blue')}${M.PLATFORMS.map(pl => tile(pl, q.adherence(rs.filter(r => r.platform === pl)))).join('')}</div>
      <div class="grid" style="margin-top:16px">
        ${ui.card({ id: 'ad-trend', span: 7, height: 'h-300', title: 'Adherence trend', sub: 'Monthly impression-weighted adherence · dashed line = 80% target',
          table: () => ({ cols: [{ key: 'mo', label: 'Month' }, { key: 'v', label: 'Adherence', num: true, fmt: v => fmt.pct(v, 0) }], rows: months.map((mo, i) => ({ mo: mo.long, v: trend[i] })) }),
          insight: `<b>${fmt.pct(creativesAt, 0)}</b> of creatives meet the 80% bar, carrying <b>${fmt.pct(spendAt, 0)}</b> of spend. Weakest guidelines: <b>${weakest[0].g.toLowerCase()}</b> and <b>${weakest[1].g.toLowerCase()}</b>.` })}
        <div class="card span-5"><div class="card-head"><div><h3 class="card-title">Performance by adherence</h3><p class="card-sub">Creatives that meet the 80% target vs those that don't</p></div></div>
          <div style="max-width:240px">${ui.localSelect('cr-adh-metric', 'Metric', metricOpts, metric)}</div>
          <div class="chart h-240" id="ad-perf"></div>
          <div class="insight"><b class="tag">So what?</b><span>Creatives on target deliver <b>${mf(metric)(m.calc(met))}</b> ${m.short} vs <b>${mf(metric)(m.calc(unmet))}</b> for those below — fixing adherence pays back in performance.</span></div></div>
        ${ui.card({ id: 'ad-bp', span: 8, title: 'Creative best practices', sub: 'Impression-weighted pass rate by guideline and platform', body: `<div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Guideline</th>${plats.map(pl => `<th class="num">${pl}</th>`).join('')}<th class="num">All</th></tr></thead>
            <tbody>${matrix.map(r => `<tr><td>${r.g}</td>${r.v.map(v => `<td class="num">${ui.status(v)}</td>`).join('')}<td class="num">${ui.status(r.all)}</td></tr>`).join('')}</tbody></table></div>${ui.statusKey()}` })}
        <div class="card span-4"><div class="eyebrow">About the report</div><h3 class="card-title" style="margin:6px 0 8px">How to act on it</h3>
          <p class="card-sub" style="color:var(--ink-2)">Adherence is the % of applicable mandatory guidelines a creative passes (8 of 10 = 80%), weighted by impressions. Target: 80% across the region.</p>
          <ul class="bullets">
            <li><b>Optimise live investment:</b> shift budget from low-adhering live ads to high-scoring creatives.</li>
            <li><b>Fix creatives:</b> find the guidelines missed and revise before or during flight.</li>
            <li><b>Track workflows:</b> see which brands, markets and platforms follow best practice.</li>
          </ul>
          <a class="btn btn-navy" href="#/creative/library" data-local-key="lib-adh,lib-n" data-local-value="below,30" style="align-self:flex-start;margin-top:8px">View creatives below target →</a></div>
      </div>`);
    M.charts.lines(document.getElementById('ad-trend'), { x: months.map(mo => mo.label), series: [{ name: 'Adherence', color: M.SERIES[0], data: trend }], yMin: 0.4, yMax: 1, axisFmt: v => Math.round(v * 100) + '%', fmt: v => fmt.pct(v, 0),
      markLine: { symbol: 'none', silent: true, lineStyle: { color: M.INK, type: 'dashed' }, label: { formatter: 'Target 80%', color: M.INK, position: 'insideEndTop' }, data: [{ yAxis: T() }] } });
    M.charts.bars(document.getElementById('ad-perf'), { labels: ['Met (80%+)', 'Unmet (<80%)'], values: [m.calc(met), m.calc(unmet)], colors: [M.SERIES[0], M.OTHER], vertical: true, fmt: mf(metric), bench: avg, benchLabel: 'Average', axisFmt: v => (v * 100).toFixed(metric === 'ctr' ? 1 : 0) + '%' });
  }

  /* ---------- Performance ---------- */
  function performanceTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('creative');
    const metric = M.loc('cr-metric', 'vtr50'), by = M.loc('cr-by', 'platform');
    el.innerHTML = head('performance', [{ html: ui.localSelect('cr-metric', 'Metric', metricOpts, metric) }]);
    const rs = rows();
    if (!rs.length) return empty(el);
    const m = METRICS[metric], F = mf(metric);
    const dims = { platform: M.PLATFORMS, brand: d.persona.brands, format: M.FORMATS, market: M.MARKETS.map(x => x.code) };
    const label = (k, v) => (k === 'market' ? ui.marketName(v) : v);
    const breakdown = dims[by].map(v => ({ v, x: m.calc(rs.filter(r => r[by] === v)) })).filter(z => z.x != null).sort((a, b) => b.x - a.x);
    const plats = M.PLATFORMS.filter(pl => rs.some(r => r.platform === pl));
    const mat = plats.map(pl => M.FORMATS.map(fm => { const s = rs.filter(r => r.platform === pl && r.format === fm); return s.length ? m.calc(s) : null; }));
    const flat = mat.flat().filter(v => v != null), lo = Math.min(...flat), hi = Math.max(...flat);
    const eff = plats.map(pl => { const s = rs.filter(r => r.platform === pl); return { pl, ctr: METRICS.ctr.calc(s), vs: METRICS.vStart.calc(s), vtr: METRICS.vtr50.calc(s), cmp: METRICS.completion.calc(s), imp: q.sum(s, 'impressions'), spend: q.sum(s, 'spend'), n: s.length }; });
    const tot = { pl: 'Total', ctr: METRICS.ctr.calc(rs), vs: METRICS.vStart.calc(rs), vtr: METRICS.vtr50.calc(rs), cmp: METRICS.completion.calc(rs), imp: q.sum(rs, 'impressions'), spend: q.sum(rs, 'spend'), n: rs.length };
    const top = rs.filter(r => r[metric] != null && r.impressions >= 10000).sort((a, b) => b[metric] - a[metric]).slice(0, 12);
    const months = q.monthsOfYear(f.year).filter(mo => rs.some(r => r.ym === mo.ym));
    const mix = months.map(mo => { const s = rs.filter(r => r.ym === mo.ym); const t = q.sum(s, 'impressions') || 1; const o = {}; d.persona.brands.forEach(b => { o[b] = q.sum(s.filter(r => r.brand === b), 'impressions') / t; }); return o; });
    const brandColors = d.persona.brands.map((b, i) => M.SERIES[i]);

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.kpi({ label: 'CTR', sub: 'clicks ÷ impressions', value: fmt.pct(tot.ctr, 2), span: 3, accent: metric === 'ctr' ? 'blue' : '' })}
      ${ui.kpi({ label: 'Video start %', sub: 'impression-weighted', value: fmt.pct(tot.vs), span: 3, accent: metric === 'vStart' ? 'blue' : '' })}
      ${ui.kpi({ label: 'View-through rate 50%', sub: 'impression-weighted', value: fmt.pct(tot.vtr), span: 3, accent: metric === 'vtr50' ? 'blue' : '' })}
      ${ui.kpi({ label: 'Video completion %', sub: 'impression-weighted', value: fmt.pct(tot.cmp), span: 3, accent: metric === 'completion' ? 'blue' : '' })}
    </div>
    <div class="grid" style="margin-top:16px">
      <div class="card span-5"><div class="card-head"><div><h3 class="card-title">Performance breakdown</h3><p class="card-sub">${m.label} by ${by}</p></div>
        <div class="card-tools">${ui.toggle('cr-by', [{ value: 'platform', label: 'Platform' }, { value: 'brand', label: 'Brand' }, { value: 'format', label: 'Format' }, { value: 'market', label: 'Market' }], by, 'mini')}</div></div>
        <div class="chart h-300" id="pf-break"></div>
        <div class="insight"><b class="tag">So what?</b><span><b>${ui.esc(label(by, breakdown[0].v))}</b> leads on ${m.short} at ${F(breakdown[0].x)}, vs ${F(breakdown[breakdown.length - 1].x)} for ${ui.esc(label(by, breakdown[breakdown.length - 1].v))}.</span></div></div>
      ${ui.card({ id: 'pf-mat', span: 7, title: 'Performance matrix', sub: `${m.label} · platform × format · darker = higher`, body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Platform</th>${M.FORMATS.map(x => `<th class="num">${x}</th>`).join('')}</tr></thead>
          <tbody>${plats.map((pl, i) => `<tr><td><b>${pl}</b></td>${mat[i].map(v => `<td class="num">${ui.heat(v, lo, hi, F)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <p class="card-sub" style="margin-top:10px">Static formats have no video metrics.</p>` })}
      ${ui.card({ id: 'pf-eff', span: 12, title: 'Media efficiency overview', sub: 'CTR, video start, VTR 50%, completion, impressions and spend by platform', body: ui.table({
        cols: [{ key: 'pl', label: 'Platform' }, { key: 'ctr', label: 'CTR', num: true, fmt: v => fmt.pct(v, 2) }, { key: 'vs', label: 'Video start', num: true, fmt: fmt.pct }, { key: 'vtr', label: 'VTR 50%', num: true, fmt: fmt.pct },
          { key: 'cmp', label: 'Completion', num: true, fmt: fmt.pct }, { key: 'imp', label: 'Impressions', num: true, fmt: fmt.num }, { key: 'spend', label: 'Spend', num: true, fmt: v => fmt.money(v) },
          { key: 'cpm', label: 'CPM', num: true, fmt: (v, r) => '$' + (r.spend / r.imp * 1000).toFixed(2) }, { key: 'n', label: 'Creatives', num: true, fmt: v => v.toLocaleString() }],
        rows: eff, totalRow: tot }).replace('<table', '<div class="tbl-wrap"><table').replace('</table>', '</table></div>') })}
      <div class="card span-12"><div class="card-head"><div><h3 class="card-title">Top creatives</h3><p class="card-sub">Top 12 by ${m.label} — min. 10K impressions</p></div></div>${top.length ? creativeCards(top, metric) : '<p class="card-sub">No creatives with 10K+ impressions.</p>'}</div>
      ${ui.card({ id: 'pf-mix', span: 12, height: 'h-300', title: 'Creative mix over time', sub: 'Monthly share of impressions by brand', legend: d.persona.brands.map((b, i) => ({ name: b, color: brandColors[i] })),
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(d.persona.brands.map(b => ({ key: b, label: b, num: true, fmt: fmt.pct }))), rows: months.map((mo, i) => ({ mo: mo.long, ...mix[i] })) }) })}
    </div>`);
    M.charts.bars(document.getElementById('pf-break'), { labels: breakdown.map(z => label(by, z.v)), values: breakdown.map(z => z.x), fmt: F, bench: m.calc(rs), benchLabel: 'Average', axisFmt: v => (v * 100).toFixed(metric === 'ctr' ? 1 : 0) + '%' });
    M.charts.stack100V(document.getElementById('pf-mix'), { labels: months.map(mo => mo.label), series: d.persona.brands.map((b, i) => ({ name: b, color: brandColors[i], data: mix.map(x => x[b]) })) });
  }

  /* ---------- Insights ---------- */
  function insightsTab(el) {
    const ui = M.ui, d = M.data;
    const metric = M.loc('cr-metric', 'vtr50'), elk = M.loc('cr-el', 'story'), src = M.loc('cr-src', 'all');
    el.innerHTML = head('insights', [
      { html: ui.localSelect('cr-el', 'Creative element', Object.entries(ELEMENTS).map(([k, e]) => ({ value: k, label: e.label })), elk) },
      { html: ui.localSelect('cr-src', 'Creative type', [{ value: 'all', label: 'All' }, { value: 'Brand', label: 'Brand' }, { value: 'Creator', label: 'Creator' }], src) },
      { html: ui.localSelect('cr-metric', 'Metric', metricOpts, metric) }
    ]);
    const rs = rows().filter(r => (src === 'all' || r.source === src) && r[metric] != null);
    if (!rs.length) return empty(el);
    const E = ELEMENTS[elk], vals = E.values(), m = METRICS[metric], F = mf(metric);
    const field = { story: 'story', sound: 'sound', emotion: 'emotion' }[elk];
    const perf = vals.map(v => ({ v, x: m.calc(rs.filter(r => r[field] === v)) })).sort((a, b) => b.x - a.x);
    const avg = m.calc(rs);
    const matrix = (dimVals, dimKey, minN = 1) => {
      const cells = vals.map(v => dimVals.map(dv => { const s = rs.filter(r => r[field] === v && r[dimKey] === dv); return s.length >= minN ? m.calc(s) : null; }));
      const fl = cells.flat().filter(x => x != null);
      return { cells, lo: Math.min(...fl), hi: Math.max(...fl) };
    };
    const fmts = M.FORMATS.filter(x => x !== 'Static'), plats = M.PLATFORMS.filter(pl => rs.some(r => r.platform === pl)), brands = d.persona.brands;
    const mxD = matrix(fmts, 'format'), mxP = matrix(plats, 'platform'), mxB = matrix(brands, 'brand', 10);
    const tbl = (cols, mx, title, sub, id, span) => ui.card({ id, span, title, sub, body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${E.label}</th>${cols.map(c => `<th class="num">${c}</th>`).join('')}</tr></thead>
      <tbody>${vals.map((v, i) => `<tr><td><b>${v}</b></td>${mx.cells[i].map(x => `<td class="num">${ui.heat(x, mx.lo, mx.hi, F)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` });
    let best = { v: null, x: -1 };
    vals.forEach((v, i) => mxD.cells[i].forEach((x, j) => { if (x != null && x > best.x) best = { v: `${v} × ${fmts[j]}`, x }; }));
    const top = rs.filter(r => r.impressions >= 10000).sort((a, b) => b[metric] - a[metric]).slice(0, 6);

    el.insertAdjacentHTML('beforeend', `<div class="note"><b>How to use</b> Pick a creative element and metric above — every chart on this page ranks ${E.label.toLowerCase()}s by that metric. Use creative type to compare brand vs creator content.</div>
      <div class="grid">
        ${ui.card({ id: 'in-el', span: 5, height: 'h-300', title: 'Creative element performance', sub: `Which ${E.label.toLowerCase()}s are associated with stronger ${m.short}?`,
          table: () => ({ cols: [{ key: 'v', label: E.label }, { key: 'x', label: m.short, num: true, fmt: F }], rows: perf }),
          insight: `<b>${perf[0].v}</b> leads at ${F(perf[0].x)} (${fmt.pp(perf[0].x - avg)} vs average). Best combination: <b>${best.v}</b> at ${F(best.x)}.` })}
        ${tbl(fmts, mxD, 'Element × duration', `Which durations work best for each ${E.label.toLowerCase()}?`, 'in-d', 7)}
        ${tbl(plats, mxP, 'Element × platform', `Where does each ${E.label.toLowerCase()} perform best?`, 'in-p', 6)}
        ${tbl(brands, mxB, 'Element × brand', `${m.short} by ${E.label.toLowerCase()} × brand (min. 10 creatives)`, 'in-b', 6)}
        <div class="card span-12"><div class="card-head"><div><h3 class="card-title">Top creatives</h3><p class="card-sub">Ranked by ${m.label} — min. 10K impressions</p></div></div>${creativeCards(top, metric)}</div>
      </div>`);
    M.charts.bars(document.getElementById('in-el'), { labels: perf.map(z => z.v), values: perf.map(z => z.x), vertical: true, fmt: F, bench: avg, benchLabel: 'Average', axisFmt: v => (v * 100).toFixed(metric === 'ctr' ? 1 : 0) + '%' });
  }

  /* ---------- Brand vs Creator ---------- */
  function bvcTab(el) {
    const ui = M.ui, f = M.filters('creative');
    const view = M.loc('bvc-view', 'creatives');
    el.innerHTML = head('brand-vs-creator');
    const rs = rows();
    if (!rs.length) return empty(el);
    const meas = { creatives: s => s.length, impressions: s => q.sum(s, 'impressions'), spend: s => q.sum(s, 'spend') };
    const split = (k) => { const b = meas[k](rs.filter(r => r.source === 'Brand')), c = meas[k](rs.filter(r => r.source === 'Creator')); const t = b + c || 1; return [b / t, c / t]; };
    const plats = M.PLATFORMS.filter(pl => rs.some(r => r.platform === pl));
    const dep = plats.map(pl => ({ pl, b: meas[view](rs.filter(r => r.platform === pl && r.source === 'Brand')), c: meas[view](rs.filter(r => r.platform === pl && r.source === 'Creator')) }));
    const months = q.monthsOfYear(f.year).filter(mo => rs.some(r => r.ym === mo.ym));
    const share = months.map(mo => { const s = rs.filter(r => r.ym === mo.ym); const t = q.sum(s, 'impressions'); return t ? q.sum(s.filter(r => r.source === 'Creator'), 'impressions') / t : null; });
    const cpm = (s) => { const i = q.sum(s, 'impressions'); return i ? q.sum(s, 'spend') / i * 1000 : null; };
    const eff = plats.map(pl => {
      const b = rs.filter(r => r.platform === pl && r.source === 'Brand'), c = rs.filter(r => r.platform === pl && r.source === 'Creator');
      const o = { pl, cpmB: cpm(b), cpmC: c.length ? cpm(c) : null, ctrB: METRICS.ctr.calc(b), ctrC: c.length ? METRICS.ctr.calc(c) : null, vtrB: METRICS.vtr50.calc(b), vtrC: c.length ? METRICS.vtr50.calc(c) : null };
      o.cpmAdv = o.cpmC == null ? null : (o.cpmB - o.cpmC) / o.cpmB; o.ctrAdv = o.ctrC == null ? null : o.ctrC - o.ctrB; o.vtrAdv = o.vtrC == null || o.vtrB == null ? null : o.vtrC - o.vtrB;
      return o;
    });
    const adv = (v, f2) => (v == null ? '<span class="status na">–</span>' : `<span class="status ${v >= 0 ? 'good' : 'bad'}">${v >= 0 ? '▲' : '▼'} ${f2(v)}</span>`);
    const viewLabel = { creatives: 'Creatives', impressions: 'Impressions', spend: 'Spends' };
    const [ib, ic] = split('impressions'), [sb, sc] = split('spend');
    const creatorPlats = eff.filter(e => e.cpmC != null);
    const cheaper = creatorPlats.filter(e => e.cpmAdv > 0).length;

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${['creatives', 'impressions', 'spend'].map(k => { const [b, c] = split(k); return ui.kpi({ label: viewLabel[k], sub: `Brand ${fmt.pct(b, 0)} · Creator ${fmt.pct(c, 0)}`, value: `${fmt.pct(c, 0)} <small class="muted" style="font-size:14px">creator</small>`, span: 4, accent: k === view ? 'blue' : '' }); }).join('')}
    </div>
    <div class="grid" style="margin-top:16px">
      <div class="card span-6"><div class="card-head"><div><h3 class="card-title">Creative deployment by platform</h3><p class="card-sub">Brand vs creator ${viewLabel[view].toLowerCase()} on each platform</p></div>
        <div class="card-tools">${ui.toggle('bvc-view', [{ value: 'creatives', label: 'Creatives' }, { value: 'impressions', label: 'Impressions' }, { value: 'spend', label: 'Spends' }], view, 'mini')}</div></div>
        <div class="legend"><span><i style="background:${M.SERIES[0]}"></i>Brand</span><span><i style="background:${M.SERIES[1]}"></i>Creator</span></div>
        <div class="chart h-300" id="bv-dep"></div></div>
      ${ui.card({ id: 'bv-share', span: 6, height: 'h-300', title: 'Creator share of impressions over time', sub: 'Brand is the remainder',
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }, { key: 'v', label: 'Creator share', num: true, fmt: fmt.pct }], rows: months.map((mo, i) => ({ mo: mo.long, v: share[i] })) }),
        insight: `Creator content is <b>${fmt.pct(ic, 0)}</b> of impressions on <b>${fmt.pct(sc, 0)}</b> of spend — and cheaper on <b>${cheaper} of ${creatorPlats.length}</b> platforms where both run.` })}
      ${ui.card({ id: 'bv-eff', span: 12, title: 'Efficiency by platform', sub: 'Creator advantage = how much better (▲) or worse (▼) creator content performs than brand content. For CPM, ▲ means creator is cheaper.',
        body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Platform</th><th class="num">CPM (brand)</th><th class="num">CPM (creator)</th><th class="num">CPM advantage</th><th class="num">CTR (brand)</th><th class="num">CTR (creator)</th><th class="num">CTR advantage</th><th class="num">VTR 50% (brand)</th><th class="num">VTR 50% (creator)</th><th class="num">VTR advantage</th></tr></thead>
        <tbody>${eff.map(e => `<tr><td><b>${e.pl}</b></td><td class="num">${e.cpmB == null ? '–' : '$' + e.cpmB.toFixed(2)}</td><td class="num">${e.cpmC == null ? '–' : '$' + e.cpmC.toFixed(2)}</td><td class="num">${adv(e.cpmAdv, v => fmt.pct(Math.abs(v), 0))}</td>
          <td class="num">${fmt.pct(e.ctrB, 2)}</td><td class="num">${e.ctrC == null ? '–' : fmt.pct(e.ctrC, 2)}</td><td class="num">${adv(e.ctrAdv, v => fmt.pp(Math.abs(v), 2).replace('+', ''))}</td>
          <td class="num">${fmt.pct(e.vtrB)}</td><td class="num">${e.vtrC == null ? '–' : fmt.pct(e.vtrC)}</td><td class="num">${adv(e.vtrAdv, v => fmt.pp(Math.abs(v)).replace('+', ''))}</td></tr>`).join('')}</tbody></table></div>` })}
    </div>`);
    const vf = view === 'spend' ? (v) => fmt.money(v) : view === 'impressions' ? fmt.num : (v) => v;
    M.charts.init(document.getElementById('bv-dep'), {
      grid: { left: 8, right: 16, top: 10, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => { const t = ps.reduce((s, p) => s + p.value, 0) || 1; return M.tip(ps[0].axisValue, ps.map(p => ({ color: p.color, name: p.seriesName, value: `${vf(p.value)} (${fmt.pct(p.value / t, 0)})` }))); } },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF0F7' } }, axisLabel: { color: M.MUTED, formatter: v => vf(v) } },
      yAxis: { type: 'category', data: plats, inverse: true, axisTick: { show: false }, axisLine: { lineStyle: { color: M.LINE } }, axisLabel: { color: M.INK2 } },
      series: [['Brand', 'b', M.SERIES[0], 0], ['Creator', 'c', M.SERIES[1], 1]].map(([n, k, c, i]) => ({ name: n, type: 'bar', stack: 's', barMaxWidth: 26, data: dep.map(x => x[k]), itemStyle: { color: c, borderColor: '#fff', borderWidth: 1, borderRadius: i === 1 ? [0, 4, 4, 0] : [4, 0, 0, 4] } }))
    });
    M.charts.lines(document.getElementById('bv-share'), { x: months.map(mo => mo.label), series: [{ name: 'Creator share', color: M.SERIES[1], data: share }], yMin: 0, yMax: Math.min(1, Math.ceil((Math.max(...share.filter(v => v != null)) + 0.05) * 10) / 10), axisFmt: v => Math.round(v * 100) + '%' });
  }

  /* ---------- Library ---------- */
  function libraryTab(el) {
    const ui = M.ui;
    const L = { emo: M.loc('lib-emo', 'all'), snd: M.loc('lib-snd', 'all'), fmt: M.loc('lib-fmt', 'all'), src: M.loc('lib-src', 'all'), adh: M.loc('lib-adh', 'all'), sort: M.loc('lib-sort', 'vtr50'), n: M.loc('lib-n', 30) };
    el.innerHTML = head('library');
    const base = rows();
    const rs = base.filter(r => (L.emo === 'all' || r.emotion === L.emo) && (L.snd === 'all' || r.sound === L.snd) && (L.fmt === 'all' || r.format === L.fmt) && (L.src === 'all' || r.source === L.src)
      && (L.adh === 'all' || (L.adh === 'below' ? r.adherence < T() : r.adherence >= T())));
    const sortKey = L.sort, sorted = rs.slice().sort((a, b) => (b[sortKey] ?? -1) - (a[sortKey] ?? -1));
    const shown = sorted.slice(0, L.n);
    const all = (lbl) => [{ value: 'all', label: lbl }];
    const metricFor = ['vtr50', 'ctr', 'completion'].includes(sortKey) ? sortKey : 'vtr50';

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.kpi({ label: 'Total creatives', sub: 'matching filters', value: rs.length.toLocaleString(), span: 3, accent: 'blue' })}
      ${ui.kpi({ label: 'Avg. adherence', sub: 'impression-weighted', value: fmt.pct(q.adherence(rs), 0), span: 3 })}
      ${ui.kpi({ label: 'Avg. CTR', sub: 'clicks ÷ impressions', value: fmt.pct(METRICS.ctr.calc(rs), 2), span: 3 })}
      ${ui.kpi({ label: 'Avg. video completion', sub: 'impression-weighted', value: fmt.pct(METRICS.completion.calc(rs)), span: 3 })}
    </div>
    <div class="filter-bar" style="margin-top:16px">
      ${ui.localSelect('lib-adh', 'Adherence', all('All').concat([{ value: 'below', label: 'Below 80% target' }, { value: 'met', label: 'On target (80%+)' }]), L.adh)}
      ${ui.localSelect('lib-emo', 'Emotion', all('All emotions').concat(M.EMOTIONS), L.emo)}
      ${ui.localSelect('lib-snd', 'Sound type', all('All sounds').concat(M.SOUND_TYPES), L.snd)}
      ${ui.localSelect('lib-fmt', 'Format / duration', all('All formats').concat(M.FORMATS), L.fmt)}
      ${ui.localSelect('lib-src', 'Creative source', all('Brand & creator').concat(['Brand', 'Creator']), L.src)}
      ${ui.localSelect('lib-sort', 'Sort by', [{ value: 'vtr50', label: 'VTR 50%' }, { value: 'ctr', label: 'CTR' }, { value: 'completion', label: 'Completion' }, { value: 'impressions', label: 'Impressions' }, { value: 'adherence', label: 'Adherence' }], L.sort)}
      <button class="reset-link" data-local-key="lib-emo,lib-snd,lib-fmt,lib-src,lib-adh,lib-n" data-local-value="all,all,all,all,all,30">Clear</button>
    </div>
    <div class="card"><div class="card-head"><div><h3 class="card-title">Creative library</h3><p class="card-sub">${rs.length.toLocaleString()} creatives · showing ${shown.length} sorted by ${sortKey === 'vtr50' ? 'VTR 50%' : sortKey} (highest first)</p></div></div>
      ${shown.length ? creativeCards(shown, metricFor) : '<p class="card-sub">No creatives match these filters.</p>'}
      ${sorted.length > shown.length ? `<div style="text-align:center;margin-top:16px"><button class="btn btn-ghost" data-local-key="lib-n" data-local-value="${L.n + 30}">Show 30 more</button></div>` : ''}
    </div>`);
  }

  M.modules.creative = {
    render(el, tab) {
      tab = TABS.some(t => t.key === tab) ? tab : 'adherence';
      ({ adherence: adherenceTab, performance: performanceTab, insights: insightsTab, 'brand-vs-creator': bvcTab, library: libraryTab })[tab](el);
    }
  };
})();
