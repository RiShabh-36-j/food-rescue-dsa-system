# Automated Test Plan & Verification Report

**Course**: Second Year Artificial Intelligence and Data Science  
**Institution**: Shah & Anchor Kutchhi Engineering College (SAKEC), Mumbai  
**Project**: Food Rescue Expiry-Time Matching System Using Data Structures & Algorithms

---

## 1. Automated Test Suite Execution Summary

All 18 required scenarios were implemented in C++ in `backend/tests/run_tests.cpp` and compiled using GCC 16.2.0.

```
========================================================
FOOD RESCUE — AUTOMATED TEST SUITE (18 SCENARIOS)
Shah & Anchor Kutchhi Engineering College (SAKEC)
========================================================
Total Scenarios: 18
Passed: 18 (100%)
Failed: 0 (0%)
Execution Time: ~45 ms
========================================================
```

---

## 2. Individual Scenario Results

| # | Test Scenario Name | Input Condition | Expected Result | Actual Result Observed | Status |
|:---:|:---|:---|:---|:---|:---:|
| **1** | Register & retrieve donation by ID | Donation `T001` ('Test Apples', 10 kg) | `inserted=true`, `found=true`, name matches | `inserted=1`, `found=1`, name='Test Apples' | **PASS** |
| **2** | Reject duplicate donation ID | Duplicate `T001` insertion | Exception thrown, SQLite constraint violated | Rejected: Duplicate donation ID: T001 already exists | **PASS** |
| **3** | Reject invalid or negative quantity | `quantity = -15.0` | Exception thrown, negative quantity blocked | Rejected: Invalid quantity: quantity cannot be negative | **PASS** |
| **4** | Correctly prioritize earliest expiry | Min-heap with `[10000s, 2000s, 5000s]` | First popped is `D_EARLY` (2000s) | First popped: `D_EARLY` (1700002000s) | **PASS** |
| **5** | Ignore expired donations | `expiry_epoch = now - 500s` | Candidate excluded from matching | Matches count = 0 | **PASS** |
| **6** | Reject incompatible food categories | 'Packaged Goods' vs Recipient accepts only 'Cooked Meals' | Status = `NO_ELIGIBLE_RECIPIENT` | Status = `NO_ELIGIBLE_RECIPIENT` | **PASS** |
| **7** | Handle insufficient quantities safely | Donated 10 kg vs Recipient demand 50 kg | Allocates 10 kg, remaining demand = 40 kg | Allocated = 10.0, remaining demand = 40.0 | **PASS** |
| **8** | Support partial allocation | Donated 30 kg vs Recipient demand 12 kg | Allocates 12 kg, leftover donation = 18 kg | Allocated = 12.0, remaining = 18.0, PARTIALLY_ALLOCATED | **PASS** |
| **9** | Prevent recipient demand negative | Set demand = `-5.0` | Exception thrown, negative demand blocked | Exception thrown: Demand cannot become negative | **PASS** |
| **10** | Calculate known shortest path | Known triangle graph ($A \to B \to C = 5.0$) | Path found: `[NodeA, NodeB, NodeC]`, Dist: 5.0 | Reachable=1, Total Distance = 5.000000 km | **PASS** |
| **11** | Handle unreachable destination | Path from `IslandA` to disconnected node | `reachable=false`, `total_distance = -1.0` | reachable=0, total_distance = -1.000000 | **PASS** |
| **12** | Handle equal expiry deterministically | Two donations with identical timestamp | Alphanumeric tie-breaker: `D_ALPHA` before `D_ZETA` | First: `D_ALPHA`, Second: `D_ZETA` | **PASS** |
| **13** | Update status on full allocation | Full 15/15 kg allocated | `quantity = 0.0`, status = `FULLY_ALLOCATED` | quantity = 0.000000, status = 'FULLY_ALLOCATED' | **PASS** |
| **14** | Preserve status on partial allocation | 12 kg allocated from 20 kg | `quantity = 8.0`, status = `PARTIALLY_ALLOCATED` | quantity = 8.000000, status = 'PARTIALLY_ALLOCATED' | **PASS** |
| **15** | Database rollback on failure | Modify record in transaction, invoke rollback | Initial record values restored completely | Quantity = 50.0, status = 'AVAILABLE' | **PASS** |
| **16** | Matching preview does not modify DB | Run `preview_matching()` | Persistent donation quantities unchanged | `qty_before = 25.0`, `qty_after = 25.0` | **PASS** |
| **17** | Confirming updates all records | Run `confirm_matching({"D001"})` | Allocation logged, donation quantity decremented | Allocations: 1 $\to$ 2, `D001` qty = 0.0 | **PASS** |
| **18** | Handle empty datasets gracefully | Tables empty (0 records) | Clean empty JSON arrays returned, no exceptions | `dons=0`, `recs=0`, `previews=0` | **PASS** |
