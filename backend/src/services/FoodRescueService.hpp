#pragma once

#include <memory>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <chrono>
#include <sstream>
#include <iomanip>
#include "../database/Database.hpp"
#include "../models/Donation.hpp"
#include "../models/Recipient.hpp"
#include "../models/Allocation.hpp"
#include "../algorithms/ExpiryMinHeap.hpp"
#include "../algorithms/Dijkstra.hpp"
#include "../algorithms/MatchingEngine.hpp"

namespace FoodRescue {

class FoodRescueService {
private:
    std::shared_ptr<Database> db_;
    std::mutex service_mutex_;

    // Core DSA Structures kept synchronized in memory:
    // 1. Hash Tables (std::unordered_map)
    std::unordered_map<std::string, Donation> donation_hash_table_;
    std::unordered_map<std::string, Recipient> recipient_hash_table_;

    // 2. Min-Heap
    ExpiryMinHeap expiry_min_heap_;

    // 3. Weighted Graph & Dijkstra
    GraphEngine graph_engine_;

public:
    FoodRescueService(std::shared_ptr<Database> db) : db_(db) {
        sync_from_database();
    }

    int64_t get_current_epoch() const {
        auto now = std::chrono::system_clock::now();
        return std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();
    }

    std::string get_current_iso_time() const {
        auto now = std::chrono::system_clock::now();
        std::time_t t = std::chrono::system_clock::to_time_t(now);
        std::tm tm_buf;
#if defined(_WIN32) || defined(_WIN64)
        gmtime_s(&tm_buf, &t);
#else
        gmtime_r(&t, &tm_buf);
#endif
        std::ostringstream ss;
        ss << std::put_time(&tm_buf, "%Y-%m-%dT%H:%M:%SZ");
        return ss.str();
    }

    void sync_from_database() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        donation_hash_table_.clear();
        recipient_hash_table_.clear();
        expiry_min_heap_.clear();
        graph_engine_.clear();

        int64_t now_epoch = get_current_epoch();

        // 1. Load donations into Hash Table
        auto donations = db_->get_all_donations();
        for (const auto& d : donations) {
            donation_hash_table_[d.id] = d;
        }

        // 2. Build Expiry Min-Heap
        expiry_min_heap_.rebuild(donations, now_epoch);

        // 3. Load recipients into Hash Table
        auto recipients = db_->get_all_recipients();
        for (const auto& r : recipients) {
            recipient_hash_table_[r.id] = r;
        }

        // 4. Setup Graph locations and coordinates
        setup_graph_nodes();

        // Load edges
        auto edges = db_->get_all_graph_edges();
        for (const auto& e : edges) {
            graph_engine_.add_edge(e.source, e.destination, e.distance_km, e.bidirectional);
        }
    }

    void setup_graph_nodes() {
        // Defined coordinates for Mumbai / Chembur / SAKEC demonstration graph
        graph_engine_.get_or_create_node("SAKEC Campus", 280, 220);
        graph_engine_.get_or_create_node("Chembur East", 340, 250);
        graph_engine_.get_or_create_node("Ghatkopar", 280, 120);
        graph_engine_.get_or_create_node("Kurla", 200, 220);
        graph_engine_.get_or_create_node("Sion", 170, 310);
        graph_engine_.get_or_create_node("Dadar", 120, 390);
        graph_engine_.get_or_create_node("Bandra", 90, 260);
        graph_engine_.get_or_create_node("Andheri", 100, 100);
        graph_engine_.get_or_create_node("Vashi", 450, 300);
        graph_engine_.get_or_create_node("Thane", 400, 70);
        graph_engine_.get_or_create_node("Isolated Outlet", 550, 100); // Disconnected node for Dijkstra test
    }

    void seed_demo_data() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        db_->reset_all_data();

        int64_t now_epoch = get_current_epoch();

