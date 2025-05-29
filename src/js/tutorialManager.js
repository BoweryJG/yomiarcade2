import { GAME_CONFIG } from '../config/constants.js';

export class TutorialManager {
  constructor() {
    this.hasSeenTutorial = this.loadTutorialState();
    this.currentStep = 0;
    this.tutorialSteps = this.defineTutorialSteps();
    this.overlay = null;
    this.isActive = false;
  }

  defineTutorialSteps() {
    return [
      {
        target: '.method-cards',
        title: 'Choose Your Method',
        content: 'Select one of three dental implant placement methods. Each has different accuracy levels based on real clinical data.',
        position: 'bottom'
      },
      {
        target: '[data-method="yomi"]',
        title: 'Yomi Robotic-Assisted',
        content: 'The most accurate method with 92.3% precision. Uses AI-powered robotic guidance for optimal placement.',
        position: 'top'
      },
      {
        target: '#start-simulation-btn',
        title: 'Start the Simulation',
        content: 'Once you\'ve selected a method, click here to begin the implant placement simulation.',
        position: 'top'
      },
      {
        target: '#simulation-canvas',
        title: 'Place the Implant',
        content: 'Click and hold to drill. Use the angle and depth meters to guide your placement. The goal is to hit the green target.',
        position: 'center'
      },
      {
        target: '.view-controls',
        title: 'Change Your View',
        content: 'Use these buttons to switch between different camera angles for better precision.',
        position: 'bottom'
      },
      {
        target: '.meters',
        title: 'Monitor Your Precision',
        content: 'Keep an eye on these meters. Green means good alignment, yellow is okay, red needs adjustment.',
        position: 'left'
      }
    ];
  }

  loadTutorialState() {
    try {
      return localStorage.getItem('yomi-tutorial-seen') === 'true';
    } catch (e) {
      return false;
    }
  }

  saveTutorialState() {
    try {
      localStorage.setItem('yomi-tutorial-seen', 'true');
    } catch (e) {
      console.warn('Could not save tutorial state');
    }
  }

  isFirstPlay() {
    return !this.hasSeenTutorial;
  }

  showFullTutorial() {
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    this.isActive = true;
  }

  showSimulationTutorial() {
    if (this.hasSeenTutorial) return;
    
    // Show only simulation-specific steps
    const simulationSteps = this.tutorialSteps.filter(step => 
      step.target.includes('simulation') || 
      step.target.includes('view-controls') || 
      step.target.includes('meters')
    );
    
    this.tutorialSteps = simulationSteps;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    this.isActive = true;
  }

  createOverlay() {
    // Remove existing overlay if any
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-highlight"></div>
      <div class="tutorial-tooltip">
        <h3 class="tutorial-title"></h3>
        <p class="tutorial-content"></p>
        <div class="tutorial-navigation">
          <button class="tutorial-skip">Skip Tutorial</button>
          <div class="tutorial-buttons">
            <button class="tutorial-prev" style="display: none;">Previous</button>
            <button class="tutorial-next">Next</button>
          </div>
        </div>
        <div class="tutorial-progress">
          <span class="tutorial-progress-text">Step <span class="current-step">1</span> of <span class="total-steps">${this.tutorialSteps.length}</span></span>
          <div class="tutorial-progress-bar">
            <div class="tutorial-progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.addTutorialStyles();
    this.setupTutorialEvents();
  }

  addTutorialStyles() {
    if (document.getElementById('tutorial-styles')) return;

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        pointer-events: none;
      }

