class ChoroplethMap {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 800,
      margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      tooltipPadding: 10,
      legendBottom: 50,
      legendRectHeight: 12,
      legendRectWidth: 150,
    };

    // Normalize Data
    this.data = this.normalizeData(_data);
    this.us = _data;
    this.active = d3.select(null);

    this.selectedAttr1 = "percent_poverty";
    this.selectedAttr2 = "percent_high_blood_pressure";

     this.selectedCounties = new Set(); // Track selected counties from scatterplot

    this.initVis();
  }

  normalizeData(data) {
    let attributes = [
      "percent_poverty",
      "percent_high_blood_pressure",
      "percent_stroke",
      "percent_high_cholesterol",
      "percent_eldery",
    ];

    let minMax = {};

    attributes.forEach((attr) => {
      let values = data.objects.counties.geometries
        .map((d) => d.properties[attr])
        .filter((d) => d !== undefined);
      minMax[attr] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    data.objects.counties.geometries.forEach((d) => {
      attributes.forEach((attr) => {
        if (d.properties[attr] !== undefined) {
          d.properties[attr] = this.scaleValue(
            d.properties[attr],
            minMax[attr].min,
            minMax[attr].max
          );
        }
      });
    });

    

    return data;
  }

  scaleValue(value, min, max) {
    return Math.round(((value - min) / (max - min)) * 99) + 1; // Scale to 1-100
  }

  initVis() {
    let vis = this;

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("class", "center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.svg
      .append("rect")
      .attr("class", "background center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .on("click", vis.clicked);

    vis.projection = d3.geoAlbersUsa()
      .translate([vis.width / 2, vis.height / 2])
      .scale(vis.width);

    vis.path = d3.geoPath().projection(vis.projection);

    vis.g = vis.svg.append("g")
      .attr("class", "center-container center-items us-state")
      .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("display", "none")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.3)");

    vis.drawLegend();
    vis.updateVis();
  }

  drawLegend() {
    let vis = this;

    let legendSize = 30;
    let legendPadding = 0;
    let legendLeftMargin = 50;

    let legendHeight = legendSize * 3;
    let legendWidth = legendSize * 3;

    let colors = [
      ["#4fade0", "#4e7a8d", "#59483f"],
      ["#a3cfe5", "#ac998e", "#a1623f"],
      ["#fcf1e6", "#f0b48d", "#e47b41"],
    ];

    vis.svg.select(".legend-group").remove();

    let legendGroup = vis.svg.append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(${legendPadding + legendLeftMargin}, ${vis.height - legendHeight - legendPadding - 40})`);

    colors.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        legendGroup.append("rect")
          .attr("x", colIndex * legendSize)
          .attr("y", rowIndex * legendSize)
          .attr("width", legendSize)
          .attr("height", legendSize)
          .attr("fill", color)
          .attr("stroke", "black");
      });
    });

    legendGroup.append("text")
      .attr("x", -legendSize + 10)
      .attr("y", legendHeight + 12)
      .attr("text-anchor", "end")
      .style("font-size", "14px")
      .style("writing-mode", "vertical-rl")
      .style("text-orientation", "upright")
      .text(vis.selectedAttr1.replace(/_/g, " "));

    legendGroup.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 20)
      .attr("text-anchor", "start")
      .style("font-size", "14px")
      .text(vis.selectedAttr2.replace(/_/g, " "));
  }

  updateVis() {
    let vis = this;

    vis.counties = vis.g.selectAll(".county")
      .data(topojson.feature(vis.us, vis.us.objects.counties).features)
      .join("path")
      .attr("class", "county")
      .attr("d", vis.path)
      .attr("fill", d => {
        const attr1 = d.properties[vis.selectedAttr1] || 0;
        const attr2 = d.properties[vis.selectedAttr2] || 0;

        if (attr1 <= 33 && attr2 <= 33) return "#fcf1e6";
        if (attr1 <= 66 && attr2 <= 33) return "#a3cfe5";
        if (attr1 > 66 && attr2 <= 33) return "#4fade0";

        if (attr1 <= 33 && attr2 <= 66) return "#f0b48d";
        if (attr1 <= 66 && attr2 <= 66) return "#ac998e";
        if (attr1 > 66 && attr2 <= 66) return "#4e7a8d";

        if (attr1 <= 33 && attr2 > 66) return "#e47b41";
        if (attr1 <= 66 && attr2 > 66) return "#a1623f";
        if (attr1 > 66 && attr2 > 66) return "#59483f";

        return "gray";
      })
      .on("mousemove", (event, d) => {
        vis.tooltip
          .style("display", "block")
          .style("left", `${event.pageX + vis.config.tooltipPadding}px`)
          .style("top", `${event.pageY + vis.config.tooltipPadding}px`)
          .html(`
            <div><strong>County:</strong> ${d.properties.county_name || "Unknown"}</div>
            <div><strong>State:</strong> ${d.properties.state || "Unknown"}</div>
            <div><strong>${vis.selectedAttr1.replace(/_/g, " ")}:</strong> ${d.properties[vis.selectedAttr1] || "N/A"}%</div>
            <div><strong>${vis.selectedAttr2.replace(/_/g, " ")}:</strong> ${d.properties[vis.selectedAttr2] || "N/A"}%</div>
          `);
      })
      .on("mouseleave", () => vis.tooltip.style("display", "none"));

      if (vis.us.objects.states) {
        vis.g.append("path")
          .datum(topojson.mesh(vis.us, vis.us.objects.states, (a, b) => a !== b))
          .attr("id", "state-borders")
          .attr("d", vis.path)
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", "1px");
      } else {
        console.error("State borders data is missing.");
      }

    vis.drawLegend();
  }

  setSelectedAttributes(attr1, attr2) {
    this.selectedAttr1 = attr1;
    this.selectedAttr2 = attr2;
    this.updateVis();
  }

  
}
