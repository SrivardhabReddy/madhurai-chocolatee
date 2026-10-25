# 🍫 Madhurai Chocolate — Complete Two-Website E-Commerce Platform

A production-ready, enterprise-grade e-commerce platform built for **Madhurai Chocolate**. The system features **two completely separate frontend applications** sharing a unified, secure backend API and relational database:

1. **Customer E-Commerce Website** (`madhuraichocolate.com` / `localhost:3000`)
2. **Admin Operations Website** (`admin.madhuraichocolate.com` / `localhost:3001`)
3. **Unified Backend API** (`api.madhuraichocolate.com` / `localhost:4000`)

---

## 1. System Architecture

```text
                           MADHURAI CHOCOLATE
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
       CUSTOMER WEBSITE                       ADMIN WEBSITE
    (madhuraichocolate.com)             (admin.madhuraichocolate.com)
          Port: 3000                          Port: 3001
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   │
                                   ▼
                          SECURE BACKEND API
                     (api.madhuraichocolate.com)
                             Port: 4000
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
             DATABASE           PAYMENT           STORAGE
      PostgreSQL / SQLite       GATEWAY        Product Images
      (Dual-Engine Pool)     (Dynamic UPI)     (/uploads/...)
```

### Key Architectural Pillars
- **Zero Direct Database Access**: Neither the customer frontend nor the admin frontend ever touches the database directly. All mutations and queries pass through authenticated, rate-limited, and audited backend REST endpoints.
- **Dual Database Driver**: Supports zero-configuration embedded operation on Node 24 (`node:sqlite` in `database/madhurai_chocolate.sqlite`) for local development, and seamlessly switches to connection-pooled **PostgreSQL** in production whenever `DATABASE_URL` is set.
- **Backend Price Integrity**: The backend independently validates product prices, coupon eligibility, shipping slabs, and stock levels. Frontend totals are **never** trusted.
- **Order & Delivery Snapshots**: Item prices, piece counts, weights, and delivery rules are permanently snapshotted into `order_items` and `orders` at checkout. Future catalog or rule edits never alter past orders.

---

## 2. Directory Structure

```text
madhurai.original_website/
├── customer-web/             # Customer storefront React application (Port 3000)
│   ├── public/               # Favicon, banners, brand assets
│   ├── src/
│   │   ├── components/       # Navbar, Footer, ProductCard, DeliveryChecker, UPIQRModal
│   │   ├── context/          # AuthContext, CartContext
│   │   ├── pages/            # Home, Catalog, Detail, Cart, Checkout, Tracking, Account
│   │   ├── services/         # api.js client
│   │   └── styles/           # Artisanal cacao & peanut-butter theme
│   ├── Dockerfile
│   └── package.json
│
├── admin-web/                # Enterprise Management React application (Port 3001)
│   ├── src/
│   │   ├── components/       # Sidebar, Header, Modals
│   │   ├── context/          # AdminAuthContext (RBAC)
│   │   ├── pages/            # Dashboard, Products, Orders, Inventory, Delivery, Coupons...
│   │   ├── services/         # adminApi.js client
│   │   └── styles/           # High-density SaaS operations theme
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # REST API Express Server (Port 4000)
│   ├── src/
│   │   ├── config/           # Environment and secret loader
│   │   ├── db/               # Dual driver (PostgreSQL + SQLite), migrations, seeders
│   │   ├── middleware/       # JWT Auth, RBAC, Rate Limiters, Audit Logger, Errors
│   │   ├── modules/
│   │   │   ├── auth/         # Customer & Admin authentication separation
│   │   │   ├── products/     # Catalog search, filter, multer image uploads
│   │   │   ├── categories/   # Storefront categories
│   │   │   ├── cart/         # Cart calculation & validation
│   │   │   ├── delivery/     # 5-stage priority DeliveryEngine
│   │   │   ├── payments/     # Dynamic NPCI UPI QR, webhooks, refunds
│   │   │   ├── coupons/      # Percentage, fixed, and threshold coupon engine
│   │   │   ├── inventory/    # Stock reservation, restock, audit transactions
│   │   │   ├── orders/       # Atomic checkout, sequential MC-2026-XXXXXX IDs
│   │   │   └── admin/        # Dashboard KPIs, analytics, staff RBAC, settings
│   │   ├── app.js            # Express app assembly & CORS
│   │   └── server.js         # HTTP server entrypoint
│   ├── uploads/              # Uploaded product and banner imagery
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   ├── migrations/           # 001_initial_schema.sql (25 relational tables)
│   ├── seeds/                # 001_seed_data.sql (Staff, products, delivery rules)
│   └── madhurai_chocolate.sqlite
│
├── tests/                    # 35 automated integration tests (node:test)
│   ├── 01_auth_rbac.test.js
│   ├── 02_products_inventory.test.js
│   ├── 03_delivery_engine.test.js
│   ├── 04_coupons.test.js
│   ├── 05_cart_checkout_orders.test.js
│   └── 06_payments_refunds.test.js
│
├── .env.example              # Environment variables template
├── docker-compose.yml        # Multi-service production stack
└── package.json              # Monorepo runner scripts
```

