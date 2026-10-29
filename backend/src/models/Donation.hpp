#pragma once

#include <string>
#include <vector>
#include <ctime>
#include <chrono>
#include <sstream>
#include <iomanip>
#include "json.hpp"

namespace FoodRescue {

struct Donation {
    std::string id;
    std::string food_name;
    std::string category;      // Cooked Meals, Bakery, Fresh Produce, Dairy, Packaged Goods, Beverages
    std::string food_type;     // Perishable, Highly Perishable, Semi-Perishable
    double quantity;
    double original_quantity;
    std::string unit;          // kg, liters, boxes, packets, portions
    std::string donor_name;
    std::string donor_location;// Chembur, Dadar, Bandra, Kurla, Ghatkopar, Sion, Andheri, Thane, Vashi, SAKEC Campus
    std::string expiry_time;   // ISO 8601 string
    int64_t expiry_epoch;      // Seconds since UNIX epoch
    std::string created_at;
    std::string storage_notes;
    std::string status;        // AVAILABLE, PARTIALLY_ALLOCATED, FULLY_ALLOCATED, EXPIRED, UNAVAILABLE
    std::string description;

    std::string get_urgency_tier(int64_t current_epoch) const {
        if (status == "EXPIRED" || expiry_epoch <= current_epoch) {
            return "EXPIRED";
        }
        int64_t diff_sec = expiry_epoch - current_epoch;
        double diff_hours = diff_sec / 3600.0;
        if (diff_hours <= 4.0) return "CRITICAL";
        if (diff_hours <= 12.0) return "HIGH";
        if (diff_hours <= 24.0) return "MODERATE";
        return "LOW";
    }

    double get_hours_remaining(int64_t current_epoch) const {
        int64_t diff_sec = expiry_epoch - current_epoch;
        return diff_sec / 3600.0;
    }
};

inline void to_json(nlohmann::json& j, const Donation& d) {
    auto now = std::chrono::system_clock::now();
    int64_t current_epoch = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();

    j = nlohmann::json{
        {"id", d.id},
        {"food_name", d.food_name},
        {"category", d.category},
        {"food_type", d.food_type},
        {"quantity", d.quantity},
        {"original_quantity", d.original_quantity},
        {"unit", d.unit},
        {"donor_name", d.donor_name},
        {"donor_location", d.donor_location},
        {"expiry_time", d.expiry_time},
        {"expiry_epoch", d.expiry_epoch},
        {"created_at", d.created_at},
        {"storage_notes", d.storage_notes},
        {"status", d.status},
        {"description", d.description},
        {"urgency_tier", d.get_urgency_tier(current_epoch)},
        {"hours_remaining", d.get_hours_remaining(current_epoch)}
    };
}

inline void from_json(const nlohmann::json& j, Donation& d) {
    j.at("id").get_to(d.id);
    j.at("food_name").get_to(d.food_name);
    j.at("category").get_to(d.category);
    j.at("food_type").get_to(d.food_type);
    j.at("quantity").get_to(d.quantity);
    if (j.contains("original_quantity")) {
        j.at("original_quantity").get_to(d.original_quantity);
    } else {
        d.original_quantity = d.quantity;
    }
    j.at("unit").get_to(d.unit);
    j.at("donor_name").get_to(d.donor_name);
    j.at("donor_location").get_to(d.donor_location);
    j.at("expiry_time").get_to(d.expiry_time);
    if (j.contains("expiry_epoch")) {
        j.at("expiry_epoch").get_to(d.expiry_epoch);
    } else {
        d.expiry_epoch = 0;
    }
    if (j.contains("created_at")) {
        j.at("created_at").get_to(d.created_at);
    }
    if (j.contains("storage_notes")) {
        j.at("storage_notes").get_to(d.storage_notes);
    }
    if (j.contains("status")) {
        j.at("status").get_to(d.status);
    } else {
        d.status = "AVAILABLE";
    }
    if (j.contains("description")) {
        j.at("description").get_to(d.description);
    }
}

} // namespace FoodRescue
