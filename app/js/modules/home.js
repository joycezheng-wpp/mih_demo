(function () {
  const M = window.MIH;
  const ICON = {
    exec: '<path d="M5 19V10M12 19V5M19 19v-7" stroke-width="2.4" stroke-linecap="round"/>',
    media: '<path d="M4 14v-4l11-5v14l-11-5Zm11-1.5h2.5a2.5 2.5 0 0 0 0-5H15M7 14l1.5 5h3L10 15" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>',
    comp: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4m-4 3v4m-4 3h8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    creative: '<path d="M12 4a8 8 0 1 0 0 16c1.2 0 1.6-1 1.1-1.9-.6-1 .1-2.1 1.2-2.1H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z" stroke-width="2" fill="none"/><circle cx="8" cy="11" r="1.3"/><circle cx="11" cy="7.8" r="1.3"/><circle cx="15" cy="8.6" r="1.3"/>',
    ai: '<rect x="5" y="8" width="14" height="11" rx="3" stroke-width="2" fill="none"/><path d="M12 4v4M9.5 13h.01M14.5 13h.01M3 13v2m18-2v2" stroke-width="2.4" stroke-linecap="round"/>'
  };
  const icon = (k, bg, fg) => `<div class="ico" style="background:${bg}"><svg width="24" height="24" viewBox="0 0 24 24" stroke="${fg}" fill="${fg}">${ICON[k]}</svg></div>`;
  M.icon = icon;

  M.modules = M.modules || {};
  M.modules.home = {
    render(el) {
      const d = M.data, p = d.persona, q = M.q;
      const ytd = { year: 2026, month: 'all', market: 'all' };
      const spend = q.sum(q.filter(d.media, ytd), 'spend');
      const sos = q.sos(q.filter(d.comp, { ...ytd, category: p.coreCategory })).client;
      const adh = q.adherence(q.filter(d.creatives, ytd));

      const modules = [
        { k: 'exec', href: '#/exec', t: 'Executive Summary', bg: '#000050', fg: '#B0F467', src: 'All sources',
          d: `One-page view of competitive share, media investment, performance and creative health across ${M.MARKETS.length} markets.` },
        { k: 'media', href: '#/media/investment', t: 'Media Report', bg: '#E8EAFF', fg: '#5465FF', src: 'Media tracker',
          d: 'Deep dive into investment, social, planning and performance KPIs, by market against the regional benchmark.' },
        { k: 'comp', href: '#/competitive/category', t: 'Competitive Report', bg: '#E0F7F8', fg: '#00929F', src: 'AdClarity · TV/OOH',
          d: 'Monitor share of spend by category, advertiser and brand, plus competitor creatives and channel mix.' },
        { k: 'creative', href: '#/creative/adherence', t: 'Creative Report', bg: '#F1EAFB', fg: '#7A3FB8', src: 'Vidmob',
          d: 'Track creative adherence to best practice, performance by element, brand vs creator and a searchable library.' }
      ];

      el.innerHTML = `
      <section class="hero">
        <div>
          <div class="eyebrow">WPP Media · ${M.APP.name}</div>
          <h1>Every media decision for ${M.ui.esc(p.client)}, in one place.</h1>
          <p>One unified hub for ${M.APP.region} media reporting — competitive intelligence, media investment, performance and creative effectiveness, with an AI assistant on top.</p>
          <div class="hero-actions">
            <a class="btn btn-lime" href="#/exec">Open Executive Summary →</a>
            <button class="btn btn-ghost-light" data-open-ai>Ask the AI Assistant</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span>Paid media investment · YTD 2026</span><b>${M.fmt.money(spend)}</b><small>across ${M.MARKETS.length} ${M.APP.region} markets</small></div>
          <div class="hero-stat"><span>${M.ui.esc(p.coreCategory)} share of spend · YTD</span><b>${M.fmt.pct(sos)}</b><small>${M.ui.esc(p.clientShort)} vs all tracked advertisers</small></div>
          <div class="hero-stat"><span>Creative adherence · YTD</span><b>${M.fmt.pct(adh, 0)}</b><small>impression-weighted, against an 80% target</small></div>
        </div>
      </section>

      ${M.ui.sectionHead('Platform modules')}
      <div class="modules">
        ${modules.map(m => `<a class="module" href="${m.href}">
            ${icon(m.k, m.bg, m.fg)}<h3>${m.t}</h3><p>${m.d}</p><span class="src">${m.src}</span>
            <span class="go">Open <span aria-hidden="true">→</span></span></a>`).join('')}
        <button class="module ai" data-open-ai>
          ${icon('ai', '#B0F467', '#000050')}<h3>AI Assistant</h3>
          <p>Ask questions about any data in the hub in plain language — spend, share of spend, adherence, top creatives.</p>
          <span class="src">All sources</span><span class="go">Start a chat <span aria-hidden="true">→</span></span>
        </button>
      </div>

      <div class="grid" style="margin-top:16px">
        <div class="card span-7">
          <div class="card-head"><div><h3 class="card-title">Markets covered</h3><p class="card-sub">${M.MARKETS.length} markets · one regional benchmark</p></div></div>
          <div class="market-chips">${M.MARKETS.map(m => `<span class="market-chip"><b>${m.code}</b>${m.name}</span>`).join('')}</div>
        </div>
        <div class="card span-5">
          <div class="card-head"><div><h3 class="card-title">Integrated data sources</h3></div></div>
          <ul class="source-list">
            <li><div><b>Media tracker</b><span>Investment, channel mix, planning and delivery KPIs</span></div></li>
            <li><div><b>AdClarity + TV/OOH measurement</b><span>Competitive share of spend and share of voice</span></div></li>
            <li><div><b>Vidmob</b><span>Creative adherence, element tagging and performance</span></div></li>
            <li><div><b>AI Assistant</b><span>Natural-language questions across every source</span></div></li>
          </ul>
        </div>
      </div>`;
    }
  };
})();
