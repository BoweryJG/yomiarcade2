import { GAME_CONFIG, A11Y } from '../config/constants.js';
import gsap from 'gsap';

export class UIManager {
  constructor(app) {
    this.app = app;
    this.currentScreen = 'welcome';
    this.notificationTimeout = null;
  }

  init() {
    this.setupAccessibility();
    this.addLoadingStyles();
    this.addErrorStyles();
    this.setupResponsiveness();
  }

  setupAccessibility() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content landmark
    const main = document.querySelector('main');
    if (main) {
      main.id = 'main-content';
      main.setAttribute('role', 'main');
    }

    // Setup focus visible
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });

    // Announce screen changes to screen readers
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.className = 'sr-only';
    document.body.appendChild(this.announcer);
  }

  addLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .skip-to-content {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 9999;
      }
      
      .skip-to-content:focus {
        top: 0;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .keyboard-nav *:focus {
        outline: ${A11Y.FOCUS_VISIBLE_OUTLINE} !important;
        outline-offset: 2px;
      }
      
      #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
      }
      
      #loading-screen.fade-out {
        opacity: 0;
      }
      
      .loading-content {
        text-align: center;
        color: white;
      }
      
      .loading-logo {
        width: 150px;
        margin-bottom: 20px;
      }
      
      .loading-bar {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin: 20px auto;
      }
      
      .loading-progress {
        height: 100%;
        background: var(--primary-color);
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .loading-state {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
      }
      
      .loading-spinner {
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideDown 0.3s ease;
      }
      
      @keyframes slideDown {
        from {
          transform: translate(-50%, -100%);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  addErrorStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #error-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .error-message {
        background: white;
        padding: 40px;
        border-radius: 8px;
        text-align: center;
        max-width: 400px;
      }
      
      .error-message h3 {
        color: #e74c3c;
        margin-bottom: 15px;
      }
      
      .error-message button {
        margin-top: 20px;
      }
    `;
    document.head.appendChild(style);

    // Add error container to DOM
    const errorContainer = document.createElement('div');
    errorContainer.id = 'error-container';
    document.body.appendChild(errorContainer);
  }

  setupResponsiveness() {
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Initial check
    this.handleResize();
  }

  handleOrientationChange() {
    const orientation = window.orientation;
    if (orientation === 90 || orientation === -90) {
      // Landscape
      document.body.classList.add('landscape');
      document.body.classList.remove('portrait');
    } else {
      // Portrait
      document.body.classList.add('portrait');
      document.body.classList.remove('landscape');
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (width < GAME_CONFIG.UI.MOBILE_BREAKPOINT) {
      document.body.classList.add('mobile');
      document.body.classList.remove('desktop');
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile');
    }

    // Adjust canvas size if simulation is active
    if (this.app.simulationManager && this.currentScreen === 'simulation') {
      this.app.simulationManager.handleResize();
    }
  }

  async transitionToScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    const targetScreen = document.getElementById(`${screenId}-screen`);
    
    if (!targetScreen) {
      console.error('Screen not found:', screenId);
      return;
    }

    // Announce to screen readers
    this.announce(`Now showing ${screenId} screen`);

    // Fade out current screen
    const currentScreenEl = document.querySelector('.screen.active');
    if (currentScreenEl) {
      await gsap.to(currentScreenEl, {
        opacity: 0,
        duration: GAME_CONFIG.ANIMATIONS.SCREEN_TRANSITION / 1000,
        ease: 'power2.inOut'
      });
      currentScreenEl.classList.remove('active');
      currentScreenEl.style.display = 'none';
    }

    // Show and fade in new screen
    targetScreen.style.display = 'flex';
    targetScreen.style.opacity = 0;
    targetScreen.classList.add('active');
    
    await gsap.to(targetScreen, {
      opacity: 1,
      duration: GAME_CONFIG.ANIMATIONS.SCREEN_TRANSITION / 1000,
      ease: 'power2.inOut'
    });

    this.currentScreen = screenId;

    // Focus management
    const focusTarget = targetScreen.querySelector('[data-autofocus]') || 
                       targetScreen.querySelector('h1, h2');
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  highlightSelectedMethod(method) {
    // Remove previous selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });

    // Add selection to current method
    const selectedCard = document.querySelector(`[data-method="${method}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      selectedCard.setAttribute('aria-pressed', 'true');
      
      // Animate selection
      gsap.to(selectedCard, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(selectedCard, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.in'
          });
        }
      });
    }

    // Update method name display
    const methodDisplay = document.getElementById('selected-method-display');
    if (methodDisplay) {
      const methodConfig = GAME_CONFIG.METHODS[method.toUpperCase()];
      methodDisplay.textContent = methodConfig.name;
    }
  }

  showLoadingState() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-state';
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Preparing simulation...</p>
    `;
    document.body.appendChild(loadingEl);
  }

  hideLoadingState() {
    const loadingEl = document.querySelector('.loading-state');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  showNotification(message, duration = 3000) {
    // Clear existing notification
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      const existing = document.querySelector('.notification');
      if (existing) existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    document.body.appendChild(notification);

    this.notificationTimeout = setTimeout(() => {
      gsap.to(notification, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => notification.remove()
      });
    }, duration);
  }

  showResults(results) {
    // Update score
    const scoreEl = document.getElementById('final-score');
    if (scoreEl) {
      scoreEl.textContent = results.score;
      
      // Animate score
      gsap.from(scoreEl, {
        scale: 0,
        duration: 0.5,
        ease: 'back.out(1.7)',
        delay: 0.3
      });
    }

    // Update method name
    const methodEl = document.getElementById('result-method');
    if (methodEl) {
      methodEl.textContent = results.methodName;
    }

    // Update accuracy
    const accuracyEl = document.getElementById('result-accuracy');
    if (accuracyEl) {
      accuracyEl.textContent = `${results.accuracy}% Accuracy`;
    }

    // Update detailed stats
    const statsEl = document.getElementById('detailed-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Position Error:</span>
          <span class="stat-value">${results.errorMm}mm</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Angle Error:</span>
          <span class="stat-value">${results.angleError}°</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Depth Error:</span>
          <span class="stat-value">${results.depthError}mm</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Time:</span>
          <span class="stat-value">${results.timeSeconds}s</span>
        </div>
      `;
    }

    // Update comparison
    const comparisonEl = document.getElementById('benchmark-comparison');
    if (comparisonEl) {
      const improvement = ((results.benchmark.averageError - parseFloat(results.errorMm)) / 
                          results.benchmark.averageError * 100).toFixed(0);
      
      comparisonEl.innerHTML = `
        <p>Clinical Average: ${results.benchmark.averageError}mm</p>
        <p>Your Result: ${results.errorMm}mm</p>
        <p class="${improvement > 0 ? 'positive' : 'negative'}">
          ${improvement > 0 ? 'Better' : 'Worse'} by ${Math.abs(improvement)}%
        </p>
      `;
    }

    // Add rating class
    const resultsScreen = document.getElementById('results-screen');
    if (resultsScreen) {
      resultsScreen.className = `screen ${results.rating}`;
    }
  }

  resetUI() {
    // Clear selections
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });

    // Reset start button
    const startBtn = document.getElementById('start-simulation-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.remove('pulse');
    }

    // Clear any notifications
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  }

  announce(message) {
    if (this.announcer) {
      this.announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        this.announcer.textContent = '';
      }, 1000);
    }
  }
}