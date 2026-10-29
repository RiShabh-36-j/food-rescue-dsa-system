#pragma once

#include <string>
#include <vector>
#include <memory>
#include <stdexcept>
#include <iostream>
#include <mutex>
#include <sqlite3.h>
#include "../models/Donation.hpp"
#include "../models/Recipient.hpp"
#include "../models/Allocation.hpp"
#include "../models/Graph.hpp"

namespace FoodRescue {

class Database {
private:
    sqlite3* db_;
    std::string db_path_;
    std::mutex db_mutex_;

    void execute_simple(const std::string& sql) {
        char* err_msg = nullptr;
        int rc = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err_msg);
        if (rc != SQLITE_OK) {
            std::string err = err_msg ? err_msg : "Unknown SQLite error";
            sqlite3_free(err_msg);
            throw std::runtime_error("SQLite Error: " + err + " (Query: " + sql + ")");
        }
    }

public:
    Database(const std::string& path = "food_rescue.db") : db_(nullptr), db_path_(path) {
        int rc = sqlite3_open(db_path_.c_str(), &db_);
        if (rc != SQLITE_OK) {
            throw std::runtime_error("Cannot open database: " + std::string(sqlite3_errmsg(db_)));
        }
        sqlite3_busy_timeout(db_, 5000); // 5 second timeout
        init_schema();
    }

    ~Database() {
        if (db_) {
            sqlite3_close(db_);
            db_ = nullptr;
        }
    }

    void begin_transaction() {
        execute_simple("BEGIN TRANSACTION;");
    }

    void commit() {
        execute_simple("COMMIT;");
    }

    void rollback() {
        execute_simple("ROLLBACK;");
    }

    void init_schema() {
        std::lock_guard<std::mutex> lock(db_mutex_);

        const char* sql = R"(
            CREATE TABLE IF NOT EXISTS donations (
                id TEXT PRIMARY KEY,
                food_name TEXT NOT NULL,
                category TEXT NOT NULL,
                food_type TEXT NOT NULL,
                quantity REAL NOT NULL CHECK(quantity >= 0),
                original_quantity REAL NOT NULL CHECK(original_quantity >= 0),
                unit TEXT NOT NULL,
                donor_name TEXT NOT NULL,
                donor_location TEXT NOT NULL,
                expiry_time TEXT NOT NULL,
                expiry_epoch INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                storage_notes TEXT,
                status TEXT NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS recipients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT NOT NULL,
                phone TEXT,
                location TEXT NOT NULL,
                accepted_categories TEXT NOT NULL,
                required_quantity REAL NOT NULL CHECK(required_quantity >= 0),
                current_demand REAL NOT NULL CHECK(current_demand >= 0),
                priority TEXT NOT NULL,
                people_served INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS graph_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                destination TEXT NOT NULL,
                distance_km REAL NOT NULL CHECK(distance_km > 0),
                bidirectional INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS allocations (
                id TEXT PRIMARY KEY,
                donation_id TEXT NOT NULL,
                recipient_id TEXT NOT NULL,
                food_name TEXT NOT NULL,
                donor_name TEXT NOT NULL,
                recipient_name TEXT NOT NULL,
                allocated_quantity REAL NOT NULL CHECK(allocated_quantity > 0),
                unit TEXT NOT NULL,
                route_distance_km REAL NOT NULL,
                route_path TEXT NOT NULL,
                explanation TEXT NOT NULL,
                status TEXT NOT NULL,
                allocated_at TEXT NOT NULL,
                FOREIGN KEY(donation_id) REFERENCES donations(id),
                FOREIGN KEY(recipient_id) REFERENCES recipients(id)
            );
        )";
        execute_simple(sql);
    }

    // ==========================================
    // DONATIONS CRUD
    // ==========================================
    bool insert_donation(const Donation& d) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (d.quantity < 0) {
            throw std::runtime_error("Invalid quantity: quantity cannot be negative.");
        }

