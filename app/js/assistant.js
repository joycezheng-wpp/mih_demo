/* AI Assistant (demo). Answers natural-language questions from the hub's dataset
   with a lightweight intent parser, so it works offline in a pitch. In production
   this panel would call an LLM with tool access to the same queries. */
(function () {
  const M = window.MIH;
  const q = () => M.q, fmt = () => M.fmt;
  const MONTHS_FULL = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  function parse(text) {
    const t = text.toLowerCase();
    const p = M.data.persona;
    let market = 'all';
    for (const m of M.MARKETS) {
      if (t.includes(m.name.toLowerCase()) || new RegExp(`\\b${m.code}\\b`).test(text)) { market = m.code; break; }
    }
    const ym = t.match(/\b(2025|2026)\b/);
    let year = ym ? +ym[1] : 2026, month = 'all';
    MONTHS_FULL.forEach((mn, i) => {
      if (new RegExp(`\\b(${mn}|${mn.slice(0, 3)})\\b`).test(t) && !(mn === 'may' && /\bmay i\b/.test(t))) month = i + 1;
    });
    if (/last month|latest month/.test(t)) { year = 2026; month = 9; }
    if (/last year/.test(t)) year = 2025;
    if (year === 2026 && month !== 'all' && month > 9) month = 'all';
    const platform = M.PLATFORMS.find(pl => t.includes(pl.toLowerCase())) || null;
    const category = p.categories.find(c => t.includes(c.toLowerCase())) || null;
    return { t, f: { year, month, market }, platform, category };
  }

  const mediaMetrics = {
    spend: { label: 'total investment', calc: rs => q().sum(rs, 'spend'), f: v => fmt().money(v) },
    digital: { label: 'digital share of spend', calc: rs => q().sum(rs, 'digital') / q().sum(rs, 'spend'), f: v => fmt().pct(v) },
    social: { label: 'social + influencer share', calc: rs => q().sum(rs, 'social') / q().sum(rs, 'spend'), f: v => fmt().pct(v) },
    retail: { label: 'retail media share', calc: rs => q().sum(rs, 'retail') / q().sum(rs, 'spend'), f: v => fmt().pct(v) },
    firstParty: { label: '1PD spend share', calc: rs => q().sum(rs, 'firstParty') / q().sum(rs, 'spend'), f: v => fmt().pct(v, 2) },
    viewability: { label: 'viewability', calc: rs => q().wavg(rs, 'viewability'), f: v => fmt().pct(v) },
    vtr50: { label: 'social VTR 50%', calc: rs => q().wavg(rs, 'vtr50'), f: v => fmt().pct(v) },
    brandSafety: { label: 'brand safety rate', calc: rs => q().wavg(rs, 'brandSafety'), f: v => fmt().pct(v, 2) }
  };
  function metricOf(t) {
    if (/digital/.test(t)) return 'digital';
    if (/social|influencer/.test(t)) return 'social';
    if (/retail/.test(t)) return 'retail';
    if (/1pd|first[- ]party/.test(t)) return 'firstParty';
    if (/viewab/.test(t)) return 'viewability';
    if (/vtr|view.?through/.test(t)) return 'vtr50';
    if (/brand safe/.test(t)) return 'brandSafety';
    if (/spend|invest|budget/.test(t)) return 'spend';
    return null;
  }
  const absPp = (v) => (Math.abs(v) * 100).toFixed(1) + 'pp';
  const where = (f) => `${M.ui.marketName(f.market)} · ${M.ui.periodLabel(f)}`;
  const src = (s, link) => `<span class="src">Source: ${s}${link ? ` · <a href="${link[0]}">${link[1]} →</a>` : ''}</span>`;

  function answer(text) {
    const { t, f, platform, category } = parse(text);
    const d = M.data, p = d.persona, Q = q(), F = fmt();

    if (/^(hi|hello|hey)\b|help|what can you/.test(t)) {
      return `Hi! I can answer questions about ${M.ui.esc(p.clientShort)}'s data in the hub, for example:<ul>
        <li>Investment and channel shares by market or month</li><li>Share of spend vs competitors by category</li>
        <li>Creative adherence by platform or market</li><li>Top-performing creatives</li></ul>Try one of the suggestions below.`;
    }

    // Competitive share of spend
    if (/sos|share of spend|competit|competitor|vs |versus|leader|leading/.test(t) && !/digital|social|retail/.test(t)) {
      const cat = category || p.coreCategory;
      if (/which market|where|lowest|highest|weakest|strongest/.test(t) && f.market === 'all') {
        const rows = M.MARKETS.map(m => ({ m, s: Q.sos(Q.filter(d.comp, { ...f, market: m.code, category: cat })).client })).sort((a, b) => b.s - a.s);
        const low = /lowest|weakest|worst|where/.test(t);
        const list = low ? rows.slice().reverse() : rows;
        return `${low ? 'Lowest' : 'Highest'} ${cat} share of spend for ${M.ui.esc(p.clientShort)} (${M.ui.periodLabel(f)}):<ul>${list.slice(0, 3).map(r => `<li><b>${r.m.name}</b>: ${F.pct(r.s)}</li>`).join('')}</ul>${src('AdClarity + TV/OOH', ['#/competitive/advertiser', 'Competitive Report'])}`;
      }
      const s = Q.sos(Q.filter(d.comp, { ...f, category: cat }));
      const rival = s.compA > s.compB ? ['compA', s.compA] : ['compB', s.compB];
      const lead = s.client >= rival[1];
      return `In <b>${cat}</b> (${where(f)}), ${M.ui.esc(p.clientShort)} holds <b>${F.pct(s.client)}</b> share of spend vs ${M.advName(rival[0])} at ${F.pct(rival[1])} — ${lead ? 'a lead' : 'a gap'} of <b>${absPp(s.client - rival[1])}</b>.${src('AdClarity + TV/OOH', ['#/competitive/advertiser', 'Competitive Report'])}`;
    }

    // Creative adherence
    if (/adheren|guideline|best practice|complian/.test(t)) {
      const cr = Q.filter(d.creatives, { year: f.year, month: f.month, market: f.market });
      if (!cr.length) return `No creatives are tracked for ${where(f)}. Creative tracking starts July 2025.`;
      if (platform) {
        const a = Q.adherence(cr.filter(c => c.platform === platform));
        return `${platform} adherence for ${where(f)} is <b>${F.pct(a, 0)}</b> against the 80% target (${a >= 0.8 ? 'on target ✓' : absPp(a - 0.8) + ' below'}).${src('Vidmob', ['#/creative/adherence', 'Creative Report'])}`;
      }
      const by = M.PLATFORMS.map(pl => ({ pl, a: Q.adherence(cr.filter(c => c.platform === pl)) })).filter(x => x.a != null).sort((x, y) => x.a - y.a);
      return `Overall creative adherence for ${where(f)} is <b>${F.pct(Q.adherence(cr), 0)}</b> vs the 80% target.<ul>${by.map(x => `<li>${x.pl}: <b>${F.pct(x.a, 0)}</b> ${x.a >= 0.8 ? '✓' : ''}</li>`).join('')}</ul>Biggest opportunity: <b>${by[0].pl}</b>.${src('Vidmob', ['#/creative/adherence', 'Creative Report'])}`;
    }

    // Top creative
    if (/creative|ad\b|ads\b|video/.test(t)) {
      const cr = Q.filter(d.creatives, { year: f.year, month: f.month, market: f.market }).filter(c => c.vtr50 != null && c.impressions >= 10000 && (!platform || c.platform === platform));
      if (!cr.length) return `I couldn't find creatives with 10K+ impressions for ${where(f)}.`;
      const top = cr.sort((a, b) => b.vtr50 - a.vtr50).slice(0, 3);
      return `Top creatives by VTR 50% (${where(f)}${platform ? ', ' + platform : ''}):<ul>${top.map(c => `<li><b>${M.ui.esc(c.name)}</b> — ${F.pct(c.vtr50)} VTR 50%, ${c.platform}, ${M.ui.marketName(c.market)}, ${F.num(c.impressions)} impr.</li>`).join('')}</ul>${src('Vidmob', ['#/creative/adherence', 'Creative Report'])}`;
    }

    // Media metrics, ranking or single value
    const mk = metricOf(t);
    if (mk) {
      const m = mediaMetrics[mk];
      if (/which market|what market|rank|highest|lowest|most|least|top market|best|worst/.test(t) && f.market === 'all') {
        const rows = M.MARKETS.map(x => ({ x, v: m.calc(Q.filter(d.media, { ...f, market: x.code })) })).sort((a, b) => b.v - a.v);
        const low = /lowest|least|worst/.test(t);
        const list = low ? rows.slice().reverse() : rows;
        return `Markets ranked by ${m.label} (${M.ui.periodLabel(f)}), ${low ? 'lowest' : 'highest'} first:<ul>${list.slice(0, 4).map(r => `<li><b>${r.x.name}</b>: ${m.f(r.v)}</li>`).join('')}</ul>${src('Media tracker', ['#/media/investment', 'Media Report'])}`;
      }
      const rows = Q.filter(d.media, f);
      const v = m.calc(rows);
      let extra = '';
      if (f.year === 2026) {
        const ly = Q.filter(d.media, { ...f, year: 2025 }).filter(r => f.month !== 'all' || r.m <= 9);
        const lv = m.calc(ly);
        extra = mk === 'spend' ? ` That's <b>${(v / lv - 1 >= 0 ? '+' : '')}${F.pct(v / lv - 1)}</b> vs the same period last year.` : ` That's <b>${F.pp(v - lv)}</b> vs the same period last year.`;
      }
      return `The ${m.label} for ${where(f)} is <b>${m.f(v)}</b>.${extra}${src('Media tracker', ['#/media/investment', 'Media Report'])}`;
    }

    return `I didn't quite catch that. I can answer about <b>investment</b>, <b>digital / social / retail shares</b>, <b>share of spend vs competitors</b>, <b>creative adherence</b> and <b>top creatives</b>, by market and month. Try a suggestion below.`;
  }

  function suggestions() {
    const p = M.data.persona;
    return ['Total spend YTD in Australia', `Where is our ${p.coreCategory} share of spend lowest?`, 'Which platform has the lowest adherence?',
      'Top creatives in Vietnam', 'Which market has the highest digital share?', 'Retail media % in Philippines in March'];
  }

  M.assistant = {
    init() {
      const panel = document.getElementById('ai-panel');
      const log = panel.querySelector('.ai-log');
      const form = panel.querySelector('form');
      const input = form.querySelector('input');
      const sug = panel.querySelector('.ai-suggest');
      const fab = document.getElementById('ai-fab');

      const add = (cls, html) => { const div = document.createElement('div'); div.className = 'msg ' + cls; div.innerHTML = html; log.appendChild(div); log.scrollTop = log.scrollHeight; return div; };
      const ask = (text) => {
        if (!text.trim()) return;
        add('user', M.ui.esc(text));
        const typing = add('bot typing', '<span></span><span></span><span></span>');
        setTimeout(() => { typing.remove(); add('bot', answer(text)); }, 550 + Math.random() * 400);
      };
      const renderSug = () => { sug.innerHTML = suggestions().map(s => `<button type="button">${M.ui.esc(s)}</button>`).join(''); };
      M.assistant.reset = () => {
        log.innerHTML = '';
        add('bot', `Hi, I'm the hub's AI Assistant. Ask me anything about ${M.ui.esc(M.data.persona.clientShort)}'s media, competitive or creative data.`);
        renderSug();
      };
      M.assistant.open = () => { panel.classList.add('open'); fab.hidden = true; setTimeout(() => input.focus(), 50); };
      const close = () => { panel.classList.remove('open'); fab.hidden = false; fab.focus(); };

      sug.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
      form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
      panel.querySelector('[data-close]').addEventListener('click', close);
      panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      log.addEventListener('click', e => { if (e.target.closest('a[href^="#/"]')) close(); });
      fab.addEventListener('click', M.assistant.open);
      document.addEventListener('click', e => { if (e.target.closest('[data-open-ai]')) M.assistant.open(); });
      M.assistant.reset();
    },
    answer
  };
})();
