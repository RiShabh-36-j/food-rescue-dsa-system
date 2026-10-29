# System Architecture — Food Rescue Expiry-Time Matching System

**Shah & Anchor Kutchhi Engineering College (SAKEC), Chembur, Mumbai**  
**Department of Artificial Intelligence and Data Science**  
**Second Year (SE) DSA Microproject**

---

## 1. High-Level Architectural Overview

The **Food Rescue Expiry-Time Matching System** demonstrates an end-to-end full-stack platform optimizing food waste reduction and equitable redistribution. It connects surplus food outlets (canteens, restaurants, caterers, bakeries) with beneficiary NGOs, shelters, and food banks across the Mumbai urban network.

```
+-------------------------------------------------------------------------------+
|                       REACT + VITE + TYPESCRIPT FRONTEND                      |
|                   (Port 3000 • Tailwind CSS • Lucide • Recharts)               |
|                                                                               |
|  - Overview Dashboard   - Donation Management    - Recipient Management       |
|  - Smart Matching       - Route Planner (SVG)    - Allocation History         |
|  - Analytics & Reports  - Algorithm Visualizer   - Settings & Seed Reset      |
+-------------------------------------------------------------------------------+
                                     |
                                     | REST API (JSON / HTTP)
                                     v
+-------------------------------------------------------------------------------+
|                           C++17 CORE BACKEND ENGINE                           |
|                  (Port 8080 • cpp-httplib • nlohmann/json)                    |
|                                                                               |
|   +---------------------+   +---------------------+   +-------------------+   |
|   |  std::unordered_map |   |    ExpiryMinHeap    |   |    GraphEngine    |   |
|   |  Hash Tables (O(1)) |   |  Priority Queue     |   |   (Dijkstra O(E)) |   |
|   +---------------------+   +---------------------+   +-------------------+   |
|                                      |                                        |
|                          +-----------------------+                            |
|                          |    Matching Engine    |                            |
|                          | (Greedy Expiry-First) |                            |
|                          +-----------------------+                            |
+-------------------------------------------------------------------------------+
                                     |
                                     | Prepared Statements / Transactions
                                     v
+-------------------------------------------------------------------------------+
|                         SQLITE3 EMBEDDED DATABASE                             |
|                           ("data/food_rescue.db")                             |
|                                                                               |
|   - donations (ID, Name, Category, Quantity, Expiry Epoch, Status, Location)  |
|   - recipients (ID, Name, Categories, Required Qty, Current Demand, Priority) |
|   - graph_edges (Source, Destination, Distance km, Bidirectional)             |
|   - allocations (ID, Donation ID, Recipient ID, Qty, Distance, Route Path)    |
+-------------------------------------------------------------------------------+
```

---

## 2. Component Design

### 2.1 C++ Data Structures & Algorithm Layer
1. **Hash Tables (`std::unordered_map<std::string, Donation>` / `Recipient`)**:
   - Manages entities by unique alphanumeric ID (e.g. `D001`, `R001`).
   - Ensures average-case $O(1)$ constant time lookup, insertion, and update.
   - Handles memory-speed caching synchronized with SQLite persistence.

2. **Min-Heap (`ExpiryMinHeap`)**:
   - Implemented as a binary min-heap over a contiguous vector (`std::vector<Donation>`).
   - Primary ordering rule: earliest UNIX expiry epoch (`expiry_epoch`).
   - Tie-breaking rule: unique alphanumeric ID for strict mathematical determinism.
   - Automatically skips stale items upon extraction (lazy invalidation).

3. **Weighted Graph & Dijkstra's Algorithm (`GraphEngine`)**:
   - Represents Mumbai transit nodes via adjacency lists `std::vector<std::vector<Edge>>`.
   - Calculates the minimum total distance between food donors and recipient shelters.
   - Employs a min-priority queue over pairs `(dist, u)` in $O((V + E) \log V)$ time.
   - Traces every relaxation step for real-time educational visualization.

4. **Candidate Matching Engine (`MatchingEngine`)**:
   - Implements an **Expiry-First Greedy Allocation Policy**:
     1. Pop earliest expiring donation from Min-Heap.
     2. Filter compatible active recipients ($R.\text{demand} > 0$ and $R.\text{category}$ match).
     3. Compute shortest path via Dijkstra; reject unreachable candidates.
     4. Rank feasible candidates: Recipient Priority (`HIGH` > `MEDIUM` > `LOW`) $\rightarrow$ Shortest Road Distance $\rightarrow$ Demand fit.
     5. Allocate $\min(\text{available\_quantity}, \text{current\_demand})$.
     6. Generate human-readable decision explanations.

### 2.2 Persistence Layer
- SQLite3 amalgamation embedded directly into the C++ executable.
- Uses strict database constraints (`quantity >= 0`, foreign keys).
- Transactions (`BEGIN TRANSACTION;` ... `COMMIT;`) guarantee all allocations, quantity decrements, and demand fulfillments succeed or rollback atomically.

### 2.3 User Interface Layer
- React 18 with TypeScript and Vite.
- Tailwind CSS with a clean sustainability palette: warm off-whites, forest greens (`#166534`), and deep teals (`#0f766e`).
- Recharts for visual analytics (Donation status, food categories, expiry urgency distribution, recipient demand fulfillment).
- Native interactive SVG rendering of the weighted road network graph with real-time highlighted routes.
