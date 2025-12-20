import React, { useState, useMemo, useContext, createContext } from "react";
// Silence all console outputs as requested to keep the browser console clean
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || import.meta.env.PROD) {
  console.log = () => { };
  console.info = () => { };
  console.debug = () => { };
  console.warn = () => { };
  console.error = () => { };
}

import ReactDOM from "react-dom/client";
import "./main.css";
import "./App.css";
import App from "./App.jsx";
import {
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  Alert,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CallProvider } from "./context/IncomingCallContext.jsx";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// ===== Auth Context =====
export const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

// ===== Theme Context =====
export const ThemeCtx = createContext();
export const useTheme = () => useContext(ThemeCtx);

const lightTheme = createTheme({ palette: { mode: "light" } });
const darkTheme = createTheme({ palette: { mode: "dark" } });

// ===== Theme Provider =====
function CustomThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState("dark"); // Start in dark for premium feel

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  const toggleTheme = () =>
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  const theme = useMemo(
    () => (themeMode === "light" ? lightTheme : darkTheme),
    [themeMode]
  );
  const value = useMemo(() => ({ themeMode, toggleTheme }), [themeMode]);

  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeCtx.Provider>
  );
}

// ===== Auth Provider =====
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
    return null;
  });

  const save = (u) => {
    const simpleUser = {
      id: u.id,
      username: u.username,
      email: u.email || null,
      role: u.role,
      verified: u.verified || false,
      avatar: u.avatar || "",
      token: u.token || ""
    };
    setUser(simpleUser);
    localStorage.setItem("user", JSON.stringify(simpleUser));
  };

  const register = async (username, password, role, email) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role, email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  };

  const verifyOtp = async (username, otp) => {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "OTP verification failed");

    const verifiedUser = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      verified: data.user.verified,
      avatar: data.user.avatar || "",
      token: data.token
    };
    setUser(verifiedUser);
    localStorage.setItem("user", JSON.stringify(verifiedUser));
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    const loggedUser = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      verified: data.user.verified,
      avatar: data.user.avatar || "",
      token: data.token
    };
    setUser(loggedUser);
    localStorage.setItem("user", JSON.stringify(loggedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = useMemo(() => ({ user, setUser: save, register, login, verifyOtp, logout }), [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}


// ===== Auth Screen =====
function AuthScreen() {
  return <div>AuthScreen placeholder</div>;
}

// ===== Update Email Screen =====
function UpdateEmailScreen() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  return <div>UpdateEmailScreen placeholder</div>;
}

// ===== Root =====

function Root() {
  return <App />;
}




// ===== Render =====
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <CustomThemeProvider>
      <AuthProvider>
        <CallProvider>
          <Root />
        </CallProvider>
      </AuthProvider>
    </CustomThemeProvider>
  </React.StrictMode>
);
