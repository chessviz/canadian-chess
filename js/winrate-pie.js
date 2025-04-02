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
    .style("height", "100%")
    .style("position", "relative"); // Add relative positioning

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

  // Get the player ID based on the player name
  let playerProfileUrl = "";
  if (playerName.includes("Nikolay")) {
    playerProfileUrl = "https://www.chess.ca/en/ratings/p/?id=132534";
  } else if (playerName.includes("Aaron")) {
    playerProfileUrl = "https://www.chess.ca/en/ratings/p/?id=167084";
  }

  // Add hover overlay for chess.ca profile link
  const overlay = container
    .append("div")
    .attr("class", "chart-overlay")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "100%")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("opacity", "0")
    .style("background-color", "rgba(0,0,0,0.5)")
    .style("transition", "opacity 0.3s ease")
    .style("pointer-events", "none") // Initially don't capture mouse events
    .style("z-index", "10");

  // Add link button
  overlay
    .append("a")
    .attr("href", playerProfileUrl)
    .attr("target", "_blank")
    .attr("rel", "noopener noreferrer")
    .style("text-decoration", "none")
    .append("button")
    .attr("class", "btn btn-primary")
    .style("padding", "8px 16px")
    .style("border-radius", "4px")
    .style("cursor", "pointer")
    .html('<i class="fas fa-external-link-alt mr-1"></i> View Official Profile');

  // Add hover effects
  container
    .on("mouseenter", function() {
      overlay
        .style("opacity", "1")
        .style("pointer-events", "auto"); // Enable pointer events on hover
    })
    .on("mouseleave", function() {
      overlay
        .style("opacity", "0")
        .style("pointer-events", "none"); // Disable pointer events when not hovering
    });
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
          <p class="text-muted mb-0">${filter === 'both' ? 'Performance Analysis' : 'Featured Games'}</p>
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
          <p class="text-muted mb-0">${filter === 'both' ? 'Performance Analysis' : 'Featured Games'}</p>
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
      renderChessGame("chessgame1", getAaronGamePGN(0), 0);
    } else if (filter === 'nikolay') {
      // For Nikolay, we now have multiple games, start with the first one
      renderChessGame("chessgame2", getNikolayGamePGN(0), 0);
    }
  }
  
  // Update the explanation text based on the filter
  updateExplanationText(filter);
}

