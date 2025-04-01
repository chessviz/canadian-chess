// Canadian Chess Masters & Tournaments Map

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the map centered on Canada
  const map = L.map("leaflet-map-container").setView([56.13, -106.35], 4);

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Create layer groups to manage different data visualizations
  const provincesLayer = L.layerGroup().addTo(map);
  const mastersLayer = L.layerGroup();

  // Add legend to the map
  addLegend(map);

  // Global variable to store tournament counts by province
  let tournamentCounts = {};

  // Global variable to store masters counts by city
  let mastersCityCounts = {};

  // Global variable to store organizer data
  let organizersData = [];

  // Start data loading sequence
  loadTournamentData();
  loadNationalMastersData();
  loadOrganizersData();

  // Function to add a legend to the map
  function addLegend(map) {
    // Change position to bottomleft
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const grades = [0, 100, 500, 1000, 2000, 5000, 10000];
      const labels = [];
      let from, to;

      // Add small heading
      div.innerHTML = "<h6>Tournaments</h6>";

      // Loop through intervals and generate labels
      for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
          '<i style="background:' +
            getColor(from + 1) +
            '"></i> ' +
            from +
            (to ? "&ndash;" + to : "+")
        );
      }

      div.innerHTML += labels.join("<br>");
      return div;
    };

    legend.addTo(map);

    // Update CSS for legend styling
    const style = document.createElement("style");
    style.textContent = `
      .legend h6 {
        margin: 0 0 5px;
        font-size: 12px;
        text-align: center;
        font-weight: bold;
      }
      .legend i {
        width: 16px;
        height: 16px;
        float: left;
        margin-left: 5px;
        margin-right:5px;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }

  // Add masters layer after provinces are loaded
  function addMastersLayer() {
    mastersLayer.addTo(map);
    loadMastersData();
  }

  // Function to load province data from GeoJSON
  function loadProvinceData() {
    d3.json("data/georef-canada-province@public.geojson")
      .then((data) => {
        // Create a mapping between province names in GeoJSON and province codes
        const provinceLookup = {
          Alberta: "AB",
          "British Columbia": "BC",
          Manitoba: "MB",
          "New Brunswick": "NB",
          "Newfoundland and Labrador": "NL",
          "Nova Scotia": "NS",
          "Northwest Territories": "NT",
          Nunavut: "NU",
          Ontario: "ON",
          "Prince Edward Island": "PE",
          Quebec: "QC",
          Saskatchewan: "SK",
          Yukon: "YT",
        };

        // Add GeoJSON layer with styling and interaction
        L.geoJSON(data.features, {
          style: function (feature) {
            const provinceName = feature.properties.prov_name_en;
            const provinceCode = provinceLookup[provinceName];
            const count = provinceCode
              ? tournamentCounts[provinceCode] || 0
              : 0;
            return styleProvince(count);
          },
          onEachFeature: onEachProvince,
        }).addTo(provincesLayer);

        addMastersLayer();
      })
      .catch((error) => {
        console.error("Error loading province data:", error);
        addMastersLayer();
      });
  }

  // Function to load chess masters location data
  function loadMastersData() {
    d3.csv("data/masters_locations.csv")
      .then((data) => {
        data.forEach((location) => {
          const lat = parseFloat(location.latitude);
          const lon = parseFloat(location.longitude);
          const count = parseInt(location.count);

          if (!isNaN(lat) && !isNaN(lon) && !isNaN(count)) {
            // Increased size calculation - was: Math.min(count * 3, 15)
            const size = Math.min(count * 5, 20);
            const marker = L.marker([lat, lon], {
              icon: L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background-color: #d53e4f; width: ${
                  size * 2
                }px; height: ${
                  size * 2
                }px; border-radius: 50%; border: 1px solid white;"></div>`,
                iconSize: [size * 2, size * 2],
                iconAnchor: [size, size],
              }),
              zIndexOffset: 1000,
            }).addTo(mastersLayer);

            marker.bindTooltip(
              `<strong>${location.place_name}</strong><br>
                        National Masters: ${count}`
            );
          }
        });

        // Ensure masters layer is on top
        mastersLayer.bringToFront();

        // Keep masters on top when zooming/panning
        map.on("moveend", function () {
          mastersLayer.bringToFront();
        });
      })
      .catch((error) => {
        console.error("Error loading masters data:", error);
      });
  }

  // Function to load and process tournament data
  function loadTournamentData() {
    d3.csv("data/event.csv")
      .then((data) => {
        // Count tournaments by province
        tournamentCounts = {};
        data.forEach((event) => {
          const provinceCode = event.province;
          if (provinceCode) {
            tournamentCounts[provinceCode] =
              (tournamentCounts[provinceCode] || 0) + 1;
          }
        });

        loadProvinceData();
      })
      .catch((error) => {
        console.error("Error loading tournament data:", error);
      });
  }

  // Function to load and process national masters data
  function loadNationalMastersData() {
    d3.csv("data/national_masters.csv")
      .then((data) => {
        // Count masters by city
        mastersCityCounts = {};
        data.forEach((master) => {
          const city = master.city;
          if (city && city.trim() !== "") {
            mastersCityCounts[city] = (mastersCityCounts[city] || 0) + 1;
          }
        });

        // Create and display the top cities table
        createTopCitiesTable();
      })
      .catch((error) => {
        console.error("Error loading national masters data:", error);
      });
  }

  // Function to load and process organizers data
  function loadOrganizersData() {
    d3.csv("data/top_organizers.csv")
      .then((data) => {
        // Store organizers data
        organizersData = data.map((d) => ({
          name: d.name,
          totalPlayers: +d.total_players,
          province: d.province,
        }));

        // Create and display the top organizers table for all of Canada
        createTopOrganizersTable();
      })
      .catch((error) => {
        console.error("Error loading organizers data:", error);
      });
  }

  // Function to create a table of the top 10 cities with the most masters
  function createTopCitiesTable() {
    // Convert city counts object to sorted array
    let citiesArray = Object.entries(mastersCityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    // Get the container for the table
    const tableContainer = document.getElementById("top-masters-cities");
    if (!tableContainer) return;

    // Create the table HTML with enhanced styling
    let tableHTML = `
      <table class="table table-hover table-bordered masters-table">
        <thead class="table-primary">
          <tr>
            <th scope="col" class="text-center" style="width: 70px;">Rank</th>
            <th scope="col">City</th>
            <th scope="col" class="text-center" style="width: 150px;">National Masters</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Add rows for each city with consistent styling
    citiesArray.forEach((city, index) => {
      const rank = index + 1;

      tableHTML += `
        <tr>
          <td class="text-center">
            <span class="badge rounded-pill bg-primary">${rank}</span>
          </td>
          <td><strong>${city.city}</strong></td>
          <td class="text-center">${city.count}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    // Insert the table into the container
    tableContainer.innerHTML = tableHTML;
  }

  // Function to create a table of the top 10 organizers
  function createTopOrganizersTable(provinceFilter = null) {
    // Filter organizers by province if provided
    let filteredOrganizers = provinceFilter
      ? organizersData.filter((org) => org.province === provinceFilter)
      : organizersData;

    // Sort by total players and get top 10
    let topOrganizers = filteredOrganizers
      .sort((a, b) => b.totalPlayers - a.totalPlayers)
      .slice(0, 10);

    // Get the container for the table
    const tableContainer = document.getElementById("top-organizers");
    if (!tableContainer) return;

    // Set the table title based on whether we're filtering by province
    const tableTitle = provinceFilter
      ? `Top 10 Organizers in ${getProvinceFullName(provinceFilter)}`
      : "Top 10 Organizers in Canada";

    // Create the table HTML with enhanced styling
    let tableHTML = `
      <table class="table table-hover table-bordered organizers-table">
        <thead class="table-success">
          <tr>
            <th scope="col" class="text-center" style="width: 70px;">Rank</th>
            <th scope="col">Organizer</th>
            <th scope="col" class="text-center" style="width: 160px;">Registered Players</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Add rows for each organizer with consistent styling
    topOrganizers.forEach((organizer, index) => {
      const rank = index + 1;

      tableHTML += `
        <tr>
          <td class="text-center">
            <span class="badge rounded-pill bg-success">${rank}</span>
          </td>
          <td><strong>${organizer.name}</strong></td>
          <td class="text-center">${organizer.totalPlayers.toLocaleString()}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    // Insert the table into the container with the title
    tableContainer.innerHTML = `
      <div class="card-header bg-light">
        <h4 class="mb-0">${tableTitle}</h4>
      </div>
      <div class="card-body">
        ${tableHTML}
      </div>
    `;
  }

  // Helper function to convert province code to full name
  function getProvinceFullName(provinceCode) {
    const provinceNames = {
      AB: "Alberta",
      BC: "British Columbia",
      MB: "Manitoba",
      NB: "New Brunswick",
      NL: "Newfoundland and Labrador",
      NS: "Nova Scotia",
      NT: "Northwest Territories",
      NU: "Nunavut",
      ON: "Ontario",
      PE: "Prince Edward Island",
      QC: "Quebec",
      SK: "Saskatchewan",
      YT: "Yukon",
    };
    return provinceNames[provinceCode] || provinceCode;
  }

  // Function to style provinces based on tournament count
  function styleProvince(count) {
    return {
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.5,
      fillColor: getColor(count),
    };
  }

  // Function to handle interactions with each province
  function onEachProvince(feature, layer) {
    const provinceName = feature.properties.prov_name_en;
    const provinceLookup = {
      Alberta: "AB",
      "British Columbia": "BC",
      Manitoba: "MB",
      "New Brunswick": "NB",
      "Newfoundland and Labrador": "NL",
      "Nova Scotia": "NS",
      "Northwest Territories": "NT",
      Nunavut: "NU",
      Ontario: "ON",
      "Prince Edward Island": "PE",
      Quebec: "QC",
      Saskatchewan: "SK",
      Yukon: "YT",
    };
    const provinceCode = provinceLookup[provinceName];
    const count = provinceCode ? tournamentCounts[provinceCode] || 0 : 0;

    // Add popup with province name and tournament count
    layer.bindPopup(
      `<strong>${provinceName}</strong><br>Tournaments: ${count}`
    );

    // Add click event to update the organizers table
    layer.on("click", function () {
      if (provinceCode) {
        createTopOrganizersTable(provinceCode);
      }
    });
  }

  // Function to get color based on tournament count
  function getColor(count) {
    return count > 10000
      ? "#800026"
      : count > 5000
      ? "#BD0026"
      : count > 2000
      ? "#E31A1C"
      : count > 1000
      ? "#FC4E2A"
      : count > 500
      ? "#FD8D3C"
      : count < 100
      ? "#FEB24C"
      : "#FFEDA0";
  }
});
