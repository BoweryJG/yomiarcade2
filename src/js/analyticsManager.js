export class AnalyticsManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.startTime = Date.now();
    
    // Check if Google Analytics is available
    this.hasGA = typeof window.gtag === 'function';
    
    // Initialize session
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trackEvent(eventName, parameters = {}) {
    const event = {
      name: eventName,
      parameters: {
        ...parameters,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        timeInSession: Date.now() - this.startTime
      }
    };

    // Store locally
    this.events.push(event);

    // Send to Google Analytics if available
    if (this.hasGA) {
      window.gtag('event', eventName, {
        event_category: 'Yomi Arcade',
        event_label: parameters.method || 'general',
        value: parameters.score || parameters.value || 0,
        ...parameters
      });
    }

    // Log in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Analytics Event:', event);
    }
  }

  trackTiming(category, variable, value, label) {
    this.trackEvent('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label
    });
  }

  getSessionStats() {
    const stats = {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      events: this.events,
      methodsPlayed: {},
      averageScore: 0,
      completionRate: 0
    };

    // Calculate method statistics
    const methodEvents = this.events.filter(e => e.name === 'simulation_completed');
    const startedEvents = this.events.filter(e => e.name === 'simulation_started');
    
    methodEvents.forEach(event => {
      const method = event.parameters.method;
      if (!stats.methodsPlayed[method]) {
        stats.methodsPlayed[method] = {
          plays: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0
        };
      }
      
      stats.methodsPlayed[method].plays++;
      stats.methodsPlayed[method].totalScore += event.parameters.score || 0;
      stats.methodsPlayed[method].bestScore = Math.max(
        stats.methodsPlayed[method].bestScore,
        event.parameters.score || 0
      );
    });

    // Calculate averages
    Object.keys(stats.methodsPlayed).forEach(method => {
      const methodStats = stats.methodsPlayed[method];
      methodStats.averageScore = methodStats.plays > 0 
        ? Math.round(methodStats.totalScore / methodStats.plays)
        : 0;
    });

    // Overall average score
    const allScores = methodEvents.map(e => e.parameters.score || 0);
    stats.averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Completion rate
    stats.completionRate = startedEvents.length > 0
      ? (methodEvents.length / startedEvents.length * 100).toFixed(1)
      : 0;

    return stats;
  }

  // Track page visibility for engagement metrics
  setupEngagementTracking() {
    let hiddenTime = 0;
    let lastHiddenTimestamp = null;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastHiddenTimestamp = Date.now();
      } else if (lastHiddenTimestamp) {
        hiddenTime += Date.now() - lastHiddenTimestamp;
        lastHiddenTimestamp = null;
      }
    });

    // Track engagement time when user leaves
    window.addEventListener('beforeunload', () => {
      const totalTime = Date.now() - this.startTime;
      const activeTime = totalTime - hiddenTime;
      
      this.trackEvent('session_end', {
        totalTime,
        activeTime,
        engagementRate: (activeTime / totalTime * 100).toFixed(1)
      });
    });
  }

  // Export session data for debugging or analysis
  exportSessionData() {
    const stats = this.getSessionStats();
    const dataStr = JSON.stringify(stats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `yomi-arcade-session-${this.sessionId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}