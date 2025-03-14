/**
 * TransitionManager.js
 * Manages transitions between grid and hourglass visualizations
 */

ChessVis.TransitionManager = class {
    constructor(options = {}) {
      // Configuration
      this.animationDuration = options.animationDuration || 1200;
      this.delayBetween = options.delayBetween || 20;
      this.easing = options.easing || 'cubic-out';
      
      // State
      this.gridVis = null;
      this.hourglassVis = null;
      this.transitioning = false;
      
      // Bind methods
      this.initialize = this.initialize.bind(this);
      this.transitionFromGridToHourglass = this.transitionFromGridToHourglass.bind(this);
    }
    
    // Initialize with references to both visualizations
    initialize(gridVis, hourglassVis) {
      this.gridVis = gridVis;
      this.hourglassVis = hourglassVis;
      
      // Inject communication methods into each visualization
      if (this.gridVis) {
        this.gridVis.onTransitionToHourglass = () => {
          return this.gridVis.prepareForHourglassTransition();
        };
      }
      
      if (this.hourglassVis) {
        this.hourglassVis.acceptGridItems = (gridItems) => {
          this.hourglassVis.clearBalls();
          this.hourglassVis.balls = gridItems;
          this.hourglassVis.updateBallsFromGrid();
        };
      }
      
      console.log('TransitionManager initialized');
    }
    
    // Trigger transition from grid to hourglass
    transitionFromGridToHourglass() {
      if (this.transitioning || !this.gridVis || !this.hourglassVis) {
        console.warn('Cannot start transition - already in progress or missing components');
        return false;
      }
      
      this.transitioning = true;
      console.log('Starting transition from grid to hourglass');
      
      // Get grid items in their current state
      const gridItems = this.gridVis.onTransitionToHourglass();
      
      // Fade out grid visualization
      d3.select('#' + this.gridVis.containerId)
        .transition()
        .duration(this.animationDuration / 2)
        .style('opacity', 0);
      
      // After small delay, move to next section and set up hourglass
      setTimeout(() => {
        // Request fullpage.js to move to hourglass section
        if (window.fullpage_api) {
          window.fullpage_api.moveTo('hourglass');
        }
        
        // Short delay to ensure section is changed
        setTimeout(() => {
          // Pass grid items to hourglass
          this.hourglassVis.acceptGridItems(gridItems);
          
          // Fade in hourglass visualization
          d3.select('#' + this.hourglassVis.containerId)
            .style('opacity', 0)
            .transition()
            .duration(this.animationDuration / 2)
            .style('opacity', 1)
            .on('end', () => {
              // Start the hourglass simulation
              this.hourglassVis.startSimulation();
              this.transitioning = false;
            });
            
        }, 500); // Delay after section change
      }, this.animationDuration / 2); // Delay after fade out
      
      return true;
    }
    
    // Helper to add necessary methods to hourglass visualization
    extendHourglassVisualization() {
      if (!this.hourglassVis) return;
      
      // Add method to update SVG balls from grid items
      this.hourglassVis.updateBallsFromGrid = function() {
        // Clear existing SVG balls
        this.ballsGroup.selectAll('*').remove();
        
        // Add balls to SVG
        this.ballsGroup.selectAll('.ball')
          .data(this.balls)
          .enter()
          .append('circle')
          .attr('class', 'ball')
          .attr('r', d => d.radius)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('fill', d => d.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
      };
    }
    
    // Helper to extend App.js with transition capabilities
    static extendChessFederationApp(app) {
      // Create transition manager
      app.transitionManager = new ChessVis.TransitionManager();
      
      // Initialize it when visualizations are ready
      const originalInitVisualizations = app.initVisualizations;
      
      app.initVisualizations = function() {
        // Call original method
        originalInitVisualizations.call(this);
        
        // After visualizations are created, initialize transition manager
        setTimeout(() => {
          if (this.visualizations.grid && this.visualizations.grid.instance &&
              this.visualizations.hourglass && this.visualizations.hourglass.instance) {
            
            this.transitionManager.initialize(
              this.visualizations.grid.instance,
              this.visualizations.hourglass.instance
            );
            
            // Extend hourglass visualization with needed methods
            this.transitionManager.extendHourglassVisualization();
            
            console.log('Transition manager connected to visualizations');
          }
        }, 1000); // Small delay to ensure all visualizations are ready
      };
      
      // Add trigger for grid to hourglass transition
      app.triggerGridToHourglassTransition = function() {
        if (this.transitionManager) {
          return this.transitionManager.transitionFromGridToHourglass();
        }
        return false;
      };
      
      // Modify section change handler to check for potential auto-transition
      const originalHandleSectionChange = app.handleSectionChange;
      
      app.handleSectionChange = function(sectionId) {
        // Call original method
        originalHandleSectionChange.call(this, sectionId);
        
        // If changing to hourglass and we have grid data, consider auto-transition
        if (sectionId === 'hourglass' && 
            this.visualizations.grid && 
            this.visualizations.grid.initialized) {
          
          // We could auto-trigger the transition here, but it's usually better
          // to let the user control when it happens through a UI element
        }
      };
      
      return app;
    }
  };