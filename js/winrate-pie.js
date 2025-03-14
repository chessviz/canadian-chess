/**
 * Winrate Pie Charts
 * Creates side-by-side pie charts showing game outcome breakdowns for two players
 */

// Function to load player data from CSV files
function loadPlayerData(player1File, player2File) {
  console.log("Loading data from:", player1File, player2File);

  return Promise.all([d3.csv(player1File), d3.csv(player2File)])
    .then(([player1Data, player2Data]) => {
      console.log("Data loaded successfully:", player1Data, player2Data);

      if (!player1Data.length || !player2Data.length) {
        throw new Error("Empty data received from CSV files");
      }

      return {
        player1: processPlayerData(player1Data[0], "Aaron Reeve Mendes"),
        player2: processPlayerData(player2Data[0], "Nikolay Noritsyn"),
      };
    })
    .catch((error) => {
      console.error("Error loading player data:", error);
      throw error;
    });
}

// Process the raw CSV data to get win/loss/draw counts from the simplified format
function processPlayerData(data, playerName) {
  console.log("Processing data for", playerName, data);

  // Handle potential missing data
  if (!data) {
    console.error("No data for player:", playerName);
    return { wins: 0, losses: 0, draws: 0, total: 0, playerName };
  }

  return {
    wins: +data.games_won || 0,
    losses: +data.games_lost || 0,
    draws: +data.games_drawn || 0,
    total: +data.games_played || 0,
    playerName: playerName,
  };
}

// Create pie charts for the players
function createWinratePieCharts(
  containerId1,
  containerId2,
  player1File,
  player2File
) {
  console.log(
    "Creating winrate pie charts for containers:",
    containerId1,
    containerId2
  );

  // Load and process the data
  loadPlayerData(player1File, player2File)
    .then((data) => {
      console.log("Data processed successfully:", data);

      renderPieChart(
        containerId1,
        prepareChartData(data.player1),
        data.player1.playerName
      );
      renderPieChart(
        containerId2,
        prepareChartData(data.player2),
        data.player2.playerName
      );
    })
    .catch((error) => {
      console.error("Failed to create pie charts:", error);
      document.getElementById(
        containerId1
      ).innerHTML = `<div class="error">Error loading player data: ${error.message}</div>`;
      document.getElementById(
        containerId2
      ).innerHTML = `<div class="error">Error loading player data: ${error.message}</div>`;
    });
}

// Prepare data format for pie charts
function prepareChartData(playerData) {
  return [
    { name: "wins", value: playerData.wins },
    { name: "losses", value: playerData.losses },
    { name: "draws", value: playerData.draws },
  ];
}

// Render a single pie chart
function renderPieChart(containerId, chartData, playerName) {
  const container = d3.select(`#${containerId}`);

  // Clear any existing content
  container.html("");

  // Set container to flex for centering
  container
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("height", "100%");

  // Set up dimensions - increase width to accommodate the legend
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2;
  const margin = 60; // Increased margin for better spacing

  // Create SVG container - increase width to make room for legend
  const svg = container
    .append("svg")
    .attr("width", width + margin * 3) // Increased width for legend
    .attr("height", height + margin * 2)
    .attr("viewBox", `0 0 ${width + margin * 3} ${height + margin * 2}`)
    .attr("style", "max-width: 100%; height: auto;")
    .style("margin", "0 auto");

  // Define color scale with proper display names
  const color = d3
    .scaleOrdinal()
    .domain(["wins", "losses", "draws"])
    .range(["#4CAF50", "#F44336", "#FFC107"]);

  // Category display names for legend
  const categoryNames = {
    wins: "Wins",
    losses: "Losses",
    draws: "Draws",
  };

  // Create pie layout
  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  // Create arc generator
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  // Create group for chart
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2 + margin})`);

  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -radius - 15)
    .attr("class", "chart-title")
    .attr("font-weight", "bold")
    .attr("font-size", "16px")
    .text("Game Results");

  // Draw pie segments
  const path = chartGroup
    .selectAll("path")
    .data(pie(chartData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.name))
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .style("opacity", 0.8);

  // Add labels
  const text = chartGroup
    .selectAll("text.label")
    .data(pie(chartData))
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "white")
    .text((d) => {
      const percent = Math.round(
        (d.data.value / chartData.reduce((sum, item) => sum + item.value, 0)) *
          100
      );
      return percent > 5 ? `${percent}%` : "";
    });

  const legend = chartGroup
    .selectAll(".legend")
    .data(chartData)
    .enter()
    .append("g")
    .attr("class", "legend")
    // Position legend
    .attr("transform", (d, i) => `translate(${radius + 20}, ${i * 25 - 40})`);

  legend
    .append("rect")
    .attr("width", 15) // Slightly larger rectangle
    .attr("height", 15)
    .attr("fill", (d) => color(d.name));

  legend
    .append("text")
    .attr("x", 25) // Increased spacing between rectangle and text
    .attr("y", 12) // Better vertical alignment
    .attr("text-anchor", "start")
    .attr("font-size", "14px") // Increased font size
    .text((d) => `${categoryNames[d.name]}: ${d.value} games`);

  // Remove the player name display that was here

  // Note: The player name display code has been removed as requested
}

// Init function to setup pie charts from HTML
function initWinrateCharts() {
  console.log("Initializing winrate charts");
  createWinratePieCharts(
    "piechart1",
    "piechart2",
    "data/player_winrate_167084.csv",
    "data/player_winrate_132534.csv"
  );
}

// Initialize on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, initializing winrate charts");
  setTimeout(initWinrateCharts, 100); // Small delay to ensure DOM is ready
});

// Export functions
window.createWinratePieCharts = createWinratePieCharts;
window.initWinrateCharts = initWinrateCharts;