---

## 3. Administrator Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `madhuraicompany@gmail.com` | `Madhurai@2026/8/9` | Complete unrestricted enterprise ownership |

---

## 4. Local Development Setup

### Prerequisites
- **Node.js**: Version 20.x or 24.x recommended.
- **NPM**: Version 10+.

### 1. Install Dependencies
In the root directory, install the top-level scripts and submodule dependencies:
```bash
# Install root orchestrator dependencies
npm install

# Install submodule dependencies
npm --prefix backend install
npm --prefix customer-web install
npm --prefix admin-web install
```

### 2. Configure Environment
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```
*(Leave `DATABASE_URL` blank to use the built-in embedded SQLite database with zero setup).*

### 3. Initialize & Seed Database
```bash
npm run migrate
npm run seed
```

### 4. Run Everything in Development
Run all three services simultaneously with unified logs:
```bash
npm run dev
```

Or run services individually:
- **Backend API**: `npm run dev:backend` (runs on `http://localhost:4000`)
- **Customer Store**: `npm run dev:customer` (runs on `http://localhost:3000`)
- **Admin Dashboard**: `npm run dev:admin` (runs on `http://localhost:3001`)

---

## 5. Automated Test Suite

The project includes **35 end-to-end integration tests** executed with Node's native test runner (`node:test`):

```bash
npm test
```

### Verified Test Areas
1. **Authentication & RBAC**: Customer registration, customer login, super admin login, inventory manager login, enforcement of `403 Forbidden` for unauthorized roles.
2. **Products & Inventory**: Catalog listing, search filtering, slug retrieval, flagship `40 pieces / 500g` verification, inventory restocking.
3. **Delivery Engine**: Serviceable vs unserviceable pincodes, tiered shipping charges (< ₹300 = ₹60, ₹300-₹499 = ₹40), automatic **FREE delivery** for 5+ items or order values ≥ ₹500.
4. **Coupons Engine**: Percentage coupons (`WELCOME10`), fixed discount coupons (`CRUNCH50`), minimum cart subtotal enforcement, invalid coupon rejection.
5. **Cart, Checkout & Orders**: Server price recalculation (tamper rejection), atomic order creation, `MC-2026-XXXXXX` human-readable ID generation, item price/weight/pieces snapshotting, guest tracking with Order Number + Mobile Number.
6. **Payments & Refunds**: Dynamic NPCI UPI QR string generation, server-side verification, webhook idempotency, gateway refund processing.

---

## 6. Delivery Rule Priority Engine

The delivery engine (`backend/src/modules/delivery/DeliveryEngine.js`) dynamically determines serviceability, shipping rates, and COD eligibility using this strict priority hierarchy:

```text
Priority 1: Product-specific rule   (e.g., promotional free delivery on specific SKU)
Priority 2: Pincode-specific rule   (e.g., local Madurai 625001 = ₹30)
Priority 3: Area/Zone-specific rule (e.g., South Metro Zone vs Rest of India)
Priority 4: Quantity / Slabs rule   (e.g., 5+ pieces = FREE, ₹0-₹299 = ₹60, ₹300-₹499 = ₹40)
Priority 5: Global fallback defaults (Configured in business settings without code)
```

### Geographic Delivery Area Limit (e.g., Upto Nellore)
The admin can set and enforce a geographic boundary limit directly from the Admin Portal (`Delivery` → `Delivery Area Limit` tab):
- **Boundary Limit**: Configurable max delivery boundary city (default: **Nellore**).
- **Serviceable Allowed Cities**: Comma-separated list (e.g. `Nellore, Madurai, Chennai, Bengaluru, Hyderabad`).
- **One-Click Presets**:
  - *Upto Nellore (South Metro Hubs)*
  - *Nellore & Madurai Direct Hubs*
  - *Tamil Nadu State Only*
  - *All India (Unrestricted)*
