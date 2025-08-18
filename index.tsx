import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { BatchProvider } from './context/BatchContext';
import { ExamProvider } from './context/ExamContext';
import { StudyProvider } from './context/StudyContext';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsProvider>
        <BatchProvider>
          <ExamProvider>
            <StudyProvider>
              <App />
            </StudyProvider>
          </ExamProvider>
        </BatchProvider>
      </AnalyticsProvider>
    </BrowserRouter>
  </React.StrictMode>
);