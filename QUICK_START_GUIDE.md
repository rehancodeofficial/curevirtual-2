# CureVirtual V2.0 - Quick Start Implementation Guide

## 🚀 Getting Started (Day 1)

This guide will help you begin implementing the production-ready architecture systematically.

---

## Step 1: Database Schema Migration

### 1.1 Backup Current Database

```bash
cd /Users/rehan/Documents/My\ Projects/curevirtual/web/backend

# Create backup
npx prisma db pull --force
cp prisma/schema.prisma prisma/schema_backup_$(date +%Y%m%d).prisma
```

### 1.2 Update schema.prisma

Open `prisma/schema.prisma` and add the following:

**A. Add new enums** (after existing enums):

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  READY_FOR_PICKUP
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REJECTED
}

enum TransactionType {
  SUBSCRIPTION_PAYMENT
  ORDER_PAYMENT
  CONSULTATION_PAYMENT
  REFUND
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum NotificationType {
  APPOINTMENT
  PRESCRIPTION
  ORDER
  MESSAGE
  PAYMENT
  SYSTEM
}
```

**B. Update User model** (add these relations):

```prisma
model User {
  // ... existing fields ...

  // NEW RELATIONS
  transactions    Transaction[]
  notifications   Notification[]
}
```

**C. Update PharmacyProfile model**:

```prisma
model PharmacyProfile {
  // ... existing fields ...

  // NEW RELATIONS
  medicines       Medicine[]
  medicineOrders  MedicineOrder[]
}
```

**D. Update PatientProfile model**:

```prisma
model PatientProfile {
  // ... existing fields ...

  // NEW RELATIONS
  medicineOrders  MedicineOrder[]
}
```

**E. Update Prescription model**:

```prisma
model Prescription {
  // ... existing fields ...

  // NEW RELATIONS
  medicineOrders  MedicineOrder[]
}
```

**F. Update Subscription model**:

```prisma
model Subscription {
  // ... existing fields ...

  // NEW RELATIONS
  transactions    Transaction[]
}
```

**G. Update VideoConsultation model**:

```prisma
model VideoConsultation {
  // ... existing fields ...

  // NEW RELATIONS
  videoSession    VideoSession?
}
```

**H. Copy all new models** from `schema_v2_additions.prisma`:

- Medicine
- MedicineOrder
- MedicineOrderItem
- Transaction
- Notification
- VideoSession
- SystemMetric

### 1.3 Run Migration

```bash
# Generate migration
npx prisma migrate dev --name add_pharmacy_v2_features

# Generate Prisma Client
npx prisma generate
```

---

## Step 2: Environment Configuration

### 2.1 Update .env file

Add these new environment variables:

```bash
# Payment (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Video (Choose one: Agora or Twilio)
# Option A: Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

# Option B: Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_API_KEY=your_key
TWILIO_API_SECRET=your_secret

# Notifications
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@curevirtual.com

# Redis (for real-time features)
REDIS_URL=redis://localhost:6379

# File Upload
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=curevirtual-uploads
AWS_REGION=us-east-1

# App Settings
NODE_ENV=development
API_VERSION=v1
```

### 2.2 Install New Dependencies

```bash
cd /Users/rehan/Documents/My\ Projects/curevirtual/web/backend

npm install --save \
  stripe \
  socket.io \
  redis \
  ioredis \
  agora-access-token \
  @sendgrid/mail \
  multer \
  aws-sdk \
  helmet \
  express-rate-limit \
  express-mongo-sanitize \
  xss-clean \
  winston \
  joi
```

Frontend dependencies:

```bash
cd /Users/rehan/Documents/My\ Projects/curevirtual/web/frontend

npm install --save \
  socket.io-client \
  @stripe/stripe-js \
  @stripe/react-stripe-js \
  agora-rtc-sdk-ng \
  react-query \
  @tanstack/react-query \
  date-fns \
  recharts \
  react-hot-toast
```

---

## Step 3: Backend Structure

### 3.1 Create Service Layer

```bash
cd /Users/rehan/Documents/My\ Projects/curevirtual/web/backend
mkdir -p services
touch services/PaymentService.js
touch services/InventoryService.js
touch services/OrderService.js
touch services/NotificationService.js
touch services/VideoService.js
```

### 3.2 Create New Route Files

```bash
mkdir -p routes/v1
touch routes/v1/pharmacy-inventory.js
touch routes/v1/medicine-orders.js
touch routes/v1/payments.js
touch routes/v1/notifications.js
touch routes/v1/video.js
```

---

## Step 4: Implement Pharmacy Inventory (First Feature)

### 4.1 Create Inventory Service

**File: `services/InventoryService.js`**

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class InventoryService {
  /**
   * Add new medicine to pharmacy inventory
   */
  async addMedicine(pharmacyId, medicineData) {
    const medicine = await prisma.medicine.create({
      data: {
        pharmacyId,
        ...medicineData,
      },
    });

    // Create notification for low stock if applicable
    if (medicine.stockQuantity <= medicine.lowStockThreshold) {
      await this.notifyLowStock(pharmacyId, medicine);
    }

    return medicine;
  }

  /**
   * Update medicine in inventory
   */
  async updateMedicine(medicineId, pharmacyId, updates) {
    // Verify ownership
    const medicine = await prisma.medicine.findFirst({
      where: { id: medicineId, pharmacyId },
    });

    if (!medicine) {
      throw new Error("Medicine not found or unauthorized");
    }

    const updated = await prisma.medicine.update({
      where: { id: medicineId },
      data: updates,
    });

    return updated;
  }

  /**
   * Update stock quantity
   */
  async updateStock(medicineId, pharmacyId, quantity, operation = "SET") {
    const medicine = await prisma.medicine.findFirst({
      where: { id: medicineId, pharmacyId },
    });

    if (!medicine) {
      throw new Error("Medicine not found");
    }

    let newQuantity;
    if (operation === "SET") {
      newQuantity = quantity;
    } else if (operation === "ADD") {
      newQuantity = medicine.stockQuantity + quantity;
    } else if (operation === "SUBTRACT") {
      newQuantity = Math.max(0, medicine.stockQuantity - quantity);
    }

    const updated = await prisma.medicine.update({
      where: { id: medicineId },
      data: { stockQuantity: newQuantity },
    });

    // Check for low stock
    if (newQuantity <= medicine.lowStockThreshold) {
      await this.notifyLowStock(pharmacyId, updated);
    }

    return updated;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(pharmacyId) {
    const items = await prisma.$queryRaw`
      SELECT * FROM medicine
      WHERE pharmacyId = ${pharmacyId}
      AND stockQuantity <= lowStockThreshold
      ORDER BY stockQuantity ASC
    `;

    return items;
  }

  /**
   * Notify pharmacy about low stock
   */
  async notifyLowStock(pharmacyId, medicine) {
    const pharmacy = await prisma.pharmacyProfile.findUnique({
      where: { id: pharmacyId },
      include: { user: true },
    });

    await prisma.notification.create({
      data: {
        userId: pharmacy.userId,
        type: "SYSTEM",
        title: "Low Stock Alert",
        message: `${medicine.name} is low in stock (${medicine.stockQuantity} units remaining)`,
        link: "/pharmacy/inventory",
        actionData: JSON.stringify({ medicineId: medicine.id }),
      },
    });
  }
}

module.exports = new InventoryService();
```

### 4.2 Create Inventory Routes

**File: `routes/v1/pharmacy-inventory.js`**

```javascript
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../../middleware/rbac");
const InventoryService = require("../../services/InventoryService");

/**
 * POST /api/v1/pharmacy/medicines
 * Add new medicine to inventory
 */
router.post(
  "/medicines",
  verifyToken,
  requireRole(["PHARMACY"]),
  async (req, res) => {
    try {
      const pharmacyProfile = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!pharmacyProfile) {
        return res.status(404).json({ error: "Pharmacy profile not found" });
      }

      const medicine = await InventoryService.addMedicine(
        pharmacyProfile.id,
        req.body
      );

      res.status(201).json({ success: true, data: medicine });
    } catch (error) {
      console.error("Add medicine error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/pharmacy/medicines
 * List all medicines for this pharmacy
 */
router.get(
  "/medicines",
  verifyToken,
  requireRole(["PHARMACY"]),
  async (req, res) => {
    try {
      const pharmacyProfile = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user.id },
      });

      const { search, category, page = 1, limit = 20 } = req.query;

      const where = { pharmacyId: pharmacyProfile.id };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.category = category;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [medicines, total] = await Promise.all([
        prisma.medicine.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.medicine.count({ where }),
      ]);

      res.json({
        success: true,
        data: medicines,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("List medicines error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /api/v1/pharmacy/medicines/:id
 * Update medicine
 */
router.put(
  "/medicines/:id",
  verifyToken,
  requireRole(["PHARMACY"]),
  async (req, res) => {
    try {
      const pharmacyProfile = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user.id },
      });

      const medicine = await InventoryService.updateMedicine(
        req.params.id,
        pharmacyProfile.id,
        req.body
      );

      res.json({ success: true, data: medicine });
    } catch (error) {
      console.error("Update medicine error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PATCH /api/v1/pharmacy/medicines/:id/stock
 * Update stock quantity
 */
router.patch(
  "/medicines/:id/stock",
  verifyToken,
  requireRole(["PHARMACY"]),
  async (req, res) => {
    try {
      const pharmacyProfile = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user.id },
      });

      const { quantity, operation = "SET" } = req.body;

      const medicine = await InventoryService.updateStock(
        req.params.id,
        pharmacyProfile.id,
        quantity,
        operation
      );

      res.json({ success: true, data: medicine });
    } catch (error) {
      console.error("Update stock error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/pharmacy/medicines/low-stock
 * Get low stock items
 */
router.get(
  "/medicines/low-stock",
  verifyToken,
  requireRole(["PHARMACY"]),
  async (req, res) => {
    try {
      const pharmacyProfile = await prisma.pharmacyProfile.findUnique({
        where: { userId: req.user.id },
      });

      const items = await InventoryService.getLowStockItems(pharmacyProfile.id);

      res.json({ success: true, data: items });
    } catch (error) {
      console.error("Low stock error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
```

### 4.3 Register Routes in server.js

**Update `server.js`:**

```javascript
// Add after existing routes
const pharmacyInventoryRoutes = require("./routes/v1/pharmacy-inventory");

// Mount routes
app.use("/api/v1/pharmacy", pharmacyInventoryRoutes);
```

---

## Step 5: Test the Implementation

### 5.1 Create Test Medicine

```bash
# Using curl or Postman
curl -X POST http://localhost:5001/api/v1/pharmacy/medicines \
  -H "Authorization: Bearer YOUR_PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "category": "Pain Relief",
    "manufacturer": "PharmaCorp",
    "stockQuantity": 100,
    "unitPrice": 5.99,
    "dosageForm": "Tablet",
    "strength": "500mg",
    "lowStockThreshold": 20,
    "requiresPrescription": false
  }'
```

### 5.2 Verify in Database

```bash
npx prisma studio
# Navigate to Medicine model and verify the record
```

---

## Step 6: Frontend Implementation (Pharmacy Inventory UI)

### 6.1 Create Inventory Page

**File: `frontend/src/pages/pharmacy/Inventory.jsx`**

```jsx
import { useState, useEffect } from "react";
import api from "../../Lib/api";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function PharmacyInventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await api.get("/api/v1/pharmacy/medicines");
      setMedicines(res.data.data);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="PHARMACY">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#027906] text-white px-6 py-2 rounded-lg hover:bg-[#190366]"
          >
            + Add Medicine
          </button>
        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className="bg-white/10 rounded-2xl p-6">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-3 text-left">Medicine</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id} className="border-b border-white/10">
                    <td className="p-3">
                      <div>
                        <div className="font-semibold">{med.name}</div>
                        <div className="text-sm text-gray-300">
                          {med.genericName}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{med.category}</td>
                    <td className="p-3">
                      <span
                        className={
                          med.stockQuantity <= med.lowStockThreshold
                            ? "text-red-400"
                            : ""
                        }
                      >
                        {med.stockQuantity} units
                      </span>
                    </td>
                    <td className="p-3">${med.unitPrice}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          med.isAvailable ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {med.isAvailable ? "Available" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="text-blue-400 hover:underline mr-3">
                        Edit
                      </button>
                      <button className="text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

### 6.2 Add Route

**Update `frontend/src/App.jsx`:**

```jsx
import PharmacyInventory from "./pages/pharmacy/Inventory";

// Add route:
<Route path="/pharmacy/inventory" element={<PharmacyInventory />} />;
```

---

## Next Steps (Week 1)

1. ✅ **Database migrated**
2. ✅ **Inventory service created**
3. ✅ **Inventory routes implemented**
4. ✅ **Frontend inventory page created**

**Continue with:**

- [ ] Medicine order processing (Week 2)
- [ ] Payment integration (Week 2-3)
- [ ] Real-time notifications (Week 3)

---

## Support & Documentation

- **Architecture Doc**: `/SYSTEM_REDESIGN_ARCHITECTURE.md`
- **Schema Additions**: `/web/backend/prisma/schema_v2_additions.prisma`
- **This Guide**: `/QUICK_START_GUIDE.md`

**Questions?** Review the main architecture document for detailed explanations.

---

**Happy Building! 🚀**
