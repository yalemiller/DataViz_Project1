let data, scatterplot, histogram;
let difficultyFilter = [];


d3.csv('data/data.csv')
  .then(_data => {
    data = _data;
    console.log('Data loading complete. Work with dataset.');
  	data = _data;
    console.log(data);

    // Initialize scales
    const colorScale = d3.scaleOrdinal()
        .range(['#d3eecd', '#7bc77e', '#2a8d46']) // light green to dark green
        .domain(['Easy','Intermediate','Difficult']);
    
    scatterplot = new Scatterplot({ 
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);
    scatterplot.updateVis();

    histogram = new Histogram({
      parentElement: '#histogram',
      colorScale: colorScale
    }, data);
    histogram.updateVis();
  })
  .catch(error => console.error(error));



  Promise.all([
    d3.json('data/counties-10m.json'),
    d3.csv('data/population.csv')
  ]).then(data => {
    const geoData = data[0];
    const countyPopulationData = data[1];
  
    // Combine both datasets by adding the population density to the TopoJSON file
    console.log(geoData);
    geoData.objects.counties.geometries.forEach(d => {
      console.log(d);  
      for (let i = 0; i < countyPopulationData.length; i++) {
        if (d.id === countyPopulationData[i].cnty_fips) {
          d.properties.pop = +countyPopulationData[i].Value;
        }
  
      }
    });
  
    const choroplethMap = new ChoroplethMap({ 
      parentElement: '.viz',   
    }, geoData);
  })
  .catch(error => console.error(error));
  







/**
 * Use bar chart as filter and update scatter plot accordingly
 */
function filterData() {
  if (difficultyFilter.length == 0) {
    scatterplot.data = data;
  } else {
    scatterplot.data = data.filter(d => difficultyFilter.includes(d.difficulty));
  }
  scatterplot.updateVis();
}