#pragma once
#include <emscripten/bind.h>


emscripten::val intersect_beziers_with_symmetry(emscripten::val a, emscripten::val b,
                                    int symmetry, emscripten::val ref_symmetry);