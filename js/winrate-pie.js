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
      renderChessGame("chessgame1", getAaronGamePGN());
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
  container.style.height = '6`00px'; // Reduced from 600px
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
    
    // For Nikolay's games, add game selector if we have multiple games
    if (containerId === "chessgame2") {
      const totalGames = getNikolayGamePGNs().length;
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
    }
    
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
    
    // Add game navigation event listeners if applicable
    if (containerId === "chessgame2") {
      const prevGameBtn = document.getElementById(`${containerId}-prev-game`);
      const nextGameBtn = document.getElementById(`${containerId}-next-game`);
      
      if (prevGameBtn) {
        prevGameBtn.addEventListener('click', () => {
          if (gameIndex > 0) {
            // Re-render with previous game
            container.innerHTML = '';
            renderChessGame(containerId, getNikolayGamePGNs()[gameIndex - 1], gameIndex - 1);
          }
        });
      }
      
      if (nextGameBtn) {
        nextGameBtn.addEventListener('click', () => {
          const totalGames = getNikolayGamePGNs().length;
          if (gameIndex < totalGames - 1) {
            // Re-render with next game
            container.innerHTML = '';
            renderChessGame(containerId, getNikolayGamePGNs()[gameIndex + 1], gameIndex + 1);
          }
        });
      }
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
    `[Event "Olympiad"]
[Site "Budapest HUN"]
[Date "2024.09.11"]
[Round "1.4"]
[White "Hill, Jonathan"]
[Black "Noritsyn, Nikolay"]
[Result "0-1"]
[ECO "A48"]
[WhiteElo "1756"]
[BlackElo "2451"]
[PlyCount "66"]
[EventDate "2024.09.11"]
[EventType "team"]
[EventRounds "11"]
[EventCountry "HUN"]
[Source "ChessMix "]
[SourceDate "2024.10.01"]
[WhiteTeam "Guernsey"]
[BlackTeam "Canada"]
[BlackTeamCountry "CAN"]

1. d4 Nf6 2. Nf3 g6 3. Bf4 d6 4. h3 c5 5. c3 Qb6 6. Qb3 Nc6 7. e3 cxd4 8. Qxb6
axb6 9. exd4 Nd5 10. Bh2 Bh6 11. Be2 Bc1 12. a3 Bxb2 13. Ra2 Bxc3+ 14. Nxc3
Nxc3 15. Ra1 Bf5 16. Bf4 Be4 17. Be3 b5 18. Kd2 Nxe2 19. Kxe2 Kd7 20. Nh4 Ra4
21. Rhd1 Rha8 22. f3 Bd5 23. Kf2 b4 24. Bc1 bxa3 25. Rd3 a2 26. Bb2 Na5 27. Ra3
Rxa3 28. Bxa3 Nc4 29. Bc1 Na3 30. Bxa3 Rxa3 31. f4 b5 32. Nf3 Bxf3 33. gxf3 b4
0-1`,
    // Game 2 - vs Urkedal (Olympiad)
    `[Event "Olympiad"]
[Site "Budapest HUN"]
[Date "2024.09.12"]
[Round "2.4"]
[White "Urkedal, Frode Olav Olsen"]
[Black "Noritsyn, Nikolay"]
[Result "1-0"]
[ECO "D20"]
[WhiteElo "2546"]
[BlackElo "2451"]
[PlyCount "87"]
[EventDate "2024.09.11"]
[EventType "team"]
[EventRounds "11"]
[EventCountry "HUN"]
[Source "ChessMix "]
[SourceDate "2024.10.01"]
[WhiteTeam "Norway"]
[BlackTeam "Canada"]
[WhiteTeamCountry "NOR"]
[BlackTeamCountry "CAN"]

1. d4 d5 2. c4 dxc4 3. e4 e5 4. Nf3 Bb4+ 5. Nc3 exd4 6. Qxd4 Qxd4 7. Nxd4 Nf6
8. f3 Bc5 9. Ndb5 Na6 10. Bf4 Be6 11. Bxc7 Ke7 12. O-O-O Nxc7 13. Nxc7 Rac8 14.
Nxe6 fxe6 15. Kc2 Be3 16. g3 Rhf8 17. Bh3 Nd7 18. f4 g5 19. Bxe6 Kxe6 20. f5+
Ke7 21. Nd5+ Kf7 22. Nxe3 Ne5 23. Rd6 Rfe8 24. h4 g4 25. h5 b5 26. Rhd1 Nd3 27.
Rd7+ Kf8 28. Rxh7 Kg8 29. Rxa7 Rxe4 30. Nd5 Re2+ 31. Rd2 Re1 32. Rh2 Rd8 33. h6
Kh8 34. Nf6 Nb4+ 35. Kc3 Nd5+ 36. Nxd5 Rxd5 37. f6 Rd8 38. Kb4 Rf1 39. Rf7 Rc8
40. Re2 Rh1 41. Rfe7 Rf8 42. Re8 Kg8 43. R2e7 Rxe8 44. f7+ 1-0`,
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
a4 Ne4 16. Be1 Nd6 17. e3 Rc8 18. Bf1 Rc7 19. Na2 Nc4 20. Nd2 Nf6 21. Rab1 Qd7
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
function getAaronGamePGN() {
  return `[Event "Olympiad"]
[Site "Budapest HUN"]
[Date "2024.09.11"]
[Round "1.4"]
[White "Hill, Jonathan"]
[Black "Noritsyn, Nikolay"]
[Result "0-1"]
[ECO "A48"]
[WhiteElo "1756"]
[BlackElo "2451"]
[PlyCount "66"]
[EventDate "2024.09.11"]
[EventType "team"]
[EventRounds "11"]
[EventCountry "HUN"]
[Source "ChessMix "]
[SourceDate "2024.10.01"]
[WhiteTeam "Guernsey"]
[BlackTeam "Canada"]
[BlackTeamCountry "CAN"]

1. d4 Nf6 2. Nf3 g6 3. Bf4 d6 4. h3 c5 5. c3 Qb6 6. Qb3 Nc6 7. e3 cxd4 8. Qxb6
axb6 9. exd4 Nd5 10. Bh2 Bh6 11. Be2 Bc1 12. a3 Bxb2 13. Ra2 Bxc3+ 14. Nxc3
Nxc3 15. Ra1 Bf5 16. Bf4 Be4 17. Be3 b5 18. Kd2 Nxe2 19. Kxe2 Kd7 20. Nh4 Ra4
21. Rhd1 Rha8 22. f3 Bd5 23. Kf2 b4 24. Bc1 bxa3 25. Rd3 a2 26. Bb2 Na5 27. Ra3
Rxa3 28. Bxa3 Nc4 29. Bc1 Na3 30. Bxa3 Rxa3 31. f4 b5 32. Nf3 Bxf3 33. gxf3 b4
0-1`}

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
    let newHtml = `<h3 class="explanation-title">Nikolay's Games</h3>`;
    explanationElement.innerHTML = newHtml;
    explanationElement.innerHTML += `
      <p>Explore three of Nikolay Noritsyn's games from the 2024 Olympiad in Budapest, showcasing his technical mastery.</p>
      <p>The first game demonstrates his tactical play against a lower-rated opponent from Guernsey, where his queenside pawn majority eventually decides the game.</p>
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
