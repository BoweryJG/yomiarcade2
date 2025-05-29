import { ASSETS } from '../config/constants.js';

export class LoadingManager {
  constructor() {
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.progress = 0;
    this.onProgressCallbacks = [];
    this.onCompleteCallbacks = [];
    this.assets = new Map();
  }

  addProgressListener(callback) {
    this.onProgressCallbacks.push(callback);
  }

  addCompleteListener(callback) {
    this.onCompleteCallbacks.push(callback);
  }

  updateProgress() {
    this.progress = this.totalAssets > 0 ? (this.loadedAssets / this.totalAssets) * 100 : 0;
    this.onProgressCallbacks.forEach(cb => cb(this.progress));
    
    if (this.loadedAssets === this.totalAssets && this.totalAssets > 0) {
      this.onCompleteCallbacks.forEach(cb => cb());
    }
  }

  async loadImage(key, url) {
    this.totalAssets++;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.assets.set(key, img);
        this.loadedAssets++;
        this.updateProgress();
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadedAssets++;
        this.updateProgress();
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  async loadAudio(key, url) {
    this.totalAssets++;
    
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      
      audio.addEventListener('canplaythrough', () => {
        this.assets.set(key, audio);
        this.loadedAssets++;
        this.updateProgress();
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', () => {
        this.loadedAssets++;
        this.updateProgress();
        reject(new Error(`Failed to load audio: ${url}`));
      }, { once: true });
      
      audio.src = url;
      audio.load();
    });
  }

  async loadAllAssets() {
    const loadPromises = [];

    // Load images
    Object.entries(ASSETS.ICONS).forEach(([key, url]) => {
      loadPromises.push(this.loadImage(key, url).catch(err => {
        console.warn(`Failed to load icon ${key}:`, err);
      }));
    });

    // Note: Audio loading is commented out since audio files don't exist yet
    // Object.entries(ASSETS.SOUNDS).forEach(([key, url]) => {
    //   loadPromises.push(this.loadAudio(key, url).catch(err => {
    //     console.warn(`Failed to load sound ${key}:`, err);
    //   }));
    // });

    await Promise.all(loadPromises);
    return this.assets;
  }

  getAsset(key) {
    return this.assets.get(key);
  }

  showLoadingUI() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <img src="${ASSETS.LOGO}" alt="Neocis Logo" class="loading-logo">
        <h2>Loading Yomi® Accuracy Challenge</h2>
        <div class="loading-bar">
          <div class="loading-progress" id="loading-progress"></div>
        </div>
        <p class="loading-percent" id="loading-percent">0%</p>
      </div>
    `;
    document.body.appendChild(loadingScreen);

    this.addProgressListener((progress) => {
      const progressBar = document.getElementById('loading-progress');
      const progressText = document.getElementById('loading-percent');
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    });

    this.addCompleteListener(() => {
      setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('fade-out');
          setTimeout(() => loadingScreen.remove(), 300);
        }
      }, 500);
    });
  }
}

export const loadingManager = new LoadingManager();