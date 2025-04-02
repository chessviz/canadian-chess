/**
 * GuessVisualization.js
 * Creates an interactive slider for guessing the number of chess players in Canada
 */

ChessVis.GuessVisualization = class extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);

    // Configuration
    this.minValue = options.minValue || 0;
    this.maxValue = options.maxValue || 8000;
    this.step = options.step || 100;
    this.defaultValue = options.defaultValue || 4000;
    this.correctValue = options.correctValue || ChessVis.TOTAL_PLAYERS;
    this.acceptableErrorPercent = options.acceptableErrorPercent || 5;

    // State
    this.currentValue = this.defaultValue;
    this.guessSubmitted = false;
    this.guessAccuracy = null;

    // DOM elements
    this.sliderElement = null;
    this.valueDisplay = null;
    this.submitButton = null;
    this.resultContainer = null;
    this.containerElement = null;

    // Bind methods
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.showResult = this.showResult.bind(this);
  }

  initialize() {
    this.initialized = true;

    // Get DOM elements
    this.sliderElement = document.getElementById("player-guess-slider");
    this.valueDisplay = document.getElementById("guess-value-number");
    this.submitButton = document.getElementById("submit-guess");
    this.resultContainer = document.getElementById("guess-result");
    this.containerElement = document.getElementById(this.containerId);

    if (
      !this.sliderElement ||
      !this.valueDisplay ||
      !this.submitButton ||
      !this.resultContainer
    ) {
      console.error("Required DOM elements for GuessVisualization not found");
      return false;
    }

    // Ensure visualization is in front by setting z-index
    if (this.containerElement) {
      this.containerElement.style.position = "relative";
      this.containerElement.style.zIndex = "100";
    }

    // Minimal slider style changes: increase height for easier dragging
    this.sliderElement.style.height = "30px";
    this.sliderElement.style.cursor = "pointer";
    this.sliderElement.style.opacity = "1";

    // Prevent default touch scrolling on slider
    this.sliderElement.addEventListener("touchstart", function (e) {
      e.preventDefault();
    });

    // Set initial values
    this.sliderElement.min = this.minValue;
    this.sliderElement.max = this.maxValue;
    this.sliderElement.step = this.step;
    this.sliderElement.value = this.defaultValue;
    this.valueDisplay.textContent = this.formatNumber(this.defaultValue);

    // Add event listeners
    this.sliderElement.addEventListener("input", this.handleSliderChange);
    this.submitButton.addEventListener("click", this.handleSubmit);

    // Update initial slider fill
    this.updateSliderFill();

    // Make sure the correct value is not shown until after guessing
    // Find the element that displays the correct value and hide it initially
    const numberValueElement = document.querySelector(".number-value");
    if (numberValueElement) {
      numberValueElement.textContent = "?";
    }

    // Make interaction area more prominent
    const interactionArea = document.querySelector(".guess-interaction-area");
    if (interactionArea) {
      interactionArea.style.padding = "30px"; // Increased padding
      interactionArea.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.15)"; // More visible shadow
      interactionArea.style.borderRadius = "12px"; // More rounded corners
      interactionArea.style.backgroundColor = "rgba(255, 255, 255, 0.97)"; // More opaque
      interactionArea.style.position = "relative";
      interactionArea.style.zIndex = "99";
    }

    return true;
  }

  // Update the fill of the slider based on current value
  updateSliderFill() {
    if (!this.sliderElement) return;

    const percentage =
      ((this.sliderElement.value - this.minValue) /
        (this.maxValue - this.minValue)) *
      100;

    this.sliderElement.style.background = `linear-gradient(to right, #d35400 0%, #d35400 ${percentage}%, #bbb ${percentage}%, #bbb 100%)`;
  }

  // Handler for slider changes
  handleSliderChange(event) {
    this.currentValue = parseInt(event.target.value);
    this.valueDisplay.textContent = this.formatNumber(this.currentValue);
    this.updateSliderFill();

    // Log the current value to the console
    console.log("Slider value changed to:", this.currentValue);
  }

  // Handler for guess submission
  handleSubmit() {
    if (this.guessSubmitted) return;

    this.guessSubmitted = true;

    // Disable controls
    this.sliderElement.disabled = true;
    this.submitButton.disabled = true;
    this.submitButton.classList.remove("pulse-animation");
    this.submitButton.textContent = "Processing...";

    // Calculate accuracy
    const difference = Math.abs(this.currentValue - this.correctValue);
    const percentDiff = Math.round((difference / this.correctValue) * 100);

    // Determine accuracy category
    if (percentDiff <= this.acceptableErrorPercent) {
      this.guessAccuracy = "excellent";
    } else if (this.currentValue < this.correctValue) {
      this.guessAccuracy = "low";
    } else {
      this.guessAccuracy = "high";
    }

    // Show result with a small delay for better UX
    setTimeout(() => {
      this.showResult(percentDiff);
    }, 1000);
  }

  // Display the guess result
  showResult(percentDiff) {
    // Hide interaction area
    const interactionArea = document.querySelector(".guess-interaction-area");
    if (interactionArea) {
      interactionArea.style.display = "none";
    }

    // Create result message
    const resultMessage = document.getElementById("result-message");
    if (resultMessage) {
      if (this.guessAccuracy === "excellent") {
        resultMessage.textContent = "Great guess! That's right!";
      } else if (this.guessAccuracy === "low") {
        resultMessage.textContent = `That's ${percentDiff}% lower than the actual number.`;
      } else {
        resultMessage.textContent = `That's ${percentDiff}% higher than the actual number.`;
      }

      resultMessage.className = `result-message ${this.guessAccuracy}`;
    }

    // Update actual number display - NOW reveal the correct answer
    const numberValue = document.querySelector(".number-value");
    if (numberValue) {
      // Start counting up
      this.animateCountUp(numberValue, 0, this.correctValue, 2000);
    }

    // Show result container
    this.resultContainer.classList.remove("hidden");
  }

  // Animate counting up from start to end value
  animateCountUp(element, startValue, endValue, duration) {
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const valueIncrement = (endValue - startValue) / totalFrames;

    let currentFrame = 0;
    let currentValue = startValue;

    const animate = () => {
      currentFrame++;
      currentValue += valueIncrement;

      if (currentValue >= endValue) {
        element.textContent = this.formatNumber(endValue);
        return;
      }

      element.textContent = this.formatNumber(Math.floor(currentValue));

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Update method
  update() {
    // Nothing to update for this visualization
  }

  // Resize handler
  resize() {
    // Update slider fill on resize
    this.updateSliderFill();
  }

  // Reset the guess form
  reset() {
    if (!this.initialized) return;

    this.guessSubmitted = false;
    this.guessAccuracy = null;

    // Reset form elements
    if (this.sliderElement) {
      this.sliderElement.value = this.defaultValue;
      this.sliderElement.disabled = false;
      this.updateSliderFill();
    }

    if (this.valueDisplay) {
      this.valueDisplay.textContent = this.formatNumber(this.defaultValue);
    }

    if (this.submitButton) {
      this.submitButton.disabled = false;
      this.submitButton.classList.add("pulse-animation");
      this.submitButton.textContent = "Submit Guess";

      // Re-enable hover effects when resetting
      this.submitButton.addEventListener("mouseover", () => {
        this.submitButton.style.transform = "scale(1.05)";
        this.submitButton.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
      });

      this.submitButton.addEventListener("mouseout", () => {
        this.submitButton.style.transform = "scale(1)";
        this.submitButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
      });
    }

    // Hide result, show interaction area
    if (this.resultContainer) {
      this.resultContainer.classList.add("hidden");
    }

    const interactionArea = document.querySelector(".guess-interaction-area");
    if (interactionArea) {
      interactionArea.style.display = "block";
    }

    // Reset the correct value display to hide it again
    const numberValue = document.querySelector(".number-value");
    if (numberValue) {
      numberValue.textContent = "?";
    }
  }
};
