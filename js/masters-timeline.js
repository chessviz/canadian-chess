// National Masters Timeline Visualization

// Set the dimensions and margins of the graph
const margin = {top: 50, right: 30, bottom: 70, left: 60},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Parse the date string
const parseDate = d3.timeParse("%Y-%m-%d");

// Function to load and visualize the data
function loadMastersData() {
    d3.csv("data/national_masters.csv").then(function(data) {
        // Filter out entries without a valid title_achieved date
        data = data.filter(d => d.title_achieved && d.title_achieved.length > 0);
        
        // Parse dates and prepare data
        data.forEach(d => {
            d.date = parseDate(d.title_achieved);
            d.year = d.date ? d.date.getFullYear() : null;
        });
        
        // Filter out entries without valid dates after parsing
        data = data.filter(d => d.date !== null);
        
        // Sort data by date
        data.sort((a, b) => a.date - b.date);
        
        // Group by year for the histogram
        const yearGroups = d3.group(data, d => d.year);
        const yearCounts = Array.from(yearGroups, ([year, values]) => ({
            year: year,
            count: values.length
        }));
        
        // Create SVG
        const svg = d3.select("#masters-visualization")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Set up X axis
        const x = d3.scaleBand()
            .domain(yearCounts.map(d => d.year))
            .range([0, width])
            .padding(0.1);
        
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickValues(x.domain().filter(d => d % 5 === 0)))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        
        // Add X axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Year");
        
        // Set up Y axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(yearCounts, d => d.count)])
            .range([height, 0]);
        
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5));
        
        // Add Y axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2)
            .text("Number of New National Masters");
        
        // Create tooltip div
        const tooltip = d3.select("#masters-visualization")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");
        
        // Draw bars
        svg.selectAll(".bar")
            .data(yearCounts)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", "#4682b4")
            .on("mouseover", function(event, d) {
                // Show tooltip on hover
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Year: ${d.year}<br>New Masters: ${d.count}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                d3.select(this)
                    .attr("fill", "#ff7f0e");
            })
            .on("mouseout", function() {
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this)
                    .attr("fill", "#4682b4");
            });
        
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text("Canadian National Chess Masters By Year");
        
        // Add cumulative line
        const cumulativeData = [];
        let cumulative = 0;
        
        yearCounts.forEach(d => {
            cumulative += d.count;
            cumulativeData.push({
                year: d.year,
                count: cumulative
            });
        });
        
        // Create secondary Y axis for cumulative line
        const y2 = d3.scaleLinear()
            .domain([0, d3.max(cumulativeData, d => d.count)])
            .range([height, 0]);
        
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(y2));
        
        // Add secondary Y axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(90)")
            .attr("y", -width - margin.right + 20)
            .attr("x", height / 2)
            .text("Cumulative Number of Masters");
        
        // Create line generator
        const line = d3.line()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y(d => y2(d.count));
        
        // Add the line
        svg.append("path")
            .datum(cumulativeData)
            .attr("fill", "none")
            .attr("stroke", "#e41a1c")
            .attr("stroke-width", 2)
            .attr("d", line);
        
        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 150}, 0)`);
        
        // Add bar legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#4682b4");
        
        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text("New Masters Per Year");
        
        // Add line legend
        legend.append("line")
            .attr("x1", 0)
            .attr("y1", 40)
            .attr("x2", 20)
            .attr("y2", 40)
            .attr("stroke", "#e41a1c")
            .attr("stroke-width", 2);
        
        legend.append("text")
            .attr("x", 30)
            .attr("y", 45)
            .text("Cumulative Masters");
    }).catch(error => {
        console.error("Error loading the CSV data: ", error);
    });
}

// Wait for the DOM to be ready before drawing the visualization
document.addEventListener("DOMContentLoaded", loadMastersData);
