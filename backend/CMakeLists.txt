cmake_minimum_required(VERSION 3.15)
project(FoodRescueDSA VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include src)

add_library(sqlite3 STATIC include/sqlite3.c)

add_executable(food_rescue_backend src/main.cpp)
target_link_libraries(food_rescue_backend PRIVATE sqlite3 ws2_32 wsock32 crypt32)

add_executable(run_tests tests/run_tests.cpp)
target_link_libraries(run_tests PRIVATE sqlite3 ws2_32 wsock32 crypt32)
