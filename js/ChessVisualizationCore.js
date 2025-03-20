/**
 * ChessVisualizationCore.js
 * Core library for Canadian Chess Federation Visualizations
 * Handles shared functionality across visualizations
 */

// Create namespace
window.ChessVis = window.ChessVis || {};

// Configuration constants
ChessVis.RATING_RANGES = [
  { range: "1-1199", percent: 50.9, color: "#0072B2" },    // Blue
  { range: "1200-1699", percent: 33.1, color: "#56B4E9" }, // Light blue
  { range: "1700-1899", percent: 9.4, color: "#F0E442" },  // Yellow
  { range: "1900-2299", percent: 5.6, color: "#E69F00" },  // Orange
  { range: "2300+", percent: 1.0, color: "#D55E00" }       // Red-orange
];

// Total number of registered chess players in Canada
ChessVis.TOTAL_PLAYERS = 4,866;

// Base ChessVisualization class (for inheritance)
ChessVis.ChessVisualization = class {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.width = 0;
    this.height = 0;
    this.svg = null;
    this.initialized = false;
    
    // Bind methods to preserve 'this' context
    this.initialize = this.initialize.bind(this);
    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);
    this.cleanup = this.cleanup.bind(this);
    
    // Set up resize observer
    this.resizeObserver = new ResizeObserver(entries => {
      this.resize();
    });
  }
  
  // Base initialization method
  initialize() {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return false;
    }
    
    // Start observing for resize
    this.resizeObserver.observe(this.container);
    
    // Get dimensions
    this.updateDimensions();
    
    // Create SVG if it doesn't exist
    if (!this.svg) {
      this.svg = d3.select(`#${this.containerId}`)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
        .classed('visualization-svg', true);
    }
    
    this.initialized = true;
    return true;
  }
  
  // Update dimensions based on container
  updateDimensions() {
    if (!this.container) return;
    
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    // Update SVG dimensions if it exists
    if (this.svg) {
      this.svg
        .attr('width', this.width)
        .attr('height', this.height);
    }
  }
  
  // Resize handler - to be implemented by specific visualizations
  resize() {
    this.updateDimensions();
  }
  
  // Update visualization - to be implemented by specific visualizations
  update() {
    // Default update does nothing
  }
  
  // Cleanup method
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
    
    this.initialized = false;
  }
  
  // Helper: Generate a distribution of items based on percentage
  generateDistribution(totalItems) {
    const distribution = [];
    
    ChessVis.RATING_RANGES.forEach(range => {
      const count = Math.round(totalItems * (range.percent / 100));
      for (let i = 0; i < count && distribution.length < totalItems; i++) {
        distribution.push({
          range: range.range,
          color: range.color
        });
      }
    });
    
    // Ensure we have exactly totalItems
    if (distribution.length < totalItems) {
      // Add remaining items to the most common category
      const mostCommonRange = ChessVis.RATING_RANGES.reduce((prev, current) => 
        (prev.percent > current.percent) ? prev : current);
      
      while (distribution.length < totalItems) {
        distribution.push({
          range: mostCommonRange.range,
          color: mostCommonRange.color
        });
      }
    } else if (distribution.length > totalItems) {
      // Trim excess items if we have too many
      distribution.length = totalItems;
    }
    
    // Shuffle to ensure random distribution
    return this.shuffleArray(distribution);
  }
  
  // Helper: Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Helper: Create tooltip for visualization
  createTooltip() {
    const tooltipId = `${this.containerId}-tooltip`;
    let tooltip = d3.select(`#${tooltipId}`);
    
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('id', tooltipId)
        .attr('class', 'visualization-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
        .style('z-index', 1000);
    }
    
    return tooltip;
  }
  
  // Helper: Format number with commas
  formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};