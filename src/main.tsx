console.log("START of main.tsx: Script is starting to execute."); // הודעה ראשונה

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css' // ודא שהקובץ הזה קיים אם אתה משתמש בו
import { AuthProvider } from './context/AuthContext.tsx' // ודא שהקובץ הזה קיים

console.log("main.tsx: Imports completed.");

const rootElement = document.getElementById("root");
console.log("main.tsx: rootElement found:", rootElement);

if (rootElement) {
  console.log("main.tsx: Attempting to createRoot and render...");
  try {
    createRoot(rootElement).render(
      // <React.StrictMode> // נסה להסיר את זה זמנית לבדיקה אם זה גורם לבעיה
        <AuthProvider>
          <App />
        </AuthProvider>
      // </React.StrictMode>
    );
    console.log("main.tsx: createRoot().render() called successfully.");
  } catch (error) {
    console.error("main.tsx: Error during createRoot or render:", error);
  }
} else {
  console.error("main.tsx: CRITICAL ERROR - Root element with id 'root' not found in the DOM.");
}

console.log("END of main.tsx: Script execution finished (or an error occurred)."); // הודעה אחרונה
