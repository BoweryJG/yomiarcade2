/**
 * Neocis Yomi® Accuracy Challenge
 * Simulation Module
 * 
 * This script handles the 3D simulation of dental implant placement
 */

// Create a namespace for the simulation
window.YomiSimulation = (function() {
    // Private variables
    let scene, camera, renderer, controls;
    let jawModel, implantModel, targetPosition, targetRotation;
    let currentMethod = null;
    let currentView = 'buccal';
    let isDragging = false;
    let implantAngle = 0;
    let implantDepth = 0;
    let canvasContainer;
    let angleValue, depthValue, angleMeter, depthMeter;
    let crosshair;
    
    // Method parameters
    const methodParams = {
        freehand: {
            stabilityFactor: 0.2,  // Lower means more hand shake
            precisionFactor: 0.3,  // Lower means less precision
            maxAngleDeviation: 10, // Maximum possible angle deviation in degrees
            maxDepthDeviation: 2   // Maximum possible depth deviation in mm
        },
        static: {
            stabilityFactor: 0.6,
            precisionFactor: 0.6,
            maxAngleDeviation: 5,
            maxDepthDeviation: 1.5
        },
        yomi: {
            stabilityFactor: 0.9,
            precisionFactor: 0.95,
            maxAngleDeviation: 2,
            maxDepthDeviation: 0.5
        }
    };
    
    // Benchmark values from Dr. Neugarten's study
    const benchmarks = {
        freehand: { angle: 7.03, depth: 1.1 },
        static: { angle: 3.9, depth: 1.1 },
        yomi: { angle: 1.42, depth: 0.14 }
    };
    
    // Public methods
    return {
        // Store current method
        currentMethod: null,
        
        // Initialize the simulation
        initialize: function(method) {
            console.log('Initializing simulation with method:', method);
            
            // Store the selected method
            this.currentMethod = currentMethod = method;
            
            // Get DOM elements
            canvasContainer = document.getElementById('simulation-canvas');
            angleValue = document.getElementById('angle-value');
            depthValue = document.getElementById('depth-value');
            angleMeter = document.getElementById('angle-meter');
            depthMeter = document.getElementById('depth-meter');
            crosshair = document.getElementById('crosshair');
            
            // Reset values
            implantAngle = 0;
            implantDepth = 0;
            updateMeters();
            
            // Initialize Three.js scene
            initScene();
            
            // Add event listeners for interaction
            addEventListeners();
            
            // Start animation loop
            animate();
            
            // Set initial view
            this.setView('buccal');
        },
        
        // Set the camera view
        setView: function(view) {
            currentView = view;
            
            switch(view) {
                case 'buccal':
                    camera.position.set(0, 0, 10);
                    break;
                case 'lingual':
                    camera.position.set(0, 0, -10);
                    break;
                case 'occlusal':
                    camera.position.set(0, 10, 0);
                    break;
                case 'free':
                    // Don't change camera position, let user control it
                    controls.enabled = true;
                    return;
                default:
                    camera.position.set(0, 0, 10);
            }
            
            camera.lookAt(0, 0, 0);
            controls.enabled = false;
        },
        
        // Complete the simulation and return results
        completeSimulation: function() {
            // Stop animation
            cancelAnimationFrame(animationId);
            
            // Calculate final score based on angle and depth deviation
            const angleDeviation = implantAngle;
            const depthDeviation = implantDepth;
            
            // Calculate score (0-100)
            // Lower deviation = higher score
            const maxAngleDeviation = methodParams[currentMethod].maxAngleDeviation;
            const maxDepthDeviation = methodParams[currentMethod].maxDepthDeviation;
            
            const angleScore = 100 - (angleDeviation / maxAngleDeviation) * 100;
            const depthScore = 100 - (depthDeviation / maxDepthDeviation) * 100;
            
            // Combined score with more weight on angle
            const score = Math.round((angleScore * 0.6) + (depthScore * 0.4));
            
            // Clamp score between 0 and 100
            const finalScore = Math.max(0, Math.min(100, score));
            
            // Return results
            return {
                method: currentMethod,
                angle: angleDeviation,
                depth: depthDeviation,
                score: finalScore
            };
        },
        
        // Format method name for display (implemented in app.js)
        formatMethodName: function(method) {
            if (!method) return 'Unknown';
            
            switch(method.toLowerCase()) {
                case 'freehand':
                    return 'Freehand';
                case 'static':
                    return 'Static Guided';
                case 'yomi':
                    return 'Yomi Robotic-Assisted';
                default:
                    return method.charAt(0).toUpperCase() + method.slice(1);
            }
        }
    };
    
    // Private functions
    
    // Initialize Three.js scene
    function initScene() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            45,
            canvasContainer.clientWidth / canvasContainer.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 10);
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        canvasContainer.innerHTML = '';
        canvasContainer.appendChild(renderer.domElement);
        
        // Create orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.enabled = false; // Disabled by default except in free view
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Create simple jaw model (placeholder)
        const jawGeometry = new THREE.BoxGeometry(5, 2, 3);
        const jawMaterial = new THREE.MeshPhongMaterial({ color: 0xd3d3d3 });
        jawModel = new THREE.Mesh(jawGeometry, jawMaterial);
        scene.add(jawModel);
        
        // Create implant model (placeholder)
        const implantGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 32);
        const implantMaterial = new THREE.MeshPhongMaterial({ color: 0x909090 });
        implantModel = new THREE.Mesh(implantGeometry, implantMaterial);
        implantModel.position.set(0, 2, 0);
        implantModel.rotation.x = Math.PI / 2; // Align with Y axis
        scene.add(implantModel);
        
        // Set target position and rotation
        targetPosition = new THREE.Vector3(0, 0, 0);
        targetRotation = new THREE.Euler(Math.PI / 2, 0, 0);
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }
    
    // Add event listeners for user interaction
    function addEventListeners() {
        // Mouse events for implant positioning
        canvasContainer.addEventListener('mousedown', onMouseDown);
        canvasContainer.addEventListener('mousemove', onMouseMove);
        canvasContainer.addEventListener('mouseup', onMouseUp);
        
        // Touch events for mobile
        canvasContainer.addEventListener('touchstart', onTouchStart);
        canvasContainer.addEventListener('touchmove', onTouchMove);
        canvasContainer.addEventListener('touchend', onTouchEnd);
    }
    
    // Mouse event handlers
    function onMouseDown(event) {
        if (currentView === 'free') return; // Don't handle in free view
        isDragging = true;
    }
    
    function onMouseMove(event) {
        if (!isDragging || currentView === 'free') return;
        
        // Get mouse position relative to canvas
        const rect = canvasContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Apply method-specific constraints
        updateImplantPosition(x, y);
    }
    
    function onMouseUp() {
        isDragging = false;
    }
    
    // Touch event handlers
    function onTouchStart(event) {
        if (currentView === 'free') return;
        isDragging = true;
        event.preventDefault();
    }
    
    function onTouchMove(event) {
        if (!isDragging || currentView === 'free') return;
        
        // Get touch position relative to canvas
        const rect = canvasContainer.getBoundingClientRect();
        const touch = event.touches[0];
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Apply method-specific constraints
        updateImplantPosition(x, y);
        event.preventDefault();
    }
    
    function onTouchEnd() {
        isDragging = false;
    }
    
    // Update implant position based on user input and method constraints
    function updateImplantPosition(x, y) {
        if (!currentMethod || !methodParams[currentMethod]) return;
        
        // Get method parameters
        const params = methodParams[currentMethod];
        
        // Add some randomness based on stability factor (simulates hand shake)
        const stabilityFactor = params.stabilityFactor;
        const randomFactor = (1 - stabilityFactor) * 0.1;
        const randomX = (Math.random() - 0.5) * randomFactor;
        const randomY = (Math.random() - 0.5) * randomFactor;
        
        // Apply precision factor (higher = more precise control)
        const precisionFactor = params.precisionFactor;
        const controlledX = x * precisionFactor + randomX;
        const controlledY = y * precisionFactor + randomY;
        
        // Calculate angle deviation based on position
        // Convert from -1,1 range to angle in degrees
        const maxAngle = params.maxAngleDeviation;
        const angleX = controlledX * maxAngle;
        const angleY = controlledY * maxAngle;
        
        // Update implant rotation
        implantModel.rotation.x = targetRotation.x + THREE.MathUtils.degToRad(angleY);
        implantModel.rotation.z = targetRotation.z + THREE.MathUtils.degToRad(angleX);
        
        // Calculate total angle deviation in degrees
        implantAngle = Math.sqrt(angleX * angleX + angleY * angleY);
        
        // Calculate depth deviation (distance from target position)
        implantDepth = Math.abs(controlledX + controlledY) * params.maxDepthDeviation;
        
        // Update UI meters
        updateMeters();
    }
    
    // Update angle and depth meters in UI
    function updateMeters() {
        if (angleValue) angleValue.textContent = implantAngle.toFixed(2) + '°';
        if (depthValue) depthValue.textContent = implantDepth.toFixed(2) + 'mm';
        
        // Update meter fill
        if (angleMeter) {
            const maxAngle = methodParams[currentMethod].maxAngleDeviation;
            const anglePercent = (implantAngle / maxAngle) * 100;
            angleMeter.style.width = anglePercent + '%';
            
            // Change color based on value
            if (anglePercent > 80) {
                angleMeter.style.backgroundColor = '#E74C3C'; // Red
            } else if (anglePercent > 50) {
                angleMeter.style.backgroundColor = '#F39C12'; // Orange
            } else {
                angleMeter.style.backgroundColor = '#2ECC71'; // Green
            }
        }
        
        if (depthMeter) {
            const maxDepth = methodParams[currentMethod].maxDepthDeviation;
            const depthPercent = (implantDepth / maxDepth) * 100;
            depthMeter.style.width = depthPercent + '%';
            
            // Change color based on value
            if (depthPercent > 80) {
                depthMeter.style.backgroundColor = '#E74C3C'; // Red
            } else if (depthPercent > 50) {
                depthMeter.style.backgroundColor = '#F39C12'; // Orange
            } else {
                depthMeter.style.backgroundColor = '#2ECC71'; // Green
            }
        }
    }
    
    // Handle window resize
    function onWindowResize() {
        if (!camera || !renderer || !canvasContainer) return;
        
        camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    }
    
    // Animation loop
    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Update controls if enabled
        if (controls && controls.enabled) {
            controls.update();
        }
        
        // Add subtle movement to implant to simulate hand shake
        if (currentMethod && !isDragging) {
            const shakeFactor = 1 - (methodParams[currentMethod].stabilityFactor || 0.5);
            const shakeAmount = shakeFactor * 0.001;
            
            implantModel.rotation.x += (Math.random() - 0.5) * shakeAmount;
            implantModel.rotation.z += (Math.random() - 0.5) * shakeAmount;
        }
        
        // Render scene
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
})();
