#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include "json.hpp"

namespace FoodRescue {

struct Edge {
    int to_idx;
    std::string to_name;
    double distance_km;
};

struct GraphEdgeRecord {
    int id;
    std::string source;
    std::string destination;
    double distance_km;
    bool bidirectional;
};

struct DijkstraStep {
    int step_number;
    std::string current_node;
    double current_dist;
    std::string action; // "VISIT", "RELAX", "SKIP"
    std::string examined_neighbor;
    double edge_weight;
    double old_dist;
    double new_dist;
    bool relaxed;
    std::unordered_map<std::string, double> snapshot_distances;
};

struct DijkstraResult {
    bool reachable;
    double total_distance;
    std::vector<std::string> path;
    std::vector<DijkstraStep> trace;
};

inline void to_json(nlohmann::json& j, const DijkstraStep& s) {
    j = nlohmann::json{
        {"step_number", s.step_number},
        {"current_node", s.current_node},
        {"current_dist", s.current_dist},
        {"action", s.action},
        {"examined_neighbor", s.examined_neighbor},
        {"edge_weight", s.edge_weight},
        {"old_dist", s.old_dist},
        {"new_dist", s.new_dist},
        {"relaxed", s.relaxed},
        {"snapshot_distances", s.snapshot_distances}
    };
}

inline void to_json(nlohmann::json& j, const DijkstraResult& r) {
    j = nlohmann::json{
        {"reachable", r.reachable},
        {"total_distance", r.total_distance},
        {"path", r.path},
        {"trace", r.trace}
    };
}

inline void to_json(nlohmann::json& j, const GraphEdgeRecord& e) {
    j = nlohmann::json{
        {"id", e.id},
        {"source", e.source},
        {"destination", e.destination},
        {"distance_km", e.distance_km},
        {"bidirectional", e.bidirectional}
    };
}

} // namespace FoodRescue
