# Data Structures & Algorithms Documentation

**Shah & Anchor Kutchhi Engineering College (SAKEC), Chembur, Mumbai**  
**Department of Artificial Intelligence and Data Science**  
**Course: Data Structures and Algorithms (Second Year AIDS)**

---

## 1. Hash Table Management (`std::unordered_map`)

### 1.1 Purpose
Fast entity storage, duplicate ID prevention, and instant $O(1)$ retrieval for donations and recipient organizations.

### 1.2 Mathematical Foundations & Time Complexity
- **Hash Function**: MurmurHash / CityHash variant provided by `std::hash<std::string>`.
- **Buckets**: $B$ buckets with linked collision chains.
- **Load Factor**: $\alpha = \frac{N}{B}$. When $\alpha > \text{max\_load\_factor}$ (default 1.0), the table rehashes into $2B$ buckets.
- **Operations & Complexities**:
  - Insert: Average $O(1)$, Worst Case $O(N)$ (pathological hash collision).
  - Search: Average $O(1)$, Worst Case $O(N)$.
  - Update: Average $O(1)$, Worst Case $O(N)$.
  - Delete: Average $O(1)$, Worst Case $O(N)$.

---

## 2. Expiry-Aware Min-Heap Priority Queue (`ExpiryMinHeap`)

### 2.1 Purpose
Perishable food undergoes rapid microbial degradation. Donations approaching their critical expiration time must be identified and matched before fresher food.

### 2.2 Heap Ordering Rule & Determinism
Each node $i$ satisfies:
$$\text{Parent}(i) = \lfloor (i - 1) / 2 \rfloor \le \text{Child}(i)$$

```cpp
struct ExpiryComparator {
    bool operator()(const Donation& a, const Donation& b) const {
        if (a.expiry_epoch != b.expiry_epoch) {
            return a.expiry_epoch > b.expiry_epoch; // Min-heap: smaller epoch has priority
        }
        return a.id > b.id; // Deterministic tie-breaker
    }
};
```

1. **Primary Key**: `expiry_epoch` (earliest UNIX epoch in seconds).
2. **Deterministic Tie-Breaker**: Alphanumeric `id` comparison (e.g. `D001` pops before `D002` if timestamps are identical).

### 2.3 Lazy Invalidation
When donation quantities are partially allocated or donations are marked unavailable through manual edits, rebuilding the entire heap is $O(N)$. Alternatively, when extracting the head node:
```cpp
if (current.status != "AVAILABLE" || current.quantity <= 0 || current.expiry_epoch <= now) {
    continue; // Lazily skip invalidated node
}
```

### 2.4 Heap Complexities
- Insertion (`push` / `heapify_up`): $O(\log N)$
- Head Extraction (`pop` / `heapify_down`): $O(\log N)$
- Peek Head (`top`): $O(1)$
- Heap Construction from Array (`rebuild`): $O(N)$
- Space Complexity: $O(N)$ in contiguous memory.

---

## 3. Weighted Graph & Dijkstra's Shortest Path Algorithm

### 3.1 Graph Representation
Transportation roads are represented as a weighted graph $G = (V, E, W)$:
- Vertices $V$: Urban transport locations (SAKEC Campus, Chembur East, Kurla, Ghatkopar, Sion, Dadar, Bandra, Andheri, Vashi, Thane, Isolated Outlet).
- Edges $E$: Direct transit road connections between locations.
- Weights $W(u, v)$: Non-negative road distance in kilometers.
- Stored as an **Adjacency List** `std::vector<std::vector<Edge>>` where `Edge { int to_idx; std::string to_name; double distance_km; }`.

### 3.2 Dijkstra's Algorithm Implementation
Uses a binary min-priority queue storing pairs of `(distance, vertex_index)`:
1. Initialize $\text{dist}[\text{src}] = 0$ and $\text{dist}[v] = \infty$ for all $v \neq \text{src}$.
2. Insert $(0, \text{src})$ into priority queue.
3. While queue is not empty:
   - Pop minimum distance vertex $u$.
   - If visited, continue. Mark $u$ as visited.
   - If $u = \text{target}$, terminate early.
   - For each outgoing edge $(u, v)$ with weight $w$:
     $$\text{If } \text{dist}[u] + w < \text{dist}[v] \implies \text{dist}[v] = \text{dist}[u] + w, \quad \text{parent}[v] = u$$
     Push $(\text{dist}[v], v)$ into priority queue.
4. If $\text{dist}[\text{dest}] = \infty$, target is unreachable; return `reachable = false`.

### 3.3 Complexity Analysis
- Using Binary Min-Heap Priority Queue:
  - Space: $O(V + E)$
  - Time: $O((V + E) \log V)$
  - Vertex extractions: $V$ extractions $\times O(\log V) = O(V \log V)$
  - Edge relaxations: at most $E$ pushes $\times O(\log V) = O(E \log V)$
  - Total time: $O((V + E) \log V)$

---

## 4. Candidate Matching Engine & Allocation Policy

### 4.1 Policy Definition
The system follows an **Expiry-First Greedy Allocation Policy**:
1. Identify the most urgent surplus food using `ExpiryMinHeap::pop()`.
2. Candidate filtering:
   - Status must be `ACTIVE` and `current_demand > 0`.
   - `accepted_categories` must include `donation.category`.
   - Run Dijkstra from `donation.donor_location` to `recipient.location`. Distance must be finite.
3. Multi-Criteria Candidate Ranking:
   - **Criterion 1 (Urgency of Need)**: Recipient priority level (`HIGH` = 3, `MEDIUM` = 2, `LOW` = 1).
   - **Criterion 2 (Preservation Distance)**: Route distance in km. Shorter routes minimize spoilage during transit.
   - **Criterion 3 (Quantity Fit)**: Difference $|\text{demand} - \text{quantity}|$.
   - **Criterion 4 (Tie-breaker)**: Recipient unique ID.
4. Quantity allocation:
   $$\text{alloc\_qty} = \min(\text{donation.quantity}, \text{recipient.current\_demand})$$
5. Update state atomically inside a SQLite transaction.

---

## 5. Summary Complexity Matrix

| Data Structure / Operation | Best Case | Average Case | Worst Case | Space Complexity |
|:---|:---:|:---:|:---:|:---:|
| **Hash Table Lookup** (`std::unordered_map`) | $O(1)$ | $O(1)$ | $O(N)$ | $O(N)$ |
| **Hash Table Insert / Update** | $O(1)$ | $O(1)$ | $O(N)$ | $O(N)$ |
| **Min-Heap Push** (`heapify_up`) | $O(1)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ |
| **Min-Heap Pop** (`heapify_down`) | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ |
| **Dijkstra Shortest Path** | $O(1)$ | $O((V + E) \log V)$ | $O((V + E) \log V)$ | $O(V + E)$ |
| **Candidate Sorting** (`std::sort`) | $O(K \log K)$ | $O(K \log K)$ | $O(K \log K)$ | $O(\log K)$ |
| **Overall Matching Workflow** | $O(M \cdot (V + E) \log V)$ | $O(M \cdot (V + E) \log V)$ | $O(M \cdot (V + E) \log V)$ | $O(N + R + V + E)$ |
