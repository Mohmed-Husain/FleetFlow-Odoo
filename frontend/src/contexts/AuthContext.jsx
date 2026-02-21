"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, setAuthToken, removeAuthToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await authApi.getCurrentUser();
                setUser(userData);
            } catch (err) {
                // Not logged in or token expired
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        // Only check if we have a token
        if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await authApi.login(email, password);
        if (response.access_token) {
            setAuthToken(response.access_token);
            // Fetch user data after login
            try {
                const userData = await authApi.getCurrentUser();
                setUser(userData);
            } catch (err) {
                // Even if /auth/me fails, user has a valid token
                // Set a minimal user object so isAuthenticated becomes true
                setUser({ email });
            }
        }
        return response;
    }, []);

    const register = useCallback(async (userData) => {
        return authApi.register(userData);
    }, []);

    const logout = useCallback(() => {
        authApi.logout();
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