        const char* sql = R"(
            INSERT INTO donations (id, food_name, category, food_type, quantity, original_quantity, unit, donor_name, donor_location, expiry_time, expiry_epoch, created_at, storage_notes, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        )";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        sqlite3_bind_text(stmt, 1, d.id.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, d.food_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, d.category.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, d.food_type.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 5, d.quantity);
        sqlite3_bind_double(stmt, 6, d.original_quantity > 0 ? d.original_quantity : d.quantity);
        sqlite3_bind_text(stmt, 7, d.unit.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 8, d.donor_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 9, d.donor_location.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 10, d.expiry_time.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 11, d.expiry_epoch);
        sqlite3_bind_text(stmt, 12, d.created_at.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 13, d.storage_notes.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 14, d.status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 15, d.description.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc == SQLITE_CONSTRAINT) {
            throw std::runtime_error("Duplicate donation ID: " + d.id + " already exists.");
        }
        return rc == SQLITE_DONE;
    }

    std::vector<Donation> get_all_donations() {
        std::lock_guard<std::mutex> lock(db_mutex_);
        std::vector<Donation> list;
        const char* sql = "SELECT id, food_name, category, food_type, quantity, original_quantity, unit, donor_name, donor_location, expiry_time, expiry_epoch, created_at, storage_notes, status, description FROM donations ORDER BY expiry_epoch ASC;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Donation d;
            d.id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
            d.food_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
            d.category = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
            d.food_type = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
            d.quantity = sqlite3_column_double(stmt, 4);
            d.original_quantity = sqlite3_column_double(stmt, 5);
            d.unit = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
            d.donor_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
            d.donor_location = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
            d.expiry_time = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 9));
            d.expiry_epoch = sqlite3_column_int64(stmt, 10);
            d.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 11));
            const char* notes = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 12));
            d.storage_notes = notes ? notes : "";
            d.status = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 13));
            const char* desc = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 14));
            d.description = desc ? desc : "";
            list.push_back(d);
        }
        sqlite3_finalize(stmt);
        return list;
    }

    bool get_donation_by_id(const std::string& id, Donation& out_d) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        const char* sql = "SELECT id, food_name, category, food_type, quantity, original_quantity, unit, donor_name, donor_location, expiry_time, expiry_epoch, created_at, storage_notes, status, description FROM donations WHERE id = ?;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_TRANSIENT);

        bool found = false;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            out_d.id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
            out_d.food_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
            out_d.category = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
            out_d.food_type = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
            out_d.quantity = sqlite3_column_double(stmt, 4);
            out_d.original_quantity = sqlite3_column_double(stmt, 5);
            out_d.unit = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
            out_d.donor_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
            out_d.donor_location = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
            out_d.expiry_time = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 9));
            out_d.expiry_epoch = sqlite3_column_int64(stmt, 10);
            out_d.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 11));
            const char* notes = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 12));
            out_d.storage_notes = notes ? notes : "";
            out_d.status = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 13));
            const char* desc = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 14));
            out_d.description = desc ? desc : "";
            found = true;
        }
        sqlite3_finalize(stmt);
        return found;
    }

    bool update_donation(const Donation& d) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (d.quantity < 0) {
            throw std::runtime_error("Quantity cannot be negative.");
        }
        const char* sql = R"(
            UPDATE donations
            SET food_name = ?, category = ?, food_type = ?, quantity = ?, unit = ?,
                donor_name = ?, donor_location = ?, expiry_time = ?, expiry_epoch = ?,
                storage_notes = ?, status = ?, description = ?
            WHERE id = ?;
        )";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;

        sqlite3_bind_text(stmt, 1, d.food_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, d.category.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, d.food_type.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 4, d.quantity);
        sqlite3_bind_text(stmt, 5, d.unit.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, d.donor_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 7, d.donor_location.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 8, d.expiry_time.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 9, d.expiry_epoch);
        sqlite3_bind_text(stmt, 10, d.storage_notes.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 11, d.status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 12, d.description.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 13, d.id.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    bool update_donation_quantity_status(const std::string& id, double new_quantity, const std::string& new_status) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (new_quantity < 0) {
            throw std::runtime_error("Quantity cannot be negative.");
        }
        const char* sql = "UPDATE donations SET quantity = ?, status = ? WHERE id = ?;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_double(stmt, 1, new_quantity);
        sqlite3_bind_text(stmt, 2, new_status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, id.c_str(), -1, SQLITE_TRANSIENT);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    bool delete_donation(const std::string& id) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        // Check if there are active allocations linked to this donation
        const char* check_sql = "SELECT COUNT(*) FROM allocations WHERE donation_id = ?;";
        sqlite3_stmt* chk_stmt = nullptr;
        if (sqlite3_prepare_v2(db_, check_sql, -1, &chk_stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(chk_stmt, 1, id.c_str(), -1, SQLITE_TRANSIENT);
            if (sqlite3_step(chk_stmt) == SQLITE_ROW) {
                int count = sqlite3_column_int(chk_stmt, 0);
                if (count > 0) {
                    sqlite3_finalize(chk_stmt);
                    throw std::runtime_error("Cannot delete donation " + id + ": It has " + std::to_string(count) + " recorded allocations. Preserving allocation audit integrity.");
                }
            }
            sqlite3_finalize(chk_stmt);
        }

        const char* sql = "DELETE FROM donations WHERE id = ?;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_TRANSIENT);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    // ==========================================
    // RECIPIENTS CRUD
    // ==========================================
    bool insert_recipient(const Recipient& r) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (r.required_quantity < 0 || r.current_demand < 0) {
            throw std::runtime_error("Recipient demand/required quantity cannot be negative.");
        }

        std::string cat_str;
        for (size_t i = 0; i < r.accepted_categories.size(); ++i) {
            if (i > 0) cat_str += ",";
            cat_str += r.accepted_categories[i];
        }

        const char* sql = R"(
            INSERT INTO recipients (id, name, contact_person, phone, location, accepted_categories, required_quantity, current_demand, priority, people_served, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        )";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        sqlite3_bind_text(stmt, 1, r.id.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, r.name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, r.contact_person.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, r.phone.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, r.location.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, cat_str.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 7, r.required_quantity);
        sqlite3_bind_double(stmt, 8, r.current_demand);
        sqlite3_bind_text(stmt, 9, r.priority.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 10, r.people_served);
        sqlite3_bind_text(stmt, 11, r.status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 12, r.created_at.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc == SQLITE_CONSTRAINT) {
            throw std::runtime_error("Duplicate recipient ID: " + r.id + " already exists.");
        }
        return rc == SQLITE_DONE;
    }

    std::vector<Recipient> get_all_recipients() {
        std::lock_guard<std::mutex> lock(db_mutex_);
        std::vector<Recipient> list;
        const char* sql = "SELECT id, name, contact_person, phone, location, accepted_categories, required_quantity, current_demand, priority, people_served, status, created_at FROM recipients ORDER BY id ASC;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Recipient r;
            r.id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
            r.name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
            r.contact_person = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
            const char* phone = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
            r.phone = phone ? phone : "";
            r.location = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));

            std::string cat_str = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
            std::stringstream ss(cat_str);
            std::string item;
            while (std::getline(ss, item, ',')) {
                if (!item.empty()) r.accepted_categories.push_back(item);
            }

            r.required_quantity = sqlite3_column_double(stmt, 6);
            r.current_demand = sqlite3_column_double(stmt, 7);
            r.priority = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
            r.people_served = sqlite3_column_int(stmt, 9);
            r.status = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 10));
            r.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 11));
            list.push_back(r);
        }
        sqlite3_finalize(stmt);
        return list;
    }

    bool update_recipient_demand_status(const std::string& id, double new_demand, const std::string& new_status) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (new_demand < 0) {
            throw std::runtime_error("Recipient demand cannot become negative.");
        }
        const char* sql = "UPDATE recipients SET current_demand = ?, status = ? WHERE id = ?;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_double(stmt, 1, new_demand);
        sqlite3_bind_text(stmt, 2, new_status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, id.c_str(), -1, SQLITE_TRANSIENT);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    bool update_recipient(const Recipient& r) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        std::string cat_str;
        for (size_t i = 0; i < r.accepted_categories.size(); ++i) {
            if (i > 0) cat_str += ",";
            cat_str += r.accepted_categories[i];
        }

        const char* sql = R"(
            UPDATE recipients
            SET name = ?, contact_person = ?, phone = ?, location = ?, accepted_categories = ?,
                required_quantity = ?, current_demand = ?, priority = ?, people_served = ?, status = ?
            WHERE id = ?;
        )";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;

        sqlite3_bind_text(stmt, 1, r.name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, r.contact_person.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, r.phone.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, r.location.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, cat_str.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 6, r.required_quantity);
        sqlite3_bind_double(stmt, 7, r.current_demand);
        sqlite3_bind_text(stmt, 8, r.priority.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 9, r.people_served);
        sqlite3_bind_text(stmt, 10, r.status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 11, r.id.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    bool delete_recipient(const std::string& id) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        const char* check_sql = "SELECT COUNT(*) FROM allocations WHERE recipient_id = ?;";
        sqlite3_stmt* chk_stmt = nullptr;
        if (sqlite3_prepare_v2(db_, check_sql, -1, &chk_stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(chk_stmt, 1, id.c_str(), -1, SQLITE_TRANSIENT);
            if (sqlite3_step(chk_stmt) == SQLITE_ROW) {
                int count = sqlite3_column_int(chk_stmt, 0);
                if (count > 0) {
                    sqlite3_finalize(chk_stmt);
                    throw std::runtime_error("Cannot delete recipient " + id + ": Has " + std::to_string(count) + " recorded allocations.");
                }
            }
            sqlite3_finalize(chk_stmt);
        }

        const char* sql = "DELETE FROM recipients WHERE id = ?;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_TRANSIENT);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    // ==========================================
    // ALLOCATIONS PERSISTENCE & TRANSACTIONS
    // ==========================================
    bool insert_allocation(const Allocation& a) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        if (a.allocated_quantity <= 0) {
            throw std::runtime_error("Allocation quantity must be greater than zero.");
        }

        const char* sql = R"(
            INSERT INTO allocations (id, donation_id, recipient_id, food_name, donor_name, recipient_name, allocated_quantity, unit, route_distance_km, route_path, explanation, status, allocated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        )";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        sqlite3_bind_text(stmt, 1, a.id.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, a.donation_id.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, a.recipient_id.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, a.food_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, a.donor_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, a.recipient_name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 7, a.allocated_quantity);
        sqlite3_bind_text(stmt, 8, a.unit.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 9, a.route_distance_km);
        sqlite3_bind_text(stmt, 10, a.route_path.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 11, a.explanation.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 12, a.status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 13, a.allocated_at.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return rc == SQLITE_DONE;
    }

    std::vector<Allocation> get_all_allocations() {
        std::lock_guard<std::mutex> lock(db_mutex_);
        std::vector<Allocation> list;
        const char* sql = "SELECT id, donation_id, recipient_id, food_name, donor_name, recipient_name, allocated_quantity, unit, route_distance_km, route_path, explanation, status, allocated_at FROM allocations ORDER BY allocated_at DESC;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error(sqlite3_errmsg(db_));
        }

        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Allocation a;
            a.id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
            a.donation_id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
            a.recipient_id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
            a.food_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
            a.donor_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
            a.recipient_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
            a.allocated_quantity = sqlite3_column_double(stmt, 6);
            a.unit = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
            a.route_distance_km = sqlite3_column_double(stmt, 8);
            a.route_path = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 9));
            a.explanation = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 10));
            a.status = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 11));
            a.allocated_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 12));
            list.push_back(a);
        }
        sqlite3_finalize(stmt);
        return list;
    }

    // ==========================================
    // GRAPH EDGES
    // ==========================================
    void insert_graph_edge(const std::string& src, const std::string& dest, double dist, bool bidir = true) {
        std::lock_guard<std::mutex> lock(db_mutex_);
        const char* sql = "INSERT INTO graph_edges (source, destination, distance_km, bidirectional) VALUES (?, ?, ?, ?);";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return;
        sqlite3_bind_text(stmt, 1, src.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, dest.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 3, dist);
        sqlite3_bind_int(stmt, 4, bidir ? 1 : 0);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    std::vector<GraphEdgeRecord> get_all_graph_edges() {
        std::lock_guard<std::mutex> lock(db_mutex_);
        std::vector<GraphEdgeRecord> list;
        const char* sql = "SELECT id, source, destination, distance_km, bidirectional FROM graph_edges;";
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) return list;

        while (sqlite3_step(stmt) == SQLITE_ROW) {
            GraphEdgeRecord e;
            e.id = sqlite3_column_int(stmt, 0);
            e.source = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
            e.destination = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
            e.distance_km = sqlite3_column_double(stmt, 3);
            e.bidirectional = sqlite3_column_int(stmt, 4) == 1;
            list.push_back(e);
        }
        sqlite3_finalize(stmt);
        return list;
    }

    void reset_all_data() {
        std::lock_guard<std::mutex> lock(db_mutex_);
        execute_simple("DELETE FROM allocations;");
        execute_simple("DELETE FROM donations;");
        execute_simple("DELETE FROM recipients;");
        execute_simple("DELETE FROM graph_edges;");
    }
};

} // namespace FoodRescue
