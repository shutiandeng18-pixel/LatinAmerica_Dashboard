let svg, g, projection, path, zoom, zoomBehaviour;
let activeIso = null;
const latamIsos = new Set(Object.keys(countryMeta));

const numToAlpha = {
  "032": "ARG", "068": "BOL", "076": "BRA", "152": "CHL", "170": "COL",
  "188": "CRI", "192": "CUB", "214": "DOM", "218": "ECU", "222": "SLV",
  "320": "GTM", "332": "HTI", "340": "HND", "484": "MEX", "558": "NIC",
  "591": "PAN", "600": "PRY", "604": "PER", "858": "URY", "862": "VEN"
};

function getIso(d) { return numToAlpha[d.id] || d.id; }

function initMap() {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;

  svg = d3.select("#mapContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Center on Latin America
  projection = d3.geoNaturalEarth1()
    .scale(Math.min(width, height) * 1.15)
    .translate([width * 0.5, height * 0.52])
    .center([-60, -12]);

  path = d3.geoPath().projection(projection);

  zoomBehaviour = d3.zoom()
    .scaleExtent([1, 12])
    .on("zoom", e => g.attr("transform", e.transform));

  svg.call(zoomBehaviour);

  g = svg.append("g");

  // Loading indicator
  const loader = svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-2)")
    .attr("font-size", "14px")
    .attr("font-family", "Inter, sans-serif")
    .text("加载地图中…");

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(world => {
      loader.remove();
      const countries = topojson.feature(world, world.objects.countries).features;
      const latamFeatures = countries.filter(f => latamIsos.has(getIso(f)));

      // Compute bounding box for latam to set initial view
      const latamPath = { type: "FeatureCollection", features: latamFeatures };
      const bounds = path.bounds(latamPath);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const x = (bounds[0][0] + bounds[1][0]) / 2;
      const y = (bounds[0][1] + bounds[1][1]) / 2;
      const scale = Math.min(width / dx, height / dy) * 0.92;
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      // Apply initial transform with transition
      svg.call(zoomBehaviour.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));

      const paths = g.selectAll("path.country-path")
        .data(latamFeatures)
        .enter()
        .append("path")
        .attr("class", "country-path")
        .attr("d", path)
        .attr("fill", d => regionColors[countryMeta[getIso(d)].region])
        .attr("stroke", d => {
          const t = document.documentElement.getAttribute("data-theme");
          return t === "light" ? "#ffffff" : "#0f1115";
        })
        .attr("stroke-width", 0.8)
        .attr("stroke-linejoin", "round")
        .attr("opacity", 0)
        .attr("transform", "scale(0.95)")
        .style("transform-box", "fill-box")
        .style("transform-origin", "center");

      // Staggered entrance animation
      paths.transition()
        .duration(700)
        .delay((d, i) => i * 40 + 100)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1)
        .attr("transform", "scale(1)");

      paths
        .on("mouseenter", function(event, d) {
          const iso = getIso(d);
          d3.selectAll(".country-path")
            .transition().duration(200)
            .attr("opacity", p => getIso(p) === iso ? 1 : 0.35);
          d3.select(this)
            .transition().duration(200)
            .attr("stroke-width", 2.2)
            .attr("stroke", "var(--text)");

          const tooltip = document.getElementById("mapTooltip");
          const meta = countryMeta[iso];
          tooltip.innerHTML = `
            <div class="tt-name">${meta.name}</div>
            <div class="tt-meta">${meta.capital} · ${meta.nameEn}</div>
            <div class="tt-meta" style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
              <span>人均 GDP $${countryData[iso].gdpPerCapita.toLocaleString()}</span>
              <span>HDI ${countryData[iso].hdi}</span>
            </div>
          `;
          tooltip.classList.add("visible");
          moveTooltip(event);
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", function() {
          d3.selectAll(".country-path")
            .transition().duration(300)
            .attr("opacity", 1);
          d3.select(this)
            .transition().duration(200)
            .attr("stroke-width", 0.8)
            .attr("stroke", () => {
              const t = document.documentElement.getAttribute("data-theme");
              return t === "light" ? "#ffffff" : "#0f1115";
            });
          document.getElementById("mapTooltip").classList.remove("visible");
        })
        .on("click", function(event, d) {
          const iso = getIso(d);
          event.stopPropagation();
          zoomToCountry(d, iso);
          selectCountry(iso);
        });

      // Click on empty space resets zoom
      svg.on("click", () => {
        resetZoom();
        closePanel();
      });
    })
    .catch(err => {
      console.error("Map load failed:", err);
      loader.text("地图加载失败，请检查网络连接");
    });
}

function moveTooltip(event) {
  const tooltip = document.getElementById("mapTooltip");
  const rect = document.getElementById("mapContainer").getBoundingClientRect();
  let x = event.clientX - rect.left + 16;
  let y = event.clientY - rect.top + 16;
  if (x + 220 > rect.width) x = event.clientX - rect.left - 230;
  if (y + 100 > rect.height) y = event.clientY - rect.top - 110;
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}

function zoomToCountry(feature, iso) {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;
  const bounds = path.bounds(feature);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.min(width / dx, height / dy) * 0.7;
  const clampedScale = Math.min(Math.max(scale, 2), 6);
  const translate = [width / 2 - clampedScale * x, height / 2 - clampedScale * y];

  svg.transition().duration(750).ease(d3.easeCubicOut)
    .call(zoomBehaviour.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(clampedScale));
}

function resetZoom() {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;
  projection.scale(Math.min(width, height) * 1.15).translate([width * 0.5, height * 0.52]).center([-60, -12]);

  // Recompute bounds
  const latamFeatures = g.selectAll(".country-path").data();
  if (latamFeatures.length === 0) return;
  const latamPath = { type: "FeatureCollection", features: latamFeatures };
  const bounds = path.bounds(latamPath);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.min(width / dx, height / dy) * 0.92;
  const translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition().duration(750).ease(d3.easeCubicOut)
    .call(zoomBehaviour.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

function selectCountry(iso) {
  activeIso = iso;
  d3.selectAll(".country-path")
    .classed("active", d => getIso(d) === iso);

  const meta = countryMeta[iso];
  document.getElementById("detailFlag").src = meta.flag;
  document.getElementById("detailFlag").alt = meta.name + "国旗";
  document.getElementById("detailName").textContent = meta.name;
  document.getElementById("detailSub").textContent = `${meta.nameEn} · ${meta.capital}`;

  openPanel();
  renderAllTabs(iso);
}

function highlightCountryOnMap(iso) {
  d3.selectAll(".country-path")
    .transition().duration(300)
    .attr("opacity", d => getIso(d) === iso ? 1 : 0.25)
    .attr("stroke-width", d => getIso(d) === iso ? 2.5 : 0.8);
}

function resetMapHighlight() {
  d3.selectAll(".country-path")
    .transition().duration(300)
    .attr("opacity", 1)
    .attr("stroke-width", 0.8);
}

function openPanel() {
  document.getElementById("detailPanel").classList.add("open");
}

function closePanel() {
  document.getElementById("detailPanel").classList.remove("open");
  activeIso = null;
  d3.selectAll(".country-path").classed("active", false);
}

function updateMapTheme() {
  const t = document.documentElement.getAttribute("data-theme");
  d3.selectAll(".country-path")
    .attr("stroke", t === "light" ? "#ffffff" : "#0f1115");
}

function handleResize() {
  const container = document.getElementById("mapContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;
  svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  projection.scale(Math.min(width, height) * 1.15).translate([width * 0.5, height * 0.52]);
  g.selectAll("path").attr("d", path);
}
