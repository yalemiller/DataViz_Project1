let data, scatterplot, histogram, choroplethMap;

// Load the CSV data
d3.csv('data/data.csv')
  .then(_data => {
    data = _data;
    console.log('Data loading complete.');
    console.log(data);

    // Convert relevant columns to numeric values
    data.forEach(d => {
      d.percent_poverty = +d.percent_poverty;
      d.percent_high_blood_pressure = +d.percent_high_blood_pressure;
      d.percent_stroke = +d.percent_stroke;
      d.percent_high_cholesterol = +d.percent_high_cholesterol;
      d.percent_eldery = +d.percent_eldery;
    });

    // Initialize scales
    const colorScale = d3.scaleOrdinal()
        .range(['#1f77b4', '#ff7f0e']) // Blue & Orange for histogram
        .domain(['Data 1', 'Data 2']);

    // Add title and dropdowns for Histogram and Scatterplot
    d3.select("body").append("div")
      .attr("id", "dropdown-container")
      .style("position", "absolute")
      .style("top", "10px")
      .style("left", "10px") // Move dropdown to the left
      .html(`
        <h3>Select Data for Visualization</h3>
        <label for="data1">Select Data 1:</label>
        <select id="data1"></select>

        <label for="data2">Select Data 2:</label>
        <select id="data2"></select>
      `);

    // Get column names for dropdown options
    const columns = ["percent_poverty", "percent_high_blood_pressure", "percent_stroke", "percent_high_cholesterol", "percent_eldery"];

    // Populate dropdown options
    columns.forEach(col => {
      d3.select("#data1").append("option").attr("value", col).text(col.replace(/_/g, " "));
      d3.select("#data2").append("option").attr("value", col).text(col.replace(/_/g, " "));
    });

    // Set default values
    d3.select("#data1").property("value", "percent_poverty");
    d3.select("#data2").property("value", "percent_high_blood_pressure");

    // Initialize the Histogram
    histogram = new Histogram({
      parentElement: '#histogram',
      colorScale: colorScale
    }, data);

    histogram.selectedData1 = "percent_poverty";
    histogram.selectedData2 = "percent_high_blood_pressure";
    histogram.updateVis();

    // Initialize Scatterplot
    scatterplot = new Scatterplot({ 
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);

    scatterplot.selectedX = "percent_poverty";
    scatterplot.selectedY = "percent_high_blood_pressure";
    scatterplot.updateVis();

    // Listen for dropdown changes and update charts and map
    d3.select("#data1").on("change", function() {
      const selectedValue = this.value;
      histogram.selectedData1 = selectedValue;
      scatterplot.selectedX = selectedValue;
      
      if (choroplethMap) { 
        choroplethMap.setSelectedAttributes(selectedValue, choroplethMap.selectedAttr2);
      } else {
        console.warn("Choropleth map is not initialized yet.");
      }
    
      histogram.updateVis();
      scatterplot.updateVis();
    });
    
    d3.select("#data2").on("change", function() {
      const selectedValue = this.value;
      histogram.selectedData2 = selectedValue;
      scatterplot.selectedY = selectedValue;
      
      if (choroplethMap) { 
        choroplethMap.setSelectedAttributes(choroplethMap.selectedAttr1, selectedValue);
      } else {
        console.warn("Choropleth map is not initialized yet.");
      }
    
      histogram.updateVis();
      scatterplot.updateVis();
    });
    

  })
  .catch(error => console.error(error));

// Load GeoJSON and CSV for Choropleth Map
Promise.all([
  d3.json('data/counties-10m.json'),
  d3.csv('data/data.csv')
]).then(data => {
  const geoData = data[0];
  const countyData = data[1];

  // Merge CSV data into GeoJSON
  geoData.objects.counties.geometries.forEach(d => {
    let match = countyData.find(row => row.fips === d.id || "0" + row.fips === d.id);
    
    if (match) {
      d.properties = { ...match }; // Assign all CSV properties to GeoJSON
      d.properties.pop = +match.percent_poverty; // Ensure numeric value for color scale
    }
  });

  choroplethMap = new ChoroplethMap({ 
    parentElement: '.viz',   
  }, geoData);
}).catch(error => console.error(error));
