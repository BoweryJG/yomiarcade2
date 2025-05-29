import React from 'react';
import ReactDOM from 'react-dom/client';
import { EnhancedDentalSimulation } from './components/EnhancedDentalSimulation';
import './styles/main.css';

// Create root element and render the enhanced simulation
const root = ReactDOM.createRoot(document.getElementById('app-container'));
root.render(
  <React.StrictMode>
    <EnhancedDentalSimulation />
  </React.StrictMode>
);