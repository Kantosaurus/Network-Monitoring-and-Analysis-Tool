import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("main.tsx executing...");

// Remove dark mode - using light Apple theme
document.body.classList.remove('dark');

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Error: ${error}</div>`;
}
