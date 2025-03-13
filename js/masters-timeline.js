// National Masters Timeline Visualization

// Set the dimensions and margins of the graph
const mastersMargin = {top: 50, right: 80, bottom: 100, left: 60};

let mastersWidth = document.getElementById("masters-parent").getBoundingClientRect().width - mastersMargin.left - mastersMargin.right;
let mastersHeight = document.getElementById("masters-parent").getBoundingClientRect().height - mastersMargin.top - mastersMargin.bottom;

// Create SVG element
let mastersSvg = d3.select("#masters-visualization").append("svg")
    .attr("width", mastersWidth + mastersMargin.left + mastersMargin.right)
    .attr("height", mastersHeight + mastersMargin.top + mastersMargin.bottom)
    .append("g")
    .attr("transform", `translate(${mastersMargin.left},${mastersMargin.top})`);

// Create chess-themed background patterns
function createChessPatterns(svg) {
    // Define defs element for patterns
    const defs = svg.append("defs");
    
    // Chess board pattern
    defs.append("pattern")
        .attr("id", "chess-board")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 40)
        .attr("height", 40)
        .append("g")
            .selectAll("rect")
            .data([0, 1, 2, 3])
            .enter()
            .append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", d => d % 2 === 0 ? 0 : 20)
            .attr("y", d => Math.floor(d / 2) * 20)
            .attr("fill", "#f0f0f0");
}

