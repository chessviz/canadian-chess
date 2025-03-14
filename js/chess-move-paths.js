d3v3.json('data/pgns/noritsyn-2024_stats.json', function(err, data) {
    var movePaths = new ChessDataViz.MovePaths('#movepaths', null, data.moves);
  });