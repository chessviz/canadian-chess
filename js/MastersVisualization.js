/**
 * MastersVisualization.js
 * Creates a visualization of Canadian chess masters over time
 */

class MastersVisualization extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.dataPath = options.dataPath || 'data/national_masters.csv';
    this.startYear = options.startYear || 2000; // Filter masters before this year
    this.barColor = options.barColor || '#4682b4';
    this.barHoverColor = options.barHoverColor || '#d35400';
    this.lineColor = options.lineColor || '#e41a1c';
    this.margin = options.margin || {top: 50, right: 80, bottom: 100, left: 60};
    this.detailsContainer = options.detailsContainer || 'masters-details';
    this.titleText = options.titleText || 'Canadian National Chess Masters By Year';
    
    // State
    this.data = [];
    this.yearCounts = [];
    this.yearGroups = null;
    this.cumulativeData = [];
    this.minYear = 0;
    this.maxYear = 0;
    this.priorTotal = 0;
    this.loaded = false;
    
    // Chart elements
    this.x = null;
    this.y = null;
    this.y2 = null;
    this.xAxis = null;
    this.yAxis = null;
    this.y2Axis = null;
    this.tooltip = null;
    this.detailsDiv = null;
    
    // Bind methods
    this.loadData = this.loadData.bind(this);
    this.processData = this.processData.bind(this);
    this.createChart = this.createChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.showMasterDetails = this.showMasterDetails.bind(this);
  }
  
  initialize() {
    if (!super.initialize()) return false;
    
    // Create tooltip
    this.tooltip = this.createTooltip();
    
    // Create details container if it doesn't exist
    this.detailsDiv = document.getElementById(this.detailsContainer);
    if (!this.detailsDiv) {
      this.detailsDiv = document.createElement('div');
      this.detailsDiv.id = this.detailsContainer;
      this.detailsDiv.className = 'masters-details';
      this.detailsDiv.style.display = 'none';
      this.container.parentNode.insertBefore(this.detailsDiv, this.container.nextSibling);
    }
    
    // Show loading indicator
    this.svg.append('text')
      .attr('class', 'loading-text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .text('Loading masters data...');
    
    // Load data
    this.loadData();
    
    return true;
  }
  
  // Load masters data
  loadData() {
    d3.csv(this.dataPath)
      .then(data => {
        // Process the data
        this.processData(data);
        
        // Create chart
        this.createChart();
        
        this.loaded = true;
      })
      .catch(error => {
        console.error('Error loading masters data:', error);
        
        // Show error message
        this.svg.select('.loading-text').remove();
        this.svg.append('text')
          .attr('class', 'error-text')
          .attr('x', this.width / 2)
          .attr('y', this.height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', 'red')
          .text('Error loading masters data. Please try again.');
      });
  }
  
  // Process the raw CSV data
  processData(data) {
    // Parse dates and filter out invalid entries
    this.data = data
      .filter(d => d.title_achieved && d.title_achieved.trim().length > 0)
      .map(d => {
        // Parse date
        const parseDate = d3.timeParse('%Y-%m-%d');
        d.date = parseDate(d.title_achieved);
        d.year = d.date ? d.date.getFullYear() : null;
        
        // Parse tournaments
        if (d.tournaments && d.tournaments.trim().length > 0) {
          d.tournamentsList = d.tournaments.split('; ').map(t => {
            const parts = t.split(':');
            return {
              eventId: parts[0],
              performance: parts[1] ? parseInt(parts[1]) : null
            };
          });
        } else {
          d.tournamentsList = [];
        }
        
        return d;
      })
      .filter(d => d.date !== null && d.year !== null);
    
    // Sort by date
    this.data.sort((a, b) => a.date - b.date);
    
    // Find min and max years
    this.minYear = d3.min(this.data, d => d.year);
    this.maxYear = d3.max(this.data, d => d.year);
    
    // Create continuous array of years
    const years = [];
    for (let year = this.startYear; year <= this.maxYear; year++) {
      years.push(year);
    }
    
    // Group by year
    this.yearGroups = d3.group(this.data, d => d.year);
    
    // Create year counts for bar chart
    this.yearCounts = years.map(year => ({
      year: year,
      count: this.yearGroups.has(year) ? this.yearGroups.get(year).length : 0
    }));
    
    // Calculate cumulative total before start year
    this.priorTotal = 0;
    for (let year = this.minYear; year < this.startYear; year++) {
      this.priorTotal += this.yearGroups.has(year) ? this.yearGroups.get(year).length : 0;
    }
    
    // Create cumulative data
    this.cumulativeData = [];
    let cumulative = this.priorTotal;
    
    this.yearCounts.forEach(d => {
      cumulative += d.count;
      this.cumulativeData.push({
        year: d.year,
        count: cumulative
      });
    });
  }
  
  // Create the chart
  createChart() {
    if (!this.loaded && this.data.length === 0) return;
    
    // Remove loading message
    this.svg.select('.loading-text').remove();
    
    // Calculate the inner dimensions
    const chartWidth = this.width - this.margin.left - this.margin.right;
    const chartHeight = this.height - this.margin.top - this.margin.bottom;
    
    // Create chart group
    const chartGroup = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    
    // Set up scales
    this.x = d3.scaleBand()
      .domain(this.yearCounts.map(d => d.year))
      .range([0, chartWidth])
      .padding(0.1);
    
    this.y = d3.scaleLinear()
      .domain([0, d3.max(this.yearCounts, d => d.count) || 10])
      .range([chartHeight, 0])
      .nice();
    
    this.y2 = d3.scaleLinear()
      .domain([0, d3.max(this.cumulativeData, d => d.count)])
      .range([chartHeight, 0])
      .nice();
    
    // Create axes
    this.xAxis = chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(this.x)
        .tickValues(this.x.domain().filter(d => d % 5 === 0))
      )
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');
    
    this.yAxis = chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.y).ticks(5));
    
    this.y2Axis = chartGroup.append('g')
      .attr('class', 'y2-axis')
      .attr('transform', `translate(${chartWidth},0)`)
      .call(d3.axisRight(this.y2));
    
    // Add axis labels
    chartGroup.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + this.margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');
    
    chartGroup.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -this.margin.left + 20)
      .attr('text-anchor', 'middle')
      .text('Number of New National Masters');
    
    chartGroup.append('text')
      .attr('class', 'y2-axis-label')
      .attr('transform', 'rotate(90)')
      .attr('x', chartHeight / 2)
      .attr('y', -chartWidth - this.margin.right + 20)
      .attr('text-anchor', 'middle')
      .text('Cumulative Number of Masters');
    
    // Add title
    chartGroup.append('text')
      .attr('class', 'chart-title')
      .attr('x', chartWidth / 2)
      .attr('y', -this.margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(this.titleText);
    
    // Draw bars
    chartGroup.selectAll('.bar')
      .data(this.yearCounts)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.x(d.year))
      .attr('y', d => this.y(d.count))
      .attr('width', this.x.bandwidth())
      .attr('height', d => chartHeight - this.y(d.count))
      .attr('fill', d => d.count > 0 ? this.barColor : '#dddddd')
      .on('mouseover', (event, d) => {
        if (d.count === 0) return;
        
        // Highlight bar
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('fill', this.barHoverColor);
        
        // Show tooltip
        const mastersThisYear = this.yearGroups.get(d.year) || [];
        let mastersText = `<strong>Year: ${d.year}</strong><br>New Masters: ${d.count}<br><br>`;
        
        // Add up to 5 master names to the tooltip
        mastersText += mastersThisYear
          .slice(0, 5)
          .map(m => `${m.player_name || 'Player ' + m.cfc_id} (${m.tournamentsList.length} qualifying tournaments)`)
          .join('<br>');
        
        if (mastersThisYear.length > 5) {
          mastersText += `<br>... and ${mastersThisYear.length - 5} more`;
        }
        
        this.tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('opacity', 0.9)
          .html(mastersText);
      })
      .on('mouseout', (event, d) => {
        // Restore original color
        d3.select(event.target)
          .transition()
          .duration(500)
          .attr('fill', d.count > 0 ? this.barColor : '#dddddd');
        
        // Hide tooltip
        this.tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        if (d.count === 0) return;
        
        // Add a pulse animation to the clicked bar
        const clickedBar = d3.select(event.target);
        
        // Apply pulsing effect
        clickedBar
          .attr('fill', this.barHoverColor)
          .transition()
          .duration(200)
          .attr('fill', 'rgba(255, 165, 0, 0.9)')  // Bright orange
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .transition()
          .duration(200)
          .attr('fill', this.barHoverColor)
          .transition()
          .duration(200)
          .attr('fill', 'rgba(255, 165, 0, 0.9)')
          .transition()
          .duration(500)
          .attr('fill', this.barColor)
          .attr('stroke', 'none');
        
        // Show details for this year
        this.showMasterDetails(d.year);
      });
    
    // Create line for cumulative data
    const line = d3.line()
      .x(d => this.x(d.year) + this.x.bandwidth() / 2)
      .y(d => this.y2(d.count));
    
    chartGroup.append('path')
      .datum(this.cumulativeData)
      .attr('class', 'cumulative-line')
      .attr('fill', 'none')
      .attr('stroke', this.lineColor)
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add dots for cumulative line
    chartGroup.selectAll('.dot')
      .data(this.cumulativeData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => this.x(d.year) + this.x.bandwidth() / 2)
      .attr('cy', d => this.y2(d.count))
      .attr('r', 3)
      .attr('fill', this.lineColor)
      .on('mouseover', (event, d) => {
        // Show tooltip
        this.tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('opacity', 0.9)
          .html(`Year: ${d.year}<br>Total Masters: ${d.count}`);
      })
      .on('mouseout', () => {
        // Hide tooltip
        this.tooltip.style('opacity', 0);
      });
    
    // Add legend
    const legend = chartGroup.append('g')
      .attr('transform', `translate(${chartWidth - 150}, ${chartHeight + 30})`);
    
    // Bar legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', this.barColor);
    
    legend.append('text')
      .attr('x', 30)
      .attr('y', 15)
      .text('New Masters Per Year');
    
    // Line legend
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 40)
      .attr('x2', 20)
      .attr('y2', 40)
      .attr('stroke', this.lineColor)
      .attr('stroke-width', 2);
    
    legend.append('text')
      .attr('x', 30)
      .attr('y', 45)
      .text('Cumulative Masters');
  }
  
  // Show detailed information for a specific year
  showMasterDetails(year) {
    const masters = this.yearGroups.get(year) || [];
    
    // Create a modal element if it doesn't exist
    let modalElement = document.getElementById('masters-detail-modal');
    if (!modalElement) {
      modalElement = document.createElement('div');
      modalElement.id = 'masters-detail-modal';
      modalElement.className = 'masters-modal';
      document.body.appendChild(modalElement);
      
      // Add modal styling - could also be added to CSS file
      const modalStyle = document.createElement('style');
      modalStyle.textContent = `
        .masters-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .masters-modal.visible {
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 1;
        }
        
        .masters-modal-content {
          background-color: white;
          border-radius: 15px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 30px;
          transform: translateY(-20px);
          transition: transform 0.3s ease;
          border-top: 5px solid var(--primary-color);
        }
        
        .masters-modal.visible .masters-modal-content {
          transform: translateY(0);
        }
        
        .masters-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        
        .masters-modal-title {
          font-size: 1.8rem;
          color: var(--primary-color);
          margin: 0;
        }
        
        .masters-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #777;
          transition: color 0.2s ease;
        }
        
        .masters-modal-close:hover {
          color: var(--primary-color);
        }
        
        .masters-modal-body {
          margin-bottom: 20px;
        }
        
        .masters-modal-footer {
          text-align: right;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        
        .masters-modal .close-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        
        .masters-modal .close-button:hover {
          background-color: var(--primary-dark);
        }
        
        .masters-modal table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .masters-modal th, .masters-modal td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .masters-modal th {
          background-color: #f8f9fa;
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .masters-modal tr:hover {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .masters-modal-content {
            width: 95%;
            padding: 20px;
          }
          
          .masters-modal th, .masters-modal td {
            padding: 8px 10px;
            font-size: 0.9rem;
          }
        }
      `;
      document.head.appendChild(modalStyle);
    }
    
    // Create modal content
    const modalHTML = `
      <div class="masters-modal-content">
        <div class="masters-modal-header">
          <h4 class="masters-modal-title">National Masters Achieved in ${year} (${masters.length} total)</h4>
          <button type="button" class="masters-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="masters-modal-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Player ID</th>
                  <th>Date Achieved</th>
                  <th>Province</th>
                  <th>Qualifying Tournaments</th>
                </tr>
              </thead>
              <tbody>
                ${masters.map(master => `
                  <tr>
                    <td>${master.player_name || 'Unknown'}</td>
                    <td>${master.cfc_id}</td>
                    <td>${master.title_achieved}</td>
                    <td>${master.province || 'Unknown'}</td>
                    <td>${master.tournamentsList ? master.tournamentsList.length : 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="masters-modal-footer">
          <button type="button" class="close-button">Close</button>
        </div>
      </div>
    `;
    
    // Set the modal content and show it
    modalElement.innerHTML = modalHTML;
    modalElement.classList.add('visible');
    
    // Add event listeners to close buttons
    const closeButton = modalElement.querySelector('.close-button');
    const closeX = modalElement.querySelector('.masters-modal-close');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modalElement.classList.remove('visible');
        setTimeout(() => {
          modalElement.style.display = 'none';
        }, 300);
      });
    }
    
    if (closeX) {
      closeX.addEventListener('click', () => {
        modalElement.classList.remove('visible');
        setTimeout(() => {
          modalElement.style.display = 'none';
        }, 300);
      });
    }
    
    // Close when clicking outside the modal content
    modalElement.addEventListener('click', (event) => {
      if (event.target === modalElement) {
        modalElement.classList.remove('visible');
        setTimeout(() => {
          modalElement.style.display = 'none';
        }, 300);
      }
    });
  }
  
  // Update chart (e.g., after resize)
  updateChart() {
    if (!this.loaded) return;
    
    // Recalculate dimensions
    const chartWidth = this.width - this.margin.left - this.margin.right;
    const chartHeight = this.height - this.margin.top - this.margin.bottom;
    
    // Update scales
    this.x.range([0, chartWidth]);
    this.y.range([chartHeight, 0]);
    this.y2.range([chartHeight, 0]);
    
    // Update axes
    this.svg.select('.x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(this.x)
        .tickValues(this.x.domain().filter(d => d % 5 === 0))
      )
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');
    
    this.svg.select('.y-axis')
      .call(d3.axisLeft(this.y).ticks(5));
    
    this.svg.select('.y2-axis')
      .attr('transform', `translate(${chartWidth},0)`)
      .call(d3.axisRight(this.y2));
    
    // Update bars
    this.svg.selectAll('.bar')
      .attr('x', d => this.x(d.year))
      .attr('y', d => this.y(d.count))
      .attr('width', this.x.bandwidth())
      .attr('height', d => chartHeight - this.y(d.count));
    
    // Update line
    const line = d3.line()
      .x(d => this.x(d.year) + this.x.bandwidth() / 2)
      .y(d => this.y2(d.count));
    
    this.svg.select('.cumulative-line')
      .attr('d', line);
    
    // Update dots
    this.svg.selectAll('.dot')
      .attr('cx', d => this.x(d.year) + this.x.bandwidth() / 2)
      .attr('cy', d => this.y2(d.count));
    
    // Update labels
    this.svg.select('.x-axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + this.margin.bottom - 10);
    
    this.svg.select('.y2-axis-label')
      .attr('y', -chartWidth - this.margin.right + 20);
    
    this.svg.select('.chart-title')
      .attr('x', chartWidth / 2);
  }
  
  // Resize handler
  resize() {
    super.resize();
    
    // Clear existing content
    this.svg.selectAll('*').remove();
    
    // Recreate chart with new dimensions
    if (this.loaded) {
      this.createChart();
    }
  }
  
  // Update method
  update() {
    // Nothing specific to update
  }
}

// Add to global namespace
window.ChessVis.MastersVisualization = MastersVisualization;