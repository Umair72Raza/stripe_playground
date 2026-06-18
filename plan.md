# Stripe Playground — Learning Plan

A hands-on project to learn Stripe by building a **Playground Dashboard**: a React frontend + Node/Express backend where every button demonstrates one Stripe concept. No database, no product UI polish — focus on the API and the Stripe Dashboard.

---

## Why This Approach Works

Stripe's architecture is always:

```text
Frontend  →  Backend  →  Stripe API
```

The secret key (`STRIPE_SECRET_KEY`) lives **only** on the backend. The frontend uses publishable keys, Checkout redirects, or Stripe Elements — never the secret key.

This playground maps 1:1 to what most SaaS apps use daily.

---

## Prerequisites

Before Phase 1:

- [ ] [Stripe account](https://dashboard.stripe.com/register) (Test mode)
- [ ] Test API keys from Dashboard → Developers → API keys
- [ ] [Stripe CLI](https://stripe.com/docs/stripe-cli) installed (`stripe login`)
- [ ] Node.js 18+
- [ ] Basic React and Express familiarity

---

## Project Structure

```text
stripe_playground/
├── plan.md                 ← this file
├── backend/
│   ├── package.json
│   ├── .env                ← STRIPE_SECRET_KEY (never commit)
│   ├── server.js
│   ├── routes/
│   └── store.json          ← optional: persist IDs between restarts
└── frontend/
    ├── package.json
    ├── .env                ← VITE_STRIPE_PUBLISHABLE_KEY
    └── src/
        ├── App.jsx
        ├── api.js          ← fetch wrappers to backend
        └── pages/          ← one page per phase
```

**Storage rule:** No database. Keep the last created IDs in React state + optional `store.json` on the backend so you can resume after a restart.

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | backend `.env` | All server-side Stripe calls |
| `STRIPE_WEBHOOK_SECRET` | backend `.env` | Verify webhook signatures (from Stripe CLI) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | frontend `.env` | Elements only (Phase 10) |
| `PORT` | backend `.env` | Default `5000` |

---

## How to Learn Each Phase

For every feature, follow this loop:

1. **Click** the playground button
2. **Read** the API response in the UI (store IDs visibly)
3. **Open** [Stripe Dashboard → Test mode](https://dashboard.stripe.com/test) and find the object
4. **Inspect** related objects (e.g. Checkout → Customer → Payment Intent → Charge)
5. **Check** backend console / Webhook Logs page for events
6. **Write** one sentence in your notes: what object was created and what triggered it

---

## Phase Overview

| Phase | Topic | Key Stripe objects | Mode |
|-------|-------|-------------------|------|
| 0 | Scaffold | — | Setup |
| 1 | Products & Prices | Product, Price | API |
| 2 | Payment Links | PaymentLink, Customer, Payment | Hosted |
| 3 | Checkout Sessions | CheckoutSession, PaymentIntent, Charge | Hosted |
| 4 | Webhooks | Event | Infrastructure |
| 5 | Customers | Customer | API |
| 6 | Subscriptions | Subscription, Invoice | Checkout |
| 7 | Invoices | Invoice, InvoiceItem | API |
| 8 | Customer Portal | BillingPortal.Session | Hosted |
| 9 | Refunds | Refund, Charge | API |
| 10 | Payment Intents + Elements | PaymentIntent, PaymentMethod | Custom UI |

---

## Phase 0 — Scaffold

**Goal:** Runnable monorepo with health check and CORS.

### Backend

- [ ] Express app on port 5000
- [ ] `GET /health` → `{ ok: true }`
- [ ] Stripe SDK initialized with secret key
- [ ] CORS enabled for `http://localhost:5173`

### Frontend

- [ ] Vite + React app
- [ ] Sidebar nav listing all phases (disabled until built)
- [ ] Shared layout: action panel + response JSON viewer + "last IDs" strip

### Verify

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open frontend → health check succeeds.

---

## Phase 1 — Products & Prices

**Goal:** Understand that **Product ≠ Price**. A product is what you sell; a price is how much and how often.

### Mental model

```text
Product: "Pro Plan"     →  catalog item (name, description, images)
Price:   $20/month      →  billing terms (amount, currency, recurring)
```

One product can have many prices (monthly vs yearly, different currencies).

### Backend routes

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/products` | `stripe.products.create({ name })` |
| GET | `/products` | `stripe.products.list({ limit: 10 })` |
| POST | `/prices` | `stripe.prices.create({ product, unit_amount, currency, recurring? })` |
| GET | `/prices` | `stripe.prices.list({ limit: 10 })` |

### Frontend

- [ ] **Create Product** — form: name, optional description
- [ ] **Create Price** — pick product ID, amount (cents), currency, one-time vs recurring interval
- [ ] **List Products / Prices** — table with IDs (copy button)

### Exercises

1. Create product "Ebook" + one-time price $15
2. Create product "Pro Plan" + recurring price $20/month
3. Add a second price to "Pro Plan": $200/year
4. In Dashboard → Products, confirm one product, two prices

### Checkpoint

You can explain: *"Why do I need both a Product and a Price?"*

---

## Phase 2 — Payment Links

**Goal:** Fastest path to a real payment — no checkout code.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/payment-links` | `stripe.paymentLinks.create({ line_items: [{ price, quantity: 1 }] })` |

### Frontend

- [ ] **Create Payment Link** — select a price ID
- [ ] **Open Link** — opens `url` in new tab
- [ ] Show link URL + `payment_link.id`

### Test card

```text
4242 4242 4242 4242
Any future expiry, any CVC, any ZIP
```

### Exercises

1. Create link for Ebook price → pay → find Payment in Dashboard
2. Notice a Customer was created automatically
3. Trace: Payment Link → Checkout → Payment Intent → Charge

### Checkpoint

You can explain: *"When would I use Payment Links vs building Checkout myself?"*

---

## Phase 3 — Checkout Sessions

**Goal:** The standard SaaS payment flow — redirect to Stripe-hosted Checkout.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/checkout/sessions` | `stripe.checkout.sessions.create({ mode: 'payment', line_items, success_url, cancel_url })` |

Use `success_url` and `cancel_url` pointing back to the playground with query params.

### Frontend

- [ ] **Create Checkout Session** — select price, redirect to `session.url`
- [ ] Success page reads `session_id` from URL, calls backend to retrieve session

### Backend (retrieve)

| Method | Route | Stripe call |
|--------|-------|-------------|
| GET | `/checkout/sessions/:id` | `stripe.checkout.sessions.retrieve(id, { expand: ['payment_intent', 'customer'] })` |

### Exercises

1. Complete a checkout → retrieve session → note `payment_intent`, `customer`
2. Compare Dashboard objects with Payment Link flow from Phase 2
3. Expand and inspect nested objects in the JSON viewer

### Checkpoint

You can draw: `Checkout Session → Customer + Payment Intent + Charge`

---

## Phase 4 — Webhooks

**Goal:** Learn that Stripe **pushes** events to you — your app should not poll for payment status.

### Backend

| Method | Route | Behavior |
|--------|-------|----------|
| POST | `/webhook` | Raw body + `stripe.webhooks.constructEvent()` |

**Important:** Webhook route must use `express.raw({ type: 'application/json' })`, not `express.json()`.

Keep an in-memory array (last 50 events):

```js
{ id, type, created, data: { object: { id, ... } } }
```

| Method | Route | Behavior |
|--------|-------|----------|
| GET | `/webhook/events` | Return stored events |

### Stripe CLI

```bash
stripe listen --forward-to localhost:5000/webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### Frontend

- [ ] **Webhook Logs** page — live list, filter by event type, auto-refresh

### Events to watch

| Event | When |
|-------|------|
| `checkout.session.completed` | Checkout finished |
| `payment_intent.succeeded` | Money captured |
| `charge.succeeded` | Charge recorded |
| `customer.created` | New customer |

### Exercises

1. Run CLI listener, complete a checkout, see events appear in UI
2. Temporarily break signature verification — understand why it matters
3. Read [Stripe webhook best practices](https://stripe.com/docs/webhooks/best-practices)

### Checkpoint

You can explain: *"Why can't I trust the success_url alone?"*

---

## Phase 5 — Customers

**Goal:** Customers are the anchor for subscriptions, invoices, and payment history.

### Mental model

```text
Customer → Subscriptions → Invoices → Payments
```

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/customers` | `stripe.customers.create({ email, name })` |
| GET | `/customers/:id` | `stripe.customers.retrieve(id)` |
| GET | `/customers` | `stripe.customers.list({ limit: 10 })` |

### Frontend

- [ ] **Create Customer** — email, name
- [ ] **Get Customer** — paste or pick ID, show full object
- [ ] Pin "active customer ID" for later phases

### Exercises

1. Create customer manually → create Checkout Session with `customer` param → pay
2. Confirm payment appears on that customer's page in Dashboard
3. Compare auto-created customer (Phase 2) vs explicit customer

### Checkpoint

You know when to create a customer upfront vs let Checkout create one.

---

## Phase 6 — Subscriptions

**Goal:** Billing that repeats — this is where Stripe Billing clicks.

### Setup (once)

Create a recurring price if you haven't: e.g. **$10/month** on "Starter Plan".

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/checkout/subscription` | `stripe.checkout.sessions.create({ mode: 'subscription', customer, line_items, success_url, cancel_url })` |

Optional direct API (advanced):

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/subscriptions` | `stripe.subscriptions.create({ customer, items: [{ price }] })` — requires saved payment method |

Prefer Checkout for learning — it handles payment method collection.

### Frontend

- [ ] **Create Subscription Checkout** — pick customer + recurring price → redirect
- [ ] **List Subscriptions** — `stripe.subscriptions.list()`

### Webhook events to watch

- `customer.subscription.created`
- `invoice.paid`
- `invoice.payment_succeeded`

### Exercises

1. Subscribe test customer → watch Subscription + Invoice + Payment appear in Dashboard
2. Find the subscription in Webhook Logs
3. Note `current_period_start` / `current_period_end` on the subscription object

### Checkpoint

You can explain the subscription lifecycle: create → invoice → pay → renew.

---

## Phase 7 — Invoices

**Goal:** Invoices are **bills**; payments are **money collection** — related but separate objects.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| GET | `/invoices` | `stripe.invoices.list({ limit: 20 })` |
| GET | `/invoices/:id` | `stripe.invoices.retrieve(id)` |

### Frontend

- [ ] **List Invoices** — ID, amount, status, customer email
- [ ] **View Invoice** — full detail + link to hosted invoice URL if present

### Exercises

1. After Phase 6 subscription, list invoices — find the first one
2. Open hosted invoice URL from Dashboard
3. Compare `invoice.status` values: `draft`, `open`, `paid`, `void`

### Checkpoint

You can explain why subscriptions auto-generate invoices.

---

## Phase 8 — Customer Portal

**Goal:** Stripe-hosted self-service — update card, cancel subscription, view invoices — without building UI.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/billing-portal` | `stripe.billingPortal.sessions.create({ customer, return_url })` |

Configure portal in Dashboard → Settings → Billing → Customer portal (enable cancel, payment method update).

### Frontend

- [ ] **Open Billing Portal** — requires pinned customer with active subscription → redirect to `url`

### Exercises

1. Open portal for subscribed customer
2. Cancel subscription in portal → watch webhook `customer.subscription.updated` or `deleted`
3. Re-enable subscription via Dashboard or new checkout

### Checkpoint

You know what you'd ship to production vs what Stripe hosts for you.

---

## Phase 9 — Refunds

**Goal:** Reverse a charge and observe webhook fallout.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| GET | `/payment-intents` | `stripe.paymentIntents.list({ limit: 20 })` |
| POST | `/refunds` | `stripe.refunds.create({ payment_intent })` |

### Frontend

- [ ] **List Payment Intents** — ID, amount, status, customer
- [ ] **Refund** — select succeeded intent, confirm, show refund object

### Webhook events

- `charge.refunded`
- `refund.created`

### Exercises

1. Refund a test payment → verify status in Dashboard
2. Confirm webhook events in logs
3. Try partial refund: `amount` in cents (optional stretch)

### Checkpoint

You know the difference between canceling a PaymentIntent vs refunding a succeeded charge.

---

## Phase 10 — Payment Intents + Elements

**Goal:** Build a custom card form — understand **why Checkout exists**.

Save this for last. More code, more PCI considerations, more edge cases.

### Backend

| Method | Route | Stripe call |
|--------|-------|-------------|
| POST | `/payment-intents` | `stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } })` |

Return `client_secret` to frontend.

### Frontend

- [ ] Install `@stripe/stripe-js` + `@stripe/react-stripe-js`
- [ ] Wrap app in `<Elements>`
- [ ] **Custom Pay Form** — Card Element + confirm with `stripe.confirmPayment()`

### Exercises

1. Create intent → confirm with test card → success UI
2. Compare steps vs Checkout (Phase 3)
3. List failure cases: declined card `4000 0000 0000 0002`

### Checkpoint

You can articulate tradeoffs: Checkout vs Payment Intents + Elements.

---

## Suggested Build Order

Build in phase order. Do not skip Phase 1 — almost everyone confuses Product and Price at first.

```text
0 Scaffold
1 Products & Prices      ← foundation for everything else
2 Payment Links          ← first "real" payment, minimal code
3 Checkout Sessions      ← standard SaaS flow
4 Webhooks               ← do this before relying on success URLs
5 Customers
6 Subscriptions
7 Invoices
8 Customer Portal
9 Refunds
10 Elements              ← capstone
```

Phases 4 and 5 can swap, but webhooks should be running before Phase 6 so subscription events are visible immediately.

---

## Playground UI Conventions

Keep the UI boring and consistent:

- **Left:** Phase name + short description + action buttons
- **Center:** Forms (only when input is needed)
- **Right:** JSON response viewer (syntax highlighted)
- **Bottom strip:** Last created IDs (`product_id`, `price_id`, `customer_id`, …) with copy buttons
- **Global:** Link to open relevant Dashboard page (Products, Customers, etc.)

---

## Testing Cheatsheet

| Scenario | Test card |
|----------|-----------|
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |
| 3D Secure | `4000 0025 0000 3155` |
| Insufficient funds | `4000 0000 0000 9995` |

Always use **Test mode** keys and toggle in Dashboard.

---

## Common Mistakes to Avoid

1. Putting secret key in React env vars
2. Using `express.json()` on the webhook route (signature verification will fail)
3. Trusting `success_url` redirect as proof of payment (use webhooks)
4. Creating prices in dollars instead of cents (`2000` = $20.00)
5. Forgetting `mode: 'subscription'` vs `mode: 'payment'` in Checkout
6. Skipping Dashboard inspection — the playground is half code, half Dashboard

---

## Definition of Done

You've completed this plan when you can:

- [ ] Create products/prices and explain the relationship
- [ ] Take a one-time payment via Payment Link and Checkout
- [ ] Receive and verify webhooks locally with Stripe CLI
- [ ] Create a customer and attach a subscription via Checkout
- [ ] List invoices and open the Customer Portal
- [ ] Issue a refund and see webhook events
- [ ] Complete a payment with Elements and explain vs Checkout

---

## Next Step

Start **Phase 0**: scaffold `backend/` and `frontend/`, wire health check, add `.env.example` files (no real keys), and enable Phase 1 in the sidebar.

When ready, say: *"Let's build Phase 0"* and we'll implement it together.
