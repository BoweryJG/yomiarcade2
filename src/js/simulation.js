import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GAME_CONFIG } from '../config/constants.js';
import { GameError, ErrorCodes } from '../utils/errorHandler.js';

export class SimulationManager {
  constructor(canvasId, method, onComplete) {
    this.canvasId = canvasId;
    this.method = method;
    this.onComplete = onComplete;
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Game state
    this.isDrilling = false;
    this.drillProgress = 0;
    this.targetPosition = new THREE.Vector3();
    this.implantPosition = new THREE.Vector3();
    this.startTime = 0;
    this.animationId = null;
    this.isPaused = false;
    
    // Method configuration
    this.methodConfig = GAME_CONFIG.METHODS[method.toUpperCase()];
    
    // Models
    this.jawModel = null;
    this.implantModel = null;
    this.drillModel = null;
    this.targetMarker = null;
    this.crosshair = null;
    
    // UI elements
    this.angleDisplay = null;
    this.depthDisplay = null;
    
    // Touch handling
    this.touches = new Map();
    this.lastTouchDistance = 0;
  }

  async init() {
    try {
      const canvas = document.getElementById(this.canvasId);
      if (!canvas) {
        throw new GameError(
          'Canvas element not found',
          ErrorCodes.INITIALIZATION_FAILED,
          { canvasId: this.canvasId }
        );
      }

      // Setup Three.js scene
      this.setupScene(canvas);
      this.setupLighting();
      this.setupCamera();
      this.setupControls();
      await this.loadModels();
      this.setupUI();
      this.setupEventListeners();
      
      // Start render loop
      this.animate();
      
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      throw new GameError(
        'Failed to initialize simulation',
        ErrorCodes.INITIALIZATION_FAILED,
        { originalError: error.message }
      );
    }
  }

