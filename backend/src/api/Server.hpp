#pragma once

#include <iostream>
#include <memory>
#include <string>
#include "httplib.h"
#include "json.hpp"
#include "../services/FoodRescueService.hpp"

namespace FoodRescue {

class ApiServer {
private:
    httplib::Server svr_;
    std::shared_ptr<FoodRescueService> service_;
    int port_;

    void setup_cors() {
        svr_.set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            if (req.method == "OPTIONS") {
                res.status = 200;
                return httplib::Server::HandlerResponse::Handled;
            }
            return httplib::Server::HandlerResponse::Unhandled;
        });
    }

    void register_routes() {
        // Health check
        svr_.Get("/api/health", [this](const httplib::Request&, httplib::Response& res) {
            nlohmann::json j = {
                {"status", "HEALTHY"},
                {"service", "Food Rescue Backend"},
                {"college", "Shah & Anchor Kutchhi Engineering College (SAKEC), Mumbai"},
                {"department", "Artificial Intelligence & Data Science"},
                {"system_time", service_->get_current_iso_time()},
                {"engine", "C++17 DSA Core"}
            };
            res.set_content(j.dump(), "application/json");
        });

        // Dashboard stats
        svr_.Get("/api/dashboard/stats", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto stats = service_->get_dashboard_stats();
                res.set_content(stats.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                nlohmann::json err = {{"error", e.what()}};
                res.set_content(err.dump(), "application/json");
            }
        });

        // ==========================================
        // DONATIONS CRUD
        // ==========================================
        svr_.Get("/api/donations", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                auto list = service_->get_donations();
                nlohmann::json j = list;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Get(R"(/api/donations/([A-Za-z0-9_-]+))", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string id = req.matches[1];
                Donation d;
                if (service_->get_donation_by_id(id, d)) {
                    nlohmann::json j = d;
                    res.set_content(j.dump(), "application/json");
                } else {
                    res.status = 404;
                    res.set_content(nlohmann::json{{"error", "Donation not found"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Post("/api/donations", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                auto j = nlohmann::json::parse(req.body);
                Donation d = j.get<Donation>();
                bool ok = service_->add_donation(d);
                if (ok) {
                    res.status = 201;
                    res.set_content(nlohmann::json{{"success", true}, {"donation", d}}.dump(), "application/json");
                } else {
                    res.status = 400;
                    res.set_content(nlohmann::json{{"error", "Failed to add donation"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Put(R"(/api/donations/([A-Za-z0-9_-]+))", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string id = req.matches[1];
                auto j = nlohmann::json::parse(req.body);
                Donation d = j.get<Donation>();
                d.id = id;
                bool ok = service_->update_donation(d);
                if (ok) {
                    res.set_content(nlohmann::json{{"success", true}, {"donation", d}}.dump(), "application/json");
                } else {
                    res.status = 404;
                    res.set_content(nlohmann::json{{"error", "Donation not found or update failed"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Delete(R"(/api/donations/([A-Za-z0-9_-]+))", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string id = req.matches[1];
                bool ok = service_->delete_donation(id);
                if (ok) {
                    res.set_content(nlohmann::json{{"success", true}, {"id", id}}.dump(), "application/json");
                } else {
                    res.status = 404;
                    res.set_content(nlohmann::json{{"error", "Donation not found"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        // ==========================================
        // RECIPIENTS CRUD
        // ==========================================
        svr_.Get("/api/recipients", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto list = service_->get_recipients();
                nlohmann::json j = list;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Post("/api/recipients", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                auto j = nlohmann::json::parse(req.body);
                Recipient r = j.get<Recipient>();
                bool ok = service_->add_recipient(r);
                if (ok) {
                    res.status = 201;
                    res.set_content(nlohmann::json{{"success", true}, {"recipient", r}}.dump(), "application/json");
                } else {
                    res.status = 400;
                    res.set_content(nlohmann::json{{"error", "Failed to add recipient"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Put(R"(/api/recipients/([A-Za-z0-9_-]+))", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string id = req.matches[1];
                auto j = nlohmann::json::parse(req.body);
                Recipient r = j.get<Recipient>();
                r.id = id;
                bool ok = service_->update_recipient(r);
                if (ok) {
                    res.set_content(nlohmann::json{{"success", true}, {"recipient", r}}.dump(), "application/json");
                } else {
                    res.status = 404;
                    res.set_content(nlohmann::json{{"error", "Recipient not found or update failed"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Delete(R"(/api/recipients/([A-Za-z0-9_-]+))", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string id = req.matches[1];
                bool ok = service_->delete_recipient(id);
                if (ok) {
                    res.set_content(nlohmann::json{{"success", true}, {"id", id}}.dump(), "application/json");
                } else {
                    res.status = 404;
                    res.set_content(nlohmann::json{{"error", "Recipient not found"}}.dump(), "application/json");
                }
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        // ==========================================
        // ROUTE PLANNER
        // ==========================================
        svr_.Get("/api/routes/graph", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto graph_data = service_->get_graph_data();
                res.set_content(graph_data.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Get("/api/routes/calculate", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string from = req.get_param_value("from");
                std::string to = req.get_param_value("to");
                if (from.empty() || to.empty()) {
                    res.status = 400;
                    res.set_content(nlohmann::json{{"error", "Query parameters 'from' and 'to' are required."}}.dump(), "application/json");
                    return;
                }
                DijkstraResult r = service_->calculate_route(from, to);
                nlohmann::json j = r;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        // ==========================================
        // SMART MATCHING
        // ==========================================
        auto handle_matching_preview = [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto recommendations = service_->preview_matching();
                nlohmann::json j = recommendations;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        };

        svr_.Get("/api/matching/preview", handle_matching_preview);
        svr_.Post("/api/matching/preview", handle_matching_preview);

        svr_.Post("/api/matching/confirm", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::vector<std::string> ids;
                if (!req.body.empty()) {
                    auto j = nlohmann::json::parse(req.body);
                    if (j.contains("donation_ids") && j["donation_ids"].is_array()) {
                        ids = j["donation_ids"].get<std::vector<std::string>>();
                    }
                }
                auto result = service_->confirm_matching(ids);
                res.set_content(result.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 400;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        // ==========================================
        // ALLOCATIONS & CSV EXPORT
        // ==========================================
        svr_.Get("/api/allocations", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto list = service_->get_allocations();
                nlohmann::json j = list;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Get("/api/allocations/export.csv", [this](const httplib::Request&, httplib::Response& res) {
            try {
                std::string csv = service_->export_allocations_csv();
                res.set_header("Content-Disposition", "attachment; filename=\"food_rescue_allocations.csv\"");
                res.set_content(csv, "text/csv");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content("Error generating CSV: " + std::string(e.what()), "text/plain");
            }
        });

        // ==========================================
        // ALGORITHM VISUALIZER
        // ==========================================
        svr_.Get("/api/algorithms/dijkstra-trace", [this](const httplib::Request& req, httplib::Response& res) {
            try {
                std::string from = req.has_param("from") ? req.get_param_value("from") : "SAKEC Campus";
                std::string to = req.has_param("to") ? req.get_param_value("to") : "Vashi";
                DijkstraResult r = service_->calculate_route(from, to);
                nlohmann::json j = r;
                res.set_content(j.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Get("/api/algorithms/heap-state", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto state = service_->get_heap_state();
                res.set_content(state.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        svr_.Get("/api/algorithms/hash-table-state", [this](const httplib::Request&, httplib::Response& res) {
            try {
                auto state = service_->get_hash_table_state();
                res.set_content(state.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });

        // ==========================================
        // SYSTEM / DEMO RESET
        // ==========================================
        svr_.Post("/api/system/reset-demo", [this](const httplib::Request&, httplib::Response& res) {
            try {
                service_->seed_demo_data();
                service_->sync_from_database();
                res.set_content(nlohmann::json{
                    {"success", true},
                    {"message", "Database successfully reset to demonstration dataset."}
                }.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
            }
        });
    }

public:
    ApiServer(std::shared_ptr<FoodRescueService> service, int port = 8080)
        : service_(service), port_(port) {
        setup_cors();
        register_routes();
    }

    void start() {
        std::cout << "========================================================\n";
        std::cout << "FOOD RESCUE — Smart Food Redistribution System\n";
        std::cout << "DSA-Powered Sustainability Project (SAKEC AIDS Dept)\n";
        std::cout << "Server listening on http://127.0.0.1:" << port_ << "\n";
        std::cout << "========================================================\n" << std::flush;
        svr_.listen("0.0.0.0", port_);
    }

    void stop() {
        svr_.stop();
    }
};

} // namespace FoodRescue
