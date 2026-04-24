const chartInstances = {};

function getThemeColors() {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  return {
    text: isDark ? "#e8e8e8" : "#1a1d24",
    text2: isDark ? "#a0a6b1" : "#5c6370",
    grid: isDark ? "#2a2f3a" : "#e1e4e8",
    bg: isDark ? "#1e222a" : "#f0f1f4"
  };
}

function disposeCharts() {
  Object.values(chartInstances).forEach(c => c && c.dispose && c.dispose());
  for (const k in chartInstances) delete chartInstances[k];
}

function makeChartOption(type, data, title) {
  const c = getThemeColors();
  const base = {
    backgroundColor: "transparent",
    textStyle: { fontFamily: "Inter, sans-serif" },
    title: {
      text: title,
      left: "2%",
      top: 4,
      textStyle: { fontSize: 13, color: c.text, fontWeight: 600 }
    },
    tooltip: {
      trigger: type === "line" ? "axis" : "item",
      backgroundColor: c.bg,
      borderColor: c.grid,
      textStyle: { color: c.text, fontSize: 12 }
    }
  };
  return base;
}

function renderGDPGrowth(containerId, data) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;
  chart.setOption({
    ...makeChartOption("line", data, "GDP 增长率 (%)"),
    grid: { left: 48, right: 16, top: 44, bottom: 28 },
    xAxis: {
      type: "category",
      data: data.map(d => d.year),
      axisLine: { lineStyle: { color: c.grid } },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: c.grid, type: "dashed" } },
      axisLabel: { color: c.text2, fontSize: 11, formatter: "{value}%" }
    },
    series: [{
      data: data.map(d => d.val),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { width: 3, color: "#5b8def" },
      itemStyle: { color: "#5b8def" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(91,141,239,0.3)" },
          { offset: 1, color: "rgba(91,141,239,0.02)" }
        ])
      },
      markLine: {
        silent: true,
        data: [{ yAxis: 0, lineStyle: { color: c.grid, type: "solid" } }]
      }
    }]
  });
}

function renderSectorsPie(containerId, data) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;
  const palette = ["#5b8def", "#e07a5f", "#81B29A", "#F2CC8F", "#9B5DE5"];
  chart.setOption({
    ...makeChartOption("pie", data, "产业结构 (%)"),
    legend: {
      bottom: 4,
      textStyle: { color: c.text2, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10
    },
    series: [{
      type: "pie",
      radius: ["40%", "68%"],
      center: ["50%", "46%"],
      avoidLabelOverlap: true,
      label: { show: true, color: c.text, fontSize: 11, formatter: "{b}\n{d}%" },
      labelLine: { lineStyle: { color: c.grid } },
      data: data.map((d, i) => ({ value: d.value, name: d.name, itemStyle: { color: palette[i % palette.length] } }))
    }]
  });
}

function renderExportsBar(containerId, data) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;
  chart.setOption({
    ...makeChartOption("bar", data, "主要出口产品占比 (%)"),
    grid: { left: 16, right: 16, top: 44, bottom: 24, containLabel: true },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: c.grid, type: "dashed" } },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    yAxis: {
      type: "category",
      data: data.map(d => d.name).reverse(),
      axisLine: { lineStyle: { color: c.grid } },
      axisLabel: { color: c.text2, fontSize: 11 },
      axisTick: { show: false }
    },
    series: [{
      type: "bar",
      data: data.map(d => d.value).reverse(),
      barWidth: 14,
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: "#5b8def" },
          { offset: 1, color: "#81B29A" }
        ])
      }
    }]
  });
}

