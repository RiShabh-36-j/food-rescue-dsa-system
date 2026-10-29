#include <iostream>
#include <memory>
#include <csignal>
#include "database/Database.hpp"
#include "services/FoodRescueService.hpp"
#include "api/Server.hpp"

std::unique_ptr<FoodRescue::ApiServer> g_server;

void signal_handler(int signal) {
    if (g_server) {
        std::cout << "\nGracefully shutting down Food Rescue Server...\n";
        g_server->stop();
    }
}

int main(int argc, char* argv[]) {
    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);

    int port = 8080;
    if (argc > 1) {
        try {
            port = std::stoi(argv[1]);
        } catch (...) {
            std::cerr << "Invalid port argument, defaulting to 8080.\n";
        }
    }

    try {
        std::cout << "Initializing SQLite database at 'data/food_rescue.db'...\n";
        auto db = std::make_shared<FoodRescue::Database>("data/food_rescue.db");
        auto service = std::make_shared<FoodRescue::FoodRescueService>(db);

        // Auto-seed if empty
        if (service->get_donations().empty()) {
            std::cout << "Empty database detected. Seeding synthetic demonstration dataset...\n";
            service->seed_demo_data();
            service->sync_from_database();
            std::cout << "Demonstration data successfully seeded.\n";
        } else {
            std::cout << "Loaded existing database with " << service->get_donations().size() << " donations.\n";
        }

        g_server = std::make_unique<FoodRescue::ApiServer>(service, port);
        g_server->start();

    } catch (const std::exception& e) {
        std::cerr << "FATAL ERROR during backend startup: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
