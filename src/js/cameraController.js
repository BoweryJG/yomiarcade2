import * as THREE from 'three';
import { gsap } from 'gsap';

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.positions = new Map();
    this.currentView = 'default';
    this.isAnimating = false;
    
    this.setupDefaultPositions();
  }

  setupDefaultPositions() {
    // Define camera positions for different views
    this.positions.set('default', {
      position: new THREE.Vector3(5, 5, 10),
      target: new THREE.Vector3(0, 0, 0),
      fov: 60,
    });
    
    this.positions.set('overview', {
      position: new THREE.Vector3(8, 12, 15),
      target: new THREE.Vector3(0, 0, 0),
      fov: 45,
    });
    
    this.positions.set('closeup', {
      position: new THREE.Vector3(2, 2, 4),
      target: new THREE.Vector3(0, 0, 0),
      fov: 40,
    });
    
    this.positions.set('surgical', {
      position: new THREE.Vector3(0, 6, 2),
      target: new THREE.Vector3(0, 0, 0),
      fov: 35,
    });
    
    this.positions.set('lateral', {
      position: new THREE.Vector3(10, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      fov: 50,
    });
    
    this.positions.set('frontal', {
      position: new THREE.Vector3(0, 0, 10),
      target: new THREE.Vector3(0, 0, 0),
      fov: 50,
    });
    
    this.positions.set('orbit', {
      position: new THREE.Vector3(8, 5, 8),
      target: new THREE.Vector3(0, 0, 0),
      fov: 55,
    });
  }

  transitionTo(viewName, duration = 2, ease = "power2.inOut", onComplete) {
    if (this.isAnimating) return;
    
    const view = this.positions.get(viewName);
    if (!view) return;
    
    this.isAnimating = true;
    this.currentView = viewName;
    
    // Disable controls during animation
    this.controls.enabled = false;
    
    // Create smooth camera transition
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        this.controls.enabled = true;
        this.controls.target.copy(view.target);
        if (onComplete) onComplete();
      }
    });
    
    // Animate camera position
    timeline.to(this.camera.position, {
      x: view.position.x,
      y: view.position.y,
      z: view.position.z,
      duration,
      ease,
    }, 0);
    
    // Animate camera target
    timeline.to(this.controls.target, {
      x: view.target.x,
      y: view.target.y,
      z: view.target.z,
      duration,
      ease,
      onUpdate: () => {
        this.camera.lookAt(this.controls.target);
      }
    }, 0);
    
    // Animate FOV
    timeline.to(this.camera, {
      fov: view.fov,
      duration: duration * 0.8,
      ease,
      onUpdate: () => {
        this.camera.updateProjectionMatrix();
      }
    }, 0);
  }

  focusOnObject(object, offset = new THREE.Vector3(2, 2, 4), duration = 1.5) {
    if (this.isAnimating) return;
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate optimal camera position
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / Math.sin(fov / 2));
    
    const targetPosition = center.clone().add(
      offset.normalize().multiplyScalar(distance * 1.5)
    );
    
    this.isAnimating = true;
    this.controls.enabled = false;
    
    gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(center);
      },
      onComplete: () => {
        this.isAnimating = false;
        this.controls.enabled = true;
        this.controls.target.copy(center);
      }
    });
  }

  shake(intensity = 0.5, duration = 0.5) {
    const originalPosition = this.camera.position.clone();
    
    gsap.to(this.camera.position, {
      x: originalPosition.x + (Math.random() - 0.5) * intensity,
      y: originalPosition.y + (Math.random() - 0.5) * intensity,
      z: originalPosition.z + (Math.random() - 0.5) * intensity,
      duration: duration * 0.1,
      ease: "power2.inOut",
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        this.camera.position.copy(originalPosition);
      }
    });
  }

  orbit(radius = 10, height = 5, speed = 0.5) {
    const timeline = gsap.timeline({ repeat: -1 });
    
    timeline.to(this.camera.position, {
      duration: 20 / speed,
      ease: "none",
      onUpdate: () => {
        const time = timeline.time() * speed;
        this.camera.position.x = Math.cos(time) * radius;
        this.camera.position.z = Math.sin(time) * radius;
        this.camera.position.y = height + Math.sin(time * 2) * 2;
        this.camera.lookAt(0, 0, 0);
      }
    });
    
    return timeline;
  }

  dollyZoom(targetFOV, duration = 2) {
    const startFOV = this.camera.fov;
    const startPosition = this.camera.position.clone();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    gsap.to(this, {
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        const progress = gsap.getProperty(this, "progress");
        const currentFOV = startFOV + (targetFOV - startFOV) * progress;
        
        // Calculate distance to maintain same view size
        const factor = Math.tan((startFOV / 2) * Math.PI / 180) / 
                      Math.tan((currentFOV / 2) * Math.PI / 180);
        
        const newDistance = startPosition.length() * factor;
        const newPosition = direction.multiplyScalar(-newDistance);
        
        this.camera.position.copy(newPosition);
        this.camera.fov = currentFOV;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  cinematicReveal(target, duration = 3) {
    const startPosition = new THREE.Vector3(0, 20, 0);
    const endPosition = new THREE.Vector3(5, 5, 10);
    
    this.camera.position.copy(startPosition);
    this.camera.lookAt(target);
    
    const timeline = gsap.timeline();
    
    // Dramatic entrance
    timeline.to(this.camera.position, {
      x: endPosition.x,
      y: endPosition.y,
      z: endPosition.z,
      duration,
      ease: "power3.inOut",
      onUpdate: () => {
        this.camera.lookAt(target);
      }
    });
    
    // FOV change for dramatic effect
    timeline.to(this.camera, {
      fov: 60,
      duration: duration * 0.7,
      ease: "power2.out",
      onUpdate: () => {
        this.camera.updateProjectionMatrix();
      }
    }, 0);
    
    return timeline;
  }

  flyThrough(path, duration = 10, lookAhead = true) {
    const curve = new THREE.CatmullRomCurve3(path);
    const points = curve.getPoints(100);
    
    const timeline = gsap.timeline();
    
    timeline.to(this, {
      duration,
      ease: "none",
      onUpdate: function() {
        const progress = this.progress();
        const position = curve.getPoint(progress);
        this.camera.position.copy(position);
        
        if (lookAhead && progress < 0.99) {
          const lookAtPoint = curve.getPoint(Math.min(progress + 0.05, 1));
          this.camera.lookAt(lookAtPoint);
        }
      }.bind(this)
    });
    
    return timeline;
  }

  setDepthOfField(focus, aperture, maxBlur) {
    // This would integrate with post-processing effects
    // Placeholder for DOF settings
    this.dofSettings = { focus, aperture, maxBlur };
  }

  reset(duration = 1.5) {
    this.transitionTo('default', duration);
  }
}