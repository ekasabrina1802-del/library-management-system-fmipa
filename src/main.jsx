import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import './App.css';

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext.jsx";
import { AppProvider } from "./components/AppContext.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);