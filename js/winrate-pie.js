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

  // Set up dimensions - make smaller than before
  const width = 220; // Reduced from 300
  const height = 220; // Reduced from 300
  const radius = Math.min(width, height) / 2;
  const margin = 40; // Reduced from 60

  // Create SVG container - adjust for smaller size
  const svg = container
    .append("svg")
    .attr("width", width + margin * 3)
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
    .text((d) => `${categoryNames[d.name]}: ${d.value}`);

  // Remove the player name display that was here

  // Note: The player name display code has been removed as requested
}

// Function to setup portrait listeners for filtering charts
function setupFilterButtons() {
  // Get references to the portrait elements
  const aaronPortrait = document.getElementById("aaron-portrait-pie");
  const nikolayPortrait = document.getElementById("nikolay-portrait-pie");
  const showAllButton = document.getElementById("show-all-players"); // Keep this if you still have a "show all" button
  
  console.error("Added filter listener");

  if (!aaronPortrait || !nikolayPortrait) {
    console.error("Could not find player portrait elements");
    return;
  }
  // Show only Aaron when his portrait is clicked
  aaronPortrait.addEventListener("click", function() {
    // console.log("event listener for aaron");

    // If already showing only Aaron, toggle back to showing both
    if (selectedPlayer === "167084") {
      selectedPlayer = null;
      renderFilteredCharts('both');
    } else {
      selectedPlayer = "167084"; // Aaron's player ID
      renderFilteredCharts('aaron');
    }
    updateActivePortrait(this, selectedPlayer);
  });
  
  // Show only Nikolay when his portrait is clicked
  nikolayPortrait.addEventListener("click", function() {
    // console.log("event listener for nikolay");

    // If already showing only Nikolay, toggle back to showing both
    if (selectedPlayer === "132534") {
      selectedPlayer = null;
      renderFilteredCharts('both');
    } else {
      selectedPlayer = "132534"; // Nikolay's player ID
      renderFilteredCharts('nikolay');
    }
    updateActivePortrait(this, selectedPlayer);
  });
  
  // If you still have a show all button
  if (showAllButton) {
    showAllButton.addEventListener('click', function() {
      selectedPlayer = null;
      renderFilteredCharts('both');
      updateActivePortrait(null, null);
    });
  }
}

// Update visual state of portraits based on selection
function updateActivePortrait(activeElement, selectedPlayerId) {
  // Get references to portraits
  const aaronPortrait = document.getElementById("aaron-portrait");
  const nikolayPortrait = document.getElementById("nikolay-portrait");
  
  // Reset both portraits to inactive state
  if (aaronPortrait) {
    aaronPortrait.classList.remove("active-portrait");
    aaronPortrait.style.opacity = "0.7";
  }
  
  if (nikolayPortrait) {
    nikolayPortrait.classList.remove("active-portrait");
    nikolayPortrait.style.opacity = "0.7";
  }
  
  // Add active state to selected portrait if applicable
  if (activeElement) {
    activeElement.classList.add("active-portrait");
    activeElement.style.opacity = "1";
  }
  
  // Update button states if you still have buttons
  const filterButtons = document.querySelectorAll('.filter-buttons .btn');
  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
      
      if ((selectedPlayerId === "167084" && btn.id === "show-aaron-only") ||
          (selectedPlayerId === "132534" && btn.id === "show-nikolay-only") ||
          (!selectedPlayerId && btn.id === "show-all-players")) {
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('active', 'btn-primary');
      }
    });
  }
}

// Initialize variable to track selected player
let selectedPlayer = null;

// Function to render filtered charts
function renderFilteredCharts(filter) {
  // Get the parent container
  const parentContainer = document.querySelector('.parent-pie-chart');
  if (!parentContainer) {
    console.error("Could not find parent-pie-chart container");
    return;
  }
  
  // Clear the parent container
  parentContainer.innerHTML = '';
  
  // Create a row div to contain the charts
  const rowDiv = document.createElement('div');
  rowDiv.className = 'row d-flex justify-content-center';
  parentContainer.appendChild(rowDiv);
  
  // Create new content based on filter
  if (filter === 'both' || filter === 'aaron') {
    const aaronCol = document.createElement('div');
    // For both, use smaller columns that stay side by side
    // For single view, use medium-width centered column
    aaronCol.className = filter === 'both' ? 'col-md-5 col-lg-5 mb-3' : 'col-md-8 mx-auto mb-3';
    aaronCol.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-transparent text-center">
          <h3>Aaron Reeve Mendes</h3>
          <p class="text-muted mb-0">Performance Analysis</p>
        </div>
        <div class="card-body d-flex align-items-center justify-content-center">
          <div id="piechart1" class="pie-chart-container"></div>
        </div>
      </div>
    `;
    rowDiv.appendChild(aaronCol);
  }
  
  if (filter === 'both' || filter === 'nikolay') {
    const nikolayCol = document.createElement('div');
    // For both, use smaller columns that stay side by side
    // For single view, use medium-width centered column
    nikolayCol.className = filter === 'both' ? 'col-md-5 col-lg-5 mb-3' : 'col-md-8 mx-auto mb-3';
    nikolayCol.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-transparent text-center">
          <h3>Nikolay Noritsyn</h3>
          <p class="text-muted mb-0">Performance Analysis</p>
        </div>
        <div class="card-body d-flex align-items-center justify-content-center">
          <div id="piechart2" class="pie-chart-container"></div>
        </div>
      </div>
    `;
    rowDiv.appendChild(nikolayCol);
  }
  
  // Add extra margin between cards when showing both
  if (filter === 'both') {
    rowDiv.style.columnGap = '20px';
  }
  
  // Re-render the appropriate charts
  if (filter === 'both' || filter === 'aaron') {
    renderSinglePlayerChart("piechart1", "data/player_winrate_167084.csv", "Aaron Reeve Mendes");
  }
  
  if (filter === 'both' || filter === 'nikolay') {
    renderSinglePlayerChart("piechart2", "data/player_winrate_132534.csv", "Nikolay Noritsyn");
  }
  
  // Update the explanation text based on the filter
  updateExplanationText(filter);
}