        // 1. Seed Road Network Graph Connections (Mumbai / Chembur / SAKEC Area)
        std::vector<std::tuple<std::string, std::string, double>> initial_edges = {
            {"SAKEC Campus", "Chembur East", 2.1},
            {"SAKEC Campus", "Kurla", 4.2},
            {"SAKEC Campus", "Ghatkopar", 3.8},
            {"Chembur East", "Vashi", 11.5},
            {"Chembur East", "Sion", 5.0},
            {"Kurla", "Sion", 3.2},
            {"Kurla", "Bandra", 6.8},
            {"Kurla", "Ghatkopar", 4.5},
            {"Sion", "Dadar", 4.1},
            {"Bandra", "Dadar", 5.2},
            {"Bandra", "Andheri", 8.4},
            {"Ghatkopar", "Thane", 12.0},
            {"Ghatkopar", "Andheri", 10.2},
            {"Thane", "Vashi", 18.0}
            // "Isolated Outlet" is intentionally disconnected to demonstrate unreachable candidate handling
        };

        for (const auto& [u, v, dist] : initial_edges) {
            db_->insert_graph_edge(u, v, dist, true);
        }

        // 2. Seed Synthetic Food Donations with diverse expiry times & categories
        auto make_expiry = [now_epoch](double hours_from_now) -> std::pair<std::string, int64_t> {
            int64_t exp_sec = now_epoch + static_cast<int64_t>(hours_from_now * 3600);
            std::time_t t = static_cast<std::time_t>(exp_sec);
            std::tm tm_buf;
#if defined(_WIN32) || defined(_WIN64)
            gmtime_s(&tm_buf, &t);
#else
            gmtime_r(&t, &tm_buf);
#endif
            std::ostringstream ss;
            ss << std::put_time(&tm_buf, "%Y-%m-%dT%H:%M:%SZ");
            return {ss.str(), exp_sec};
        };

        std::string now_str = get_current_iso_time();

