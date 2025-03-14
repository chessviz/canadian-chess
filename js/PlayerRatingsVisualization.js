/**
 * PlayerRatingsVisualization.js
 * Creates a time series chart comparing the rating progression of two chess players
 */

class PlayerRatingsVisualization extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.player1Id = options.player1Id || "167084"; // Aaron Reeve Mendes
    this.player2Id = options.player2Id || "132534"; // Nikolay Noritsyn
    this.player1Name = options.player1Name || "Aaron Reeve Mendes";
    this.player2Name = options.player2Name || "Nikolay Noritsyn";
    this.player1Color = options.player1Color || "#0072B2"; // Blue
    this.player2Color = options.player2Color || "#D55E00"; // Red-orange
    this.minRating = options.minRating || 800;
    this.maxRating = options.maxRating || 2800;
    this.dataPath1 = options.dataPath1 || `data/rating_histories/rating_history_${this.player1Id}.csv`;
    this.dataPath2 = options.dataPath2 || `data/rating_histories/rating_history_${this.player2Id}.csv`;
    this.margin = options.margin || {top: 40, right: 80, bottom: 60, left: 80};
    this.contextHeight = options.contextHeight || 120; // Increased from 100
    this.contextMargin = options.contextMargin || {top: 20, right: 80, bottom: 30, left: 80};
    
    // Override height if provided directly
    if (options.height) {
      this.height = options.height;
    }
    
    // State
    this.player1Data = [];
    this.player2Data = [];
    this.allData = [];
    this.timeDomain = [];
    this.currentDomain = null;
    this.loaded = false;
    this.brushed = false;
    
    // Chart elements
    this.mainGroup = null;
    this.contextGroup = null;
    this.xScale = null;
    this.yScale = null;
    this.xScaleContext = null;
    this.yScaleContext = null;
    this.xAxis = null;
    this.yAxis = null;
    this.brush = null;
    this.tooltip = null;
    this.resetButton = null;
    
    // Bind methods
    this.loadData = this.loadData.bind(this);
    this.processData = this.processData.bind(this);
    this.createChart = this.createChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.createMainChart = this.createMainChart.bind(this);
    this.createContextChart = this.createContextChart.bind(this);
    this.handleBrush = this.handleBrush.bind(this);
    this.handleResetZoom = this.handleResetZoom.bind(this);
  }
  
  initialize() {
    if (!super.initialize()) return false;
    
    // Load data
    this.loadData();
    
    // Create tooltip
    this.tooltip = this.createTooltip();
    
    // Create reset button if it doesn't exist
    if (!this.resetButton) {
      this.resetButton = document.getElementById('resetZoom');
      if (!this.resetButton) {
        this.resetButton = document.createElement('button');
        this.resetButton.id = 'resetZoom';
        this.resetButton.className = 'btn btn-secondary mt-3';
        this.resetButton.textContent = 'Reset Zoom';
        this.resetButton.disabled = true;
        this.container.appendChild(this.resetButton);
      }
      
      // Add click handler
      this.resetButton.addEventListener('click', this.handleResetZoom);
    }
    
    return true;
  }
  
  // Load the player rating data
  loadData() {
    // Show loading indicator
    this.svg.append('text')
      .attr('class', 'loading-text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .text('Loading player data...');
    
    // Load both datasets
    Promise.all([
      d3.csv(this.dataPath1),
      d3.csv(this.dataPath2)
    ]).then(data => {
      // Process the data
      this.player1Data = this.processData(data[0], this.player1Id);
      this.player2Data = this.processData(data[1], this.player2Id);
      
      // Combine for domain calculations
      this.allData = [...this.player1Data, ...this.player2Data];
      
      // Calculate time domain
      this.timeDomain = [
        d3.min(this.allData, d => d.eventDate),
        d3.max(this.allData, d => d.eventDate)
      ];
      
      // Set current domain to full range
      this.currentDomain = [...this.timeDomain];
      
      // Create chart
      this.createChart();
      
      this.loaded = true;
    }).catch(error => {
      console.error('Error loading player rating data:', error);
      
      // Show error message
      this.svg.select('.loading-text').remove();
      this.svg.append('text')
        .attr('class', 'error-text')
        .attr('x', this.width / 2)
        .attr('y', this.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .text('Error loading player data. Please try again.');
    });
  }
  
  // Process raw CSV data
  processData(data, playerId) {
    return data.map(d => {
      return {
        eventId: d.eventId,
        eventDate: new Date(d.eventDate),
        eventName: d.eventName || 'Unknown Event',
        eventLocation: d.eventLocation || 'Unknown Location',
        score: d.score || '',
        ratingPerf: +d.ratingPerf || 0,
        ratingPost: +d.ratingPost || 0,
        playerId: playerId
      };
    }).filter(d => !isNaN(d.ratingPost) && d.ratingPost > 0)
      .sort((a, b) => a.eventDate - b.eventDate);
  }
  
  // Create the main chart
  createChart() {
    if (!this.loaded && this.allData.length === 0) return;
    
    // Remove loading message
    this.svg.select('.loading-text').remove();
    
    // Clear any existing content
    this.svg.selectAll('*').remove();
    
    // Adjust chart height to allow space for context chart
    const chartHeight = this.height - this.contextHeight - this.margin.top - this.margin.bottom;
    
    // Create main chart group
    this.mainGroup = this.svg.append('g')
      .attr('class', 'main-chart')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    
    // Create context chart group
    this.contextGroup = this.svg.append('g')
      .attr('class', 'context-chart')
      .attr('transform', `translate(${this.contextMargin.left},${chartHeight + this.margin.top + this.margin.bottom})`);
    
    // Create scales
    this.xScale = d3.scaleTime()
      .domain(this.currentDomain)
      .range([0, this.width - this.margin.left - this.margin.right]);
    
    // Set y-axis range dynamically based on visible data
    const filteredData = this.allData.filter(d => 
      d.eventDate >= this.currentDomain[0] && d.eventDate <= this.currentDomain[1]
    );
    
    const yMin = Math.max(this.minRating, d3.min(filteredData, d => d.ratingPost) - 50);
    const yMax = Math.min(this.maxRating, d3.max(filteredData, d => d.ratingPost) + 50);
    
    this.yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([chartHeight, 0])
      .nice();
    
    // Create context scales (always showing full range)
    this.xScaleContext = d3.scaleTime()
      .domain(this.timeDomain)
      .range([0, this.width - this.contextMargin.left - this.contextMargin.right]);
    
    this.yScaleContext = d3.scaleLinear()
      .domain([this.minRating, this.maxRating])
      .range([this.contextHeight - this.contextMargin.top - this.contextMargin.bottom, 0]);
    
    // Create main chart
    this.createMainChart(chartHeight);
    
    // Create context chart
    this.createContextChart();
  }
  
  // Create the main chart components
  createMainChart(chartHeight) {
    const width = this.width - this.margin.left - this.margin.right;
    
    // Create grid lines
    this.mainGroup.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(this.xScale)
        .tickSize(-chartHeight)
        .tickFormat('')
      );
    
    this.mainGroup.append('g')
      .attr('class', 'grid y-grid')
      .call(d3.axisLeft(this.yScale)
        .tickSize(-width)
        .tickFormat('')
      );
    
    // Create axes
    this.xAxis = this.mainGroup.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(this.xScale)
        .ticks(10)
        .tickFormat(d3.timeFormat('%Y-%m'))
      );
    
    this.yAxis = this.mainGroup.append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(this.yScale));
    
    // Add axis labels
    this.mainGroup.append('text')
      .attr('class', 'axis-label x-label')
      .attr('x', width / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .text('Date');
    
    this.mainGroup.append('text')
      .attr('class', 'axis-label y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .text('Rating');
    
    // Create line generator
    const line = d3.line()
      .x(d => this.xScale(d.eventDate))
      .y(d => this.yScale(d.ratingPost))
      .curve(d3.curveMonotoneX);
    
    // Draw lines
    this.mainGroup.append('path')
      .datum(this.player1Data)
      .attr('class', 'line player1-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.player1Color)
      .attr('stroke-width', 2.5);
    
    this.mainGroup.append('path')
      .datum(this.player2Data)
      .attr('class', 'line player2-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.player2Color)
      .attr('stroke-width', 2.5);
    
    // Add data points
    this.mainGroup.selectAll('.dot-player1')
      .data(this.player1Data)
      .enter()
      .append('circle')
      .attr('class', 'dot dot-player1')
      .attr('cx', d => this.xScale(d.eventDate))
      .attr('cy', d => this.yScale(d.ratingPost))
      .attr('r', 4)
      .attr('fill', this.player1Color)
      .on('mouseover', (event, d) => this.showTooltip(event, d, this.player1Name))
      .on('mouseout', () => this.hideTooltip());
    
    this.mainGroup.selectAll('.dot-player2')
      .data(this.player2Data)
      .enter()
      .append('circle')
      .attr('class', 'dot dot-player2')
      .attr('cx', d => this.xScale(d.eventDate))
      .attr('cy', d => this.yScale(d.ratingPost))
      .attr('r', 4)
      .attr('fill', this.player2Color)
      .on('mouseover', (event, d) => this.showTooltip(event, d, this.player2Name))
      .on('mouseout', () => this.hideTooltip());
    
    // Add legend
    const legend = this.mainGroup.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, 10)`);
    
    // Player 1 legend item
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', this.player1Color);
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .text(this.player1Name);
    
    // Player 2 legend item
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 25)
      .attr('r', 6)
      .attr('fill', this.player2Color);
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 29)
      .text(this.player2Name);
  }
  
  // Create the context chart (small chart below main chart)
  createContextChart() {
    const width = this.width - this.contextMargin.left - this.contextMargin.right;
    const height = this.contextHeight - this.contextMargin.top - this.contextMargin.bottom;
    
    // Create line generator
    const line = d3.line()
      .x(d => this.xScaleContext(d.eventDate))
      .y(d => this.yScaleContext(d.ratingPost))
      .curve(d3.curveMonotoneX);
    
    // Draw context axis
    this.contextGroup.append('g')
      .attr('class', 'axis context-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(this.xScaleContext)
        .tickFormat(d3.timeFormat('%Y'))
        .ticks(6));
    
    // Draw lines
    this.contextGroup.append('path')
      .datum(this.player1Data)
      .attr('class', 'line context-line player1-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.player1Color)
      .attr('stroke-width', 1.5);
    
    this.contextGroup.append('path')
      .datum(this.player2Data)
      .attr('class', 'line context-line player2-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.player2Color)
      .attr('stroke-width', 1.5);
    
    // Add brush for zooming
    this.brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on('end', this.handleBrush);
    
    // Add the brush to the context chart
    this.contextGroup.append('g')
      .attr('class', 'brush')
      .call(this.brush);
    
    // If chart is already zoomed, set brush to match current domain
    if (this.brushed && 
        (this.currentDomain[0] > this.timeDomain[0] || 
         this.currentDomain[1] < this.timeDomain[1])) {
      this.contextGroup.select('.brush').call(
        this.brush.move, 
        [
          this.xScaleContext(this.currentDomain[0]), 
          this.xScaleContext(this.currentDomain[1])
        ]
      );
      
      this.resetButton.disabled = false;
    }
  }
  
  // Handle brush event
  handleBrush(event) {
    if (!event.selection) return;
    
    // Extract the selected time range
    const [x0, x1] = event.selection.map(this.xScaleContext.invert);
    
    // Update current domain
    this.currentDomain = [x0, x1];
    this.brushed = true;
    
    // Enable reset button
    this.resetButton.disabled = false;
    
    // Update chart with new domain
    this.updateChart();
  }
  
  // Handle reset zoom button click
  handleResetZoom() {
    // Reset to full domain
    this.currentDomain = [...this.timeDomain];
    this.brushed = false;
    
    // Disable reset button
    this.resetButton.disabled = true;
    
    // Clear brush selection
    if (this.contextGroup) {
      this.contextGroup.select('.brush').call(this.brush.move, null);
    }
    
    // Update chart
    this.updateChart();
  }
  
  // Update chart with current domain
  updateChart() {
    // Update x scale
    this.xScale.domain(this.currentDomain);
    
    // Set y-axis range dynamically based on visible data
    const filteredData = this.allData.filter(d => 
      d.eventDate >= this.currentDomain[0] && d.eventDate <= this.currentDomain[1]
    );
    
    const yMin = Math.max(this.minRating, d3.min(filteredData, d => d.ratingPost) - 50);
    const yMax = Math.min(this.maxRating, d3.max(filteredData, d => d.ratingPost) + 50);
    
    this.yScale.domain([yMin, yMax]).nice();
    
    // Transition duration
    const duration = 750;
    
    // Update axes
    this.xAxis.transition().duration(duration).call(
      d3.axisBottom(this.xScale)
        .ticks(10)
        .tickFormat(d3.timeFormat('%Y-%m'))
    );
    
    this.yAxis.transition().duration(duration).call(
      d3.axisLeft(this.yScale)
    );
    
    // Update grid lines
    this.mainGroup.select('.x-grid').transition().duration(duration).call(
      d3.axisBottom(this.xScale)
        .tickSize(-this.yScale.range()[0])
        .tickFormat('')
    );
    
    this.mainGroup.select('.y-grid').transition().duration(duration).call(
      d3.axisLeft(this.yScale)
        .tickSize(-(this.width - this.margin.left - this.margin.right))
        .tickFormat('')
    );
    
    // Update line generator
    const line = d3.line()
      .x(d => this.xScale(d.eventDate))
      .y(d => this.yScale(d.ratingPost))
      .curve(d3.curveMonotoneX);
    
    // Update lines
    this.mainGroup.select('.player1-line')
      .transition().duration(duration)
      .attr('d', line(this.player1Data));
    
    this.mainGroup.select('.player2-line')
      .transition().duration(duration)
      .attr('d', line(this.player2Data));
    
    // Update dots
    this.mainGroup.selectAll('.dot-player1')
      .transition().duration(duration)
      .attr('cx', d => this.xScale(d.eventDate))
      .attr('cy', d => this.yScale(d.ratingPost));
    
    this.mainGroup.selectAll('.dot-player2')
      .transition().duration(duration)
      .attr('cx', d => this.xScale(d.eventDate))
      .attr('cy', d => this.yScale(d.ratingPost));
  }
  
  // Show tooltip with player details
  showTooltip(event, d, playerName) {
    // Position tooltip near the mouse but ensure it stays within viewport
    const tooltipX = event.pageX + 10;
    const tooltipY = event.pageY - 28;
    
    this.tooltip
      .style('left', `${tooltipX}px`)
      .style('top', `${tooltipY}px`)
      .style('opacity', 0.9)
      .html(`
        <strong>Player:</strong> ${playerName}<br>
        <strong>Date:</strong> ${d.eventDate.toISOString().split('T')[0]}<br>
        <strong>Event:</strong> ${d.eventName}<br>
        ${d.eventLocation ? `<strong>Location:</strong> ${d.eventLocation}<br>` : ''}
        ${d.score ? `<strong>Score:</strong> ${d.score}<br>` : ''}
        ${d.ratingPerf ? `<strong>Performance:</strong> ${d.ratingPerf}<br>` : ''}
        <strong>Rating:</strong> ${d.ratingPost}
      `);
  }
  
  // Hide tooltip
  hideTooltip() {
    this.tooltip.style('opacity', 0);
  }
  
  // Resize handler
  resize() {
    super.resize();
    
    // Only update if loaded
    if (this.loaded) {
      this.createChart();
    }
  }
  
  // Update method
  update() {
    // Only update if loaded
    if (this.loaded) {
      this.updateChart();
    }
  }
}

// Add to global namespace
window.ChessVis.PlayerRatingsVisualization = PlayerRatingsVisualization;