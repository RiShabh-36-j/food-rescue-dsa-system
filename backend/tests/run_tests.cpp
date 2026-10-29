#include <iostream>
#include <cassert>
#include <string>
#include <vector>
#include <memory>
#include <cmath>
#include <iomanip>
#include "database/Database.hpp"
#include "services/FoodRescueService.hpp"
#include "algorithms/ExpiryMinHeap.hpp"
#include "algorithms/Dijkstra.hpp"
#include "algorithms/MatchingEngine.hpp"

using namespace FoodRescue;

struct TestReport {
    std::string test_name;
    std::string input;
    std::string expected;
    std::string actual;
    bool passed;
};

std::vector<TestReport> g_reports;

void record_result(const std::string& name, const std::string& input, const std::string& expected, const std::string& actual, bool passed) {
    g_reports.push_back({name, input, expected, actual, passed});
    std::cout << (passed ? "[PASS] " : "[FAIL] ") << name << "\n";
    std::cout << "       Input:    " << input << "\n";
    std::cout << "       Expected: " << expected << "\n";
    std::cout << "       Actual:   " << actual << "\n\n";
}

int main() {
    std::cout << "========================================================\n";
    std::cout << "FOOD RESCUE — AUTOMATED TEST SUITE (18 SCENARIOS)\n";
    std::cout << "Shah & Anchor Kutchhi Engineering College (SAKEC)\n";
    std::cout << "========================================================\n\n";

    // Use a test-specific in-memory / temporary database
    std::string test_db_path = "test_food_rescue.db";
    std::remove(test_db_path.c_str());

    auto db = std::make_shared<Database>(test_db_path);
    auto service = std::make_shared<FoodRescueService>(db);

    int64_t base_epoch = 1700000000; // Fixed baseline epoch for repeatable tests

    // ----------------------------------------------------
    // Scenario 1: Register and retrieve a donation by ID
    // ----------------------------------------------------
    {
        Donation d1{
            "T001", "Test Apples", "Fresh Produce", "Perishable",
            10.0, 10.0, "kg", "Test Donor", "Chembur East",
            "2026-10-30T12:00:00Z", base_epoch + 3600, "2026-10-27T10:00:00Z",
            "Cool storage", "AVAILABLE", "Fresh apples"
        };
        bool inserted = db->insert_donation(d1);
        Donation retrieved;
        bool found = db->get_donation_by_id("T001", retrieved);

        bool pass = inserted && found && (retrieved.food_name == "Test Apples") && (retrieved.quantity == 10.0);
        record_result(
            "1. Register and retrieve donation by ID",
            "Donation T001 ('Test Apples', 10 kg)",
            "inserted=true, found=true, food_name='Test Apples'",
            "inserted=" + std::to_string(inserted) + ", found=" + std::to_string(found) + ", food_name='" + retrieved.food_name + "'",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 2: Reject a duplicate donation ID
    // ----------------------------------------------------
    {
        Donation dup{
            "T001", "Duplicate Apple", "Fresh Produce", "Perishable",
            5.0, 5.0, "kg", "Other Donor", "Kurla",
            "2026-10-30T12:00:00Z", base_epoch + 7200, "2026-10-27T10:00:00Z",
            "", "AVAILABLE", ""
        };
        bool threw = false;
        std::string err_msg;
        try {
            db->insert_donation(dup);
        } catch (const std::exception& e) {
            threw = true;
            err_msg = e.what();
        }

        bool pass = threw;
        record_result(
            "2. Reject duplicate donation ID",
            "Donation with existing ID 'T001'",
            "Exception thrown, duplicate rejected",
            threw ? ("Rejected with error: " + err_msg) : "Accepted duplicate without error",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 3: Reject an invalid or negative quantity
    // ----------------------------------------------------
    {
        Donation neg{
            "T002", "Negative Milk", "Dairy", "Perishable",
            -15.0, -15.0, "liters", "Dairy Mart", "Dadar",
            "2026-10-30T12:00:00Z", base_epoch + 3600, "2026-10-27T10:00:00Z",
            "", "AVAILABLE", ""
        };
        bool threw = false;
        std::string err_msg;
        try {
            db->insert_donation(neg);
        } catch (const std::exception& e) {
            threw = true;
            err_msg = e.what();
        }

        bool pass = threw;
        record_result(
            "3. Reject invalid or negative quantity",
            "Donation T002 with quantity = -15.0",
            "Exception thrown, rejected negative quantity",
            threw ? ("Rejected: " + err_msg) : "Accepted negative quantity",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 4: Correctly prioritize earliest valid expiry (Min-Heap)
    // ----------------------------------------------------
    {
        ExpiryMinHeap heap;
        Donation d_late{"D_LATE", "Late Bread", "Bakery", "Perishable", 10.0, 10.0, "kg", "A", "Chembur East", "2026-10-30T18:00:00Z", base_epoch + 10000, "", "", "AVAILABLE", ""};
        Donation d_early{"D_EARLY", "Early Bread", "Bakery", "Perishable", 10.0, 10.0, "kg", "A", "Chembur East", "2026-10-30T14:00:00Z", base_epoch + 2000, "", "", "AVAILABLE", ""};
        Donation d_mid{"D_MID", "Mid Bread", "Bakery", "Perishable", 10.0, 10.0, "kg", "A", "Chembur East", "2026-10-30T16:00:00Z", base_epoch + 5000, "", "", "AVAILABLE", ""};

        heap.push(d_late);
        heap.push(d_early);
        heap.push(d_mid);

        Donation first_out = heap.pop();
        bool pass = (first_out.id == "D_EARLY") && (first_out.expiry_epoch == base_epoch + 2000);
        record_result(
            "4. Correctly prioritize earliest valid expiry",
            "Heap pushed [10000s, 2000s, 5000s]",
            "First popped ID: 'D_EARLY' (2000s)",
            "First popped ID: '" + first_out.id + "' (" + std::to_string(first_out.expiry_epoch) + "s)",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 5: Ignore expired donations during new matching
    // ----------------------------------------------------
    {
        GraphEngine g;
        g.add_edge("Chembur East", "Kurla", 5.0);

        Donation exp_don{
            "EXP01", "Old Salad", "Cooked Meals", "Perishable",
            20.0, 20.0, "kg", "Cafe", "Chembur East",
            "2026-10-25T10:00:00Z", base_epoch - 500, "", "", "EXPIRED", ""
        };
        Recipient rec{
            "REC01", "Kurla NGO", "Person", "123", "Kurla",
            {"Cooked Meals"}, 20.0, 20.0, "HIGH", 50, "ACTIVE", ""
        };

        auto matches = MatchingEngine::compute_matches({exp_don}, {rec}, g, base_epoch);
        bool pass = matches.empty();
        record_result(
            "5. Ignore expired donations during new matching",
            "Donation expiry_epoch = base_epoch - 500 (already expired)",
            "Matches count = 0 (ignored expired donation)",
            "Matches count = " + std::to_string(matches.size()),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 6: Reject incompatible food categories
    // ----------------------------------------------------
    {
        GraphEngine g;
        g.add_edge("Chembur East", "Kurla", 5.0);

        Donation meat_don{
            "CAT01", "Packaged Tuna", "Packaged Goods", "Perishable",
            10.0, 10.0, "boxes", "Store", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 5000, "", "", "AVAILABLE", ""
        };
        Recipient rec_veg{
            "REC02", "Veg Shelter", "Person", "123", "Kurla",
            {"Cooked Meals", "Bakery"}, 20.0, 20.0, "HIGH", 50, "ACTIVE", ""
        };

        auto matches = MatchingEngine::compute_matches({meat_don}, {rec_veg}, g, base_epoch);
        bool pass = (matches.size() == 1 && matches[0].match_status == "NO_ELIGIBLE_RECIPIENT");
        record_result(
            "6. Reject incompatible food categories",
            "Donation Category: 'Packaged Goods' vs Recipient Accepts: ['Cooked Meals', 'Bakery']",
            "Match status = 'NO_ELIGIBLE_RECIPIENT'",
            matches.empty() ? "None" : matches[0].match_status,
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 7: Handle insufficient quantities safely
    // ----------------------------------------------------
    {
        GraphEngine g;
        g.add_edge("Chembur East", "Kurla", 4.0);

        Donation small_don{
            "SML01", "Small Rice", "Cooked Meals", "Perishable",
            10.0, 10.0, "kg", "Catering", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 4000, "", "", "AVAILABLE", ""
        };
        Recipient big_rec{
            "REC03", "Large Shelter", "Person", "123", "Kurla",
            {"Cooked Meals"}, 50.0, 50.0, "HIGH", 100, "ACTIVE", ""
        };

        auto matches = MatchingEngine::compute_matches({small_don}, {big_rec}, g, base_epoch);
        bool pass = (!matches.empty() && matches[0].allocated_quantity == 10.0 && matches[0].remaining_recipient_demand == 40.0);
        record_result(
            "7. Handle insufficient quantities safely",
            "Donation qty = 10.0 kg, Recipient demand = 50.0 kg",
            "Allocated = 10.0 kg, remaining demand = 40.0 kg",
            matches.empty() ? "No match" : ("Allocated = " + std::to_string(matches[0].allocated_quantity) + ", remaining demand = " + std::to_string(matches[0].remaining_recipient_demand)),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 8: Support partial allocation when allowed by policy
    // ----------------------------------------------------
    {
        GraphEngine g;
        g.add_edge("Chembur East", "Kurla", 4.0);

        Donation large_don{
            "LRG01", "Large Batch Dal", "Cooked Meals", "Perishable",
            30.0, 30.0, "kg", "Catering", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 4000, "", "", "AVAILABLE", ""
        };
        Recipient small_rec{
            "REC04", "Small Daycare", "Person", "123", "Kurla",
            {"Cooked Meals"}, 12.0, 12.0, "HIGH", 25, "ACTIVE", ""
        };

        auto matches = MatchingEngine::compute_matches({large_don}, {small_rec}, g, base_epoch);
        bool pass = (!matches.empty() && matches[0].allocated_quantity == 12.0 && matches[0].remaining_donation_quantity == 18.0 && matches[0].match_status == "PARTIALLY_ALLOCATED");
        record_result(
            "8. Support partial allocation",
            "Donation qty = 30.0 kg, Recipient demand = 12.0 kg",
            "Allocated = 12.0 kg, remaining donation qty = 18.0 kg, status = PARTIALLY_ALLOCATED",
            matches.empty() ? "No match" : ("Allocated = " + std::to_string(matches[0].allocated_quantity) + ", remaining = " + std::to_string(matches[0].remaining_donation_quantity) + ", status = " + matches[0].match_status),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 9: Prevent recipient demand from becoming negative
    // ----------------------------------------------------
    {
        bool threw = false;
        try {
            db->update_recipient_demand_status("REC04", -5.0, "ACTIVE");
        } catch (const std::exception& e) {
            threw = true;
        }
        bool pass = threw;
        record_result(
            "9. Prevent recipient demand from becoming negative",
            "Attempt update_recipient_demand_status with demand = -5.0",
            "Exception thrown, negative demand blocked",
            threw ? "Blocked negative demand" : "Allowed negative demand",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 10: Calculate known shortest path correctly (Dijkstra)
    // ----------------------------------------------------
    {
        // Hand-calculated triangle + detour:
        // A -> B = 3.0
        // B -> C = 2.0  (Total A->B->C = 5.0)
        // A -> D = 7.0
        // D -> C = 1.0  (Total A->D->C = 8.0)
        // A -> C direct = 9.0
        GraphEngine g;
        g.add_edge("NodeA", "NodeB", 3.0, false);
        g.add_edge("NodeB", "NodeC", 2.0, false);
        g.add_edge("NodeA", "NodeD", 7.0, false);
        g.add_edge("NodeD", "NodeC", 1.0, false);
        g.add_edge("NodeA", "NodeC", 9.0, false);

        DijkstraResult res = g.find_shortest_path("NodeA", "NodeC");
        bool pass = res.reachable && (std::abs(res.total_distance - 5.0) < 0.001) &&
                    (res.path.size() == 3 && res.path[0] == "NodeA" && res.path[1] == "NodeB" && res.path[2] == "NodeC");
        record_result(
            "10. Calculate known shortest path correctly",
            "Graph with paths [A-B-C: 5.0, A-D-C: 8.0, A-C: 9.0]",
            "Reachable = true, distance = 5.0 km, path = [NodeA, NodeB, NodeC]",
            "Reachable = " + std::to_string(res.reachable) + ", distance = " + std::to_string(res.total_distance) + " km",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 11: Handle unreachable destination
    // ----------------------------------------------------
    {
        GraphEngine g;
        g.add_edge("IslandA", "IslandB", 4.0);
        g.get_or_create_node("IsolatedIsland");

        DijkstraResult res = g.find_shortest_path("IslandA", "IsolatedIsland");
        bool pass = !res.reachable && (res.total_distance < 0.0) && res.path.empty();
        record_result(
            "11. Handle unreachable destination",
            "Query path from 'IslandA' to disconnected 'IsolatedIsland'",
            "reachable = false, total_distance = -1.0, path is empty",
            "reachable = " + std::to_string(res.reachable) + ", distance = " + std::to_string(res.total_distance),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 12: Handle equal expiry times deterministically
    // ----------------------------------------------------
    {
        ExpiryMinHeap heap;
        Donation dZ{"D_ZETA", "Zeta Food", "Bakery", "Perishable", 5.0, 5.0, "kg", "A", "Loc", "", base_epoch + 3000, "", "", "AVAILABLE", ""};
        Donation dA{"D_ALPHA", "Alpha Food", "Bakery", "Perishable", 5.0, 5.0, "kg", "A", "Loc", "", base_epoch + 3000, "", "", "AVAILABLE", ""};

        heap.push(dZ);
        heap.push(dA);

        Donation first = heap.pop();
        Donation second = heap.pop();

        // Alpha should pop before Zeta due to strict alphanumeric tie-breaker
        bool pass = (first.id == "D_ALPHA" && second.id == "D_ZETA");
        record_result(
            "12. Handle equal expiry times deterministically",
            "Two donations with identical expiry epoch (base + 3000s): 'D_ZETA' and 'D_ALPHA'",
            "Determistic tie-breaker pops 'D_ALPHA' first, then 'D_ZETA'",
            "Popped first: '" + first.id + "', second: '" + second.id + "'",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 13: Update donation status after full allocation
    // ----------------------------------------------------
    {
        Donation full_don{
            "FUL01", "Full Don Meal", "Cooked Meals", "Perishable",
            15.0, 15.0, "kg", "Donor", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 5000, "2026-10-27T10:00:00Z",
            "", "AVAILABLE", ""
        };
        db->insert_donation(full_don);
        db->update_donation_quantity_status("FUL01", 0.0, "FULLY_ALLOCATED");

        Donation res;
        db->get_donation_by_id("FUL01", res);
        bool pass = (res.quantity == 0.0 && res.status == "FULLY_ALLOCATED");
        record_result(
            "13. Update donation status after full allocation",
            "Donation FUL01 allocated 15.0/15.0 kg",
            "quantity = 0.0, status = 'FULLY_ALLOCATED'",
            "quantity = " + std::to_string(res.quantity) + ", status = '" + res.status + "'",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 14: Preserve correct status after partial allocation
    // ----------------------------------------------------
    {
        Donation part_don{
            "PRT01", "Part Don Meal", "Cooked Meals", "Perishable",
            20.0, 20.0, "kg", "Donor", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 5000, "2026-10-27T10:00:00Z",
            "", "AVAILABLE", ""
        };
        db->insert_donation(part_don);
        db->update_donation_quantity_status("PRT01", 8.0, "PARTIALLY_ALLOCATED");

        Donation res;
        db->get_donation_by_id("PRT01", res);
        bool pass = (res.quantity == 8.0 && res.status == "PARTIALLY_ALLOCATED");
        record_result(
            "14. Preserve correct status after partial allocation",
            "Donation PRT01 allocated 12.0 kg from 20.0 kg",
            "quantity = 8.0, status = 'PARTIALLY_ALLOCATED'",
            "quantity = " + std::to_string(res.quantity) + ", status = '" + res.status + "'",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 15: Ensure database rollback on allocation failure
    // ----------------------------------------------------
    {
        double init_qty = 50.0;
        Donation r_don{
            "ROL01", "Rollback Bread", "Bakery", "Perishable",
            init_qty, init_qty, "boxes", "Bakery", "Chembur East",
            "2026-10-30T10:00:00Z", base_epoch + 5000, "2026-10-27T10:00:00Z",
            "", "AVAILABLE", ""
        };
        db->insert_donation(r_don);

        // Simulate failed transaction:
        db->begin_transaction();
        db->update_donation_quantity_status("ROL01", 10.0, "PARTIALLY_ALLOCATED");
        // Force an intentional rollback
        db->rollback();

        Donation rolled;
        db->get_donation_by_id("ROL01", rolled);
        bool pass = (rolled.quantity == init_qty && rolled.status == "AVAILABLE");
        record_result(
            "15. Ensure database rollback on allocation failure",
            "Modify ROL01 inside transaction then invoke db->rollback()",
            "Record restored to initial quantity = 50.0, status = 'AVAILABLE'",
            "Quantity = " + std::to_string(rolled.quantity) + ", status = '" + rolled.status + "'",
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 16: Verify matching preview does not modify persistent records
    // ----------------------------------------------------
    {
        service->seed_demo_data();
        service->sync_from_database();

        Donation d_before;
        service->get_donation_by_id("D001", d_before);
        double qty_before = d_before.quantity;

        // Run preview
        auto previews = service->preview_matching();

        Donation d_after;
        service->get_donation_by_id("D001", d_after);
        double qty_after = d_after.quantity;

        bool pass = (qty_before == qty_after && !previews.empty());
        record_result(
            "16. Matching preview does not modify persistent records",
            "Run preview_matching() without confirmation",
            "Persistent donation quantity unchanged (qty_before == qty_after)",
            "qty_before = " + std::to_string(qty_before) + ", qty_after = " + std::to_string(qty_after),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 17: Confirming allocation updates all related records
    // ----------------------------------------------------
    {
        size_t alc_before = service->get_allocations().size();
        auto result = service->confirm_matching({"D001"});
        size_t alc_after = service->get_allocations().size();

        Donation d_updated;
        service->get_donation_by_id("D001", d_updated);

        bool pass = (alc_after > alc_before) && (d_updated.quantity < 25.0);
        record_result(
            "17. Confirming allocation updates all related records",
            "confirm_matching() for donation 'D001'",
            "Allocation count increased, donation quantity decremented in persistent DB",
            "Allocations: " + std::to_string(alc_before) + " -> " + std::to_string(alc_after) + ", D001 qty = " + std::to_string(d_updated.quantity),
            pass
        );
    }

    // ----------------------------------------------------
    // Scenario 18: Ensure application handles empty datasets
    // ----------------------------------------------------
    {
        db->reset_all_data();
        service->sync_from_database();

        auto dons = service->get_donations();
        auto recs = service->get_recipients();
        auto previews = service->preview_matching();
        auto stats = service->get_dashboard_stats();

        bool pass = (dons.empty() && recs.empty() && previews.empty() && stats["total_donations"] == 0);
        record_result(
            "18. Application handles empty datasets gracefully",
            "All tables empty (0 records)",
            "Endpoints return empty lists and zero stats without crash or exception",
            "dons=" + std::to_string(dons.size()) + ", recs=" + std::to_string(recs.size()) + ", previews=" + std::to_string(previews.size()),
            pass
        );
    }

    // Clean up test DB
    db.reset();
    std::remove(test_db_path.c_str());

    // Summary
    int passed_count = 0;
    for (const auto& r : g_reports) {
        if (r.passed) passed_count++;
    }

    std::cout << "========================================================\n";
    std::cout << "TEST SUITE COMPLETED: " << passed_count << "/" << g_reports.size() << " PASSED\n";
    std::cout << "========================================================\n";

    return (passed_count == static_cast<int>(g_reports.size())) ? 0 : 1;
}
