// Error handling utilities
export class GameError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorCodes = {
  WEBGL_NOT_SUPPORTED: 'WEBGL_NOT_SUPPORTED',
  ASSET_LOAD_FAILED: 'ASSET_LOAD_FAILED',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  SIMULATION_ERROR: 'SIMULATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

export class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.setupGlobalErrorHandling();
  }

  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.handleError(new GameError(
        event.message,
        ErrorCodes.INITIALIZATION_FAILED,
        { filename: event.filename, lineno: event.lineno }
      ));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new GameError(
        event.reason?.message || 'Unhandled promise rejection',
        ErrorCodes.INITIALIZATION_FAILED,
        { reason: event.reason }
      ));
    });
  }

  handleError(error) {
    console.error('Game Error:', error);
    
    // Notify all error listeners
    this.errorListeners.forEach(listener => listener(error));

    // Show user-friendly error message
    this.showErrorMessage(error);

    // Log to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        error_code: error.code
      });
    }
  }

  showErrorMessage(error) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
      console.warn('Error container not found in DOM');
      return;
    }

    let userMessage = 'An error occurred. Please try again.';
    let showReload = false;

    switch (error.code) {
      case ErrorCodes.WEBGL_NOT_SUPPORTED:
        userMessage = 'Your browser does not support WebGL. Please use a modern browser like Chrome, Firefox, or Safari.';
        break;
      case ErrorCodes.ASSET_LOAD_FAILED:
        userMessage = 'Failed to load game assets. Please check your internet connection and try again.';
        showReload = true;
        break;
      case ErrorCodes.NETWORK_ERROR:
        userMessage = 'Network error. Please check your internet connection.';
        showReload = true;
        break;
      case ErrorCodes.SIMULATION_ERROR:
        userMessage = 'Simulation error. Please refresh the page and try again.';
        showReload = true;
        break;
    }

    errorContainer.innerHTML = `
      <div class="error-message">
        <h3>Oops!</h3>
        <p>${userMessage}</p>
        ${showReload ? '<button onclick="location.reload()" class="button">Reload Page</button>' : ''}
      </div>
    `;
    errorContainer.style.display = 'block';
  }

  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        throw new GameError(
          'WebGL is not supported',
          ErrorCodes.WEBGL_NOT_SUPPORTED
        );
      }
      return true;
    } catch (e) {
      throw new GameError(
        'WebGL is not supported',
        ErrorCodes.WEBGL_NOT_SUPPORTED
      );
    }
  }
}

export const errorHandler = new ErrorHandler();