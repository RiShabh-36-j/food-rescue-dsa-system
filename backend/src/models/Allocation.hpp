#pragma once

#include <string>
#include "json.hpp"

namespace FoodRescue {

struct Allocation {
    std::string id;
    std::string donation_id;
    std::string recipient_id;
    std::string food_name;
    std::string donor_name;
    std::string recipient_name;
    double allocated_quantity;
    std::string unit;
    double route_distance_km;
    std::string route_path;
    std::string explanation;
    std::string status; // COMPLETED, PENDING, CANCELLED
    std::string allocated_at;
};

inline void to_json(nlohmann::json& j, const Allocation& a) {
    j = nlohmann::json{
        {"id", a.id},
        {"donation_id", a.donation_id},
        {"recipient_id", a.recipient_id},
        {"food_name", a.food_name},
        {"donor_name", a.donor_name},
        {"recipient_name", a.recipient_name},
        {"allocated_quantity", a.allocated_quantity},
        {"unit", a.unit},
        {"route_distance_km", a.route_distance_km},
        {"route_path", a.route_path},
        {"explanation", a.explanation},
        {"status", a.status},
        {"allocated_at", a.allocated_at}
    };
}

inline void from_json(const nlohmann::json& j, Allocation& a) {
    j.at("id").get_to(a.id);
    j.at("donation_id").get_to(a.donation_id);
    j.at("recipient_id").get_to(a.recipient_id);
    j.at("food_name").get_to(a.food_name);
    j.at("donor_name").get_to(a.donor_name);
    j.at("recipient_name").get_to(a.recipient_name);
    j.at("allocated_quantity").get_to(a.allocated_quantity);
    j.at("unit").get_to(a.unit);
    j.at("route_distance_km").get_to(a.route_distance_km);
    j.at("route_path").get_to(a.route_path);
    j.at("explanation").get_to(a.explanation);
    j.at("status").get_to(a.status);
    j.at("allocated_at").get_to(a.allocated_at);
}

} // namespace FoodRescue
