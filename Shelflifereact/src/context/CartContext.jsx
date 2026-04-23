import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const totals = () => {
    const sub   = cart.reduce((s, i) => s + i.disc * i.qty, 0);
    const orig  = cart.reduce((s, i) => s + i.orig * i.qty, 0);
    const saved = orig - sub;
    const del   = sub > 199 ? 0 : 30;
    const co2   = parseFloat((cart.reduce((s, i) => s + i.wt * i.qty * 2.5, 0)).toFixed(2));
    return { sub, orig, saved, del, total: sub + del, co2, trees: (co2 / 21).toFixed(3) };
  };

  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, totals, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