// Function to render a chess game visualization
function renderChessGame(containerId, pgn, gameIndex = 0) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  console.log("Loading PGN:", pgn);
  console.log("Container ID:", containerId);

  // Set container dimensions - make it smaller and more responsive
  container.style.width = '100%';
  container.style.height = '600px'; // Fixed typo from 6`00px
  container.style.maxWidth = '400px'; // Add maximum width
  container.style.margin = '0 auto'; // Center the container
  
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
      console.log("PGN loaded successfully");
    } catch (error) {
      console.error("Error loading PGN:", error);
      throw new Error("Failed to load PGN - invalid format");
    }
    
    // Initialize the chessboard with proper configuration and sizing
    const boardConfig = {
      position: 'start',
      showNotation: true,
      pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
      // Make the board responsive
      responsive: true
    };
    
    const board = Chessboard2(containerId, boardConfig);
    
    // Manually resize the board to fit container
    if (board.resize) {
      setTimeout(() => board.resize(), 50);
    }
    
    // Add controls for navigating the game
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'chess-controls mt-2 text-center'; // Reduced margin
    
    // Extract game metadata for display
    const event = extractPgnTag(pgn, 'Event') || 'Unknown Event';
    const white = extractPgnTag(pgn, 'White') || 'Unknown White';
    const black = extractPgnTag(pgn, 'Black') || 'Unknown Black';
    const result = extractPgnTag(pgn, 'Result') || '*';
    const date = extractPgnTag(pgn, 'Date') || '';
    
    // Add game information
    controlsDiv.innerHTML = `
      <div class="game-info small text-muted mb-1">
        ${event} (${date.split('.')[0]}) · ${white} vs ${black} · ${result}
      </div>
      <div class="btn-group btn-group-sm"> <!-- Use smaller buttons -->
        <button id="${containerId}-start" class="btn btn-sm btn-outline-secondary">Start</button>
        <button id="${containerId}-prev" class="btn btn-sm btn-outline-secondary">Prev</button>
        <button id="${containerId}-next" class="btn btn-sm btn-outline-secondary">Next</button>
        <button id="${containerId}-end" class="btn btn-sm btn-outline-secondary">End</button>
      </div>
      <div class="mt-1"> <!-- Reduced margin -->
        <span id="${containerId}-status" class="badge bg-secondary small">Starting Position</span>
      </div>
    `;
    
    // Add game navigation for both players, determine which collection to use
    const isAaron = containerId === "chessgame1";
    const games = isAaron ? getAaronGamePGNs() : getNikolayGamePGNs();
    const totalGames = games.length;
    
    const gameNavDiv = document.createElement('div');
    gameNavDiv.className = 'game-navigation mt-2';
    gameNavDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <button id="${containerId}-prev-game" class="btn btn-sm btn-outline-primary" ${gameIndex === 0 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i> Prev Game
        </button>
        <span class="mx-2 badge bg-primary">Game ${gameIndex + 1} of ${totalGames}</span>
        <button id="${containerId}-next-game" class="btn btn-sm btn-outline-primary" ${gameIndex === totalGames - 1 ? 'disabled' : ''}>
          Next Game <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
    controlsDiv.appendChild(gameNavDiv);
    
    container.appendChild(controlsDiv);
    
    // Parse PGN moves into a more usable array
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
    
    // Add game navigation event listeners for both players
    const prevGameBtn = document.getElementById(`${containerId}-prev-game`);
    const nextGameBtn = document.getElementById(`${containerId}-next-game`);
    
    if (prevGameBtn) {
      prevGameBtn.addEventListener('click', () => {
        if (gameIndex > 0) {
          // Re-render with previous game - use the appropriate function based on player
          container.innerHTML = '';
          if (isAaron) {
            renderChessGame(containerId, getAaronGamePGNs()[gameIndex - 1], gameIndex - 1);
          } else {
            renderChessGame(containerId, getNikolayGamePGNs()[gameIndex - 1], gameIndex - 1);
          }
        }
      });
    }
    
    if (nextGameBtn) {
      nextGameBtn.addEventListener('click', () => {
        const totalGames = isAaron ? getAaronGamePGNs().length : getNikolayGamePGNs().length;
        if (gameIndex < totalGames - 1) {
          // Re-render with next game - use the appropriate function based on player
          container.innerHTML = '';
          if (isAaron) {
            renderChessGame(containerId, getAaronGamePGNs()[gameIndex + 1], gameIndex + 1);
          } else {
            renderChessGame(containerId, getNikolayGamePGNs()[gameIndex + 1], gameIndex + 1);
          }
        }
      });
    }
    
    // Start at the beginning position
    updateBoard(-1);
    
    // Force resize after a short delay to ensure proper sizing
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
    
  } catch (error) {
    console.error("Error rendering chess game:", error);
    
    // Provide a more helpful error message
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error rendering chess game:</strong> ${error.message}
      </div>
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

// Helper function to extract tags from PGN
function extractPgnTag(pgn, tagName) {
  const regex = new RegExp(`\\[${tagName} "([^"]+)"\\]`);
  const match = pgn.match(regex);
  return match ? match[1] : null;
}

// Function to get all of Nikolay's sample game PGNs as an array
function getNikolayGamePGNs() {
  return [
    // Game 1 - vs Hill (Olympiad)
    `[Event "CAN-ch"]
[Site "Toronto CAN"]
[Date "2023.04.08"]
[Round "4.2"]
[White "Noritsyn, Nikolay"]
[Black "Rodrigue-Lemieux, Shawn"]
[Result "1-0"]
[ECO "C79"]
[WhiteElo "2546"]
[BlackElo "2539"]
[PlyCount "63"]
[EventDate "2023.04.06"]
[EventType "swiss"]
[EventRounds "9"]
[EventCountry "CAN"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. O-O Bd7 6. c3 Nf6 7. Re1 g6 8. d4
Qe7 9. d5 Nd8 10. Bg5 Bg7 11. c4 O-O 12. Nc3 h6 13. Bh4 Bxa4 14. Qxa4 g5 15.
Bg3 Nh5 16. Rad1 Bf6 17. Nd2 g4 18. Nf1 Bg5 19. Rd3 Ng7 20. Qd1 h5 21. f3 Qd7
22. fxg4 Qxg4 23. Rf3 Bh6 24. h3 Qg6 25. Bh4 f5 26. Rg3 Qh7 27. exf5 Bf4 28. f6
Bxg3 29. Nxg3 Ne8 30. Rf1 Nf7 31. Nce4 b5 32. Rf5 1-0`,
    // Game 2 - vs Urkedal (Olympiad)
    `[Event "Maplewood inv."]
[Site "Waterloo, QC CAN"]
[Date "2024.07.21"]
[Round "3.3"]
[White "Noritsyn, Nikolay"]
[Black "Kantans, T."]
[Result "1-0"]
[ECO "B48"]
[WhiteElo "2450"]
[BlackElo "2471"]
[PlyCount "43"]
[EventDate "2024.07.20"]
[EventType "tourn"]
[EventRounds "9"]
[EventCountry "CAN"]
[EventCategory "10"]
[Source "Mark Crowther"]
[SourceDate "2024.07.29"]

1. e4 c5 2. Nc3 Nc6 3. Nge2 e6 4. d4 cxd4 5. Nxd4 Qc7 6. Be3 a6 7. Bd3 Nf6 8.
Qe2 Bd6 9. O-O-O Be5 10. Nxc6 bxc6 11. g4 Rb8 12. Bd2 d5 13. g5 Nd7 14. Rhf1
Qa5 15. a3 Nc5 16. exd5 Rxb2 17. Kxb2 Na4+ 18. Ka2 Bxc3 19. dxc6 O-O 20. Bc4
Bxd2 21. Qxd2 Nc3+ 22. Kb3 1-0`,
    // Game 3 - vs Kelires (Olympiad)
    `[Event "Olympiad"]
[Site "Budapest HUN"]
[Date "2024.09.14"]
[Round "4.4"]
[White "Kelires, Andreas"]
[Black "Noritsyn, Nikolay"]
[Result "0-1"]
[ECO "A05"]
[WhiteElo "2536"]
[BlackElo "2451"]
[PlyCount "104"]
[EventDate "2024.09.11"]
[EventType "team"]
[EventRounds "11"]
[EventCountry "HUN"]
[Source "ChessMix "]
[SourceDate "2024.10.01"]
[WhiteTeam "Greece"]
[BlackTeam "Canada"]
[WhiteTeamCountry "GRE"]
[BlackTeamCountry "CAN"]

1. Nf3 d5 2. g3 b6 3. Bg2 Bb7 4. O-O Nf6 5. d3 e6 6. Re1 Bc5 7. d4 Be7 8. c4 c6
9. Nc3 Nbd7 10. Bf4 Nh5 11. Bd2 Nhf6 12. Qb3 O-O 13. cxd5 cxd5 14. Rec1 a6 15.
a4 Ne4 16. Be1 Nd6 17. e3 Rc7 18. Bf1 Rc8 19. Na2 Nc4 20. Nd2 Nf6 21. Rab1 Qd7
22. Qd1 Rfc8 23. Nf3 Ne4 24. b3 Na5 25. Ne5 Qd8 26. Rxc7 Rxc7 27. Rc1 Bd6 28.
Rxc7 Qxc7 29. Nf3 h5 30. Bd3 g6 31. Qb1 Be7 32. Ne5 Bd6 33. b4 Nc6 34. Nf3 Ne7
35. Nd2 Nxd2 36. Bxd2 h4 37. Be1 e5 38. Nc3 Qd7 39. Qb3 exd4 40. exd4 Qg4 41.
b5 a5 42. Bf1 Qxd4 43. Bg2 Bb4 44. Qc2 Qc4 45. Bd2 Nf5 46. Qc1 Nd4 47. Qe1 Ne6
48. Qe5 Qd4 49. Qe1 Qd3 50. Bf1 Qf5 51. Ne2 d4 52. Bxb4 axb4 0-1`
  ];
}

// Function to get a specific game from Nikolay's collection
function getNikolayGamePGN(index = 0) {
  const games = getNikolayGamePGNs();
  if (index >= 0 && index < games.length) {
    return games[index];
  }
  return games[0]; // Return first game as default
}

// Function to get Aaron's sample game PGN
function getAaronGamePGNs() {
  return [
    `[Event "CAN op"]
[Site "Hamilton CAN"]
[Date "2022.07.15"]
[Round "7.15"]
[White "Preotu, Razvan"]
[Black "Mendes, Aaron Reeve"]
[Result "0-1"]
[ECO "B90"]
[WhiteElo "2608"]
[BlackElo "2106"]
[PlyCount "96"]
[EventDate "2022.07.12"]
[EventType "swiss"]
[EventRounds "9"]
[EventCountry "CAN"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be7 8. h3
Be6 9. Qf3 h5 10. O-O-O Nbd7 11. Nd5 Bxd5 12. exd5 Nb6 13. Kb1 Rc8 14. Bxb6
Qxb6 15. Bd3 g6 16. g4 Qb4 17. a3 Qa4 18. Rhg1 Rc7 19. Rde1 hxg4 20. hxg4 Rh4
21. Rxe5 dxe5 22. d6 Rc6 23. dxe7 Rxg4 24. Re1 Qf4 25. Qd1 Kxe7 26. Na5 Rc7 27.
Qe2 Rg5 28. Nc4 Nd7 29. Ne3 Nb6 30. Bxa6 bxa6 31. Qxa6 Qxf2 32. Re2 Rg1+ 33.
Ka2 Qf6 34. Qxb6 Qxb6 35. Nd5+ Ke6 36. Nxb6 f5 37. b3 f4 38. Nc4 Rc5 39. Rf2 g5
40. Kb2 g4 41. Nd2 g3 42. Re2 Kf5 43. c4 e4 44. Rxe4 Rg2 45. Rd4 Re2 46. Kc1 g2
47. Nf3 Kg4 48. Rd3 Re3 0-1`, 
  // Game 3 - vs Kelires (Olympiad)
  `[Event "CAN op"]
[Site "Calgary CAN"]
[Date "2023.07.23"]
[Round "3.2"]
[White "Bareev, Evgeny"]
[Black "Mendes, Aaron Reeve"]
[Result "1/2-1/2"]
[ECO "D30"]
[WhiteElo "2721"]
[BlackElo "2305"]
[PlyCount "65"]
[EventDate "2023.07.22"]
[EventType "swiss"]
[EventRounds "10"]
[EventCountry "CAN"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 e6 5. b3 Nbd7 6. Nbd2 Bd6 7. Bb2 O-O 8. Bd3
b6 9. O-O Bb7 10. Qe2 c5 11. cxd5 exd5 12. Rfd1 Qe7 13. Rac1 Rac8 14. Nf1 Rc7
15. Ng3 g6 16. Rc2 Rfc8 17. Rdc1 Ne4 18. dxc5 Nxg3 19. hxg3 bxc5 20. Qd2 Ne5
21. Be2 f6 22. Ba3 Kg7 23. Nxe5 fxe5 24. Bf3 Qe6 25. Bxd5 Qxd5 26. Qxd5 Bxd5
27. Rd2 Bxb3 28. Rxd6 Bxa2 29. Bb2 Bf7 30. Bxe5+ Kg8 31. Rcd1 Re7 32. Bc3 Be8
33. Rd8 1/2-1/2`,
`[Event "Excelsior June GM Norm"]
[Site "Toronto CAN"]
[Date "2023.06.23"]
[Round "9.5"]
[White "Mendes, Aaron Reeve"]
[Black "Noritsyn, Nikolay"]
[Result "1-0"]
[ECO "B40"]
[WhiteElo "2200"]
[BlackElo "2444"]
[PlyCount "124"]
[EventDate "2023.06.18"]
[EventType "tourn"]
[EventRounds "9"]
[EventCountry "CAN"]

1. e4 c5 2. Nf3 e6 3. b3 b6 4. Bb2 Bb7 5. Nc3 Nc6 6. d4 cxd4 7. Nxd4 Nf6 8.
Nxc6 Bxc6 9. Qe2 Bb4 10. f3 Rc8 11. O-O-O Qc7 12. Nd5 Bxd5 13. exd5 O-O 14. Be5
Qc5 15. Bd4 Qa5 16. Bxf6 gxf6 17. Qa6 Qc5 18. Bc4 Bc3 19. Rd3 Be5 20. g3 f5 21.
f4 Bg7 22. Kb1 Qe7 23. d6 Qd8 24. a4 Rc6 25. Re1 Qb8 26. Red1 Rfc8 27. R1d2 b5
28. Qxb5 Rb6 29. Qxd7 Rb7 30. Qe7 Rxe7 31. dxe7 Bf6 32. Rd8+ Kg7 33. e8=Q Rxd8
34. Rxd8 Bxd8 35. Qd7 Kf8 36. Be2 Qb6 37. Bh5 Be7 38. Qc8+ Bd8 39. Qc3 Kg8 40.
h3 Qd6 41. b4 Be7 42. b5 Bf8 43. Kc1 h6 44. a5 Bg7 45. Qc8+ Bf8 46. Qe8 Qa3+
47. Kd1 Qd6+ 48. Ke2 Qc7 49. Qc6 Qxc6 50. bxc6 Bd6 51. Kd3 Bc7 52. Kc4 Kf8 53.
Kb5 Ke7 54. Ka6 f6 55. Kb7 Kd8 56. a6 e5 57. Bg6 Ba5 58. Bxf5 exf4 59. gxf4 Bb6
60. h4 Ba5 61. h5 Bb6 62. c4 Ke8 1-0`]
}

// Function to get a specific game from Nikolay's collection
function getAaronGamePGN(index = 0) {
  const games = getAaronGamePGNs();
  if (index >= 0 && index < games.length) {
    return games[index];
  }
  return games[0]; // Return first game as default
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
    let newHtml = `<h3 class="explanation-title">Aaron's Games</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>Explore three of Aaron Reeve Mendes's notable games, showcasing his impressive tactical abilities.</p>
      <p>The first game features his famous win against GM Razvan Preotu, where his queenside play and patient maneuvering led to a significant upset victory.</p>
      <p>Use the "Prev Game" and "Next Game" buttons to browse through all three games and witness his remarkable development as a young player.</p>
    `;
  } else if (filter === 'nikolay') {
    let newHtml = `<h3 class="explanation-title">Nikolay's Games</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>Explore three of Nikolay Noritsyn's games showcasing his technical mastery and precision.</p>
      <p>The first game demonstrates his tactical play against Shawn Rodrigue Lemiuex at the 2023 Canadian Championship.</p>
      <p>Use the "Prev Game" and "Next Game" buttons to browse through all three games and see different aspects of his play style.</p>
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
