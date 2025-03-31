// This script runs after DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Define color constants for player lines
  const playerColors = {
    167084: {
      // Aaron
      default: "#2b83ba",
      selected: "#2b83ba", // Keep selected color same as default for consistency
      unselected: "#cccccc", // Gray out when not selected
    },
    132534: {
      // Nikolay
      default: "#d7191c",
      selected: "#d7191c", // Keep selected color same as default for consistency
      unselected: "#cccccc", // Gray out when not selected
    },
  };

  // Track current selected player (null means no selection/both shown)
  let selectedPlayer = null;
  // Track the current brush selection to maintain it between redraws
  let currentBrushSelection = null;

  // Load both CSV files
  Promise.all([
    d3.csv("data/rating_histories/rating_history_167084.csv"),
    d3.csv("data/rating_histories/rating_history_132534.csv"),
  ])
    .then(function (data) {
      const player1Data = data[0];
      const player2Data = data[1];

      // Process the data
      function processData(data, playerId) {
        return data
          .filter((d) => d.rating_type === "R")
          .map((d) => {
            return {
              eventId: d.eventId,
              eventDate: new Date(d.eventDate),
              eventName: d.eventName,
              eventLocation: d.eventLocation || "",
              score: d.score,
              ratingPerf: +d.ratingPerf,
              ratingPost: +d.ratingPost,
              playerId: playerId,
              ratingType: d.rating_type,
            };
          })
          .sort((a, b) => a.eventDate - b.eventDate);
      }

      const processedPlayer1 = processData(player1Data, "167084");
      const processedPlayer2 = processData(player2Data, "132534");

      // Combine data for domain calculations
      const allData = [...processedPlayer1, ...processedPlayer2];

      // Define time domain
      const timeDomain = [
        d3.min(allData, (d) => d.eventDate),
        d3.max(allData, (d) => d.eventDate),
      ];

      // Create the chart with initial full domain
      createCharts(processedPlayer1, processedPlayer2, timeDomain);

      // Handle window resize to make the chart responsive
      window.addEventListener("resize", function () {
        createCharts(processedPlayer1, processedPlayer2, timeDomain);
      });

      // Set up player selection from portrait clicks - connect with the world map
      setupPlayerPortraitListeners(
        processedPlayer1,
        processedPlayer2,
        timeDomain
      );

      function setupPlayerPortraitListeners(data1, data2, domain) {
        // Get references to the portrait buttons (same ones used in world_map.js)
        const aaronPortrait = document.getElementById("aaron-portrait");
        const nikolayPortrait = document.getElementById("nikolay-portrait");

        if (aaronPortrait) {
          aaronPortrait.addEventListener("click", function () {
            // Toggle selection: if already selected, deselect
            if (selectedPlayer === "167084") {
              selectedPlayer = null;
            } else {
              selectedPlayer = "167084"; // Aaron's player ID
            }
            // Redraw charts with selection
            createCharts(data1, data2, domain);
          });
        }

        if (nikolayPortrait) {
          nikolayPortrait.addEventListener("click", function () {
            // Toggle selection: if already selected, deselect
            if (selectedPlayer === "132534") {
              selectedPlayer = null;
            } else {
              selectedPlayer = "132534"; // Nikolay's player ID
            }
            // Redraw charts with selection
            createCharts(data1, data2, domain);
          });
        }
      }

      function createCharts(data1, data2, xDomain) {
        // Clear the chart containers
        d3.select("#chart").html("");
        d3.select("#context").html("");

        // Get the container width for responsive sizing
        const containerWidth =
          document.querySelector(".chart-container").clientWidth;

        // ---------- CHART DIMENSIONS AND SPACING ----------

        // Set dimensions and margins for main chart - with better spacing
        const margin = {
          top: 25,
          right: 45,
          bottom: 40,
          left: 75,
        };

        const width = containerWidth - margin.left - margin.right;

        // Set height with adequate space
        const height =
          Math.min(350, window.innerHeight * 0.45) - margin.top - margin.bottom;

        // Set dimensions for context chart with better proportions
        const marginContext = {
          top: 5,
          right: 45,
          bottom: 25,
          left: 75,
        };

        const heightContext = 70;

        // ---------- CREATE SVG ELEMENTS ----------

        // Create SVG for main chart - simplified attributes
        const svg = d3
          .select("#chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          // viewBox is kept for responsive behavior
          .attr(
            "viewBox",
            `0 0 ${width + margin.left + margin.right} ${
              height + margin.top + margin.bottom
            }`
          )
          .attr("preserveAspectRatio", "xMidYMid meet")
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create SVG for context chart - simplified attributes
        const svgContext = d3
          .select("#context")
          .append("svg")
          .attr("width", width + marginContext.left + marginContext.right)
          .attr(
            "height",
            heightContext + marginContext.top + marginContext.bottom
          )
          // viewBox is kept for responsive behavior
          .attr(
            "viewBox",
            `0 0 ${width + marginContext.left + marginContext.right} ${
              heightContext + marginContext.top + marginContext.bottom
            }`
          )
          .attr("preserveAspectRatio", "xMidYMid meet")
          .append("g")
          .attr(
            "transform",
            `translate(${marginContext.left},${marginContext.top})`
          );

        // ---------- SCALES ----------

        // Create scales
        const xScale = d3.scaleTime().domain(xDomain).range([0, width]);
        const xScaleContext = d3
          .scaleTime()
          .domain(timeDomain)
          .range([0, width]);

        const yScale = d3
          .scaleLinear()
          .domain([
            d3.min(allData, (d) => d.ratingPost) - 50, // Increased padding for better spacing
            d3.max(allData, (d) => d.ratingPost) + 50,
          ])
          .range([height, 0]);

        const yScaleContext = d3
          .scaleLinear()
          .domain([800, 2700])
          .range([heightContext, 0]);

        // ---------- AXES ----------

        // Add X axis - main chart
        svg
          .append("g")
          .attr("class", "axis x-axis")
          .attr("transform", `translate(0,${height})`)
          .call(
            d3
              .axisBottom(xScale)
              .tickFormat(d3.timeFormat("%Y"))
              .ticks(Math.max(width / 100, 4))
              .tickSizeOuter(0)
          );

        // Add X axis label - main chart
        svg
          .append("text")
          .attr("class", "axis-label x-label")
          .attr("x", width / 2)
          .attr("y", height + margin.bottom - 5)
          .style("text-anchor", "middle")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text("Date");

        // Add Y axis - main chart
        svg
          .append("g")
          .attr("class", "axis y-axis")
          .call(
            d3
              .axisLeft(yScale)
              .ticks(Math.max(height / 50, 5))
              .tickSizeOuter(0)
          );

        // Add Y axis label - main chart
        svg
          .append("text")
          .attr("class", "axis-label y-label")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -margin.left + 30)
          .style("text-anchor", "middle")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text("CFC Rating");

        // ---------- LINE GENERATORS ----------

        // Create line generators
        const line = d3
          .line()
          .x((d) => xScale(d.eventDate))
          .y((d) => yScale(d.ratingPost))
          .curve(d3.curveMonotoneX);

        const lineContext = d3
          .line()
          .x((d) => xScaleContext(d.eventDate))
          .y((d) => yScaleContext(d.ratingPost))
          .curve(d3.curveMonotoneX);

        // ---------- MAIN CHART ELEMENTS ----------

        // Function to determine stroke color based on player selection
        function getStrokeColor(playerId) {
          if (selectedPlayer === null) {
            // No player selected, use default colors
            return playerColors[playerId].default;
          }
          // If this player is selected, use selected color, otherwise use unselected color
          return selectedPlayer === playerId
            ? playerColors[playerId].selected
            : playerColors[playerId].unselected;
        }

        // Function to determine stroke width based on player selection
        function getStrokeWidth(playerId) {
          if (selectedPlayer === null) return 2;
          return selectedPlayer === playerId ? 2 : 1; // Thinner line for unselected
        }

        // Function to determine dot opacity based on player selection
        function getDotOpacity(playerId) {
          if (selectedPlayer === null) return 1;
          return selectedPlayer === playerId ? 1 : 0.3; // More transparent for unselected
        }

        // Function to determine dot size based on player selection
        function getDotSize(playerId) {
          if (selectedPlayer === null) return 3;
          return selectedPlayer === playerId ? 3 : 2; // Smaller dots for unselected
        }

        // Add lines for main chart with selection-based styling
        svg
          .append("path")
          .datum(data1)
          .attr("class", "line line-167084")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", getStrokeColor("167084"))
          .attr("stroke-width", getStrokeWidth("167084"))
          .style(
            "opacity",
            selectedPlayer === null ? 1 : selectedPlayer === "167084" ? 1 : 0.5
          );

        svg
          .append("path")
          .datum(data2)
          .attr("class", "line line-132534")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", getStrokeColor("132534"))
          .attr("stroke-width", getStrokeWidth("132534"))
          .style(
            "opacity",
            selectedPlayer === null ? 1 : selectedPlayer === "132534" ? 1 : 0.5
          );

        // Add dots for main chart with selection-based styling

        // Player 1 dots with selection-based styling
        svg
          .selectAll(".dot-167084")
          .data(data1)
          .enter()
          .append("circle")
          .attr("class", "dot-167084")
          .attr("cx", (d) => xScale(d.eventDate))
          .attr("cy", (d) => yScale(d.ratingPost))
          .attr("r", getDotSize("167084"))
          .attr("fill", getStrokeColor("167084"))
          .style("opacity", getDotOpacity("167084"))
          .on("mouseover", showTooltip)
          .on("mouseout", hideTooltip);

        // Player 2 dots with selection-based styling
        svg
          .selectAll(".dot-132534")
          .data(data2)
          .enter()
          .append("circle")
          .attr("class", "dot-132534")
          .attr("cx", (d) => xScale(d.eventDate))
          .attr("cy", (d) => yScale(d.ratingPost))
          .attr("r", getDotSize("132534"))
          .attr("fill", getStrokeColor("132534"))
          .style("opacity", getDotOpacity("132534"))
          .on("mouseover", showTooltip)
          .on("mouseout", hideTooltip);

        // ---------- CONTEXT CHART ELEMENTS ----------

        // Add lines for context chart with selection-based styling
        svgContext
          .append("path")
          .datum(processedPlayer1)
          .attr("class", "line line-167084")
          .attr("d", lineContext)
          .attr("fill", "none")
          .attr("stroke", getStrokeColor("167084"))
          .attr("stroke-width", getStrokeWidth("167084"))
          .style(
            "opacity",
            selectedPlayer === null
              ? 0.8
              : selectedPlayer === "167084"
              ? 0.8
              : 0.4
          );

        svgContext
          .append("path")
          .datum(processedPlayer2)
          .attr("class", "line line-132534")
          .attr("d", lineContext)
          .attr("fill", "none")
          .attr("stroke", getStrokeColor("132534"))
          .attr("stroke-width", getStrokeWidth("132534"))
          .style(
            "opacity",
            selectedPlayer === null
              ? 0.8
              : selectedPlayer === "132534"
              ? 0.8
              : 0.4
          );

        // Add X axis - context chart
        svgContext
          .append("g")
          .attr("class", "axis")
          .attr("transform", `translate(0,${heightContext})`)
          .call(
            d3
              .axisBottom(xScaleContext)
              .tickFormat(d3.timeFormat("%Y"))
              .ticks(width < 500 ? 3 : 5)
              .tickSizeOuter(0)
          );

        // ---------- BRUSH ----------

        // Add brush to context chart
        const brush = d3
          .brushX()
          .extent([
            [0, 0],
            [width, heightContext],
          ])
          .on("brush", brushed) // Add brush event for real-time updates
          .on("end", brushed);

        const brushG = svgContext
          .append("g")
          .attr("class", "brush")
          .call(brush);

        // If we have a stored brush selection, restore it
        if (currentBrushSelection) {
          brushG.call(brush.move, currentBrushSelection);
        }

        // Brush function
        function brushed(event) {
          if (!event.selection) {
            if (currentBrushSelection) {
              // If brush was cleared but we had a selection, reset to full view
              currentBrushSelection = null;
              // Enable reset button
              d3.select("#resetZoom").property("disabled", true);
              createCharts(processedPlayer1, processedPlayer2, timeDomain);
            }
            return;
          }

          // Store the current pixel-based selection
          currentBrushSelection = event.selection;

          // Get the selected time range
          const [x0, x1] = event.selection.map(xScaleContext.invert);

          // Enable reset button
          d3.select("#resetZoom").property("disabled", false);

          // Update the main chart
          // Only redraw the main chart, not the context chart, to preserve brush
          updateMainChart(
            data1.filter((d) => d.eventDate >= x0 && d.eventDate <= x1),
            data2.filter((d) => d.eventDate >= x0 && d.eventDate <= x1),
            [x0, x1]
          );
        }

        // Function to update only the main chart without redrawing context
        function updateMainChart(filteredData1, filteredData2, domain) {
          // Clear only the main chart
          d3.select("#chart").html("");

          // Re-create only the main chart with filtered data
          const svg = d3
            .select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr(
              "viewBox",
              `0 0 ${width + margin.left + margin.right} ${
                height + margin.top + margin.bottom
              }`
            )
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

          // Update x scale with the brushed domain
          const xScale = d3.scaleTime().domain(domain).range([0, width]);

          // Re-use the same y scale
          const yScale = d3
            .scaleLinear()
            .domain([
              d3.min(allData, (d) => d.ratingPost) - 50,
              d3.max(allData, (d) => d.ratingPost) + 50,
            ])
            .range([height, 0]);

          // Recreate axes and other main chart elements
          // Add X axis - main chart
          svg
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(
              d3
                .axisBottom(xScale)
                .tickFormat(d3.timeFormat("%Y"))
                .ticks(Math.max(width / 100, 4))
                .tickSizeOuter(0)
            );

          // Add X axis label - main chart
          svg
            .append("text")
            .attr("class", "axis-label x-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Date");

          // Add Y axis - main chart
          svg
            .append("g")
            .attr("class", "axis y-axis")
            .call(
              d3
                .axisLeft(yScale)
                .ticks(Math.max(height / 50, 5))
                .tickSizeOuter(0)
            );

          // Add Y axis label - main chart
          svg
            .append("text")
            .attr("class", "axis-label y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 30)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("CFC Rating");

          // Create line generator
          const line = d3
            .line()
            .x((d) => xScale(d.eventDate))
            .y((d) => yScale(d.ratingPost))
            .curve(d3.curveMonotoneX);

          // Add lines and dots using the selection-based styling functions
          svg
            .append("path")
            .datum(filteredData1)
            .attr("class", "line line-167084")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", getStrokeColor("167084"))
            .attr("stroke-width", getStrokeWidth("167084"))
            .style(
              "opacity",
              selectedPlayer === null
                ? 1
                : selectedPlayer === "167084"
                ? 1
                : 0.5
            );

          svg
            .append("path")
            .datum(filteredData2)
            .attr("class", "line line-132534")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", getStrokeColor("132534"))
            .attr("stroke-width", getStrokeWidth("132534"))
            .style(
              "opacity",
              selectedPlayer === null
                ? 1
                : selectedPlayer === "132534"
                ? 1
                : 0.5
            );

          // Add dots for main chart with selection-based styling
          // Player 1 dots
          svg
            .selectAll(".dot-167084")
            .data(filteredData1)
            .enter()
            .append("circle")
            .attr("class", "dot-167084")
            .attr("cx", (d) => xScale(d.eventDate))
            .attr("cy", (d) => yScale(d.ratingPost))
            .attr("r", getDotSize("167084"))
            .attr("fill", getStrokeColor("167084"))
            .style("opacity", getDotOpacity("167084"))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

          // Player 2 dots
          svg
            .selectAll(".dot-132534")
            .data(filteredData2)
            .enter()
            .append("circle")
            .attr("class", "dot-132534")
            .attr("cx", (d) => xScale(d.eventDate))
            .attr("cy", (d) => yScale(d.ratingPost))
            .attr("r", getDotSize("132534"))
            .attr("fill", getStrokeColor("132534"))
            .style("opacity", getDotOpacity("132534"))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
        }

        // Reset zoom button functionality
        d3.select("#resetZoom").on("click", function () {
          d3.select(this).property("disabled", true);
          // Clear the stored brush selection
          currentBrushSelection = null;
          // Reset to full view
          createCharts(processedPlayer1, processedPlayer2, timeDomain);
        });
      }

      // ---------- TOOLTIP FUNCTIONALITY ----------

      function showTooltip(event, d) {
        const tooltip = d3.select("#rating-tooltip");
        const tooltipWidth = 250; // Increased from 200 to accommodate longer content
        const windowWidth = window.innerWidth;
        const xPosition = event.pageX;

        // Calculate tooltip position
        const tooltipX =
          xPosition + tooltipWidth > windowWidth - 20
            ? xPosition - tooltipWidth - 10
            : xPosition + 10;

        tooltip
          .classed("hidden", false)
          .style("left", tooltipX + "px")
          .style("top", event.pageY - 25 + "px").html(`
            <strong>${
              d.playerId === "167084" ? "Aaron" : "Nikolay"
            }</strong><br>
            ${d.eventDate.toISOString().split("T")[0]}<br>
            ${d.eventName}<br>
            <strong>Rating:</strong> ${d.ratingPost}
          `);
      }

      function hideTooltip() {
        d3.select("#rating-tooltip").classed("hidden", true);
      }
    })
    .catch(function (error) {
      console.log("Error loading CSV files:", error);
    });
});
