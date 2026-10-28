/* Synthetic, seeded demo data. Same persona -> same numbers on every load,
   so a rehearsed demo story stays true. No real client figures are used. */
(function () {
  const M = window.MIH;
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  M.MONTH_NAMES = MONTH_NAMES;

  function monthRange(from, to) {
    const out = [];
    let [y, m] = from.split('-').map(Number);
    const [ty, tm] = to.split('-').map(Number);
    while (y < ty || (y === ty && m <= tm)) {
      out.push({ ym: `${y}-${String(m).padStart(2, '0')}`, y, m, label: MONTH_NAMES[m - 1], long: `${MONTH_NAMES[m - 1]} ${y}` });
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  }
  M.MONTHS = monthRange(M.APP.firstMonth, M.APP.lastMonth);
  M.MEDIA_MONTHS = monthRange(M.APP.mediaFirstMonth, M.APP.lastMonth);

  function hash(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function makeRng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Market size ($M/month) and digital maturity; shapes the story, not real data.
  const MARKET_PROFILE = {
    AU: { size: 2.0, digital: 0.60, adh: 0.02, sos: -0.12 },
    ID: { size: 1.6, digital: 0.70, adh: -0.03, sos: 0.04 },
    MY: { size: 0.7, digital: 0.66, adh: 0.00, sos: 0.10 },
    NZ: { size: 0.45, digital: 0.55, adh: 0.03, sos: 0.08 },
    PH: { size: 1.1, digital: 0.72, adh: 0.01, sos: 0.12 },
    SG: { size: 0.5, digital: 0.68, adh: 0.04, sos: 0.18 },
    TH: { size: 1.3, digital: 0.64, adh: 0.07, sos: 0.02 },
    VN: { size: 1.35, digital: 0.70, adh: -0.09, sos: -0.05 }
  };
  const SEASON = [0.85, 0.95, 1.05, 0.9, 1.0, 1.1, 1.05, 0.8, 1.1, 1.05, 1.15, 1.25];

  const PLATFORM_PROFILE = {
    'DV360':      { w: 0.07, adh: 0.78, vtr: 0.48, ctr: 0.0012, cpm: 4.5, start: 0.70 },
    'Google Ads': { w: 0.20, adh: 0.90, vtr: 0.74, ctr: 0.0020, cpm: 3.2, start: 0.82 },
    'Meta':       { w: 0.45, adh: 0.55, vtr: 0.10, ctr: 0.0060, cpm: 2.4, start: 0.38 },
    'Snapchat':   { w: 0.08, adh: 0.72, vtr: 0.20, ctr: 0.0040, cpm: 2.0, start: 0.45 },
    'TikTok':     { w: 0.20, adh: 0.85, vtr: 0.08, ctr: 0.0050, cpm: 2.8, start: 0.52 }
  };
  const FORMAT_VTR = { 'Static': 0, 'Video 6s': 1.25, 'Video 15s': 1.0, 'Video 30s': 0.72, 'Video >30s': 0.55 };

  M.buildData = function (persona) {
    const rnd = makeRng(hash(persona.id + '-mih-v1'));
    const noise = (sd) => (rnd() + rnd() + rnd() - 1.5) * sd * 1.6;
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const pickW = (entries) => { let r = rnd(), acc = 0; for (const [k, w] of entries) { acc += w; if (r <= acc) return k; } return entries[entries.length - 1][0]; };

    /* ---------- Media tracker: market x month ---------- */
    const media = [];
    for (const mo of M.MEDIA_MONTHS) {
      for (const mk of M.MARKETS) {
        const p = MARKET_PROFILE[mk.code];
        const yoy = mo.y === 2026 ? 1.06 : 1;
        const spend = p.size * 1e6 * SEASON[mo.m - 1] * yoy * (1 + noise(0.12));
        const dShare = clamp(p.digital + (mo.y === 2026 ? 0.03 : 0) + noise(0.04), 0.4, 0.9);
        const digital = spend * dShare;
        const social = digital * clamp(0.58 + noise(0.06), 0.4, 0.75);
        const influencer = social * clamp(0.2 + noise(0.06), 0.05, 0.4);
        media.push({
          ym: mo.ym, y: mo.y, m: mo.m, market: mk.code,
          spend, digital, social, influencer,
          infFee: spend * clamp(0.09 + noise(0.03), 0.01, 0.18),
          boosting: social * clamp(0.16 + noise(0.05), 0.04, 0.3),
          retail: spend * clamp(0.065 + noise(0.025) + (mo.y === 2026 ? 0.01 : 0), 0.01, 0.2),
          firstParty: spend * clamp(0.016 + noise(0.007), 0.002, 0.05),
          engTx: digital * clamp(0.05 + noise(0.025) + (mo.y === 2026 ? 0.01 : 0), 0.005, 0.15),
          omsPct: clamp(0.88 + noise(0.07), 0.6, 1),
          roiPct: clamp(0.72 + noise(0.12), 0.3, 1),
          ap2Pct: clamp(0.91 + noise(0.05), 0.7, 1),
          brandSafety: clamp(0.9993 + noise(0.0006), 0.997, 1),
          viewability: clamp(0.895 + noise(0.03), 0.8, 0.97),
          vtr50: clamp(0.145 + noise(0.03), 0.08, 0.24),
          reach: clamp(0.62 + noise(0.08), 0.4, 0.85)
        });
      }
    }

    /* ---------- Competitive: month x market x category x advertiser ---------- */
    const ADV = ['client', 'compA', 'compB', 'others'];
    const catWeight = {}, catClientShare = {};
    persona.categories.forEach((c, i) => {
      catWeight[c] = i === 0 ? 0.42 : [0.16, 0.12, 0.09, 0.08, 0.07, 0.06][i - 1] || 0.05;
      catClientShare[c] = i === 0 ? 0.36 : clamp(0.08 + rnd() * 0.3, 0.05, 0.5);
    });
    const comp = [];
    for (const mo of M.MONTHS) {
      for (const mk of M.MARKETS) {
        const p = MARKET_PROFILE[mk.code];
        for (const cat of persona.categories) {
          const total = p.size * 3.2e6 * catWeight[cat] * SEASON[mo.m - 1] * (1 + noise(0.25)) * (cat === persona.coreCategory && mo.m === 12 ? 1.4 : 1);
          const trend = (mo.y - 2024) * 0.015;
          const sClient = clamp(catClientShare[cat] + p.sos * (cat === persona.coreCategory ? 1 : 0.5) + trend + noise(0.05), 0.03, 0.85);
          const sA = clamp((1 - sClient) * (0.45 + noise(0.08)), 0.02, 0.8);
          const sB = clamp((1 - sClient - sA) * (0.45 + noise(0.1)), 0.01, 0.6);
          const sO = Math.max(0, 1 - sClient - sA - sB);
          [sClient, sA, sB, sO].forEach((s, i) => comp.push({ ym: mo.ym, y: mo.y, m: mo.m, market: mk.code, category: cat, adv: ADV[i], spend: total * s }));
        }
      }
    }

    /* ---------- Creatives (Vidmob-style) ---------- */
    const creatives = [];
    const creativeMonths = M.MEDIA_MONTHS.filter(mo => mo.ym >= '2025-07');
    const platEntries = Object.entries(PLATFORM_PROFILE).map(([k, v]) => [k, v.w]);
    for (let i = 0; i < 1100; i++) {
      const mo = pick(creativeMonths);
      const market = pickW(M.MARKETS.map(mk => [mk.code, MARKET_PROFILE[mk.code].size / 9]));
      const platform = pickW(platEntries);
      const pp = PLATFORM_PROFILE[platform];
      const format = platform === 'Google Ads' || platform === 'DV360'
        ? pickW([['Static', 0.1], ['Video 6s', 0.45], ['Video 15s', 0.3], ['Video 30s', 0.15]])
        : pickW([['Static', 0.22], ['Video 6s', 0.2], ['Video 15s', 0.3], ['Video 30s', 0.18], ['Video >30s', 0.1]]);
      const source = (platform === 'Meta' || platform === 'TikTok') && rnd() < 0.45 ? 'Creator' : 'Brand';
      const brand = pickW(persona.brands.map((b, j) => [b, [0.45, 0.22, 0.18, 0.15][j]]));
      const story = pickW([['Promotional', 0.45], ['Aspirational', 0.25], ['Entertainment', 0.2], ['Educational', 0.1]]);
      const sound = format === 'Static' ? 'No sound' : pickW([['Music', 0.45], ['Speech', 0.2], ['Music + Speech', 0.35]]);
      const emotion = pick(M.EMOTIONS);
      const adherence = clamp(pp.adh + MARKET_PROFILE[market].adh + (source === 'Creator' ? -0.08 : 0) + noise(0.14), 0.15, 1);
      const impressions = Math.round(Math.exp(11 + rnd() * 4.2 + (platform === 'Meta' ? 0.6 : 0)));
      const vtrBase = pp.vtr * FORMAT_VTR[format] * (story === 'Entertainment' ? 1.12 : story === 'Promotional' ? 1.05 : 1) * (0.85 + adherence * 0.3) * (source === 'Creator' ? 1.15 : 1);
      // soft ceiling above 60% so top performers spread out instead of piling up at a cap
      const rawVtr = Math.max(0.01, vtrBase * (1 + noise(0.25)));
      const vtr50 = format === 'Static' ? null : rawVtr < 0.6 ? rawVtr : 0.6 + 0.37 * (1 - Math.exp(-(rawVtr - 0.6) / 0.37));
      const vStart = format === 'Static' ? null : clamp(pp.start * (1 + noise(0.15)), 0.05, 0.99);
      const completion = vtr50 == null ? null : clamp(vtr50 * (0.82 - FORMAT_VTR[format] * 0.05 + noise(0.06)), 0.005, 0.97);
      const ctr = clamp(pp.ctr * (1 + noise(0.45)) * (story === 'Promotional' ? 1.2 : 1), 0.0002, 0.03);
      const cpm = pp.cpm * (source === 'Creator' ? 0.82 : 1) * (1 + noise(0.2));
      const guidelines = {};
      M.GUIDELINES.forEach((g, gi) => {
        const applies = !(format === 'Static' && /(seconds|Motion|Music|Voice)/.test(g));
        guidelines[g] = applies ? rnd() < clamp(adherence + (gi % 3 - 1) * 0.08, 0.05, 0.99) : null;
      });
      creatives.push({
        id: 'CR-' + String(10000 + i),
        name: `${brand} · ${pick(persona.campaigns)} · ${format}`,
        campaign: null, brand, market, platform, format, story, sound, emotion, source,
        ym: mo.ym, y: mo.y, m: mo.m,
        daysLive: 7 + Math.floor(rnd() * 60),
        impressions, spend: impressions / 1000 * cpm,
        ctr, clicks: impressions * ctr,
        vStart, vtr50, completion, adherence, guidelines
      });
    }

    /* ---------- Competitive brands (split of each advertiser's category spend) ---------- */
    const pool = M.COMP_BRAND_POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    let pi = 0;
    const yw = (b) => ({ 2024: Math.max(0.03, b * (1 + noise(0.18))), 2025: Math.max(0.03, b * (1 + noise(0.18))), 2026: Math.max(0.03, b * (1 + noise(0.18))) });
    const brands = [];
    for (const cat of persona.categories) {
      const own = persona.brands.filter((b, i) => persona.brandCategory[i] === cat);
      if (own.length) own.forEach((b, i) => brands.push({ name: b, adv: 'client', category: cat, w: yw([0.55, 0.27, 0.18][i] || 0.2) }));
      else brands.push({ name: `${persona.clientShort} portfolio`, adv: 'client', category: cat, w: yw(1) });
      for (const adv of ['compA', 'compB']) [0.6, 0.4].forEach(b => brands.push({ name: pool[pi++ % pool.length], adv, category: cat, w: yw(b) }));
      brands.push({ name: 'Other advertisers', adv: 'others', category: cat, w: yw(1) });
    }
    const brandIdx = {};
    for (const b of brands) (brandIdx[b.adv + '|' + b.category] = brandIdx[b.adv + '|' + b.category] || []).push(b);
    for (const list of Object.values(brandIdx)) for (const y of [2024, 2025, 2026]) {
      const s = list.reduce((a, b) => a + b.w[y], 0);
      list.forEach(b => { (b.share = b.share || {})[y] = b.w[y] / s; });
    }

    /* ---------- Channel & platform mix per advertiser x market x year ---------- */
    const norm = (o) => { const s = Object.values(o).reduce((a, b) => a + b, 0); for (const k in o) o[k] /= s; return o; };
    const compMix = {};
    for (const adv of ADV) for (const mk of M.MARKETS) for (const y of [2024, 2025, 2026]) {
      const dg = (y - 2024) * 0.04 + (adv === 'client' ? 0.04 : 0);
      compMix[`${adv}|${mk.code}|${y}`] = {
        channel: norm({ TV: Math.max(0.05, 0.36 - dg + noise(0.06)), OOH: Math.max(0.02, 0.1 + noise(0.03)), 'Online video': Math.max(0.03, 0.2 + dg / 2 + noise(0.05)), Social: Math.max(0.03, 0.24 + dg / 2 + noise(0.05)), Display: Math.max(0.02, 0.1 + noise(0.03)) }),
        platform: norm({ YouTube: Math.max(0.05, 0.3 + noise(0.06)), Meta: Math.max(0.05, 0.32 + noise(0.06)), TikTok: Math.max(0.03, 0.16 + (y - 2024) * 0.04 + noise(0.05)), Programmatic: Math.max(0.03, 0.14 + noise(0.04)), 'Other digital': Math.max(0.01, 0.08 + noise(0.03)) })
      };
    }

    /* ---------- Competitor creatives (AdClarity-style, quarterly) ---------- */
    const quarters = ['2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3'];
    const compCreatives = [];
    for (let i = 0; i < 220; i++) {
      const adv = pickW([['client', 0.22], ['compA', 0.32], ['compB', 0.28], ['others', 0.18]]);
      const category = rnd() < 0.5 ? persona.coreCategory : pick(persona.categories);
      const cands = brandIdx[adv + '|' + category].filter(b => b.name !== 'Other advertisers');
      const brand = cands.length ? pick(cands).name : pick(['Regional label', 'Local challenger', 'Import brand', 'Private label']);
      const quarter = pick(quarters);
      const platform = pickW([['YouTube', 0.35], ['Meta', 0.35], ['TikTok', 0.2], ['Display', 0.1]]);
      compCreatives.push({
        id: 'AC-' + (50000 + i), adv, category, brand, quarter, y: +quarter.slice(0, 4), platform,
        market: pickW(M.MARKETS.map(mk => [mk.code, MARKET_PROFILE[mk.code].size / 9])),
        format: platform === 'Display' ? 'Static' : pick(['Video 6s', 'Video 15s', 'Video 15s', 'Video 30s']),
        impressions: Math.round(Math.exp(12 + rnd() * 4)),
        name: `${brand} · ${pick(M.COMP_THEMES)}`
      });
    }

    return { persona, media, comp, creatives, ADV, brands, brandIdx, compMix, compCreatives };
  };

  /* ---------- Query helpers ---------- */
  M.q = {
    sum(rows, key) { let s = 0; for (const r of rows) s += r[key] || 0; return s; },
    // spend-weighted mean of a rate column
    wavg(rows, key, wkey = 'spend') {
      let s = 0, w = 0;
      for (const r of rows) { if (r[key] == null) continue; s += r[key] * r[wkey]; w += r[wkey]; }
      return w ? s / w : null;
    },
    match(f, r) {
      if (f.year && f.year !== 'all' && r.y !== +f.year) return false;
      if (f.month && f.month !== 'all' && r.m !== +f.month) return false;
      if (f.market && f.market !== 'all' && r.market !== f.market) return false;
      if (f.category && f.category !== 'all' && r.category !== f.category) return false;
      if (f.platform && f.platform !== 'all' && r.platform !== f.platform) return false;
      if (f.brand && f.brand !== 'all' && r.brand !== f.brand) return false;
      if (f.adv && f.adv !== 'all' && r.adv !== f.adv) return false;
      return true;
    },
    filter(rows, f) { return rows.filter(r => M.q.match(f, r)); },
    groupBy(rows, key) {
      const g = new Map();
      for (const r of rows) { const k = typeof key === 'function' ? key(r) : r[key]; if (!g.has(k)) g.set(k, []); g.get(k).push(r); }
      return g;
    },
    // share of spend for each advertiser in a set of competitive rows
    sos(rows) {
      const tot = M.q.sum(rows, 'spend') || 1;
      const out = {};
      for (const a of ['client', 'compA', 'compB', 'others']) out[a] = M.q.sum(rows.filter(r => r.adv === a), 'spend') / tot;
      return out;
    },
    // impression-weighted adherence
    adherence(rows) { return M.q.wavg(rows, 'adherence', 'impressions'); },
    monthsOfYear(year) { return M.MONTHS.filter(mo => mo.y === +year); },
    // spend by brand for a set of competitive rows -> [{brand, spend}]
    brandSpend(rows) {
      const out = new Map();
      for (const r of rows) for (const b of M.data.brandIdx[r.adv + '|' + r.category] || []) {
        out.set(b, (out.get(b) || 0) + r.spend * b.share[r.y]);
      }
      return out;
    },
    // spend split by channel or digital platform -> {adv: {key: spend}}
    mixSpend(rows, dim) {
      const out = {};
      for (const r of rows) {
        const m = M.data.compMix[`${r.adv}|${r.market}|${r.y}`];
        const o = out[r.adv] = out[r.adv] || {};
        // platform mix applies to the digital part of spend only
        const base = dim === 'platform' ? r.spend * (1 - m.channel.TV - m.channel.OOH) : r.spend;
        for (const k in m[dim]) o[k] = (o[k] || 0) + base * m[dim][k];
      }
      return out;
    }
  };

  /* ---------- Formatters ---------- */
  M.fmt = {
    money(v, d) {
      if (v == null || isNaN(v)) return '–';
      const a = Math.abs(v);
      if (a >= 1e9) return '$' + (v / 1e9).toFixed(d ?? 2) + 'B';
      if (a >= 1e6) return '$' + (v / 1e6).toFixed(d ?? 1) + 'M';
      if (a >= 1e3) return '$' + (v / 1e3).toFixed(d ?? 0) + 'K';
      return '$' + v.toFixed(0);
    },
    pct(v, d = 1) { return v == null || isNaN(v) ? '–' : (v * 100).toFixed(d) + '%'; },
    pp(v, d = 1) { return v == null || isNaN(v) ? '–' : (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(d) + 'pp'; },
    num(v) {
      if (v == null || isNaN(v)) return '–';
      if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
      if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
      return Math.round(v).toLocaleString();
    }
  };
})();
