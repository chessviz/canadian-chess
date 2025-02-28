updateChart();

function updateChart() {
	// Initial log to confirm the file is connected properly
	console.log('Hello from your activity 3 js file. Good luck with the labold!');

	// Retrieve the full list of attractions to start the filtering process
	let attractions = attractionData;
	console.log('List of attractions:', attractions);

     // get attraction category before filtering
     let selectBox = document.getElementById('attraction-category');    
     let selectedValue = selectBox.value;
     console.log("Selected category:", selectedValue);

     if (selectedValue === "all"){
          filteredData = attractions.map(attr => attr)
     }
     else{
          filteredData = attractions.filter(att => att.Category === selectedValue)
     }

     filteredAttractionsByVisitors = filteredData.sort(function(a, b){return a.Visitors - b.Visitors});
     filteredAttractionsByVisitors.reverse()


     top5 = filteredAttractionsByVisitors.slice(0,5)

     renderBarChart(top5)
}

