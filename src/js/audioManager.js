import { ASSETS, A11Y } from '../config/constants.js';

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;
    this.context = null;
    this.initialized = false;
    
    // Check if user prefers reduced motion (might want quieter sounds)
    if (A11Y.REDUCED_MOTION) {
      this.volume = 0.3;
    }
    
    // Setup audio context on first user interaction
    this.setupAudioContext();
  }

  setupAudioContext() {
    // Create audio context on first user interaction to comply with browser policies
    const initAudio = () => {
      if (!this.initialized) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
        
        // Remove the event listener after initialization
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
        
        // Load sounds
        this.loadSounds();
      }
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
  }

  async loadSounds() {
    // Note: Sound files don't exist yet, so we'll create placeholder sounds
    // In production, these would load actual audio files
    
    // Create click sound
    this.createClickSound();
    
    // Create success sound
    this.createSuccessSound();
    
    // Create drill sound
    this.createDrillSound();
  }

  createClickSound() {
    const sound = {
      play: () => {
        if (!this.enabled || !this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(this.volume * 0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.1);
      }
    };
    
    this.sounds.set('click', sound);
  }

  createSuccessSound() {
    const sound = {
      play: () => {
        if (!this.enabled || !this.context) return;
        
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, index) => {
          const oscillator = this.context.createOscillator();
          const gainNode = this.context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.context.destination);
          
          oscillator.frequency.value = freq;
          
          const startTime = this.context.currentTime + index * 0.1;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        });
      }
    };
    
    this.sounds.set('success', sound);
  }

  createDrillSound() {
    const sound = {
      oscillator: null,
      gainNode: null,
      play: () => {
        if (!this.enabled || !this.context) return;
        
        // Stop any existing drill sound
        this.stopSound('drill');
        
        this.oscillator = this.context.createOscillator();
        this.gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        this.oscillator.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        
        // Create buzzing sound
        this.oscillator.type = 'sawtooth';
        this.oscillator.frequency.value = 200;
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        this.gainNode.gain.value = this.volume * 0.05;
        
        this.oscillator.start();
        
        // Store references for stopping
        sound.oscillator = this.oscillator;
        sound.gainNode = this.gainNode;
      },
      stop: () => {
        if (sound.oscillator) {
          sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
          sound.oscillator.stop(this.context.currentTime + 0.1);
          sound.oscillator = null;
          sound.gainNode = null;
        }
      }
    };
    
    this.sounds.set('drill', sound);
  }

  playSound(name) {
    const sound = this.sounds.get(name);
    if (sound && sound.play) {
      try {
        sound.play();
      } catch (error) {
        console.warn(`Failed to play sound: ${name}`, error);
      }
    }
  }

  stopSound(name) {
    const sound = this.sounds.get(name);
    if (sound && sound.stop) {
      try {
        sound.stop();
      } catch (error) {
        console.warn(`Failed to stop sound: ${name}`, error);
      }
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Haptic feedback for mobile devices
  playHaptic(type = 'light') {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'drill':
          // Continuous vibration pattern for drilling
          navigator.vibrate([20, 10, 20, 10, 20, 10]);
          break;
      }
    }
  }
}