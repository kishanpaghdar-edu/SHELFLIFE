# SHELFLIFE+ — React App

A complete food waste marketplace connecting restaurant owners, conscious consumers, and NGOs.

## Tech Stack
- **React 18** with React Router v6
- **Context API** for auth & cart state
- CSS variables (no external CSS framework)
- Zero external UI dependencies

## Project Structure

```
src/
├── App.jsx                        # Root router + providers
├── index.js                       # Entry point
├── styles/
│   └── global.css                 # CSS variables + utilities
├── data/
│   └── appData.js                 # All seed data (items, orders, offers)
├── context/
│   ├── AuthContext.jsx            # Auth state (user, login, logout)
│   └── CartContext.jsx            # Cart state (add, remove, qty, totals)
├── hooks/
│   └── useToast.js                # Toast notification hook
├── components/
│   ├── Toast.jsx                  # Global toast component
│   └── Sidebar.jsx                # Shared sidebar (Owner + NGO)
└── pages/
    ├── LandingPage.jsx            # Main landing with hero, roles, impact
    ├── RolePicker.jsx             # Role picker (Owner / User / NGO)
    ├── RoleLandings.jsx           # Owner, User, NGO marketing pages
    ├── OwnerLanding.jsx           # Re-export
    ├── UserLanding.jsx            # Re-export
    ├── NgoLanding.jsx             # Re-export
    ├── AuthPage.jsx               # Shared login/register for all 3 roles
    ├── owner/
    │   └── OwnerDashboard.jsx     # Full owner dashboard (9 panels)
    ├── user/
    │   └── UserDashboard.jsx      # Full user dashboard (5 tabs)
    └── ngo/
        └── NgoDashboard.jsx       # Full NGO dashboard (8 panels)
```

## User Flow

```
/ (Landing)
  → /pick-role (Role Picker)
      → /for/owner  (Owner landing)  → /login/owner  → /dashboard/owner
      → /for/user   (User landing)   → /login/user   → /dashboard/user
      → /for/ngo    (NGO landing)    → /login/ngo    → /dashboard/ngo
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start

# 3. Open http://localhost:3000
```

## Features by Role

### 🍽️ Owner Dashboard
- Dashboard with revenue stats, top items, alerts
- Sales analytics (daily / category / monthly)
- Inventory management (add, edit, delete items)
- Live listings grid
- Order management with status updates
- NGO donation offer creation
- Shop profile & settings

### 🌿 User Dashboard  
- Browse with filters: Veg/Non-Veg toggle, category, expiry, price range, discount %
- Sort by: expiry, price (asc/desc), discount
- Cart with live CO₂ & money saved display
- Payment modal: UPI (QR + ID entry), Card (number/expiry/CVV), Net Banking, COD, Wallet
- Order history with expandable details
- Personal impact tracker (CO₂, money, tree-years, milestones)
- Profile management

### 💜 NGO Dashboard
- Offer inbox with filter (Open / Pending)
- Accept offers → moves to Accepted tab
- Decline with modal reason picker (6 quick chips + free text)
- Declined offers log with reason visible
- Mark accepted offers as completed
- Impact analytics (food rescued, CO₂, meals)
- NGO profile & settings

## Connecting to Backend

Replace mock auth in `AuthPage.jsx` with real API calls:

```js
// src/pages/AuthPage.jsx — doLogin function
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role })
});
const data = await res.json();
login({ ...data.user, token: data.token });
```

API endpoints (from your backend):
- POST `/api/auth/login` → `{ email, password, role }`
- POST `/api/auth/register/owner|user|ngo`
- GET `/api/items` — public browse
- GET `/api/owner/inventory` — owner auth
- POST `/api/orders` — user auth
- GET `/api/donations/ngo` — NGO auth

## Color Tokens

| Token | Value | Used for |
|-------|-------|----------|
| `--or` | `#E8610A` | Owner accent |
| `--gr` | `#3B6D11` | User/eco accent |
| `--pu` | `#534AB7` | NGO accent |
| `--tl` | `#0F6E56` | Completed/success |
| `--am` | `#BA7517` | Warning/amber |
| `--rd` | `#A32D2D` | Error/danger |
| `--dk` | `#1C1209` | Dark text |
| `--wg` | `#7A6652` | Muted text |
| `--bd` | `#F0E8D8` | Borders |
| `--cr` | `#FDFAF6` | Background |
