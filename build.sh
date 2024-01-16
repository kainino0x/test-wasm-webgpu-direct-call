#!/bin/bash
set -euo pipefail

emcc --clear-cache
emcc -sUSE_WEBGPU -O3 main.cpp -o index.html --closure=1 -sREFERENCE_TYPES
