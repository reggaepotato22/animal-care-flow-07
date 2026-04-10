import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Always default to KES (Kenyan Shilling) if no currency has been explicitly set
if (!localStorage.getItem("boravet_currency")) {
  localStorage.setItem("boravet_currency", "KES");
}

createRoot(document.getElementById("root")!).render(<App />);
