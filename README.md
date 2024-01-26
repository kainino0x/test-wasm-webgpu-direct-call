build of a small experimental benchmark project

built with emscripten branch:
<https://github.com/emscripten-core/emscripten/compare/main...kainino0x:webgputable>

and uses a hack to enable COOP/COEP so that performance.now() won't be coarsened.

- `noop-loop-*`:
  Calls GPURenderPassEncoder.noOp() in a tight loop
  (requires [chrome patch](https://chromium-review.googlesource.com/c/chromium/src/+/5202542)).
  Variants:
    - [noop-loop-nojs.html](noop-loop-nojs.html):
      Calls using externref **without** a JS trampoline.
    - [noop-loop-jsbyexternref.html](noop-loop-jsbyexternref.html):
      Calls using externref **with** a JS trampoline.
    - [noop-loop-jsbyindex.html](noop-loop-jsbyindex.html):
      Calls using the classic style table-lookup JS trampoline.
- [MultiNoOp_LoopInWasmManyLookup_NoJS.html](MultiNoOp_LoopInWasmManyLookup_NoJS.html):
  Loop in Wasm, but inside the library so there's no Wasm-to-Wasm call. Call into the browser **without** a JS trampoline.
- [MultiNoOp_LoopInWasmManyLookup_JSByExternref.html](MultiNoOp_LoopInWasmManyLookup_JSByExternref.html):
  Loop in Wasm, but inside the library so there's no Wasm-to-Wasm call. Call into the browser **with** a JS trampoline.
- [MultiNoOp_LoopInWasmSingleLookup_NoJS.html](MultiNoOp_LoopInWasmSingleLookup_NoJS.html):
  Loop in Wasm, but with only a single table lookup instead of one per iteration. Call into the browser **without** a JS trampoline.
- [MultiNoOp_LoopInWasmSingleLookup_JSByExternref.html](MultiNoOp_LoopInWasmSingleLookup_JSByExternref.html):
  Loop in Wasm, but with only a single table lookup instead of one per iteration. Call into the browser **with** a JS trampoline.
- [MultiNoOp_LoopInJS_JSByExternref.html](MultiNoOp_LoopInJS_JSByExternref.html):
  Calls (using externref) into a JS function which calls GPURenderPassEncoder.noOp() in a JS loop.
- [draw-loop.html](draw-loop.html):
  Calls GPURenderPassEncoder.draw() in a tight loop
    - (works on Canary, uses a Wasm Table for GPURenderPassEncoder)
- [set-draw-loop.html](set-draw-loop.html):
  Calls GPURenderPassEncoder.setPipeline()+.draw() in a tight loop for a slightly more realistic render or compute usage pattern (but should really have setBindGroup() calls too)
    - (works on Canary, additionally uses a Wasm Table for GPURenderPipeline)
