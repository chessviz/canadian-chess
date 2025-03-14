/**
 * GridVisualization.js
 * Creates a grid of circles representing the distribution of chess players by rating
 * With improved organization and monochromatic color scheme
 */

ChessVis.GridVisualization = class extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.numRows = options.numRows || 10;
    this.numCols = options.numCols || 10;
    this.totalItems = this.numRows * this.numCols;
    this.minRadius = options.minRadius || 6;
    this.maxRadius = options.maxRadius || 10;
    this.padding = options.padding || 1.5;
    this.animation = options.animation !== false;
    this.animationDelay = options.animationDelay || 5; // ms per item
    this.animationDuration = options.animationDuration || 800; // ms
    
    // State
    this.gridItems = [];
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.ballRadius = 0;
    
    // DOM elements
    this.gridGroup = null;
    
    // Color scale (updated with more vibrant colors that work better together)
    this.colorScale = d3.scaleLinear()
      .domain([0, ChessVis.RATING_RANGES.length - 1])
      .range(["#8ECAE6", "#023047"]); // Light blue to deep navy
    
    // Update rating ranges colors to use monochromatic scheme
    ChessVis.RATING_RANGES.forEach((range, i) => {
      range.color = this.colorScale(i);
    });
    
    // Bind methods
    this.createGrid = this.createGrid.bind(this);
    this.updateGridLayout = this.updateGridLayout.bind(this);
    this.organizeGridByRating = this.organizeGridByRating.bind(this);
    this.createTooltip = this.createTooltip.bind(this);
  }
  
  initialize() {
    if (!super.initialize()) return false;
    
    // Create grid group
    this.gridGroup = this.svg.append('g')
      .attr('class', 'grid-group');
    
    // Generate distribution data
    this.gridItems = this.generateDistribution(this.totalItems);
    
    // Create the grid
    this.createGrid();
    
    return true;
  }
  
  // Create the grid visualization
  createGrid() {
    if (!this.svg || !this.gridGroup) return;
    
    // Remove any existing elements
    this.gridGroup.selectAll('*').remove();
    
    // Calculate dimensions
    this.updateGridLayout();
    
    // Create a gridGroup in the center of the SVG
    this.gridGroup.attr('transform', `translate(
      ${(this.width - (this.cellWidth * this.numCols)) / 2},
      ${(this.height - (this.cellHeight * this.numRows)) / 2}
    )`);
    
    // Add enhanced grid background with pattern
    this.gridGroup.append('rect')
      .attr('width', this.cellWidth * this.numCols)
      .attr('height', this.cellHeight * this.numRows)
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('rx', 8) // Rounded corners
      .attr('ry', 8);

    // Add subtle grid pattern
    const pattern = this.svg.append('defs')
      .append('pattern')
      .attr('id', 'grid-pattern')
      .attr('width', this.cellWidth)
      .attr('height', this.cellHeight)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', `M ${this.cellWidth} 0 L 0 0 0 ${this.cellHeight}`)
      .attr('fill', 'none')
      .attr('stroke', '#eee')
      .attr('stroke-width', 0.5);

    this.gridGroup.append('rect')
      .attr('width', this.cellWidth * this.numCols)
      .attr('height', this.cellHeight * this.numRows)
      .attr('fill', 'url(#grid-pattern)')
      .attr('stroke', 'none');
    
    // Organize grid items by rating range for better visualization
    this.organizeGridByRating();
    
    // Add drop shadow filter for circles
    const filter = this.svg.append('defs')
      .append('filter')
      .attr('id', 'grid-circle-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '1')
      .attr('stdDeviation', '2')
      .attr('flood-color', 'rgba(0,0,0,0.3)')
      .attr('flood-opacity', '0.3');
    
    // Create grid cells
    const circles = this.gridGroup.selectAll('.grid-circle')
      .data(this.gridItems)
      .enter()
      .append('circle')
      .attr('class', 'grid-circle')
      .attr('cx', d => d.gridX)
      .attr('cy', d => d.gridY)
      .attr('r', 0)  // Start with radius 0
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .attr('filter', 'url(#grid-circle-shadow)')
      .attr('data-range', d => d.range);
    
    // Add animation if enabled
    if (this.animation) {
      circles.transition()
        .duration(this.animationDuration)
        .delay((d, i) => i * this.animationDelay)
        .attr('r', this.ballRadius)
        .ease(d3.easeCubicOut);
    } else {
      circles.attr('r', this.ballRadius);
    }
    
    // Create legend with improved visuals for better readability
    this.createImprovedLegend();
    
    // Add interactivity - show details on hover
    const tooltip = this.createTooltip();
    
    circles.on('mouseover', (event, d) => {
      d3.select(event.target)
        .transition()
        .duration(200)
        .attr('r', this.ballRadius * 1.2);
      
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
      
      tooltip.html(`
        <strong>Rating Range:</strong> ${d.range}<br>
        <strong>Percentage:</strong> ${ChessVis.RATING_RANGES.find(r => r.range === d.range).percent}%
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', (event) => {
      d3.select(event.target)
        .transition()
        .duration(200)
        .attr('r', this.ballRadius);
      
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
  }
  
  // Organize grid items by rating range for better visualization
  organizeGridByRating() {
    // Sort grid items by rating range
    this.gridItems.sort((a, b) => {
      const aIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === a.range);
      const bIndex = ChessVis.RATING_RANGES.findIndex(r => r.range === b.range);
      return aIndex - bIndex;
    });
    
    // Calculate positions for each grid item
    this.gridItems.forEach((item, i) => {
      const col = i % this.numCols;
      const row = Math.floor(i / this.numCols);
      
      item.gridX = col * this.cellWidth + this.cellWidth / 2;
      item.gridY = row * this.cellHeight + this.cellHeight / 2;
      
      // Store initial position for transitions
      item.initialX = item.gridX;
      item.initialY = item.gridY;
    });
  }
  
  // Create an improved legend with better contrast and readability
  createImprovedLegend() {
    const legendContainer = d3.select('#grid-info-container');
    if (legendContainer.empty()) return;
    
    // Clear existing legend
    legendContainer.select('.legend').html('');
    
    const legend = legendContainer.select('.legend');
    
    // Update styling for the info container
    legendContainer
      .style('background-color', 'rgba(255, 255, 255, 0.95)')
      .style('border-radius', '15px')
      .style('padding', '25px')
      .style('border-left', '5px solid var(--primary-color)')
      .style('box-shadow', '0 10px 30px rgba(0, 0, 0, 0.12)');
    
    // Add visual title enhancements
    legendContainer.select('.info-title')
      .style('font-size', '1.8rem')
      .style('border-bottom', '2px solid var(--primary-light)')
      .style('padding-bottom', '10px')
      .style('margin-bottom', '20px');
    
    legendContainer.select('.info-stat')
      .style('font-size', '1.1rem')
      .style('line-height', '1.7')
      .style('background-color', 'rgba(211, 84, 0, 0.08)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('border-left', '3px solid var(--primary-light)');
    
    // Update legend title styling
    legendContainer.select('.legend-title')
      .style('color', 'var(--primary-color)')
      .style('font-size', '1.3rem')
      .style('margin-top', '25px')
      .style('margin-bottom', '15px');
    
    // Create enhanced legend items with gradient backgrounds
    ChessVis.RATING_RANGES.forEach((range, i) => {
      // Assign new colors from our updated scale
      range.color = this.colorScale(i);
      
      const item = legend.append('div')
        .attr('class', 'legend-item')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '12px')
        .style('background', `linear-gradient(to right, rgba(255, 255, 255, 0.7), rgba(${i * 10}, ${i * 20}, ${i * 30}, 0.05))`)
        .style('padding', '12px 15px')
        .style('border-radius', '10px')
        .style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.05)')
        .style('transition', 'all 0.3s ease')
        .style('cursor', 'pointer');
      
      item.on('mouseover', function() {
        d3.select(this)
          .style('transform', 'translateX(5px)')
          .style('box-shadow', '0 4px 10px rgba(0, 0, 0, 0.1)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('transform', 'translateX(0)')
          .style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.05)');
      });
      
      item.append('div')
        .attr('class', 'legend-color')
        .style('background-color', range.color)
        .style('width', '24px')
        .style('height', '24px')
        .style('border-radius', '50%')
        .style('margin-right', '15px')
        .style('border', '2px solid white')
        .style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.1)');
      
      item.append('div')
        .style('font-weight', '500')
        .style('font-size', '1.05rem')
        .style('color', this.colorScale(Math.min(i + 2, ChessVis.RATING_RANGES.length - 1)))
        .html(`<strong>${range.range}</strong> <span style="opacity: 0.8;">(${range.percent}%)</span>`);
    });
  }
  
  // Create tooltip for interactive information
  createTooltip() {
    // Remove any existing tooltip
    d3.select('body').selectAll('.d3-tooltip').remove();
    
    // Create new tooltip
    return d3.select('body').append('div')
      .attr('class', 'd3-tooltip visualization-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('border-radius', '4px')
      .style('border', '1px solid #ddd')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)')
      .style('pointer-events', 'none')
      .style('font-size', '14px')
      .style('z-index', 1000);
  }
  
  // Calculate grid layout dimensions
  updateGridLayout() {
    // Calculate cell size based on available space
    this.cellWidth = this.width / (this.numCols + 1);
    this.cellHeight = this.height / (this.numRows + 1);
    
    // Determine ball radius based on cell size and padding
    const maxCellDimension = Math.min(this.cellWidth, this.cellHeight);
    this.ballRadius = Math.min(
      this.maxRadius,
      Math.max(this.minRadius, maxCellDimension / (2 * this.padding))
    );
  }
  
  // Prepare for transition to hourglass
  prepareForHourglassTransition() {
    // This method would be called before transitioning to the hourglass view
    // It could return the current state of the grid for the hourglass to use
    
    // Return the grid items with their positions
    return this.gridItems.map(item => ({
      ...item,
      x: item.gridX + parseInt(this.gridGroup.attr('transform').split('(')[1].split(',')[0]),
      y: item.gridY + parseInt(this.gridGroup.attr('transform').split('(')[1].split(',')[1]),
      radius: this.ballRadius
    }));
  }
  
  // Resize handler
  resize() {
    super.resize();
    
    // Update grid layout
    this.updateGridLayout();
    
    // Update circles with new positions and sizes
    if (this.gridGroup) {
      // Update group position
      this.gridGroup.attr('transform', `translate(
        ${(this.width - (this.cellWidth * this.numCols)) / 2},
        ${(this.height - (this.cellHeight * this.numRows)) / 2}
      )`);
      
      // Update background rect
      this.gridGroup.select('rect')
        .attr('width', this.cellWidth * this.numCols)
        .attr('height', this.cellHeight * this.numRows);
      
      // Recalculate positions
      this.organizeGridByRating();
      
      // Update circles
      this.gridGroup.selectAll('.grid-circle')
        .data(this.gridItems)
        .attr('cx', d => d.gridX)
        .attr('cy', d => d.gridY)
        .attr('r', this.ballRadius);
    }
  }
  
  // Update the visualization
  update() {
    // Nothing specific to update for this visualization
  }
};