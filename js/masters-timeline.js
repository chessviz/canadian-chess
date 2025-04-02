// National Masters Timeline Visualization

// Set the dimensions and margins of the graph
const mastersMargin = { top: 50, right: 80, bottom: 100, left: 60 };

// Reduce height to make room for explanation text
let mastersHeight = 600 - mastersMargin.top - mastersMargin.bottom;

let mastersWidth =
  1000 -
  mastersMargin.left -
  mastersMargin.right;
// let mastersWidth =
//   document.getElementById("masters-parent").getBoundingClientRect().width -
//   mastersMargin.left -
//   mastersMargin.right;
// let mastersHeight = document.getElementById("masters-parent").getBoundingClientRect().height - mastersMargin.top - mastersMargin.bottom;

// Create SVG element
let mastersSvg = d3
  .select("#masters-visualization")
  .append("svg")
  .attr("width", mastersWidth + mastersMargin.left + mastersMargin.right)
  .attr("height", mastersHeight + mastersMargin.top + mastersMargin.bottom)
  .style("max-height", "600vh") // Reduce max-height from 500px to 400px
  .style("display", "block") // Make SVG a block element
  .style("margin", "0 auto") // Center the SVG horizontally
  .append("g")
  .attr("transform", `translate(${mastersMargin.left},${mastersMargin.top})`);

// Create chess-themed background patterns
function createChessPatterns(svg) {
  // Define defs element for patterns
  const defs = svg.append("defs");

  // Chess board pattern
  defs
    .append("pattern")
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
    .attr("x", (d) => (d % 2 === 0 ? 0 : 20))
    .attr("y", (d) => Math.floor(d / 2) * 20)
    .attr("fill", "#f0f0f0");
}

