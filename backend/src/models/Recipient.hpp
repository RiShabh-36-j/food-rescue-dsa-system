#pragma once

#include <string>
#include <vector>
#include <sstream>
#include "json.hpp"

namespace FoodRescue {

struct Recipient {
    std::string id;
    std::string name;
    std::string contact_person;
    std::string phone;
    std::string location;
    std::vector<std::string> accepted_categories;
    double required_quantity;
    double current_demand;
    std::string priority; // HIGH, MEDIUM, LOW
    int people_served;
    std::string status;   // ACTIVE, INACTIVE, FULFILLED
    std::string created_at;

    bool accepts_category(const std::string& cat) const {
        for (const auto& c : accepted_categories) {
            if (c == cat || c == "All" || c == "ALL") return true;
        }
        return false;
    }

    int priority_score() const {
        if (priority == "HIGH") return 3;
        if (priority == "MEDIUM") return 2;
        return 1; // LOW
    }
};

inline void to_json(nlohmann::json& j, const Recipient& r) {
    j = nlohmann::json{
        {"id", r.id},
        {"name", r.name},
        {"contact_person", r.contact_person},
        {"phone", r.phone},
        {"location", r.location},
        {"accepted_categories", r.accepted_categories},
        {"required_quantity", r.required_quantity},
        {"current_demand", r.current_demand},
        {"priority", r.priority},
        {"people_served", r.people_served},
        {"status", r.status},
        {"created_at", r.created_at}
    };
}

inline void from_json(const nlohmann::json& j, Recipient& r) {
    j.at("id").get_to(r.id);
    j.at("name").get_to(r.name);
    j.at("contact_person").get_to(r.contact_person);
    if (j.contains("phone")) j.at("phone").get_to(r.phone);
    j.at("location").get_to(r.location);
    if (j.contains("accepted_categories") && j["accepted_categories"].is_array()) {
        j.at("accepted_categories").get_to(r.accepted_categories);
    }
    j.at("required_quantity").get_to(r.required_quantity);
    if (j.contains("current_demand")) {
        j.at("current_demand").get_to(r.current_demand);
    } else {
        r.current_demand = r.required_quantity;
    }
    j.at("priority").get_to(r.priority);
    if (j.contains("people_served")) j.at("people_served").get_to(r.people_served);
    if (j.contains("status")) {
        j.at("status").get_to(r.status);
    } else {
        r.status = "ACTIVE";
    }
    if (j.contains("created_at")) j.at("created_at").get_to(r.created_at);
}

} // namespace FoodRescue
