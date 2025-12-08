cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Force C++17 instead of C++20 for compatibility
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_compile_definitions(
    FOLLY_NO_CONFIG=1
    FOLLY_MOBILE=1
    FOLLY_USE_LIBCPP=1
    FOLLY_CFG_NO_COROUTINES=1
)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)