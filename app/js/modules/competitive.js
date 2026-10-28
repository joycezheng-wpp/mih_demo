/* Competitive Report — blueprint: PBI "Competitive+" (Introduction, Category, Advertiser, Brand, Creative, Report). */
(function () {
  const M = window.MIH;
  const q = M.q, fmt = M.fmt;
  const ADV = ['client', 'compA', 'compB', 'others'];
  const TABS = [
    { key: 'introduction', label: 'Introduction' }, { key: 'category', label: 'Category' }, { key: 'advertiser', label: 'Advertiser' },
    { key: 'brand', label: 'Brand' }, { key: 'creative', label: 'Creative' }, { key: 'report', label: 'Spends Report' }
  ];
  const MIX_COLORS = [M.SERIES[1], M.SERIES[2], M.SERIES[3], M.SERIES[4], M.SERIES[5]];
  const advOpts = () => [{ value: 'all', label: 'All advertisers' }].concat(ADV.map(a => ({ value: a, label: M.advName(a) })));

  // Months that count for the selected period, plus same period last year / full prior year
  function periods(f) {
    const ms = q.monthsOfYear(f.year), maxM = ms[ms.length - 1].m;
    const inYtd = (r) => (f.month === 'all' ? r.m <= maxM : r.m === +f.month);
    const has = (y) => M.MONTHS.some(m => m.y === y);
    const out = [];
    if (has(f.year - 1)) {
      out.push({ label: `FY${f.year - 1}`, test: r => r.y === f.year - 1 });
      out.push({ label: `${f.month === 'all' ? 'YTD' : M.MONTH_NAMES[f.month - 1]} ${f.year - 1}`, test: r => r.y === f.year - 1 && inYtd(r) });
    }
    out.push({ label: `${f.month === 'all' ? 'YTD' : M.MONTH_NAMES[f.month - 1]} ${f.year}`, test: r => r.y === f.year && inYtd(r) });
    return out;
  }
  const shareOf = (rows, key, keys) => { const tot = q.sum(rows, 'spend') || 1; const o = {}; keys.forEach(k => { o[k] = 0; }); rows.forEach(r => { o[r[key]] += r.spend; }); keys.forEach(k => { o[k] /= tot; }); return o; };

  function head(tab, defs, context, extra) {
    const ui = M.ui, p = M.data.persona;
    return ui.pageHead({ eyebrow: `${p.client} · ${M.APP.region} · AdClarity + TV/OOH`, title: 'Competitive Report', sub: 'Share of spend by category, advertiser and brand, with competitor creatives and media mix.' })
      + ui.subnav('competitive', TABS, tab) + (defs ? ui.filterBar(defs, M.filters('competitive'), context, extra) : '');
  }
  function baseDefs(withCategory = true, allCats = true) {
    const ui = M.ui, f = M.filters('competitive'), p = M.data.persona;
    const d = [
      { key: 'year', label: 'Year', options: ui.opts.years(2024) },
      { key: 'month', label: 'Month', options: ui.opts.months(f.year) },
      { key: 'market', label: 'Market', options: ui.opts.markets() }
    ];
    if (withCategory) d.push({ key: 'category', label: 'Category', options: (allCats ? [{ value: 'all', label: 'All categories' }] : []).concat(p.categories.map(c => ({ value: c, label: c }))) });
    return d;
  }
  const viewToggle = (v) => M.ui.toggle('comp-view', [{ value: 'trend', label: 'Trend' }, { value: 'mix', label: 'Media & platform mix' }], v);
  const ctx = (f, extra = '') => `Showing <b>${M.ui.marketName(f.market)}</b> · <b>${M.ui.periodLabel(f)}</b>${extra}`;

  /* ---------- Media & platform mix (shared by Category / Advertiser / Brand) ---------- */
  function mixView(el, tab, rows, f, scope) {
    const ui = M.ui;
    const ch = q.mixSpend(rows, 'channel'), pl = q.mixSpend(rows, 'platform');
    const toShare = (o, keys) => { const t = keys.reduce((a, k) => a + (o[k] || 0), 0) || 1; const r = {}; keys.forEach(k => { r[k] = (o[k] || 0) / t; }); return r; };
    const advs = ADV.filter(a => ch[a]);
    const chShare = advs.map(a => toShare(ch[a], M.CHANNELS)), plShare = advs.map(a => toShare(pl[a], M.DIGITAL_PLATFORMS));
    const sosByChannel = M.CHANNELS.map(c => { const t = advs.reduce((s, a) => s + (ch[a][c] || 0), 0) || 1; const o = {}; ADV.forEach(a => { o[a] = ch[a] ? (ch[a][c] || 0) / t : 0; }); return o; });
    const cl = sosByChannel.map((o, i) => ({ c: M.CHANNELS[i], v: o.client })).sort((a, b) => a.v - b.v);
    const names = advs.map(a => M.advName(a));

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.card({ id: 'x-ch', span: 6, height: 'h-300', title: 'Channel mix by advertiser', sub: `Share of each advertiser's spend · ${scope}`, legend: M.CHANNELS.map((c, i) => ({ name: c, color: MIX_COLORS[i] })),
        table: () => ({ cols: [{ key: 'n', label: 'Advertiser' }].concat(M.CHANNELS.map(c => ({ key: c, label: c, num: true, fmt: fmt.pct }))), rows: advs.map((a, i) => ({ n: names[i], ...chShare[i] })) }) })}
      ${ui.card({ id: 'x-pl', span: 6, height: 'h-300', title: 'Digital platform mix by advertiser', sub: `Share of digital spend · ${scope}`, legend: M.DIGITAL_PLATFORMS.map((c, i) => ({ name: c, color: MIX_COLORS[i] })),
        table: () => ({ cols: [{ key: 'n', label: 'Advertiser' }].concat(M.DIGITAL_PLATFORMS.map(c => ({ key: c, label: c, num: true, fmt: fmt.pct }))), rows: advs.map((a, i) => ({ n: names[i], ...plShare[i] })) }) })}
      ${ui.card({ id: 'x-sos', span: 12, height: 'h-300', title: 'Share of spend by channel', sub: `Who owns each channel · ${scope}`, legend: ADV.map(a => ({ name: M.advName(a), color: M.advColor[a] })),
        table: () => ({ cols: [{ key: 'c', label: 'Channel' }].concat(ADV.map(a => ({ key: a, label: M.advName(a), num: true, fmt: fmt.pct }))), rows: sosByChannel.map((o, i) => ({ c: M.CHANNELS[i], ...o })) }),
        insight: `${M.ui.esc(M.data.persona.clientShort)} is strongest in <b>${cl[cl.length - 1].c}</b> (${fmt.pct(cl[cl.length - 1].v, 0)} share) and most out-spent in <b>${cl[0].c}</b> (${fmt.pct(cl[0].v, 0)}).` })}
    </div>`);
    const mixSeries = (keys, shares) => keys.map((k, i) => ({ name: k, color: MIX_COLORS[i], data: shares.map(s => s[k]) }));
    M.charts.stack100H(document.getElementById('x-ch'), { labels: names, series: mixSeries(M.CHANNELS, chShare), labelSlot: -1 });
    M.charts.stack100H(document.getElementById('x-pl'), { labels: names, series: mixSeries(M.DIGITAL_PLATFORMS, plShare), labelSlot: -1 });
    M.charts.stack100H(document.getElementById('x-sos'), { labels: M.CHANNELS, series: ADV.map(a => ({ name: M.advName(a), color: M.advColor[a], data: sosByChannel.map(o => o[a]) })) });
  }

  /* ---------- Category ---------- */
  function categoryTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('competitive'), p = d.persona;
    const view = M.loc('comp-view', 'trend'), adv = M.loc('comp-adv', 'all');
    const rows = q.filter(d.comp, { market: f.market, adv });
    const defs = baseDefs(false).concat([{ html: ui.localSelect('comp-adv', 'Advertiser', advOpts(), adv) }]);
    el.innerHTML = head('category', defs, ctx(f), viewToggle(view));
    const scope = `${ui.marketName(f.market)} · ${ui.periodLabel(f)}`;
    if (view === 'mix') return mixView(el, 'category', q.filter(d.comp, { ...f, category: 'all', adv }), f, scope);

    const cats = p.categories;
    const months = M.MONTHS;
    const trend = months.map(mo => shareOf(rows.filter(r => r.ym === mo.ym), 'category', cats));
    const per = periods(f).map(pp => ({ label: pp.label, s: shareOf(rows.filter(pp.test), 'category', cats) }));
    const cy = q.monthsOfYear(f.year).map(mo => ({ label: mo.label, s: shareOf(rows.filter(r => r.ym === mo.ym), 'category', cats) }));
    const cur = per[per.length - 1].s, prev = per.length > 1 ? per[per.length - 2].s : null;
    const movers = prev ? cats.map(c => ({ c, dlt: cur[c] - prev[c] })).sort((a, b) => b.dlt - a.dlt) : null;
    const legend = cats.map(c => ({ name: c, color: M.catColor(c) }));
    const who = adv === 'all' ? 'all advertisers' : M.advName(adv);

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.card({ id: 'k-trend', span: 12, height: 'h-300', title: 'Category share of spend — trend', sub: `Monthly share of tracked spend by category · ${who} · ${ui.marketName(f.market)} · drag the slider to zoom`, legend,
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(cats.map(c => ({ key: c, label: c, num: true, fmt: fmt.pct }))), rows: months.map((mo, i) => ({ mo: mo.long, ...trend[i] })) }) })}
      ${ui.card({ id: 'k-ytd', span: 5, height: 'h-340', title: 'Year-to-date share by category', sub: `${who} · ${ui.marketName(f.market)}`, legend,
        table: () => ({ cols: [{ key: 'c', label: 'Category' }].concat(per.map((pp, i) => ({ key: 'p' + i, label: pp.label, num: true, fmt: fmt.pct }))), rows: cats.map(c => { const o = { c }; per.forEach((pp, i) => { o['p' + i] = pp.s[c]; }); return o; }) }),
        insight: movers ? `<b>${movers[0].c}</b> gained the most share (${fmt.pp(movers[0].dlt)}) vs last year; <b>${movers[movers.length - 1].c}</b> lost the most (${fmt.pp(movers[movers.length - 1].dlt)}).` : null })}
      ${ui.card({ id: 'k-cy', span: 7, height: 'h-340', title: `${f.year} monthly share by category`, sub: `${who} · ${ui.marketName(f.market)}`, legend,
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(cats.map(c => ({ key: c, label: c, num: true, fmt: fmt.pct }))), rows: cy.map(x => ({ mo: x.label, ...x.s })) }) })}
    </div>`);
    const lastYearStart = Math.round(100 * (1 - 21 / months.length));
    M.charts.lines(document.getElementById('k-trend'), { x: months.map(m => m.long), series: cats.map(c => ({ name: c, color: M.catColor(c), data: trend.map(t => t[c]) })), yMin: 0, axisFmt: v => Math.round(v * 100) + '%', endLabels: false, zoom: lastYearStart });
    M.charts.stack100V(document.getElementById('k-ytd'), { labels: per.map(x => x.label), series: cats.map(c => ({ name: c, color: M.catColor(c), data: per.map(x => x.s[c]) })) });
    M.charts.stack100V(document.getElementById('k-cy'), { labels: cy.map(x => x.label), series: cats.map(c => ({ name: c, color: M.catColor(c), data: cy.map(x => x.s[c]) })) });
  }

  /* ---------- Advertiser ---------- */
  function advertiserTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('competitive'), p = d.persona;
    const view = M.loc('comp-view', 'trend');
    const cat = f.category, catLabel = cat === 'all' ? 'All categories' : cat;
    el.innerHTML = head('advertiser', baseDefs(true), ctx(f, ` · <b>${catLabel}</b>`), viewToggle(view));
    const scope = `${catLabel} · ${ui.marketName(f.market)} · ${ui.periodLabel(f)}`;
    if (view === 'mix') return mixView(el, 'advertiser', q.filter(d.comp, f), f, scope);

    const rows = q.filter(d.comp, { market: f.market, category: cat });
    const trend = M.MONTHS.map(mo => q.sos(rows.filter(r => r.ym === mo.ym)));
    const per = periods(f).map(pp => ({ label: pp.label, s: q.sos(rows.filter(pp.test)) }));
    const cy = q.monthsOfYear(f.year).map(mo => ({ label: mo.label, s: q.sos(rows.filter(r => r.ym === mo.ym)) }));
    const cur = per[per.length - 1].s, prev = per.length > 1 ? per[per.length - 2].s : null;
    const period = q.filter(d.comp, f);
    const led = M.MARKETS.filter(m => { const s = q.sos(period.filter(r => r.market === m.code)); return s.client > Math.max(s.compA, s.compB, s.others); }).length;
    const rival = cur.compA >= cur.compB ? 'compA' : 'compB';
    const legend = ADV.map(a => ({ name: M.advName(a), color: M.advColor[a] }));
    const advSeries = (list) => ADV.map(a => ({ name: M.advName(a), color: M.advColor[a], data: list.map(x => x.s[a]) }));

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.kpi({ label: `${p.clientShort} share of spend`, sub: scope, value: fmt.pct(cur.client), span: 3, accent: 'blue', ...(prev ? { delta: cur.client - prev.client, deltaLabel: `${fmt.pp(cur.client - prev.client)} vs LY` } : {}) })}
      ${ui.kpi({ label: `Largest rival · ${M.advName(rival)}`, sub: 'share of spend', value: fmt.pct(cur[rival]), span: 3, ...(prev ? { delta: -(cur[rival] - prev[rival]), deltaLabel: `${fmt.pp(cur[rival] - prev[rival])} vs LY` } : {}) })}
      ${ui.kpi({ label: 'Share gap to rival', sub: cur.client >= cur[rival] ? `${p.clientShort} leads` : `${p.clientShort} trails`, value: fmt.pp(cur.client - cur[rival]), span: 3 })}
      ${ui.kpi({ label: 'Markets led', sub: `${p.clientShort} #1 by share of spend`, value: `${led} / ${M.MARKETS.length}`, span: 3 })}
    </div>
    <div class="grid" style="margin-top:16px">
      ${ui.card({ id: 'a-trend', span: 12, height: 'h-300', title: 'Share of spend by advertiser — trend', sub: `${catLabel} · ${ui.marketName(f.market)} · monthly · drag the slider to zoom`, legend,
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(ADV.map(a => ({ key: a, label: M.advName(a), num: true, fmt: fmt.pct }))), rows: M.MONTHS.map((mo, i) => ({ mo: mo.long, ...trend[i] })) }) })}
      ${ui.card({ id: 'a-ytd', span: 5, height: 'h-340', title: 'Year-to-date share by advertiser', sub: `${catLabel} · ${ui.marketName(f.market)}`, legend,
        table: () => ({ cols: [{ key: 'a', label: 'Advertiser' }].concat(per.map((pp, i) => ({ key: 'p' + i, label: pp.label, num: true, fmt: fmt.pct }))), rows: ADV.map(a => { const o = { a: M.advName(a) }; per.forEach((pp, i) => { o['p' + i] = pp.s[a]; }); return o; }) }),
        insight: prev ? `${ui.esc(p.clientShort)} ${cur.client >= prev.client ? 'gained' : 'lost'} <b>${fmt.pp(Math.abs(cur.client - prev.client)).replace('+', '')}</b> share vs last year and ${cur.client >= cur[rival] ? 'leads' : 'trails'} ${M.advName(rival)} by <b>${fmt.pp(Math.abs(cur.client - cur[rival])).replace('+', '')}</b>.` : null })}
      ${ui.card({ id: 'a-cy', span: 7, height: 'h-340', title: `${f.year} monthly share by advertiser`, sub: `${catLabel} · ${ui.marketName(f.market)}`, legend,
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(ADV.map(a => ({ key: a, label: M.advName(a), num: true, fmt: fmt.pct }))), rows: cy.map(x => ({ mo: x.label, ...x.s })) }) })}
    </div>`);
    M.charts.lines(document.getElementById('a-trend'), { x: M.MONTHS.map(m => m.long), series: ADV.map(a => ({ name: M.advName(a), color: M.advColor[a], data: trend.map(t => t[a]) })), yMin: 0, axisFmt: v => Math.round(v * 100) + '%', zoom: Math.round(100 * (1 - 21 / M.MONTHS.length)) });
    M.charts.stack100V(document.getElementById('a-ytd'), { labels: per.map(x => x.label), series: advSeries(per) });
    M.charts.stack100V(document.getElementById('a-cy'), { labels: cy.map(x => x.label), series: advSeries(cy) });
  }

  /* ---------- Brand ---------- */
  function brandTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('competitive'), p = d.persona;
    const view = M.loc('comp-view', 'trend');
    const cat = f.category === 'all' ? p.coreCategory : f.category;
    const defs = baseDefs(true, false);
    el.innerHTML = head('brand', defs, ctx(f, ` · <b>${cat}</b>`), viewToggle(view));
    const scope = `${cat} · ${ui.marketName(f.market)} · ${ui.periodLabel(f)}`;
    if (view === 'mix') return mixView(el, 'brand', q.filter(d.comp, { ...f, category: cat }), f, scope);

    const rows = q.filter(d.comp, { market: f.market, category: cat });
    const pers = periods(f);
    const shareMap = (rs) => { const m = q.brandSpend(rs); const t = [...m.values()].reduce((a, b) => a + b, 0) || 1; const o = new Map(); m.forEach((v, b) => o.set(b, v / t)); return o; };
    const cur = shareMap(rows.filter(pers[pers.length - 1].test));
    const prev = pers.length > 1 ? shareMap(rows.filter(pers[1].test)) : null;
    const list = d.brands.filter(b => b.category === cat);
    const ranked = list.map(b => ({ b, s: cur.get(b) || 0, ly: prev ? prev.get(b) || 0 : null })).sort((a, z) => z.s - a.s);
    const named = ranked.filter(x => x.b.adv !== 'others');
    const colorOf = (b) => M.SERIES[list.indexOf(b) % M.SERIES.length];
    const top = named.slice(0, 5).map(x => x.b);
    const months = M.MONTHS.filter(m => m.y >= f.year - 1 && m.y <= f.year);
    const trend = months.map(mo => shareMap(rows.filter(r => r.ym === mo.ym)));
    const clientBest = named.find(x => x.b.adv === 'client');
    const riser = prev ? named.slice().sort((a, z) => (z.s - z.ly) - (a.s - a.ly))[0] : null;

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.card({ id: 'b-rank', span: 5, height: 'h-380', title: 'Share of spend by brand', sub: `${scope} · bar colour = advertiser`, legend: ADV.map(a => ({ name: M.advName(a), color: M.advColor[a] })),
        table: () => ({ cols: [{ key: 'n', label: 'Brand' }, { key: 'a', label: 'Advertiser' }, { key: 's', label: 'SOS', num: true, fmt: fmt.pct }].concat(prev ? [{ key: 'ly', label: 'Last year', num: true, fmt: fmt.pct }, { key: 'dl', label: 'Change', num: true, fmt: v => fmt.pp(v) }] : []),
          rows: ranked.map(x => ({ n: x.b.name, a: M.advName(x.b.adv), s: x.s, ly: x.ly, dl: x.ly == null ? null : x.s - x.ly })) }),
        insight: clientBest ? `<b>${ui.esc(clientBest.b.name)}</b> is ${ui.esc(p.clientShort)}'s biggest ${cat.toLowerCase()} brand at ${fmt.pct(clientBest.s, 0)} share${riser ? `; fastest riser is <b>${ui.esc(riser.b.name)}</b> (${fmt.pp(riser.s - riser.ly)})` : ''}.` : null })}
      ${ui.card({ id: 'b-trend', span: 7, height: 'h-380', title: 'Top 5 brands — share of spend trend', sub: `${cat} · ${ui.marketName(f.market)} · ${f.year - 1}–${f.year} monthly`, legend: top.map(b => ({ name: b.name, color: colorOf(b), line: true })),
        table: () => ({ cols: [{ key: 'mo', label: 'Month' }].concat(top.map((b, i) => ({ key: 'b' + i, label: b.name, num: true, fmt: fmt.pct }))), rows: months.map((mo, j) => { const o = { mo: mo.long }; top.forEach((b, i) => { o['b' + i] = trend[j].get(b); }); return o; }) }) })}
    </div>`);
    M.charts.bars(document.getElementById('b-rank'), { labels: ranked.map(x => x.b.name), values: ranked.map(x => x.s), colors: ranked.map(x => M.advColor[x.b.adv]), fmt: v => fmt.pct(v) });
    M.charts.lines(document.getElementById('b-trend'), { x: months.map(m => m.long), series: top.map(b => ({ name: b.name, color: colorOf(b), data: trend.map(t => t.get(b) || 0) })), yMin: 0, axisFmt: v => Math.round(v * 100) + '%' });
  }

  /* ---------- Competitor creatives ---------- */
  function creativeTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('competitive'), p = d.persona;
    const quarters = [...new Set(d.compCreatives.map(c => c.quarter))].sort();
    const qtr = M.loc('comp-qtr', quarters[quarters.length - 1]), adv = M.loc('comp-cadv', 'all');
    const cat = f.category;
    const defs = [
      { html: ui.localSelect('comp-qtr', 'Quarter', quarters, qtr) },
      { key: 'market', label: 'Market', options: ui.opts.markets() },
      { key: 'category', label: 'Category', options: [{ value: 'all', label: 'All categories' }].concat(p.categories.map(c => ({ value: c, label: c }))) },
      { html: ui.localSelect('comp-cadv', 'Advertiser', advOpts(), adv) }
    ];
    el.innerHTML = head('creative', defs, `Top creatives are refreshed <b>quarterly</b>`);
    const all = d.compCreatives.filter(c => c.quarter === qtr && (f.market === 'all' || c.market === f.market) && (cat === 'all' || c.category === cat));
    const shown = all.filter(c => adv === 'all' || c.adv === adv).sort((a, b) => b.impressions - a.impressions).slice(0, 12);
    const plats = ['YouTube', 'Meta', 'TikTok', 'Display'];
    const counts = ADV.map(a => ({ a, v: plats.map(pl => all.filter(c => c.adv === a && c.platform === pl).length) }));
    const thumbBg = { client: 'linear-gradient(135deg,#5465FF,#93DFE3)', compA: 'linear-gradient(135deg,#D4A000,#FCFE67)', compB: 'linear-gradient(135deg,#00929F,#00DBEE)', others: 'linear-gradient(135deg,#A3A7BF,#E2E4F0)' };

    el.insertAdjacentHTML('beforeend', `<div class="grid">
      ${ui.card({ id: 'cc-count', span: 4, height: 'h-300', title: 'Creative count by platform', sub: `${qtr} · ${ui.marketName(f.market)} · ${cat === 'all' ? 'all categories' : cat}`, legend: ADV.map(a => ({ name: M.advName(a), color: M.advColor[a] })),
        table: () => ({ cols: [{ key: 'a', label: 'Advertiser' }].concat(plats.map((pl, i) => ({ key: 'p' + i, label: pl, num: true }))), rows: counts.map(c => { const o = { a: M.advName(c.a) }; c.v.forEach((v, i) => { o['p' + i] = v; }); return o; }) }) })}
      <div class="card span-8"><div class="card-head"><div><h3 class="card-title">Top creatives</h3><p class="card-sub">Highest estimated impressions · ${adv === 'all' ? 'all advertisers' : M.advName(adv)} · ${qtr}</p></div></div>
        ${shown.length ? `<div class="cgrid">${shown.map(c => `<div class="ccard">
          <div class="cthumb" style="background:${thumbBg[c.adv]}"><span class="fmt">${c.format}</span><span class="plat">${c.platform}</span></div>
          <div class="cbody"><b>${ui.esc(c.name)}</b><span>${M.advName(c.adv)} · ${ui.marketName(c.market)}</span><span>${c.category} · ${fmt.num(c.impressions)} est. impr.</span></div></div>`).join('')}</div>`
          : '<p class="card-sub">No creatives match these filters.</p>'}
      </div></div>`);
    const n = ADV.length;
    M.charts.init(document.getElementById('cc-count'), {
      grid: { left: 8, right: 8, top: 10, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => M.tip(ps[0].axisValue, ps.map(x => ({ color: x.color, name: x.seriesName, value: x.value }))) },
      xAxis: { type: 'category', data: plats, axisTick: { show: false }, axisLine: { lineStyle: { color: M.LINE } }, axisLabel: { color: M.INK2 } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#EEF0F7' } }, axisLabel: { color: M.MUTED } },
      series: counts.map((c, i) => ({ name: M.advName(c.a), type: 'bar', stack: 'n', data: c.v, barMaxWidth: 44, itemStyle: { color: M.advColor[c.a], borderColor: '#fff', borderWidth: 1, borderRadius: i === n - 1 ? [4, 4, 0, 0] : 0 } }))
    });
  }

  /* ---------- Spends report ---------- */
  function reportTab(el) {
    const ui = M.ui, d = M.data, f = M.filters('competitive');
    el.innerHTML = head('report', baseDefs(true), ctx(f, ` · <b>${f.category === 'all' ? 'All categories' : f.category}</b>`));
    const rows = q.filter(d.comp, f);
    const total = q.sum(rows, 'spend') || 1;
    const out = [];
    for (const a of ADV) {
      const ar = rows.filter(r => r.adv === a);
      const chs = q.mixSpend(ar, 'channel')[a] || {};
      const aTot = q.sum(ar, 'spend');
      out.push({ lvl: 0, name: M.advName(a), ...chs, total: aTot, sos: aTot / total });
      const bs = [...q.brandSpend(ar).entries()].reduce((m, [b, v]) => m.set(b.name, (m.get(b.name) || 0) + v), new Map());
      [...bs.entries()].sort((x, y) => y[1] - x[1]).forEach(([n, v]) => {
        const share = aTot ? v / aTot : 0;
        const o = { lvl: 1, name: n, total: v, sos: v / total };
        M.CHANNELS.forEach(c => { o[c] = (chs[c] || 0) * share; });
        out.push(o);
      });
    }
    const grand = { lvl: 0, name: 'Total', total, sos: 1 }; M.CHANNELS.forEach(c => { grand[c] = out.filter(r => r.lvl === 0).reduce((s, r) => s + (r[c] || 0), 0); });
    const cols = [{ key: 'name', label: 'Advertiser / brand' }].concat(M.CHANNELS.map(c => ({ key: c, label: c, num: true, raw: v => Math.round(v || 0) })), [{ key: 'total', label: 'Total', num: true, raw: v => Math.round(v) }, { key: 'sos', label: 'SOS', num: true, raw: v => (v * 100).toFixed(2) }]);

    el.insertAdjacentHTML('beforeend', `
      <div class="card callout-warn banner" role="note"><span class="ico-warn" aria-hidden="true">!</span>
        <div><h3 class="card-title">Disclaimer on absolute spends</h3>
        <p>Prioritise <b>share of spend (SOS)</b> and <b>share of voice (SOV)</b> when comparing advertisers. Absolute spends and impressions are the output of statistical modelling, not figures reported by media platforms — use them directionally and with caution, not as exact values for critical decisions.</p></div></div>
      <div class="grid">
      <div class="card span-12"><div class="card-head"><div><h3 class="card-title">Total media spends report</h3><p class="card-sub">Estimated spend by advertiser, brand and channel · ${ui.marketName(f.market)} · ${ui.periodLabel(f)}</p></div>
        <div class="card-tools"><button class="btn btn-lime" id="csv">Export CSV</button></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>${out.map(r => `<tr class="${r.lvl === 0 ? 'grp-row' : ''}"><td>${r.lvl ? `<span class="indent">${ui.esc(r.name)}</span>` : `<b>${ui.esc(r.name)}</b>`}</td>${M.CHANNELS.map(c => `<td class="num">${fmt.money(r[c] || 0)}</td>`).join('')}<td class="num"><b>${fmt.money(r.total)}</b></td><td class="num">${fmt.pct(r.sos)}</td></tr>`).join('')}
        <tr class="total"><td>Total</td>${M.CHANNELS.map(c => `<td class="num">${fmt.money(grand[c])}</td>`).join('')}<td class="num">${fmt.money(total)}</td><td class="num">100%</td></tr></tbody></table></div></div>
    </div>`);
    document.getElementById('csv').addEventListener('click', () => ui.downloadCsv(`competitive-spends-${f.year}.csv`, cols, out.concat([grand])));
  }

  /* ---------- Introduction ---------- */
  function introTab(el) {
    const ui = M.ui;
    el.innerHTML = head('introduction') + `<div class="grid">
      <div class="card span-7"><div class="eyebrow">Please read before using the reports</div><h3 class="card-title" style="margin:6px 0 10px">Methodology</h3>
        <ul class="bullets">
          <li>Combines <b>traditional media tracking</b> (TV and OOH from measurement partners) with <b>digital ad tracking</b> from AdClarity.</li>
          <li>Where OOH measurement isn't available, market intelligence and indexing are used and agreed with the client.</li>
          <li>Digital data must reach <b>70% spend coverage</b> to be conclusive; WPP Media calibrates it against the client's actual media spend.</li>
          <li>Excluded digital channels: in-app publishers, paid search, OTT and subscription services, e-commerce. Open-web display and video are excluded in Malaysia and Thailand.</li>
          <li>Spend is modelled as media impact (impressions, GRPs) × the client's media cost, for a like-for-like comparison across advertisers.</li>
          <li><b>Share of spend</b> is the only metric to compare across advertisers.</li>
        </ul></div>
      <div class="card span-5"><h3 class="card-title" style="margin-bottom:10px">Data coverage</h3>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Market</th><th>TV</th><th>OOH</th><th class="num">Digital coverage</th></tr></thead>
        <tbody>${M.MARKETS.map(m => { const c = M.COVERAGE[m.code]; return `<tr><td><b>${m.name}</b>${c.note ? `<br><small class="muted">${c.note}</small>` : ''}</td><td>${c.tv}</td><td>${c.ooh}</td><td class="num"><span class="status ${c.digital >= 0.7 ? 'good' : 'bad'}">${c.digital >= 0.7 ? '✓' : '✕'} ${fmt.pct(c.digital, 0)}</span></td></tr>`; }).join('')}</tbody></table></div>
        <p class="card-sub" style="margin-top:8px">Digital coverage must be ≥70% of spend for results to be conclusive.</p></div>
      <div class="card span-7"><h3 class="card-title" style="margin-bottom:10px">Glossary</h3>
        <table class="tbl wrap"><tbody>
          <tr><td><b>SOS</b></td><td>Share of spend — an advertiser's estimated spend as a share of all tracked spend in the selection.</td></tr>
          <tr><td><b>SOV</b></td><td>Share of voice — share of impressions or GRPs in the selection.</td></tr>
          <tr><td><b>Estimated spend</b></td><td>Modelled spend (media impact × client media cost). Directional only.</td></tr>
          <tr><td><b>Others</b></td><td>All tracked advertisers outside the named competitor set.</td></tr>
        </tbody></table></div>
      <div class="card span-5"><h3 class="card-title" style="margin-bottom:10px">FAQ</h3>
        <details open><summary>How often is the data refreshed?</summary><p>Monthly for share of spend; quarterly for top creatives. Last refresh: ${M.APP.lastRefreshed}.</p></details>
        <details><summary>Why not compare absolute spends?</summary><p>Spends are modelled; share metrics remove most of the modelling bias.</p></details>
        <details><summary>How do I request access for my team?</summary><p>Contact your WPP Media data &amp; intelligence lead.</p></details></div>
    </div>`;
  }

  M.modules.competitive = {
    render(el, tab) {
      tab = TABS.some(t => t.key === tab) ? tab : 'category';
      ({ introduction: introTab, category: categoryTab, advertiser: advertiserTab, brand: brandTab, creative: creativeTab, report: reportTab })[tab](el);
    }
  };
})();