// Function to update the explanation text
function updateExplanationText(filter) {
  const explanationElement = document.getElementById('explanation-player-comparison');
  if (!explanationElement) {
    console.error("Could not find explanation text element");
    return;
  }
  
  // For "both" filter, hide the explanation text entirely
  if (filter === 'both') {
    explanationElement.style.opacity = 0;
    setTimeout(() => {
      explanationElement.style.display = 'none';
    }, 500); // Hide after fade-out completes
    return;
  }
  
  // For individual players, make sure the container is visible
  explanationElement.style.display = 'block';
  
  const titleElement = explanationElement.querySelector('.explanation-title');
  
  // Clear existing paragraphs while preserving the title
  // if (titleElement) {
  //   let newHtml = `<h3 class="explanation-title">${titleElement.textContent}</h3>`;
  //   explanationElement.innerHTML = newHtml;
  // }
  
  // Add new explanations based on the filter
  if (filter === 'aaron') {
    let newHtml = `<h3 class="explanation-title">Aaron's Win Rates</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>Aaron Reeve Mendes, born in 2012, represents the new generation of Canadian chess talent.</p>
      <p>At his young age, Aaron has already developed an impressive win rate, with statistics showing particularly strong performance in rapid and blitz formats, which are popular among younger players.</p>
      <p>His aggressive playing style often leads to decisive results, with fewer draws compared to many adult players at his rating level.</p>
    `;
  } else if (filter === 'nikolay') {
    let newHtml = `<h3 class="explanation-title">Nikolay's Win Rates</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>Nikolay Noritsyn, born in 1991, is a seasoned International Master who has represented Canada in multiple Chess Olympiads.</p>
      <p>His game statistics reflect the balanced approach typical of experienced masters, with a healthy distribution of wins, losses, and draws against high-level competition.</p>
      <p>As a chess coach as well as a competitor, Nikolay's understanding of the game is reflected in his strategic approach to tournament play.</p>
    `;
  }
  
  // Add a fade-in effect
  explanationElement.style.opacity = 0;
  setTimeout(() => {
    explanationElement.style.transition = "opacity 0.5s ease-in-out";
    explanationElement.style.opacity = 1;
  }, 50);
}

// Render a single player chart
function renderSinglePlayerChart(containerId, dataFile, playerName) {
  d3.csv(dataFile)
    .then(data => {
      if (!data.length) {
        throw new Error("Empty data received from CSV file");
      }
      const playerData = processPlayerData(data[0], playerName);
      renderPieChart(containerId, prepareChartData(playerData), playerName);
    })
    .catch(error => {
      console.error(`Failed to create pie chart for ${playerName}:`, error);
      document.getElementById(containerId).innerHTML = 
        `<div class="error">Error loading player data: ${error.message}</div>`;
    });
}

// Init function to setup pie charts from HTML
function initWinrateCharts() {
  console.log("Initializing winrate charts");
  
  // Set initial state to show both charts
  renderFilteredCharts('both');
  
  // Add event listeners for the filter buttons
  setupFilterButtons();
}

// Helper function to show/hide player cards
function showPlayerCard(chartId, show) {
  // Find the parent card container
  const container = document.getElementById(chartId).closest('.col-md-6');
  
  if (container) {
    if (show) {
      container.style.display = 'block';
      // Add a small animation when showing
      container.style.opacity = 0;
      setTimeout(() => { container.style.opacity = 1; }, 50);
    } else {
      container.style.display = 'none';
    }
    
    // If showing, center the remaining chart when one is hidden
    const otherContainer = document.querySelectorAll('.pie-chart-container')
      .forEach(el => {
        const col = el.closest('.col-md-6');
        if (col && col.style.display !== 'none') {
          col.className = show ? 'col-md-6' : 'col-md-8 mx-auto';
        }
      });
  }
}

// Helper function to update active button state
function updateActiveButton(activeButton) {
  // Remove active class from all buttons
  document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
    btn.classList.remove('active', 'btn-primary');
    btn.classList.add('btn-outline-primary');
  });
  
  // Add active class to clicked button
  activeButton.classList.remove('btn-outline-primary');
  activeButton.classList.add('active', 'btn-primary');
}

// Initialize on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, initializing winrate charts");
  setTimeout(initWinrateCharts, 100); // Small delay to ensure DOM is ready
  
  // Add transition styling to the explanation text
  const explanationElement = document.getElementById('explanation-player-comparison');
  if (explanationElement) {
    explanationElement.style.transition = "opacity 0.5s ease-in-out";
    // Initially hide the explanation since we start with both players view
    setTimeout(() => {
      explanationElement.style.display = 'none';
    }, 100);
  }
});

// Export functions
window.createWinratePieCharts = createWinratePieCharts;
window.initWinrateCharts = initWinrateCharts;
