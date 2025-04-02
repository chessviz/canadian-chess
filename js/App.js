/**
 * App.js
 * Main application script for Canadian Chess Federation Visualizations
 * Fixed to ensure funnel visualization appears reliably
 */

// Main application class
class ChessFederationApp {
  constructor() {
    // DOM Elements
    this.fullpageContainer = document.getElementById("fullpage");

    // Visualization instances
    this.visualizations = {
      title: null,
      guess: null,
      grid: null,
      hourglass: null,
      players: null,
      map: null,
      masters: null,
    };

    // State
    this.currentSection = null;
    this.fullpageApi = null;
    this.isInitialized = false;

    // Bind methods
    this.initFullpage = this.initFullpage.bind(this);
    this.initVisualizations = this.initVisualizations.bind(this);
    this.handleSectionChange = this.handleSectionChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);
    this.ensureHourglassVisible = this.ensureHourglassVisible.bind(this);
  }

  // Initialize the application
  init() {
    console.log("Initializing Chess Federation App");

    // Load Matter.js first to ensure it's available
    this.loadMatterJs()
      .then(() => {
        // Initialize fullpage.js
        this.initFullpage();

        // Initialize visualizations
        this.initVisualizations();

        // Add event listeners
        window.addEventListener("resize", this.handleResize);
        document.addEventListener("keydown", this.handleKeypress);

        this.isInitialized = true;
      })
      .catch((err) => {
        // Continue anyway, the visualization has a fallback
        console.warn("Matter.js failed to load:", err);
        this.initFullpage();
        this.initVisualizations();
        window.addEventListener("resize", this.handleResize);
        document.addEventListener("keydown", this.handleKeypress);
        this.isInitialized = true;
      });
  }

  // Load Matter.js
  loadMatterJs() {
    return new Promise((resolve, reject) => {
      if (window.Matter) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";
      script.async = true;

      script.onload = () => {
        console.log("Matter.js loaded");
        resolve();
      };

      script.onerror = (err) => {
        console.error("Failed to load Matter.js:", err);
        reject(err);
      };

      document.head.appendChild(script);

      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!window.Matter) {
          reject(new Error("Matter.js load timeout"));
        }
      }, 5000);
    });
  }

  // Initialize fullpage.js
  initFullpage() {
    if (!this.fullpageContainer) {
      console.error("Fullpage container not found");
      return;
    }

    // Initialize fullpage.js
    this.fullpageApi = new fullpage("#fullpage", {
      // Navigation options
      anchors: [
        "home",
        "guess",
        "grid",
        "hourglass",
        "players",
        "pie",
        "interlude",
        "masters",
        "games",
        "organizers",
        "get-involved",
        "learn",
        "conclusion",
        "about",
      ],
      navigation: true,
      navigationPosition: "right",
      navigationTooltips: [
        "Home",
        "Guess",
        "Distribution",
        "Pyramid",
        "Hourglass",
        "Pie Chart",
        "Interlude",
        "National Masters",
        "Games",
        "Organizers",
        "Get-Involved",
        "Learn",
        "Conclusion",
        "About",
      ],
      showActiveTooltip: true,
      slidesNavigation: true,

      // Scrolling behavior
      autoScrolling: true,
      scrollingSpeed: 1500,
      fitToSection: true,
      scrollOverflow: true,
      scrollOverflowMacStyle: true,
      bigSectionsDestination: "top",

      // On section load callback
      afterLoad: (origin, destination, direction) => {
        this.currentSection = destination.anchor;

        // Make the info container visible when grid section is active
        if (destination.anchor === "grid") {
          const gridInfoContainer = document.getElementById(
            "grid-info-container"
          );
          if (gridInfoContainer) {
            gridInfoContainer.classList.add("visible");
          }
        }

        // Make hourglass panels visible when hourglass section is active
        if (destination.anchor === "hourglass") {
          const hourglassLegend = document.getElementById("hourglass-legend");
          const hourglassExplanation = document.getElementById(
            "chess-explanation-hourglass"
          );

          if (hourglassLegend) hourglassLegend.style.opacity = 1;
          if (hourglassExplanation) hourglassExplanation.style.opacity = 1;

          // Make sure the hourglass SVG is visible
          this.ensureHourglassVisible();
        }

        // Call handleSectionChange after everything else
        this.handleSectionChange(destination.anchor);
      },

      // Special sections handling
      afterResponsive: function (isResponsive) {
        console.log(
          "Responsive mode is now",
          isResponsive ? "active" : "inactive"
        );
      },

      // Special styling options
      responsiveWidth: 800,
      responsiveHeight: 600,

      // Make all sections fit viewport
      verticalCentered: true,
    });

    console.log("Fullpage.js initialized");

    // Store API reference for later use
    window.fullpage_api = this.fullpageApi;
  }

  // Ensure the hourglass SVG is visible and has dimensions
  ensureHourglassVisible() {
    const hourglassSvg = document.getElementById("hourglass-svg");
    if (hourglassSvg) {
      // Make sure it's visible
      hourglassSvg.style.display = "block";
      hourglassSvg.style.width = "100%";
      hourglassSvg.style.height = "100%";
      hourglassSvg.style.position = "absolute";
      hourglassSvg.style.top = "0";
      hourglassSvg.style.left = "0";
      hourglassSvg.style.zIndex = "30";

      // Force a reflow to ensure CSS changes are applied
      hourglassSvg.getBoundingClientRect();
    }
  }

  // Initialize all visualizations
  initVisualizations() {
    // Create title page visualization (simple static content)
    const titleContainer = document.getElementById("title-container");
    if (titleContainer) {
      // Create a simple title visualization with highlighted text
      titleContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 85vh; position: relative;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                     background-image: url('img/chess-toronto.jpg'); 
                     background-size: cover; background-position: center; opacity: 0.7;"></div>
          <div style="position: relative; text-align: center; z-index: 2;">
            <h1 style="font-size: 72px; font-weight: bold; background-color: rgba(255, 255, 255, 0.85); 
                       padding: 15px 30px; border-radius: 10px; display: inline-block; 
                       box-shadow: 0 4px 15px rgba(0,0,0,0.3); color: var(--primary-color);">Chess Viz</h1>
            <p style="font-size: 28px; margin-top: 20px; background-color: rgba(255, 255, 255, 0.85); 
                      padding: 10px 20px; border-radius: 8px; display: inline-block; 
                      box-shadow: 0 4px 15px rgba(0,0,0,0.2);">Visualizing Chess in Canada</p>
          </div>
        </div>
      `;
      this.visualizations.title = {
        container: titleContainer,
        instance: null,
        initialized: true,
      };
    }

    // Initialize all visualizations here, but only init() the first one

    // Guess visualization
    const guessSection = document.getElementById("guess-section");
    if (guessSection) {
      this.visualizations.guess = {
        container: guessSection,
        instance: new ChessVis.GuessVisualization("guess-section", {
          minValue: 0,
          maxValue: 8000,
          step: 100,
          defaultValue: 4000,
          correctValue: 4866,
        }),
        initialized: false,
      };

      // Initialize the guess section (first visible section after title)
      this.visualizations.guess.instance.initialize();
      this.visualizations.guess.initialized = true;
    }

    // Grid visualization
    const gridContainer = document.getElementById("grid-display-container");
    if (gridContainer) {
      this.visualizations.grid = {
        container: gridContainer,
        instance: new ChessVis.GridVisualization("grid-display-container", {
          numRows: 10,
          numCols: 10,
        }),
        initialized: false,
      };
    }

    // Hourglass visualization (using simplified funnel)
    const hourglassContainer = document.getElementById("hourglass-svg");
    if (hourglassContainer) {
      // Ensure the container is visible before initializing
      this.ensureHourglassVisible();

      this.visualizations.hourglass = {
        container: hourglassContainer,
        instance: new ChessVis.SimpleFunnelVisualization("hourglass-svg", {
          ballCount: 100,
          animationSpeed: 1.2,
        }),
        initialized: false,
      };
    }

    // Player ratings visualization
    const playersContainer = document.getElementById("chart");
    if (playersContainer) {
      this.visualizations.players = {
        container: playersContainer,
        instance: new ChessVis.PlayerRatingsVisualization("chart", {
          player1Id: "167084",
          player2Id: "132534",
          player1Name: "Aaron Reeve Mendes",
          player2Name: "Nikolay Noritsyn",
          // Add this line to set the height directly
          height: 650, // This will override the auto-detected height
        }),
        initialized: false,
      };
    }

    // World map visualization
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
      this.visualizations.map = {
        container: mapContainer,
        instance: new ChessVis.WorldMapVisualization("map-container", {
          connections: [
            {
              source: "India",
              target: "Canada",
              value: 100,
              id: "india-canada",
              player: "Aaron Reeve Mendes",
            },
            {
              source: "Russia",
              target: "Canada",
              value: 85,
              id: "russia-canada",
              player: "Nikolay Noritsyn",
            },
          ],
        }),
        initialized: false,
      };
    }

    // Masters visualization
    const mastersContainer = document.getElementById("masters-visualization");
    if (mastersContainer) {
      this.visualizations.masters = {
        container: mastersContainer,
        instance: new ChessVis.MastersVisualization("masters-visualization", {
          dataPath: "data/national_masters.csv",
          startYear: 2000,
          titleText: "Canadian National Chess Masters By Year Since 2000",
        }),
        initialized: false,
      };
    }

    console.log("Visualizations prepared");

    // Initialize the first section immediately
    this.handleSectionChange(this.currentSection || "title");
  }

  // Handle section change
  handleSectionChange(sectionId) {
    console.log(`Changing to section: ${sectionId}`);

    // Initialize visualization for this section if not already initialized
    const visualizationInfo = this.visualizations[sectionId];

    if (
      visualizationInfo &&
      !visualizationInfo.initialized &&
      visualizationInfo.instance
    ) {
      console.log(`Initializing visualization for section: ${sectionId}`);

      // Special case for hourglass section
      if (sectionId === "hourglass") {
        // Ensure container is visible
        this.ensureHourglassVisible();

        // Give a moment for container to be fully visible
        setTimeout(() => {
          visualizationInfo.instance.initialize();
          visualizationInfo.initialized = true;

          // Make sure the simulation starts
          setTimeout(() => {
            if (visualizationInfo.instance.update) {
              visualizationInfo.instance.update();
            }
          }, 200);
        }, 200);
      } else {
        // Normal initialization for other sections
        visualizationInfo.instance.initialize();
        visualizationInfo.initialized = true;
      }
    }

    // Special handling for initialized hourglass to ensure it's running
    if (
      sectionId === "hourglass" &&
      visualizationInfo &&
      visualizationInfo.initialized &&
      visualizationInfo.instance
    ) {
      // Make sure the animation is running
      if (visualizationInfo.instance.update) {
        visualizationInfo.instance.update();
      }
    }

    // Update current visualization if needed
    if (
      visualizationInfo &&
      visualizationInfo.instance &&
      visualizationInfo.instance.update
    ) {
      visualizationInfo.instance.update();
    }
  }

  // Handle window resize
  handleResize() {
    // Update currently visible visualization
    if (this.currentSection && this.visualizations[this.currentSection]) {
      const visualizationInfo = this.visualizations[this.currentSection];

      if (visualizationInfo.instance && visualizationInfo.instance.resize) {
        visualizationInfo.instance.resize();
      }
    }
  }

  // Handle keypresses for navigation
  handleKeypress(event) {
    // Skip if user is typing in an input
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    // No special keypress handling needed
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Create global app instance
  window.ChessApp = new ChessFederationApp();
  window.ChessApp.init();
});
