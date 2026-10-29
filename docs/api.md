# REST API Documentation — Food Rescue

**Backend Port**: `http://127.0.0.1:8080`  
**Frontend Proxy Port**: `http://127.0.0.1:3000/api`  
**Data Format**: JSON (UTF-8)

---

## 1. System Endpoints

### 1.1 Health Check
- **`GET /api/health`**
- **Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "service": "Food Rescue Backend",
  "college": "Shah & Anchor Kutchhi Engineering College (SAKEC), Mumbai",
  "department": "Artificial Intelligence & Data Science",
  "system_time": "2026-10-27T05:08:12Z",
  "engine": "C++17 DSA Core"
}
```

### 1.2 Dashboard Metrics
- **`GET /api/dashboard/stats`**
- **Response `200 OK`**:
```json
{
  "total_donations": 12,
  "available_food_quantity": 315.0,
  "total_food_donated": 340.0,
  "total_food_allocated": 25.0,
  "donations_expiring_soon": 5,
  "successful_allocations": 1,
  "registered_recipients": 7,
  "allocation_success_rate": 7.35,
  "category_chart": [...],
  "status_chart": [...],
  "urgency_chart": [...],
  "urgent_donations": [...],
  "recent_activity": [...]
}
```

---

## 2. Food Donations CRUD

### 2.1 List All Donations
- **`GET /api/donations`**
- **Response `200 OK`**: Array of `Donation` objects.

### 2.2 Retrieve Donation by ID
- **`GET /api/donations/:id`**
- **Response `200 OK`** or `404 Not Found`.

### 2.3 Create Donation
- **`POST /api/donations`**
- **Request Body**:
```json
{
  "id": "D013",
  "food_name": "Vegetable Pulao Trays",
  "category": "Cooked Meals",
  "food_type": "Perishable",
  "quantity": 20.0,
  "unit": "kg",
  "donor_name": "SAKEC Canteen",
  "donor_location": "SAKEC Campus",
  "expiry_time": "2026-10-27T18:00:00Z",
  "expiry_epoch": 1793124000,
  "storage_notes": "Thermal insulated containers",
  "status": "AVAILABLE",
  "description": "Afternoon event surplus"
}
```
- **Response `201 Created`** or `400 Bad Request`.

### 2.4 Update Donation
- **`PUT /api/donations/:id`**

### 2.5 Delete Donation
- **`DELETE /api/donations/:id`**
- **Constraints**: Rejects deletion if allocations are tied to this donation ID (protects audit trail).

---

## 3. Recipient Organizations CRUD

### 3.1 List All Recipients
- **`GET /api/recipients`**

### 3.2 Create Recipient
- **`POST /api/recipients`**
- **Request Body**:
```json
{
  "id": "R008",
  "name": "Chembur Night Shelter",
  "contact_person": "Ramesh Gupta",
  "phone": "+91 98200 99887",
  "location": "Chembur East",
  "accepted_categories": ["Cooked Meals", "Bakery"],
  "required_quantity": 40.0,
  "current_demand": 40.0,
  "priority": "HIGH",
  "people_served": 110,
  "status": "ACTIVE"
}
```

---

## 4. Route Planning & Dijkstra

### 4.1 Get Road Network Graph
- **`GET /api/routes/graph`**
- Returns `{ "nodes": [...], "edges": [...] }`.

### 4.2 Calculate Shortest Route
- **`GET /api/routes/calculate?from=SAKEC Campus&to=Vashi`**
- **Response `200 OK`**:
```json
{
  "reachable": true,
  "total_distance": 13.6,
  "path": ["SAKEC Campus", "Chembur East", "Vashi"],
  "trace": [...]
}
```

---

## 5. Smart Matching

### 5.1 Preview Matches (Memory Simulation)
- **`POST /api/matching/preview`**
- Executes candidate ranking without modifying SQLite.
- Returns list of `MatchRecommendation` objects with explanations.

### 5.2 Confirm & Persist Allocations (Atomic Transaction)
- **`POST /api/matching/confirm`**
- **Request Body**: `{ "donation_ids": ["D001", "D005"] }`
- **Response `200 OK`**:
```json
{
  "success": true,
  "committed_count": 2,
  "allocations": [...]
}
```

---

## 6. Allocations & Reporting

### 6.1 List Allocation Audit Records
- **`GET /api/allocations`**

### 6.2 Export Allocations CSV
- **`GET /api/allocations/export.csv`**
- **Response**: `text/csv` stream with `Content-Disposition: attachment; filename="food_rescue_allocations.csv"`.

---

## 7. Algorithm Visualizer & System Controls

- **`GET /api/algorithms/dijkstra-trace?from=X&to=Y`**: Step-by-step edge relaxations and distance snapshots.
- **`GET /api/algorithms/heap-state`**: Binary min-heap tree hierarchy and contiguous array index mappings.
- **`GET /api/algorithms/hash-table-state`**: Bucket distribution, entry counts, and load factor.
- **`POST /api/system/reset-demo`**: Resets SQLite database to the 12 donations / 7 recipients / 15 graph edges baseline.
