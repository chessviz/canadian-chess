# Chess Viz

###### Final Project for CSC316 (Data Visualization Class at the University of Toronto) 
Dataset: The 2025 January Canadian Chess Federation dataset, 2025 CanBase January Update
<br/> Team Members: Victor Zheng, Andy Feng, Harsh Bawja

###### Overview
Code is all stored in the root directory. There is a css, data, img, js folders for the code. `index.html` is deployed using GitHub Actions to our [website](https://chessviz.github.io/canadian-chess/), enabling CI/CD. The data folder also contains the `scripts` folder which we used for manipulating and cleaning the data. We also have under the `pgns` folder game data for the players. 


###### References and Acknowledgements
- [chess-dataviz](https://github.com/ebemunk/chess-dataviz) library
- [pgn-extract](https://www.cs.kent.ac.uk/people/staff/djb/pgn-extract/) for extracting pgn games
- [CanBase](https://canbase.fqechecs.qc.ca/players.htm) for Canadian master games
- [Chess Federation of Canada](http://chess.ca/) for chess membership and player history
- [Chess Federation of Canada Newsletter](https://www.facebook.com/ChessCanada/photos) for Canadian Chess photos
- [GeoNames.org](https://www.geonames.org/postal-codes/) for geographic coordinate data in reference to postal codes in our original dataset
- [opendatasoft](https://data.opendatasoft.com/explore/dataset/georef-canada-province%40public/export/?disjunctive.prov_name_en) for geojson data of Canadian provinces and territories
- [world-atlas](https://github.com/topojson/world-atlas) for topojson file of world countries

###### Libraries Used:
<ul>
<li>Bootstrap (basic CSS)</li>
<li>FullPage (HTML structure)</li>
<li>Chess-dataviz (pre-built d3 modules)</li>
</ul>


###### Relevant Links: 
Live site at [chessviz.github.io/canadian-chess/](https://chessviz.github.io/canadian-chess/)

Video Demo on [YouTube](https://www.youtube.com/watch?v=hX2T-h_Kodw) and also available [here](docs/316-demo.mp4).

Project book that documents every step and design decision of your final project [project-book](docs/project-book.pdf).
