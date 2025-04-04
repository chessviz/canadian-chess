// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing globe");

  let worldmap; // Declare a variable to store the data.

  // Get references to containers
  const mapContainer = document.getElementById("map-container");
  const bioContainer = document.getElementById("player-bio-container");
  const bioName = document.getElementById("bio-name");
  const bioText = document.getElementById("bio-text");

  // Player biography data
  const playerBios = {
    aaron: {
      name: "Aaron Reeve Mendes",
      bio: "Aaron Reeve Mendes (born September 2012) is a rising chess prodigy who began playing at the age of five in India before immigrating to Mississauga, Canada, in 2021. Known for his tactical creativity and strategic skill, he became the youngest Canadian to defeat a grandmaster at 9 years old in 2022 and earned the International Master title in 2024 after winning gold in the Under-18 category at the North American Youth Chess Championship. Mentored by grandmasters Stany G.A., Swayams Mishra, and Arjun Kalyan, Aaron is ranked as the world’s second-youngest IM and the No. 2 player under 12, marking him as a global talent in the chess world.",
    },
    nikolay: {
      name: "Nikolay Noritsyn",
      bio: "Nikolay Noritsyn (born May 1991) is a Russian-born Canadian International Master and chess coach who moved to Canada in 2001. He won the Canadian Closed Championship in 2007, earning his IM title, and has represented Canada in multiple Chess Olympiads. Known for his aggressive play and deep opening preparation, his CFC rating progression, displayed on the right, started high as it reflects only his games played in Canada, following an international chess career that began before his immigration.",
    },
  };

  // Make the dimensions responsive to the container
  // Use a responsive approach based on container width
  const containerWidth = mapContainer.clientWidth;
  const width = Math.min(450, containerWidth * 0.85);
  const height = width * 0.7;

  console.log("Using dimensions:", width, "x", height);

  // init the drawing area
  let svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "mx-auto d-block"); // Bootstrap classes for horizontal centering

  // Calculate zoom factor based on height, with improved proportions
  let baseScale = 170; // Reduced scale to make globe smaller
  let zoomFactor = Math.min(height, width) / 400; // Adjusted divisor
  let scaleFactor = baseScale * zoomFactor;

  // Create a projection
  let projection = d3
    .geoOrthographic()
    .translate([width / 2, height / 2])
    .scale(scaleFactor);

  // Define a geo generator and pass projection to it
  let path = d3.geoPath().projection(projection);

  // Create layers for proper rendering order
  const globeLayer = svg.append("g").attr("class", "globe-layer");
  const countryLayer = svg.append("g").attr("class", "country-layer");
  const connectionsGroup = svg.append("g").attr("class", "connections-layer");

  // Add dragging behavior for interactivity
  let dragging = false;
  let lastPosition = { x: 0, y: 0 };

  // Animation variables - define these variables early
  let animationInProgress = false;
  let animationComplete = false;

  // Add sphere to mimic the ocean and the globe
  globeLayer
    .append("path")
    .datum({ type: "Sphere" })
    .attr("fill", "#ADDEFF")
    .attr("stroke", "rgba(129,129,129,0.35)")
    .attr("d", path);

  // Define connections data - source and target countries
  const connections = [
    {
      source: "India",
      target: "Canada",
      value: 100,
      id: "india-canada",
      playerId: "aaron",
      color: "#2196F3", // Blue color for Aaron
    },
    {
      source: "Russia",
      target: "Canada",
      value: 85,
      id: "russia-canada",
      playerId: "nikolay",
      color: "#FF5722", // Red color for Nikolay
    },
    // Add more connections as needed
  ];

  // Track active connections
  let activeConnections = []; // Start with no connections active (empty array)

  // Remove existing connection controls if present (the buttons we're replacing)
  d3.select(".connection-controls").remove();

  // Initialize portrait buttons
  setupPortraitButtons();

  function setupPortraitButtons() {
    // Get references to the portrait buttons
    const aaronPortrait = document.getElementById("aaron-portrait");
    const nikolayPortrait = document.getElementById("nikolay-portrait");

    if (aaronPortrait) {
      aaronPortrait.addEventListener("click", function () {
        // Clear active state from both portraits
        document.querySelectorAll(".player-portrait").forEach((portrait) => {
          portrait.classList.remove("active");
        });

        // Set active state to this portrait
        this.classList.add("active");

        // Find the connection for Aaron
        const connection = connections.find(
          (conn) => conn.id === "india-canada"
        );

        if (connection) {
          // Show player bio
          showPlayerBio(connection.playerId);

          // Set active connection and animate
          activeConnections = [connection];
          animateConnections();
        }
      });
    }

    if (nikolayPortrait) {
      nikolayPortrait.addEventListener("click", function () {
        // Clear active state from both portraits
        document.querySelectorAll(".player-portrait").forEach((portrait) => {
          portrait.classList.remove("active");
        });

        // Set active state to this portrait
        this.classList.add("active");

        // Find the connection for Nikolay
        const connection = connections.find(
          (conn) => conn.id === "russia-canada"
        );

        if (connection) {
          // Show player bio
          showPlayerBio(connection.playerId);

          // Set active connection and animate
          activeConnections = [connection];
          animateConnections();
        }
      });
    }
  }

  // Function to show player bio
  function showPlayerBio(playerId) {
    const playerData = playerBios[playerId];

    if (playerData) {
      // Set content first
      bioName.textContent = playerData.name;
      bioText.textContent = playerData.bio;

      // Remove existing player classes
      bioContainer.classList.remove("aaron", "nikolay");
      // Add player-specific class
      bioContainer.classList.add(playerId);

      // Show container with enhanced animation
      bioContainer.style.display = "block";
      bioContainer.style.transform = "translateY(10px)";

      // Trigger animation after a tiny delay to ensure display change is processed
      setTimeout(() => {
        bioContainer.style.opacity = "1";
        bioContainer.style.transform = "translateY(0)";
      }, 10);
    } else {
      hidePlayerBio();
    }
  }

  // Function to hide player bio
  function hidePlayerBio() {
    bioContainer.style.opacity = "0";
    bioContainer.style.transform = "translateY(10px)";

    setTimeout(() => {
      bioContainer.style.display = "none";
    }, 500); // Match the CSS transition duration
  }

  // Function to find country centroid by name
  function findCountryCentroid(countryName) {
    if (!worldmap) return null;

    const countries = topojson.feature(
      worldmap,
      worldmap.objects.countries
    ).features;
    const country = countries.find((c) => c.properties.name === countryName);

    if (!country) {
      console.warn(`Country not found: ${countryName}`);
      return null;
    }

    // Calculate the centroid of the country
    return d3.geoCentroid(country);
  }

  // Function to find country element by name
  function findCountryElement(countryName) {
    return countryLayer.selectAll(".country").filter(function (d) {
      return d.properties && d.properties.name === countryName;
    });
  }

  // Function to highlight a country
  function highlightCountry(countryName, color, isSource = false) {
    const countryElement = findCountryElement(countryName);
    if (!countryElement.empty()) {
      // Add both CSS class and direct fill attribute for better control
      countryElement
        .classed(isSource ? "highlight-source" : "highlight-target", true)
        .transition()
        .duration(500)
        .attr("fill", color);
    } else {
      console.warn(
        `Country element not found for highlighting: ${countryName}`
      );
    }
  }

  // Function to reset country highlighting
  function resetCountryHighlights() {
    countryLayer
      .selectAll(".country")
      .classed("highlight-source", false)
      .classed("highlight-target", false)
      .transition()
      .duration(500)
      .attr("fill", "#95B2B8"); // Reset all countries to default color
  }

  // Function to check if a point is visible on the globe
  function pointVisible(point) {
    const r = projection.rotate();
    const c = [-r[0], -r[1]];
    return d3.geoDistance(point, c) < Math.PI / 2;
  }

  // Function to draw connection lines between countries with animation
  function updateConnections(animate = false) {
    connectionsGroup.selectAll("*").remove();

    // If animation is in progress, don't redraw until complete
    if (animationInProgress && !animationComplete) return;

    activeConnections.forEach((conn) => {
      const sourcePoint = findCountryCentroid(conn.source);
      const targetPoint = findCountryCentroid(conn.target);

      if (!sourcePoint || !targetPoint) return;

      // Create a GeoJSON LineString for a great circle arc
      const arcData = {
        type: "LineString",
        coordinates: [sourcePoint, targetPoint],
      };

      // Draw the arc with player-specific color
      const arcPath = connectionsGroup
        .append("path")
        .datum(arcData)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", conn.color) // Use connection-specific color
        .attr("stroke-width", 2)
        .attr("stroke-opacity", animate ? 0 : 0.7)
        .attr("class", "connection-line");

      // Add origin marker
      const sourceVisible = pointVisible(sourcePoint);
      if (sourceVisible) {
        const projectedSource = projection(sourcePoint);
        if (projectedSource) {
          connectionsGroup
            .append("circle")
            .attr("cx", projectedSource[0])
            .attr("cy", projectedSource[1])
            .attr("r", animate ? 0 : 5)
            .attr("fill", "#FFC107")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("class", "connection-point")
            .append("title")
            .text(conn.source);
        }
      }

      // Add destination marker if not animating
      const targetVisible = pointVisible(targetPoint);
      if (targetVisible && !animate) {
        const projectedTarget = projection(targetPoint);
        if (projectedTarget) {
          connectionsGroup
            .append("circle")
            .attr("cx", projectedTarget[0])
            .attr("cy", projectedTarget[1])
            .attr("r", 5)
            .attr("fill", "#4CAF50")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("class", "connection-point")
            .append("title")
            .text(conn.target);
        }
      }
    });
  }

  // Function to animate connections with globe rotation
  function animateConnections() {
    // Reset animation state
    animationInProgress = true;
    animationComplete = false;
    connectionsGroup.selectAll("*").remove();

    // Reset any previous country highlighting
    resetCountryHighlights();

    // Get first connection for animation
    const conn = activeConnections[0];

    // Find source and target coordinates
    const sourcePoint = findCountryCentroid(conn.source);
    const targetPoint = findCountryCentroid(conn.target);

    if (!sourcePoint || !targetPoint) {
      console.error("Could not find countries for animation");
      animationInProgress = false; // Make sure we don't leave the globe locked
      return;
    }

    // Calculate the rotation that centers the source country
    const sourceRotation = [-sourcePoint[0], -sourcePoint[1]];

    // First, rotate globe to source country
    const currentRotation = projection.rotate();
    const interpolateRotation = d3.interpolate(currentRotation, sourceRotation);

    // Important: No arc is created during this first rotation to source
    d3.transition()
      .duration(800)
      .tween("rotate", function () {
        return function (t) {
          projection.rotate(interpolateRotation(t));
          // Redraw globe and countries
          globeLayer.selectAll("path").attr("d", path);
          countryLayer.selectAll("path").attr("d", path);
        };
      })
      .on("end", function () {
        // Highlight source country
        highlightCountry(conn.source, "#FFC107", true);

        // Save source marker globally so we can restore it later
        let sourceMarker = null;

        // Add source marker with animation
        const projectedSource = projection(sourcePoint);
        if (projectedSource) {
          sourceMarker = connectionsGroup
            .append("circle")
            .attr("cx", projectedSource[0])
            .attr("cy", projectedSource[1])
            .attr("r", 0)
            .attr("fill", "#FFC107")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("class", "connection-point source-marker");

          // Ensure marker completes its growth animation
          sourceMarker
            .transition()
            .duration(500)
            .attr("r", 5)
            .on("end", function () {
              // Only after the marker has grown to full size, wait a bit and then proceed
              setTimeout(function () {
                // Hide the source marker during animation
                sourceMarker.style("opacity", 0);

                // Now start the rotation to target
                rotateToTarget();
              }, 500); // Pause for 500ms to show the fully-grown marker before starting next animation
            });
        } else {
          // If we couldn't create the source marker, still proceed with animation after delay
          setTimeout(rotateToTarget, 1000);
        }

        // Move the target rotation code to a separate function
        function rotateToTarget() {
          // Calculate rotation for target
          const targetRotation = [-targetPoint[0], -targetPoint[1]];
          const pathInterpolator = d3.interpolate(
            sourceRotation,
            targetRotation
          );

          // Don't create the arc path yet - we'll create it during animation
          let arcPath = null;
          let arcCreated = false;
          let pathTotalLength = 0;

          // Track the rotation progress to know when to start drawing the arc
          const rotationThreshold = 0.3; // Start drawing arc after 30% of the rotation

          // Animate path from source to target
          d3.transition()
            .duration(1500)
            .tween("rotate", function () {
              return function (t) {
                // Update globe rotation
                projection.rotate(pathInterpolator(t));

                // Redraw globe and countries
                globeLayer.selectAll("path").attr("d", path);
                countryLayer.selectAll("path").attr("d", path);

                // Only create and start drawing the arc once we've rotated enough
                if (t >= rotationThreshold && !arcCreated) {
                  // Create the arc path only when we've rotated enough
                  arcPath = connectionsGroup
                    .append("path")
                    .attr("fill", "none")
                    .attr("stroke", conn.color) // Use connection-specific color
                    .attr("stroke-width", 2.5)
                    .attr("stroke-opacity", 0.8)
                    .attr("class", "connection-line");

                  // Create the initial arc data
                  const arcData = {
                    type: "LineString",
                    coordinates: [sourcePoint, targetPoint],
                  };

                  // Set the initial path
                  arcPath.datum(arcData).attr("d", path);
                  pathTotalLength = arcPath.node().getTotalLength();

                  // Initialize with zero length to hide it
                  arcPath.attr("stroke-dasharray", `0,${pathTotalLength}`);

                  arcCreated = true;
                }

                // If arc is created, update its appearance as we rotate
                if (arcCreated && arcPath) {
                  // Update arc data with new projection
                  const arcData = {
                    type: "LineString",
                    coordinates: [sourcePoint, targetPoint],
                  };
                  arcPath.datum(arcData).attr("d", path);

                  // Get current total length
                  pathTotalLength = arcPath.node().getTotalLength();

                  // Calculate how much of the path to draw based on remaining rotation
                  const drawProgress =
                    (t - rotationThreshold) / (1 - rotationThreshold);

                  if (drawProgress > 0) {
                    // Use stroke-dasharray to reveal only a portion of the path
                    const portionToShow = pathTotalLength * drawProgress;
                    arcPath.attr(
                      "stroke-dasharray",
                      `${portionToShow},${pathTotalLength}`
                    );
                  }
                }
              };
            })
            .on("end", function () {
              // Highlight target country
              highlightCountry(conn.target, "#4CAF50", false);

              // Make sure the arc is fully visible at the end if it exists
              if (arcPath) {
                const arcData = {
                  type: "LineString",
                  coordinates: [sourcePoint, targetPoint],
                };

                // Ensure the full path is visible at the end with the proper color
                arcPath
                  .datum(arcData)
                  .attr("d", path)
                  .attr("stroke-dasharray", null)
                  .attr("stroke-opacity", 0.8)
                  .attr("stroke", conn.color); // Ensure color is applied
              }

              // Add target marker immediately (no delay)
              const projectedTarget = projection(targetPoint);
              if (projectedTarget) {
                connectionsGroup
                  .append("circle")
                  .attr("cx", projectedTarget[0])
                  .attr("cy", projectedTarget[1])
                  .attr("r", 0) // Start small
                  .attr("fill", "#4CAF50") // Match target country highlight color
                  .attr("stroke", "#fff")
                  .attr("stroke-width", 1)
                  .attr("class", "connection-point target-marker")
                  .transition()
                  .duration(300) // Shorter animation
                  .attr("r", 5); // Grow to full size
              }

              // Show source marker again with its new position
              setTimeout(() => {
                // Reposition the source marker to its new location after rotation
                if (sourceMarker) {
                  const newSourcePos = projection(sourcePoint);
                  if (newSourcePos && pointVisible(sourcePoint)) {
                    sourceMarker
                      .attr("cx", newSourcePos[0])
                      .attr("cy", newSourcePos[1])
                      .style("opacity", 1); // Make it visible again
                  }
                }

                // Mark animation as complete
                animationInProgress = false;
                animationComplete = true;
              }, 100);
            });
        }
      });
  }

  // Process the world map data when it's loaded
  function renderMap() {
    if (!worldmap) return;

    let world = topojson.feature(worldmap, worldmap.objects.countries).features;

    // Create a lookup object for country names by ID
    const countryNameById = {};
    world.forEach((country) => {
      if (country.id && country.properties && country.properties.name) {
        countryNameById[country.id] = country.properties.name;
      }
    });

    // Draw countries
    let countries = countryLayer
      .selectAll(".country")
      .data(world)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#95B2B8") // Default color for all countries
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("class", "country")
      .attr("data-name", (d) => d.properties.name)
      .each(function (d) {
        // Add country name as id for easier debugging
        if (d.properties && d.properties.name) {
          d3.select(this).attr(
            "id",
            "country-" + d.properties.name.replace(/\s+/g, "-").toLowerCase()
          );
        }
      });

    // Remove the automatic animation trigger
    // The user will now need to click on a portrait to start the animation
  }

  // Load the map data
  console.log("Fetching map data...");
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
    .then(function (data) {
      console.log("Map data loaded successfully");
      worldmap = data;
      renderMap();
    })
    .catch(function (error) {
      console.error("Error loading the JSON data:", error);
    });

  // Define a SINGLE drag behavior for the globe
  // Remove the previous definition that was conflicting
  svg.call(
    d3
      .drag()
      .on("start", function (event) {
        if (!animationInProgress) {
          dragging = true;
          lastPosition.x = event.x;
          lastPosition.y = event.y;
        }
      })
      .on("drag", function (event) {
        if (dragging && !animationInProgress) {
          // Adjust rotation speed
          const rotationSensitivity = 0.3;

          // Calculate rotation based on mouse movement
          const dx = event.x - lastPosition.x;
          const dy = event.y - lastPosition.y;

          // Update projection rotation
          const rotation = projection.rotate();
          projection.rotate([
            rotation[0] + dx * rotationSensitivity,
            rotation[1] - dy * rotationSensitivity,
          ]);

          // Update last position
          lastPosition.x = event.x;
          lastPosition.y = event.y;

          // Redraw all elements with updated projection
          globeLayer.selectAll("path").attr("d", path);
          countryLayer.selectAll("path").attr("d", path);

          // Redraw connections when rotating
          updateConnections();
        }
      })
      .on("end", function () {
        dragging = false;
      })
  );
});
