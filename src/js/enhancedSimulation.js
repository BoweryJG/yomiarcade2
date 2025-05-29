import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { gsap } from 'gsap';

export class EnhancedSimulation {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    this.particles = [];
    this.animations = [];
    this.lights = [];
    
    this.setupPostProcessing();
    this.setupLighting();
    this.createEnvironment();
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom for glowing effects
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    this.composer.addPass(this.bloomPass);
    
    // Depth of field
    this.bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 5.0,
      aperture: 0.025,
      maxblur: 0.01,
    });
    this.composer.addPass(this.bokehPass);
    
    // Film grain for realism
    this.filmPass = new FilmPass(
      0.15, // noise intensity
      0.025, // scanline intensity
      648, // scanline count
      false // grayscale
    );
    this.filmPass.renderToScreen = true;
    this.composer.addPass(this.filmPass);
  }

  setupLighting() {
    // Main key light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    this.scene.add(keyLight);
    this.lights.push(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4A90E2, 0.6);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    this.lights.push(fillLight);
    
    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0xFF6B6B, 0.8);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
    this.lights.push(rimLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xF0F0F0, 0.4);
    this.scene.add(ambientLight);
    
    // Dental operation light
    this.operationLight = new THREE.SpotLight(0xFFFFFF, 2);
    this.operationLight.position.set(0, 8, 0);
    this.operationLight.angle = Math.PI / 6;
    this.operationLight.penumbra = 0.3;
    this.operationLight.decay = 2;
    this.operationLight.distance = 20;
    this.operationLight.castShadow = true;
    this.operationLight.shadow.mapSize.width = 1024;
    this.operationLight.shadow.mapSize.height = 1024;
    this.scene.add(this.operationLight);
    
    // Light helper cone
    const lightCone = new THREE.ConeGeometry(2, 4, 32, 1, true);
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    this.lightCone = new THREE.Mesh(lightCone, lightMaterial);
    this.lightCone.position.copy(this.operationLight.position);
    this.lightCone.position.y -= 2;
    this.scene.add(this.lightCone);
  }

  createEnvironment() {
    // Create HDR environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Gradient sky
    const skyGeo = new THREE.SphereGeometry(50, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  createBacteriaParticles(count = 500) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const bacteriaColors = [
      new THREE.Color(0xFF6B6B), // Red harmful bacteria
      new THREE.Color(0xFFE66D), // Orange bacteria
      new THREE.Color(0x4ECDC4), // Teal beneficial bacteria
    ];
    
    for (let i = 0; i < count; i++) {
      // Random positions around teeth
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 2 - 1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      // Random colors
      const color = bacteriaColors[Math.floor(Math.random() * bacteriaColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float animatedSize = size * (1.0 + 0.3 * sin(time + position.x * 10.0));
          gl_PointSize = animatedSize * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(geometry, material);
    this.particles.push({ mesh: particles, material });
    this.scene.add(particles);
    
    return particles;
  }

  createFoodParticles(position, count = 100) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
      
      // Food particle colors
      const hue = Math.random() * 0.1 + 0.05; // Yellow to orange
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = Math.random() * 0.02 - 0.03;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
    });
    
    const particles = new THREE.Points(geometry, material);
    const particleSystem = { 
      mesh: particles, 
      velocities,
      life: 0,
      maxLife: 2,
    };
    
    this.particles.push(particleSystem);
    this.scene.add(particles);
    
    return particleSystem;
  }

  createCleaningEffect(tooth) {
    // Create sparkle particles
    const sparkleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkleCount * 3);
    const colors = new Float32Array(sparkleCount * 3);
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      positions[i * 3] = tooth.position.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = tooth.position.y + Math.random() * 0.5;
      positions[i * 3 + 2] = tooth.position.z + Math.sin(angle) * radius;
      
      // Sparkle colors (white to light blue)
      const color = new THREE.Color().setHSL(0.55, 0.3, 0.9 + Math.random() * 0.1);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const sparkles = new THREE.Points(geometry, material);
    this.scene.add(sparkles);
    
    // Animate sparkles
    gsap.to(sparkles.rotation, {
      y: Math.PI * 2,
      duration: 2,
      ease: "power2.inOut",
    });
    
    gsap.to(sparkles.scale, {
      x: 2,
      y: 2,
      z: 2,
      duration: 1,
      ease: "power2.out",
    });
    
    gsap.to(material, {
      opacity: 0,
      duration: 2,
      onComplete: () => {
        this.scene.remove(sparkles);
        geometry.dispose();
        material.dispose();
      }
    });
    
    // Clean tooth animation
    if (tooth.material) {
      gsap.to(tooth.material.color, {
        r: 1,
        g: 1,
        b: 0.97,
        duration: 1,
        ease: "power2.inOut",
      });
    }
  }

  createDrillingEffect(position) {
    // Bone particle system
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Bone dust colors
      const color = new THREE.Color().setHSL(0.08, 0.2, 0.85 + Math.random() * 0.15);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Radial velocities
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.05 + 0.02;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.random() * 0.1 + 0.05;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
    });
    
    const particles = new THREE.Points(geometry, material);
    const system = {
      mesh: particles,
      velocities,
      life: 0,
      maxLife: 1.5,
      gravity: -0.01,
    };
    
    this.particles.push(system);
    this.scene.add(particles);
    
    // Add smoke effect
    this.createSmokeEffect(position);
  }

  createSmokeEffect(position) {
    const smokeCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(smokeCount * 3);
    const sizes = new Float32Array(smokeCount);
    
    for (let i = 0; i < smokeCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.2;
      sizes[i] = Math.random() * 0.3 + 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying float vOpacity;
        void main() {
          vec3 pos = position;
          pos.y += time * 2.0;
          pos.x += sin(time + position.x * 10.0) * 0.1;
          pos.z += cos(time + position.z * 10.0) * 0.1;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          vOpacity = 1.0 - (time / 2.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(0.9, 0.9, 0.9, alpha * opacity * vOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    
    const smoke = new THREE.Points(geometry, material);
    this.scene.add(smoke);
    
    // Animate smoke
    const smokeAnimation = {
      mesh: smoke,
      material,
      startTime: Date.now(),
      duration: 2000,
    };
    
    this.animations.push(smokeAnimation);
  }

  animateCameraTo(position, target, duration = 2) {
    gsap.to(this.camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(target);
      }
    });
  }

  focusOnTooth(tooth) {
    const offset = new THREE.Vector3(2, 2, 3);
    const targetPosition = tooth.position.clone().add(offset);
    
    this.animateCameraTo(targetPosition, tooth.position);
    
    // Adjust depth of field
    gsap.to(this.bokehPass.uniforms.focus, {
      value: 3,
      duration: 1,
    });
  }

  playVictoryAnimation() {
    // Create confetti
    const confettiCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(confettiCount * 3);
    const colors = new Float32Array(confettiCount * 3);
    const rotations = new Float32Array(confettiCount * 3);
    
    const confettiColors = [
      new THREE.Color(0xFF6B6B),
      new THREE.Color(0x4ECDC4),
      new THREE.Color(0xFFE66D),
      new THREE.Color(0x95E1D3),
      new THREE.Color(0xC7CEEA),
    ];
    
    for (let i = 0; i < confettiCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10 + 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      rotations[i * 3] = Math.random() * Math.PI * 2;
      rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
      rotations[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute vec3 rotation;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y -= time * 5.0;
          pos.x += sin(time + rotation.x) * 2.0;
          pos.z += cos(time + rotation.z) * 2.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 20.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          if (length(coord) > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      vertexColors: true,
    });
    
    const confetti = new THREE.Points(geometry, material);
    this.scene.add(confetti);
    
    // Animate confetti
    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      material.uniforms.time.value = elapsed;
      
      if (elapsed < 5) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(confetti);
        geometry.dispose();
        material.dispose();
      }
    };
    animate();
    
    // Flash lights
    this.lights.forEach((light, index) => {
      gsap.to(light, {
        intensity: light.intensity * 1.5,
        duration: 0.2,
        yoyo: true,
        repeat: 5,
        delay: index * 0.1,
      });
    });
    
    // Bloom effect
    gsap.to(this.bloomPass, {
      strength: 3,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
    });
  }

  update(deltaTime) {
    // Update particle systems
    this.particles.forEach((system, index) => {
      if (system.material && system.material.uniforms && system.material.uniforms.time) {
        system.material.uniforms.time.value += deltaTime;
      }
      
      // Update particle physics
      if (system.velocities && system.life !== undefined) {
        system.life += deltaTime;
        
        if (system.life > system.maxLife) {
          this.scene.remove(system.mesh);
          this.particles.splice(index, 1);
          return;
        }
        
        const positions = system.mesh.geometry.attributes.position;
        const velocities = system.velocities;
        
        for (let i = 0; i < positions.count; i++) {
          positions.setX(i, positions.getX(i) + velocities[i * 3]);
          positions.setY(i, positions.getY(i) + velocities[i * 3 + 1]);
          positions.setZ(i, positions.getZ(i) + velocities[i * 3 + 2]);
          
          // Apply gravity
          if (system.gravity) {
            velocities[i * 3 + 1] += system.gravity * deltaTime;
          }
        }
        
        positions.needsUpdate = true;
        
        // Fade out
        if (system.mesh.material.opacity !== undefined) {
          system.mesh.material.opacity = 1 - (system.life / system.maxLife);
        }
      }
    });
    
    // Update smoke animations
    this.animations.forEach((anim, index) => {
      const elapsed = (Date.now() - anim.startTime) / 1000;
      
      if (anim.material && anim.material.uniforms && anim.material.uniforms.time) {
        anim.material.uniforms.time.value = elapsed;
      }
      
      if (elapsed > anim.duration / 1000) {
        this.scene.remove(anim.mesh);
        this.animations.splice(index, 1);
      }
    });
    
    // Animate operation light
    this.operationLight.position.x = Math.sin(Date.now() * 0.0005) * 0.5;
    this.operationLight.position.z = Math.cos(Date.now() * 0.0005) * 0.5;
    this.lightCone.position.copy(this.operationLight.position);
    this.lightCone.position.y -= 2;
  }

  render() {
    this.composer.render();
  }

  dispose() {
    // Clean up all resources
    this.particles.forEach(system => {
      this.scene.remove(system.mesh);
      system.mesh.geometry.dispose();
      system.mesh.material.dispose();
    });
    
    this.animations.forEach(anim => {
      this.scene.remove(anim.mesh);
      anim.mesh.geometry.dispose();
      anim.material.dispose();
    });
    
    this.composer.dispose();
  }
}