/**
 * Neocis Yomi® Accuracy Challenge
 * Main Application Script
 * 
 * This script handles UI interactions and navigation between screens
 */

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const methodSelection = document.getElementById('method-selection');
    const simulationInterface = document.getElementById('simulation-interface');
    const resultsScreen = document.getElementById('results-screen');
    
    const jumpInBtn = document.getElementById('jump-in-btn');
    const freehandCard = document.getElementById('freehand-card');
    const staticCard = document.getElementById('static-card');
    const yomiCard = document.getElementById('yomi-card');
    
    const buccalViewBtn = document.getElementById('buccal-view');
    const lingualViewBtn = document.getElementById('lingual-view');
    const occlusalViewBtn = document.getElementById('occlusal-view');
    const freeViewBtn = document.getElementById('free-view');
    
    const drillBtn = document.getElementById('drill-btn');
    const switchMethodBtn = document.getElementById('switch-method-btn');
    const learnMoreBtn = document.getElementById('learn-more-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    
    // Initialize simulation module
    const simulation = window.YomiSimulation || {};
    
    // Event Listeners
    
    // Jump In button - Navigate from welcome to method selection
    jumpInBtn.addEventListener('click', function() {
        console.log('Jump In button clicked');
        welcomeScreen.classList.add('hidden');
        methodSelection.classList.remove('hidden');
    });
    
    // Method selection cards
    freehandCard.addEventListener('click', function() {
        startSimulation('freehand');
    });
    
    staticCard.addEventListener('click', function() {
        startSimulation('static');
    });
    
    yomiCard.addEventListener('click', function() {
        startSimulation('yomi');
    });
    
    // View control buttons
    if (buccalViewBtn) {
        buccalViewBtn.addEventListener('click', function() {
            setActiveView(this);
            if (simulation.setView) simulation.setView('buccal');
        });
    }
    
    if (lingualViewBtn) {
        lingualViewBtn.addEventListener('click', function() {
            setActiveView(this);
            if (simulation.setView) simulation.setView('lingual');
        });
    }
    
    if (occlusalViewBtn) {
        occlusalViewBtn.addEventListener('click', function() {
            setActiveView(this);
            if (simulation.setView) simulation.setView('occlusal');
        });
    }
    
    if (freeViewBtn) {
        freeViewBtn.addEventListener('click', function() {
            setActiveView(this);
            if (simulation.setView) simulation.setView('free');
        });
    }
    
    // Drill button - Complete simulation and show results
    if (drillBtn) {
        drillBtn.addEventListener('click', function() {
            if (simulation.completeSimulation) {
                const results = simulation.completeSimulation();
                showResults(results);
            } else {
                // Fallback if simulation module isn't fully loaded
                showResults({
                    method: simulation.currentMethod || 'freehand',
                    angle: 5.67,
                    depth: 0.89,
                    score: 55
                });
            }
        });
    }
    
    // Results screen buttons
    if (switchMethodBtn) {
        switchMethodBtn.addEventListener('click', function() {
            resultsScreen.classList.add('hidden');
            methodSelection.classList.remove('hidden');
        });
    }
    
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', function() {
            window.open('https://neocis.com/yomi', '_blank');
        });
    }
    
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            resultsScreen.classList.add('hidden');
            startSimulation(simulation.currentMethod || 'freehand');
        });
    }
    
    // Helper Functions
    
    // Start simulation with selected method
    function startSimulation(method) {
        console.log('Starting simulation with method:', method);
        
        // Hide method selection and show simulation interface
        methodSelection.classList.add('hidden');
        simulationInterface.classList.remove('hidden');
        
        // Update method title
        const methodTitle = document.getElementById('simulation-method-title');
        if (methodTitle) {
            methodTitle.textContent = 'Method: ' + formatMethodName(method);
        }
        
        // Initialize simulation with selected method
        if (simulation.initialize) {
            simulation.initialize(method);
        } else {
            console.warn('Simulation module not fully loaded');
            // Set current method even if full simulation isn't available
            simulation.currentMethod = method;
        }
        
        // Reset view buttons
        setActiveView(buccalViewBtn);
    }
    
    // Set active view button
    function setActiveView(button) {
        if (!button) return;
        
        // Remove active class from all view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        button.classList.add('active');
    }
    
    // Show results screen with simulation results
    function showResults(results) {
        console.log('Showing results:', results);
        
        // Hide simulation interface and show results screen
        simulationInterface.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        // Update results data
        const yourScore = document.getElementById('your-score');
        const yourAngleValue = document.getElementById('your-angle-value');
        const yourDepthValue = document.getElementById('your-depth-value');
        const yourAngleBar = document.getElementById('your-angle-bar');
        const yourDepthBar = document.getElementById('your-depth-bar');
        const scoreValue = document.getElementById('score-value');
        const scoreMessage = document.getElementById('score-message');
        
        if (yourScore) {
            yourScore.textContent = formatMethodName(results.method) + ': ' + 
                                   results.angle.toFixed(2) + '° | ' + 
                                   results.depth.toFixed(2) + 'mm';
        }
        
        if (yourAngleValue) yourAngleValue.textContent = results.angle.toFixed(2) + '°';
        if (yourDepthValue) yourDepthValue.textContent = results.depth.toFixed(2) + 'mm';
        
        // Calculate relative bar widths based on benchmark values
        if (yourAngleBar) {
            const maxAngle = 7.03; // Freehand benchmark
            const anglePercent = (results.angle / maxAngle) * 100;
            yourAngleBar.style.width = anglePercent + '%';
        }
        
        if (yourDepthBar) {
            const maxDepth = 1.1; // Freehand/Static benchmark
            const depthPercent = (results.depth / maxDepth) * 100;
            yourDepthBar.style.width = depthPercent + '%';
        }
        
        if (scoreValue) scoreValue.textContent = results.score;
        
        // Set appropriate score message
        if (scoreMessage) {
            if (results.score >= 80) {
                scoreMessage.textContent = 'Impressive! Almost Yomi-level precision.';
            } else if (results.score >= 60) {
                scoreMessage.textContent = 'Good job, but Yomi would have done better.';
            } else if (results.score >= 40) {
                scoreMessage.textContent = 'Not bad, but there\'s room for improvement.';
            } else {
                scoreMessage.textContent = 'Yomi would have made a significant difference here.';
            }
        }
    }
    
    // Format method name for display
    function formatMethodName(method) {
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
    
    // Make formatMethodName available to other modules
    if (simulation) {
        simulation.formatMethodName = formatMethodName;
    }
    
    // Auto-start for testing (comment out in production)
    // jumpInBtn.click();
});