        std::vector<Donation> demo_donations = {
            {
                "D001", "Fresh Biryani & Curry Portions", "Cooked Meals", "Perishable",
                25.0, 25.0, "kg", "SAKEC Campus Canteen", "SAKEC Campus",
                make_expiry(2.5).first, make_expiry(2.5).second, now_str,
                "Keep warm above 65°C. Consume within 3 hours.", "AVAILABLE",
                "Surplus afternoon lunch meals prepared for college event."
            },
            {
                "D002", "Artisan Whole Wheat Bread & Buns", "Bakery", "Perishable",
                15.0, 15.0, "boxes", "Chembur Baker's Treat", "Chembur East",
                make_expiry(6.0).first, make_expiry(6.0).second, now_str,
                "Store in dry ambient room temperature.", "AVAILABLE",
                "Freshly baked morning surplus bread packets."
            },
            {
                "D003", "Pasteurized Full Cream Milk", "Dairy", "Highly Perishable",
                30.0, 30.0, "liters", "Dadar Dairy Hub", "Dadar",
                make_expiry(3.5).first, make_expiry(3.5).second, now_str,
                "Maintain refrigeration under 4°C.", "AVAILABLE",
                "Unsold packaged morning milk crates."
            },
            {
                "D004", "Organic Apples & Seasonal Bananas", "Fresh Produce", "Semi-Perishable",
                40.0, 40.0, "kg", "Ghatkopar Fruit Market", "Ghatkopar",
                make_expiry(36.0).first, make_expiry(36.0).second, now_str,
                "Cool dry place, well-ventilated crates.", "AVAILABLE",
                "Ripened table fruits ready for immediate consumption."
            },
            {
                "D005", "Cooked Dal & Steamed Basmati Rice", "Cooked Meals", "Perishable",
                50.0, 50.0, "kg", "Kurla Banquet Hall", "Kurla",
                make_expiry(1.8).first, make_expiry(1.8).second, now_str,
                "Insulated food transport containers.", "AVAILABLE",
                "High urgency surplus dinner catering from family function."
            },
            {
                "D006", "Assorted Sandwiches & Wraps", "Cooked Meals", "Perishable",
                18.0, 18.0, "kg", "Bandra Corporate Cafe", "Bandra",
                make_expiry(4.5).first, make_expiry(4.5).second, now_str,
                "Chilled display packs, handle with care.", "AVAILABLE",
                "Conference break snack packs in sealed packaging."
            },
            {
                "D007", "Canned Baked Beans & Tomato Puree", "Packaged Goods", "Semi-Perishable",
                60.0, 60.0, "packets", "Vashi Supermarket Hub", "Vashi",
                make_expiry(120.0).first, make_expiry(120.0).second, now_str,
                "Ambient dry storage, long shelf life.", "AVAILABLE",
                "Surplus stock approaching 3-month clearance threshold."
            },
            {
                "D008", "Fresh Spinach & Mixed Veggies", "Fresh Produce", "Perishable",
                22.0, 22.0, "kg", "Sion Wholesale Mandi", "Sion",
                make_expiry(14.0).first, make_expiry(14.0).second, now_str,
                "Keep covered with damp cloth or refrigerated.", "AVAILABLE",
                "Farm fresh greens surplus from morning market delivery."
            },
            {
                "D009", "Fresh Mango Lassi & Flavored Milk", "Beverages", "Perishable",
                20.0, 20.0, "liters", "Thane Refreshment Bar", "Thane",
                make_expiry(8.0).first, make_expiry(8.0).second, now_str,
                "Cold chain required at 2-6°C.", "AVAILABLE",
                "Bottled dairy beverage surplus."
            },
            {
                "D010", "Prepared Khichdi & Buttermilk", "Cooked Meals", "Perishable",
                35.0, 35.0, "kg", "Isolated Highway Dhaba", "Isolated Outlet",
                make_expiry(5.0).first, make_expiry(5.0).second, now_str,
                "Cooked hot meals.", "AVAILABLE",
                "Demonstration donation located at disconnected node (demonstrates unreachable route handling)."
            },
            {
                "D011", "Sweet Pastries & Cream Cakes", "Bakery", "Perishable",
                12.0, 12.0, "boxes", "Dadar Heritage Confectionery", "Dadar",
                make_expiry(-2.0).first, make_expiry(-2.0).second, now_str,
                "Refrigerated.", "EXPIRED",
                "Expired 2 hours ago. Included to test algorithm exclusion of expired food."
            },
            {
                "D012", "Catering Tray Veg Pulao", "Cooked Meals", "Perishable",
                0.0, 25.0, "kg", "Sion Community Hall", "Sion",
                make_expiry(3.0).first, make_expiry(3.0).second, now_str,
                "Thermal insulated.", "FULLY_ALLOCATED",
                "Already fully allocated in prior cycle."
            }
        };

        for (const auto& d : demo_donations) {
            db_->insert_donation(d);
        }

        // 3. Seed Recipient Organizations (NGOs, Shelters, Student Pantries)
        std::vector<Recipient> demo_recipients = {
            {
                "R001", "Robin Hood Army Chembur Chapter", "Sunil Sharma",
                "+91 98201 11223", "Chembur East",
                {"Cooked Meals", "Bakery", "Dairy"},
                35.0, 35.0, "HIGH", 120, "ACTIVE", now_str
            },
            {
                "R002", "SAKEC Student Welfare Food Pantry", "Prof. R. Mehta",
                "+91 98190 44556", "SAKEC Campus",
                {"Cooked Meals", "Bakery", "Packaged Goods", "Beverages"},
                20.0, 20.0, "HIGH", 85, "ACTIVE", now_str
            },
            {
                "R003", "Snehasadan Children Home Kurla", "Father Thomas",
                "+91 98212 77889", "Kurla",
                {"Cooked Meals", "Dairy", "Fresh Produce", "Bakery"},
                45.0, 45.0, "MEDIUM", 95, "ACTIVE", now_str
            },
            {
                "R004", "Roti Bank Foundation Dadar", "Vikas Patel",
                "+91 98334 55667", "Dadar",
                {"Cooked Meals", "Packaged Goods"},
                60.0, 60.0, "HIGH", 250, "ACTIVE", now_str
            },
            {
                "R005", "Salaam Baalak Trust Bandra Shelter", "Pooja Deshmukh",
                "+91 98670 99001", "Bandra",
                {"Cooked Meals", "Bakery", "Fresh Produce"},
                25.0, 25.0, "MEDIUM", 70, "ACTIVE", now_str
            },
            {
                "R006", "Ghatkopar Community Food Kitchen", "Anand Kothari",
                "+91 98700 33445", "Ghatkopar",
                {"Fresh Produce", "Packaged Goods", "Dairy"},
                40.0, 40.0, "LOW", 110, "ACTIVE", now_str
            },
            {
                "R007", "Vashi Night Shelter Care", "Amitabh Roy",
                "+91 98205 66778", "Vashi",
                {"Cooked Meals", "Packaged Goods"},
                50.0, 50.0, "MEDIUM", 80, "ACTIVE", now_str
            }
        };