- **Enforcement**: Pincodes in allowed cities (e.g. Nellore `524001`) are processed with custom notes, while orders outside the active boundary are politely restricted at both the Pincode Checker and Checkout page.

### Free Delivery Modes
The admin can configure in Store Settings:
- Free delivery above order value (e.g. ₹500)
- Free delivery on item quantity (e.g. 5+ pieces)
- Mode: `EITHER`, `BOTH`, `VALUE_ONLY`, or `QTY_ONLY`.

---

## 7. Dynamic Indian NPCI UPI Payments & Security

### Dynamic UPI QR Generation
Rather than displaying a static personal QR, the backend generates an order-specific NPCI UPI payload:
```text
upi://pay?pa=9676823113-2@ybl&pn=Madhurai%20Chocolate&am=750.00&tr=MC-2026-000001&cu=INR&tn=Madhurai%20Order%20MC-2026-000001
```
This payload is converted into a scannable QR data URL using `qrcode` and presented inside the checkout modal. Any Indian UPI application (Google Pay, PhonePe, Paytm, BHIM, Navi, Cred) can scan and pay the exact amount.

### Server-Side Payment Verification & Webhooks
- Orders are **never** marked as paid from frontend events.
- Inbound gateway webhooks verify SHA-256 HMAC signatures.
- Webhook events are checked against the `payment_events` table for **idempotency**, preventing double-crediting.
- Refunds are processed programmatically through the gateway adapter and tracked in `refunds` with audit logging.

---

## 8. Admin Control Without Code Changes

The business owner can manage every facet of the company through the Admin Portal (`http://localhost:3001`):
- **Catalog**: Add/edit products, MRP, selling price, weight, pieces per box, nutritional info, upload gallery images.
- **Inventory**: View live stock, low stock warnings, execute batch restocks, record adjustments (damaged, expired, returns).
- **Delivery**: Add/edit zones, import serviceable pincodes in bulk, configure delivery rules and quantity slabs.
- **Coupons**: Create percentage or flat discounts, expiry dates, minimum order values, usage limits.
- **Orders**: Live status progression (`ORDER_PLACED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`), mark COD cash collected, trigger refunds.
- **Business Settings**: Update GSTIN, FSSAI license, support contact details, payment gateway credentials, and COD order limits without modifying code.
- **RBAC**: Provision staff accounts with distinct roles (`SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`, `INVENTORY_MANAGER`).

---

## 9. Production Docker Deployment

Deploy all 4 services (PostgreSQL, Backend API, Customer Web, Admin Web) with Docker Compose:

```bash
# 1. Provide production environment variables in .env
cp .env.example .env

# 2. Build and run containers
docker-compose up -d --build

# 3. Check container status
docker-compose ps
```

### Production Domains
| Service | Domain | Docker Container Port | Internal Port |
| :--- | :--- | :--- | :--- |
| **Customer Store** | `madhuraichocolate.com` | `3000` | Nginx Port 80 |
| **Admin Operations** | `admin.madhuraichocolate.com` | `3001` | Nginx Port 80 |
| **Backend REST API** | `api.madhuraichocolate.com` | `4000` | Node Port 4000 |
| **PostgreSQL DB** | Internal | `5432` | Postgres Port 5432 |

---

## 10. Database Backups

### Automated PostgreSQL Backup
```bash
# Create timestamped SQL dump
docker exec -t madhurai_postgres pg_dump -U madhurai_user madhurai_chocolate > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat backup_20261023_120000.sql | docker exec -i madhurai_postgres psql -U madhurai_user -d madhurai_chocolate
```

---

## 11. Security Hardening Checklist
- [x] Input sanitization and SQL parameterized queries on every query.
- [x] Passwords hashed with `bcryptjs` (salt rounds: 10).
- [x] Module-level RBAC middleware enforcing permissions server-side (`403 Forbidden`).
- [x] Strict CORS origin validation for Customer and Admin origins.
- [x] API rate limiting on authentication and order creation endpoints.
- [x] Idempotency keys on payments and webhook event processing.
- [x] Sensitive gateway secrets kept strictly server-side in environment variables.
- [x] `noindex, nofollow` meta tags and robots header protecting admin endpoints from search engine scrapers.
- [x] Immutable `audit_logs` tracking all administrative actions with old/new values, IP addresses, and timestamps.
