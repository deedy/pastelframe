import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PastelFrame from './PastelFrame.tsx';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4'; 

ReactGA.initialize("G-ZCMZ5QCRD7"); 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PastelFrame />
  </React.StrictMode>
);

const sendToGoogleAnalytics = ({ name, delta, id }) => {
  ReactGA.event({
    category: 'Web Vitals',
    action: name,
    value: Math.round(name === 'CLS' ? delta * 1000 : delta), // CLS should be multiplied by 1000
    label: id,
    nonInteraction: true, // Prevents affecting bounce rate
  });
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(sendToGoogleAnalytics);
