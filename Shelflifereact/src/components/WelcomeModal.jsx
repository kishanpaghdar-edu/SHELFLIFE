import React, { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   WelcomeModal
   Props:
     user          — { name, role, ... }
     isFirstLogin  — boolean
     loginCount    — number
     lastLogin     — ISO string or null
     onClose       — callback
   ───────────────────────────────────────────────────────────────────── */

const ROLE_CONFIG = {
  owner: {
    accent:   'var(--or)',
    accentL:  'var(--or-l)',
    accentD:  'var(--or-d)',
    emoji:    '🍽️',
    firstTitle:   (name) => `Welcome to ShelfLife+, ${name}!`,
    firstSub:     'Your restaurant dashboard is ready. Start by adding your first surplus food listing and help reduce waste in your city.',
    firstTips: [
      { ico: '📦', text: 'Add items from the + Add Item button' },
      { ico: '🤝', text: 'Mark items as NGO eligible to donate surplus' },
      { ico: '📊', text: 'Track your revenue and orders on the Dashboard' },
    ],
    backTitle:    (name, time) => `Welcome back, ${name}!`,
    backSub:      (count, time) => time ? `Last seen ${time}. Great to have you back!` : 'Great to have you back!',
    backTips: [
      { ico: '⏰', text: 'Check Alerts for items expiring soon' },
      { ico: '🛒', text: 'Review pending orders in the Orders tab' },
      { ico: '📈', text: 'See this week\'s revenue in Analytics' },
    ],
  },
  user: {
    accent:   'var(--gr)',
    accentL:  'var(--gr-l)',
    accentD:  'var(--gr-d)',
    emoji:    '🛒',
    firstTitle:   (name) => `Hey ${name}, welcome to ShelfLife+!`,
    firstSub:     'Browse near-expiry food from local restaurants at huge discounts. Save money, reduce waste, and track your CO₂ impact.',
    firstTips: [
      { ico: '🔍', text: 'Browse deals in the Browse tab' },
      { ico: '🌱', text: 'Every purchase saves food from landfill' },
      { ico: '📦', text: 'Track your orders and impact in real time' },
    ],
    backTitle:    (name) => `Good to see you, ${name}!`,
    backSub:      (count, time) => `${time ? `Last visited ${time}. ` : ''}Fresh deals are waiting for you today.`,
    backTips: [
      { ico: '🔥', text: 'Check today\'s expiring deals for the biggest discounts' },
      { ico: '🌱', text: 'View your CO₂ impact in the Impact tab' },
      { ico: '🛒', text: 'Your cart is saved from last session' },
    ],
  },
  ngo: {
    accent:   'var(--pu)',
    accentL:  'var(--pu-l)',
    accentD:  'var(--pu-d)',
    emoji:    '🤝',
    firstTitle:   (name) => `Welcome, ${name}!`,
    firstSub:     'Your NGO dashboard is ready. Start by completing your profile, then browse donation offers from local restaurants.',
    firstTips: [
      { ico: '📬', text: 'Check your Offer Inbox for available donations' },
      { ico: '💜', text: 'Complete your NGO Profile for better visibility' },
      { ico: '🏪', text: 'Add restaurant partners to get priority offers' },
    ],
    backTitle:    (name) => `Welcome back, ${name}!`,
    backSub:      (count, time) => `${time ? `Last active ${time}. ` : ''}Check your inbox for new donation offers.`,
    backTips: [
      { ico: '📬', text: 'New offers may be waiting in your inbox' },
      { ico: '📅', text: 'Review today\'s scheduled pickups' },
      { ico: '📈', text: 'Check your impact analytics this month' },
    ],
  },
};

function formatLastLogin(iso) {
  if (!iso) return null;
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800)    return 'yesterday';
  if (diff < 604800)    return `${Math.floor(diff / 86400)} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function WelcomeModal({ user, isFirstLogin, loginCount, lastLogin, onClose }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 6 seconds
    const auto = setTimeout(() => handleClose(), 6000);
    return () => { clearTimeout(t); clearTimeout(auto); };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 350);
  };

  const role   = user?.role || 'user';
  const cfg    = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const name   = (user?.name || 'there').split(' ')[0]; // first name only
  const time   = formatLastLogin(lastLogin);
  const count  = loginCount || 1;
  const tips   = isFirstLogin ? cfg.firstTips : cfg.backTips;

  const title  = isFirstLogin
    ? cfg.firstTitle(name)
    : cfg.backTitle(name, time);
  const sub    = isFirstLogin
    ? cfg.firstSub
    : cfg.backSub(count, time);

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible && !closing ? 1 : 0,
        transition: 'opacity .35s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '2rem',
          maxWidth: 420,
          width: '90%',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          transform: visible && !closing ? 'translateY(0) scale(1)' : 'translateY(24px) scale(.96)',
          transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Accent top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: cfg.accent,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'var(--cr)', border: '1px solid var(--bd)',
            borderRadius: '50%', width: 28, height: 28,
            fontSize: '.8rem', cursor: 'pointer', color: 'var(--wg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans',sans-serif",
          }}
        >✕</button>

        {/* Emoji + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1rem', marginTop: '.25rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: cfg.accentL,
            border: `2px solid ${cfg.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', flexShrink: 0,
          }}>
            {cfg.emoji}
          </div>
          <div>
            <div style={{
              fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '.6px', color: cfg.accent, marginBottom: '.2rem',
            }}>
              {isFirstLogin ? '🎉 First time here' : '👋 Welcome back'}
            </div>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: '1.15rem', fontWeight: 700, color: 'var(--dk)', lineHeight: 1.2,
            }}>
              {title}
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: '.82rem', color: 'var(--wg)', lineHeight: 1.6,
          marginBottom: '1.15rem', margin: '0 0 1.15rem',
        }}>
          {sub}
        </p>

        {/* Tips */}
        <div style={{
          background: cfg.accentL,
          border: `1px solid ${cfg.accent}22`,
          borderRadius: 12, padding: '.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '.55rem',
        }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <span style={{ fontSize: '.9rem', flexShrink: 0 }}>{tip.ico}</span>
              <span style={{ fontSize: '.78rem', color: 'var(--dk)' }}>{tip.text}</span>
            </div>
          ))}
        </div>

        {/* CTA button + auto-dismiss hint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
          <span style={{ fontSize: '.68rem', color: 'var(--wg)' }}>Auto-dismisses in a moment…</span>
          <button
            onClick={handleClose}
            style={{
              padding: '.55rem 1.4rem',
              background: cfg.accent,
              color: '#fff', border: 'none', borderRadius: 50,
              fontSize: '.82rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            {isFirstLogin ? "Let's go →" : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
