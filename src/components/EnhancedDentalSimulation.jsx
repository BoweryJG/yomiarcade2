import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { gsap } from 'gsap';
import { ModelGenerator } from '../js/modelGenerator';
import { EnhancedSimulation } from '../js/enhancedSimulation';
import { ResultsVisualization } from './ResultsVisualization';
import { motion } from 'framer-motion';
import '../css/simulation.css';

export function EnhancedDentalSimulation() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const simulationRef = useRef(null);
  const modelGeneratorRef = useRef(null);
  const frameId = useRef(null);
  
  const [simulationState, setSimulationState] = useState('menu');
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedProcedure, setSelectedProcedure] = useState('implant');
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.8;
    controlsRef.current = controls;
    
    // Initialize enhanced simulation
    const simulation = new EnhancedSimulation(scene, camera, renderer);
    simulationRef.current = simulation;
    
    // Initialize model generator
    const modelGenerator = new ModelGenerator();
    modelGeneratorRef.current = modelGenerator;
    
    // Create initial scene
    setupInitialScene();
    
    // Animation loop
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      
      const deltaTime = 0.016; // 60 FPS
      
      // Update controls
      controls.update();
      
      // Update simulation
      if (simulation) {
        simulation.update(deltaTime);
      }
      
      // Render
      simulation.render();
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (simulation.composer) {
        simulation.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      simulation.dispose();
    };
  }, []);
  
  const setupInitialScene = () => {
    const modelGenerator = modelGeneratorRef.current;
    const scene = sceneRef.current;
    
    // Create jaw models
    const upperJaw = modelGenerator.createJaw(true);
    upperJaw.position.y = 2;
    scene.add(upperJaw);
    
    const lowerJaw = modelGenerator.createJaw(false);
    lowerJaw.position.y = -2;
    scene.add(lowerJaw);
    
    // Add initial bacteria particles
    simulationRef.current.createBacteriaParticles(300);
    
    // Animate jaw opening
    gsap.to(upperJaw.position, {
      y: 3,
      duration: 2,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });
    
    gsap.to(lowerJaw.position, {
      y: -3,
      duration: 2,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });
  };
  
  const startSimulation = () => {
    setSimulationState('playing');
    
    // Clear initial animations
    gsap.killTweensOf("*");
    
    // Setup procedure based on selection
    switch (selectedProcedure) {
      case 'implant':
        setupImplantProcedure();
        break;
      case 'cleaning':
        setupCleaningProcedure();
        break;
      case 'cavity':
        setupCavityProcedure();
        break;
    }
  };
  
  const setupImplantProcedure = () => {
    const scene = sceneRef.current;
    const modelGenerator = modelGeneratorRef.current;
    const simulation = simulationRef.current;
    
    // Clear scene
    scene.clear();
    simulation.setupLighting();
    
    // Create patient jaw
    const jaw = modelGenerator.createJaw(false);
    scene.add(jaw);
    
    // Mark implant site
    const targetTooth = jaw.children[5]; // Select a specific tooth
    const targetMarker = modelGenerator.createTargetMarker();
    targetMarker.position.copy(targetTooth.position);
    targetMarker.position.y += 1;
    scene.add(targetMarker);
    
    // Animate marker
    gsap.to(targetMarker.rotation, {
      y: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "linear",
    });
    
    gsap.to(targetMarker.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    });
    
    // Create drill
    const drill = modelGenerator.createDrill();
    drill.position.set(5, 5, 0);
    scene.add(drill);
    
    // Create implant
    const implant = modelGenerator.createImplant();
    implant.position.set(-5, 5, 0);
    implant.visible = false;
    scene.add(implant);
    
    // Setup drill controls
    const transformControls = new TransformControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    transformControls.attach(drill);
    transformControls.setMode('translate');
    scene.add(transformControls);
    
    // Focus camera
    simulation.focusOnTooth(targetTooth);
    
    // Track performance
    let startTime = Date.now();
    let accuracy = 100;
    
    // Drill interaction
    transformControls.addEventListener('change', () => {
      const distance = drill.position.distanceTo(targetTooth.position);
      
      if (distance < 0.5) {
        // Start drilling effect
        simulation.createDrillingEffect(targetTooth.position);
        
        // Haptic feedback simulation
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      }
    });
    
    // Complete procedure
    transformControls.addEventListener('mouseup', () => {
      const distance = drill.position.distanceTo(targetTooth.position);
      
      if (distance < 0.3) {
        // Success!
        completeProcedure(true);
      }
    });
  };
  
  const setupCleaningProcedure = () => {
    const scene = sceneRef.current;
    const modelGenerator = modelGeneratorRef.current;
    const simulation = simulationRef.current;
    
    // Clear scene
    scene.clear();
    simulation.setupLighting();
    
    // Create patient jaw with plaque
    const jaw = modelGenerator.createJaw(false);
    scene.add(jaw);
    
    // Add plaque to teeth
    const teethWithPlaque = [];
    jaw.children.forEach((child, index) => {
      if (child.type === 'Group' && Math.random() > 0.3) {
        modelGenerator.addPlaque(child, Math.random() * 0.5 + 0.3);
        teethWithPlaque.push(child);
      }
    });
    
    // Create toothbrush
    const toothbrush = modelGenerator.createToothbrush();
    toothbrush.position.set(5, 0, 5);
    scene.add(toothbrush);
    
    // Setup toothbrush controls
    const transformControls = new TransformControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    transformControls.attach(toothbrush);
    transformControls.setMode('translate');
    scene.add(transformControls);
    
    // Track cleaning progress
    const cleanedTeeth = new Set();
    let startTime = Date.now();
    
    // Cleaning interaction
    transformControls.addEventListener('change', () => {
      teethWithPlaque.forEach((tooth) => {
        const distance = toothbrush.position.distanceTo(tooth.position);
        
        if (distance < 1 && !cleanedTeeth.has(tooth)) {
          // Clean tooth
          simulation.createCleaningEffect(tooth);
          cleanedTeeth.add(tooth);
          
          // Remove plaque
          const plaque = tooth.children.find(child => 
            child.material === modelGenerator.materials.plaque
          );
          if (plaque) {
            gsap.to(plaque.material, {
              opacity: 0,
              duration: 1,
              onComplete: () => {
                tooth.remove(plaque);
              }
            });
          }
          
          // Update score
          const progress = (cleanedTeeth.size / teethWithPlaque.length) * 100;
          setScore(Math.round(progress));
          
          // Check completion
          if (cleanedTeeth.size === teethWithPlaque.length) {
            completeProcedure(true);
          }
        }
      });
    });
  };
  
  const setupCavityProcedure = () => {
    const scene = sceneRef.current;
    const modelGenerator = modelGeneratorRef.current;
    const simulation = simulationRef.current;
    
    // Clear scene
    scene.clear();
    simulation.setupLighting();
    
    // Create patient jaw with cavities
    const jaw = modelGenerator.createJaw(false);
    scene.add(jaw);
    
    // Add cavities to some teeth
    const teethWithCavities = [];
    jaw.children.forEach((child, index) => {
      if (child.type === 'Group' && index % 3 === 0) {
        modelGenerator.addCavity(child, Math.random() * 0.5 + 0.3);
        teethWithCavities.push(child);
        
        // Add pain indicator
        const painIndicator = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.5,
          })
        );
        painIndicator.position.copy(child.position);
        painIndicator.position.y += 1;
        scene.add(painIndicator);
        
        // Pulse animation
        gsap.to(painIndicator.scale, {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
    });
    
    // Create dental tools
    const drill = modelGenerator.createDrill();
    drill.scale.set(0.5, 0.5, 0.5);
    drill.position.set(5, 2, 0);
    scene.add(drill);
    
    // Focus on first cavity
    if (teethWithCavities.length > 0) {
      simulation.focusOnTooth(teethWithCavities[0]);
    }
  };
  
  const completeProcedure = (success) => {
    const endTime = Date.now();
    const startTime = Date.now() - 60000; // Mock start time
    const timeElapsed = Math.round((endTime - startTime) / 1000);
    
    // Calculate final score
    const finalScore = success ? Math.max(70, 100 - timeElapsed / 2) : 50;
    
    // Create session data
    const data = {
      score: Math.round(finalScore),
      time: timeElapsed,
      accuracy: Math.round(85 + Math.random() * 15),
      improvement: Math.round(Math.random() * 20),
      attempts: [
        { accuracy: 82, speed: 75 },
        { accuracy: 88, speed: 82 },
        { accuracy: 91, speed: 88 },
      ],
      skills: {
        positioning: Math.round(80 + Math.random() * 20),
        depthControl: Math.round(75 + Math.random() * 25),
        anglePrecision: Math.round(70 + Math.random() * 30),
        speed: Math.round(80 + Math.random() * 20),
        consistency: Math.round(85 + Math.random() * 15),
      },
      lastScore: 82,
      personalBest: 95,
      avgAccuracy: 87,
      bestStreak: 5,
      completionRate: 92,
      consistentHigh: 2,
      feedback: [
        {
          icon: '🎯',
          title: 'Positioning',
          description: 'Try to maintain steadier hand position during drilling',
        },
        {
          icon: '⏱️',
          title: 'Speed',
          description: 'Great improvement! Keep practicing to increase efficiency',
        },
        {
          icon: '📐',
          title: 'Angle Control',
          description: 'Watch the entry angle more carefully on molars',
        },
      ],
    };
    
    setSessionData(data);
    setShowResults(true);
    
    // Play victory animation if high score
    if (finalScore >= 90) {
      simulationRef.current.playVictoryAnimation();
    }
  };
  
  return (
    <div className="simulation-container" ref={mountRef}>
      {simulationState === 'menu' && (
        <motion.div
          className="menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="menu-content">
            <h1 className="menu-title">Dental Training Simulator</h1>
            <p className="menu-subtitle">Select a procedure to begin</p>
            
            <div className="procedure-cards">
              <motion.div
                className={`procedure-card ${selectedProcedure === 'implant' ? 'selected' : ''}`}
                onClick={() => setSelectedProcedure('implant')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="procedure-icon">🦷</div>
                <h3>Implant Placement</h3>
                <p>Practice precise implant positioning</p>
              </motion.div>
              
              <motion.div
                className={`procedure-card ${selectedProcedure === 'cleaning' ? 'selected' : ''}`}
                onClick={() => setSelectedProcedure('cleaning')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="procedure-icon">🪥</div>
                <h3>Teeth Cleaning</h3>
                <p>Remove plaque and bacteria</p>
              </motion.div>
              
              <motion.div
                className={`procedure-card ${selectedProcedure === 'cavity' ? 'selected' : ''}`}
                onClick={() => setSelectedProcedure('cavity')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="procedure-icon">🔧</div>
                <h3>Cavity Treatment</h3>
                <p>Fill cavities with precision</p>
              </motion.div>
            </div>
            
            <div className="difficulty-selector">
              <h4>Difficulty</h4>
              <div className="difficulty-buttons">
                <button
                  className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  Medium
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard
                </button>
              </div>
            </div>
            
            <motion.button
              className="start-button"
              onClick={startSimulation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Training
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {simulationState === 'playing' && (
        <div className="hud">
          <div className="score-display">
            <div className="score-label">Score</div>
            <div className="score-value">{score}%</div>
          </div>
          
          <div className="procedure-info">
            <h3>{selectedProcedure.charAt(0).toUpperCase() + selectedProcedure.slice(1)} Procedure</h3>
            <p>Follow the markers and complete the procedure</p>
          </div>
          
          <button className="exit-button" onClick={() => setSimulationState('menu')}>
            Exit Training
          </button>
        </div>
      )}
      
      {showResults && (
        <ResultsVisualization
          sessionData={sessionData}
          onClose={() => {
            setShowResults(false);
            setSimulationState('menu');
          }}
        />
      )}
    </div>
  );
}