// Parse the date string
const parseDate = d3.timeParse("%Y-%m-%d");
// Function to load and visualize the data
function loadMastersData() {
  // First, ensure the parent container has proper centering styles
  d3.select("#masters-visualization")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("min-height", "400px"); // Set minimum height for the container

  // Replace the d3.csv call with d3.dsv to explicitly set comma as delimiter
  d3.dsv(",", "data/national_masters.csv")
    .then((data) => {
      console.log("Loaded data:", data.length, "masters");

      // Filter out entries without a valid title_achieved date
      data = data.filter(
        (d) => d.title_achieved && d.title_achieved.trim().length > 0
      );
      console.log("Data with valid title_achieved date:", data.length);

      // Parse dates and prepare data
      data.forEach((d) => {
        d.date = parseDate(d.title_achieved);
        d.year = d.date ? d.date.getFullYear() : null;

        // Parse tournaments into an array for additional info
        if (d.tournaments && d.tournaments.trim().length > 0) {
          d.tournamentsList = d.tournaments.split("; ").map((t) => {
            const parts = t.split(":");
            return {
              eventId: parts[0],
              performance: parts[1] ? parseInt(parts[1]) : null,
            };
          });
        } else {
          d.tournamentsList = [];
        }
      });

      // Filter out entries without valid dates after parsing
      data = data.filter((d) => d.date !== null);
      console.log("Data with valid dates after parsing:", data.length);

      // Sort data by date
      data.sort((a, b) => a.date - b.date);

      // Find the min and max years in the data to create a continuous domain
      const minYear = d3.min(data, (d) => d.year);
      const maxYear = d3.max(data, (d) => d.year);
      console.log(`Year range: ${minYear} to ${maxYear}`);

      // Create a continuous array of years, starting from 2000
      const years = [];
      const startYear = Math.max(2000, minYear); // Use 2000 or minYear, whichever is larger
      for (let year = startYear; year <= maxYear; year++) {
        years.push(year);
      }

      // Group by year for the histogram
      const yearGroups = d3.group(data, (d) => d.year);
      const yearCounts = years.map((year) => ({
        year: year,
        count: yearGroups.has(year) ? yearGroups.get(year).length : 0,
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
      const x = d3
        .scaleBand()
        .domain(years)
        .range([0, mastersWidth])
        .padding(0.1);

      // Create X axis
      mastersSvg
        .append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0,${mastersHeight})`)
        .call(d3.axisBottom(x).tickValues(years.filter((d) => d % 5 === 0)))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      // Add X axis label
      mastersSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", mastersWidth / 2)

        .attr("y", mastersHeight + mastersMargin.bottom - 10)
        .text("Year");

      // Set up Y axis
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(yearCounts, (d) => d.count) || 10])
        .range([mastersHeight, 0]);

      // Create Y axis
      mastersSvg
        .append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y).ticks(5));

      // Add Y axis label
      mastersSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")

        .attr("y", -mastersMargin.left + 20)
        .attr("x", -mastersHeight / 2)
        .text("Number of New National Masters");

      // Create tooltip div with centered styling
      const tooltip = d3
        .select("#masters-visualization")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("text-align", "center") // Center tooltip text
        .style("pointer-events", "none") // Prevent tooltip from interfering with mouse events
        .style("z-index", "100"); // Ensure tooltip appears above other elements

      // Draw bars
      mastersSvg
        .selectAll(".bar")
        .data(yearCounts)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.year))
        .attr("y", (d) => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", (d) => mastersHeight - y(d.count))
        .attr("fill", (d) => (d.count > 0 ? "#4682b4" : "#dddddd"))
        .on("mouseover", function (event, d) {
          if (d.count === 0) return; // Skip tooltip for empty bars

          // Show tooltip on hover
          tooltip.transition().duration(200).style("opacity", 0.9);

          // Get the masters from this year to show in tooltip
          const mastersThisYear = yearGroups.get(d.year) || [];
          let mastersText = `<strong>Year: ${d.year}</strong><br>New Masters: ${d.count}<br>`;

          // Calculate position relative to the visualization container
          const containerRect = document.getElementById("masters-visualization").getBoundingClientRect();
          const xPosition = event.clientX - containerRect.left;
          const yPosition = event.clientY - containerRect.top;

          tooltip
            .html(mastersText)
            .style("left", xPosition + "px")
            .style("top", (yPosition - 40) + "px"); // Position above cursor

          d3.select(this).attr("fill", "#ff7f0e");
        })
        .on("mouseout", function (event, d) {
          // Hide tooltip
          tooltip.transition().duration(500).style("opacity", 0);

          d3.select(this).attr("fill", d.count > 0 ? "#4682b4" : "#dddddd");
        })
        .on("click", function (event, d) {
          // Only process click if there are masters in this year
          if (d.count === 0) return;

          // Get the masters from this year
          const mastersThisYear = yearGroups.get(d.year) || [];
          
          // Hide the chart and show masters table
          showMastersTable(d.year, mastersThisYear);
        });

      // Add title
      mastersSvg
        .append("text")
        .attr("x", mastersWidth / 2)
        .attr("y", -mastersMargin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")

        .text("Canadian National Chess Masters By Year Since 2000");

      // Add cumulative line
      const cumulativeData = [];
      let cumulative = priorTotal; // Start with the count of masters before 2000

      yearCounts.forEach((d) => {
        cumulative += d.count;
        cumulativeData.push({
          year: d.year,
          count: cumulative,
        });
      });

      // Create secondary Y axis for cumulative line
      const y2 = d3
        .scaleLinear()
        .domain([0, d3.max(cumulativeData, (d) => d.count)])
        .range([mastersHeight, 0]);

      mastersSvg
        .append("g")
        .attr("class", "y2-axis axis")
        .attr("transform", `translate(${mastersWidth}, 0)`)
        .call(d3.axisRight(y2));

      // Add secondary Y axis label
      mastersSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(90)")

        .attr("y", -mastersWidth - mastersMargin.right + 20)
        .attr("x", mastersHeight / 2)
        .text("Cumulative Number of Masters");

      // Create line generator
      const line = d3
        .line()
        .x((d) => x(d.year) + x.bandwidth() / 2)
        .y((d) => y2(d.count));

      // Add the line
      mastersSvg
        .append("path")
        .datum(cumulativeData)
        .attr("fill", "none")
        .attr("stroke", "#e41a1c")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Add circles at each data point on the line
      mastersSvg
        .selectAll(".dot")
        .data(cumulativeData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
        .attr("cy", (d) => y2(d.count))
        .attr("r", 3)
        .attr("fill", "#e41a1c")
        .on("mouseover", function (event, d) {
          // Show tooltip on hover
          tooltip.transition().duration(200).style("opacity", 0.9);
          
          // Content for the tooltip
          let tooltipContent = `<strong>Year: ${d.year}</strong><br>Total Masters: ${d.count}`;
          
          // Get the position of the visualization container
          const containerRect = document.getElementById("masters-visualization").getBoundingClientRect();
          
          // Calculate position - offset from the event coordinates relative to the container
          const xPosition = event.pageX - containerRect.left - window.pageXOffset;
          const yPosition = event.pageY - containerRect.top - window.pageYOffset - 60; // Position above cursor
          
          tooltip
            .html(tooltipContent)
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");
            
          d3.select(this).attr("r", 5); // Enlarge the dot on hover
        })
        .on("mouseout", function () {
          // Hide tooltip
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).attr("r", 3); // Restore original size
        })
        .on("mousemove", function (event) {
          // Get the position of the visualization container
          const containerRect = document.getElementById("masters-visualization").getBoundingClientRect();
          
          // Update tooltip position as mouse moves
          const xPosition = event.pageX - containerRect.left - window.pageXOffset;
          const yPosition = event.pageY - containerRect.top - window.pageYOffset - 60; // Position above cursor
          
          tooltip
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");
        });

      // Relocate legend to bottom right, below the graph
      const legend = mastersSvg
        .append("g")
        .attr(
          "transform",
          `translate(${mastersWidth - 150}, ${mastersHeight + 30})`
        );

      // Add bar legend
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#4682b4");

      legend
        .append("text")
        .attr("x", 30)
        .attr("y", 15)

        .text("New Masters Per Year");

      // Add line legend
      legend
        .append("line")
        .attr("x1", 0)
        .attr("y1", 40)
        .attr("x2", 20)
        .attr("y2", 40)
        .attr("stroke", "#e41a1c")
        .attr("stroke-width", 2);

      legend
        .append("text")
        .attr("x", 30)
        .attr("y", 45)

        .text("Cumulative Masters");
    })
    .catch((error) => {
      console.error("Error loading the CSV data: ", error);
      // Display error message in the visualization area
      d3.select("#masters-visualization")
        .append("div")
        .attr("class", "alert alert-danger")
        .style("margin-top", "20px")
        .html(`<strong>Error loading data:</strong><br>${error}`);
    });
}

// Function to show masters table and hide chart
function showMastersTable(year, mastersData) {
  // Hide the chart
  d3.select("#masters-visualization svg").style("display", "none");
  
  // Create table container if it doesn't exist
  let tableContainer = d3.select("#masters-table-container");
  if (tableContainer.empty()) {
    tableContainer = d3.select("#masters-visualization")
      .append("div")
      .attr("id", "masters-table-container")
      .style("max-height", "400px") // Reduce max-height from 500px to 400px to match SVG
      .style("overflow-y", "auto") // Add scrolling to the table itself
      .style("margin", "auto") // Center the table vertically and horizontally
      .style("max-width", "90%") // Limit width for better readability
      .style("position", "relative"); // Position for centering
  }
  
  // Create the content for the masters table
  let tableHTML = `
    <div class="masters-table-header">
      <h3>National Masters Achieved in ${year} (${mastersData.length} total)</h3>
      <button id="back-to-chart" class="btn btn-primary">Back to Chart</button>
    </div>
    <div style="overflow-y: auto; max-height: 400px;">
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
  mastersData.forEach((master) => {
    tableHTML += `
      <tr>
        <td>${master.player_name}</td>
        <td>${master.cfc_id}</td>
        <td>${master.title_achieved}</td>
        <td>${master.province}</td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
    </div>
  `;

  // Set the HTML content
  tableContainer.html(tableHTML);
  
  // Add click event listener to the back button
  d3.select("#back-to-chart").on("click", showMastersChart);
  
  // Show the table container
  tableContainer.style("display", "block");
}

// Function to show chart and hide masters table
function showMastersChart() {
  // Show the chart
  d3.select("#masters-visualization svg").style("display", "block");
  
  // Hide the table
  d3.select("#masters-table-container").style("display", "none");
}

// Add or update the tooltip logic in your visualization code

// Inside your visualization code add these functions for tooltip handling
function showTooltip(event, d) {
  console.log("Show tooltip for data point");
  
  // Calculate position relative to the visualization container
  const containerRect = document.getElementById("masters-visualization").getBoundingClientRect();
  const xPosition = event.clientX - containerRect.left;
  const yPosition = event.clientY - containerRect.top;
  
  const tooltip = d3.select("#masters-tooltip");

  // Set tooltip content
  tooltip
    .select("#masters-value")
    .html(`Year: ${d.year}<br>Total Masters: ${d.count}`);

  // Position the tooltip precisely
  tooltip
    .style("left", xPosition + "px")
    .style("top", (yPosition - 40) + "px")
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
  mastersWidth =
    document.getElementById("masters-visualization").clientWidth -
    mastersMargin.left -
    mastersMargin.right;

  // Update SVG dimensions
  d3.select("#masters-visualization svg")
    .attr("width", mastersWidth + mastersMargin.left + mastersMargin.right);

  // Ensure the container maintains vertical centering
  d3.select("#masters-visualization")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "center")
    .style("align-items", "center");

  // Redraw the visualization with new dimensions
  mastersSvg.selectAll("*").remove();
  loadMastersData();
}

// Add window resize listener
window.addEventListener("resize", handleResize);

// Wait for the DOM to be ready before drawing the visualization
document.addEventListener("DOMContentLoaded", loadMastersData);
