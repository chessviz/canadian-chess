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
    .style("height", "50%");

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
  const aaronPortrait = document.getElementById("aaron-portrait-pie");
  const nikolayPortrait = document.getElementById("nikolay-portrait-pie");
  
  // Reset both portraits to inactive state - remove active class and reduce opacity
  document.querySelectorAll(".player-portrait").forEach((portrait) => {
    portrait.classList.remove("active");
    // portrait.style.opacity = "0.7";
  });
  
  // Add active state to selected portrait if applicable
  if (activeElement) {
    activeElement.classList.add("active");
    // activeElement.style.opacity = "1";
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
          <p class="text-muted mb-0">${filter === 'both' ? 'Performance Analysis' : 'Featured Game'}</p>
        </div>
        <div class="card-body d-flex align-items-center justify-content-center">
          <div id="${filter === 'both' ? 'piechart1' : 'chessgame1'}" class="${filter === 'both' ? 'pie-chart-container' : 'chess-game-container'}"></div>
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
          <p class="text-muted mb-0">${filter === 'both' ? 'Performance Analysis' : 'Featured Game'}</p>
        </div>
        <div class="card-body d-flex align-items-center justify-content-center">
          <div id="${filter === 'both' ? 'piechart2' : 'chessgame2'}" class="${filter === 'both' ? 'pie-chart-container' : 'chess-game-container'}"></div>
        </div>
      </div>
    `;
    rowDiv.appendChild(nikolayCol);
  }
  
  // Add extra margin between cards when showing both
  if (filter === 'both') {
    rowDiv.style.columnGap = '20px';
  }
  
  // Render either pie charts or chess games based on filter
  if (filter === 'both') {
    // For 'both' filter, render the pie charts
    renderSinglePlayerChart("piechart1", "data/player_winrate_167084.csv", "Aaron Reeve Mendes");
    renderSinglePlayerChart("piechart2", "data/player_winrate_132534.csv", "Nikolay Noritsyn");
  } else {
    // For individual player filters, render the chess game
    if (filter === 'aaron') {
      renderChessGame("chessgame1", getAaronGamePGN());
    } else if (filter === 'nikolay') {
      renderChessGame("chessgame2", getNikolayGamePGN());
    }
  }
  
  // Update the explanation text based on the filter
  updateExplanationText(filter);
}

// Function to render a chess game visualization
function renderChessGame(containerId, pgn) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  console.log("Loading PGN:", pgn);
  console.log("Container ID:", containerId);

  // Set container dimensions
  container.style.width = '60%';
  // container.style.height = '300px';
  container.style.height = '600px';
  
  try {
    // Check if chess.js is properly loaded
    if (typeof Chess !== 'function') {
      console.error("Chess.js library not properly loaded");
      throw new Error("Chess.js library not properly loaded or initialized");
    }
    
    // Create a new chess instance with proper initialization
    const chess = new Chess();
    
    // Try loading the PGN using the method name for chess.js 1.1.0
    try {
      // In chess.js 1.1.0, the method is called load_pgn with an underscore
      const loadSuccess = chess.load_pgn(pgn);
      if (loadSuccess === false) {
        throw new Error("Failed to load PGN - invalid format");
      }
      // chess.load_pgn("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 {giuoco piano} *")

      console.log("PGN loaded successfully");
    } catch (error) {
      console.error("Error loading PGN:", error);
      throw new Error("Failed to load PGN - invalid format");
    }
    
    // Initialize the chessboard with proper configuration
    
    const board = Chessboard2(containerId, 'start');
    
    // Add controls for navigating the game
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'chess-controls mt-3 text-center';
    controlsDiv.innerHTML = `
      <div class="btn-group">
        <button id="${containerId}-start" class="btn btn-sm btn-outline-secondary">Start</button>
        <button id="${containerId}-prev" class="btn btn-sm btn-outline-secondary">Previous</button>
        <button id="${containerId}-next" class="btn btn-sm btn-outline-secondary">Next</button>
        <button id="${containerId}-end" class="btn btn-sm btn-outline-secondary">End</button>
      </div>
      <div class="mt-2">
        <span id="${containerId}-status" class="badge bg-secondary">Starting Position</span>
      </div>
    `;
    container.appendChild(controlsDiv);
    
    // Parse PGN moves into a more usable array
    const moves = [];
    const historyMoves = chess.history({verbose: true});
    
    // Reset the game to start position for our tracking
    chess.reset();
    
    // Set up tracking for current move
    let currentMove = -1;
    
    // Update board to show specific move
    function updateBoard(moveIndex) {
      // Reset the game
      chess.reset();
      
      // Replay moves up to the current index
      for (let i = 0; i <= moveIndex; i++) {
        if (i < historyMoves.length) {
          chess.move(historyMoves[i]);
        }
      }
      
      // Update the board position
      board.position(chess.fen());
      
      // Update the status display
      const statusElement = document.getElementById(`${containerId}-status`);
      if (statusElement) {
        if (moveIndex >= 0 && moveIndex < historyMoves.length) {
          const moveNum = Math.floor(moveIndex/2) + 1;
          const moveColor = moveIndex % 2 === 0 ? 'White' : 'Black';
          statusElement.textContent = `Move ${moveNum} ${moveColor}: ${historyMoves[moveIndex].san}`;
        } else {
          statusElement.textContent = 'Starting Position';
        }
      }
    }
    
    // Add event listeners for control buttons
    document.getElementById(`${containerId}-start`).addEventListener('click', () => {
      currentMove = -1;
      updateBoard(currentMove);
    });
    
    document.getElementById(`${containerId}-prev`).addEventListener('click', () => {
      if (currentMove > -1) {
        currentMove--;
        updateBoard(currentMove);
      }
    });
    
    document.getElementById(`${containerId}-next`).addEventListener('click', () => {
      if (currentMove < historyMoves.length - 1) {
        currentMove++;
        updateBoard(currentMove);
      }
    });
    
    document.getElementById(`${containerId}-end`).addEventListener('click', () => {
      currentMove = historyMoves.length - 1;
      updateBoard(currentMove);
    });
    
    // Start at the beginning position
    updateBoard(-1);
    
  } catch (error) {
    console.error("Error rendering chess game:", error);
    
    // Provide a more helpful error message and display the PGN as text
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error rendering chess game:</strong> ${error.message}
        <p class="mt-2 mb-0">This might be due to a problem with the Chess.js or Chessboard.js libraries.</p>
      </div>
      <div class="mt-3">
        <h5>Game PGN:</h5>
        <pre style="font-size: 12px; overflow: auto; background: #f8f9fa; padding: 10px; border-radius: 4px;">${pgn}</pre>
      </div>
    `;
    
    // Also add a link to view the game on lichess
    container.innerHTML += `
      <div class="mt-3 text-center">
        <a href="https://lichess.org/paste?pgn=${encodeURIComponent(pgn)}" 
           target="_blank" 
           class="btn btn-primary">
          View on Lichess
        </a>
      </div>
    `;
  }
}

