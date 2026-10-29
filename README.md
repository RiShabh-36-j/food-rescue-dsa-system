# FOOD RESCUE — Smart Food Redistribution System
### *DSA-Powered Sustainability Project*

**Shah & Anchor Kutchhi Engineering College (SAKEC), Chembur, Mumbai**  
**Department of Artificial Intelligence and Data Science (AIDS)**  
**Second Year (SE) Data Structures & Algorithms Microproject**

---

## 1. Project Overview

**FOOD RESCUE** is a full-stack, production-quality sustainability web platform designed to solve urban food waste. Surplus perishable food from restaurants, bakeries, caterers, supermarkets, and college canteens is automatically matched with eligible NGOs, homeless shelters, and student welfare food pantries before it expires.

The core allocation decisions are directly powered by **C++ Data Structures and Algorithms**:
1. **Hash Tables (`std::unordered_map`)**: Average $O(1)$ constant-time lookup and duplicate prevention.
2. **Min-Heap Priority Queue (`ExpiryMinHeap`)**: Prioritizes surplus food approaching critical expiration timestamps.
3. **Weighted Graph & Dijkstra's Algorithm (`GraphEngine`)**: Calculates the minimum transit road distance between food donors and recipient locations across the Mumbai road network.
4. **Greedy Candidate Matching Engine**: Evaluates category compatibility, outstanding demand, recipient priority, and road connectivity, executing atomic updates inside SQLite transactions.

> [!NOTE]
> **Educational Demonstration Notice**: This application uses synthetic demonstration data based on the Mumbai / Chembur / SAKEC regional network. It is not connected to live GPS, municipal traffic sensors, or commercial food delivery APIs.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts data analytics.
- **Backend**: C++17 REST API using `cpp-httplib` (single header) and `nlohmann/json`.
- **Database**: Embedded SQLite3 amalgamation (`sqlite3.c` / `sqlite3.h`) with prepared statements and atomic transactions.
- **Compilers & Toolchains**: GCC 16.2.0 (w64devkit) / MinGW, Node.js v20+, Windows PowerShell.

---

## 3. Local Setup & Startup Guide (Step-by-Step for Beginners)

The system is configured so that you can launch both the C++ backend and the React frontend with a single command.

