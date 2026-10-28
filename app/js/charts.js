/* Chart helpers on top of ECharts. Rules applied everywhere:
   one y-axis per chart (no dual axes), categorical colours in fixed order,
   client is always series slot 1, selective direct labels, hover tooltips. */
(function () {
  const M = window.MIH;
  M.SERIES = ['#5465FF', '#D4A000', '#00929F', '#7A3FB8', '#5E9E1E', '#D0508A', '#E07A2E'];
  M.OTHER = '#A3A7BF';
  M.INK = '#000050'; M.INK2 = '#3B3D6B'; M.MUTED = '#6E7194'; M.LINE = '#E2E4F0';
  M.advColor = { client: M.SERIES[0], compA: M.SERIES[1], compB: M.SERIES[2], others: M.OTHER };
  M.advName = (key) => {
    const p = M.data.persona;
    return { client: p.clientShort, compA: p.competitors[0], compB: p.competitors[1], others: 'Others' }[key];
  };
  M.catColor = (cat) => M.SERIES[M.data.persona.categories.indexOf(cat) % M.SERIES.length];

  const FONT = "'WPP', 'Inter', 'Segoe UI', system-ui, Arial, sans-serif";
  const live = [];

  function tip(title, rows) {
    return `<div class="mih-tip"><div class="t">${title}</div>` + rows.map(r =>
      `<div class="r"><span><i style="background:${r.color}"></i>${r.name}</span><b>${r.value}</b></div>`).join('') + '</div>';
  }
  M.tip = tip;

  const base = () => ({
    textStyle: { fontFamily: FONT, color: M.INK2 },
    animationDuration: 500,
    tooltip: {
      backgroundColor: '#fff', borderColor: M.LINE, borderWidth: 1, padding: [8, 12],
      extraCssText: 'box-shadow:0 6px 20px rgba(0,0,80,.12);border-radius:10px;',
      textStyle: { color: M.INK, fontFamily: FONT }
    }
  });
  const axisCommon = {
    axisLine: { lineStyle: { color: M.LINE } }, axisTick: { show: false },
    axisLabel: { color: M.MUTED, fontSize: 11.5, fontFamily: FONT },
    splitLine: { lineStyle: { color: '#EEF0F7' } }
  };
  const ax = (o) => Object.assign({}, axisCommon, o, { axisLabel: Object.assign({}, axisCommon.axisLabel, o && o.axisLabel) });

  M.charts = {
    init(el, option) {
      if (!el) return null;
      const c = echarts.init(el, null, { renderer: 'svg' });
      const opt = Object.assign(base(), option);
      opt.tooltip = Object.assign(base().tooltip, option.tooltip || {});
      c.setOption(opt);
      live.push(c);
      return c;
    },
    disposeAll() { while (live.length) { const c = live.pop(); try { c.dispose(); } catch (e) {} } },
    resizeAll() { live.forEach(c => c.resize()); },

    /* Horizontal 100% stacked bars (share of spend). series: [{name,color,data:[share]}] */
    stack100H(el, { labels, series, highlight, labelSlot = 0 }) {
      const n = series.length;
      return M.charts.init(el, {
        grid: { left: 8, right: 16, top: 8, bottom: 24, containLabel: true },
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(84,101,255,.06)' } },
          formatter: (ps) => tip(ps[0].axisValue, ps.map(p => ({ color: p.color, name: p.seriesName, value: M.fmt.pct(p.value) })))
        },
        xAxis: ax({ type: 'value', max: 1, axisLabel: { formatter: v => Math.round(v * 100) + '%' } }),
        yAxis: ax({
          type: 'category', data: labels, inverse: true,
          axisLabel: {
            color: M.INK2, fontSize: 12.5,
            formatter: v => (highlight && v === highlight ? `{h|${v}}` : v),
            rich: { h: { fontWeight: 700, color: M.INK, fontSize: 12.5 } }
          }
        }),
        series: series.map((s, i) => ({
          name: s.name, type: 'bar', stack: 'sos', barWidth: '58%', data: s.data,
          itemStyle: {
            color: s.color, borderColor: '#fff', borderWidth: 1,
            borderRadius: i === 0 ? [4, 0, 0, 4] : i === n - 1 ? [0, 4, 4, 0] : 0
          },
          label: i === labelSlot ? {
            show: true, position: 'insideLeft', color: '#fff', fontWeight: 700, fontSize: 11.5,
            formatter: p => (p.value >= 0.08 ? M.fmt.pct(p.value, 0) : '')
          } : { show: false },
          emphasis: { focus: 'series' }
        }))
      });
    },

    /* Spend bars (part + rest, stacked) above, share line below — two aligned
       panels on one x-axis instead of a dual-axis combo. */
    spendShare(el, { months, part, rest, partName, restName, share, shareName, highlightIdx }) {
      const dim = (i) => highlightIdx != null && i !== highlightIdx ? 0.35 : 1;
      const maxShare = Math.max(...share.filter(v => v != null));
      const shareMax = Math.min(1, Math.ceil((maxShare + 0.05) * 10) / 10);
      return M.charts.init(el, {
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: M.LINE } },
          formatter: (ps) => {
            const i = ps[0].dataIndex;
            return tip(months[i], [
              { color: M.SERIES[0], name: partName, value: M.fmt.money(part[i]) },
              { color: M.OTHER, name: restName, value: M.fmt.money(rest[i]) },
              { color: M.INK, name: 'Total investment', value: M.fmt.money(part[i] + rest[i]) },
              { color: M.SERIES[2], name: shareName, value: M.fmt.pct(share[i]) }
            ]);
          }
        },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        grid: [
          { left: 52, right: 16, top: 12, height: '52%' },
          { left: 52, right: 16, top: '72%', bottom: 26 }
        ],
        xAxis: [
          ax({ type: 'category', data: months, gridIndex: 0, axisLabel: { show: false } }),
          ax({ type: 'category', data: months, gridIndex: 1 })
        ],
        yAxis: [
          ax({ type: 'value', gridIndex: 0, splitNumber: 3, axisLabel: { formatter: v => M.fmt.money(v, 0) } }),
          ax({ type: 'value', gridIndex: 1, min: 0, max: shareMax, interval: shareMax / 2, axisLabel: { formatter: v => Math.round(v * 100) + '%' } })
        ],
        series: [
          { name: partName, type: 'bar', stack: 's', xAxisIndex: 0, yAxisIndex: 0, barWidth: '55%',
            data: part.map((v, i) => ({ value: v, itemStyle: { opacity: dim(i) } })),
            itemStyle: { color: M.SERIES[0], borderColor: '#fff', borderWidth: 1 } },
          { name: restName, type: 'bar', stack: 's', xAxisIndex: 0, yAxisIndex: 0,
            data: rest.map((v, i) => ({ value: v, itemStyle: { opacity: dim(i) } })),
            itemStyle: { color: '#C8CBDD', borderColor: '#fff', borderWidth: 1, borderRadius: [4, 4, 0, 0] } },
          { name: shareName, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: share, symbol: 'circle', symbolSize: 8,
            lineStyle: { width: 2, color: M.SERIES[2] }, itemStyle: { color: M.SERIES[2], borderColor: '#fff', borderWidth: 2 },
            label: { show: true, position: 'top', fontSize: 11, color: M.INK2,
              formatter: p => (p.dataIndex === share.length - 1 || p.dataIndex === highlightIdx ? M.fmt.pct(p.value, 0) : '') } }
        ]
      });
    },

    /* Single-measure bars. Horizontal by default (ranked lists); `colors` per bar, `bench` draws a reference line. */
    bars(el, { labels, values, colors, fmt = (v) => M.fmt.pct(v), axisFmt, vertical = false, bench, benchLabel, highlight, max }) {
      const cat = ax({ type: 'category', data: labels, inverse: !vertical,
        axisLabel: { color: M.INK2, fontSize: 12, interval: 0, formatter: v => (highlight && v === highlight ? `{h|${v}}` : v), rich: { h: { fontWeight: 700, color: M.INK, fontSize: 12 } } } });
      const val = ax({ type: 'value', max, splitNumber: 4, axisLabel: { formatter: axisFmt || (v => Math.round(v * 100) + '%') } });
      return M.charts.init(el, {
        grid: { left: 8, right: vertical ? 16 : 56, top: !vertical && bench != null ? 30 : 16, bottom: 8, containLabel: true },
        tooltip: { trigger: 'item', formatter: p => tip(p.name, [{ color: p.color, name: '', value: fmt(p.value) }].concat(bench != null ? [{ color: M.INK, name: benchLabel || 'Benchmark', value: fmt(bench) }] : [])) },
        xAxis: vertical ? cat : val, yAxis: vertical ? val : cat,
        series: [{
          type: 'bar', barMaxWidth: 26,
          data: values.map((v, i) => ({ value: v, itemStyle: { color: colors ? (Array.isArray(colors) ? colors[i] : colors) : M.SERIES[0], opacity: highlight && labels[i] !== highlight ? 0.45 : 1 } })),
          itemStyle: { borderRadius: vertical ? [4, 4, 0, 0] : [0, 4, 4, 0] },
          label: { show: true, position: vertical ? 'top' : 'right', color: M.INK2, fontSize: 11.5, formatter: p => fmt(p.value) },
          markLine: bench != null ? { symbol: 'none', silent: true, lineStyle: { color: M.INK, type: 'dashed', width: 1.5 },
            label: { formatter: (benchLabel || 'Benchmark') + ' ' + fmt(bench), color: M.INK, fontSize: 11, position: vertical ? 'insideEndTop' : 'start' },
            data: [vertical ? { yAxis: bench } : { xAxis: bench }] } : undefined
        }]
      });
    },

    /* Vertical 100% stacked columns. series: [{name,color,data:[share]}] */
    stack100V(el, { labels, series, minLabel = 0.07 }) {
      const n = series.length;
      return M.charts.init(el, {
        grid: { left: 8, right: 8, top: 10, bottom: 8, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(84,101,255,.06)' } },
          formatter: ps => tip(ps[0].axisValue, ps.slice().reverse().filter(p => p.value > 0.0005).map(p => ({ color: p.color, name: p.seriesName, value: M.fmt.pct(p.value) }))) },
        xAxis: ax({ type: 'category', data: labels, axisLabel: { color: M.INK2, interval: 0 } }),
        yAxis: ax({ type: 'value', max: 1, splitNumber: 4, axisLabel: { formatter: v => Math.round(v * 100) + '%' } }),
        series: series.map((s, i) => ({
          name: s.name, type: 'bar', stack: 'a', barMaxWidth: 56, data: s.data,
          itemStyle: { color: s.color, borderColor: '#fff', borderWidth: 1, borderRadius: i === n - 1 ? [4, 4, 0, 0] : 0 },
          label: { show: true, position: 'inside', fontSize: 11, fontWeight: 700, color: s.color === M.OTHER || s.color === M.SERIES[1] ? M.INK : '#fff',
            formatter: p => (p.value >= minLabel ? Math.round(p.value * 100) + '%' : '') },
          emphasis: { focus: 'series' }
        }))
      });
    },

    /* Spend bars on top, KPI line(s) in a panel below; shared x-axis, separate scales (not a dual axis). */
    barsPanel(el, { x, bars, barName, lines, fmt = (v) => M.fmt.pct(v), highlightIdx }) {
      const all = lines.flatMap(l => l.data).filter(v => v != null);
      const hiV = Math.max(...all), loV = Math.min(...all);
      const pctScale = hiV <= 1;
      const top = pctScale ? Math.min(1, Math.ceil((hiV + 0.03) * 20) / 20) : Math.ceil(hiV * 1.1);
      const bottom = pctScale && loV > 0.5 ? Math.floor((loV - 0.03) * 20) / 20 : 0;
      return M.charts.init(el, {
        tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: M.LINE } },
          formatter: ps => { const i = ps[0].dataIndex; return tip(x[i], [{ color: '#C8CBDD', name: barName, value: M.fmt.money(bars[i]) }].concat(lines.map(l => ({ color: l.color, name: l.name, value: fmt(l.data[i]) })))); } },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        grid: [{ left: 56, right: 16, top: 12, height: '42%' }, { left: 56, right: 16, top: '62%', bottom: 26 }],
        xAxis: [ax({ type: 'category', data: x, gridIndex: 0, axisLabel: { show: false } }), ax({ type: 'category', data: x, gridIndex: 1 })],
        yAxis: [ax({ type: 'value', gridIndex: 0, splitNumber: 2, axisLabel: { formatter: v => M.fmt.money(v, 0) } }),
          ax({ type: 'value', gridIndex: 1, min: bottom, max: top, interval: (top - bottom) / 2, axisLabel: { formatter: v => (pctScale ? Math.round(v * 1000) / 10 + '%' : v) } })],
        series: [{ name: barName, type: 'bar', xAxisIndex: 0, yAxisIndex: 0, barWidth: '55%',
          data: bars.map((v, i) => ({ value: v, itemStyle: { opacity: highlightIdx != null && i !== highlightIdx ? 0.4 : 1 } })),
          itemStyle: { color: '#C8CBDD', borderRadius: [4, 4, 0, 0] } }]
          .concat(lines.map(l => ({ name: l.name, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: l.data, symbol: 'circle', symbolSize: 8,
            lineStyle: { width: 2, color: l.color, type: l.dashed ? 'dashed' : 'solid' }, itemStyle: { color: l.color, borderColor: '#fff', borderWidth: 2 },
            endLabel: { show: true, formatter: p => fmt(p.value), color: M.INK2, fontSize: 11, fontWeight: 700 } })))
      });
    },

    /* Simple multi-line chart on one % axis. */
    lines(el, { x, series, yMin, yMax, fmt = (v) => M.fmt.pct(v), axisFmt, endLabels = true, markLine, legend, zoom }) {
      return M.charts.init(el, {
        legend: legend ? { show: false, selected: legend } : undefined,
        dataZoom: zoom ? [{ type: 'inside', start: zoom }, { type: 'slider', start: zoom, height: 16, bottom: 4, borderColor: M.LINE, fillerColor: 'rgba(84,101,255,.12)', handleStyle: { color: M.SERIES[0] }, textStyle: { color: M.MUTED } }] : undefined,
        grid: { left: 52, right: endLabels ? 56 : 32, top: 16, bottom: zoom ? 56 : 26 },
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: M.LINE } },
          formatter: ps => tip(ps[0].axisValue, ps.map(p => ({ color: p.color, name: p.seriesName, value: fmt(p.value) })))
        },
        xAxis: ax({ type: 'category', data: x, boundaryGap: false }),
        yAxis: ax({ type: 'value', min: yMin, max: yMax, splitNumber: 4, axisLabel: { formatter: axisFmt || (v => Math.round(v * 1000) / 10 + '%') } }),
        series: series.map((s, si) => ({
          name: s.name, type: 'line', data: s.data, symbol: 'circle',
          symbolSize: s.symbolSize || 8, showSymbol: x.length <= 18,
          lineStyle: { width: 2, color: s.color, type: s.dashed ? 'dashed' : 'solid' }, itemStyle: { color: s.color, borderColor: '#fff', borderWidth: 2 },
          endLabel: endLabels ? { show: true, formatter: p => fmt(p.value), color: M.INK2, fontSize: 11.5, fontWeight: 700 } : undefined,
          markLine: si === 0 && markLine ? markLine : undefined,
          emphasis: { focus: 'series' }
        }))
      });
    }
  };

  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(M.charts.resizeAll, 120); });
})();
