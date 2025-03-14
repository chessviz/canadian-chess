const data = [
    {id: 108387, num_tournaments: 2259, total_players: 10399, name: "Roman Pelts", province: "ON", birth_year: 1937, avg_players_per_tournament: 4.60},
    {id: 102198, num_tournaments: 785, total_players: 11429, name: "John Rutherford", province: "ON", birth_year: 1952, avg_players_per_tournament: 14.56},
    {id: 108715, num_tournaments: 676, total_players: 14467, name: "Stephen Wright", province: "BC", birth_year: 1961, avg_players_per_tournament: 21.40},
    {id: 100145, num_tournaments: 524, total_players: 6467, name: "Fred McKim", province: "PE", birth_year: 1958, avg_players_per_tournament: 12.34},
    {id: 127778, num_tournaments: 492, total_players: 6724, name: "Corinna Wan", province: "ON", birth_year: 1960, avg_players_per_tournament: 13.67},
    {id: 106856, num_tournaments: 488, total_players: 9587, name: "Halldor Peter Palsson", province: "ON", birth_year: 1901, avg_players_per_tournament: 19.65},
    {id: 100317, num_tournaments: 432, total_players: 9934, name: "Mark S. Dutton", province: "BC", birth_year: 1956, avg_players_per_tournament: 23.00},
    {id: 110253, num_tournaments: 421, total_players: 2421, name: "Predrag Putic", province: "ON", birth_year: 1901, avg_players_per_tournament: 5.75},
    {id: 106974, num_tournaments: 419, total_players: 9614, name: "Bryan Lamb", province: "ON", birth_year: 1974, avg_players_per_tournament: 22.95},
    {id: 109477, num_tournaments: 404, total_players: 4984, name: "Steve Demmery", province: "ON", birth_year: 1973, avg_players_per_tournament: 12.34},
    {id: 111830, num_tournaments: 384, total_players: 7423, name: "Hal Bond", province: "ON", birth_year: 1959, avg_players_per_tournament: 19.33},
    {id: 108202, num_tournaments: 372, total_players: 8513, name: "Robert Gillanders", province: "ON", birth_year: 1956, avg_players_per_tournament: 22.88},
    {id: 102743, num_tournaments: 371, total_players: 4027, name: "Roy Yearwood", province: "AB", birth_year: 1956, avg_players_per_tournament: 10.85},
    {id: 135072, num_tournaments: 353, total_players: 5468, name: "Vladislav Rekhson", province: "AB", birth_year: 1982, avg_players_per_tournament: 15.49},
    {id: 109502, num_tournaments: 345, total_players: 5346, name: "Micah Hughey", province: "AB", birth_year: 1976, avg_players_per_tournament: 15.50},
    {id: 127489, num_tournaments: 304, total_players: 5183, name: "Patrick McDonald", province: "ON", birth_year: 1959, avg_players_per_tournament: 17.05},
    {id: 152905, num_tournaments: 276, total_players: 3353, name: "Paul Gagne", province: "AB", birth_year: 1964, avg_players_per_tournament: 12.15}
];

document.addEventListener('DOMContentLoaded', function() {
    // Make sure the SVG element exists
    if (!document.getElementById('organizers-svg')) return;

    const margin = {top: 40, right: 220, bottom: 60, left: 150};
    const svg = d3.select("#organizers-svg");
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const tooltip = d3.select("#organizers-tooltip");

    // Group for the visualization content
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by number of tournaments in descending order
    data.sort((a, b) => b.num_tournaments - a.num_tournaments);

    // Set up scales
    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, height])
        .padding(0.3);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.num_tournaments)])
        .range([0, width]);

    // Color scale for provinces
    const colorScale = d3.scaleOrdinal()
        .domain(["ON", "AB", "BC", "PE"])
        .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

    // Create bars
    g.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.name))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.num_tournaments))
        .attr("fill", d => colorScale(d.province))
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.name}</strong><br>
                       Province: ${d.province}<br>
                       Birth Year: ${d.birth_year}<br>
                       Tournaments: ${d.num_tournaments}<br>
                       Total Players: ${d.total_players}<br>
                       Avg. Players/Tournament: ${d.avg_players_per_tournament}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    // Add labels to the right of bars
    g.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("y", d => y(d.name) + y.bandwidth() / 2 + 4)
        .attr("x", d => x(d.num_tournaments) + 10)
        .text(d => d.num_tournaments)
        .attr("text-anchor", "start")
        .attr("fill", "black");

    // Add a second set of bars for average players per tournament
    g.selectAll(".avg-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "avg-circle")
        .attr("cy", d => y(d.name) + y.bandwidth() / 2)
        .attr("cx", d => x(d.num_tournaments) + 70)
        .attr("r", d => Math.sqrt(d.avg_players_per_tournament) * 3)
        .attr("fill", d => "rgba(0, 0, 0, 0.4)")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.name}</strong><br>
                       Average Players per Tournament: ${d.avg_players_per_tournament}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    // Add labels for the average player circles
    g.selectAll(".avg-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "avg-label")
        .attr("y", d => y(d.name) + y.bandwidth() / 2 + 4)
        .attr("x", d => x(d.num_tournaments) + 100)
        .text(d => d.avg_players_per_tournament)
        .attr("text-anchor", "start")
        .attr("fill", "black");
    
    // Add axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .append("text")
        .attr("fill", "#000")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .text("Number of Tournaments");

    g.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("text-anchor", "end");

    // Add legend for the circles
    svg.append("text")
        .attr("x", margin.left + width + 60)
        .attr("y", margin.top + 20)
        .text("Circle Size: Avg Players/Tournament")
        .attr("text-anchor", "middle");
});

