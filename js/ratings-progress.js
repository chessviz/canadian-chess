// This script runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load both CSV files
    Promise.all([
        d3.csv('data/rating_histories/rating_history_167084.csv'),
        d3.csv('data/rating_histories/rating_history_132534.csv')
    ]).then(function(data) {
        const player1Data = data[0];
        const player2Data = data[1];
        
        // Process the data
        function processData(data, playerId) {
            return data.map(d => {
                return {
                    eventId: d.eventId,
                    eventDate: new Date(d.eventDate),
                    eventName: d.eventName,
                    eventLocation: d.eventLocation || "",
                    score: d.score,
                    ratingPerf: +d.ratingPerf,
                    ratingPost: +d.ratingPost,
                    playerId: playerId
                };
            }).sort((a, b) => a.eventDate - b.eventDate);
        }
        
        const processedPlayer1 = processData(player1Data, "167084");
        const processedPlayer2 = processData(player2Data, "132534");
        
        // Combine data for domain calculations
        const allData = [...processedPlayer1, ...processedPlayer2];
        
        // Define time domain
        const timeDomain = [
            d3.min(allData, d => d.eventDate),
            d3.max(allData, d => d.eventDate)
        ];
        
        // Create the chart with initial full domain
        createCharts(processedPlayer1, processedPlayer2, timeDomain);
        
        function createCharts(data1, data2, xDomain) {
            // Clear the chart containers
            d3.select("#chart").html("");
            d3.select("#context").html("");
            
            // Set dimensions and margins for main chart
            const margin = {top: 40, right: 80, bottom: 60, left: 80};
            const width = Math.min(1100, window.innerWidth - 100) - margin.left - margin.right;
            const height = 500 - margin.top - margin.bottom;
            
            // Set dimensions and margins for context chart (brush)
            const marginContext = {top: 20, right: 80, bottom: 30, left: 80};
            const heightContext = 100 - marginContext.top - marginContext.bottom;
            
            // Create SVG for main chart
            const svg = d3.select("#chart")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Create SVG for context chart
            const svgContext = d3.select("#context")
                .append("svg")
                    .attr("width", width + marginContext.left + marginContext.right)
                    .attr("height", heightContext + marginContext.top + marginContext.bottom)
                .append("g")
                    .attr("transform", `translate(${marginContext.left},${marginContext.top})`);
            
            // Scale for X axis (time) - main chart
            const xScale = d3.scaleTime()
                .domain(xDomain)
                .range([0, width]);
            
            // Scale for X axis (time) - context chart (always full domain)
            const xScaleContext = d3.scaleTime()
                .domain(timeDomain)
                .range([0, width]);
            
            // Scale for Y axis (rating) - main chart
            const yScale = d3.scaleLinear()
                .domain(
                    [
                        d3.min(allData, d => d.ratingPost) - 50,
                        d3.max(allData, d => d.ratingPost) + 50
                    ]
                )
                .range([height, 0]);
            
            // Scale for Y axis (rating) - context chart (always full domain)
            const yScaleContext = d3.scaleLinear()
                .domain([800, 2700])
                .range([heightContext, 0]);
            
            // Add X axis - main chart
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale)
                    .tickFormat(d3.timeFormat("%Y-%m"))
                    .ticks(10));
            
            // Add X axis label - main chart
            svg.append("text")
                .attr("class", "axis-label")
                .attr("x", width / 2)
                .attr("y", height + 40)
                .text("Date");
            
            // Add Y axis - main chart
            svg.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Add Y axis label - main chart
            svg.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -60)
                .text("Rating");
            
            // Add horizontal grid lines - main chart
            svg.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft(yScale)
                    .tickSize(-width)
                    .tickFormat(""));
            
            // Create line generators - main chart
            const line = d3.line()
                .x(d => xScale(d.eventDate))
                .y(d => yScale(d.ratingPost));
            
            // Create line generators - context chart
            const lineContext = d3.line()
                .x(d => xScaleContext(d.eventDate))
                .y(d => yScaleContext(d.ratingPost))
                .curve(d3.curveMonotoneX);
            
            // Add line for player 1 - main chart
            svg.append("path")
                .datum(data1)
                .attr("class", "line line-167084")
                .attr("d", line);
            
            // Add line for player 2 - main chart
            svg.append("path")
                .datum(data2)
                .attr("class", "line line-132534")
                .attr("d", line);
            
            // Add line for player 1 - context chart
            svgContext.append("path")
                .datum(processedPlayer1)
                .attr("class", "line line-167084")
                .attr("d", lineContext);
            
            // Add line for player 2 - context chart
            svgContext.append("path")
                .datum(processedPlayer2)
                .attr("class", "line line-132534")
                .attr("d", lineContext);
            
            // Add dots for player 1 - main chart
            svg.selectAll(".dot-167084")
                .data(data1)
                .enter()
                .append("circle")
                    .attr("class", "dot-167084")
                    .attr("cx", d => xScale(d.eventDate))
                    .attr("cy", d => yScale(d.ratingPost))
                    .attr("r", 4)
                    .attr("fill", "#2b83ba")
                    .on("mouseover", function(event, d) {
                        d3.select(this).attr("r", 6); // Enlarge the point
                        showTooltip(event, d);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("r", 3.5); // Reset the point size
                        hideTooltip();
                    })
                    .on("mousemove", function(event, d) {
                        // Update tooltip position as mouse moves
                        d3.select("#rating-tooltip")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    });
            
            // Add dots for player 2 - main chart
            svg.selectAll(".dot-132534")
                .data(data2)
                .enter()
                .append("circle")
                    .attr("class", "dot-132534")
                    .attr("cx", d => xScale(d.eventDate))
                    .attr("cy", d => yScale(d.ratingPost))
                    .attr("r", 4)
                    .attr("fill", "#d7191c")
                    .on("mouseover", function(event, d) {
                        d3.select(this).attr("r", 6); // Enlarge the point
                        showTooltip(event, d);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("r", 3.5); // Reset the point size
                        hideTooltip();
                    })
                    .on("mousemove", function(event, d) {
                        // Update tooltip position as mouse moves
                        d3.select("#rating-tooltip")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    });
            
            // Add X axis - context chart
            svgContext.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${heightContext})`)
                .call(d3.axisBottom(xScaleContext)
                    .tickFormat(d3.timeFormat("%Y"))
                    .ticks(6));
            
            // Add brush to context chart
            const brush = d3.brushX()
                .extent([[0, 0], [width, heightContext]])
                .on("end", brushed);
            
            svgContext.append("g")
                .attr("class", "brush")
                .call(brush);
            
            // Brush function - updates main chart when brush is used
            function brushed(event) {
                if (!event.selection) return;
                
                // Get the selected time range from the brush
                const [x0, x1] = event.selection.map(xScaleContext.invert);
                
                // Enable reset button
                d3.select("#resetZoom").property("disabled", false);
                
                // Filter data to show only what's in the brushed range
                const filteredData1 = processedPlayer1.filter(d => d.eventDate >= x0 && d.eventDate <= x1);
                const filteredData2 = processedPlayer2.filter(d => d.eventDate >= x0 && d.eventDate <= x1);
                
                // Update the main chart with the filtered data and new domain
                createCharts(filteredData1, filteredData2, [x0, x1]);
            }
            
            // Reset zoom button functionality
            d3.select("#resetZoom").on("click", function() {
                d3.select(this).property("disabled", true);
                createCharts(processedPlayer1, processedPlayer2, timeDomain);
            });
        }
        
        // Add tooltip functionality
        function showTooltip(event, d) {
            const tooltip = d3.select("#rating-tooltip");
            const date = new Date(d.date).toLocaleDateString();
            
            tooltip
                .html(`<strong>${d.name || 'Player ' + d.player}</strong><br>
                      Date: ${date}<br>
                      Rating: ${d.rating}${d.province ? '<br>Province: ' + d.province : ''}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px")
                .classed("hidden", false);
        }
        
        function hideTooltip() {
            d3.select("#rating-tooltip").classed("hidden", true);
        }
    }).catch(function(error) {
        console.log("Error loading CSV files:", error);
    });
});

{/* document.addEventListener("DOMContentLoaded", loadMastersData); */}