function renderSocietyRadar(containerId, data, countryName) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;
  const indicators = [
    { name: "识字率", max: 100 },
    { name: "预期寿命", max: 90 },
    { name: "城市化", max: 100 },
    { name: "HDI×100", max: 100 },
    { name: "医疗支出", max: 15 }
  ];
  const values = [
    data.literacy,
    data.lifeExpectancy,
    data.urbanization,
    Math.round((data.hdi || 0.7) * 100),
    data.healthExp
  ];
  chart.setOption({
    ...makeChartOption("radar", data, "社会发展指标"),
    legend: {
      bottom: 4,
      textStyle: { color: c.text2, fontSize: 11 },
      data: [countryName]
    },
    radar: {
      indicator: indicators,
      radius: "62%",
      center: ["50%", "48%"],
      axisName: { color: c.text2, fontSize: 11 },
      splitArea: { areaStyle: { color: [c.bg, "transparent"] } },
      splitLine: { lineStyle: { color: c.grid } },
      axisLine: { lineStyle: { color: c.grid } }
    },
    series: [{
      type: "radar",
      data: [{
        value: values,
        name: countryName,
        areaStyle: { color: "rgba(91,141,239,0.25)" },
        lineStyle: { color: "#5b8def", width: 2 },
        itemStyle: { color: "#5b8def" },
        symbolSize: 5
      }]
    }]
  });
}

