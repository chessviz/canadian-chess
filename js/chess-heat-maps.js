// d3v3.json('data/pgns/all-games-san_stats.json', function(err, data) {

d3v3.json('data/pgns/noritsyn-2024_stats.json', function(err, data) {
    var heatmapExample1 = new ChessDataViz.HeatMap('#heatmap-example-1', null, data.heatmaps.squareUtilization);
});