// Function to get Nikolay's sample game PGN
function getNikolayGamePGN() {
  return `[Event "Canadian Junior Championship"]
[Site "Toronto CAN"]
[Date "2023.07.24"]
[Round "5"]
[White "Mendes, Aaron Reeve"]
[Black "Smith, Michael"]
[Result "1-0"]
[GameId "oRal77kc"]
[WhiteElo "2105"]
[BlackElo "1982"]
[Variant "Standard"]
[TimeControl "-"]
[ECO "B06"]
[Opening "Modern Defense: Standard Defense"]
[Termination "Unknown"]
[Annotator "lichess.org"]

1. e4 g6 2. d4 Bg7 3. Nc3 d6 { B06 Modern Defense: Standard Defense } 4. Be3 a6 5. Qd2 Nd7 6. f3 b5 7. a4 b4 8. Nd1 Bb7 9. c3 c5 10. Bc4 e6 11. Ne2 Ne7 12. O-O O-O { White wins. } 1-0`;
}

// Function to get Aaron's sample game PGN
function getAaronGamePGN() {
  return `[Event "Canadian Junior Championship"]
[Site "Toronto CAN"]
[Date "2023.07.24"]
[Round "5"]
[White "Mendes, Aaron Reeve"]
[Black "Smith, Michael"]
[Result "1-0"]
[GameId "oRal77kc"]
[WhiteElo "2105"]
[BlackElo "1982"]
[Variant "Standard"]
[TimeControl "-"]
[ECO "B06"]
[Opening "Modern Defense: Standard Defense"]
[Termination "Unknown"]
[Annotator "lichess.org"]

1. e4 g6 2. d4 Bg7 3. Nc3 d6 { B06 Modern Defense: Standard Defense } 4. Be3 a6 5. Qd2 Nd7 6. f3 b5 7. a4 b4 8. Nd1 Bb7 9. c3 c5 10. Bc4 e6 11. Ne2 Ne7 12. O-O O-O { White wins. } 1-0`;
}

// Update explanation text function to include game commentary
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
    let newHtml = `<h3 class="explanation-title">Aaron's Featured Game</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>This game showcases Aaron Reeve Mendes's tactical prowess in a Canadian Junior Championship match.</p>
      <p>Notice his methodical buildup in the Modern Defense, using the e5 push on move 19 to secure a strong central presence.</p>
      <p>The knight sacrifice on e5 (move 27) exemplifies his aggressive style, leading to a winning position with the powerful d6-pawn.</p>
    `;
  } else if (filter === 'nikolay') {
    let newHtml = `<h3 class="explanation-title">Nikolay's Featured Game</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>This Olympiad game demonstrates Nikolay Noritsyn's technical mastery against a lower-rated opponent.</p>
      <p>Notice how Nikolay sacrifices a bishop on move 12-13 to gain the initiative, creating complications that favor the stronger player.</p>
      <p>The exchange sacrifice (Rxa3) on move 27 is particularly instructive, leading to a winning endgame where his connected passed pawns on the queenside prove decisive.</p>
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