  setupScene(canvas) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.fog = new THREE.Fog(0xf0f0f0, 10, 50);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(
      GAME_CONFIG.SCENE.GRID_SIZE,
      GAME_CONFIG.SCENE.GRID_DIVISIONS,
      0x888888,
      0xcccccc
    );
    this.scene.add(gridHelper);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      GAME_CONFIG.SCENE.AMBIENT_LIGHT_INTENSITY
    );
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      GAME_CONFIG.SCENE.LIGHT_INTENSITY
    );
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  setupCamera() {
    const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.SCENE.CAMERA_FOV,
      aspect,
      GAME_CONFIG.SCENE.CAMERA_NEAR,
      GAME_CONFIG.SCENE.CAMERA_FAR
    );
    
    const pos = GAME_CONFIG.SCENE.CAMERA_POSITION;
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.target.set(0, 0, 0);
    
    // Disable controls during drilling
    this.controls.enabled = !this.isDrilling;
  }

  async loadModels() {
    const loader = new GLTFLoader();
    
    // For now, create placeholder geometry
    // TODO: Replace with actual GLTF models when available
    
    // Jaw placeholder
    const jawGeometry = new THREE.BoxGeometry(6, 2, 4);
    const jawMaterial = new THREE.MeshPhongMaterial({
      color: 0xffddcc,
      roughness: 0.8,
      metalness: 0.2
    });
    this.jawModel = new THREE.Mesh(jawGeometry, jawMaterial);
    this.jawModel.position.y = -1;
    this.jawModel.castShadow = true;
    this.jawModel.receiveShadow = true;
    this.scene.add(this.jawModel);
    
    // Add teeth placeholders
    const toothGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    const toothMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    for (let i = -2; i <= 2; i++) {
      if (i !== 0) { // Skip middle for implant site
        const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
        tooth.position.set(i * 1.2, 0.5, 0);
        tooth.castShadow = true;
        this.jawModel.add(tooth);
      }
    }
    
    // Implant placeholder
    const implantGeometry = new THREE.CylinderGeometry(0.2, 0.15, 2, 16);
    const implantMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    this.implantModel = new THREE.Mesh(implantGeometry, implantMaterial);
    this.implantModel.visible = false;
    this.scene.add(this.implantModel);
    
    // Drill placeholder
    const drillGeometry = new THREE.ConeGeometry(0.1, 2, 16);
    const drillMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
    this.drillModel = new THREE.Mesh(drillGeometry, drillMaterial);
    this.drillModel.position.y = 5;
    this.scene.add(this.drillModel);
    
    // Target marker
    const targetGeometry = new THREE.RingGeometry(0.3, 0.4, 32);
    const targetMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    this.targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
    this.targetMarker.rotation.x = -Math.PI / 2;
    this.targetMarker.position.y = 0.01;
    
    // Set target position with method-specific offset
    const offset = this.methodConfig.targetOffset;
    this.targetPosition.set(offset.x, 0, offset.z);
    this.targetMarker.position.x = this.targetPosition.x;
    this.targetMarker.position.z = this.targetPosition.z;
    this.scene.add(this.targetMarker);
    
    // Crosshair
    const crosshairGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const crosshairMaterial = new THREE.MeshBasicMaterial({
      color: this.methodConfig.color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    this.crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
    this.crosshair.renderOrder = 999;
    this.scene.add(this.crosshair);
  }

  setupUI() {
    this.angleDisplay = document.getElementById('angle-meter');
    this.depthDisplay = document.getElementById('depth-meter');
    
    // Add view controls
    this.setupViewControls();
  }

  setupViewControls() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.setCamera(view);
      });
    });
  }

  setCamera(view) {
    const positions = {
      top: { x: 0, y: 15, z: 0.1 },
      front: { x: 0, y: 5, z: 15 },
      side: { x: 15, y: 5, z: 0 },
      '3d': { x: 10, y: 10, z: 10 }
    };
    
    const pos = positions[view];
    if (pos) {
      // Animate camera to new position
      const startPos = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      };
      
      const duration = GAME_CONFIG.ANIMATIONS.CAMERA_TRANSITION;
      const startTime = Date.now();
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);
        
        this.camera.position.x = startPos.x + (pos.x - startPos.x) * eased;
        this.camera.position.y = startPos.y + (pos.y - startPos.y) * eased;
        this.camera.position.z = startPos.z + (pos.z - startPos.z) * eased;
        
        this.camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };
      
      animateCamera();
    }
  }

  setupEventListeners() {
    const canvas = this.renderer.domElement;
    
    // Mouse events
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (!this.isDrilling) {
      this.updateCrosshair();
    }
  }

  onMouseDown(event) {
    if (event.button === 0 && !this.isDrilling) {
      this.startDrilling();
    }
  }

  onMouseUp(event) {
    if (event.button === 0 && this.isDrilling) {
      this.stopDrilling();
    }
  }

  onTouchStart(event) {
    event.preventDefault();
    
    // Handle single touch as mouse click
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (!this.isDrilling) {
        this.updateCrosshair();
        this.startDrilling();
      }
    }
    
    // Store touches for gesture recognition
    for (let touch of event.touches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    }
    
    // Pinch to zoom setup
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1 && !this.isDrilling) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateCrosshair();
    }
    
    // Pinch to zoom
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (this.lastTouchDistance > 0) {
        const delta = distance - this.lastTouchDistance;
        const zoomSpeed = 0.01;
        
        this.camera.position.multiplyScalar(1 - delta * zoomSpeed);
        this.camera.position.clampLength(5, 20);
      }
      
      this.lastTouchDistance = distance;
    }
  }

  onTouchEnd(event) {
    event.preventDefault();
    
    // Clear touches
    for (let touch of event.changedTouches) {
      this.touches.delete(touch.identifier);
    }
    
    // Stop drilling on touch end
    if (event.touches.length === 0 && this.isDrilling) {
      this.stopDrilling();
    }
    
    this.lastTouchDistance = 0;
  }

  updateCrosshair() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.jawModel, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.crosshair.position.copy(point);
      this.crosshair.position.y += 0.01;
      
      // Add method-specific wobble
      if (this.methodConfig.wobbleFactor > 0) {
        const time = Date.now() * 0.001;
        this.crosshair.position.x += Math.sin(time * 5) * this.methodConfig.wobbleFactor;
        this.crosshair.position.z += Math.cos(time * 3) * this.methodConfig.wobbleFactor;
      }
      
      // Update angle display
      this.updateMeters(point);
    }
  }

  updateMeters(position) {
    // Calculate angle from vertical
    const angle = Math.atan2(
      Math.sqrt(position.x * position.x + position.z * position.z),
      position.y
    ) * 180 / Math.PI;
    
    // Calculate depth (simplified)
    const depth = Math.max(0, 2 - position.y) * 10; // Convert to mm
    
    // Update displays
    if (this.angleDisplay) {
      const anglePercent = Math.min(100, Math.max(0, (90 - angle) / 90 * 100));
      this.angleDisplay.querySelector('.meter-fill').style.width = `${anglePercent}%`;
      this.angleDisplay.querySelector('.meter-value').textContent = `${angle.toFixed(1)}°`;
      
      // Color coding
      const fill = this.angleDisplay.querySelector('.meter-fill');
      if (anglePercent > 80) {
        fill.style.backgroundColor = '#4caf50';
      } else if (anglePercent > 50) {
        fill.style.backgroundColor = '#ff9800';
      } else {
        fill.style.backgroundColor = '#f44336';
      }
    }
    
    if (this.depthDisplay) {
      const depthPercent = Math.min(100, Math.max(0, depth / 20 * 100));
      this.depthDisplay.querySelector('.meter-fill').style.width = `${depthPercent}%`;
      this.depthDisplay.querySelector('.meter-value').textContent = `${depth.toFixed(1)}mm`;
    }
  }

  startDrilling() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
    
    this.isDrilling = true;
    this.controls.enabled = false;
    
    // Position drill at crosshair
    this.drillModel.position.copy(this.crosshair.position);
    this.drillModel.position.y = 3;
    
    // Start drill animation
    this.animateDrill();
  }

  animateDrill() {
    if (!this.isDrilling) return;
    
    // Move drill down
    this.drillModel.position.y -= GAME_CONFIG.ANIMATIONS.DRILL_SPEED / 1000;
    this.drillModel.rotation.y += 0.1;
    
    // Check if drilling is complete
    if (this.drillModel.position.y <= 0) {
      this.completeDrilling();
    } else {
      requestAnimationFrame(() => this.animateDrill());
    }
  }

  stopDrilling() {
    this.isDrilling = false;
    this.controls.enabled = true;
    
    // Reset drill position
    this.drillModel.position.y = 5;
  }

  completeDrilling() {
    this.isDrilling = false;
    
    // Place implant
    this.implantPosition.copy(this.drillModel.position);
    this.implantModel.position.copy(this.implantPosition);
    this.implantModel.visible = true;
    
    // Hide drill
    this.drillModel.visible = false;
    
    // Calculate results
    const results = this.calculateResults();
    
    // Trigger completion callback
    if (this.onComplete) {
      this.onComplete(results);
    }
  }

  calculateResults() {
    const distance = this.implantPosition.distanceTo(this.targetPosition);
    const angleError = Math.random() * 10 + distance * 20; // Simplified calculation
    const depthError = Math.abs(this.implantPosition.y) * 10;
    const timeSeconds = (Date.now() - this.startTime) / 1000;
    
    return {
      finalDistance: distance,
      angleError,
      depthError,
      timeSeconds,
      position: {
        x: this.implantPosition.x,
        y: this.implantPosition.y,
        z: this.implantPosition.z
      }
    };
  }

  start() {
    this.startTime = Date.now();
    this.isPaused = false;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  reset(newMethod = null) {
    // Update method if provided
    if (newMethod) {
      this.method = newMethod;
      this.methodConfig = GAME_CONFIG.METHODS[newMethod.toUpperCase()];
    }
    
    // Reset game state
    this.isDrilling = false;
    this.drillProgress = 0;
    this.startTime = 0;
    
    // Reset models
    if (this.implantModel) {
      this.implantModel.visible = false;
    }
    if (this.drillModel) {
      this.drillModel.visible = true;
      this.drillModel.position.y = 5;
    }
    
    // Reset target position
    const offset = this.methodConfig.targetOffset;
    this.targetPosition.set(offset.x, 0, offset.z);
    if (this.targetMarker) {
      this.targetMarker.position.x = this.targetPosition.x;
      this.targetMarker.position.z = this.targetPosition.z;
    }
    
    // Update crosshair color
    if (this.crosshair) {
      this.crosshair.material.color.set(this.methodConfig.color);
    }
  }

  handleResize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  animate() {
    if (this.isPaused) {
      this.animationId = requestAnimationFrame(() => this.animate());
      return;
    }
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  dispose() {
    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Dispose of Three.js resources
    if (this.scene) {
      this.scene.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Remove event listeners
    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.onMouseMove);
      canvas.removeEventListener('mousedown', this.onMouseDown);
      canvas.removeEventListener('mouseup', this.onMouseUp);
      canvas.removeEventListener('touchstart', this.onTouchStart);
      canvas.removeEventListener('touchmove', this.onTouchMove);
      canvas.removeEventListener('touchend', this.onTouchEnd);
    }
    
    window.removeEventListener('resize', this.handleResize);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}