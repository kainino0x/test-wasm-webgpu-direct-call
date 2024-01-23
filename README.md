build of a small experimental benchmark project

built with emscripten branch:
<https://github.com/emscripten-core/emscripten/compare/main...kainino0x:webgputable>

and uses a hack to enable COOP/COEP so that performance.now() won't be coarsened.

- `noop-loop-*`: calls GPURenderPassEncoder.noOp() in a tight loop
  (requires [chrome patch](https://chromium-review.googlesource.com/c/chromium/src/+/5202542)). Variants:
    - [noop-loop-nojs.html](noop-loop-nojs.html): Calls using externref **without** a JS trampoline
    - [noop-loop-jsbyexternref.html](noop-loop-jsbyexternref.html): Calls using externref **with** a JS trampoline
    - [noop-loop-jsbyindex.html](noop-loop-jsbyindex.html): Calls using the classic style table-lookup JS trampoline
- [draw-loop.html](draw-loop.html): calls GPURenderPassEncoder.draw() in a tight loop
    - (works on Canary, uses a Wasm Table for GPURenderPassEncoder)
- [set-draw-loop.html](set-draw-loop.html): calls GPURenderPassEncoder.setPipeline()+.draw() in a tight loop for a slightly more realistic render or compute usage pattern (but should really have setBindGroup() calls too)
    - (works on Canary, additionally uses a Wasm Table for GPURenderPipeline)
