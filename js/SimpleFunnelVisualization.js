/**
 * SimpleFunnelVisualization.js
 * A reliable funnel visualization using Matter.js with fallback options
 */

ChessVis.SimpleFunnelVisualization = class extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.ballCount = options.ballCount || 100;
    this.ballRadius = options.ballRadius || 6;
    this.funnelTopWidth = options.funnelTopWidth || 0.6;
    this.animationSpeed = options.animationSpeed || 1;
    
    // State
    this.balls = [];
    this.simulationRunning = false;
    this.engine = null;
    this.world = null;
    this.walls = [];
    this.matterBalls = [];
    this.initAttempts = 0;
    this.maxInitAttempts = 3;
    
    // DOM Elements
    this.svg = null;
    this.container = null;
    
    // Color scale for monochromatic scheme - using the original colors from the screenshot
    this.colors = [
      "#0072B2", // Dark blue
      "#56B4E9", // Light blue
      "#F0E442", // Yellow
      "#E69F00", // Orange
      "#D55E00"  // Red-orange
    ];
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.createFunnel = this.createFunnel.bind(this);
    this.createBalls = this.createBalls.bind(this);
    this.startSimulation = this.startSimulation.bind(this);
    this.updateBallPositions = this.updateBallPositions.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.ensureProperDimensions = this.ensureProperDimensions.bind(this);
    this.createFallbackVisualization = this.createFallbackVisualization.bind(this);
    this.assignColorsAfterSettled = this.assignColorsAfterSettled.bind(this);
    this.zoomIntoLowestBalls = this.zoomIntoLowestBalls.bind(this);
  }
  
  initialize() {
    console.log('Initializing SimpleFunnelVisualization');
    
    // Get container
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error('Container not found:', this.containerId);
      return false;
    }
    
    // Make sure the container is visible and has dimensions
    this.container.style.display = 'block';
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create SVG
    this.svg = d3.select('#' + this.containerId)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Ensure we have proper dimensions before proceeding
    this.ensureProperDimensions();
    
    // Setup Matter.js
    this.loadMatterJs()
      .then(() => {
        this.setupMatterJs();
      })
      .catch(error => {
        console.error('Failed to load Matter.js, using fallback:', error);
        this.createFallbackVisualization();
      });
    
    return true;
  }
  
  ensureProperDimensions() {
    // Make sure we can get dimensions - if the container is hidden, this might fail
    this.updateDimensions();
    
    // If dimensions are zero, try to set some default dimensions
    if (this.width <= 0 || this.height <= 0) {
      console.warn('Container has no dimensions, setting defaults');
      this.width = 800;
      this.height = 600;
      
      // Try to set container dimensions if possible
      this.container.style.width = this.width + 'px';
      this.container.style.height = this.height + 'px';
      
      // Update SVG viewBox
      this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
    }
  }
  
  loadMatterJs() {
    return new Promise((resolve, reject) => {
      // If Matter.js is already loaded
      if (window.Matter) {
        resolve();
        return;
      }
      
      // Try loading Matter.js
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Matter.js loaded successfully');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Matter.js:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }
  
  setupMatterJs() {
    console.log('Setting up Matter.js for funnel');
    
    // Extract Matter.js modules
    const Engine = Matter.Engine;
    const World = Matter.World;
    
    // Create engine
    this.engine = Engine.create({
      gravity: { x: 0, y: 0.5 * this.animationSpeed }
    });
    
    this.world = this.engine.world;
    
    // Create funnel walls
    this.createFunnel();
    
    // Create balls
    this.createBalls();
    
    // Start the simulation automatically
    this.startSimulation();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }
  
  createFallbackVisualization() {
    console.log('Creating fallback visualization');
    
    // Clear previous content
    this.svg.selectAll('*').remove();
    
    // Draw simple funnel without physics
    const width = this.width;
    const height = this.height;
    
    // Funnel parameters
    const funnelHeight = height * 0.7;
    const funnelCenterX = width / 2;
    const funnelTopY = height * 0.1;
    const funnelTopWidth = width * this.funnelTopWidth;
    const funnelBottomWidth = width * 0.05;
    const funnelBottomY = funnelTopY + funnelHeight;
    
    // Calculate positions for walls
    const leftWallX1 = funnelCenterX - funnelTopWidth / 2;
    const leftWallY1 = funnelTopY;
    const leftWallX2 = funnelCenterX - funnelBottomWidth / 2;
    const leftWallY2 = funnelBottomY;
    
    const rightWallX1 = funnelCenterX + funnelTopWidth / 2;
    const rightWallY1 = funnelTopY;
    const rightWallX2 = funnelCenterX + funnelBottomWidth / 2;
    const rightWallY2 = funnelBottomY;
    
    // Draw walls
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', leftWallX1)
      .attr('y1', leftWallY1)
      .attr('x2', leftWallX2)
      .attr('y2', leftWallY2)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', rightWallX1)
      .attr('y1', rightWallY1)
      .attr('x2', rightWallX2)
      .attr('y2', rightWallY2)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', leftWallX1)
      .attr('y1', leftWallY1)
      .attr('x2', rightWallX1)
      .attr('y2', rightWallY1)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');
    
    // Create static circles to represent the distribution
    const distribution = this.generateDistribution(60);
    distribution.sort((a, b) => {
      const aIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === a.range);
      const bIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === b.range);
      return aIndex - bIndex;
    });
    
    // Create grid for positioning
    const gridCols = 8;
    const gridRows = Math.ceil(60 / gridCols);
    const cellWidth = funnelTopWidth * 0.8 / gridCols;
    const cellHeight = funnelHeight * 0.7 / gridRows;
    
    // Create circles in a grid pattern
    distribution.forEach((item, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      
      const x = funnelCenterX - (funnelTopWidth * 0.8 / 2) + (col + 0.5) * cellWidth;
      const y = funnelTopY + 50 + row * cellHeight;
      
      // Determine color based on rating range
      const rangeIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === item.range);
      const color = this.colors[rangeIndex] || '#333';
      
      this.svg.append('circle')
        .attr('class', 'ball')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', this.ballRadius)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    });
    
    // Store funnel dimensions for later use
    this.funnelDimensions = {
      centerX: funnelCenterX,
      topY: funnelTopY,
      bottomY: funnelBottomY,
      topWidth: funnelTopWidth,
      bottomWidth: funnelBottomWidth,
      height: funnelHeight
    };
  }
  
  createFunnel() {
    const Bodies = Matter.Bodies;
    const World = Matter.World;
    
    // Clear previous walls
    if (this.walls.length > 0) {
      World.remove(this.world, this.walls);
      this.walls = [];
    }
    
    // Get dimensions
    const width = this.width;
    const height = this.height;
    
    // Funnel parameters
    const funnelHeight = height * 0.7;
    const funnelCenterX = width / 2;
    const funnelTopY = height * 0.1;
    const funnelTopWidth = width * this.funnelTopWidth;
    const funnelBottomWidth = width * 0.05;
    const funnelBottomY = funnelTopY + funnelHeight;
    
    // Calculate positions for walls
    const leftWallX1 = funnelCenterX - funnelTopWidth / 2;
    const leftWallY1 = funnelTopY;
    const leftWallX2 = funnelCenterX - funnelBottomWidth / 2;
    const leftWallY2 = funnelBottomY;
    
    const rightWallX1 = funnelCenterX + funnelTopWidth / 2;
    const rightWallY1 = funnelTopY;
    const rightWallX2 = funnelCenterX + funnelBottomWidth / 2;
    const rightWallY2 = funnelBottomY;
    
    // Calculate wall lengths and angles
    const leftWallLength = Math.sqrt(
      Math.pow(leftWallX2 - leftWallX1, 2) + 
      Math.pow(leftWallY2 - leftWallY1, 2)
    );
    
    const rightWallLength = Math.sqrt(
      Math.pow(rightWallX2 - rightWallX1, 2) + 
      Math.pow(rightWallY2 - rightWallY1, 2)
    );
    
    const leftWallAngle = Math.atan2(
      leftWallY2 - leftWallY1,
      leftWallX2 - leftWallX1
    );
    
    const rightWallAngle = Math.atan2(
      rightWallY2 - rightWallY1,
      rightWallX2 - rightWallX1
    );
    
    // Create wall bodies
    const wallThickness = 20;
    
    // Left wall
    const leftWall = Bodies.rectangle(
      (leftWallX1 + leftWallX2) / 2,
      (leftWallY1 + leftWallY2) / 2,
      leftWallLength,
      wallThickness,
      { 
        isStatic: true,
        angle: leftWallAngle,
        friction: 0.1,
        restitution: 0.3
      }
    );
    
    // Right wall
    const rightWall = Bodies.rectangle(
      (rightWallX1 + rightWallX2) / 2,
      (rightWallY1 + rightWallY2) / 2,
      rightWallLength,
      wallThickness,
      { 
        isStatic: true,
        angle: rightWallAngle,
        friction: 0.1,
        restitution: 0.3
      }
    );
    
    // Bottom wall (narrow opening)
    const bottomWall = Bodies.rectangle(
      funnelCenterX,
      funnelBottomY,
      funnelBottomWidth,
      wallThickness,
      {
        isStatic: true,
        friction: 0.1,
        restitution: 0.3
      }
    );
    
    // Add a floor below the funnel
    const floorY = funnelBottomY + 150;
    const floorWidth = width * 0.8;
    const floor = Bodies.rectangle(
      funnelCenterX,
      floorY,
      floorWidth,
      wallThickness,
      {
        isStatic: true,
        friction: 0.1,
        restitution: 0.3
      }
    );

    // Store walls
    this.walls = [leftWall, rightWall, bottomWall, floor];
    
    // Add walls to world
    World.add(this.world, this.walls);
    
    // Draw walls in SVG
    this.svg.selectAll('.wall').remove();
    
    // Draw left wall
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', leftWallX1)
      .attr('y1', leftWallY1)
      .attr('x2', leftWallX2)
      .attr('y2', leftWallY2)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    // Draw right wall
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', rightWallX1)
      .attr('y1', rightWallY1)
      .attr('x2', rightWallX2)
      .attr('y2', rightWallY2)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    // Draw top line (dotted)
    this.svg.append('line')
      .attr('class', 'wall')
      .attr('x1', leftWallX1)
      .attr('y1', leftWallY1)
      .attr('x2', rightWallX1)
      .attr('y2', rightWallY1)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');
    
    // Also add the floor to the SVG visualization
    this.svg.append('line')
      .attr('class', 'wall floor')
      .attr('x1', funnelCenterX - floorWidth/2)
      .attr('y1', floorY)
      .attr('x2', funnelCenterX + floorWidth/2)
      .attr('y2', floorY)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    // Store funnel dimensions for later use
    this.funnelDimensions = {
      centerX: funnelCenterX,
      topY: funnelTopY,
      bottomY: funnelBottomY,
      topWidth: funnelTopWidth,
      bottomWidth: funnelBottomWidth,
      height: funnelHeight
    };
  }
  
  createBalls() {
    const Bodies = Matter.Bodies;
    const World = Matter.World;
    
    // Clear previous balls
    if (this.matterBalls.length > 0) {
      World.remove(this.world, this.matterBalls);
      this.matterBalls = [];
      this.balls = [];
    }
    
    this.svg.selectAll('.ball').remove();
    
    // Generate distribution data
    const distribution = this.generateDistribution(this.ballCount);
    
    // Sort by rating category
    distribution.sort((a, b) => {
      const aIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === a.range);
      const bIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === b.range);
      return aIndex - bIndex;
    });
    
    // Update colors for each rating range
    distribution.forEach((item, i) => {
      const rangeIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === item.range);
      if (rangeIndex >= 0 && rangeIndex < this.colors.length) {
        item.color = this.colors[rangeIndex];
      }
    });
    
    // Calculate grid dimensions
    const gridCols = Math.ceil(Math.sqrt(this.ballCount));
    const gridRows = Math.ceil(this.ballCount / gridCols);
    
    // Position balls above the funnel, off-screen
    const startY = -this.ballRadius * 6; // Start above the visible area
    
    // Create SVG elements first
    const ballElements = this.svg.selectAll('.ball')
      .data(distribution)
      .enter()
      .append('circle')
      .attr('class', 'ball')
      .attr('r', this.ballRadius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
    
    // Create balls and store data
    for (let i = 0; i < this.ballCount; i++) {
      const item = distribution[i];
      
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      
      // Calculate position within the grid
      const gridWidth = this.funnelDimensions.topWidth * 0.8;
      const startX = this.funnelDimensions.centerX - gridWidth / 2 + 
                    (col + 0.5) * (gridWidth / gridCols);
      
      // Position row by row, starting from above the screen
      const y = startY - row * this.ballRadius * 3;
      
      // Create Matter.js ball
      const ball = Bodies.circle(
        startX,
        y,
        this.ballRadius,
        {
          friction: 0.05,
          restitution: 0.3,
          density: 0.001,
          frictionAir: 0.001,
          index: i // Store index for reference
        }
      );
      
      this.matterBalls.push(ball);
      this.balls.push({
        index: i,
        color: item.color,
        range: item.range,
        element: ballElements.nodes()[i]
      });
    }
    
    // Add all balls to the world
    World.add(this.world, this.matterBalls);
  }
  
  startSimulation() {
    if (this.simulationRunning) return;
    
    console.log('Starting funnel simulation');
    this.simulationRunning = true;
    
    // Start animation loop
    this.updateBallPositions();
    
    // Run physics engine
    Matter.Runner.run(Matter.Runner.create(), this.engine);
    
    // Call our new method to assign colors after balls settle
    this.assignColorsAfterSettled();
  }
  
  updateBallPositions() {
    if (!this.simulationRunning) return;
    
    // Update SVG ball positions from Matter.js
    for (let i = 0; i < this.matterBalls.length; i++) {
      const ball = this.matterBalls[i];
      const index = ball.index !== undefined ? ball.index : i;
      
      if (index < this.balls.length) {
        const element = this.balls[index].element;
        if (element) {
          // Update position
          element.setAttribute('cx', ball.position.x);
          element.setAttribute('cy', ball.position.y);
        }
      }
    }
    
    // Continue animation
    this.animationFrame = requestAnimationFrame(this.updateBallPositions.bind(this));
    
    // Check for balls that have fallen out of view and reset them
    this.resetFallenBalls();
  }
  
  resetFallenBalls() {
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    
    // Bottom boundary
    const bottomY = this.height + this.ballRadius * 2;
    
    // Check each ball
    for (let i = 0; i < this.matterBalls.length; i++) {
      const ball = this.matterBalls[i];
      
      // If ball has fallen below the bottom of the screen
      if (ball.position.y > bottomY) {
        // Calculate new position above the funnel
        const randomX = this.funnelDimensions.centerX + 
                      (Math.random() - 0.5) * this.funnelDimensions.topWidth * 0.8;
        
        // Remove old ball from world
        World.remove(this.world, ball);
        
        // Create new ball
        const newBall = Bodies.circle(
          randomX,
          -this.ballRadius * 2,
          this.ballRadius,
          {
            friction: 0.05,
            restitution: 0.3,
            density: 0.001,
            frictionAir: 0.001,
            index: ball.index
          }
        );
        
        // Replace in array
        this.matterBalls[i] = newBall;
        
        // Add to world
        World.add(this.world, newBall);
      }
    }
  }
  
  assignColorsAfterSettled() {
    // First make all balls gray
    for (let i = 0; i < this.balls.length; i++) {
      const element = this.balls[i].element;
      if (element) {
        element.setAttribute('fill', '#aaaaaa');
      }
    }

    // Set a timer to assign colors after the balls have settled
    setTimeout(() => {
      // Sort balls by vertical position (y-coordinate)
      const sortedBalls = [...this.matterBalls].sort((a, b) => a.position.y - b.position.y);
      
      // Get the lowest 2 balls (highest y-value)
      const lowestBalls = sortedBalls.slice(-2);
      const lowestBallIndices = lowestBalls.map(ball => ball.index);
      
      // Color the lowest 2 balls with the highest rating color (2300+)
      const highestRatingColor = this.colors[4]; // Red-orange for 2300+
      
      // Find the corresponding SVG elements and update their colors
      for (let i = 0; i < this.balls.length; i++) {
        const element = this.balls[i].element;
        if (element) {
          if (lowestBallIndices.includes(i)) {
            // Color the 2 lowest balls with highest rating color
            element.setAttribute('fill', highestRatingColor);
            this.balls[i].specialBall = true; // Mark these balls as special
          } else {
            // For other balls, assign colors based on their relative positions
            const ballCount = sortedBalls.length;
            const ballIndex = sortedBalls.findIndex(ball => ball.index === i);
            
            // Calculate which quintile this ball falls into
            const quintile = Math.floor((ballIndex / ballCount) * 5);
            
            // Assign color based on quintile, from lowest to highest
            const color = this.colors[4 - quintile] || this.colors[0];
            element.setAttribute('fill', color);
            this.balls[i].specialBall = false;
          }
        }
      }
      
      // Trigger the next phase after a short delay
      setTimeout(() => {
        this.zoomIntoLowestBalls(lowestBalls);
      }, 2000);
    }, 5000); // Wait 5 seconds for balls to settle
  }
  
  zoomIntoLowestBalls(lowestBalls) {
    // Hide all balls except the lowest 2
    for (let i = 0; i < this.balls.length; i++) {
      const element = this.balls[i].element;
      if (element && !this.balls[i].specialBall) {
        // Fade out non-special balls
        d3.select(element)
          .transition()
          .duration(1000)
          .attr('r', 0)
          .style('opacity', 0);
      }
    }
    
    // Hide legend and explanation
    d3.select('#hourglass-legend')
      .transition()
      .duration(800)
      .style('opacity', 0);
    
    d3.select('#chess-explanation-hourglass')
      .transition()
      .duration(800)
      .style('opacity', 0);
    
    // Calculate the center point between the two lowest balls
    const ball1 = lowestBalls[0];
    const ball2 = lowestBalls[1];
    
    const centerX = (ball1.position.x + ball2.position.x) / 2;
    const centerY = (ball1.position.y + ball2.position.y) / 2;
    
    // Calculate the zoom scale (make the balls appear larger)
    const zoomScale = 3;
    
    // Calculate the new viewBox parameters to zoom in
    const viewBoxWidth = this.width / zoomScale;
    const viewBoxHeight = this.height / zoomScale;
    const viewBoxX = centerX - viewBoxWidth / 2;
    const viewBoxY = centerY - viewBoxHeight / 2;
    
    // Zoom in with a smooth transition
    d3.select(this.svg.node())
      .transition()
      .duration(1500)
      .attr('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    
    // Enhance the appearance of the special balls
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i].specialBall) {
        const element = this.balls[i].element;
        if (element) {
          // Make the special balls glow
          d3.select(element)
            .transition()
            .duration(1000)
            .attr('r', this.ballRadius * 1.5)
            .style('stroke-width', 3)
            .style('stroke', '#fff')
            .style('filter', 'url(#glow-filter)');
        }
      }
    }
    
    // Add a glow filter
    const defs = this.svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow-filter')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '5')
      .attr('result', 'blur');
    
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');
  }
  
  handleResize() {
    // Get new dimensions
    this.updateDimensions();
    
    // If using Matter.js, recreate the funnel
    if (this.world) {
      this.createFunnel();
      
      // If simulation was running, restart it
      if (this.simulationRunning) {
        this.createBalls();
      }
    } else {
      // If using fallback, recreate it
      this.createFallbackVisualization();
    }
  }
  
  // Override resize method
  resize() {
    this.handleResize();
  }
  
  // Override update method - always ensure simulation is running
  update() {
    if (this.world && !this.simulationRunning) {
      this.startSimulation();
    }
  }
};