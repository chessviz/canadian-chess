/**
 * Canadian Chess Masters & Tournaments Map Visualization
 *
 * This script creates an interactive map of Canada showing:
 * - Tournament distribution by province
 * - National Masters locations
 * - Interactive tables of top cities and organizers
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // ==================== INITIALIZATION ====================

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

  // Global variables for data storage
  let tournamentCounts = {};
  let mastersCityProvinceData = [];
  let organizersData = [];

  // ==================== EVENT HANDLERS ====================

  // Add click handler to map to reset tables when clicking outside provinces
  map.on("click", function () {
    // Reset the tables to show all of Canada
    createTopCitiesTable();
    createTopOrganizersTable();
  });

  // Keep masters on top when zooming/panning
  map.on("moveend", function () {
    mastersLayer.bringToFront();
  });

  // ==================== INITIALIZATION SEQUENCE ====================

  // Add legend to the map
  addLegend(map);

  // Start data loading sequence
  loadTournamentData();
  loadNationalMastersData();
  loadOrganizersData();

  // ==================== MAPPING FUNCTIONS ====================

  /**
   * Adds a color-coded legend to the map
   */
  function addLegend(map) {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const grades = [0, 100, 500, 1000, 2000, 5000, 10000];
      const labels = [];

      // Add small heading
      div.innerHTML = "<h6>Tournaments</h6>";

      // Loop through intervals and generate labels
      for (let i = 0; i < grades.length; i++) {
        const from = grades[i];
        const to = grades[i + 1];

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

  /**
   * Adds the masters layer after provinces are loaded
   */
  function addMastersLayer() {
    mastersLayer.addTo(map);
    loadMastersData();
  }

  /**
   * Loads province data from GeoJSON and adds it to the map
   */
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

  /**
   * Load chess masters location data and add to map
   */
  function loadMastersData() {
    d3.csv("data/masters_locations.csv")
      .then((data) => {
        data.forEach((location) => {
          const lat = parseFloat(location.latitude);
          const lon = parseFloat(location.longitude);
          const count = parseInt(location.count);

          if (!isNaN(lat) && !isNaN(lon) && !isNaN(count)) {
            // Size calculation based on number of masters
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
      })
      .catch((error) => {
        console.error("Error loading masters data:", error);
      });
  }

  // ==================== DATA LOADING FUNCTIONS ====================

  /**
   * Load and process tournament data from CSV
   */
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

  /**
   * Load and process national masters data from CSV
   */
  function loadNationalMastersData() {
    d3.csv("data/national_masters.csv")
      .then((data) => {
        // Store masters by city and province
        mastersCityProvinceData = [];

        data.forEach((master) => {
          const city = master.city;
          const province = master.province;

          if (city && city.trim() !== "") {
            // Check if we've already registered this city-province pair
            const existingEntry = mastersCityProvinceData.find(
              (entry) => entry.city === city && entry.province === province
            );

            if (existingEntry) {
              existingEntry.count++;
            } else {
              mastersCityProvinceData.push({
                city: city,
                province: province,
                count: 1,
              });
            }
          }
        });

        // Create and display the top cities table
        createTopCitiesTable();
      })
      .catch((error) => {
        console.error("Error loading national masters data:", error);
      });
  }

  /**
   * Load and process organizers data from CSV
   */
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

  // ==================== VISUALIZATION FUNCTIONS ====================

  /**
   * Create a table of the top 10 cities with the most masters
   * @param {string|null} provinceFilter - Optional province code to filter by
   */
  function createTopCitiesTable(provinceFilter = null) {
    // Filter cities by province if provided
    let filteredCities;
    if (provinceFilter) {
      filteredCities = mastersCityProvinceData
        .filter((entry) => entry.province === provinceFilter)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } else {
      // Convert city counts object to sorted array for all of Canada
      const cityTotals = {};
      mastersCityProvinceData.forEach((entry) => {
        cityTotals[entry.city] = (cityTotals[entry.city] || 0) + entry.count;
      });

      filteredCities = Object.entries(cityTotals)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Get the container for the table
    const tableContainer = document.getElementById("top-masters-cities");
    if (!tableContainer) return;

    // Set the table title based on whether we're filtering by province
    const tableTitle = provinceFilter
      ? `Top Cities with Most National Masters in ${getProvinceFullName(
          provinceFilter
        )}`
      : "Top Cities with Most Canadian National Masters";

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
    filteredCities.forEach((city, index) => {
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

  /**
   * Create a table of the top 10 organizers
   * @param {string|null} provinceFilter - Optional province code to filter by
   */
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
      ? `Top Tournament Organizers in ${getProvinceFullName(provinceFilter)}`
      : "Top Tournament Organizers in Canada";

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

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Convert province code to full name
   */
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

  /**
   * Style provinces based on tournament count
   */
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

  /**
   * Set up interactions for each province
   */
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

    // Add click event to update both tables
    layer.on("click", function (e) {
      if (provinceCode) {
        createTopCitiesTable(provinceCode);
        createTopOrganizersTable(provinceCode);

        // Prevent the click from propagating to the map
        L.DomEvent.stopPropagation(e);
      }
    });
  }

  /**
   * Get color based on tournament count
   */
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