function renderRegionalComparison(containerId, currentIso) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;

  const countries = Object.keys(countryData).map(iso => ({
    iso,
    name: countryMeta[iso].name,
    gdpPerCapita: countryData[iso].gdpPerCapita,
    hdi: countryData[iso].hdi,
    gini: countryData[iso].gini
  }));

  chart.setOption({
    ...makeChartOption("scatter", countries, "人均 GDP vs 人类发展指数"),
    grid: { left: 56, right: 24, top: 44, bottom: 36 },
    tooltip: {
      trigger: "item",
      backgroundColor: c.bg,
      borderColor: c.grid,
      textStyle: { color: c.text, fontSize: 12 },
      formatter: p => `${p.data[3]}<br/>人均 GDP: $${p.data[0].toLocaleString()}<br/>HDI: ${p.data[1]}`
    },
    xAxis: {
      type: "value",
      name: "人均 GDP (USD)",
      nameTextStyle: { color: c.text2, fontSize: 11 },
      axisLine: { lineStyle: { color: c.grid } },
      splitLine: { lineStyle: { color: c.grid, type: "dashed" } },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    yAxis: {
      type: "value",
      name: "HDI",
      min: 0.5,
      max: 0.95,
      nameTextStyle: { color: c.text2, fontSize: 11 },
      axisLine: { lineStyle: { color: c.grid } },
      splitLine: { lineStyle: { color: c.grid, type: "dashed" } },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    series: [{
      type: "scatter",
      symbolSize: d => Math.sqrt(d[2]) * 2.5,
      data: countries.map(d => [
        d.gdpPerCapita,
        d.hdi,
        d.gini,
        d.name,
        d.iso
      ]),
      itemStyle: {
        color: d => d.data[4] === currentIso ? "#e07a5f" : "#5b8def",
        opacity: d => d.data[4] === currentIso ? 1 : 0.7
      },
      emphasis: {
        itemStyle: { borderColor: "#fff", borderWidth: 2 }
      }
    }]
  });
}

function renderGiniComparison(containerId, currentIso) {
  const c = getThemeColors();
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  chartInstances[containerId] = chart;

  const sorted = Object.keys(countryData)
    .map(iso => ({ iso, name: countryMeta[iso].name, gini: countryData[iso].gini }))
    .sort((a, b) => b.gini - a.gini);

  chart.setOption({
    ...makeChartOption("bar", sorted, "基尼系数对比 (拉美各国)"),
    grid: { left: 16, right: 48, top: 44, bottom: 20, containLabel: true },
    xAxis: {
      type: "value",
      max: 60,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: c.grid, type: "dashed" } },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    yAxis: {
      type: "category",
      data: sorted.map(d => d.name),
      axisLine: { lineStyle: { color: c.grid } },
      axisLabel: { color: c.text2, fontSize: 11 },
      axisTick: { show: false }
    },
    series: [{
      type: "bar",
      data: sorted.map(d => ({
        value: d.gini,
        itemStyle: {
          color: d.iso === currentIso ? "#e07a5f" : "#5b8def",
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 12,
      label: {
        show: true,
        position: "right",
        color: c.text2,
        fontSize: 10,
        formatter: "{c}"
      }
    }]
  });
}

function renderHistoryTimeline(container, history) {
  container.innerHTML = history.map(h => `
    <div class="timeline-item">
      <div class="timeline-year">${h.year}</div>
      <div class="timeline-desc">${h.event}</div>
    </div>
  `).join("");
}

function renderOverviewPanel(iso, data, meta) {
  const ov = document.getElementById("tab-overview");
  ov.innerHTML = `
    <div class="overview-grid">
      <div class="overview-card">
        <div class="ov-label">人口</div>
        <div class="ov-value">${(data.population / 1e6).toFixed(1)}M</div>
        <div class="ov-unit">${meta.capital}</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">人均 GDP</div>
        <div class="ov-value">$${data.gdpPerCapita.toLocaleString()}</div>
        <div class="ov-unit">${data.currency}</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">HDI</div>
        <div class="ov-value">${data.hdi}</div>
        <div class="ov-unit">人类发展指数</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">面积</div>
        <div class="ov-value">${(data.area / 1e4).toFixed(0)}万</div>
        <div class="ov-unit">平方公里</div>
      </div>
    </div>
    <p class="overview-text">${data.overview}</p>
    <h4 class="section-title">经济走势</h4>
    <div class="chart-box"><div class="chart-container" id="chart-gdp"></div></div>
    <div class="chart-box"><div class="chart-container" id="chart-sectors"></div></div>
    <h4 class="section-title">区域定位</h4>
    <div class="chart-box"><div class="chart-container" id="chart-scatter"></div></div>
  `;
  setTimeout(() => {
    renderGDPGrowth("chart-gdp", data.economy.gdpGrowth);
    renderSectorsPie("chart-sectors", data.economy.sectors);
    renderRegionalComparison("chart-scatter", iso);
  }, 50);
}

function renderHistoryPanel(iso, data) {
  const el = document.getElementById("tab-history");
  el.innerHTML = `<h4 class="section-title">历史时间线</h4><div class="timeline">${data.history.map(h => `
    <div class="timeline-item">
      <div class="timeline-year">${h.year}</div>
      <div class="timeline-desc">${h.event}</div>
    </div>
  `).join("")}</div>`;
}

function renderPoliticsPanel(iso, data) {
  const p = data.politics;
  const el = document.getElementById("tab-politics");
  el.innerHTML = `
    <h4 class="section-title">政治体制</h4>
    <ul class="info-list">
      <li><span class="il-label">政体</span><span class="il-value">${p.system}</span></li>
      <li><span class="il-label">国家元首</span><span class="il-value">${p.headOfState}</span></li>
      <li><span class="il-label">执政党</span><span class="il-value">${p.rulingParty}</span></li>
      <li><span class="il-label">立法机构</span><span class="il-value">${p.legislature}</span></li>
      <li><span class="il-label">最近选举</span><span class="il-value">${p.lastElection}</span></li>
    </ul>
    <p class="overview-text" style="margin-top:14px">${p.notes}</p>
    <h4 class="section-title">宪政史</h4>
    <p class="overview-text">${p.constitutionalHistory || "暂无详细资料"}</p>
    <h4 class="section-title">外交关系</h4>
    <p class="overview-text">${p.foreignRelations || "暂无详细资料"}</p>
    <h4 class="section-title">国际组织成员资格</h4>
    <p class="overview-text">${(p.internationalOrgs || []).join("、")}</p>
    <h4 class="section-title">基尼系数对比</h4>
    <div class="chart-box"><div class="chart-container" id="chart-gini"></div></div>
  `;
  setTimeout(() => renderGiniComparison("chart-gini", iso), 50);
}

function renderEconomyPanel(iso, data) {
  const e = data.economy;
  const el = document.getElementById("tab-economy");
  el.innerHTML = `
    <h4 class="section-title">经济概况</h4>
    <ul class="info-list">
      <li><span class="il-label">GDP 总量</span><span class="il-value">$${(data.gdp / 1e9).toFixed(1)}B</span></li>
      <li><span class="il-label">人均 GDP</span><span class="il-value">$${data.gdpPerCapita.toLocaleString()}</span></li>
      <li><span class="il-label">通胀率</span><span class="il-value">${e.inflation}%</span></li>
      <li><span class="il-label">失业率</span><span class="il-value">${e.unemployment}%</span></li>
      <li><span class="il-label">贸易差额</span><span class="il-value">${e.tradeBalance > 0 ? "+" : ""}$${(e.tradeBalance / 1e9).toFixed(1)}B</span></li>
      <li><span class="il-label">债务/GDP</span><span class="il-value">${e.debtToGdp}%</span></li>
      <li><span class="il-label">FDI 流入</span><span class="il-value">$${(e.fdi / 1e9).toFixed(1)}B</span></li>
      <li><span class="il-label">汇率</span><span class="il-value">${e.exchangeRate}</span></li>
    </ul>
    <p class="overview-text" style="margin-top:10px"><strong>主要贸易伙伴：</strong>${e.mainPartners.join("、")}</p>
    <p class="overview-text" style="margin-top:6px"><strong>主要企业：</strong>${e.mainCompanies}</p>
    <h4 class="section-title">出口结构</h4>
    <div class="chart-box"><div class="chart-container" id="chart-exports"></div></div>
    <h4 class="section-title">GDP 增长率</h4>
    <div class="chart-box"><div class="chart-container" id="chart-gdp2"></div></div>
  `;
  setTimeout(() => {
    renderExportsBar("chart-exports", e.exports);
    renderGDPGrowth("chart-gdp2", e.gdpGrowth);
  }, 50);
}

function renderSocietyPanel(iso, data, meta) {
  const s = data.society;
  const el = document.getElementById("tab-society");
  el.innerHTML = `
    <h4 class="section-title">社会指标</h4>
    <ul class="info-list">
      <li><span class="il-label">识字率</span><span class="il-value">${s.literacy}%</span></li>
      <li><span class="il-label">预期寿命</span><span class="il-value">${s.lifeExpectancy} 岁</span></li>
      <li><span class="il-label">城市化率</span><span class="il-value">${s.urbanization}%</span></li>
      <li><span class="il-label">互联网普及率</span><span class="il-value">${s.internetPenetration}%</span></li>
      <li><span class="il-label">生育率</span><span class="il-value">${s.fertilityRate}</span></li>
      <li><span class="il-label">性别不平等指数</span><span class="il-value">${s.gii}</span></li>
      <li><span class="il-label">贫困率</span><span class="il-value">${s.povertyRate}%</span></li>
      <li><span class="il-label">谋杀率</span><span class="il-value">${s.homicideRate} /10万</span></li>
      <li><span class="il-label">教育支出</span><span class="il-value">${s.educationExp}% GDP</span></li>
      <li><span class="il-label">医疗支出</span><span class="il-value">${s.healthExp}% GDP</span></li>
      <li><span class="il-label">族群构成</span><span class="il-value">${s.ethnic}</span></li>
    </ul>
    <h4 class="section-title">气候与环境风险</h4>
    <p class="overview-text">${s.climateRisk || "暂无详细资料"}</p>
    <h4 class="section-title">移民与难民</h4>
    <p class="overview-text">${s.refugees || "暂无详细资料"}</p>
    <h4 class="section-title">社会发展雷达图</h4>
    <div class="chart-box"><div class="chart-container tall" id="chart-radar"></div></div>
  `;
  setTimeout(() => renderSocietyRadar("chart-radar", s, meta.name), 50);
}

function renderAllTabs(iso) {
  disposeCharts();
  const data = countryData[iso];
  const meta = countryMeta[iso];
  if (!data || !meta) return;
  renderOverviewPanel(iso, data, meta);
  renderHistoryPanel(iso, data);
  renderPoliticsPanel(iso, data);
  renderEconomyPanel(iso, data);
  renderSocietyPanel(iso, data, meta);
}

window.addEventListener("resize", () => {
  Object.values(chartInstances).forEach(c => c && c.resize());
});
