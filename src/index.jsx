import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Asegúrate de tener o crear este archivo CSS
import App from './App'; // Importa el componente principal de tu aplicación

// 1. Obtener el elemento del DOM donde React inyectará la aplicación.
// Por convención, este es un div con id="root" en tu archivo public/index.html.
const container = document.getElementById('root');

// 2. Crear la raíz (Root) de React. Este es el método moderno de React 18+.
const root = createRoot(container);

// 3. Renderizar (dibujar) el componente principal <App /> dentro del elemento 'root'.
root.render(
  // <React.StrictMode> es una herramienta para destacar problemas potenciales.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Nota: Si estás usando una versión antigua de React (anterior a la 18),
// el código debería usar ReactDOM.render() en lugar de createRoot().