        for (const auto& r : demo_recipients) {
            db_->insert_recipient(r);
        }

        // 4. Seed an initial historical allocation for audit history & analytics
        Allocation sample_alc{
            "ALC000", "D012", "R004", "Catering Tray Veg Pulao",
            "Sion Community Hall", "Roti Bank Foundation Dadar",
            25.0, "kg", 4.1, "Sion -> Dadar",
            "Allocated 25.0 kg surplus hot meal to Roti Bank Dadar via shortest road connection (4.1 km).",
            "COMPLETED", now_str
        };
        db_->insert_allocation(sample_alc);
    }

    // ==========================================
    // DONATIONS API
    // ==========================================
    std::vector<Donation> get_donations() {
        return db_->get_all_donations();
    }

    bool get_donation_by_id(const std::string& id, Donation& out_d) {
        std::lock_guard<std::mutex> lock(service_mutex_);
        auto it = donation_hash_table_.find(id);
        if (it != donation_hash_table_.end()) {
            out_d = it->second;
            return true;
        }
        return db_->get_donation_by_id(id, out_d);
    }

    bool add_donation(Donation d) {
        if (d.quantity < 0) {
            throw std::runtime_error("Donation quantity cannot be negative.");
        }
        if (d.created_at.empty()) {
            d.created_at = get_current_iso_time();
        }
        if (d.status.empty()) {
            d.status = "AVAILABLE";
        }
        d.original_quantity = d.quantity;

        // Persist in DB
        bool ok = db_->insert_donation(d);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            donation_hash_table_[d.id] = d;
            int64_t now_epoch = get_current_epoch();
            if (d.status == "AVAILABLE" && d.expiry_epoch > now_epoch) {
                expiry_min_heap_.push(d);
            }
        }
        return ok;
    }

    bool update_donation(const Donation& d) {
        if (d.quantity < 0) {
            throw std::runtime_error("Quantity cannot be negative.");
        }
        bool ok = db_->update_donation(d);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            donation_hash_table_[d.id] = d;
            // Rebuild heap to maintain strict ordering after quantity or expiry modification
            auto all = db_->get_all_donations();
            expiry_min_heap_.rebuild(all, get_current_epoch());
        }
        return ok;
    }

    bool delete_donation(const std::string& id) {
        bool ok = db_->delete_donation(id);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            donation_hash_table_.erase(id);
            auto all = db_->get_all_donations();
            expiry_min_heap_.rebuild(all, get_current_epoch());
        }
        return ok;
    }

    // ==========================================
    // RECIPIENTS API
    // ==========================================
    std::vector<Recipient> get_recipients() {
        return db_->get_all_recipients();
    }

    bool add_recipient(Recipient r) {
        if (r.required_quantity < 0 || r.current_demand < 0) {
            throw std::runtime_error("Required quantity and demand cannot be negative.");
        }
        if (r.created_at.empty()) {
            r.created_at = get_current_iso_time();
        }
        if (r.status.empty()) {
            r.status = "ACTIVE";
        }

        bool ok = db_->insert_recipient(r);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            recipient_hash_table_[r.id] = r;
        }
        return ok;
    }

    bool update_recipient(const Recipient& r) {
        bool ok = db_->update_recipient(r);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            recipient_hash_table_[r.id] = r;
        }
        return ok;
    }

    bool delete_recipient(const std::string& id) {
        bool ok = db_->delete_recipient(id);
        if (ok) {
            std::lock_guard<std::mutex> lock(service_mutex_);
            recipient_hash_table_.erase(id);
        }
        return ok;
    }

    // ==========================================
    // ROUTE PLANNER / GRAPH API
    // ==========================================
    nlohmann::json get_graph_data() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        return graph_engine_.get_graph_export();
    }

    DijkstraResult calculate_route(const std::string& from_loc, const std::string& to_loc) {
        std::lock_guard<std::mutex> lock(service_mutex_);
        return graph_engine_.find_shortest_path(from_loc, to_loc);
    }

    // ==========================================
    // SMART MATCHING ENGINE
    // ==========================================
    std::vector<MatchRecommendation> preview_matching() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        auto donations = db_->get_all_donations();
        auto recipients = db_->get_all_recipients();
        int64_t now_epoch = get_current_epoch();

        return MatchingEngine::compute_matches(donations, recipients, graph_engine_, now_epoch);
    }

    nlohmann::json confirm_matching(const std::vector<std::string>& selected_donation_ids = {}) {
        std::lock_guard<std::mutex> lock(service_mutex_);
        int64_t now_epoch = get_current_epoch();
        std::string now_str = get_current_iso_time();

        // Step 1: Compute fresh matches
        auto donations = db_->get_all_donations();
        auto recipients = db_->get_all_recipients();
        auto recommendations = MatchingEngine::compute_matches(donations, recipients, graph_engine_, now_epoch);

        // Step 2: Begin SQLite transaction
        db_->begin_transaction();
        std::vector<Allocation> committed_allocations;
        int alc_counter = static_cast<int>(db_->get_all_allocations().size()) + 1;

        try {
            for (const auto& rec : recommendations) {
                if (rec.allocated_quantity <= 0.0) continue;

                // Check filter if specific IDs were provided
                if (!selected_donation_ids.empty()) {
                    bool match_id = false;
                    for (const auto& s_id : selected_donation_ids) {
                        if (s_id == rec.donation.id) { match_id = true; break; }
                    }
                    if (!match_id) continue;
                }

                // Generate allocation ID
                std::ostringstream ss_alc_id;
                ss_alc_id << "ALC" << std::setfill('0') << std::setw(3) << alc_counter++;

                Allocation alc;
                alc.id = ss_alc_id.str();
                alc.donation_id = rec.donation.id;
                alc.recipient_id = rec.recipient.id;
                alc.food_name = rec.donation.food_name;
                alc.donor_name = rec.donation.donor_name;
                alc.recipient_name = rec.recipient.name;
                alc.allocated_quantity = rec.allocated_quantity;
                alc.unit = rec.donation.unit;
                alc.route_distance_km = rec.route_distance_km;
                alc.route_path = rec.route_path_str;
                alc.explanation = rec.explanation;
                alc.status = "COMPLETED";
                alc.allocated_at = now_str;

                // 1. Insert allocation record
                db_->insert_allocation(alc);

                // 2. Update donation quantity and status
                double remaining_don_qty = rec.donation.quantity - rec.allocated_quantity;
                std::string new_don_status = (remaining_don_qty <= 0.001) ? "FULLY_ALLOCATED" : "PARTIALLY_ALLOCATED";
                db_->update_donation_quantity_status(rec.donation.id, std::max(0.0, remaining_don_qty), new_don_status);

                // 3. Update recipient demand and status
                double remaining_rec_demand = rec.recipient.current_demand - rec.allocated_quantity;
                std::string new_rec_status = (remaining_rec_demand <= 0.001) ? "FULFILLED" : "ACTIVE";
                db_->update_recipient_demand_status(rec.recipient.id, std::max(0.0, remaining_rec_demand), new_rec_status);

                committed_allocations.push_back(alc);
            }

            db_->commit();
        } catch (const std::exception& e) {
            db_->rollback();
            throw std::runtime_error(std::string("Transaction aborted and rolled back: ") + e.what());
        }

        // Resync memory state
        auto updated_donations = db_->get_all_donations();
        donation_hash_table_.clear();
        for (const auto& d : updated_donations) donation_hash_table_[d.id] = d;
        expiry_min_heap_.rebuild(updated_donations, now_epoch);

        auto updated_recipients = db_->get_all_recipients();
        recipient_hash_table_.clear();
        for (const auto& r : updated_recipients) recipient_hash_table_[r.id] = r;

        nlohmann::json res;
        res["success"] = true;
        res["committed_count"] = committed_allocations.size();
        res["allocations"] = committed_allocations;
        return res;
    }

    // ==========================================
    // ALLOCATIONS API
    // ==========================================
    std::vector<Allocation> get_allocations() {
        return db_->get_all_allocations();
    }

    std::string export_allocations_csv() {
        auto list = db_->get_all_allocations();
        std::stringstream ss;
        ss << "Allocation ID,Donation ID,Food Name,Donor Name,Recipient Name,Allocated Quantity,Unit,Route Distance (km),Route Path,Status,Allocated At\n";
        for (const auto& a : list) {
            ss << "\"" << a.id << "\","
               << "\"" << a.donation_id << "\","
               << "\"" << a.food_name << "\","
               << "\"" << a.donor_name << "\","
               << "\"" << a.recipient_name << "\","
               << a.allocated_quantity << ","
               << "\"" << a.unit << "\","
               << a.route_distance_km << ","
               << "\"" << a.route_path << "\","
               << "\"" << a.status << "\","
               << "\"" << a.allocated_at << "\"\n";
        }
        return ss.str();
    }

    // ==========================================
    // DASHBOARD & ANALYTICS STATS
    // ==========================================
    nlohmann::json get_dashboard_stats() {
        auto donations = db_->get_all_donations();
        auto recipients = db_->get_all_recipients();
        auto allocations = db_->get_all_allocations();
        int64_t now_epoch = get_current_epoch();

        double total_qty_donated = 0.0;
        double available_qty = 0.0;
        int expiring_soon_count = 0; // <= 6 hours
        int available_donations_count = 0;
        int pending_donations_count = 0;

        std::unordered_map<std::string, int> status_counts;
        std::unordered_map<std::string, double> category_quantities;
        std::unordered_map<std::string, int> urgency_counts = {
            {"CRITICAL", 0}, {"HIGH", 0}, {"MODERATE", 0}, {"LOW", 0}, {"EXPIRED", 0}
        };

        for (const auto& d : donations) {
            total_qty_donated += d.original_quantity;
            status_counts[d.status]++;

            if (d.status == "AVAILABLE" || d.status == "PARTIALLY_ALLOCATED") {
                available_donations_count++;
                available_qty += d.quantity;
                category_quantities[d.category] += d.quantity;

                std::string tier = d.get_urgency_tier(now_epoch);
                urgency_counts[tier]++;

                if (tier == "CRITICAL" || tier == "HIGH") {
                    expiring_soon_count++;
                }
            } else if (d.status == "PENDING") {
                pending_donations_count++;
            }
        }

        double total_qty_allocated = 0.0;
        for (const auto& a : allocations) {
            total_qty_allocated += a.allocated_quantity;
        }

        // Category chart data
        nlohmann::json cat_chart = nlohmann::json::array();
        for (const auto& [cat, qty] : category_quantities) {
            cat_chart.push_back({{"category", cat}, {"quantity", qty}});
        }

        // Status chart data
        nlohmann::json status_chart = nlohmann::json::array();
        for (const auto& [st, cnt] : status_counts) {
            status_chart.push_back({{"status", st}, {"count", cnt}});
        }

        // Urgency chart data
        nlohmann::json urgency_chart = nlohmann::json::array({
            {{"tier", "Critical (<= 4h)"}, {"count", urgency_counts["CRITICAL"]}},
            {{"tier", "High (4-12h)"}, {"count", urgency_counts["HIGH"]}},
            {{"tier", "Moderate (12-24h)"}, {"count", urgency_counts["MODERATE"]}},
            {{"tier", "Low (> 24h)"}, {"count", urgency_counts["LOW"]}}
        });

        // Urgent donations list (top 5 expiring soonest)
        std::vector<Donation> urgent_list;
        for (const auto& d : donations) {
            if ((d.status == "AVAILABLE" || d.status == "PARTIALLY_ALLOCATED") && d.expiry_epoch > now_epoch) {
                urgent_list.push_back(d);
            }
        }
        std::sort(urgent_list.begin(), urgent_list.end(), [](const Donation& a, const Donation& b) {
            return a.expiry_epoch < b.expiry_epoch;
        });
        if (urgent_list.size() > 5) urgent_list.resize(5);

        // Recent activity
        nlohmann::json recent_activity = nlohmann::json::array();
        for (size_t i = 0; i < std::min(allocations.size(), size_t(5)); ++i) {
            const auto& a = allocations[i];
            recent_activity.push_back({
                {"type", "ALLOCATION"},
                {"title", "Food Allocated: " + a.food_name},
                {"description", std::to_string(static_cast<int>(a.allocated_quantity)) + " " + a.unit + " transferred to " + a.recipient_name},
                {"timestamp", a.allocated_at}
            });
        }

        double success_rate = (total_qty_donated > 0) ? (total_qty_allocated / total_qty_donated * 100.0) : 0.0;

        return {
            {"total_donations", donations.size()},
            {"available_food_quantity", available_qty},
            {"total_food_donated", total_qty_donated},
            {"total_food_allocated", total_qty_allocated},
            {"donations_expiring_soon", expiring_soon_count},
            {"successful_allocations", allocations.size()},
            {"pending_donations", pending_donations_count},
            {"registered_recipients", recipients.size()},
            {"allocation_success_rate", success_rate},
            {"category_chart", cat_chart},
            {"status_chart", status_chart},
            {"urgency_chart", urgency_chart},
            {"urgent_donations", urgent_list},
            {"recent_activity", recent_activity}
        };
    }

    // ==========================================
    // ALGORITHM VISUALIZER STATES
    // ==========================================
    nlohmann::json get_hash_table_state() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        nlohmann::json buckets = nlohmann::json::array();

        size_t bucket_count = donation_hash_table_.bucket_count();
        float load_factor = donation_hash_table_.load_factor();
        float max_load_factor = donation_hash_table_.max_load_factor();

        // Sample up to 16 buckets for educational visualization
        size_t display_buckets = std::min(bucket_count, size_t(16));
        for (size_t b = 0; b < display_buckets; ++b) {
            nlohmann::json b_entries = nlohmann::json::array();
            for (auto it = donation_hash_table_.begin(b); it != donation_hash_table_.end(b); ++it) {
                b_entries.push_back({
                    {"key", it->first},
                    {"food_name", it->second.food_name},
                    {"category", it->second.category},
                    {"quantity", it->second.quantity}
                });
            }
            buckets.push_back({
                {"bucket_index", b},
                {"entries", b_entries},
                {"entry_count", b_entries.size()}
            });
        }

        return {
            {"total_elements", donation_hash_table_.size()},
            {"bucket_count", bucket_count},
            {"load_factor", load_factor},
            {"max_load_factor", max_load_factor},
            {"buckets", buckets},
            {"complexity", {
                {"search_avg", "O(1)"},
                {"search_worst", "O(N)"},
                {"insert_avg", "O(1)"},
                {"insert_worst", "O(N)"},
                {"delete_avg", "O(1)"},
                {"delete_worst", "O(N)"}
            }}
        };
    }

    nlohmann::json get_heap_state() {
        std::lock_guard<std::mutex> lock(service_mutex_);
        return {
            {"heap_size", expiry_min_heap_.size()},
            {"is_empty", expiry_min_heap_.empty()},
            {"tree_nodes", expiry_min_heap_.get_visualizer_state()},
            {"complexity", {
                {"push", "O(log N)"},
                {"pop", "O(log N)"},
                {"top", "O(1)"},
                {"build_heap", "O(N)"}
            }}
        };
    }
};

} // namespace FoodRescue
