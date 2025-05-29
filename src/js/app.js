import { GAME_CONFIG, EXTERNAL_LINKS } from '../config/constants.js';
import { errorHandler } from '../utils/errorHandler.js';
import { loadingManager } from '../utils/loadingManager.js';
import { SimulationManager } from './simulation.js';
import { UIManager } from './uiManager.js';
import { AudioManager } from './audioManager.js';
import { TutorialManager } from './tutorialManager.js';
import { AnalyticsManager } from './analyticsManager.js';

class YomiArcadeApp {
  constructor() {
    this.currentScreen = 'welcome';
    this.selectedMethod = null;
    this.simulationManager = null;
    this.uiManager = null;
    this.audioManager = null;
    this.tutorialManager = null;
    this.analyticsManager = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      // Check WebGL support first
      errorHandler.checkWebGLSupport();

      // Show loading screen
      loadingManager.showLoadingUI();

      // Initialize managers
      this.uiManager = new UIManager(this);
      this.audioManager = new AudioManager();
      this.tutorialManager = new TutorialManager();
      this.analyticsManager = new AnalyticsManager();

      // Load all assets
      await loadingManager.loadAllAssets();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize UI
      this.uiManager.init();

      // Mark as initialized
      this.isInitialized = true;

      // Track app start
      this.analyticsManager.trackEvent('app_started');

    } catch (error) {
      errorHandler.handleError(error);
    }
  }

  setupEventListeners() {
    // Welcome screen button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.uiManager.transitionToScreen('method-selection');
      });
    }

    // Method selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const method = card.dataset.method;
        if (method) {
          this.selectMethod(method);
        }
      });

      // Add keyboard support
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const method = card.dataset.method;
          if (method) {
            this.selectMethod(method);
          }
        }
      });
    });

    // Start simulation button
    const startSimulationBtn = document.getElementById('start-simulation-btn');
    if (startSimulationBtn) {
      startSimulationBtn.addEventListener('click', () => this.startSimulation());
    }

    // Play again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    // Learn more button
    const learnMoreBtn = document.getElementById('learn-more-btn');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', () => {
        this.analyticsManager.trackEvent('learn_more_clicked');
        window.open(EXTERNAL_LINKS.LEARN_MORE, '_blank');
      });
    }

    // Tutorial button
    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => this.showTutorial());
    }

    // Handle visibility change to pause/resume
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.simulationManager) {
        this.simulationManager.pause();
      } else if (!document.hidden && this.simulationManager) {
        this.simulationManager.resume();
      }
    });
  }

  selectMethod(method) {
    if (!GAME_CONFIG.METHODS[method.toUpperCase()]) {
      console.error('Invalid method selected:', method);
      return;
    }

    this.selectedMethod = method;
    this.audioManager.playSound('click');
    
    // Update UI
    this.uiManager.highlightSelectedMethod(method);
    
    // Enable start button
    const startBtn = document.getElementById('start-simulation-btn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.add('pulse');
    }

    // Track selection
    this.analyticsManager.trackEvent('method_selected', { method });
  }

  async startSimulation() {
    if (!this.selectedMethod) {
      this.uiManager.showNotification('Please select a placement method first');
      return;
    }

    try {
      // Show loading state
      this.uiManager.showLoadingState();

      // Transition to simulation screen
      await this.uiManager.transitionToScreen('simulation');
      this.currentScreen = 'simulation';

      // Initialize simulation if not already done
      if (!this.simulationManager) {
        this.simulationManager = new SimulationManager(
          'simulation-canvas',
          this.selectedMethod,
          (results) => this.onSimulationComplete(results)
        );
        await this.simulationManager.init();
      } else {
        this.simulationManager.reset(this.selectedMethod);
      }

      // Start simulation
      this.simulationManager.start();

      // Show tutorial on first play
      if (this.tutorialManager.isFirstPlay()) {
        this.tutorialManager.showSimulationTutorial();
      }

      // Track simulation start
      this.analyticsManager.trackEvent('simulation_started', { 
        method: this.selectedMethod 
      });

    } catch (error) {
      errorHandler.handleError(error);
      this.uiManager.transitionToScreen('method-selection');
    } finally {
      this.uiManager.hideLoadingState();
    }
  }

  onSimulationComplete(results) {
    // Calculate score and prepare results
    const processedResults = this.processResults(results);
    
    // Update UI with results
    this.uiManager.showResults(processedResults);
    
    // Transition to results screen
    this.uiManager.transitionToScreen('results');
    this.currentScreen = 'results';

    // Play success sound
    this.audioManager.playSound('success');

    // Track completion
    this.analyticsManager.trackEvent('simulation_completed', {
      method: this.selectedMethod,
      score: processedResults.score,
      accuracy: processedResults.accuracy
    });
  }

  processResults(results) {
    const methodConfig = GAME_CONFIG.METHODS[this.selectedMethod.toUpperCase()];
    const benchmark = GAME_CONFIG.BENCHMARKS[this.selectedMethod.toUpperCase()];
    
    // Calculate accuracy based on distance from target
    const maxError = 5; // Maximum error in mm
    const errorMm = results.finalDistance * 10; // Convert to mm
    const accuracy = Math.max(0, Math.min(100, (1 - errorMm / maxError) * 100));
    
    // Calculate score based on method and performance
    let score = accuracy;
    
    // Adjust score based on method difficulty
    if (this.selectedMethod === 'yomi') {
      score *= 1.2; // Yomi is more challenging to control
    } else if (this.selectedMethod === 'static') {
      score *= 1.1;
    }
    
    score = Math.min(100, Math.round(score));
    
    // Determine rating
    let rating = 'poor';
    if (score >= GAME_CONFIG.SCORING.EXCELLENT) {
      rating = 'excellent';
    } else if (score >= GAME_CONFIG.SCORING.GOOD) {
      rating = 'good';
    } else if (score >= GAME_CONFIG.SCORING.FAIR) {
      rating = 'fair';
    }
    
    return {
      method: this.selectedMethod,
      methodName: methodConfig.name,
      score,
      accuracy: accuracy.toFixed(1),
      errorMm: errorMm.toFixed(2),
      angleError: results.angleError.toFixed(1),
      depthError: results.depthError.toFixed(1),
      timeSeconds: results.timeSeconds.toFixed(1),
      rating,
      benchmark: {
        averageError: benchmark.AVERAGE_ERROR,
        userError: errorMm.toFixed(2)
      }
    };
  }

  resetGame() {
    this.selectedMethod = null;
    this.uiManager.resetUI();
    this.uiManager.transitionToScreen('welcome');
    this.currentScreen = 'welcome';
    
    if (this.simulationManager) {
      this.simulationManager.reset();
    }
  }

  showTutorial() {
    this.tutorialManager.showFullTutorial();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new YomiArcadeApp();
  window.yomiApp = app; // Expose globally for button onclick handlers
  app.init();
});