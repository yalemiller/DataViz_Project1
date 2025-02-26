class Scatterplot {
  constructor(_config, _data) {
      this.config = {
          parentElement: _config.parentElement,
          colorScale: _config.colorScale,
          containerWidth: _config.containerWidth || 700,
          containerHeight: _config.containerHeight || 400,
          margin: _config.margin || {top: 50, right: 20, bottom: 50, left: 50},
          tooltipPadding: _config.tooltipPadding || 15,
          pointOpacity: 0.6,
          pointSize: 6
      };
      this.data = _data;
      this.displayData = _data; // Store currently displayed data
      this.selectedX = "percent_poverty";
      this.selectedY = "percent_high_blood_pressure";
      this.selectedPoints = new Set(); // Store selected points
      this.initVis();
  }

  initVis() {
      let vis = this;

      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.xScale = d3.scaleLinear().range([0, vis.width]);
      vis.yScale = d3.scaleLinear().range([vis.height, 0]);

      vis.xAxis = d3.axisBottom(vis.xScale).ticks(10).tickSize(-vis.height - 10).tickPadding(10);
      vis.yAxis = d3.axisLeft(vis.yScale).ticks(10).tickSize(-vis.width - 10).tickPadding(10);

      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);

      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);

      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');

      vis.xLabel = vis.chart.append('text')
          .attr('class', 'axis-title')
          .attr('x', vis.width / 2)
          .attr('y', vis.height + 40)
          .attr('text-anchor', 'middle');

      vis.yLabel = vis.chart.append('text')
          .attr('class', 'axis-title')
          .attr('x', -vis.height / 2)
          .attr('y', -40)
          .attr('transform', 'rotate(-90)')
          .attr('text-anchor', 'middle');
  }

  updateVis(filteredData = null) {
    let vis = this;

    // If filteredData is provided (from the choropleth map), use it; otherwise, show all data
    vis.displayData = filteredData ? filteredData : vis.data;

    // Define x and y values for scaling
    vis.xValue = d => +d[vis.selectedX];
    vis.yValue = d => +d[vis.selectedY];

    // Remove invalid values
    vis.filteredData = vis.displayData.filter(d => vis.xValue(d) !== -1 && vis.yValue(d) !== -1);

    // Set domain based on filtered data
    if (vis.filteredData.length === 0) {
        vis.xScale.domain([0, 10]);
        vis.yScale.domain([0, 10]);
    } else {
        vis.xScale.domain([0, d3.max(vis.filteredData, vis.xValue) * 1.1]);
        vis.yScale.domain([0, d3.max(vis.filteredData, vis.yValue) * 1.1]);
    }

    // Update axis labels
    vis.xLabel.text(vis.selectedX.replace(/_/g, " "));
    vis.yLabel.text(vis.selectedY.replace(/_/g, " "));

    // Re-render visualization
    vis.renderVis();
}



  renderVis() {
      let vis = this;

      const circles = vis.chart.selectAll('.point')
          .data(vis.filteredData, d => d.trail)
          .join('circle')
          .attr('class', 'point')
          .attr('r', vis.config.pointSize)
          .attr('cy', d => vis.yScale(vis.yValue(d)))
          .attr('cx', d => vis.xScale(vis.xValue(d)))
          .attr('fill', d => vis.selectedPoints.size === 0 || vis.selectedPoints.has(d) 
              ? '#4fade0' 
              : '#d3d3d3')
          .attr('opacity', d => vis.selectedPoints.size === 0 || vis.selectedPoints.has(d) 
              ? 1 
              : 0.3)
          .attr('stroke', d => vis.selectedPoints.has(d) ? '#ff5733' : '#368cb2') 
          .attr('stroke-width', 1.5)
          .on('click', (event, d) => {
            event.stopPropagation();
        
            if (vis.selectedPoints.has(d)) {
                vis.selectedPoints.delete(d);
            } else {
                vis.selectedPoints.add(d);
            }
        
            vis.updateHighlighting();
        
            // Convert selected points to a list of selected counties
            const selectedData = Array.from(vis.selectedPoints);
        
            // Update the histogram with selected data or reset if empty
            histogram.updateVis(selectedData.length > 0 ? selectedData : vis.data);
        
            // Update the choropleth map to reflect selected counties
            choroplethMap.updateVis(selectedData.length > 0 ? selectedData : null);
        });
        
        

      // Click anywhere outside to reset selection
      vis.svg.on('click', () => {
        vis.selectedPoints.clear();
        vis.updateHighlighting();
        histogram.updateVis(vis.data); // Pass full dataset when selection is cleared
        choroplethmap.updateVis(vis.data); // Pass full dataset when selection is cleared
        
    });

    // Tooltip behavior
circles.on('mousemove', (event, d) => {
  d3.select('#tooltip')
      .style('display', 'block')
      .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
      .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
      .html(`
          <div><strong>County:</strong> ${d.county_name || "Unknown"}</div>
          <div><strong>State:</strong> ${d.state || "Unknown"}</div>
          <div><strong>${vis.selectedX.replace(/_/g, " ")}:</strong> ${d[vis.selectedX] || "N/A"}%</div>
          <div><strong>${vis.selectedY.replace(/_/g, " ")}:</strong> ${d[vis.selectedY] || "N/A"}%</div>
      `);
})
.on('mouseleave', () => {
  d3.select('#tooltip').style('display', 'none');
});
      vis.xAxisG.call(vis.xAxis).call(g => g.select('.domain').remove());
      vis.yAxisG.call(vis.yAxis).call(g => g.select('.domain').remove());
  }

  updateHighlighting() {
      let vis = this;

      vis.chart.selectAll('.point')
          .attr('fill', d => vis.selectedPoints.size === 0 || vis.selectedPoints.has(d) 
              ? '#4fade0' 
              : '#d3d3d3')
          .attr('opacity', d => vis.selectedPoints.size === 0 || vis.selectedPoints.has(d) 
              ? 1 
              : 0.3);
  }
}
