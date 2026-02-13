import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginService, signupService } from "../services/authService";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* -------------------- REHYDRATE ON LOAD -------------------- */
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

      setLoading(false); // ✅ IMPORTANT
  }, []);

  /* -------------------- LOGIN -------------------- */
  const login = async (email, password) => {
    const data = await loginService(email, password);

    const userData = {
      id: data.userId,
      email,
      role: data.role,
    };

    setToken(data.token);
    setUser(userData);

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));

    navigate("/Dashboard");
    return data
  };

  /* -------------------- SIGNUP -------------------- */
  const signup = async (
    email,
    password,
    name,
    role,
    organizationName
  ) => {
    // ✅ BUSINESS RULE FIX
    let finalOrganizationName = null;

    if (role === "coordinator") {
      finalOrganizationName = name; // coordinator org = name
    } else if (role === "agency") {
      finalOrganizationName = organizationName;
    }
    // community stays null

    const data = await signupService(
      name,
      email,
      password,
      role,
      finalOrganizationName
    );

    const userData = {
      email,
      role: data.role,
    };

    setToken(data.token);
    setUser(userData);

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));

    navigate("/dashboard");
  };

  /* -------------------- LOGOUT -------------------- */
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
