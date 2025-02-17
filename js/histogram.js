class Histogram {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        colorScale: _config.colorScale,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 300,
        margin: _config.margin || {top: 25, right: 20, bottom: 40, left: 40},
      }
      this.data = _data;
      this.initVis();
    }
    
    initVis() {
      let vis = this;
  
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Scales
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]);

      vis.xScale = d3.scaleLinear()
          .range([0, vis.width])
          .domain([0, 100]);  // x-axis domain from 0% to 100%
  
      vis.xAxis = d3.axisBottom(vis.xScale)
          .ticks(10)
          .tickSizeOuter(0);

      vis.yAxis = d3.axisLeft(vis.yScale)
          .ticks(6)
          .tickSizeOuter(0);
  
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
  
      vis.svg.append('text')
          .attr('class', 'axis-title')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.71em')
          .text('Frequency');
    }
  
    updateVis() {
      let vis = this;

      // Extract the relevant data field (percent_poverty in this case)
      const povertyData = vis.data.map(d => d.percent_poverty);

      // Bin the data using D3's histogram function
      const histogram = d3.histogram()
          .domain([0, 100])  // Set the domain to cover 0% to 100%
          .thresholds(20);  // Use 20 bins (can adjust the number of bins as needed)
  
      const bins = histogram(povertyData);
  
      // Prepare aggregated data (the frequency count in each bin)
      vis.aggregatedData = bins.map(bin => ({
        x0: bin.x0,     // Starting boundary of the bin
        x1: bin.x1,     // Ending boundary of the bin
        count: bin.length, // Number of occurrences in this bin
      }));

      // Set the domain for the scales
      vis.yScale.domain([0, d3.max(vis.aggregatedData, d => d.count)]);  // Max count for y-axis
  
      vis.renderVis();
    }
  
    renderVis() {
      let vis = this;
  
      const bars = vis.chart.selectAll('.bar')
          .data(vis.aggregatedData)
        .join('rect')
          .attr('class', 'bar')
          .attr('x', d => vis.xScale(d.x0)) // Position of the bar on the x-axis
          .attr('width', d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1) // Width based on bin size
          .attr('height', d => vis.height - vis.yScale(d.count))  // Height based on frequency
          .attr('y', d => vis.yScale(d.count))  // Position of the bar on the y-axis
          .attr('fill', 'steelblue');
  
      // Update axes
      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
    }
}
