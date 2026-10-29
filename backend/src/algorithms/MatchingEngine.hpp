#pragma once

#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include "../models/Donation.hpp"
#include "../models/Recipient.hpp"
#include "../models/Allocation.hpp"
#include "ExpiryMinHeap.hpp"
#include "Dijkstra.hpp"

namespace FoodRescue {

struct MatchCandidate {
    Recipient recipient;
    double route_distance_km;
    std::vector<std::string> route_path;
    double proposed_quantity;
    std::string match_reason;
    std::string status; // "RECOMMENDED", "ROUTE_UNAVAILABLE", "INCOMPATIBLE_CATEGORY", "DEMAND_ZERO"
};

struct MatchRecommendation {
    Donation donation;
    Recipient recipient;
    double allocated_quantity;
    double remaining_donation_quantity;
    double remaining_recipient_demand;
    double route_distance_km;
    std::string route_path_str;
    std::string explanation;
    std::string match_status; // "RECOMMENDED", "PARTIALLY_ALLOCATED", "NO_ELIGIBLE_RECIPIENT", "ROUTE_UNAVAILABLE"
    std::vector<MatchCandidate> alternative_candidates;
};

inline void to_json(nlohmann::json& j, const MatchRecommendation& mr) {
    j = nlohmann::json{
        {"donation", mr.donation},
        {"recipient", mr.recipient},
        {"allocated_quantity", mr.allocated_quantity},
        {"remaining_donation_quantity", mr.remaining_donation_quantity},
        {"remaining_recipient_demand", mr.remaining_recipient_demand},
        {"route_distance_km", mr.route_distance_km},
        {"route_path", mr.route_path_str},
        {"explanation", mr.explanation},
        {"match_status", mr.match_status}
    };
}

class MatchingEngine {
public:
    static std::vector<MatchRecommendation> compute_matches(
        std::vector<Donation> available_donations,
        std::vector<Recipient> active_recipients,
        const GraphEngine& graph,
        int64_t current_epoch
    ) {
        std::vector<MatchRecommendation> recommendations;

        // Step 1: Use ExpiryMinHeap to organize donations in expiry-first order
        ExpiryMinHeap heap;
        for (const auto& d : available_donations) {
            if ((d.status == "AVAILABLE" || d.status == "PARTIALLY_ALLOCATED") &&
                d.quantity > 0.0 &&
                d.expiry_epoch > current_epoch) {
                heap.push(d);
            }
        }

        // Recipient working copies to track demand decrements during the matching run
        std::unordered_map<std::string, Recipient> recipient_map;
        for (const auto& r : active_recipients) {
            if (r.status == "ACTIVE" && r.current_demand > 0.0) {
                recipient_map[r.id] = r;
            }
        }

        // Step 2: Extract donations by priority and find optimal recipient
        while (!heap.empty()) {
            Donation current_donation = heap.pop();
            if (current_donation.quantity <= 0.0) continue;

            // Search eligible recipients
            std::vector<MatchCandidate> feasible_candidates;
            std::vector<MatchCandidate> rejected_candidates;

            for (const auto& [rec_id, r] : recipient_map) {
                if (r.status != "ACTIVE" || r.current_demand <= 0.0) {
                    continue;
                }

                // Compatibility check
                if (!r.accepts_category(current_donation.category)) {
                    MatchCandidate rej;
                    rej.recipient = r;
                    rej.route_distance_km = -1.0;
                    rej.status = "INCOMPATIBLE_CATEGORY";
                    rej.match_reason = "Recipient does not accept category: " + current_donation.category;
                    rejected_candidates.push_back(rej);
                    continue;
                }

                // Dijkstra shortest path calculation
                DijkstraResult route = graph.find_shortest_path(current_donation.donor_location, r.location);
                if (!route.reachable) {
                    MatchCandidate rej;
                    rej.recipient = r;
                    rej.route_distance_km = -1.0;
                    rej.status = "ROUTE_UNAVAILABLE";
                    rej.match_reason = "No reachable transportation route in graph from " + current_donation.donor_location + " to " + r.location;
                    rejected_candidates.push_back(rej);
                    continue;
                }

                // Feasible recipient!
                MatchCandidate cand;
                cand.recipient = r;
                cand.route_distance_km = route.total_distance;
                cand.route_path = route.path;
                cand.proposed_quantity = std::min(current_donation.quantity, r.current_demand);
                cand.status = "RECOMMENDED";
                feasible_candidates.push_back(cand);
            }

            if (feasible_candidates.empty()) {
                MatchRecommendation unfulfilled;
                unfulfilled.donation = current_donation;
                unfulfilled.allocated_quantity = 0.0;
                unfulfilled.remaining_donation_quantity = current_donation.quantity;
                unfulfilled.remaining_recipient_demand = 0.0;
                unfulfilled.route_distance_km = 0.0;
                unfulfilled.route_path_str = "None";
                if (!rejected_candidates.empty() && rejected_candidates[0].status == "ROUTE_UNAVAILABLE") {
                    unfulfilled.match_status = "ROUTE_UNAVAILABLE";
                    unfulfilled.explanation = "Donation " + current_donation.id + " (" + current_donation.food_name + ") could not be matched because compatible recipients are currently unreachable via the road network graph.";
                } else {
                    unfulfilled.match_status = "NO_ELIGIBLE_RECIPIENT";
                    unfulfilled.explanation = "Donation " + current_donation.id + " (" + current_donation.food_name + ") could not be matched because no active recipient currently requests category '" + current_donation.category + "'.";
                }
                recommendations.push_back(unfulfilled);
                continue;
            }

            // Step 3: Explicit Candidate Ranking Rule:
            // 1. Recipient Priority (HIGH (3) > MEDIUM (2) > LOW (1))
            // 2. Route distance (smaller distance is preferred to deliver perishable food sooner)
            // 3. Absolute demand match
            // 4. Stable tie-breaker: Recipient ID
            std::sort(feasible_candidates.begin(), feasible_candidates.end(),
                [&](const MatchCandidate& a, const MatchCandidate& b) {
                    int pA = a.recipient.priority_score();
                    int pB = b.recipient.priority_score();
                    if (pA != pB) return pA > pB; // Higher priority first

                    if (std::abs(a.route_distance_km - b.route_distance_km) > 0.01) {
                        return a.route_distance_km < b.route_distance_km; // Shorter route first
                    }

                    // Fit: candidate whose demand is closer to donation quantity
                    double fitA = std::abs(a.recipient.current_demand - current_donation.quantity);
                    double fitB = std::abs(b.recipient.current_demand - current_donation.quantity);
                    if (fitA != fitB) return fitA < fitB;

                    return a.recipient.id < b.recipient.id;
                }
            );

            // Best match selected
            const MatchCandidate& best = feasible_candidates.front();
            double alloc_qty = std::min(current_donation.quantity, best.recipient.current_demand);

            // Construct path string
            std::stringstream ss_path;
            for (size_t i = 0; i < best.route_path.size(); ++i) {
                if (i > 0) ss_path << " -> ";
                ss_path << best.route_path[i];
            }

            // Construct structured, transparent explanation
            std::stringstream ss_exp;
            ss_exp << "Donation " << current_donation.id << " ('" << current_donation.food_name << "', "
                   << current_donation.quantity << " " << current_donation.unit << ") was matched with NGO "
                   << best.recipient.id << " ('" << best.recipient.name << "') because: "
                   << "(1) Food category '" << current_donation.category << "' is accepted; "
                   << "(2) NGO holds " << best.recipient.priority << " priority with "
                   << best.recipient.current_demand << " " << current_donation.unit << " outstanding demand; "
                   << "(3) Shortest feasible route is " << std::fixed << std::setprecision(1) << best.route_distance_km << " km ("
                   << ss_path.str() << "); "
                   << "(4) Allocates " << alloc_qty << " " << current_donation.unit << " to prevent food expiry.";

            MatchRecommendation rec;
            rec.donation = current_donation;
            rec.recipient = best.recipient;
            rec.allocated_quantity = alloc_qty;
            rec.remaining_donation_quantity = current_donation.quantity - alloc_qty;
            rec.remaining_recipient_demand = best.recipient.current_demand - alloc_qty;
            rec.route_distance_km = best.route_distance_km;
            rec.route_path_str = ss_path.str();
            rec.explanation = ss_exp.str();
            rec.match_status = (rec.remaining_donation_quantity > 0.0) ? "PARTIALLY_ALLOCATED" : "RECOMMENDED";

            // Update in-memory demand of recipient
            recipient_map[best.recipient.id].current_demand -= alloc_qty;
            if (recipient_map[best.recipient.id].current_demand <= 0.0) {
                recipient_map[best.recipient.id].status = "FULFILLED";
            }

            recommendations.push_back(rec);
        }

        return recommendations;
    }
};

} // namespace FoodRescue
