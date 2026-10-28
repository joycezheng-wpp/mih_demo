/* App shell: persona, shared filter state and hash routing (#/module/tab). */
(function () {
  const M = window.MIH;
  // Each module keeps its own filters (Competitive history goes back further than Media, etc.)
  const FILTER_DEFAULTS = {
    exec: () => ({ year: 2026, month: 'all', market: 'all' }),
    media: () => ({ year: 2026, month: 'all', market: 'AU' }),
    competitive: () => ({ year: 2026, month: 'all', market: 'all', category: M.data.persona.coreCategory }),
    creative: () => ({ year: 2026, month: 'all', market: 'all', platform: 'all', brand: 'all' })
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  M.state = { persona: null, route: 'home', filters: {}, local: {} };
  M.filters = (mod = M.state.route) => (M.state.filters[mod] = M.state.filters[mod] || (FILTER_DEFAULTS[mod] || FILTER_DEFAULTS.exec)());
  // Page-level control values (KPI pickers, view toggles…)
  M.loc = (key, dflt) => (M.state.local[key] !== undefined ? M.state.local[key] : dflt);

  M.setPersona = function (id) {
    if (!M.PERSONAS[id]) id = M.DEFAULT_PERSONA;
    M.state.persona = id;
    M.state.filters = {}; M.state.local = {};
    M.data = M.buildData(M.PERSONAS[id]);
    store.set('mih-persona', id);
    document.title = `${M.APP.name} · ${M.PERSONAS[id].client}`;
  };

  const ROUTES = { home: 'Home', exec: 'Executive Summary', media: 'Media Report', competitive: 'Competitive Report', creative: 'Creative Report' };

  function render() {
    const [mod = 'home', tab] = location.hash.replace(/^#\/?/, '').split('/');
    const key = M.modules[mod] ? mod : 'home';
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.route === key));
    M.charts.disposeAll();
    M.state.route = key;
    const page = document.getElementById('page');
    M.modules[key].render(page, tab);
    page.dataset.route = key;
  }
  M.render = render;

  function init() {
    // header
    document.querySelector('.main-nav').innerHTML = Object.entries(ROUTES).map(([k, v]) =>
      `<a href="#/${k === 'home' ? '' : k}" data-route="${k}">${v}</a>`).join('');
    const sel = document.getElementById('persona');
    sel.innerHTML = Object.values(M.PERSONAS).map(p => `<option value="${p.id}" title="${p.label}">${p.client}</option>`).join('');
    M.setPersona(store.get('mih-persona') || M.DEFAULT_PERSONA);
    sel.value = M.state.persona;
    sel.addEventListener('change', () => { M.setPersona(sel.value); M.assistant.reset(); render(); });

    // filters (delegated; any module's filter bar)
    const rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
    const val = (v) => (/^\d+$/.test(v) ? +v : v);
    document.addEventListener('change', e => {
      const s = e.target.closest('[data-filter]');
      if (s) {
        const f = M.filters(), k = s.dataset.filter;
        f[k] = val(s.value);
        if (k === 'year' && f.month !== 'all' && !M.q.monthsOfYear(f.year).some(m => m.m === f.month)) f.month = 'all';
        return rerender();
      }
      const l = e.target.closest('[data-local]');
      if (l) { M.state.local[l.dataset.local] = val(l.value); rerender(); }
    });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-filter-reset]')) { delete M.state.filters[M.state.route]; return render(); }
      const b = e.target.closest('[data-local-key]');
      if (b) {
        String(b.dataset.localKey).split(',').forEach((k, i) => { M.state.local[k] = val(String(b.dataset.localValue).split(',')[i]); });
        if (b.tagName !== 'A') rerender();   // links re-render via hashchange
      }
    });

    window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
    M.assistant.init();
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
