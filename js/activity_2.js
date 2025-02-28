activity2();

function activity2() {
	// Initial log to confirm the file is connected properly
	console.log('Hello from your activity 2 js file. Good luck with the labold!');

	// Retrieve the full list of attractions to start the filtering process
	let attractions = attractionData;
	console.log('List of attractions:', attractions);

    // for each portion
    attractions.forEach(function(attraction) {
        // if more than 10 million visitors, then log the names
        if (attraction.Visitors>10000000){
            console.log("Attraction is > 10 mil " + attraction.Location);
        }
    });

    filteredData = attractions.filter(attraction => attraction.Visitors>10000000)

    // shallowCopy = filteredData.map(attr => attr)
    shallowCopy = filteredData.map(attr => attr)

    filteredAttractionsByVisitors = shallowCopy.sort(function(a, b){return a.Visitors - b.Visitors});
    filteredAttractionsByVisitors.reverse()
}
