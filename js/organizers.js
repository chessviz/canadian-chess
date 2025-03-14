// Load data from CSV file
d3.dsv(",", "data/top_organizers.csv")
    .then(function(data) {
    // Process the CSV data to match our required structure
    data = data.map(d => {
        return {
            id: +d.id,
            num_tournaments: +d.num_tournaments,
            total_players: +d.total_players,
            name: d.name,
            province: d.province,
            birth_year: +d.birth_year,
            avg_players_per_tournament: +d.avg_players_per_tournament
        };
    });

    // Sort data by number of tournaments (descending) and take only top 50
    data = data.sort((a, b) => b.num_tournaments - a.num_tournaments)
              .slice(0, 50);

    console.log("Data for visualization (top 50 organizers)", data);
    // Now that we have our data, initialize the visualization

        const width = 800, height = 600;
        const svg = d3.select("#organizers-chart");
        
        // Create group for the visualization
        const chartGroup = svg.append("g")
            .attr("transform", "translate(0, 0)");
        
        // Define margins
        const margin = {top: 50, right: 50, bottom: 70, left: 70};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([1900, 2000])  // Birth years range, slightly expanded for better visibility
            .range([margin.left, width - margin.right]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.num_tournaments) * 1.1]) // Add 10% padding at top
            .range([height - margin.bottom, margin.top]);
        
        const rScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.total_players)])
            .range([5, 30]);  // Bubble size
        
        const colorScale = d3.scaleOrdinal()
            .domain([...new Set(data.map(d => d.province))])
            .range(d3.schemeCategory10);
        
        const tooltip = d3.select(".tooltip");
        
        // Update title to reflect "Top 50"
        svg.append("text")
            .attr("class", "chart-title")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .text("Top 50 Chess Tournament Organizers in Canada");
        
        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format("d"))
            .ticks(10);
        
        const yAxis = d3.axisLeft(yScale)
            .ticks(10);
        
        // Add axes
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xAxis);
        
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);
        
        // Add axis labels
        svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .text("Birth Year");
        
        svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 20)
            .text("Number of Tournaments Organized");
        
        // Create bubbles
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "bubble")
            .attr("cx", d => xScale(d.birth_year))
            .attr("cy", d => yScale(d.num_tournaments))
            .attr("r", d => rScale(d.total_players))
            .attr("fill", d => colorScale(d.province))
            .attr("opacity", 0.7)
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.9);
                    
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.name}</strong><br>
                            Province: ${d.province}<br>
                            Birth Year: ${d.birth_year}<br>
                            Tournaments: ${d.num_tournaments}<br>
                            Total Players: ${d.total_players.toLocaleString()}<br>
                            Avg Players/Tournament: ${d.avg_players_per_tournament.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.7);
                    
                tooltip.style("opacity", 0);
            });
        
        // Add a legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 120}, ${margin.top})`);
        
        const provinces = [...new Set(data.map(d => d.province))];
        
        provinces.forEach((province, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);
                
            legendRow.append("circle")
                .attr("cx", 10)
                .attr("cy", 10)
                .attr("r", 7)
                .attr("fill", colorScale(province));
                
            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 15)
                .text(province);
        });

        // Add text indicating number of organizers shown
        svg.append("text")
            .attr("class", "info-text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 45)
            .attr("font-size", "14px")
            .text(`Showing ${data.length} organizers sorted by number of tournaments organized`);

});
