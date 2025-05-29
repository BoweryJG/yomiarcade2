import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';
import confetti from 'canvas-confetti';
import '../css/resultsVisualization.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export function ResultsVisualization({ sessionData, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAchievements, setShowAchievements] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    // Trigger confetti for high scores
    if (sessionData.score >= 90) {
      triggerConfetti();
    }
    
    // Show achievements after delay
    setTimeout(() => setShowAchievements(true), 1000);
  }, [sessionData.score]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const getGrade = (score) => {
    if (score >= 95) return { grade: 'A+', color: '#4ECDC4', message: 'Exceptional!' };
    if (score >= 90) return { grade: 'A', color: '#52C41A', message: 'Excellent!' };
    if (score >= 85) return { grade: 'B+', color: '#73D13D', message: 'Great job!' };
    if (score >= 80) return { grade: 'B', color: '#95DE64', message: 'Good work!' };
    if (score >= 75) return { grade: 'C+', color: '#FFD666', message: 'Not bad!' };
    if (score >= 70) return { grade: 'C', color: '#FFA940', message: 'Keep practicing!' };
    return { grade: 'D', color: '#FF7875', message: 'More practice needed' };
  };

  const gradeInfo = getGrade(sessionData.score);

  const performanceData = {
    labels: sessionData.attempts.map((_, i) => `Attempt ${i + 1}`),
    datasets: [
      {
        label: 'Accuracy',
        data: sessionData.attempts.map(a => a.accuracy),
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Speed',
        data: sessionData.attempts.map(a => a.speed),
        borderColor: '#FFE66D',
        backgroundColor: 'rgba(255, 230, 109, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const skillsData = {
    labels: ['Positioning', 'Depth Control', 'Angle Precision', 'Speed', 'Consistency'],
    datasets: [{
      data: [
        sessionData.skills.positioning,
        sessionData.skills.depthControl,
        sessionData.skills.anglePrecision,
        sessionData.skills.speed,
        sessionData.skills.consistency,
      ],
      backgroundColor: [
        '#4ECDC4',
        '#FFE66D',
        '#FF6B6B',
        '#95E1D3',
        '#C7CEEA',
      ],
      borderWidth: 0,
    }],
  };

  const progressData = {
    labels: ['This Session', 'Last Session', 'Personal Best'],
    datasets: [{
      label: 'Score',
      data: [sessionData.score, sessionData.lastScore || 0, sessionData.personalBest || sessionData.score],
      backgroundColor: ['#4ECDC4', '#95E1D3', '#FFD700'],
      borderRadius: 8,
    }],
  };

  const achievements = [
    {
      id: 1,
      name: 'First Timer',
      description: 'Complete your first implant',
      icon: '🎯',
      unlocked: true,
    },
    {
      id: 2,
      name: 'Precision Master',
      description: 'Achieve 95% accuracy',
      icon: '🎨',
      unlocked: sessionData.score >= 95,
    },
    {
      id: 3,
      name: 'Speed Demon',
      description: 'Complete in under 2 minutes',
      icon: '⚡',
      unlocked: sessionData.time < 120,
    },
    {
      id: 4,
      name: 'Perfect Score',
      description: 'Achieve 100% accuracy',
      icon: '💎',
      unlocked: sessionData.score === 100,
    },
    {
      id: 5,
      name: 'Consistency King',
      description: '3 sessions above 90%',
      icon: '👑',
      unlocked: sessionData.consistentHigh >= 3,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="results-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="results-container"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button className="close-button" onClick={onClose}>×</button>
          
          <div className="results-header">
            <motion.div
              className="score-display"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
                <div className="score-value">{sessionData.score}%</div>
                <div className="score-grade" style={{ color: gradeInfo.color }}>
                  {gradeInfo.grade}
                </div>
              </div>
              <motion.div
                className="score-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {gradeInfo.message}
              </motion.div>
            </motion.div>
            
            <div className="session-stats">
              <motion.div
                className="stat-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{sessionData.time}s</div>
                <div className="stat-label">Time</div>
              </motion.div>
              
              <motion.div
                className="stat-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{sessionData.accuracy}%</div>
                <div className="stat-label">Accuracy</div>
              </motion.div>
              
              <motion.div
                className="stat-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="stat-icon">📈</div>
                <div className="stat-value">+{sessionData.improvement}%</div>
                <div className="stat-label">Improvement</div>
              </motion.div>
            </div>
          </div>
          
          <div className="results-tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
            <button
              className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>
          
          <div className="results-content">
            {activeTab === 'overview' && (
              <motion.div
                className="overview-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="chart-grid">
                  <div className="chart-container">
                    <h3>Skills Breakdown</h3>
                    <Doughnut
                      data={skillsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 15,
                              font: { size: 12 },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  
                  <div className="chart-container">
                    <h3>Progress Comparison</h3>
                    <Bar
                      data={progressData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                <div className="feedback-section">
                  <h3>Areas for Improvement</h3>
                  <div className="feedback-items">
                    {sessionData.feedback.map((item, index) => (
                      <motion.div
                        key={index}
                        className="feedback-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="feedback-icon">{item.icon}</div>
                        <div className="feedback-text">
                          <div className="feedback-title">{item.title}</div>
                          <div className="feedback-description">{item.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'performance' && (
              <motion.div
                className="performance-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="performance-chart">
                  <h3>Performance Trend</h3>
                  <Line
                    ref={chartRef}
                    data={performanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
                
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Average Accuracy</div>
                    <div className="metric-value">{sessionData.avgAccuracy}%</div>
                    <div className="metric-trend positive">↑ 5%</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Best Streak</div>
                    <div className="metric-value">{sessionData.bestStreak}</div>
                    <div className="metric-trend">Perfect placements</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Completion Rate</div>
                    <div className="metric-value">{sessionData.completionRate}%</div>
                    <div className="metric-trend positive">↑ 10%</div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'achievements' && (
              <motion.div
                className="achievements-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="achievements-grid">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: showAchievements ? index * 0.1 : 0,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      {achievement.unlocked && (
                        <motion.div
                          className="achievement-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="results-actions">
            <motion.button
              className="action-button secondary"
              onClick={() => window.location.href = '/leaderboard'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Leaderboard
            </motion.button>
            <motion.button
              className="action-button primary"
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Play Again
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}