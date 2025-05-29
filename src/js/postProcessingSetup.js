import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { ChromaticAberrationShader } from 'three/examples/jsm/shaders/ChromaticAberrationShader';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader';
import { gsap } from 'gsap';

export class PostProcessingSetup {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    this.composer = null;
    this.passes = {};
    
    this.setupComposer();
    this.setupPasses();
  }

  setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  setupPasses() {
    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // SMAA for better antialiasing
    const smaaPass = new SMAAPass(
      window.innerWidth * this.renderer.getPixelRatio(),
      window.innerHeight * this.renderer.getPixelRatio()
    );
    this.composer.addPass(smaaPass);
    this.passes.smaa = smaaPass;
    
    // Bloom pass for glowing effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    bloomPass.enabled = true;
    this.composer.addPass(bloomPass);
    this.passes.bloom = bloomPass;
    
    // Depth of field
    const bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 5.0,
      aperture: 0.025,
      maxblur: 0.01,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    bokehPass.enabled = false; // Enable only when needed
    this.composer.addPass(bokehPass);
    this.passes.bokeh = bokehPass;
    
    // Film grain for cinematic effect
    const filmPass = new FilmPass(
      0.15, // noise intensity
      0.025, // scanline intensity
      648, // scanline count
      false // grayscale
    );
    filmPass.enabled = true;
    this.composer.addPass(filmPass);
    this.passes.film = filmPass;
    
    // Chromatic aberration for edge distortion
    const chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
    chromaticAberrationPass.uniforms['aberrationOffset'].value = 0.002;
    chromaticAberrationPass.enabled = false;
    this.composer.addPass(chromaticAberrationPass);
    this.passes.chromaticAberration = chromaticAberrationPass;
    
    // Vignette for focus effect
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 0.95;
    vignettePass.uniforms['darkness'].value = 1.2;
    vignettePass.enabled = true;
    this.composer.addPass(vignettePass);
    this.passes.vignette = vignettePass;
    
    // Custom color grading shader
    const colorGradingShader = {
      uniforms: {
        tDiffuse: { value: null },
        brightness: { value: 1.0 },
        contrast: { value: 1.0 },
        saturation: { value: 1.0 },
        temperature: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        uniform float temperature;
        varying vec2 vUv;
        
        vec3 adjustTemperature(vec3 color, float temp) {
          vec3 warmFilter = vec3(1.0, 0.9, 0.8);
          vec3 coolFilter = vec3(0.8, 0.9, 1.0);
          vec3 filter = mix(coolFilter, warmFilter, (temp + 1.0) * 0.5);
          return color * filter;
        }
        
        vec3 adjustSaturation(vec3 color, float sat) {
          float gray = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(gray), color, sat);
        }
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Brightness
          color.rgb *= brightness;
          
          // Contrast
          color.rgb = (color.rgb - 0.5) * contrast + 0.5;
          
          // Saturation
          color.rgb = adjustSaturation(color.rgb, saturation);
          
          // Temperature
          color.rgb = adjustTemperature(color.rgb, temperature);
          
          gl_FragColor = color;
        }
      `,
    };
    
    const colorGradingPass = new ShaderPass(colorGradingShader);
    colorGradingPass.enabled = true;
    this.composer.addPass(colorGradingPass);
    this.passes.colorGrading = colorGradingPass;
    
    // Make sure the last pass renders to screen
    colorGradingPass.renderToScreen = true;
  }

  // Effect presets
  enableCinematicMode() {
    gsap.to(this.passes.bokeh.uniforms.focus, {
      value: 3.0,
      duration: 1,
    });
    
    gsap.to(this.passes.vignette.uniforms.darkness, {
      value: 1.5,
      duration: 1,
    });
    
    gsap.to(this.passes.colorGrading.uniforms.contrast, {
      value: 1.2,
      duration: 1,
    });
    
    this.passes.bokeh.enabled = true;
    this.passes.film.uniforms.nIntensity.value = 0.25;
  }

  enableSurgicalMode() {
    // High clarity for precision work
    this.passes.bokeh.enabled = false;
    this.passes.film.enabled = false;
    this.passes.chromaticAberration.enabled = false;
    
    gsap.to(this.passes.bloom, {
      strength: 0.5,
      radius: 0.2,
      duration: 1,
    });
    
    gsap.to(this.passes.colorGrading.uniforms, {
      brightness: 1.2,
      contrast: 1.1,
      saturation: 0.9,
      temperature: -0.1,
      duration: 1,
    });
  }

  enableDramaticMode() {
    gsap.to(this.passes.bloom, {
      strength: 2.0,
      radius: 0.6,
      threshold: 0.7,
      duration: 1,
    });
    
    gsap.to(this.passes.colorGrading.uniforms, {
      contrast: 1.4,
      saturation: 1.2,
      temperature: 0.2,
      duration: 1,
    });
    
    this.passes.chromaticAberration.enabled = true;
    this.passes.chromaticAberration.uniforms.aberrationOffset.value = 0.003;
  }

  // Dynamic effects
  pulseBloom(duration = 1, intensity = 2) {
    gsap.to(this.passes.bloom, {
      strength: intensity,
      duration: duration * 0.5,
      ease: "power2.in",
      yoyo: true,
      repeat: 1,
    });
  }

  focusTransition(nearFocus, farFocus, duration = 2) {
    const timeline = gsap.timeline();
    
    this.passes.bokeh.enabled = true;
    
    timeline.to(this.passes.bokeh.uniforms.focus, {
      value: nearFocus,
      duration: duration * 0.5,
      ease: "power2.inOut",
    });
    
    timeline.to(this.passes.bokeh.uniforms.focus, {
      value: farFocus,
      duration: duration * 0.5,
      ease: "power2.inOut",
    });
    
    return timeline;
  }

  glitchEffect(duration = 0.5) {
    const timeline = gsap.timeline();
    
    // Chromatic aberration glitch
    this.passes.chromaticAberration.enabled = true;
    
    timeline.to(this.passes.chromaticAberration.uniforms.aberrationOffset, {
      value: 0.01,
      duration: duration * 0.1,
      ease: "steps(5)",
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        this.passes.chromaticAberration.uniforms.aberrationOffset.value = 0.002;
        this.passes.chromaticAberration.enabled = false;
      }
    });
    
    // Color distortion
    timeline.to(this.passes.colorGrading.uniforms, {
      saturation: 0,
      duration: duration * 0.2,
      ease: "power2.in",
      yoyo: true,
      repeat: 1,
    }, 0);
    
    return timeline;
  }

  fadeToWhite(duration = 1) {
    const whiteOverlay = {
      uniforms: {
        tDiffuse: { value: null },
        opacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          gl_FragColor = mix(color, vec4(1.0), opacity);
        }
      `,
    };
    
    const fadePass = new ShaderPass(whiteOverlay);
    fadePass.renderToScreen = true;
    this.composer.addPass(fadePass);
    
    gsap.to(fadePass.uniforms.opacity, {
      value: 1,
      duration,
      ease: "power2.in",
      onComplete: () => {
        this.composer.removePass(fadePass);
      }
    });
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
    
    // Update passes that need size info
    this.passes.bokeh.uniforms["aspect"].value = width / height;
    this.passes.smaa.setSize(width, height);
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}