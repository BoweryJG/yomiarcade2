// Game Configuration Constants
export const GAME_CONFIG = {
  // Method configurations
  METHODS: {
    FREEHAND: {
      id: 'freehand',
      name: 'Freehand',
      accuracy: '57.9%',
      description: 'Traditional manual placement',
      color: '#ff6b6b',
      targetOffset: { x: 0.2, y: 0.15, z: 0.1 },
      wobbleFactor: 0.02
    },
    STATIC: {
      id: 'static',
      name: 'Static Guided',
      accuracy: '61.0%',
      description: 'Physical guide assistance',
      color: '#4ecdc4',
      targetOffset: { x: 0.1, y: 0.08, z: 0.05 },
      wobbleFactor: 0.01
    },
    YOMI: {
      id: 'yomi',
      name: 'Yomi Robotic-Assisted',
      accuracy: '92.3%',
      description: 'AI-powered robotic guidance',
      color: '#ff7f50',
      targetOffset: { x: 0.02, y: 0.02, z: 0.02 },
      wobbleFactor: 0.002
    }
  },

  // Scoring thresholds
  SCORING: {
    EXCELLENT: 80,
    GOOD: 60,
    FAIR: 40,
    POOR: 0
  },

  // Animation timings (ms)
  ANIMATIONS: {
    SCREEN_TRANSITION: 300,
    PULSE_DURATION: 2000,
    DRILL_SPEED: 50,
    CAMERA_TRANSITION: 1000
  },

  // 3D Scene settings
  SCENE: {
    CAMERA_FOV: 45,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    CAMERA_POSITION: { x: 0, y: 5, z: 10 },
    LIGHT_INTENSITY: 1.2,
    AMBIENT_LIGHT_INTENSITY: 0.4,
    GRID_SIZE: 10,
    GRID_DIVISIONS: 10
  },

  // UI settings
  UI: {
    CANVAS_HEIGHT: 500,
    MOBILE_BREAKPOINT: 768,
    TOUCH_THRESHOLD: 10,
    METER_UPDATE_INTERVAL: 50
  },

  // Benchmark data from Dr. Jay Neugarten's study
  BENCHMARKS: {
    FREEHAND: {
      AVERAGE_ERROR: 2.4,
      VARIANCE: 0.8
    },
    STATIC: {
      AVERAGE_ERROR: 1.8,
      VARIANCE: 0.6
    },
    YOMI: {
      AVERAGE_ERROR: 0.48,
      VARIANCE: 0.2
    }
  }
};

// External URLs
export const EXTERNAL_LINKS = {
  LEARN_MORE: 'https://neocis.com/yomi',
  PRIVACY_POLICY: 'https://neocis.com/privacy',
  TERMS_OF_SERVICE: 'https://neocis.com/terms'
};

// Asset paths
export const ASSETS = {
  LOGO: './assets/neocis-logo.svg',
  ICONS: {
    FREEHAND: './assets/freehand-icon.svg',
    STATIC: './assets/static-icon.svg',
    YOMI: './assets/yomi-icon.svg',
    YOMI_ARM: './assets/yomi-arm.svg'
  },
  MODELS: {
    JAW: './models/jaw.glb',
    IMPLANT: './models/implant.glb',
    DRILL: './models/drill.glb'
  },
  SOUNDS: {
    DRILL: './sounds/drill.mp3',
    SUCCESS: './sounds/success.mp3',
    CLICK: './sounds/click.mp3'
  }
};

// Accessibility settings
export const A11Y = {
  FOCUS_VISIBLE_OUTLINE: '3px solid #ff7f50',
  MIN_TOUCH_TARGET: 44,
  HIGH_CONTRAST_MODE: false,
  REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};