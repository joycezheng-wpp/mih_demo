/* Media Report — blueprint: PBI "Media Report" (Investment, Social, Planning, Performance, Data, Glossary). */
(function () {
  const M = window.MIH;
  const q = M.q, fmt = M.fmt;
  const ratio = (a, b = 'spend') => (rows) => { const d = q.sum(rows, b); return d ? q.sum(rows, a) / d : null; };
  const wavg = (k) => (rows) => q.wavg(rows, k);

  const KPIS = [
    { key: 'digital', tab: 'investment', label: 'Digital spend %', calc: ratio('digital'), def: 'Monthly digital media spend (including tech and influencer) as a share of total media spend.', calcTxt: 'Digital spend ÷ total media spend' },
    { key: 'retail', tab: 'investment', label: 'Retail media spend %', calc: ratio('retail'), def: 'Share of media investment placed directly with retail and commerce partners.', calcTxt: 'Retail media spend ÷ total media spend', target: '20% of media by 2028' },
    { key: 'firstParty', tab: 'investment', label: '1PD spend %', calc: ratio('firstParty'), d: 2, def: 'Share of paid media spend activated on first-party data segments enriched with retail signals.', calcTxt: '1PD-activated spend ÷ total media spend', target: '100% of markets activating 1PD quarterly by 2027' },
    { key: 'social', tab: 'social', label: 'Social + influencer %', calc: ratio('social'), def: 'Social and influencer spend (including boosting) as a share of total media spend.', calcTxt: 'Social + influencer spend ÷ total media spend' },
    { key: 'influencer', tab: 'social', label: 'Influencer spend %', calc: ratio('influencer'), def: 'Influencer media spend as a share of total paid media.', calcTxt: 'Influencer spend ÷ total media spend' },
    { key: 'infFee', tab: 'social', label: 'Influencer fee %', calc: ratio('infFee'), def: 'Influencer fees as a share of total paid media spend.', calcTxt: 'Influencer fees ÷ total media spend' },
    { key: 'boosting', tab: 'social', label: 'Influencer boosting % of social', calc: ratio('boosting', 'social'), def: 'Paid boosting of influencer content as a share of social spend.', calcTxt: 'Boosting spend ÷ social spend' },
    { key: 'oms', tab: 'planning', label: 'OMS investment %', calc: wavg('omsPct'), def: 'Share of investment planned through the optimisation (OMS) tool.', calcTxt: 'OMS-planned spend ÷ total planned spend', quarterly: true },
    { key: 'roi', tab: 'planning', label: 'ROI investment %', calc: wavg('roiPct'), def: 'Share of media planned with ROI response curves rather than reach-only optimisation.', calcTxt: 'ROI-planned spend ÷ total planned spend', target: 'ROI considered in 100% of budget decisions', quarterly: true },
    { key: 'ap2', tab: 'planning', label: 'Audience planning 2+ %', calc: wavg('ap2Pct'), def: 'Share of campaign spend planned with two or more audience signals.', calcTxt: 'AP2+ spend ÷ campaign spend', target: '100% by Q4 2026' },
    { key: 'engTx', tab: 'planning', label: 'Engagement + transaction %', calc: ratio('engTx', 'digital'), def: 'Share of digital investment in engagement, conversion and transaction formats.', calcTxt: 'Engagement + transaction spend ÷ digital spend', target: '55%+ of digital by 2028' },
    { key: 'brandSafety', tab: 'performance', label: 'Brand safety %', calc: wavg('brandSafety'), d: 2, def: 'Share of verified impressions free of unsafe or unsuitable adjacency (IAS + Zefr).', calcTxt: 'Brand-safe impressions ÷ measured impressions' },
    { key: 'viewability', tab: 'performance', label: 'Viewability %', calc: wavg('viewability'), def: 'Share of online video and display impressions meeting the viewability standard.', calcTxt: 'Viewable impressions ÷ measured impressions' },
    { key: 'vtr50', tab: 'performance', label: 'VTR 50%', calc: wavg('vtr50'), def: 'Share of social video views that reach 50% of the asset — a proxy for creative quality.', calcTxt: '50% views ÷ video starts' },
    { key: 'reach', tab: 'performance', label: 'Media reach %', calc: wavg('reach'), def: 'Unduplicated reach across paid media as a share of the target audience.', calcTxt: 'Unique reach ÷ target audience' }
  ];
  M.MEDIA_KPIS = KPIS;
  const kf = (k) => (v) => fmt.pct(v, k.d || 1);
  const TABS = [
    { key: 'investment', label: 'Investment' }, { key: 'social', label: 'Social' }, { key: 'planning', label: 'Planning' },
    { key: 'performance', label: 'Performance' }, { key: 'data', label: 'Data' }, { key: 'glossary', label: 'Glossary' }
  ];
  const REG = `Regional (${M.APP.region})`;

  function head(el, tab, extraFilters = [], context) {
    const ui = M.ui, f = M.filters('media'), p = M.data.persona;
    const mOpts = [{ value: 'all', label: `${REG} only` }].concat(M.MARKETS.map(m => ({ value: m.code, label: m.name })));
    return ui.pageHead({ eyebrow: `${p.client} · ${M.APP.region}`, title: 'Media Report', sub: 'Investment, social, planning and performance KPIs by market, against the regional benchmark.' })
      + ui.subnav('media', TABS, tab)
      + (tab === 'glossary' ? '' : ui.filterBar([
        { key: 'year', label: 'Year', options: ui.opts.years() },
        { key: 'month', label: 'Month', options: ui.opts.months(f.year) },
        { key: 'market', label: 'Market', options: mOpts }
      ].concat(extraFilters), f, context || `Showing <b>${f.market === 'all' ? REG : ui.marketName(f.market)}</b> · <b>${ui.periodLabel(f)}</b>`));
  }

  /* ---------- Investment / Social / Performance: KPI explorer ---------- */
  function kpiTab(el, tab) {
    const ui = M.ui, d = M.data, f = M.filters('media');
    const list = KPIS.filter(k => k.tab === tab);
    const k = list.find(x => x.key === M.loc('media-kpi-' + tab)) || list[0];
    const F = kf(k);
    const mk = f.market, mkName = mk === 'all' ? REG : ui.marketName(mk);
    const reg = q.filter(d.media, { ...f, market: 'all' }), mkt = q.filter(d.media, f);
    const vReg = k.calc(reg), vMkt = k.calc(mkt);
    const spend = q.sum(mkt, 'spend'), dig = q.sum(mkt, 'digital');
    const byMarket = M.MARKETS.map(m => ({ m, v: k.calc(q.filter(d.media, { ...f, market: m.code })) })).sort((a, b) => b.v - a.v);
    const rank = byMarket.findIndex(x => x.m.code === mk) + 1;
    const months = q.monthsOfYear(f.year);
    const monthRows = months.map(mo => q.filter(d.media, { year: f.year, month: mo.m, market: mk }));
    const regMonth = months.map(mo => k.calc(q.filter(d.media, { year: f.year, month: mo.m })));
    const hi = f.month === 'all' ? null : months.findIndex(mo => mo.m === +f.month);
    const diff = vMkt - vReg;

    const tiles = [
      ui.kpi({ label: 'Total media spend', sub: `${mkName} · ${ui.periodLabel(f)}`, value: fmt.money(spend), span: 3, accent: 'blue' }),
      ui.kpi({ label: 'Digital media spend', sub: `${fmt.pct(dig / spend)} of total media spend`, value: fmt.money(dig), span: 3 }),
      mk === 'all'
        ? ui.kpi({ label: `Top market · ${k.label}`, sub: byMarket[0].m.name, value: F(byMarket[0].v), span: 3, delta: byMarket[0].v - vReg, deltaLabel: `${fmt.pp(byMarket[0].v - vReg)} vs regional` })
        : ui.kpi({ label: `${mkName} · ${k.label}`, sub: `Rank #${rank} of ${M.MARKETS.length} markets`, value: F(vMkt), span: 3, delta: diff, deltaLabel: `${fmt.pp(diff, k.d || 1)} vs regional` }),
      ui.kpi({ label: `${REG} · ${k.label}`, sub: 'Regional benchmark', value: F(vReg), span: 3 })
    ].join('');

    const insight = mk === 'all'
      ? `${k.label} ranges from <b>${F(byMarket[byMarket.length - 1].v)}</b> in ${byMarket[byMarket.length - 1].m.name} to <b>${F(byMarket[0].v)}</b> in ${byMarket[0].m.name}. Select a market to benchmark it against the region.`
      : `${mkName} is <b>${fmt.pp(Math.abs(diff), k.d || 1).replace('+', '')} ${diff >= 0 ? 'above' : 'below'}</b> the regional benchmark on ${k.label.toLowerCase()} and ranks <b>#${rank} of ${M.MARKETS.length}</b>${k.target ? `. Target: ${k.target}.` : '.'}`;

    // detailed breakdown
    const cols = [{ code: 'all', name: REG }].concat(M.MARKETS);
    const cells = [{ label: 'Overall', fv: f }].concat(months.map(mo => ({ label: mo.long, fv: { year: f.year, month: mo.m } })))
      .map(r => ({ label: r.label, vals: cols.map(c => k.calc(q.filter(d.media, { ...r.fv, market: c.code }))) }));
    const all = cells.flatMap(r => r.vals).filter(v => v != null);
    const lo = Math.min(...all), hiV = Math.max(...all);
    const breakdown = `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Month</th>${cols.map(c => `<th class="num ${c.code === mk ? 'col-hi' : ''}">${c.code === 'all' ? 'Regional' : c.name}</th>`).join('')}</tr></thead>
      <tbody>${cells.map((r, i) => `<tr class="${i === 0 ? 'total-top' : ''}"><td><b>${r.label}</b></td>${r.vals.map((v, j) => `<td class="num ${cols[j].code === mk ? 'col-hi' : ''}">${ui.heat(v, lo, hiV, F)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

    el.innerHTML = head(el, tab, [
      { html: ui.localSelect('media-kpi-' + tab, 'KPI', list.map(x => ({ value: x.key, label: x.label })), k.key) }
    ], `<div class="def"><b>KPI definition</b>${k.def}${k.target ? ` <span class="tgt">Target: ${k.target}</span>` : ''}</div>`)
      + `<div class="grid">${tiles}</div>
      <div class="grid" style="margin-top:16px">
        ${ui.card({ id: 'm-trend', span: 7, height: 'h-380', title: `Total media spend vs ${k.label}`, sub: `${mkName} · ${f.year} · spend (top), KPI vs regional benchmark (bottom)`,
          legend: [{ name: 'Total media spend', color: '#C8CBDD' }].concat(mk === 'all' ? [] : [{ name: mkName, color: M.SERIES[0], line: true }]).concat([{ name: REG, color: M.INK, line: true }]),
          table: () => ({ cols: [{ key: 'mo', label: 'Month' }, { key: 's', label: 'Total spend', num: true, fmt: v => fmt.money(v) }, { key: 'v', label: mkName, num: true, fmt: F }, { key: 'r', label: 'Regional', num: true, fmt: F }],
            rows: months.map((mo, i) => ({ mo: mo.long, s: q.sum(monthRows[i], 'spend'), v: k.calc(monthRows[i]), r: regMonth[i] })) }),
          insight })}
        ${ui.card({ id: 'm-mkt', span: 5, height: 'h-380', title: 'Market comparison', sub: `${k.label} · ${ui.periodLabel(f)} · dashed line = regional`,
          table: () => ({ cols: [{ key: 'n', label: 'Market' }, { key: 'v', label: k.label, num: true, fmt: F }], rows: byMarket.map(x => ({ n: x.m.name, v: x.v })) }) })}
        ${ui.card({ id: 'm-break', span: 12, title: 'Detailed breakdown', sub: `${k.label} by market and month · darker = higher`, body: breakdown })}
      </div>`;

    const lines = (mk === 'all' ? [] : [{ name: mkName, color: M.SERIES[0], data: monthRows.map(rs => k.calc(rs)) }]).concat([{ name: REG, color: M.INK, dashed: true, data: regMonth }]);
    M.charts.barsPanel(document.getElementById('m-trend'), { x: months.map(m => m.label), bars: monthRows.map(rs => q.sum(rs, 'spend')), barName: 'Total media spend', lines, fmt: F, highlightIdx: hi });
    M.charts.bars(document.getElementById('m-mkt'), { labels: byMarket.map(x => x.m.name), values: byMarket.map(x => x.v), fmt: F, bench: vReg, benchLabel: 'Regional', highlight: mk === 'all' ? null : mkName, axisFmt: v => Math.round(v * 1000) / 10 + '%', colors: M.SERIES[0] });
  }

  /* ---------- Planning: four KPIs as small multiples ---------- */
  function planningTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('media');
    const list = KPIS.filter(k => k.tab === 'planning');
    const mk = f.market, mkName = mk === 'all' ? REG : ui.marketName(mk);
    const months = q.monthsOfYear(f.year);
    const quarters = [1, 2, 3, 4].map(n => ({ n, ms: months.filter(m => Math.ceil(m.m / 3) === n).map(m => m.m) })).filter(x => x.ms.length);
    const series = (k, market) => k.quarterly
      ? quarters.map(qq => k.calc(q.filter(d.media, { year: f.year, market }).filter(r => qq.ms.includes(r.m))))
      : months.map(mo => k.calc(q.filter(d.media, { year: f.year, month: mo.m, market })));

    const tiles = list.map(k => {
      const v = k.calc(q.filter(d.media, f)), r = k.calc(q.filter(d.media, { ...f, market: 'all' }));
      return ui.kpi({ label: k.label, sub: mk === 'all' ? 'Regional' : `${mkName} · regional ${fmt.pct(r)}`, value: fmt.pct(v), span: 3, ...(mk === 'all' ? {} : { delta: v - r, deltaLabel: `${fmt.pp(v - r)} vs regional` }) });
    }).join('');

    el.innerHTML = head(el, 'planning') + `<div class="grid">${tiles}</div><div class="grid" style="margin-top:16px">
      ${list.map(k => ui.card({ id: 'p-' + k.key, span: 6, height: 'h-240', title: `${k.label}: market vs regional`, sub: `${mkName} · ${f.year} · ${k.quarterly ? 'quarterly' : 'monthly'}${k.target ? ` · target ${k.target}` : ''}`,
        legend: (mk === 'all' ? [] : [{ name: mkName, color: M.SERIES[0], line: true }]).concat([{ name: REG, color: M.INK, line: true }]),
        table: () => { const x = k.quarterly ? quarters.map(qq => 'Q' + qq.n) : months.map(m => m.label); const a = series(k, mk), b = series(k, 'all');
          return { cols: [{ key: 'x', label: k.quarterly ? 'Quarter' : 'Month' }, { key: 'a', label: mkName, num: true, fmt: fmt.pct }, { key: 'b', label: 'Regional', num: true, fmt: fmt.pct }], rows: x.map((l, i) => ({ x: l, a: a[i], b: b[i] })) }; } })).join('')}
    </div>`;

    for (const k of list) {
      const x = k.quarterly ? quarters.map(qq => `Q${qq.n} ${f.year}`) : months.map(m => m.label);
      const s = (mk === 'all' ? [] : [{ name: mkName, color: M.SERIES[0], data: series(k, mk) }]).concat([{ name: REG, color: M.INK, dashed: true, data: series(k, 'all') }]);
      const vals = s.flatMap(z => z.data);
      M.charts.lines(document.getElementById('p-' + k.key), { x, series: s, yMin: Math.max(0, Math.floor((Math.min(...vals) - 0.05) * 10) / 10), yMax: Math.min(1, Math.ceil((Math.max(...vals) + 0.03) * 10) / 10), axisFmt: v => Math.round(v * 100) + '%' });
    }
  }

  /* ---------- Data: consolidated tracker ---------- */
  function dataTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('media');
    const view = M.loc('media-data-view', 'market');
    const groups = ['investment', 'social', 'planning', 'performance'];
    const cols = [{ key: 'name', label: view === 'market' ? 'Market' : 'Month' }, { key: 'spend', label: 'Total spend', num: true, fmt: v => fmt.money(v), raw: v => Math.round(v) }]
      .concat(KPIS.map(k => ({ key: k.key, label: k.label, num: true, fmt: kf(k), raw: v => (v == null ? '' : (v * 100).toFixed(2)) })));
    const row = (name, rs) => { const o = { name, spend: q.sum(rs, 'spend') }; KPIS.forEach(k => { o[k.key] = k.calc(rs); }); return o; };
    let rows;
    if (view === 'market') rows = [row(REG, q.filter(d.media, { ...f, market: 'all' }))].concat(M.MARKETS.map(m => row(m.name, q.filter(d.media, { ...f, market: m.code }))));
    else rows = q.monthsOfYear(f.year).map(mo => row(mo.long, q.filter(d.media, { year: f.year, month: mo.m, market: f.market })));

    el.innerHTML = head(el, 'data') + `<div class="card">
      <div class="card-head"><div><h3 class="card-title">Consolidated tracker</h3><p class="card-sub">Every media KPI · ${view === 'market' ? `all markets · ${ui.periodLabel(f)}` : `${f.market === 'all' ? REG : ui.marketName(f.market)} by month · ${f.year}`}</p></div>
        <div class="card-tools">${ui.toggle('media-data-view', [{ value: 'market', label: 'By market' }, { value: 'month', label: 'By month' }], view, 'mini')}<button class="btn btn-lime" id="csv">Export CSV</button></div></div>
      <div class="tbl-wrap"><table class="tbl tracker">
        <thead><tr><th rowspan="2">${cols[0].label}</th><th rowspan="2" class="num">Total spend</th>${groups.map(g => `<th colspan="${KPIS.filter(k => k.tab === g).length}" class="grp">${g}</th>`).join('')}</tr>
        <tr>${KPIS.map(k => `<th class="num">${k.label}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr class="${view === 'market' && i === 0 ? 'total-top' : ''}">${cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.fmt ? c.fmt(r[c.key]) : `<b>${r[c.key]}</b>`}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div></div>`;
    document.getElementById('csv').addEventListener('click', () => ui.downloadCsv(`media-tracker-${view}-${f.year}.csv`, cols, rows));
  }

  /* ---------- Glossary ---------- */
  function glossaryTab(el) {
    const ui = M.ui;
    el.innerHTML = head(el, 'glossary') + `<div class="card"><div class="card-head"><div><h3 class="card-title">KPI glossary</h3><p class="card-sub">Definition, calculation and target for every Media Report KPI</p></div></div>
      <div class="tbl-wrap"><table class="tbl wrap"><thead><tr><th>Category</th><th>KPI</th><th>Definition</th><th>Calculation</th><th>Target</th></tr></thead>
      <tbody>${KPIS.map(k => `<tr><td><span class="chip">${k.tab[0].toUpperCase() + k.tab.slice(1)}</span></td><td><b>${k.label}</b></td><td>${k.def}</td><td>${k.calcTxt}</td><td>${k.target || '–'}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  M.modules.media = {
    render(el, tab) {
      tab = TABS.some(t => t.key === tab) ? tab : 'investment';
      if (tab === 'planning') return planningTab(el);
      if (tab === 'data') return dataTab(el);
      if (tab === 'glossary') return glossaryTab(el);
      kpiTab(el, tab);
    }
  };
})();
