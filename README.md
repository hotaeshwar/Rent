# BiD Rent Manager — PG, Hostel & Rental Property Management SaaS

BiD Rent Manager is a full-stack Next.js App Router and Firebase SaaS platform designed specifically for PG owners, hostel wardens, and rental property managers.

---

## 🚀 Key Features

1. **Authentication & Multi-Tenant Security**
   - Unique username & password authentication with secure backend resolution
   - Firebase Authentication session persistence & route guards
   - Mask/unmask eye toggles for all password fields
   - Password reset via official Firebase recovery email links
   - Complete logout with exit door icon that safely unmounts listeners and clears session

2. **Custom Visual Branding**
   - Custom **BiD Rent Manager** official branding with logo from `public/images/bid-logo.png`
   - **Hover-Only Animated SVG Lantern** in sidebar:
     - Lightweight vector hanging lantern with emerald outline and warm golden glow
     - Appears only on hover, swinging gracefully from -7° to +7°
     - Disappears smoothly on hover exit; completely hidden on mobile/touch devices
     - Non-blocking (`pointer-events-none`) so clicks always go to navigation links

3. **Estate & Capacity Architecture**
   - **Properties:** Multi-property tracking (PG, Hostel, Apartment, Independent House, Rental Room, Co-living)
   - **Rooms & Beds:** Floor-level rooms with automatic bed generation (`B1`, `B2`, ...) and active tenant allocation
   - **Tenants:** Check-in workflow with emergency contact, ID proof, agreement dates, and automated bed occupancy tracking

4. **Finance, Billing & Digital Receipts**
   - **Rent Invoices:** Monthly billing with rent, electricity, maintenance, and extra charges
   - **Payments:** Atomic transactions updating pending amounts (supporting partial payments)
   - **Printable Receipts:** Digital receipts with transaction reference numbers and date stamps
   - **Operating Expenses:** Categorized tracking (Electricity, Water, WiFi, Housekeeping, Groceries) with CSV export

5. **Operations, Maintenance & Personnel**
   - **Maintenance Requests:** Priority levels (Low, Medium, High, Urgent), staff assignment, and actual repair cost tracking
   - **Staff Management:** Wardens, housekeeping, security, attendance logging, and salary disbursement records
   - **Document Vault:** Secure Firebase Storage upload for lease agreements and tenant ID proofs

6. **Analytics & Notifications**
   - Real-time financial reports (Net Cashflow, Collection Efficiency %, Estate Occupancy %)
   - Property-wise comparative revenue breakdown
   - Real-time notifications for check-ins, check-outs, overdue rent, and repairs

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 App Router (JavaScript `.js` / `.jsx`)
- **Styling:** Pure Tailwind CSS (Mobile-first, responsive: 320px to 1440px+)
- **Database:** Cloud Firestore (Owner-scoped subcollections)
- **File Storage:** Firebase Storage
- **Auth:** Firebase Authentication + Backend username resolution
- **Animations:** Framer Motion (Transitions, Animated Lantern)
- **Icons:** Lucide React

---

## 📁 Firebase Security Rules & Deployment

Security rules are maintained as project code:

- `firestore.rules`: Strict owner isolation (`request.auth.uid == ownerId`), protected username mapping
- `storage.rules`: 10MB file limit, owner-scoped storage buckets, strict content-type validation
- `firestore.indexes.json`: Compound indexes for invoices, payments, expenses, and maintenance
- `firebase.json`: Firebase CLI configuration

### Deploying Rules:

```bash
# Login to Firebase CLI
firebase login

# Select the project
firebase use rentok-c2e17

# Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Deploy Storage Security Rules
firebase deploy --only storage
```

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

