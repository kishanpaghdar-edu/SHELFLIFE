import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // user shape: { name, email, role: 'owner'|'user'|'ngo', shopName? }

  const login  = (userData) => setUser(userData);
  const logout = () => {
  localStorage.removeItem('sl_token');
  setUser(null);
};

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
