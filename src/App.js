import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./App.css";

function App() {
  const [educationData, setEducationData] = useState([]);
  const [usCountyData, setUsCountyData] = useState(null);

  useEffect(() => {
    // Fetch education data
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
    ).then((data) => {
      setEducationData(data);
    });

    // Fetch US county data
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    ).then((data) => {
      setUsCountyData(data);
    });
  }, []);

  useEffect(() => {
    if (educationData.length && usCountyData) {
      createChoroplethMap();
    }
  }, [educationData, usCountyData]);

  const createChoroplethMap = () => {
    const path = d3.geoPath();
    const width = 960;
    const height = 600;

    // Clear any existing SVG to avoid duplicates
    d3.select("#choropleth-map").selectAll("svg").remove();

    // Color scale
    const colorScale = d3
      .scaleQuantize()
      .domain([
        d3.min(educationData, (d) => d.bachelorsOrHigher),
        d3.max(educationData, (d) => d.bachelorsOrHigher),
      ])
      .range(d3.schemeBlues[9]);

    const svg = d3
      .select("#choropleth-map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    svg
      .append("g")
      .selectAll("path")
      .data(
        topojson.feature(usCountyData, usCountyData.objects.counties).features
      )
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => {
        const result = educationData.find((ed) => ed.fips === d.id);
        return result ? result.bachelorsOrHigher : 0;
      })
      .attr("fill", (d) => {
        const result = educationData.find((ed) => ed.fips === d.id);
        return result ? colorScale(result.bachelorsOrHigher) : colorScale(0);
      })
      .attr("d", path)
      .on("mouseover", () => console.log("Mouseover event"))
      .on("mouseout", () => console.log("Mouseout event"))
      .on("mouseover", (event, d) => {
        const result = educationData.find(obj => obj.fips === d.id);
        if (result) {
          d3.select("#tooltip")
            .style("opacity", 0.9)
            .html(`${result.area_name}, ${result.state}: ${result.bachelorsOrHigher}%`)
            .attr("data-education", result.bachelorsOrHigher)
            .style("left", `${event.pageX + 5}px`) // Adjusted for a small offset
            .style("top", `${event.pageY - 28}px`);
        }
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      });

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", "translate(500,20)"); // Adjust position as needed

    // Define legend scale and axis
    const legendScale = d3
      .scaleLinear()
      .domain(d3.extent(educationData, (d) => d.bachelorsOrHigher))
      .range([0, 300]); 

      const legendAxis = d3.axisBottom(legendScale)
      .tickSize(13)
      .tickFormat(d => `${Math.round(d)}%`);

    legend.call(legendAxis);

    // Add colored rectangles for legend
    const legendItemWidth = 300 / colorScale.range().length; // Calculate width of each color box
    legend.selectAll("rect")
      .data(colorScale.range().map(color => {
        const d = colorScale.invertExtent(color);
        if (d[0] == null) d[0] = legendScale.domain()[0];
        if (d[1] == null) d[1] = legendScale.domain()[1];
        return d;
      }))
      .enter().append("rect")
      .attr("x", (d, i) => legendItemWidth * i)
      .attr("width", legendItemWidth)
      .attr("height", 13)
      .attr("fill", d => colorScale(d[0]));
  };

  return (
    <div className="App">
      <h1 id="title">United States Educational Attainment</h1>
      <p id="description">
      Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)
      </p>
      <div id="choropleth-map"></div>
      <div id="tooltip" style={{ position: "absolute", opacity: 0 }}></div>
    </div>
  );
}

export default App;
