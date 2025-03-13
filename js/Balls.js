class ChessRatingVisualization {
  constructor() {
    console.log("Initializing visualization");
    
    // Constants
    this.CORRECT_PLAYER_COUNT = 10000;
    this.ACCEPTABLE_ERROR_MARGIN = 2000; // ±20%
    
    // Rating ranges and their percentages (using colorblind-friendly palette)
    this.ratingRanges = [
      { range: "1-1199", percent: 50.9, color: "#0072B2" },    // Blue (colorblind-friendly)
      { range: "1200-1699", percent: 33.1, color: "#56B4E9" }, // Light blue
      { range: "1700-1899", percent: 9.4, color: "#F0E442" },  // Yellow
      { range: "1900-2299", percent: 5.6, color: "#E69F00" },  // Orange
      { range: "2300+", percent: 1.0, color: "#D55E00" }       // Red-orange (colorblind-friendly)
    ];
    
    // State variables
    this.guessSubmitted = false;
    this.gridInitialized = false;
    this.hourglassInitialized = false;
    this.simulationRunning = false;
    
    // Physics constants
    this.GRAVITY = 0.85;
    this.RESTITUTION = 0.3;
    this.FRICTION = 0.95;
    
    // Setup events
    this.setupEvents();
    
    // Initialize visibility handlers for fullpage.js integration
    this.setupFullpageHandlers();
    
    // Initialize the visualizations that should appear first
    this.initializeVisibleSections();
  }
  
  // Set up dimensions based on current viewport
  updateDimensions() {
    // Get grid section dimensions
    const gridContainer = document.getElementById('grid-display-container');
    if (gridContainer) {
      this.gridWidth = gridContainer.clientWidth;
      this.gridHeight = gridContainer.clientHeight;
    }
    
    // Get hourglass section dimensions
    const hourglassSection = document.getElementById('hourglass-section');
    if (hourglassSection) {
      this.hourglassWidth = hourglassSection.clientWidth;
      this.hourglassHeight = hourglassSection.clientHeight;
    }
    
    // Grid ball sizing - adaptive based on screen size
    const isMobile = window.innerWidth < 768;
    this.gridBallRadius = isMobile ? 
      Math.min(6, Math.min(this.gridWidth, this.gridHeight) / 25) : 
      Math.min(8, Math.min(this.gridWidth, this.gridHeight) / 25);
    
    this.numRows = 10;
    this.numCols = 10;
    this.numBalls = this.numRows * this.numCols;
  }
  
  // Setup all event listeners
  setupEvents() {
    // Guess submission
    const submitButton = document.getElementById('submit-guess');
    if (submitButton) {
      submitButton.addEventListener('click', this.handleGuessSubmission.bind(this));
    }
    
    // Input field for guess
    const guessInput = document.getElementById('player-guess');
    if (guessInput) {
      guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleGuessSubmission();
        }
      });
      
      // Also update when input value changes
      guessInput.addEventListener('input', () => {
        const sliderElement = document.getElementById('player-guess-slider');
        if (sliderElement && !isNaN(guessInput.value)) {
          sliderElement.value = guessInput.value;
        }
      });
    }
    
    // Slider for guess
    const sliderElement = document.getElementById('player-guess-slider');
    if (sliderElement) {
      // Update numeric input when slider changes
      sliderElement.addEventListener('input', () => {
        const inputElement = document.getElementById('player-guess');
        if (inputElement) {
          inputElement.value = sliderElement.value;
        }
      });
    }
    
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  // Setup handlers for fullpage.js integration
  setupFullpageHandlers() {
    // This function will be called from fullpage.js onLeave callback
    window.initializeHourglassOnScroll = () => {
      if (!this.hourglassInitialized) {
        this.initializeHourglass();
      }
      
      if (!this.simulationRunning) {
        this.startHourglassAnimation();
      }
    };
  }
  
  // Initialize any visualizations that should be immediately visible
  initializeVisibleSections() {
    // Make grid info container visible
    const gridInfoContainer = document.getElementById('grid-info-container');
    if (gridInfoContainer) {
      gridInfoContainer.classList.add('visible');
    }
    
    // Initialize grid if we're on a section where it should be visible
    if (document.getElementById('grid-section') && 
        document.getElementById('grid-section').classList.contains('active')) {
      this.initializeGrid();
    }
    
    // Make hourglass panels visible
    const hourglassLegend = document.getElementById('hourglass-legend');
    const hourglassExplanation = document.getElementById('chess-explanation-hourglass');
    
    if (hourglassLegend) hourglassLegend.classList.add('visible');
    if (hourglassExplanation) hourglassExplanation.classList.add('visible');
  }
  
  // Handle the guess submission
  handleGuessSubmission() {
    if (this.guessSubmitted) return;
    
    const guessInput = document.getElementById('player-guess');
    if (!guessInput) return;
    
    const guess = parseInt(guessInput.value);
    const feedbackElement = document.getElementById('guess-feedback');
    
    if (isNaN(guess) || guess < 0) {
      if (feedbackElement) {
        feedbackElement.textContent = "Please enter a valid number.";
        feedbackElement.classList.add('visible');
      }
      return;
    }
    
    this.guessSubmitted = true;
    
    // Disable the submit button and slider
    const submitButton = document.getElementById('submit-guess');
    const guessSlider = document.getElementById('player-guess-slider');
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.remove('pulse-animation');
      submitButton.textContent = "Processing...";
    }
    
    if (guessSlider) {
      guessSlider.disabled = true;
    }
    
    if (guessInput) {
      guessInput.disabled = true;
    }
    
    // Check if guess is close
    const lowerBound = this.CORRECT_PLAYER_COUNT - this.ACCEPTABLE_ERROR_MARGIN;
    const upperBound = this.CORRECT_PLAYER_COUNT + this.ACCEPTABLE_ERROR_MARGIN;
    
    let feedbackMessage;
    let accuracy;
    
    if (guess >= lowerBound && guess <= upperBound) {
      feedbackMessage = `Great guess! You're within ${Math.round((this.ACCEPTABLE_ERROR_MARGIN / this.CORRECT_PLAYER_COUNT) * 100)}% of the actual number.`;
      accuracy = "excellent";
    } else if (guess < lowerBound) {
      const percentageLow = Math.round(((this.CORRECT_PLAYER_COUNT - guess) / this.CORRECT_PLAYER_COUNT) * 100);
      feedbackMessage = `That's ${percentageLow}% lower than the actual number. Let's see the real data!`;
      accuracy = "low";
    } else {
      const percentageHigh = Math.round(((guess - this.CORRECT_PLAYER_COUNT) / this.CORRECT_PLAYER_COUNT) * 100);
      feedbackMessage = `That's ${percentageHigh}% higher than the actual number. Let's see the real data!`;
      accuracy = "high";
    }
    
    if (feedbackElement) {
      feedbackElement.textContent = feedbackMessage;
      feedbackElement.classList.add('visible');
    }
    
    // Show the result with animation after a short delay
    setTimeout(() => {
      this.showGuessResult(guess, accuracy);
    }, 1500);
  }
  
  // Show the guess result with animation
  showGuessResult(userGuess, accuracy) {
    // Hide the interaction area
    const interactionArea = document.querySelector('.guess-interaction-area');
    if (interactionArea) {
      interactionArea.style.opacity = '0';
      interactionArea.style.transform = 'translateY(-20px)';
      interactionArea.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }
    
    // Show the result visualization
    const resultVisualization = document.getElementById('guess-result-visualization');
    if (resultVisualization) {
      setTimeout(() => {
        // Hide interaction area completely
        if (interactionArea) {
          interactionArea.style.display = 'none';
        }
        
        // Show result visualization
        resultVisualization.classList.add('visible');
        
        // Create chess pieces visualization
        this.createChessPiecesVisualization(accuracy);
      }, 500);
    }
  }
  
  // Create animated chess pieces visualization
  createChessPiecesVisualization(accuracy) {
    const chessPiecesWrapper = document.querySelector('.chess-pieces-wrapper');
    if (!chessPiecesWrapper) return;
    
    // Clear any existing content
    chessPiecesWrapper.innerHTML = '';
    
    // Chess pieces to use
    const chessPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];
    
    // Number of pieces to display based on the correct player count
    // We'll show a symbolic representation, not 10,000 pieces
    const piecesToShow = 50;
    
    // Create and append chess pieces with staggered animation
    for (let i = 0; i < piecesToShow; i++) {
      const pieceElement = document.createElement('div');
      pieceElement.className = 'chess-piece';
      
      // Randomly select a chess piece
      const randomPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
      pieceElement.textContent = randomPiece;
      
      // Apply color based on accuracy
      if (accuracy === "excellent") {
        pieceElement.style.color = '#009E73'; // Green
      } else if (accuracy === "low") {
        pieceElement.style.color = '#0072B2'; // Blue
      } else {
        pieceElement.style.color = '#D55E00'; // Red-orange
      }
      
      // Set random size variations
      const randomSize = 0.8 + Math.random() * 0.8; // 0.8 to 1.6
      pieceElement.style.fontSize = `${randomSize * 2}rem`;
      
      // Apply staggered animation delay
      pieceElement.style.animationDelay = `${i * 0.04}s`;
      
      // Append to the wrapper
      chessPiecesWrapper.appendChild(pieceElement);
    }
    
    // Update actual number with animation
    const numberValue = document.querySelector('.number-value');
    if (numberValue) {
      // Start from 0 and count up to the correct number
      let currentCount = 0;
      const duration = 2000; // 2 seconds
      const interval = 20; // update every 20ms
      const increment = Math.ceil(this.CORRECT_PLAYER_COUNT / (duration / interval));
      
      const countUp = setInterval(() => {
        currentCount += increment;
        
        if (currentCount >= this.CORRECT_PLAYER_COUNT) {
          currentCount = this.CORRECT_PLAYER_COUNT;
          clearInterval(countUp);
        }
        
        numberValue.textContent = currentCount.toLocaleString();
      }, interval);
    }
  }
  
  // Initialize the grid visualization
  initializeGrid() {
    if (this.gridInitialized) return;
    
    console.log("Initializing grid visualization");
    this.updateDimensions();
    
    // Create grid balls data
    this.gridBalls = [];
    
    // Calculate positioning
    const gridContainer = document.getElementById('grid-display-container');
    if (!gridContainer) return;
    
    const containerRect = gridContainer.getBoundingClientRect();
    const gridLeft = Math.max(80, containerRect.width * 0.1); // Responsive left padding
    const gridTop = (containerRect.height - (this.numRows * this.gridBallRadius * 3)) / 2;
    
    // Calculate ball positions
    const cellWidth = this.gridBallRadius * 3;
    const cellHeight = this.gridBallRadius * 3;
    
    // Create balls and assign colors based on percentages
    let ballsCreated = 0;
    let ballId = 0;
    
    for (const range of this.ratingRanges) {
      const ballsInRange = Math.round(this.numBalls * (range.percent / 100));
      
      for (let i = 0; i < ballsInRange && ballsCreated < this.numBalls; i++) {
        const row = Math.floor(ballsCreated / this.numCols);
        const col = ballsCreated % this.numCols;
        
        this.gridBalls.push({
          id: ballId++,
          radius: this.gridBallRadius,
          x: gridLeft + col * cellWidth + this.gridBallRadius * 1.5,
          y: gridTop + row * cellHeight + this.gridBallRadius * 1.5,
          color: range.color,
          range: range.range
        });
        
        ballsCreated++;
      }
    }
    
    // Ensure all 100 balls are created (handle rounding issues)
    while (ballsCreated < this.numBalls) {
      const row = Math.floor(ballsCreated / this.numCols);
      const col = ballsCreated % this.numCols;
      
      this.gridBalls.push({
        id: ballId++,
        radius: this.gridBallRadius,
        x: gridLeft + col * cellWidth + this.gridBallRadius * 1.5,
        y: gridTop + row * cellHeight + this.gridBallRadius * 1.5,
        color: this.ratingRanges[this.ratingRanges.length - 1].color,
        range: this.ratingRanges[this.ratingRanges.length - 1].range
      });
      
      ballsCreated++;
    }
    
    // Create grid visualization
    const gridSvg = d3.select("#grid-svg");
    if (gridSvg.empty()) return;
    
    // Add balls to the grid with transition
    gridSvg.selectAll(".grid-ball")
      .data(this.gridBalls)
      .enter()
      .append("circle")
      .attr("class", "grid-ball")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 0) // Start with radius 0
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .transition() // Add transition
      .duration(800)
      .delay((d, i) => i * 5) // Stagger the animation
      .attr("r", d => d.radius); // Grow to full radius
    
    this.gridInitialized = true;
  }
  
  // Initialize the hourglass visualization
  initializeHourglass() {
    if (this.hourglassInitialized) return;
    
    console.log("Initializing hourglass visualization");
    this.updateDimensions();
    
    // Set up SVG
    const hourglass = d3.select("#hourglass-svg");
    if (hourglass.empty()) return;
    
    // Hourglass parameters - made responsive
    const centerX = this.hourglassWidth / 2;
    const funnelTopY = Math.max(80, this.hourglassHeight * 0.1); // Responsive top padding
    const funnelWidth = Math.min(this.hourglassWidth * 0.6, 600); // Width of top of funnel
    const funnelHeight = this.hourglassHeight - Math.max(150, this.hourglassHeight * 0.15); // Height of funnel
    const funnelMiddleY = funnelTopY + funnelHeight * 0.7; // Position of middle pinch
    const funnelBottomWidth = 30; // Width of middle pinch
    const funnelBottomY = funnelTopY + funnelHeight; // Bottom of funnel
    
    // Store these values for later use
    this.funnelParams = {
      centerX,
      funnelTopY,
      funnelWidth,
      funnelHeight,
      funnelMiddleY,
      funnelBottomWidth,
      funnelBottomY
    };
    
    // Draw individual funnel walls with transition effects
    // Left wall of top funnel
    const leftWallPath = `M${centerX - funnelWidth/2},${funnelTopY} 
                          L${centerX - funnelBottomWidth/2},${funnelMiddleY}`;
    
    hourglass.append("path")
      .attr("class", "funnel-left-wall")
      .attr("d", leftWallPath)
      .style("fill", "none")
      .style("stroke", "#2c3e50")
      .style("stroke-width", "3px")
      .style("stroke-dasharray", function() { return this.getTotalLength(); })
      .style("stroke-dashoffset", function() { return this.getTotalLength(); })
      .transition()
      .duration(1000)
      .style("stroke-dashoffset", 0);
    
    // Right wall of top funnel
    const rightWallPath = `M${centerX + funnelWidth/2},${funnelTopY} 
                           L${centerX + funnelBottomWidth/2},${funnelMiddleY}`;
    
    hourglass.append("path")
      .attr("class", "funnel-right-wall")
      .attr("d", rightWallPath)
      .style("fill", "none")
      .style("stroke", "#2c3e50")
      .style("stroke-width", "3px")
      .style("stroke-dasharray", function() { return this.getTotalLength(); })
      .style("stroke-dashoffset", function() { return this.getTotalLength(); })
      .transition()
      .duration(1000)
      .delay(500)
      .style("stroke-dashoffset", 0);
    
    // Add dotted line at the top of the funnel
    const dottedTopLine = `M${centerX - funnelWidth/2},${funnelTopY} 
                          L${centerX + funnelWidth/2},${funnelTopY}`;
    
    hourglass.append("path")
      .attr("class", "funnel-top-line")
      .attr("d", dottedTopLine)
      .style("fill", "none")
      .style("stroke", "#2c3e50")
      .style("stroke-width", "2px")
      .style("stroke-dasharray", "5,5") // This creates the dotted line effect
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay(1000)
      .style("opacity", 1);
    
    // Draw bottom funnel
    const bottomFunnelPath = `M${centerX - funnelBottomWidth/2},${funnelMiddleY} 
                             L${centerX + funnelBottomWidth/2},${funnelMiddleY} 
                             L${centerX + funnelWidth/2 * 0.6},${funnelBottomY} 
                             L${centerX - funnelWidth/2 * 0.6},${funnelBottomY} Z`;
    
    hourglass.append("path")
      .attr("class", "funnel-bottom")
      .attr("d", bottomFunnelPath)
      .style("fill", "none")
      .style("stroke", "#2c3e50")
      .style("stroke-width", "3px")
      .style("stroke-dasharray", function() { return this.getTotalLength(); })
      .style("stroke-dashoffset", function() { return this.getTotalLength(); })
      .transition()
      .duration(1200)
      .delay(1500)
      .style("stroke-dashoffset", 0);
    
    // Create hourglass balls (exactly the same number and color distribution as grid balls)
    this.hourglassBalls = [];
    const ballRadius = this.gridBallRadius; // Same size as grid balls
    
    // Create balls and assign colors based on percentages
    let ballsCreated = 0;
    let ballId = 0;
    
    for (const range of this.ratingRanges) {
      const ballsInRange = Math.round(this.numBalls * (range.percent / 100));
      
      for (let i = 0; i < ballsInRange && ballsCreated < this.numBalls; i++) {
        // Position balls above the funnel in a randomized cloud
        // Distribute them better horizontally and with a wide range of heights
        const xOffset = (Math.random() - 0.5) * (funnelWidth * 0.8);
        
        // Distribute balls at different heights to avoid all being stuck at top
        // -50 to -250 means they start at different heights above the funnel
        const yOffset = -50 - Math.random() * 200;
        
        this.hourglassBalls.push({
          id: ballId++,
          radius: ballRadius,
          x: centerX + xOffset,
          y: funnelTopY + yOffset,
          // Give balls initial velocity to help them move
          vx: (Math.random() - 0.5) * 0.5, // Small random horizontal velocity
          vy: Math.random() * 1.2, // Small initial downward velocity
          color: range.color,
          initialColor: range.color,
          currentColor: "#cccccc", // Initially light gray
          range: range.range,
          settled: false
        });
        
        ballsCreated++;
      }
    }
    
    // Ensure all 100 balls are created (handle rounding issues)
    while (ballsCreated < this.numBalls) {
      const xOffset = (Math.random() - 0.5) * (funnelWidth * 0.8);
      const yOffset = -50 - Math.random() * 200; // Different heights
      
      this.hourglassBalls.push({
        id: ballId++,
        radius: ballRadius,
        x: centerX + xOffset,
        y: funnelTopY + yOffset,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 1.2,
        color: this.ratingRanges[this.ratingRanges.length - 1].color,
        initialColor: this.ratingRanges[this.ratingRanges.length - 1].color,
        currentColor: "#cccccc", // Initially light gray
        range: this.ratingRanges[this.ratingRanges.length - 1].range,
        settled: false
      });
      
      ballsCreated++;
    }
    
    // Create a group for the zones
    this.zonesGroup = hourglass.append("g").attr("class", "zones-group");
    
    // Create balls in the SVG with delayed appearance
    this.hourglassBallElements = hourglass.selectAll(".hourglass-ball")
      .data(this.hourglassBalls)
      .enter()
      .append("circle")
      .attr("class", "hourglass-ball")
      .attr("r", 0) // Start with radius 0
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("fill", d => d.currentColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .transition() // Add transition
      .duration(800)
      .delay(2000 + (d, i) => i * 10) // Stagger the animation after funnel is drawn
      .attr("r", d => d.radius); // Grow to full radius
    
    // Calculate physics properties for funnel walls
    this.setupHourglassPhysics();
    
    this.hourglassInitialized = true;
    
    // Make explanation and legend visible with delay
    setTimeout(() => {
      const explanation = document.getElementById('chess-explanation-hourglass');
      const legend = document.getElementById('hourglass-legend');
      
      if (explanation) explanation.classList.add('visible');
      if (legend) legend.classList.add('visible');
    }, 2500);
  }
  
  setupHourglassPhysics() {
    const { centerX, funnelTopY, funnelWidth, funnelMiddleY, funnelBottomWidth } = this.funnelParams;
    
    // Calculate wall properties for collision detection
    this.topLeftWall = {
      x1: centerX - funnelWidth/2,
      y1: funnelTopY,
      x2: centerX - funnelBottomWidth/2,
      y2: funnelMiddleY,
      slope: (funnelMiddleY - funnelTopY) / ((centerX - funnelBottomWidth/2) - (centerX - funnelWidth/2))
    };
    
    this.topLeftWall.intercept = this.topLeftWall.y1 - this.topLeftWall.slope * this.topLeftWall.x1;
    this.topLeftWall.normalVec = { 
      x: -this.topLeftWall.slope / Math.sqrt(1 + this.topLeftWall.slope * this.topLeftWall.slope), 
      y: 1 / Math.sqrt(1 + this.topLeftWall.slope * this.topLeftWall.slope)
    };
    
    this.topRightWall = {
      x1: centerX + funnelWidth/2,
      y1: funnelTopY,
      x2: centerX + funnelBottomWidth/2,
      y2: funnelMiddleY,
      slope: (funnelMiddleY - funnelTopY) / ((centerX + funnelBottomWidth/2) - (centerX + funnelWidth/2))
    };
    
    this.topRightWall.intercept = this.topRightWall.y1 - this.topRightWall.slope * this.topRightWall.x1;
    this.topRightWall.normalVec = { 
      x: this.topRightWall.slope / Math.sqrt(1 + this.topRightWall.slope * this.topRightWall.slope), 
      y: 1 / Math.sqrt(1 + this.topRightWall.slope * this.topRightWall.slope)
    };
  }
  
  startHourglassAnimation() {
    console.log("Starting hourglass animation");
    this.simulationRunning = true;
    this.settledBalls = 0;
    
    // Start animation with a short delay
    setTimeout(() => {
      // Track when the simulation starts
      this.simulationStartTime = Date.now();
      
      // Create D3 force simulation
      this.simulation = d3.forceSimulation(this.hourglassBalls)
        .alphaTarget(0)
        .alphaDecay(0.01)
        .velocityDecay(0.35);
      
      this.simulation
        .force("gravity", this.gravityForce.bind(this))
        .force("funnel", this.funnelForce.bind(this))
        .force("collide", d3.forceCollide().radius(d => d.radius).strength(1).iterations(3))
        .on("tick", this.simulationTick.bind(this))
        .on("end", this.onSimulationEnd.bind(this));
        
      // Start the simulation
      this.simulation.restart();
    }, 500);
  }
  
  // Improved gravity force with faster ramp up
  gravityForce(alpha) {
    // Start with gentle gravity that increases over time
    const elapsedTime = Date.now() - (this.simulationStartTime || Date.now());
    const gravityFactor = Math.min(1.5, 0.5 + elapsedTime / 2000); // Ramp up quicker and stronger
    
    for (let i = 0; i < this.hourglassBalls.length; i++) {
      // Apply progressively stronger gravity
      this.hourglassBalls[i].vy += this.GRAVITY * gravityFactor;
      
      // Apply slight damping to prevent excessive oscillation
      this.hourglassBalls[i].vy *= 0.99;
      this.hourglassBalls[i].vx *= 0.99;
    }
  }
  
  // Improved funnel force with better handling of stuck balls
  funnelForce(alpha) {
    const { funnelTopY, funnelMiddleY, funnelBottomY } = this.funnelParams;
    
    for (let i = 0; i < this.hourglassBalls.length; i++) {
      const ball = this.hourglassBalls[i];
      
      // Top funnel collisions
      if (ball.y >= funnelTopY - ball.radius && ball.y <= funnelMiddleY) {
        const leftWallX = (ball.y - this.topLeftWall.intercept) / this.topLeftWall.slope;
        const rightWallX = (ball.y - this.topRightWall.intercept) / this.topRightWall.slope;
        
        // Left wall collision
        if (ball.x - ball.radius < leftWallX) {
          // Push ball away from wall
          ball.x = leftWallX + ball.radius;
          
          // Calculate reflection vector
          const dotProduct = ball.vx * this.topLeftWall.normalVec.x + ball.vy * this.topLeftWall.normalVec.y;
          ball.vx = this.FRICTION * (ball.vx - 2 * dotProduct * this.topLeftWall.normalVec.x);
          ball.vy = this.FRICTION * (ball.vy - 2 * dotProduct * this.topLeftWall.normalVec.y);
          
          // Apply additional dampening
          ball.vx *= this.FRICTION;
        }
        
        // Right wall collision
        if (ball.x + ball.radius > rightWallX) {
          // Push ball away from wall
          ball.x = rightWallX - ball.radius;
          
          // Calculate reflection vector
          const dotProduct = ball.vx * this.topRightWall.normalVec.x + ball.vy * this.topRightWall.normalVec.y;
          ball.vx = this.FRICTION * (ball.vx - 2 * dotProduct * this.topRightWall.normalVec.x);
          ball.vy = this.FRICTION * (ball.vy - 2 * dotProduct * this.topRightWall.normalVec.y);
          
          // Apply additional dampening
          ball.vx *= this.FRICTION;
        }
      }
      
      // Middle barrier
      if (ball.y + ball.radius > funnelMiddleY) {
        ball.y = funnelMiddleY - ball.radius;
        ball.vy = -ball.vy * this.RESTITUTION;
        ball.vx *= this.FRICTION;
        
        // Check if ball is almost stopped at the middle
        if (Math.abs(ball.vy) < 0.1 && Math.abs(ball.vx) < 0.1 && !ball.settled) {
          ball.settled = true;
          this.settledBalls++;
          
          // If all balls have settled, finalize the visualization
          if (this.settledBalls === this.numBalls) {
            setTimeout(() => {
              this.simulation.stop();
              this.simulationRunning = false;
              this.finalizeVisualization();
            }, 500);
          }
        }
      }
      
      // Side walls collision (screen boundaries)
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * this.RESTITUTION;
      } else if (ball.x + ball.radius > this.hourglassWidth) {
        ball.x = this.hourglassWidth - ball.radius;
        ball.vx = -ball.vx * this.RESTITUTION;
      }
      
      // Improved top screen boundary handling - unstick balls
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        
        // If the ball is moving very slowly upward or not moving, give it a downward boost
        if (ball.vy > -0.5) {
          ball.vy = 1.0; // Give it a stronger downward push
        } else {
          ball.vy = -ball.vy * this.RESTITUTION;
        }
        
        // Add slight horizontal movement to help unstick balls
        if (Math.abs(ball.vx) < 0.1) {
          ball.vx = (Math.random() - 0.5) * 0.8;
        }
      }
      
      // Additional fix for balls stuck above the funnel for too long
      if (this.simulationStartTime && Date.now() - this.simulationStartTime > 5000) {
        // After 5 seconds, apply stronger gravity to any balls still high up
        if (ball.y < funnelTopY - 50) {
          ball.vy += this.GRAVITY * 1.5; // Extra gravity for stragglers
        }
      }
    }
  }
  
  simulationTick() {
    this.hourglassBallElements
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
  
  onSimulationEnd() {
    console.log("Simulation ended");
    this.simulationRunning = false;
    this.finalizeVisualization();
  }
  
  finalizeVisualization() {
    console.log("Finalizing visualization");
    
    // Create colored zones
    this.createFunnelZones();
    
    // Assign colors based on final positions
    this.assignColorsBasedOnPosition();
  }
  
  createFunnelZones() {
    console.log("Creating colored funnel zones");
    const { centerX, funnelTopY, funnelWidth, funnelMiddleY, funnelBottomWidth } = this.funnelParams;
    
    // Sort balls by y-position (top to bottom)
    const sortedBalls = [...this.hourglassBalls].sort((a, b) => a.y - b.y);
    
    // Calculate zone positions based on percentiles
    let cumulativePercent = 0;
    const zones = [];
    let prevY = funnelTopY;
    
    this.ratingRanges.forEach((range, i) => {
      cumulativePercent += range.percent;
      let nextY;
      
      if (i < this.ratingRanges.length - 1) {
        // Find the ball at this percentile
        const ballIndex = Math.floor((cumulativePercent / 100) * sortedBalls.length) - 1;
        if (ballIndex >= 0) {
          const ball = sortedBalls[ballIndex];
          nextY = ball.y;
        } else {
          nextY = prevY + (funnelMiddleY - funnelTopY) * (range.percent / 100);
        }
      } else {
        nextY = funnelMiddleY;
      }
      
      // Calculate left and right X coordinates for top and bottom of zone
      const topLeftX = (prevY - this.topLeftWall.intercept) / this.topLeftWall.slope;
      const topRightX = (prevY - this.topRightWall.intercept) / this.topRightWall.slope;
      const bottomLeftX = (nextY - this.topLeftWall.intercept) / this.topLeftWall.slope;
      const bottomRightX = (nextY - this.topRightWall.intercept) / this.topRightWall.slope;
      
      zones.push({
        color: range.color,
        path: `M${topLeftX},${prevY} 
               L${topRightX},${prevY} 
               L${bottomRightX},${nextY} 
               L${bottomLeftX},${nextY} Z`
      });
      
      prevY = nextY;
    });
    
    // Clear any existing zones
    this.zonesGroup.selectAll("*").remove();
    
    // Add colored zones to the funnel
    zones.forEach((zone, i) => {
      this.zonesGroup.append("path")
        .attr("class", "funnel-zone")
        .attr("d", zone.path)
        .style("fill", zone.color)
        .style("stroke", zone.color)
        .style("stroke-width", "1px")
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay(i * 200) // Staggered animation
        .style("opacity", 0.4);
    });
  }
  
  assignColorsBasedOnPosition() {
    console.log("Assigning colors based on final positions");
    
    // Sort balls by y-position (top to bottom)
    const sortedBalls = [...this.hourglassBalls].sort((a, b) => a.y - b.y);
    
    // Assign colors based on percentiles
    let ballsProcessed = 0;
    
    for (const range of this.ratingRanges) {
      const ballsInRange = Math.round(this.numBalls * (range.percent / 100));
      
      for (let i = 0; i < ballsInRange && ballsProcessed < sortedBalls.length; i++) {
        sortedBalls[ballsProcessed].currentColor = range.color;
        ballsProcessed++;
      }
    }
    
    // Ensure all balls get colored (in case of rounding issues)
    while (ballsProcessed < sortedBalls.length) {
      sortedBalls[ballsProcessed].currentColor = this.ratingRanges[this.ratingRanges.length - 1].color;
      ballsProcessed++;
    }
    
    // Update the ball colors with transition
    this.hourglassBallElements
      .transition()
      .duration(1200)
      .delay((d, i) => i * 10) // Staggered animation
      .attr("fill", d => d.currentColor);
  }
  
  handleResize() {
    // Update dimensions
    this.updateDimensions();
    
    // Redraw grid if initialized
    if (this.gridInitialized) {
      // Clear grid
      d3.select("#grid-svg").selectAll("*").remove();
      this.gridInitialized = false;
      this.initializeGrid();
    }
    
    // Redraw hourglass if initialized
    if (this.hourglassInitialized) {
      // Clear hourglass
      d3.select("#hourglass-svg").selectAll("*").remove();
      this.hourglassInitialized = false;
      this.initializeHourglass();
    }
  }
}

// Initialize the visualization when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing visualization");
  
  // Initialize visualization
  window.chessVis = new ChessRatingVisualization();
  
  // Setup to reinitialize grid when scrolling to its section
  document.addEventListener('fullpage_afterLoad', function(event) {
    const section = event.detail.destination.anchor;
    
    if (section === 'grid' && window.chessVis && !window.chessVis.gridInitialized) {
      window.chessVis.initializeGrid();
    }
    
    if (section === 'hourglass' && window.chessVis) {
      if (!window.chessVis.hourglassInitialized) {
        window.chessVis.initializeHourglass();
      }
      
      if (!window.chessVis.simulationRunning) {
        window.chessVis.startHourglassAnimation();
      }
    }
  });
});