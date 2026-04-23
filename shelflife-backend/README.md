# SHELFLIFE+ Backend

Express.js + MySQL REST API

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create your .env file
```bash
copy .env.example .env
```
Then open `.env` and fill in your MySQL password.

### 3. Create the database
Open MySQL Workbench or run in terminal:
```bash
mysql -u root -p < schema.sql
```

### 4. Start the server
```bash
npm run dev     # development (auto-restarts)
npm start       # production
```

Server runs on http://localhost:5000

---

## API Endpoints

### Auth
| Method | URL | Body | Auth |
|--------|-----|------|------|
| POST | `/api/auth/register/owner` | name, email, password, restaurant_name | — |
| POST | `/api/auth/register/user`  | name, email, password | — |
| POST | `/api/auth/register/ngo`   | name, email, password | — |
| POST | `/api/auth/login` | email, password, role | — |

### Food Items
| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/items` | — |
| GET | `/api/items/:id` | — |
| GET | `/api/owner/inventory` | Owner |
| GET | `/api/owner/dashboard` | Owner |
| POST | `/api/owner/items` | Owner |
| PUT | `/api/owner/items/:id` | Owner |
| DELETE | `/api/owner/items/:id` | Owner |

### Orders
| Method | URL | Auth |
|--------|-----|------|
| POST | `/api/orders` | User |
| GET | `/api/orders/my` | User |
| GET | `/api/orders/impact` | User |
| GET | `/api/owner/orders` | Owner |
| PUT | `/api/orders/:id/status` | Owner |

### Donations
| Method | URL | Auth |
|--------|-----|------|
| POST | `/api/donations` | Owner |
| GET | `/api/donations/owner` | Owner |
| GET | `/api/donations/ngo` | NGO |
| GET | `/api/donations/ngo/dashboard` | NGO |
| PUT | `/api/donations/:id/respond` | NGO |
| PUT | `/api/donations/:id/complete` | NGO |
