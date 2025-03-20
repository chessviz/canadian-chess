/**
 * GuessVisualization.js
 * Creates an interactive slider for guessing the number of chess players in Canada
 */

ChessVis.GuessVisualization = class extends ChessVis.ChessVisualization {
  constructor(containerId, options = {}) {
    super(containerId);
    
    // Configuration
    this.minValue = options.minValue || 0;
    this.maxValue = options.maxValue || 30000;
    this.step = options.step || 250;
    this.defaultValue = options.defaultValue || 15000;
    this.correctValue = options.correctValue || ChessVis.TOTAL_PLAYERS;
    this.acceptableErrorPercent = options.acceptableErrorPercent || 20;
    
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
    // This component doesn't use SVG, so we don't call super.initialize()
    this.initialized = true;
    
    // Get DOM elements
    this.sliderElement = document.getElementById('player-guess-slider');
    this.valueDisplay = document.getElementById('guess-value-number');
    this.submitButton = document.getElementById('submit-guess');
    this.resultContainer = document.getElementById('guess-result');
    this.containerElement = document.getElementById(this.containerId);
    
    if (!this.sliderElement || !this.valueDisplay || !this.submitButton || !this.resultContainer) {
      console.error('Required DOM elements for GuessVisualization not found');
      return false;
    }
    
    // Ensure visualization is in front by setting z-index
    if (this.containerElement) {
      this.containerElement.style.position = 'relative';
      this.containerElement.style.zIndex = '100';
    }
    
    // Enhance slider for better clickability
    this.sliderElement.style.height = '20px';  // Make slider track thicker
    this.sliderElement.style.cursor = 'pointer';
    this.sliderElement.style.opacity = '1';
    
    // Make submit button more clickable
    if (this.submitButton) {
      this.submitButton.style.cursor = 'pointer';
      this.submitButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      this.submitButton.style.position = 'relative';
      this.submitButton.style.zIndex = '101';
      
      // Add hover effect
      this.submitButton.addEventListener('mouseover', () => {
        this.submitButton.style.transform = 'scale(1.05)';
        this.submitButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
      });
      
      this.submitButton.addEventListener('mouseout', () => {
        this.submitButton.style.transform = 'scale(1)';
        this.submitButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      });
    }
    
    // Set initial values
    this.sliderElement.min = this.minValue;
    this.sliderElement.max = this.maxValue;
    this.sliderElement.step = this.step;
    this.sliderElement.value = this.defaultValue;
    this.valueDisplay.textContent = this.formatNumber(this.defaultValue);
    
    // Add event listeners
    this.sliderElement.addEventListener('input', this.handleSliderChange);
    this.submitButton.addEventListener('click', this.handleSubmit);
    
    // Update initial slider fill
    this.updateSliderFill();
    
    // Make sure the correct value is not shown until after guessing
    // Find the element that displays the correct value and hide it initially
    const numberValueElement = document.querySelector('.number-value');
    if (numberValueElement) {
      numberValueElement.textContent = "?";
    }
    
    // Make interaction area more prominent
    const interactionArea = document.querySelector('.guess-interaction-area');
    if (interactionArea) {
      interactionArea.style.padding = '20px';
      interactionArea.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.1)';
      interactionArea.style.borderRadius = '8px';
      interactionArea.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      interactionArea.style.position = 'relative';
      interactionArea.style.zIndex = '99';
    }
    
    return true;
  }
  
  // Update the fill of the slider based on current value
  updateSliderFill() {
    if (!this.sliderElement) return;
    
    const percentage = ((this.sliderElement.value - this.minValue) / 
                        (this.maxValue - this.minValue)) * 100;
    
    this.sliderElement.style.background = 
      `linear-gradient(to right, #d35400 0%, #d35400 ${percentage}%, #bbb ${percentage}%, #bbb 100%)`;
    
    // Enhance the slider thumb for better visibility
    const thumbStyle = `
      input[type=range]::-webkit-slider-thumb {
        height: 24px;
        width: 24px;
        background: #e67e22;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
    `;
    
    // Add or update the style element
    let styleElement = document.getElementById('slider-thumb-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'slider-thumb-style';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = thumbStyle;
  }
  
  // Handler for slider changes
  handleSliderChange(event) {
    this.currentValue = parseInt(event.target.value);
    this.valueDisplay.textContent = this.formatNumber(this.currentValue);
    this.updateSliderFill();
  }
  
  // Handler for guess submission
  handleSubmit() {
    if (this.guessSubmitted) return;
    
    this.guessSubmitted = true;
    
    // Disable controls
    this.sliderElement.disabled = true;
    this.submitButton.disabled = true;
    this.submitButton.classList.remove('pulse-animation');
    this.submitButton.textContent = "Processing...";
    
    // Calculate accuracy
    const difference = Math.abs(this.currentValue - this.correctValue);
    const percentDiff = Math.round((difference / this.correctValue) * 100);
    
    // Determine accuracy category
    if (percentDiff <= this.acceptableErrorPercent) {
      this.guessAccuracy = 'excellent';
    } else if (this.currentValue < this.correctValue) {
      this.guessAccuracy = 'low';
    } else {
      this.guessAccuracy = 'high';
    }
    
    // Show result with a small delay for better UX
    setTimeout(() => {
      this.showResult(percentDiff);
    }, 1000);
  }
  
  // Display the guess result
  showResult(percentDiff) {
    // Hide interaction area
    const interactionArea = document.querySelector('.guess-interaction-area');
    if (interactionArea) {
      interactionArea.style.display = 'none';
    }
    
    // Create result message
    const resultMessage = document.getElementById('result-message');
    if (resultMessage) {
      if (this.guessAccuracy === 'excellent') {
        resultMessage.textContent = 'Perfect guess! That\'s exactly right!';
      } else if (this.guessAccuracy === 'low') {
        resultMessage.textContent = `That's ${percentDiff}% lower than the actual number.`;
      } else {
        resultMessage.textContent = `That's ${percentDiff}% higher than the actual number.`;
      }
      
      resultMessage.className = `result-message ${this.guessAccuracy}`;
    }
    
    // Update actual number display - NOW reveal the correct answer
    const numberValue = document.querySelector('.number-value');
    if (numberValue) {
      // Start counting up
      this.animateCountUp(numberValue, 0, this.correctValue, 2000);
    }
    
    // Show result container
    this.resultContainer.classList.remove('hidden');
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
      this.submitButton.classList.add('pulse-animation');
      this.submitButton.textContent = "Submit Guess";
      
      // Re-enable hover effects when resetting
      this.submitButton.addEventListener('mouseover', () => {
        this.submitButton.style.transform = 'scale(1.05)';
        this.submitButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
      });
      
      this.submitButton.addEventListener('mouseout', () => {
        this.submitButton.style.transform = 'scale(1)';
        this.submitButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      });
    }
    
    // Hide result, show interaction area
    if (this.resultContainer) {
      this.resultContainer.classList.add('hidden');
    }
    
    const interactionArea = document.querySelector('.guess-interaction-area');
    if (interactionArea) {
      interactionArea.style.display = 'block';
    }
    
    // Reset the correct value display to hide it again
    const numberValue = document.querySelector('.number-value');
    if (numberValue) {
      numberValue.textContent = "?";
    }
  }
};