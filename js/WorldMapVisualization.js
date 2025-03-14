/**
 * WorldMapVisualization.js
 * Creates an interactive globe visualization showing player journeys
 */

ChessVis.WorldMapVisualization = class extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.mapDataUrl = options.mapDataUrl || 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
    this.connections = options.connections || [
      { source: "India", target: "Canada", value: 100, id: "india-canada", player: "Aaron Reeve Mendes" },
      { source: "Russia", target: "Canada", value: 85, id: "russia-canada", player: "Nikolay Noritsyn" },
    ];
    this.aspectRatio = options.aspectRatio || 0.625; // 5:8 ratio
    this.baseScale = options.baseScale || 180; // Reduced from 249.5 to make globe smaller
    this.rotationSpeed = options.rotationSpeed || 0.3;
    this.defaultRotation = options.defaultRotation || [0, 0, 0];
    this.oceanColor = options.oceanColor || "#ADDEFF";
    this.countryColor = options.countryColor || "#95B2B8";
    this.highlightSourceColor = options.highlightSourceColor || "#FFC107";
    this.highlightTargetColor = options.highlightTargetColor || "#4CAF50";
    this.pathColor = options.pathColor || "#FF5722";
    
    // State
    this.mapData = null;
    this.countries = null;
    this.activeConnections = [];
    this.animationInProgress = false;
    this.currentRotation = [...this.defaultRotation];
    
    // DOM Elements
    this.tooltip = null;
    this.globeGroup = null;
    this.countryGroup = null;
    this.connectionGroup = null;
    this.controlsContainer = null;
    
    // D3 Elements
    this.projection = null;
    this.path = null;
    
    // Bind methods
    this.loadMapData = this.loadMapData.bind(this);
    this.renderMap = this.renderMap.bind(this);
    this.createControls = this.createControls.bind(this);
    this.setupDragBehavior = this.setupDragBehavior.bind(this);
    this.animateConnection = this.animateConnection.bind(this);
    this.updateConnections = this.updateConnections.bind(this);
    this.highlightCountry = this.highlightCountry.bind(this);
    this.resetCountryHighlights = this.resetCountryHighlights.bind(this);
    this.findCountryCentroid = this.findCountryCentroid.bind(this);
    this.isPointVisible = this.isPointVisible.bind(this);
  }
  
  initialize() {
    if (!super.initialize()) return false;
    
    // Create SVG groups
    this.globeGroup = this.svg.append('g').attr('class', 'globe-layer');
    this.countryGroup = this.svg.append('g').attr('class', 'country-layer');
    this.connectionGroup = this.svg.append('g').attr('class', 'connection-layer');
    
    // Create tooltip
    this.tooltip = this.createTooltip();
    
    // Create controls container
    this.createControls();
    
    // Set up projection and path
    this.updateProjection();
    
    // Set up drag behavior
    this.setupDragBehavior();
    
    // Load map data
    this.loadMapData();
    
    return true;
  }
  
  // Update projection based on current dimensions
  updateProjection() {
    // Calculate zoom factor based on container size
    const zoomFactor = Math.min(this.height, this.width) / 500;
    const scaleFactor = this.baseScale * zoomFactor;
    
    // Create or update projection - adjust vertical position to be higher in the container
    this.projection = d3.geoOrthographic()
      .translate([this.width / 2, this.height * 0.4]) // Changed from height / 2 to height * 0.4
      .scale(scaleFactor)
      .rotate(this.currentRotation);
    
    // Define path generator
    this.path = d3.geoPath().projection(this.projection);
  }
  
  // Set up drag behavior for globe rotation
  setupDragBehavior() {
    let dragging = false;
    let lastPosition = { x: 0, y: 0 };
    
    // Add drag behavior to SVG
    this.svg.call(
      d3.drag()
        .on('start', (event) => {
          if (this.animationInProgress) return;
          
          dragging = true;
          lastPosition.x = event.x;
          lastPosition.y = event.y;
        })
        .on('drag', (event) => {
          if (dragging && !this.animationInProgress) {
            // Calculate rotation based on mouse movement
            const dx = event.x - lastPosition.x;
            const dy = event.y - lastPosition.y;
            
            // Update rotation
            this.currentRotation[0] += dx * this.rotationSpeed;
            this.currentRotation[1] -= dy * this.rotationSpeed;
            
            // Limit vertical rotation
            this.currentRotation[1] = Math.max(-90, Math.min(90, this.currentRotation[1]));
            
            // Update projection
            this.projection.rotate(this.currentRotation);
            
            // Update path elements
            this.globeGroup.selectAll('path').attr('d', this.path);
            this.countryGroup.selectAll('path').attr('d', this.path);
            
            // Update connections
            this.updateConnections();
            
            // Update last position
            lastPosition.x = event.x;
            lastPosition.y = event.y;
          }
        })
        .on('end', () => {
          dragging = false;
        })
    );
  }
  
  // Load map data from source
  loadMapData() {
    // Show loading indicator
    this.svg.append('text')
      .attr('class', 'loading-text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .text('Loading world map...');
    
    // Load TopoJSON data
    d3.json(this.mapDataUrl)
      .then(data => {
        // Store map data
        this.mapData = data;
        
        // Convert to GeoJSON
        this.countries = topojson.feature(data, data.objects.countries).features;
        
        // Render the map
        this.renderMap();
      })
      .catch(error => {
        console.error('Error loading map data:', error);
        
        // Show error message
        this.svg.select('.loading-text').remove();
        this.svg.append('text')
          .attr('class', 'error-text')
          .attr('x', this.width / 2)
          .attr('y', this.height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', 'red')
          .text('Error loading map data. Please try again.');
      });
  }
  
  // Render the world map
  renderMap() {
    // Remove loading message
    this.svg.select('.loading-text').remove();
    
    // Render ocean (sphere)
    this.globeGroup.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'ocean')
      .attr('fill', this.oceanColor)
      .attr('stroke', 'rgba(129,129,129,0.35)')
      .attr('d', this.path);
    
    // Render countries
    this.countryGroup.selectAll('.country')
      .data(this.countries)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', this.path)
      .attr('fill', this.countryColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('data-name', d => d.properties.name)
      .attr('id', d => `country-${d.properties.name.replace(/\s+/g, "-").toLowerCase()}`)
      .on('mouseover', (event, d) => {
        // Show tooltip on hover
        if (!this.animationInProgress) {
          this.tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`)
            .style('opacity', 0.9)
            .html(`<strong>${d.properties.name}</strong>`);
        }
      })
      .on('mouseout', () => {
        // Hide tooltip
        this.tooltip.style('opacity', 0);
      });
  }
  
  // Create controls for connections
  createControls() {
    // Create controls container if needed
    if (!this.controlsContainer) {
      this.controlsContainer = document.createElement('div');
      this.controlsContainer.className = 'connection-controls mt-3 text-center';
      this.controlsContainer.style.position = 'relative';
      this.controlsContainer.style.zIndex = '100';
      this.controlsContainer.style.marginTop = '30px'; // Increased margin
      this.container.appendChild(this.controlsContainer);
    } else {
      // Clear existing controls
      this.controlsContainer.innerHTML = '';
    }
    
    // Add heading above the buttons
    const heading = document.createElement('h4');
    heading.textContent = 'Player Journeys';
    heading.style.marginBottom = '15px';
    heading.style.color = 'var(--primary-color)';
    this.controlsContainer.appendChild(heading);
    
    // Create button container for better styling
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-center flex-wrap';
    this.controlsContainer.appendChild(buttonContainer);
    
    // Add connection buttons with enhanced styling
    this.connections.forEach(connection => {
      const button = document.createElement('button');
      button.className = 'btn btn-outline-primary me-2 mb-2 connection-btn';
      button.dataset.connection = connection.id;
      button.innerHTML = `<strong>${connection.player}'s</strong> Journey`;
      button.style.padding = '10px 20px';
      button.style.fontSize = '1rem';
      button.style.borderWidth = '2px';
      button.style.borderRadius = '8px';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
      
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        buttonContainer.querySelectorAll('.connection-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Set active connection
        this.activeConnections = [connection];
        
        // Animate connection
        this.animateConnection(connection);
      });
      
      buttonContainer.appendChild(button);
    });
  }
  
  // Find country centroid by name
  findCountryCentroid(countryName) {
    if (!this.countries) return null;
    
    const country = this.countries.find(c => c.properties.name === countryName);
    
    if (!country) {
      console.warn(`Country not found: ${countryName}`);
      return null;
    }
    
    return d3.geoCentroid(country);
  }
  
  // Check if a point is visible on the globe
  isPointVisible(point) {
    // Calculate angle between point and current view
    const r = this.projection.rotate();
    const center = [-r[0], -r[1]];
    return d3.geoDistance(point, center) < Math.PI / 2;
  }
  
  // Find country element by name
  findCountryElement(countryName) {
    return this.countryGroup.selectAll('.country').filter(function(d) {
      return d.properties && d.properties.name === countryName;
    });
  }
  
  // Highlight a country
  highlightCountry(countryName, color, isSource = false) {
    const countryElement = this.findCountryElement(countryName);
    
    if (!countryElement.empty()) {
      countryElement
        .classed(isSource ? 'highlight-source' : 'highlight-target', true)
        .transition()
        .duration(500)
        .attr('fill', color);
    }
  }
  
  // Reset country highlighting
  resetCountryHighlights() {
    this.countryGroup
      .selectAll('.country')
      .classed('highlight-source', false)
      .classed('highlight-target', false)
      .transition()
      .duration(500)
      .attr('fill', this.countryColor);
  }
  
  // Update connections without animation
  updateConnections() {
    // Clear existing connections
    this.connectionGroup.selectAll('*').remove();
    
    // Skip if animation in progress
    if (this.animationInProgress) return;
    
    // Draw active connections
    this.activeConnections.forEach(conn => {
      const sourcePoint = this.findCountryCentroid(conn.source);
      const targetPoint = this.findCountryCentroid(conn.target);
      
      if (!sourcePoint || !targetPoint) return;
      
      // Create arc data
      const arcData = {
        type: 'LineString',
        coordinates: [sourcePoint, targetPoint]
      };
      
      // Draw arc
      this.connectionGroup.append('path')
        .datum(arcData)
        .attr('class', 'connection-line')
        .attr('d', this.path)
        .attr('fill', 'none')
        .attr('stroke', this.pathColor)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7);
      
      // Add source marker if visible
      if (this.isPointVisible(sourcePoint)) {
        const projectedSource = this.projection(sourcePoint);
        if (projectedSource) {
          this.connectionGroup.append('circle')
            .attr('class', 'connection-point source')
            .attr('cx', projectedSource[0])
            .attr('cy', projectedSource[1])
            .attr('r', 5)
            .attr('fill', this.highlightSourceColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .append('title')
            .text(conn.source);
        }
      }
      
      // Add target marker if visible
      if (this.isPointVisible(targetPoint)) {
        const projectedTarget = this.projection(targetPoint);
        if (projectedTarget) {
          this.connectionGroup.append('circle')
            .attr('class', 'connection-point target')
            .attr('cx', projectedTarget[0])
            .attr('cy', projectedTarget[1])
            .attr('r', 5)
            .attr('fill', this.highlightTargetColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .append('title')
            .text(conn.target);
        }
      }
    });
  }
  
  // Animate connection journey
  animateConnection(connection) {
    // Reset any existing animation
    this.connectionGroup.selectAll('*').remove();
    this.resetCountryHighlights();
    
    // Set animation state
    this.animationInProgress = true;
    
    // Find source and target coordinates
    const sourcePoint = this.findCountryCentroid(connection.source);
    const targetPoint = this.findCountryCentroid(connection.target);
    
    if (!sourcePoint || !targetPoint) {
      console.error(`Could not find coordinates for ${connection.source} or ${connection.target}`);
      this.animationInProgress = false;
      return;
    }
    
    // Create arc data
    const arcData = {
      type: 'LineString',
      coordinates: [sourcePoint, targetPoint]
    };
    
    // Create arc path
    const arcPath = this.connectionGroup.append('path')
      .datum(arcData)
      .attr('class', 'connection-line animated')
      .attr('d', this.path)
      .attr('fill', 'none')
      .attr('stroke', this.pathColor)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0)
      .attr('stroke-dasharray', function() { return this.getTotalLength(); })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); });
    
    // Calculate rotation to center source country
    const sourceRotation = [-sourcePoint[0], -sourcePoint[1], 0];
    
    // First animation: rotate to source
    const startRotation = [...this.currentRotation];
    const rotateToSource = d3.interpolate(startRotation, sourceRotation);
    
    d3.transition()
      .duration(1000)
      .tween('rotate', () => {
        return t => {
          // Update rotation
          this.currentRotation = rotateToSource(t);
          this.projection.rotate(this.currentRotation);
          
          // Update all paths
          this.globeGroup.selectAll('path').attr('d', this.path);
          this.countryGroup.selectAll('path').attr('d', this.path);
          arcPath.attr('d', this.path);
        };
      })
      .on('end', () => {
        // Highlight source country
        this.highlightCountry(connection.source, this.highlightSourceColor, true);
        
        // Add source marker
        const projectedSource = this.projection(sourcePoint);
        let sourceMarker;
        
        if (projectedSource) {
          sourceMarker = this.connectionGroup.append('circle')
            .attr('class', 'connection-point source')
            .attr('cx', projectedSource[0])
            .attr('cy', projectedSource[1])
            .attr('r', 0)
            .attr('fill', this.highlightSourceColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
          
          sourceMarker.transition()
            .duration(500)
            .attr('r', 5);
        }
        
        // Wait before starting journey
        setTimeout(() => {
          // Hide source marker
          if (sourceMarker) {
            sourceMarker.transition()
              .duration(200)
              .attr('r', 0)
              .remove();
          }
          
          // Calculate rotation to target
          const targetRotation = [-targetPoint[0], -targetPoint[1], 0];
          const rotateToTarget = d3.interpolate(sourceRotation, targetRotation);
          
          // Second animation: rotate to target and draw path
          d3.transition()
            .duration(2000)
            .tween('rotate', () => {
              return t => {
                // Update rotation
                this.currentRotation = rotateToTarget(t);
                this.projection.rotate(this.currentRotation);
                
                // Update all paths
                this.globeGroup.selectAll('path').attr('d', this.path);
                this.countryGroup.selectAll('path').attr('d', this.path);
                arcPath.attr('d', this.path);
              };
            })
            // Animate path drawing
            .call(transition => {
              arcPath
                .attr('stroke-opacity', 0.7)
                .transition(transition)
                .attr('stroke-dashoffset', 0);
            })
            .on('end', () => {
              // Highlight target country
              this.highlightCountry(connection.target, this.highlightTargetColor, false);
              
              // Add markers for source and target
              const projectedSource = this.projection(sourcePoint);
              const projectedTarget = this.projection(targetPoint);
              let finalSourceMarker, finalTargetMarker;
              
              // Add source marker if visible
              if (projectedSource && this.isPointVisible(sourcePoint)) {
                finalSourceMarker = this.connectionGroup.append('circle')
                  .attr('class', 'connection-point source')
                  .attr('cx', projectedSource[0])
                  .attr('cy', projectedSource[1])
                  .attr('r', 0)
                  .attr('fill', this.highlightSourceColor)
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 1);
                
                finalSourceMarker.transition()
                  .duration(500)
                  .attr('r', 5);
              }
              
              // Add target marker
              if (projectedTarget && this.isPointVisible(targetPoint)) {
                finalTargetMarker = this.connectionGroup.append('circle')
                  .attr('class', 'connection-point target')
                  .attr('cx', projectedTarget[0])
                  .attr('cy', projectedTarget[1])
                  .attr('r', 0)
                  .attr('fill', this.highlightTargetColor)
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 1);
                
                finalTargetMarker.transition()
                  .duration(500)
                  .attr('r', 5)
                  .on('end', () => {
                    // End animation
                    this.animationInProgress = false;
                    
                    // Add tooltips
                    if (finalTargetMarker) finalTargetMarker.append('title').text(connection.target);
                    if (finalSourceMarker) finalSourceMarker.append('title').text(connection.source);
                  });
              } else {
                // End animation even if target is not visible
                this.animationInProgress = false;
              }
            });
        }, 750);
      });
  }
  
  // Resize handler
  resize() {
    super.resize();
    
    // Stop any running animation
    this.animationInProgress = false;
    
    // Update projection
    this.updateProjection();
    
    // Update paths
    if (this.path) {
      this.globeGroup.selectAll('path').attr('d', this.path);
      this.countryGroup.selectAll('path').attr('d', this.path);
      this.connectionGroup.selectAll('path').attr('d', this.path);
    }
    
    // Update connections
    this.updateConnections();
  }
  
  // Update method
  update() {
    // Nothing specific to update in this visualization
  }
};