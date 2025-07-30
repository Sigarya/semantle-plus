
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set up global error handlers for better debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Error during app initialization:", error);
    
    // Fallback error display
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-family: Arial, sans-serif;
        direction: rtl;
        background-color: #f9fafb;
      ">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">שגיאה בטעינת האפליקציה</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">אירעה שגיאה בטעינת האפליקציה. אנא רענן את הדף.</p>
          <button 
            onclick="window.location.reload()" 
            style="
              background-color: #3b82f6; 
              color: white; 
              padding: 0.5rem 1rem; 
              border: none; 
              border-radius: 0.25rem; 
              cursor: pointer;
            "
          >
            רענן דף
          </button>
          <div style="margin-top: 1rem; font-size: 0.875rem; color: #9ca3af;">
            שגיאה: ${error.message || 'שגיאה לא ידועה'}
          </div>
        </div>
      </div>
    `;
  }
} else {
  console.error("CRITICAL ERROR - Root element with id 'root' not found in the DOM.");
  
  // Create fallback content if root element is missing
  document.body.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-family: Arial, sans-serif;
      direction: rtl;
      background-color: #f9fafb;
    ">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">שגיאה קריטית</h1>
        <p style="color: #6b7280;">לא נמצא אלמנט הבסיס של האפליקציה.</p>
      </div>
    </div>
  `;
}
