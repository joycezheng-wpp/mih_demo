(function () {
  const M = window.MIH;
  const ADV = ['client', 'compA', 'compB', 'others'];

  // Same period last year (YTD is like-for-like: only months that exist this year).
  function lastYear(rows, f) {
    if (f.year === 'all') return [];
    const maxM = Math.max(...M.MONTHS.filter(m => m.y === +f.year).map(m => m.m));
    return M.q.filter(rows, { ...f, year: +f.year - 1 }).filter(r => f.month !== 'all' || r.m <= maxM);
  }
  const ratio = (rows, a, b = 'spend') => { const d = M.q.sum(rows, b); return d ? M.q.sum(rows, a) / d : null; };

  M.modules.exec = {
    render(el) {
      const d = M.data, p = d.persona, q = M.q, fmt = M.fmt, ui = M.ui;
      const f = M.filters('exec');
      const period = ui.periodLabel(f), mkt = ui.marketName(f.market);

      /* ---------- KPIs ---------- */
      const media = q.filter(d.media, f), mediaLY = lastYear(d.media, f);
      const compCore = q.filter(d.comp, { ...f, category: p.coreCategory });
      const compCoreLY = lastYear(d.comp, { ...f, category: p.coreCategory });
      const sos = q.sos(compCore).client, sosLY = compCoreLY.length ? q.sos(compCoreLY).client : null;
      const spend = q.sum(media, 'spend'), spendLY = q.sum(mediaLY, 'spend');
      const share = (k) => [ratio(media, k), mediaLY.length ? ratio(mediaLY, k) : null];
      const [dig, digLY] = share('digital'), [soc, socLY] = share('social'), [ret, retLY] = share('retail'), [fpd, fpdLY] = share('firstParty');
      const ppDelta = (a, b) => (b == null ? {} : { delta: a - b, deltaLabel: `${fmt.pp(a - b)} vs LY` });

      const kpis = [
        ui.kpi({ label: 'Competitive SOS', sub: `${ui.esc(p.clientShort)} share of spend · ${ui.esc(p.coreCategory)}`, value: fmt.pct(sos, 0), ...ppDelta(sos, sosLY), accent: 'blue' }),
        ui.kpi({ label: 'Investment', sub: 'Total paid media', value: fmt.money(spend), ...(spendLY ? { delta: spend / spendLY - 1, deltaLabel: `${fmt.pp(spend / spendLY - 1).replace('pp', '%')} vs LY` } : {}) }),
        ui.kpi({ label: 'Digital spend %', sub: 'of total investment', value: fmt.pct(dig, 0), ...ppDelta(dig, digLY) }),
        ui.kpi({ label: 'Social + influencer %', sub: 'of total investment', value: fmt.pct(soc, 0), ...ppDelta(soc, socLY) }),
        ui.kpi({ label: 'Retail media %', sub: 'of total investment', value: fmt.pct(ret, 1), ...ppDelta(ret, retLY) }),
        ui.kpi({ label: '1PD spend %', sub: 'first-party data activation', value: fmt.pct(fpd, 1), ...ppDelta(fpd, fpdLY) })
      ].join('');

      /* ---------- Competitive ---------- */
      const sosByMarket = M.MARKETS.map(m => ({ m, s: q.sos(q.filter(d.comp, { ...f, market: m.code, category: p.coreCategory })) }));
      const leads = sosByMarket.filter(x => x.s.client > Math.max(x.s.compA, x.s.compB, x.s.others));
      const weakest = sosByMarket.slice().sort((a, b) => a.s.client - b.s.client)[0];
      const sosByCat = p.categories.map(c => ({ c, s: q.sos(q.filter(d.comp, { ...f, category: c })) }));
      const bestCat = sosByCat.slice().sort((a, b) => b.s.client - a.s.client)[0];
      const worstCat = sosByCat.slice().sort((a, b) => a.s.client - b.s.client)[0];
      const advLegend = ADV.map(a => ({ name: M.advName(a), color: M.advColor[a] }));
      const sosTable = (list, key, label) => () => ({
        cols: [{ key: 'name', label }].concat(ADV.map(a => ({ key: a, label: M.advName(a), num: true, fmt: fmt.pct }))),
        rows: list.map(x => ({ name: key(x), ...x.s }))
      });

      /* ---------- Investment ---------- */
      const months = q.monthsOfYear(f.year);
      const byMonth = months.map(mo => q.filter(d.media, { year: f.year, month: mo.m, market: f.market }));
      const hi = f.month === 'all' ? null : months.findIndex(mo => mo.m === +f.month);
      const series = (k) => byMonth.map(rs => q.sum(rs, k));
      const tot = series('spend'), digS = series('digital'), socS = series('social');
      const digShare = digS.map((v, i) => v / tot[i]), socShare = socS.map((v, i) => v / tot[i]);
      const peak = (arr) => arr.indexOf(Math.max(...arr));
      const monthTable = (part, label, shr) => () => ({
        cols: [{ key: 'mo', label: 'Month' }, { key: 'tot', label: 'Total investment', num: true, fmt: v => fmt.money(v) },
          { key: 'part', label, num: true, fmt: v => fmt.money(v) }, { key: 'sh', label: label + ' %', num: true, fmt: fmt.pct }],
        rows: months.map((mo, i) => ({ mo: mo.long, tot: tot[i], part: part[i], sh: shr[i] }))
      });

      /* ---------- Performance ---------- */
      const bs = byMonth.map(rs => q.wavg(rs, 'brandSafety')), vw = byMonth.map(rs => q.wavg(rs, 'viewability')), vt = byMonth.map(rs => q.wavg(rs, 'vtr50'));

      /* ---------- Creative ---------- */
      const cr = q.filter(d.creatives, { year: f.year, month: f.month });
      const cols = f.market === 'all' ? M.MARKETS : M.MARKETS.filter(m => m.code === f.market);
      const crM = cr.filter(c => f.market === 'all' || c.market === f.market);
      const heatRows = M.PLATFORMS.map(pl => ({ pl, cells: cols.map(m => q.adherence(crM.filter(c => c.platform === pl && c.market === m.code))), total: q.adherence(crM.filter(c => c.platform === pl)) }));
      const colTotals = cols.map(m => q.adherence(crM.filter(c => c.market === m.code)));
      const overallAdh = q.adherence(crM);
      const below = heatRows.flatMap(r => r.cells).filter(v => v != null && v < M.ADHERENCE_TARGET).length;
      const cellsN = heatRows.flatMap(r => r.cells).filter(v => v != null).length;
      const worstPl = heatRows.filter(r => r.total != null).sort((a, b) => a.total - b.total)[0];
      const top = crM.filter(c => c.vtr50 != null && c.impressions >= 10000).sort((a, b) => b.vtr50 - a.vtr50)[0];

      const heatHtml = crM.length ? `<div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Platform</th>${cols.map(m => `<th class="num" title="${m.name}">${cols.length > 1 ? m.code : m.name}</th>`).join('')}<th class="num">Total</th></tr></thead>
          <tbody>${heatRows.map(r => `<tr><td><b>${r.pl}</b></td>${r.cells.map(v => `<td class="num">${ui.status(v)}</td>`).join('')}<td class="num">${ui.status(r.total)}</td></tr>`).join('')}
          <tr class="total"><td>Total</td>${colTotals.map(v => `<td class="num">${ui.status(v)}</td>`).join('')}<td class="num">${ui.status(overallAdh)}</td></tr></tbody>
        </table></div>${ui.statusKey()}` : `<p class="card-sub">No creatives tracked for ${period}. Creative tracking starts July 2025.</p>`;

      const topHtml = top ? `<div class="creative-hero">
          <div class="thumb"><div class="play"><svg width="18" height="18" viewBox="0 0 24 24" fill="#B0F467"><path d="M7 4l13 8-13 8z"/></svg></div><span class="fmt">${top.format}</span></div>
          <div>
            <div class="eyebrow">#1 by VTR 50%</div>
            <h3 style="margin:4px 0 2px;font-size:18px">${ui.esc(top.name)}</h3>
            <div class="card-sub">${ui.marketName(top.market)} · ${top.platform} · ${ui.esc(top.brand)}</div>
            <div class="metric-row"><div><span>VTR 50%</span><b>${fmt.pct(top.vtr50)}</b></div><div><span>CTR</span><b>${fmt.pct(top.ctr, 2)}</b></div><div><span>Impr.</span><b>${fmt.num(top.impressions)}</b></div></div>
            <div class="chips"><span class="chip">${top.story}</span><span class="chip">${top.sound}</span><span class="chip">${top.emotion}</span><span class="chip">${top.source} content</span></div>
            <div class="kv">Adherence <b>${fmt.pct(top.adherence, 0)}</b> · ${top.daysLive} days live · ${top.id}</div>
          </div></div>` : `<p class="card-sub">No creatives with 10K+ impressions in this period.</p>`;

      el.innerHTML = `
        ${ui.pageHead({ eyebrow: `${p.client} · ${M.APP.region}`, title: 'Executive Summary', sub: 'Competitive share, investment, performance and creative health at a glance.' })}
        ${ui.filterBar([
          { key: 'year', label: 'Year', options: ui.opts.years() },
          { key: 'month', label: 'Month', options: ui.opts.months(f.year) },
          { key: 'market', label: 'Market', options: ui.opts.markets() }
        ], f, `Showing <b>${mkt}</b> · <b>${period}</b>`)}
        <div class="grid">${kpis}</div>

        ${ui.sectionHead('Competitive share of spend', { href: '#/competitive/category', label: 'Competitive Report' })}
        <div class="grid">
          ${ui.card({ id: 'c-sos-mkt', span: 6, height: 'h-340', title: `${p.coreCategory} SOS by market`, sub: `Share of spend · ${period} · all markets`, legend: advLegend,
            table: sosTable(sosByMarket, x => x.m.name, 'Market'),
            insight: `${ui.esc(p.clientShort)} leads ${p.coreCategory.toLowerCase()} spend in <b>${leads.length} of ${M.MARKETS.length}</b> markets. ${weakest.m.name} is the gap to close at <b>${fmt.pct(weakest.s.client, 0)}</b> share.` })}
          ${ui.card({ id: 'c-sos-cat', span: 6, height: 'h-340', title: 'SOS by category', sub: `Share of spend · ${mkt} · ${period}`, legend: advLegend,
            table: sosTable(sosByCat, x => x.c, 'Category'),
            insight: `Strongest in <b>${bestCat.c}</b> (${fmt.pct(bestCat.s.client, 0)}); <b>${worstCat.c}</b> is under-invested at ${fmt.pct(worstCat.s.client, 0)} share.` })}
        </div>

        ${ui.sectionHead('Investment', { href: '#/media/investment', label: 'Media Report' })}
        <div class="grid">
          ${ui.card({ id: 'c-dig', span: 6, height: 'h-340', title: 'Digital investment', sub: `Monthly investment (top) and digital share (bottom) · ${mkt} · ${f.year}`,
            legend: [{ name: 'Digital', color: M.SERIES[0] }, { name: 'Non-digital', color: '#C8CBDD' }, { name: 'Digital %', color: M.SERIES[2], line: true }],
            table: monthTable(digS, 'Digital', digShare),
            insight: `Digital is <b>${fmt.pct(dig, 0)}</b> of investment${digLY != null ? ` (${fmt.pp(dig - digLY)} vs last year)` : ''}; spend peaked in <b>${months[peak(tot)].label}</b> at ${fmt.money(tot[peak(tot)])}.` })}
          ${ui.card({ id: 'c-soc', span: 6, height: 'h-340', title: 'Social + influencer', sub: `Monthly investment (top) and social + influencer share (bottom) · ${mkt} · ${f.year}`,
            legend: [{ name: 'Social + influencer', color: M.SERIES[0] }, { name: 'Other media', color: '#C8CBDD' }, { name: 'Social + influencer %', color: M.SERIES[2], line: true }],
            table: monthTable(socS, 'Social + influencer', socShare),
            insight: `Social + influencer holds at <b>${fmt.pct(soc, 0)}</b> of spend, with its highest share in <b>${months[peak(socShare)].label}</b> (${fmt.pct(socShare[peak(socShare)], 0)}).` })}
        </div>

        ${ui.sectionHead('Performance', { href: '#/media/performance', label: 'Media Report' })}
        <div class="grid">
          ${ui.card({ id: 'c-bs', span: 6, height: 'h-240', title: 'Brand safety', sub: `Combined IAS + Zefr verification · ${mkt}`,
            table: () => ({ cols: [{ key: 'mo', label: 'Month' }, { key: 'v', label: 'Brand safety', num: true, fmt: v => fmt.pct(v, 2) }], rows: months.map((mo, i) => ({ mo: mo.long, v: bs[i] })) }),
            insight: `Brand safety stayed above <b>${fmt.pct(Math.min(...bs), 2)}</b> every month — no action needed.` })}
          ${ui.card({ id: 'c-vw', span: 6, height: 'h-240', title: 'Viewability & VTR 50%', sub: `Viewability: online video & display · VTR 50%: social · ${mkt}`,
            legend: [{ name: 'Viewability', color: M.SERIES[0], line: true }, { name: 'VTR 50%', color: M.SERIES[3], line: true }],
            table: () => ({ cols: [{ key: 'mo', label: 'Month' }, { key: 'a', label: 'Viewability', num: true, fmt: fmt.pct }, { key: 'b', label: 'VTR 50%', num: true, fmt: fmt.pct }], rows: months.map((mo, i) => ({ mo: mo.long, a: vw[i], b: vt[i] })) }),
            insight: `Viewability averages <b>${fmt.pct(q.wavg(media, 'viewability'), 0)}</b>; social VTR 50% is <b>${fmt.pct(q.wavg(media, 'vtr50'))}</b> — the creative lever below is where to lift it.` })}
        </div>

        ${ui.sectionHead('Creative', { href: '#/creative/adherence', label: 'Creative Report' })}
        <div class="grid">
          ${ui.card({ id: 'c-adh', span: 7, title: 'In-flight creative adherence', sub: `Impression-weighted adherence to mandatory best practice · ${period} · ${mkt}`, body: heatHtml,
            insight: crM.length ? `Overall adherence is <b>${fmt.pct(overallAdh, 0)}</b> vs the 80% target; <b>${below} of ${cellsN}</b> platform–market cells are below target, led by <b>${worstPl.pl}</b> (${fmt.pct(worstPl.total, 0)}).` : null })}
          ${ui.card({ id: 'c-top', span: 5, title: 'Top creative', sub: `Highest VTR 50% (min. 10K impressions) · ${period} · ${mkt}`, body: topHtml })}
        </div>`;

      /* ---------- Draw charts ---------- */
      const advSeries = (list) => ADV.map(a => ({ name: M.advName(a), color: M.advColor[a], data: list.map(x => x.s[a]) }));
      M.charts.stack100H(document.getElementById('c-sos-mkt'), { labels: sosByMarket.map(x => x.m.name), series: advSeries(sosByMarket), highlight: f.market === 'all' ? null : mkt });
      M.charts.stack100H(document.getElementById('c-sos-cat'), { labels: sosByCat.map(x => x.c), series: advSeries(sosByCat), highlight: p.coreCategory });
      const ml = months.map(mo => mo.label);
      M.charts.spendShare(document.getElementById('c-dig'), { months: ml, part: digS, rest: tot.map((v, i) => v - digS[i]), partName: 'Digital', restName: 'Non-digital', share: digShare, shareName: 'Digital %', highlightIdx: hi });
      M.charts.spendShare(document.getElementById('c-soc'), { months: ml, part: socS, rest: tot.map((v, i) => v - socS[i]), partName: 'Social + influencer', restName: 'Other media', share: socShare, shareName: 'Social + influencer %', highlightIdx: hi });
      M.charts.lines(document.getElementById('c-bs'), { x: ml, series: [{ name: 'Brand safety', color: M.SERIES[0], data: bs }], yMin: 0.995, yMax: 1, fmt: v => fmt.pct(v, 2), axisFmt: v => (v * 100).toFixed(1) + '%' });
      M.charts.lines(document.getElementById('c-vw'), { x: ml, series: [{ name: 'Viewability', color: M.SERIES[0], data: vw }, { name: 'VTR 50%', color: M.SERIES[3], data: vt }], yMin: 0, yMax: 1, axisFmt: v => Math.round(v * 100) + '%' });
    }
  };
})();
