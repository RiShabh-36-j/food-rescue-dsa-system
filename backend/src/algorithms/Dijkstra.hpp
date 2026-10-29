#pragma once

#include <vector>
#include <queue>
#include <unordered_map>
#include <limits>
#include <algorithm>
#include "../models/Graph.hpp"

namespace FoodRescue {

class GraphEngine {
private:
    std::unordered_map<std::string, int> name_to_idx_;
    std::vector<std::string> idx_to_name_;
    std::vector<std::vector<Edge>> adj_;
    std::unordered_map<std::string, std::pair<double, double>> node_coordinates_;

public:
    GraphEngine() = default;

    void clear() {
        name_to_idx_.clear();
        idx_to_name_.clear();
        adj_.clear();
        node_coordinates_.clear();
    }

    int get_or_create_node(const std::string& name, double x = 0.0, double y = 0.0) {
        auto it = name_to_idx_.find(name);
        if (it != name_to_idx_.end()) {
            return it->second;
        }
        int idx = static_cast<int>(idx_to_name_.size());
        name_to_idx_[name] = idx;
        idx_to_name_.push_back(name);
        adj_.emplace_back();
        node_coordinates_[name] = {x, y};
        return idx;
    }

    void set_node_coordinate(const std::string& name, double x, double y) {
        node_coordinates_[name] = {x, y};
    }

    std::pair<double, double> get_node_coordinate(const std::string& name) const {
        auto it = node_coordinates_.find(name);
        if (it != node_coordinates_.end()) return it->second;
        return {0.0, 0.0};
    }

    void add_edge(const std::string& u_name, const std::string& v_name, double distance_km, bool bidirectional = true) {
        int u = get_or_create_node(u_name);
        int v = get_or_create_node(v_name);

        adj_[u].push_back(Edge{v, v_name, distance_km});
        if (bidirectional) {
            adj_[v].push_back(Edge{u, u_name, distance_km});
        }
    }

    bool has_node(const std::string& name) const {
        return name_to_idx_.find(name) != name_to_idx_.end();
    }

    int node_count() const {
        return static_cast<int>(idx_to_name_.size());
    }

    const std::vector<std::string>& get_all_node_names() const {
        return idx_to_name_;
    }

    const std::vector<std::vector<Edge>>& get_adj() const {
        return adj_;
    }

    // Dijkstra's Shortest Path Algorithm
    // Complexity: O((V + E) log V) with binary heap
    DijkstraResult find_shortest_path(const std::string& src_name, const std::string& dest_name) const {
        DijkstraResult res;
        res.reachable = false;
        res.total_distance = -1.0;

        if (!has_node(src_name) || !has_node(dest_name)) {
            return res;
        }

        int src = name_to_idx_.at(src_name);
        int dest = name_to_idx_.at(dest_name);
        int n = static_cast<int>(idx_to_name_.size());

        const double INF = std::numeric_limits<double>::infinity();
        std::vector<double> dist(n, INF);
        std::vector<int> parent(n, -1);
        std::vector<bool> visited(n, false);

        dist[src] = 0.0;

        // Min-priority queue: pair of (distance, node_index)
        typedef std::pair<double, int> DistNode;
        std::priority_queue<DistNode, std::vector<DistNode>, std::greater<DistNode>> pq;
        pq.push({0.0, src});

        int step_counter = 0;

        auto make_snapshot = [&]() {
            std::unordered_map<std::string, double> snap;
            for (int i = 0; i < n; ++i) {
                snap[idx_to_name_[i]] = (dist[i] == INF) ? -1.0 : dist[i];
            }
            return snap;
        };

        // Initial state trace step
        {
            DijkstraStep init_step;
            init_step.step_number = ++step_counter;
            init_step.current_node = src_name;
            init_step.current_dist = 0.0;
            init_step.action = "INITIALIZE";
            init_step.examined_neighbor = "";
            init_step.edge_weight = 0.0;
            init_step.old_dist = INF;
            init_step.new_dist = 0.0;
            init_step.relaxed = true;
            init_step.snapshot_distances = make_snapshot();
            res.trace.push_back(init_step);
        }

        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();

            if (visited[u]) continue;
            visited[u] = true;

            DijkstraStep visit_step;
            visit_step.step_number = ++step_counter;
            visit_step.current_node = idx_to_name_[u];
            visit_step.current_dist = d;
            visit_step.action = "VISIT";
            visit_step.examined_neighbor = "";
            visit_step.edge_weight = 0.0;
            visit_step.old_dist = d;
            visit_step.new_dist = d;
            visit_step.relaxed = false;
            visit_step.snapshot_distances = make_snapshot();
            res.trace.push_back(visit_step);

            if (u == dest) {
                break; // Target reached
            }

            for (const auto& edge : adj_[u]) {
                int v = edge.to_idx;
                double weight = edge.distance_km;

                if (visited[v]) continue;

                double old_d = dist[v];
                double new_d = dist[u] + weight;

                DijkstraStep edge_step;
                edge_step.step_number = ++step_counter;
                edge_step.current_node = idx_to_name_[u];
                edge_step.current_dist = dist[u];
                edge_step.examined_neighbor = edge.to_name;
                edge_step.edge_weight = weight;
                edge_step.old_dist = (old_d == INF) ? -1.0 : old_d;
                edge_step.new_dist = new_d;

                if (new_d < old_d) {
                    dist[v] = new_d;
                    parent[v] = u;
                    pq.push({new_d, v});
                    edge_step.action = "RELAX";
                    edge_step.relaxed = true;
                } else {
                    edge_step.action = "SKIP";
                    edge_step.relaxed = false;
                }
                edge_step.snapshot_distances = make_snapshot();
                res.trace.push_back(edge_step);
            }
        }

        if (dist[dest] == INF) {
            res.reachable = false;
            res.total_distance = -1.0;
            return res;
        }

        res.reachable = true;
        res.total_distance = dist[dest];

        // Reconstruct path
        std::vector<std::string> path_nodes;
        for (int curr = dest; curr != -1; curr = parent[curr]) {
            path_nodes.push_back(idx_to_name_[curr]);
        }
        std::reverse(path_nodes.begin(), path_nodes.end());
        res.path = path_nodes;

        return res;
    }

    nlohmann::json get_graph_export() const {
        nlohmann::json nodes_json = nlohmann::json::array();
        for (size_t i = 0; i < idx_to_name_.size(); ++i) {
            const auto& name = idx_to_name_[i];
            auto coords = get_node_coordinate(name);
            nodes_json.push_back({
                {"id", name},
                {"name", name},
                {"index", static_cast<int>(i)},
                {"x", coords.first},
                {"y", coords.second}
            });
        }

        nlohmann::json edges_json = nlohmann::json::array();
        for (size_t u = 0; u < adj_.size(); ++u) {
            for (const auto& edge : adj_[u]) {
                if (u <= static_cast<size_t>(edge.to_idx)) {
                    edges_json.push_back({
                        {"source", idx_to_name_[u]},
                        {"target", edge.to_name},
                        {"distance_km", edge.distance_km}
                    });
                }
            }
        }

        return {
            {"nodes", nodes_json},
            {"edges", edges_json}
        };
    }
};

} // namespace FoodRescue
