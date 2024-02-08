#!/bin/bash
set -euo pipefail

FLAGS=()
FLAGS+=(--shell-file=shell.html.txt)
#FLAGS+=(-O0 -g)
FLAGS+=(-O3 -g2) # -g2 should not add any WASM overhead but keep unminified JS
#FLAGS+=(-flto) # FIXME: -flto not working with reference types: "invalid relocation data index"
#FLAGS+=(--closure=1) # probably doesn't affect benchmark, hard to debug
FLAGS+=(-sUSE_WEBGPU)
FLAGS+=(-sREFERENCE_TYPES) # new experimental flag that sets -mreference-types
#FLAGS+=(-v)

set -x

emcc --clear-cache
emcc animometer.cpp -o animometer.html "${FLAGS[@]}" -sINITIAL_MEMORY=400MB
emcc main.cpp -o noop-loop-nojs.html                                 -DBENCH_MODE_NoOp_NoJS=1                                      "${FLAGS[@]}"
emcc main.cpp -o noop-loop-jsbyexternref.html                        -DBENCH_MODE_NoOp_JSByExternref=1                             "${FLAGS[@]}"
emcc main.cpp -o noop-loop-jsbyindex.html                            -DBENCH_MODE_NoOp_JSByIndex=1                                 "${FLAGS[@]}"
emcc main.cpp -o MultiNoOp_LoopInWasmManyLookup_NoJS.html            -DBENCH_MODE_MultiNoOp_LoopInWasmManyLookup_NoJS=1            "${FLAGS[@]}"
emcc main.cpp -o MultiNoOp_LoopInWasmManyLookup_JSByExternref.html   -DBENCH_MODE_MultiNoOp_LoopInWasmManyLookup_JSByExternref=1   "${FLAGS[@]}"
emcc main.cpp -o MultiNoOp_LoopInWasmSingleLookup_NoJS.html          -DBENCH_MODE_MultiNoOp_LoopInWasmSingleLookup_NoJS=1          "${FLAGS[@]}"
emcc main.cpp -o MultiNoOp_LoopInWasmSingleLookup_JSByExternref.html -DBENCH_MODE_MultiNoOp_LoopInWasmSingleLookup_JSByExternref=1 "${FLAGS[@]}"
emcc main.cpp -o MultiNoOp_LoopInJS_JSByExternref.html               -DBENCH_MODE_MultiNoOp_LoopInJS_JSByExternref=1               "${FLAGS[@]}"
emcc main.cpp -o     draw-loop.html               -DBENCH_MODE_DRAW=1                     "${FLAGS[@]}"
emcc main.cpp -o set-draw-loop.html               -DBENCH_MODE_SET_DRAW=1                 "${FLAGS[@]}"