// Parse the date string
const parseDate = d3.timeParse("%Y-%m-%d");
// Function to load and visualize the data
function loadMastersData() {
    // Replace the d3.csv call with d3.dsv to explicitly set comma as delimiter
    d3.dsv(",", "data/national_masters.csv")
        .then(data => {
            console.log("Loaded data:", data.length, "masters");

            // Filter out entries without a valid title_achieved date
            data = data.filter(d => d.title_achieved && d.title_achieved.trim().length > 0);
            console.log("Data with valid title_achieved date:", data.length);
            
            // Parse dates and prepare data
            data.forEach(d => {
                d.date = parseDate(d.title_achieved);
                d.year = d.date ? d.date.getFullYear() : null;
                
                // Parse tournaments into an array for additional info
                if (d.tournaments && d.tournaments.trim().length > 0) {
                    d.tournamentsList = d.tournaments.split('; ').map(t => {
                        const parts = t.split(':');
                        return {
                            eventId: parts[0],
                            performance: parts[1] ? parseInt(parts[1]) : null
                        };
                    });
                } else {
                    d.tournamentsList = [];
                }
            });
            
            // Filter out entries without valid dates after parsing
            data = data.filter(d => d.date !== null);
            console.log("Data with valid dates after parsing:", data.length);
            
            // Sort data by date
            data.sort((a, b) => a.date - b.date);
            
            // Find the min and max years in the data to create a continuous domain
            const minYear = d3.min(data, d => d.year);
            const maxYear = d3.max(data, d => d.year);
            console.log(`Year range: ${minYear} to ${maxYear}`);
            
            // Create a continuous array of years, starting from 2000
            const years = [];
            const startYear = Math.max(2000, minYear); // Use 2000 or minYear, whichever is larger
            for (let year = startYear; year <= maxYear; year++) {
                years.push(year);
            }
            
            // Group by year for the histogram
            const yearGroups = d3.group(data, d => d.year);
            const yearCounts = years.map(year => ({
                year: year,
                count: yearGroups.has(year) ? yearGroups.get(year).length : 0
            }));
            
            // Calculate cumulative total before 2000 to use as starting point
            let priorTotal = 0;
            if (startYear > minYear) {
                for (let year = minYear; year < startYear; year++) {
                    priorTotal += yearGroups.has(year) ? yearGroups.get(year).length : 0;
                }
                console.log(`Masters before ${startYear}: ${priorTotal}`);
            }
            
            // Set up X axis
            const x = d3.scaleBand()
                .domain(years)
                .range([0, mastersWidth])
                .padding(0.1);
            
            // Create X axis
            mastersSvg.append("g")
                .attr("class", "x-axis axis")
                .attr("transform", `translate(0,${mastersHeight})`)
                .call(d3.axisBottom(x).tickValues(years.filter(d => d % 5 === 0)))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");
            
            // Add X axis label
            mastersSvg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", mastersWidth / 2)
               
                .attr("y", mastersHeight + mastersMargin.bottom - 10)
                .text("Year");
            
            // Set up Y axis
            const y = d3.scaleLinear()
                .domain([0, d3.max(yearCounts, d => d.count) || 10])
                .range([mastersHeight, 0]);
            
            // Create Y axis
            mastersSvg.append("g")
                .attr("class", "y-axis axis")
                .call(d3.axisLeft(y).ticks(5));
            
            // Add Y axis label
            mastersSvg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
               
                .attr("y", -mastersMargin.left + 20)
                .attr("x", -mastersHeight / 2)
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
            mastersSvg.selectAll(".bar")
                .data(yearCounts)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.year))
                .attr("y", d => y(d.count))
                .attr("width", x.bandwidth())
                .attr("height", d => mastersHeight - y(d.count))
                .attr("fill", d => d.count > 0 ? "#4682b4" : "#dddddd")
                .on("mouseover", function(event, d) {
                    if (d.count === 0) return; // Skip tooltip for empty bars
                    
                    // Show tooltip on hover
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    
                    // Get the masters from this year to show in tooltip
                    const mastersThisYear = yearGroups.get(d.year) || [];
                    let mastersText = `<strong>Year: ${d.year}</strong><br>New Masters: ${d.count}<br><br>`;
                    
                    // Add up to 5 master IDs to the tooltip
                    mastersText += mastersThisYear
                        .slice(0, 5)
                        .map(m => `Player ${m.cfc_id} (${m.tournamentsList.length} qualifying tournaments)`)
                        .join("<br>");
                    
                    if (mastersThisYear.length > 5) {
                        mastersText += `<br>... and ${mastersThisYear.length - 5} more`;
                    }
                    
                    tooltip.html(mastersText)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    
                    d3.select(this)
                        .attr("fill", "#ff7f0e");
                })
                .on("mouseout", function(event, d) {
                    // Hide tooltip
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                    
                    d3.select(this)
                        .attr("fill", d.count > 0 ? "#4682b4" : "#dddddd");
                })
                .on("click", function(event, d) {
                    // Only process click if there are masters in this year
                    if (d.count === 0) return;
                    
                    // Get the masters from this year
                    const mastersThisYear = yearGroups.get(d.year) || [];
                    
                    // Create or update the masters list container
                    let mastersListContainer = d3.select("#masters-list-container");
                    
                    // If the container doesn't exist, create it
                    if (mastersListContainer.empty()) {
                        mastersListContainer = d3.select("#masters-visualization")
                            .append("div")
                            .attr("id", "masters-list-container")
                            .style("margin-top", "20px")
                            .style("padding", "10px")
                            .style("border", "1px solid #ddd")
                            .style("border-radius", "5px")
                            .style("background-color", "#f9f9f9");
                    }
                    
                    // Create the content for the masters list
                    let mastersListHTML = `
                        <h4>National Masters Achieved in ${d.year} (${d.count} total)</h4>
                        <table class="table table-striped table-sm">
                            <thead>
                                <tr>
                                    <th>Player Name</th>
                                    <th>Player ID</th>
                                    <th>Date Achieved</th>
                                    <th>Province</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    // Add each master to the table
                    mastersThisYear.forEach(master => {
                        mastersListHTML += `
                            <tr>
                                <td>${master.player_name}</td>
                                <td>${master.cfc_id}</td>
                                <td>${master.title_achieved}</td>
                                <td>${master.province}</td>
                            </tr>
                        `;
                    });
                    
                    mastersListHTML += `
                            </tbody>
                        </table>
                        <button id="close-masters-list" class="btn btn-sm btn-secondary">Close</button>
                    `;
                    
                    // Set the HTML content
                    mastersListContainer.html(mastersListHTML);
                    
                    // Add click event listener to the close button
                    d3.select("#close-masters-list").on("click", function() {
                        mastersListContainer.style("display", "none");
                    });
                    
                    // Show the container
                    mastersListContainer.style("display", "block");
                });
            
            // Add title
            mastersSvg.append("text")
                .attr("x", mastersWidth / 2)
                .attr("y", -mastersMargin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("font-weight", "bold")
               
                .text("Canadian National Chess Masters By Year Since 2000");
            
            // Add cumulative line
            const cumulativeData = [];
            let cumulative = priorTotal; // Start with the count of masters before 2000
            
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
                .range([mastersHeight, 0]);
            
            mastersSvg.append("g")
                .attr("class", "y2-axis axis")
                .attr("transform", `translate(${mastersWidth}, 0)`)
                .call(d3.axisRight(y2));
            
            // Add secondary Y axis label
            mastersSvg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(90)")
               
                .attr("y", -mastersWidth - mastersMargin.right + 20)
                .attr("x", mastersHeight / 2)
                .text("Cumulative Number of Masters");
            
            // Create line generator
            const line = d3.line()
                .x(d => x(d.year) + x.bandwidth() / 2)
                .y(d => y2(d.count));
            
            // Add the line
            mastersSvg.append("path")
                .datum(cumulativeData)
                .attr("fill", "none")
                .attr("stroke", "#e41a1c")
                .attr("stroke-width", 2)
                .attr("d", line);
            
            // Add circles at each data point on the line
            mastersSvg.selectAll(".dot")
                .data(cumulativeData)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", d => x(d.year) + x.bandwidth() / 2)
                .attr("cy", d => y2(d.count))
                .attr("r", 3)
                .attr("fill", "#e41a1c")
                .on("mouseover", function(event, d) {
                    showTooltip(event, d);
                  })
                  .on("mouseout", function() {
                    hideTooltip();
                  })
                  .on("mousemove", function(event, d) {
                    // Update tooltip position as mouse moves
                    d3.select("#masters-tooltip")
                      .style("left", (event.pageX + 15) + "px")
                      .style("top", (event.pageY - 28) + "px");
                  });
            
            // Relocate legend to bottom right, below the graph
            const legend = mastersSvg.append("g")
                .attr("transform", `translate(${mastersWidth - 150}, ${mastersHeight + 30})`);
            
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
        // Display error message in the visualization area
        d3.select("#masters-visualization")
            .append("div")
            .attr("class", "alert alert-danger")
            .style("margin-top", "20px")
            .html(`<strong>Error loading data:</strong><br>${error}`);
    });
}

// Add or update the tooltip logic in your visualization code

// Inside your visualization code add these functions for tooltip handling
function showTooltip(event, d) {
    console.log("Show tooltip for data point");
  const tooltip = d3.select("#masters-tooltip");
  
  // Set tooltip content
  tooltip.select("#masters-value")
    .html(`Year: ${d.year}<br>Total Masters: ${d.count}`);
  
  // Position the tooltip near the mouse pointer
  tooltip
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px")
    .classed("hidden", false)
    .classed("visible", true);
}

function hideTooltip() {
  d3.select("#masters-tooltip")
    .classed("visible", false)
    .classed("hidden", true);
}

// Add event listener for window resize
function handleResize() {
    // Update width based on current container width
    mastersWidth = document.getElementById('masters-visualization').clientWidth - mastersMargin.left - mastersMargin.right;
    
    // Update SVG dimensions
    d3.select("#masters-visualization svg")
        .attr("width", mastersWidth + mastersMargin.left + mastersMargin.right);
    
    // Redraw the visualization with new dimensions
    mastersSvg.selectAll("*").remove();
    loadMastersData();
}

// Add window resize listener
window.addEventListener('resize', handleResize);

// Wait for the DOM to be ready before drawing the visualization
document.addEventListener("DOMContentLoaded", loadMastersData);
