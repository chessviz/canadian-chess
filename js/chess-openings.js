	// d3v3.json('data/pgns/noritsyn-2024_stats.json', function(err, data) {

d3v3. json('data/pgns/noritsyn-2024_stats.json', function(err, data) {
	var openings = new ChessDataViz.Openings('#openings', {
	  arcThreshold: 0.002,
	  textThreshold: 0.03,
	  colors: d3v3. scale.ordinal().range(['cyan', 'gold', 'steelblue', 'gray'])
	}, data.openings);
  
	openings.dispatch
	  .on('mouseenter', function(d, moves) {
		d3v3. select('#variation').text(moves.join(' '));
		var percent = d.value / data.openings.value * 100;
		percent = percent.toFixed(2);
		d3v3. select('#percentage').text(percent + '%');
	  })
	  .on('mouseleave', function() {
		d3v3. select('#variation').text('');
		d3v3. select('#percentage').text('');
	  });
  
	var allButton = d3v3. select('#all');
	var d4Button = d3v3. select('#d4');
  
	allButton.on('click', function() {
	  allButton.classed('button-primary', true);
	  d4Button.classed('button-primary', false);
	  openings.data(data.openings);
	});
	d4Button.on('click', function() {
	  allButton.classed('button-primary', false);
	  d4Button.classed('button-primary', true);
	  openings.data(data.openings.children[1]);
	});
  });