### Local Addresses
- **Frontend Web Dashboard**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **Backend C++ REST API**: [http://127.0.0.1:8080](http://127.0.0.1:8080)
- **Health Check Endpoint**: [http://127.0.0.1:8080/api/health](http://127.0.0.1:8080/api/health)

---

### Method A: Quick Launch (One-Click)

#### Option 1: Using Windows Command Prompt (.bat)
Double-click or run from terminal:
```cmd
scripts\start.bat
```

#### Option 2: Using Windows PowerShell (.ps1)
```powershell
.\scripts\start.ps1
```

---

### Method B: Manual Step-by-Step Launch

If you prefer starting each service individually in separate terminals:

#### Step 1: Launch the C++ Backend
In your first terminal:
```powershell
.\backend\food_rescue_backend.exe
```
*The server will start listening on `http://127.0.0.1:8080` and automatically create/seed `data/food_rescue.db`.*

#### Step 2: Launch the React Frontend
In a second terminal:
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 3000
```
*Open your web browser and navigate to `http://127.0.0.1:3000`.*

---

### Method C: Rebuilding from Source

If you edit the C++ code or clone the repository on a new machine:
```powershell
.\scripts\setup.ps1
```
*Or manually:*
```powershell
# 1. Compile SQLite amalgamation object
gcc -O2 -c backend\include\sqlite3.c -o backend\include\sqlite3.o

# 2. Compile C++ Backend
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\src\main.cpp backend\include\sqlite3.o -o backend\food_rescue_backend.exe -lws2_32 -lwsock32 -lcrypt32

# 3. Compile and Run Automated Tests
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\tests\run_tests.cpp backend\include\sqlite3.o -o backend\tests\run_tests.exe -lws2_32 -lwsock32 -lcrypt32
.\backend\tests\run_tests.exe

# 4. Install Frontend Dependencies
cd frontend
npm install
npm run build
```

---

## 4. Key Application Features

### 1. Overview Dashboard
- Summary KPI metric cards (Total Food Registered, Available Surplus Quantity, Donations Expiring Soon, Confirmed Allocations, Registered Recipient NGOs).
- Interactive Recharts visual analytics (Category Distribution Donut, Expiry Urgency Bar Chart, Donation Lifecycle Status Bar).
- Live Urgent Donations list showing the head of the C++ Min-Heap.
- Audit feed showing recent redistribution transactions.

### 2. Food Donation Management
- Full CRUD operations with modal registration form.
- Real-time search by food name, donor organization, or location.
- Category filtering (`Cooked Meals`, `Bakery`, `Fresh Produce`, `Dairy`, `Packaged Goods`, `Beverages`).
- Status filtering (`AVAILABLE`, `PARTIALLY_ALLOCATED`, `FULLY_ALLOCATED`, `EXPIRED`, `UNAVAILABLE`).
- Sort by expiry time ascending/descending.
- Foreign-key audit integrity: donations with confirmed allocations cannot be accidentally deleted.

### 3. Recipient Organization Management
- Partner NGOs, shelters, and community food banks.
- Tracks required demand vs. fulfilled quantity with dynamic progress bars.
- Multi-category accepted food preferences.
- Recipient priority tiers (`HIGH`, `MEDIUM`, `LOW`).

### 4. Smart Matching Center (Core DSA Feature)
- Identifies the most urgent donations needing allocation.
- Computes optimal candidate pairings using C++ Min-Heap and Dijkstra shortest path routing.
- Displays transparent decision explanations:
  > *"Donation D001 ('Fresh Biryani', 25 kg) was matched with NGO R002 ('Robin Hood Army Chembur') because the food category 'Cooked Meals' is accepted, NGO priority is 'High' with outstanding demand of 30 kg, and it has the shortest feasible route of 4.2 km (via Chembur -> Kurla)."*
- **Preview Matches** allows inspecting decisions without modifying the database.
- **Confirm Allocations** commits the selections inside an atomic SQLite transaction.

### 5. Route Planner
- Interactive SVG rendering of the Mumbai regional road network graph (11 hub vertices).
- Displays distance weights on all connecting road edges.
- Source and Destination selectors.
- Highlights the shortest path in emerald green along the SVG road connections.
- Detects unreachable nodes (e.g. `Isolated Outlet`).

### 6. Allocation History & CSV Export
- Searchable audit log of all completed allocations.
- One-click **Export to CSV** for academic reporting and record keeping.
- Detailed modal inspection of each allocation's route path and rationale.

### 7. Algorithm Visualizer (Educational Module)
- **Min-Heap Visualizer**: Interactive binary tree representation displaying parent-child indices and internal array layout.
- **Dijkstra Step Trace**: Scrubber and step player showing every vertex visited, neighbor inspected, edge relaxation, and distance snapshot.
- **Hash Table Visualizer**: Explores `std::unordered_map` bucket distributions, collision chains, and load factor.
- **Complexity Matrix**: Detailed table summarizing theoretical bounds and space complexity.

### 8. Settings & Synthetic Data Reset
- SAKEC AIDS Department information.
- C++17 runtime diagnostics.
- One-click button to reset the database to the 12 donations / 7 recipients / 15 graph routes baseline.

---

## 5. Automated Test Results (18/18 Passed)

The native test suite in `backend/tests/run_tests.exe` verifies all 18 requirements:

```
[PASS] 1. Register and retrieve donation by ID
[PASS] 2. Reject duplicate donation ID
[PASS] 3. Reject invalid or negative quantity
[PASS] 4. Correctly prioritize earliest valid expiry
[PASS] 5. Ignore expired donations during new matching
[PASS] 6. Reject incompatible food categories
[PASS] 7. Handle insufficient quantities safely
[PASS] 8. Support partial allocation
[PASS] 9. Prevent recipient demand from becoming negative
[PASS] 10. Calculate known shortest path correctly (Dijkstra)
[PASS] 11. Handle unreachable destination
[PASS] 12. Handle equal expiry times deterministically
[PASS] 13. Update donation status after full allocation
[PASS] 14. Preserve correct status after partial allocation
[PASS] 15. Ensure database rollback on allocation failure
[PASS] 16. Matching preview does not modify persistent records
[PASS] 17. Confirming allocation updates all related records
[PASS] 18. Application handles empty datasets gracefully
========================================================
TEST SUITE COMPLETED: 18/18 PASSED
========================================================
```

---

## 6. Repository Structure

```
food-rescue/
├── backend/
│   ├── include/
│   │   ├── httplib.h              # C++ lightweight HTTP server
│   │   ├── json.hpp               # nlohmann modern JSON library
│   │   ├── sqlite3.c / .h         # SQLite embedded database engine
│   │   └── sqlite3.o              # Precompiled SQLite object
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── ExpiryMinHeap.hpp  # Deterministic Min-Heap priority queue
│   │   │   ├── Dijkstra.hpp       # Dijkstra shortest path with step trace
│   │   │   └── MatchingEngine.hpp # Greedy candidate matching & ranking
│   │   ├── api/
│   │   │   └── Server.hpp         # REST API endpoints & CORS middleware
│   │   ├── database/
│   │   │   └── Database.hpp       # SQLite CRUD & transaction rollback
│   │   ├── models/
│   │   │   ├── Donation.hpp       # Donation struct & JSON serialization
│   │   │   ├── Recipient.hpp      # Recipient struct & categories
│   │   │   ├── Allocation.hpp     # Allocation record struct
│   │   │   └── Graph.hpp          # Edges, DijkstraStep, DijkstraResult
│   │   ├── services/
│   │   │   └── FoodRescueService.hpp # Business logic & seed dataset
│   │   └── main.cpp               # Backend entry point (port 8080)
│   ├── tests/
│   │   ├── run_tests.cpp          # 18 automated test scenarios
│   │   └── run_tests.exe          # Compiled native test executable
│   ├── CMakeLists.txt
│   └── food_rescue_backend.exe    # Compiled standalone C++ binary
├── frontend/
│   ├── src/
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx      # Sidebar navigation & header
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx   # KPI cards, Recharts analytics
│   │   │   ├── DonationsPage.tsx  # CRUD management, filters, expiry
│   │   │   ├── RecipientsPage.tsx # Partner NGO demands & priorities
│   │   │   ├── SmartMatchingPage.tsx # Preview & confirm allocations
│   │   │   ├── RoutePlannerPage.tsx  # Interactive SVG weighted graph
│   │   │   ├── AllocationHistoryPage.tsx # History & CSV export
│   │   │   ├── AnalyticsPage.tsx  # Redistribution metrics & trends
│   │   │   ├── AlgorithmVisualizerPage.tsx # Min-Heap, Dijkstra, Hash Table
│   │   │   └── SettingsPage.tsx   # SAKEC info & demo data reset
│   │   ├── services/
│   │   │   └── api.ts             # Typed REST API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind CSS directives
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── data/
│   ├── food_rescue.db             # Persistent SQLite database file
│   └── .gitkeep
├── docs/
│   ├── architecture.md            # System design & component flow
│   ├── algorithms.md              # DSA mathematical formulas & proofs
│   ├── api.md                     # REST API reference
│   └── test-plan.md               # 18 test cases and execution log
├── scripts/
│   ├── setup.bat / setup.ps1      # Build and dependency setup
│   ├── start.bat / start.ps1      # One-click startup script
│   └── reset_demo.bat / .ps1      # Re-seed baseline data
├── .gitignore
└── README.md                      # Complete project documentation
```

---

## 7. Academic Assessment Summary

- **Course**: Second Year (SE) Artificial Intelligence and Data Science (AIDS)
- **Institution**: Shah & Anchor Kutchhi Engineering College (SAKEC), Chembur, Mumbai
- **Affiliation**: University of Mumbai
- **DSA Curriculum Alignment**:
  - Module 1: Hash Tables, Collisions, and Load Factors (`std::unordered_map`).
  - Module 2: Priority Queues, Binary Heaps, and Deterministic Comparators (`ExpiryMinHeap`).
  - Module 3: Graphs, Adjacency Lists, and Single-Source Shortest Path (`Dijkstra`).
  - Module 4: Greedy Algorithms, Multi-Criteria Optimization, and Audit Logging.
