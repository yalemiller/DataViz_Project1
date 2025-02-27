let data, scatterplot, histogram, choroplethMap;

// Load CSV data and process it
// Converts numeric columns and initializes visualization components
d3.csv('data/data.csv')
    .then(_data => {
        data = _data;
        console.log('Data successfully loaded.', data);

        // Convert specific columns to numeric values
        data.forEach(d => {
            d.percent_poverty = +d.percent_poverty;
            d.percent_high_blood_pressure = +d.percent_high_blood_pressure;
            d.percent_stroke = +d.percent_stroke;
            d.percent_high_cholesterol = +d.percent_high_cholesterol;
            d.percent_eldery = +d.percent_eldery;
        });

        // Define color scale for visualizations
        const colorScale = d3.scaleOrdinal()
            .range(['#1f77b4', '#ff7f0e'])
            .domain(['Data 1', 'Data 2']);

        // Add UI elements: Title and dropdowns for attribute selection
        d3.select("body").append("div")
            .attr("id", "dropdown-container")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .html(`
        <h1>Poverty vs Health Issues in the United States</h1>
        <h3>Data Provided by the CDC 2024 Health Data</h3>
        <label for="data1">Select Attribute 1:</label>
        <select id="data1"></select>
        <label for="data2">Select Attribute 2:</label>
        <select id="data2"></select>
      `);

        // List of columns to populate dropdowns
        const columns = ["percent_poverty", "percent_high_blood_pressure", "percent_stroke", "percent_high_cholesterol", "percent_eldery"];

        // Populate dropdown options
        columns.forEach(col => {
            d3.select("#data1").append("option").attr("value", col).text(col.replace(/_/g, " "));
            d3.select("#data2").append("option").attr("value", col).text(col.replace(/_/g, " "));
        });

        // Set default dropdown values
        d3.select("#data1").property("value", "percent_poverty");
        d3.select("#data2").property("value", "percent_high_blood_pressure");

        // Initialize Histogram visualization
        histogram = new Histogram({
            parentElement: '#histogram',
            colorScale
        }, data);
        histogram.selectedData1 = "percent_poverty";
        histogram.selectedData2 = "percent_high_blood_pressure";
        histogram.updateVis();

        // Initialize Scatterplot visualization
        scatterplot = new Scatterplot({
            parentElement: '#scatterplot',
            colorScale
        }, data);
        scatterplot.selectedX = "percent_poverty";
        scatterplot.selectedY = "percent_high_blood_pressure";
        scatterplot.updateVis();

        // Update visualizations on dropdown change
        d3.select("#data1").on("change", function() {
            const selectedValue = this.value;
            histogram.selectedData1 = selectedValue;
            scatterplot.selectedX = selectedValue;

            if (choroplethMap) {
                choroplethMap.setSelectedAttributes(selectedValue, choroplethMap.selectedAttr2);
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
            }

            histogram.updateVis();
            scatterplot.updateVis();
        });
    })
    .catch(error => console.error('Error loading CSV data:', error));

// Load GeoJSON and CSV for Choropleth Map
Promise.all([
        d3.json('data/counties-10m.json'),
        d3.csv('data/data.csv')
    ])
    .then(([geoData, countyData]) => {
        // Merge CSV data into GeoJSON structure
        geoData.objects.counties.geometries.forEach(d => {
            let match = countyData.find(row => row.fips === d.id || "0" + row.fips === d.id);

            if (match) {
                d.properties = {
                    ...match
                };
                d.properties.pop = +match.percent_poverty;
            }
        });

        // Initialize Choropleth Map
        choroplethMap = new ChoroplethMap({
            parentElement: '.viz'
        }, geoData);
    })
    .catch(error => console.error('Error loading GeoJSON data:', error));