      .tutorial-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        pointer-events: all;
      }

      .tutorial-highlight {
        position: absolute;
        border: 3px solid var(--primary-color);
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
        transition: all 0.3s ease;
        pointer-events: none;
      }

      .tutorial-tooltip {
        position: absolute;
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        pointer-events: all;
        transform: translateY(20px);
        opacity: 0;
        animation: fadeInUp 0.3s forwards;
      }

      @keyframes fadeInUp {
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .tutorial-title {
        margin: 0 0 10px;
        color: var(--primary-color);
        font-size: 1.2em;
      }

      .tutorial-content {
        margin: 0 0 20px;
        line-height: 1.6;
        color: #333;
      }

      .tutorial-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .tutorial-skip {
        background: none;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.9em;
      }

      .tutorial-buttons button {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
      }

      .tutorial-buttons button:hover {
        background: #ff6b35;
      }

      .tutorial-prev {
        background: #666 !important;
      }

      .tutorial-progress {
        text-align: center;
      }

      .tutorial-progress-text {
        font-size: 0.85em;
        color: #666;
      }

      .tutorial-progress-bar {
        width: 100%;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }

      .tutorial-progress-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
      }

      .tutorial-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      }

      .tutorial-arrow.top {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 10px 10px 10px;
        border-color: transparent transparent white transparent;
      }

      .tutorial-arrow.bottom {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 10px 10px 0 10px;
        border-color: white transparent transparent transparent;
      }

      .tutorial-arrow.left {
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border-width: 10px 10px 10px 0;
        border-color: transparent white transparent transparent;
      }

      .tutorial-arrow.right {
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border-width: 10px 0 10px 10px;
        border-color: transparent transparent transparent white;
      }

      @media (max-width: 768px) {
        .tutorial-tooltip {
          max-width: 90%;
          margin: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupTutorialEvents() {
    const skipBtn = this.overlay.querySelector('.tutorial-skip');
    const prevBtn = this.overlay.querySelector('.tutorial-prev');
    const nextBtn = this.overlay.querySelector('.tutorial-next');

    skipBtn.addEventListener('click', () => this.endTutorial());
    prevBtn.addEventListener('click', () => this.previousStep());
    nextBtn.addEventListener('click', () => this.nextStep());

    // Close on backdrop click
    this.overlay.querySelector('.tutorial-backdrop').addEventListener('click', () => this.endTutorial());

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyboard = (e) => {
      if (!this.isActive) return;
      
      switch(e.key) {
        case 'Escape':
          this.endTutorial();
          break;
        case 'ArrowLeft':
          if (this.currentStep > 0) this.previousStep();
          break;
        case 'ArrowRight':
          this.nextStep();
          break;
      }
    });
  }

  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) return;

    const step = this.tutorialSteps[stepIndex];
    const target = document.querySelector(step.target);
    
    if (!target) {
      console.warn('Tutorial target not found:', step.target);
      this.nextStep();
      return;
    }

    // Update content
    this.overlay.querySelector('.tutorial-title').textContent = step.title;
    this.overlay.querySelector('.tutorial-content').textContent = step.content;
    this.overlay.querySelector('.current-step').textContent = stepIndex + 1;

    // Update navigation buttons
    const prevBtn = this.overlay.querySelector('.tutorial-prev');
    const nextBtn = this.overlay.querySelector('.tutorial-next');
    
    prevBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
    nextBtn.textContent = stepIndex === this.tutorialSteps.length - 1 ? 'Finish' : 'Next';

    // Update progress
    const progress = ((stepIndex + 1) / this.tutorialSteps.length) * 100;
    this.overlay.querySelector('.tutorial-progress-fill').style.width = `${progress}%`;

    // Position highlight and tooltip
    this.positionElements(target, step.position);
  }

  positionElements(target, preferredPosition) {
    const highlight = this.overlay.querySelector('.tutorial-highlight');
    const tooltip = this.overlay.querySelector('.tutorial-tooltip');
    
    const targetRect = target.getBoundingClientRect();
    const padding = 10;

    // Position highlight
    highlight.style.left = `${targetRect.left - padding}px`;
    highlight.style.top = `${targetRect.top - padding}px`;
    highlight.style.width = `${targetRect.width + padding * 2}px`;
    highlight.style.height = `${targetRect.height + padding * 2}px`;

    // Make target clickable
    highlight.style.pointerEvents = 'none';
    target.style.position = 'relative';
    target.style.zIndex = '10001';

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 20;
    let position = preferredPosition;
    let left, top;

    // Auto-position if preferred position doesn't fit
    if (position === 'auto' || position === 'center') {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (targetRect.bottom + tooltipRect.height + spacing < viewportHeight) {
        position = 'bottom';
      } else if (targetRect.top - tooltipRect.height - spacing > 0) {
        position = 'top';
      } else if (targetRect.right + tooltipRect.width + spacing < viewportWidth) {
        position = 'right';
      } else {
        position = 'left';
      }
    }

    // Remove existing arrow
    const existingArrow = tooltip.querySelector('.tutorial-arrow');
    if (existingArrow) existingArrow.remove();

    // Add arrow and calculate position
    const arrow = document.createElement('div');
    arrow.className = 'tutorial-arrow';

    switch (position) {
      case 'top':
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        top = targetRect.top - tooltipRect.height - spacing;
        arrow.classList.add('bottom');
        break;
      case 'bottom':
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        top = targetRect.bottom + spacing;
        arrow.classList.add('top');
        break;
      case 'left':
        left = targetRect.left - tooltipRect.width - spacing;
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        arrow.classList.add('right');
        break;
      case 'right':
        left = targetRect.right + spacing;
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        arrow.classList.add('left');
        break;
      default:
        // Center
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        top = window.innerHeight / 2 - tooltipRect.height / 2;
    }

    // Ensure tooltip stays within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    if (position !== 'center') {
      tooltip.appendChild(arrow);
    }
  }

  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.endTutorial();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  endTutorial() {
    this.isActive = false;
    this.hasSeenTutorial = true;
    this.saveTutorialState();

    // Cleanup
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Remove keyboard listener
    if (this.handleKeyboard) {
      document.removeEventListener('keydown', this.handleKeyboard);
    }

    // Reset z-index of any highlighted elements
    document.querySelectorAll('[style*="z-index: 10001"]').forEach(el => {
      el.style.zIndex = '';
    });
  }
}