class Histogram {
  constructor(_config, _data) {
      this.config = {
          parentElement: _config.parentElement,
          colorScale: d3.scaleOrdinal(["#4fade0", "#e47b41"]), // Two colors
          containerWidth: _config.containerWidth || 700,
          containerHeight: _config.containerHeight || 400,
          margin: _config.margin || {top: 50, right: 50, bottom: 30, left: 40},
          tooltipPadding: _config.tooltipPadding || 50
      };
      this.data = _data;
      this.selectedPoints = new Set();

      // Selected attributes for comparison
      this.selectedData1 = "percent_poverty";
      this.selectedData2 = "percent_high_blood_pressure";

      // Track selected bins
      this.selectedBins = new Set(); 

      this.initVis();
  }

  initVis() {
      let vis = this;

      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      // Create Scales
      vis.xScale = d3.scaleLinear().range([0, vis.width]).domain([0, 100]); // 0-100% range
      vis.yScale = d3.scaleLinear().range([vis.height, 0]);

      // Axes
      vis.xAxis = d3.axisBottom(vis.xScale).ticks(10).tickFormat(d => d + "%");
      vis.yAxis = d3.axisLeft(vis.yScale).ticks(10);

      vis.svg = d3.select(vis.config.parentElement)
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight);

      vis.chart = vis.svg.append("g")
          .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

      vis.xAxisG = vis.chart.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", `translate(0,${vis.height})`);

      vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

      // Listen for clicks outside bars to reset selection
      vis.svg.on("click", () => {
          vis.selectedBins.clear();
          vis.updateHighlighting();
          updateOtherVisualizations([]);
      });

      vis.updateVis();
  }

  updateVis(filteredData = null) {
    let vis = this;
    vis.data = filteredData || vis.data;

    const data1 = vis.data.map(d => d[vis.selectedData1]);
    const data2 = vis.data.map(d => d[vis.selectedData2]);

    const histogram = d3.histogram().domain([0, 100]).thresholds(20);
    const bins1 = histogram(data1);
    const bins2 = histogram(data2);

    vis.aggregatedData = bins1.map((bin, i) => ({
        x0: bin.x0,
        x1: bin.x1,
        count1: bin.length,
        count2: bins2[i] ? bins2[i].length : 0
    }));

    vis.yScale.domain([0, d3.max(vis.aggregatedData, d => Math.max(d.count1, d.count2))]);

    vis.renderVis();
}


  renderVis() {
      let vis = this;

      let tooltip = d3.select("body").select("#tooltip");
      if (tooltip.empty()) {
          tooltip = d3.select("body")
              .append("div")
              .attr("id", "tooltip")
              .style("position", "absolute")
              .style("background", "white")
              .style("border", "1px solid #ccc")
              .style("padding", "8px")
              .style("border-radius", "4px")
              .style("display", "none")
              .style("pointer-events", "none");
      }

      function handleBarClick(event, d) {
          event.stopPropagation(); 

          if (vis.selectedBins.has(d.x0)) {
              vis.selectedBins.delete(d.x0);
          } else {
              vis.selectedBins.add(d.x0);
          }

          vis.updateHighlighting();
          updateOtherVisualizations([...vis.selectedBins]);
      }

      const bars1 = vis.chart.selectAll(".bar1")
          .data(vis.aggregatedData)
          .join("rect")
          .attr("class", "bar1")
          .attr("x", d => vis.xScale(d.x0))
          .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
          .attr("y", d => vis.yScale(d.count1))
          .attr("height", d => vis.height - vis.yScale(d.count1))
          .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(0) : "#ccc")
          .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 1 : 0.4)
          .on("click", handleBarClick)
          .on("mouseover", (event, d) => {
              tooltip.style("display", "block")
                  .html(`<strong>Range:</strong> ${d.x0} - ${d.x1}%<br><strong>Count 1:</strong> ${d.count1}`);
          })
          .on("mousemove", event => {
              tooltip.style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY + 10) + "px");
          })
          .on("mouseleave", () => {
              tooltip.style("display", "none");
          });

      const bars2 = vis.chart.selectAll(".bar2")
          .data(vis.aggregatedData)
          .join("rect")
          .attr("class", "bar2")
          .attr("x", d => vis.xScale(d.x0) + 5)
          .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
          .attr("y", d => vis.yScale(d.count2))
          .attr("height", d => vis.height - vis.yScale(d.count2))
          .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(1) : "#ccc")
          .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 1 : 0.4)
          .on("click", handleBarClick)
          .on("mouseover", (event, d) => {
              tooltip.style("display", "block")
                  .html(`<strong>Range:</strong> ${d.x0} - ${d.x1}%<br><strong>Count 2:</strong> ${d.count2}`);
          })
          .on("mousemove", event => {
              tooltip.style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY + 10) + "px");
          })
          .on("mouseleave", () => {
              tooltip.style("display", "none");
          });

      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
  }

  updateHighlighting() {
      let vis = this;

      vis.chart.selectAll(".bar1")
          .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(0) : "#ccc")
          .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 1 : 0.4);

      vis.chart.selectAll(".bar2")
          .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(1) : "#ccc")
          .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 1 : 0.4);
  }
}

function updateOtherVisualizations(selectedBins) {
  if (!selectedBins.length) {
      scatterplot.updateVis(data);
      choroplethMap.updateVis(null); // Reset map to all counties
      return;
  }

  // Filter data based on selected histogram bin
  const filteredData = data.filter(d =>
      selectedBins.some(binStart => 
          d.percent_poverty >= binStart && d.percent_poverty < binStart + 5
      )
  );

  scatterplot.updateVis(filteredData.length ? filteredData : data);
  choroplethMap.updateVis(filteredData.length ? filteredData : null);
}







