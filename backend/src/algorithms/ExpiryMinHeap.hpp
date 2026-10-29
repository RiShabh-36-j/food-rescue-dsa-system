#pragma once

#include <vector>
#include <queue>
#include <unordered_map>
#include <algorithm>
#include <iostream>
#include "../models/Donation.hpp"

namespace FoodRescue {

// Comparator for Expiry Min-Heap:
// Primary: Earliest expiry_epoch
// Secondary: Alphanumeric donation ID (deterministic tie-breaker)
struct ExpiryComparator {
    bool operator()(const Donation& a, const Donation& b) const {
        if (a.expiry_epoch != b.expiry_epoch) {
            return a.expiry_epoch > b.expiry_epoch; // Min-heap: smaller epoch has higher priority
        }
        return a.id > b.id; // Deterministic tie-breaker
    }
};

class ExpiryMinHeap {
private:
    std::vector<Donation> heap_array_;

    void heapify_up(size_t index) {
        while (index > 0) {
            size_t parent = (index - 1) / 2;
            ExpiryComparator comp;
            // If child has higher priority than parent (comp(parent, child) is true)
            if (comp(heap_array_[parent], heap_array_[index])) {
                std::swap(heap_array_[parent], heap_array_[index]);
                index = parent;
            } else {
                break;
            }
        }
    }

    void heapify_down(size_t index) {
        size_t n = heap_array_.size();
        ExpiryComparator comp;
        while (true) {
            size_t left = 2 * index + 1;
            size_t right = 2 * index + 2;
            size_t smallest = index;

            if (left < n && comp(heap_array_[smallest], heap_array_[left])) {
                smallest = left;
            }
            if (right < n && comp(heap_array_[smallest], heap_array_[right])) {
                smallest = right;
            }

            if (smallest != index) {
                std::swap(heap_array_[index], heap_array_[smallest]);
                index = smallest;
            } else {
                break;
            }
        }
    }

public:
    ExpiryMinHeap() = default;

    void clear() {
        heap_array_.clear();
    }

    void push(const Donation& d) {
        heap_array_.push_back(d);
        heapify_up(heap_array_.size() - 1);
    }

    bool empty() const {
        return heap_array_.empty();
    }

    size_t size() const {
        return heap_array_.size();
    }

    const Donation& top() const {
        return heap_array_.front();
    }

    Donation pop() {
        if (heap_array_.empty()) {
            throw std::runtime_error("Heap is empty");
        }
        Donation root = heap_array_.front();
        heap_array_.front() = heap_array_.back();
        heap_array_.pop_back();
        if (!heap_array_.empty()) {
            heapify_down(0);
        }
        return root;
    }

    // Lazy extraction that skips invalid, fully allocated, or expired items
    bool pop_next_valid(int64_t current_epoch, const std::unordered_map<std::string, Donation>& lookup_table, Donation& out_donation) {
        while (!empty()) {
            Donation candidate = pop();
            auto it = lookup_table.find(candidate.id);
            if (it == lookup_table.end()) {
                continue; // Stale or deleted
            }
            const Donation& current = it->second;
            if (current.status != "AVAILABLE" && current.status != "PARTIALLY_ALLOCATED") {
                continue; // Stale status (fully allocated, unavailable, etc.)
            }
            if (current.quantity <= 0.0) {
                continue; // No quantity remaining
            }
            if (current.expiry_epoch <= current_epoch) {
                continue; // Already expired
            }
            out_donation = current;
            return true;
        }
        return false;
    }

    // Return the internal array of donations
    std::vector<Donation> get_array() const {
        return heap_array_;
    }

    // Rebuild heap from active donations list
    void rebuild(const std::vector<Donation>& active_donations, int64_t current_epoch) {
        heap_array_.clear();
        for (const auto& d : active_donations) {
            if ((d.status == "AVAILABLE" || d.status == "PARTIALLY_ALLOCATED") &&
                d.quantity > 0.0 &&
                d.expiry_epoch > current_epoch) {
                push(d);
            }
        }
    }

    // Export structure for Algorithm Visualizer
    nlohmann::json get_visualizer_state() const {
        nlohmann::json arr = nlohmann::json::array();
        for (size_t i = 0; i < heap_array_.size(); ++i) {
            nlohmann::json item;
            item["index"] = i;
            item["id"] = heap_array_[i].id;
            item["food_name"] = heap_array_[i].food_name;
            item["quantity"] = heap_array_[i].quantity;
            item["unit"] = heap_array_[i].unit;
            item["expiry_epoch"] = heap_array_[i].expiry_epoch;
            item["expiry_time"] = heap_array_[i].expiry_time;
            item["parent_index"] = (i == 0) ? -1 : (int)((i - 1) / 2);
            item["left_child_index"] = (2 * i + 1 < heap_array_.size()) ? (int)(2 * i + 1) : -1;
            item["right_child_index"] = (2 * i + 2 < heap_array_.size()) ? (int)(2 * i + 2) : -1;
            arr.push_back(item);
        }
        return arr;
    }
};

} // namespace FoodRescue
