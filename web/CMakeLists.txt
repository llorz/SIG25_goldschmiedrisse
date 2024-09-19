cmake_minimum_required(VERSION 3.0.0)
include(FetchContent)
 
project(native_utils)
 
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
 
# Eigen3
find_package(Eigen3 QUIET)
if(NOT TARGET Eigen3::Eigen)
  # Eigen not found, fetch it from gitlab.
  FetchContent_Declare(
    Eigen3
    GIT_REPOSITORY https://gitlab.com/libeigen/eigen.git
    GIT_TAG 3.4.0
    SOURCE_SUBDIR cmake # Hack to avoid Eigen's CMakeLists.txt
  )
  FetchContent_MakeAvailable(Eigen3)
  add_library(Eigen3::Eigen INTERFACE IMPORTED)
  set_target_properties(Eigen3::Eigen PROPERTIES INTERFACE_INCLUDE_DIRECTORIES
                                                 ${eigen3_SOURCE_DIR})
endif() 
SET(LIBIGL_RESTRICTED_TRIANGLE ON)
FetchContent_Declare(
  libigl
  GIT_REPOSITORY https://github.com/libigl/libigl.git
  GIT_TAG v2.5.0)

FetchContent_MakeAvailable(libigl)

file(GLOB SRC_FILES cpp/*.cpp)
add_executable(${PROJECT_NAME} ${SRC_FILES})
target_link_libraries(${PROJECT_NAME} PUBLIC Eigen3::Eigen igl::core igl_restricted::triangle)

target_link_options(${PROJECT_NAME} PRIVATE -sMODULARIZE -sEXPORT_NAME="createModule" --bind  -sWASM=1 -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=5MB  -sNO_EXIT_RUNTIME=0 -sASSERTIONS=1)

add_custom_command(TARGET ${PROJECT_NAME}
POST_BUILD
COMMAND echo 'export default createModule;' >> ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.js)
add_custom_command(TARGET ${PROJECT_NAME}
POST_BUILD
COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.js ${CMAKE_CURRENT_SOURCE_DIR}/)
add_custom_command(TARGET ${PROJECT_NAME}
POST_BUILD
COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.wasm ${CMAKE_CURRENT_SOURCE_DIR}/)