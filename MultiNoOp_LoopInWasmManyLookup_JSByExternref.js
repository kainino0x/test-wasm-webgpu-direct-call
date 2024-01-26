var Module = typeof Module != "undefined" ? Module : {};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var nodePath = require("path");
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 read_ = (filename, binary) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  return fs.readFileSync(filename, binary ? undefined : "utf8");
 };
 readBinary = filename => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  return ret;
 };
 readAsync = (filename, onload, onerror, binary = true) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
   if (err) onerror(err); else onload(binary ? data.buffer : data);
  });
 };
 if (!Module["thisProgram"] && process.argv.length > 1) {
  thisProgram = process.argv[1].replace(/\\/g, "/");
 }
 arguments_ = process.argv.slice(2);
 if (typeof module != "undefined") {
  module["exports"] = Module;
 }
 process.on("uncaughtException", ex => {
  if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
   throw ex;
  }
 });
 quit_ = (status, toThrow) => {
  process.exitCode = status;
  throw toThrow;
 };
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.startsWith("blob:")) {
  scriptDirectory = "";
 } else {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 }
 {
  read_ = url => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

/** @type {function(*, string=)} */ function assert(condition, text) {
 if (!condition) {
  abort(text);
 }
}

var /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /** @type {!Float64Array} */ HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function addRunDependency(id) {
 runDependencies++;
 Module["monitorRunDependencies"]?.(runDependencies);
}

function removeRunDependency(id) {
 runDependencies--;
 Module["monitorRunDependencies"]?.(runDependencies);
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

/** @param {string|number=} what */ function abort(what) {
 Module["onAbort"]?.(what);
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what += ". Build with -sASSERTIONS for more info.";
 /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

var wasmBinaryFile;

wasmBinaryFile = "MultiNoOp_LoopInWasmManyLookup_JSByExternref.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinarySync(file) {
 if (file == wasmBinaryFile && wasmBinary) {
  return new Uint8Array(wasmBinary);
 }
 if (readBinary) {
  return readBinary(file);
 }
 throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function" && !isFileURI(binaryFile)) {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(response => {
    if (!response["ok"]) {
     throw `failed to load wasm binary file at '${binaryFile}'`;
    }
    return response["arrayBuffer"]();
   }).catch(() => getBinarySync(binaryFile));
  } else if (readAsync) {
   return new Promise((resolve, reject) => {
    readAsync(binaryFile, response => resolve(new Uint8Array(/** @type{!ArrayBuffer} */ (response))), reject);
   });
  }
 }
 return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
 return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(instance => instance).then(receiver, reason => {
  err(`failed to asynchronously prepare wasm: ${reason}`);
  abort(reason);
 });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
 if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
  return fetch(binaryFile, {
   credentials: "same-origin"
  }).then(response => {
   /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
   return result.then(callback, function(reason) {
    err(`wasm streaming compile failed: ${reason}`);
    err("falling back to ArrayBuffer instantiation");
    return instantiateArrayBuffer(binaryFile, imports, callback);
   });
  });
 }
 return instantiateArrayBuffer(binaryFile, imports, callback);
}

function createWasm() {
 var info = {
  "a": wasmImports
 };
 /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
  wasmExports = instance.exports;
  wasmMemory = wasmExports["U"];
  updateMemoryViews();
  wasmTable = wasmExports["W"];
  addOnInit(wasmExports["V"]);
  removeRunDependency("wasm-instantiate");
  return wasmExports;
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiationResult(result) {
  receiveInstance(result["instance"]);
 }
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err(`Module.instantiateWasm callback failed with error: ${e}`);
   return false;
  }
 }
 instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
 return {};
}

var tempDouble;

var tempI64;

/** @constructor */ function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = `Program terminated with exit(${status})`;
 this.status = status;
}

var callRuntimeCallbacks = callbacks => {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
};

var noExitRuntime = Module["noExitRuntime"] || true;

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode(((u0 & 31) << 6) | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
  } else {
   u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
  }
 }
 return str;
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";

var ___assert_fail = (condition, filename, line, func) => {
 abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
};

var nowIsMonotonic = 1;

var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;

var _abort = () => {
 abort("");
};

var _emscripten_get_now;

_emscripten_get_now = () => performance.now();

var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

var abortOnCannotGrowMemory = requestedSize => {
 abort("OOM");
};

var _emscripten_resize_heap = requestedSize => {
 var oldSize = HEAPU8.length;
 requestedSize >>>= 0;
 abortOnCannotGrowMemory(requestedSize);
};

var handleException = e => {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 quit_(1, e);
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var SYSCALLS = {
 varargs: undefined,
 get() {
  var ret = HEAP32[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
 },
 getp() {
  return SYSCALLS.get();
 },
 getStr(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

var _proc_exit = code => {
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  Module["onExit"]?.(code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
};

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
 EXITSTATUS = status;
 _proc_exit(status);
};

var _exit = exitJS;

var maybeExit = () => {
 if (!keepRuntimeAlive()) {
  try {
   _exit(EXITSTATUS);
  } catch (e) {
   handleException(e);
  }
 }
};

var callUserCallback = func => {
 if (ABORT) {
  return;
 }
 try {
  func();
  maybeExit();
 } catch (e) {
  handleException(e);
 }
};

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => setTimeout(() => {
 callUserCallback(func);
}, timeout);

var warnOnce = text => {
 warnOnce.shown ||= {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
};

var preloadPlugins = Module["preloadPlugins"] || [];

var Browser = {
 mainLoop: {
  running: false,
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   callUserCallback(func);
   Module["postMainLoop"]?.();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init() {
  if (Browser.initted) return;
  Browser.initted = true;
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = new Blob([ byteArray ], {
    type: Browser.getMimetype(name)
   });
   if (b.size !== byteArray.length) {
    b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
     type: Browser.getMimetype(name)
    });
   }
   var url = URL.createObjectURL(b);
   var img = new Image;
   img.onload = () => {
    assert(img.complete, `Image ${name} could not be decoded`);
    var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    preloadedImages[name] = canvas;
    URL.revokeObjectURL(url);
    onload?.(byteArray);
   };
   img.onerror = event => {
    err(`Image ${url} could not be decoded`);
    onerror?.();
   };
   img.src = url;
  };
  preloadPlugins.push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    preloadedAudios[name] = audio;
    onload?.(byteArray);
   }
   var b = new Blob([ byteArray ], {
    type: Browser.getMimetype(name)
   });
   var url = URL.createObjectURL(b);
   var audio = new Audio;
   audio.addEventListener("canplaythrough", () => finish(audio), false);
   audio.onerror = function audio_onerror(event) {
    if (done) return;
    err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
    function encode64(data) {
     var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
     var PAD = "=";
     var ret = "";
     var leftchar = 0;
     var leftbits = 0;
     for (var i = 0; i < data.length; i++) {
      leftchar = (leftchar << 8) | data[i];
      leftbits += 8;
      while (leftbits >= 6) {
       var curr = (leftchar >> (leftbits - 6)) & 63;
       leftbits -= 6;
       ret += BASE[curr];
      }
     }
     if (leftbits == 2) {
      ret += BASE[(leftchar & 3) << 4];
      ret += PAD + PAD;
     } else if (leftbits == 4) {
      ret += BASE[(leftchar & 15) << 2];
      ret += PAD;
     }
     return ret;
    }
    audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
    finish(audio);
   };
   audio.src = url;
   safeSetTimeout(() => {
    finish(audio);
   }, 1e4);
  };
  preloadPlugins.push(audioPlugin);
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", ev => {
     if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      ev.preventDefault();
     }
    }, false);
   }
  }
 },
 createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false,
    majorVersion: 1
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   if (typeof GL != "undefined") {
    contextHandle = GL.createContext(canvas, contextAttributes);
    if (contextHandle) {
     ctx = GL.getContext(contextHandle).GLctx;
    }
   }
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
   Browser.init();
  }
  return ctx;
 },
 destroyContext(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   }
   Module["onFullScreen"]?.(Browser.isFullscreen);
   Module["onFullscreen"]?.(Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
  canvasContainer.requestFullscreen();
 },
 exitFullscreen() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 },
 requestAnimationFrame(func) {
  if (typeof requestAnimationFrame == "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeSetTimeout(func, timeout) {
  return safeSetTimeout(func, timeout);
 },
 safeRequestAnimationFrame(func) {
  return Browser.requestAnimationFrame(() => {
   callUserCallback(func);
  });
 },
 getMimetype(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 },
 getUserMedia(func) {
  window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  window.getUserMedia(func);
 },
 getMovementX(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 },
 getMouseWheelDelta(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail / 3;
   break;

  case "mousewheel":
   delta = event.wheelDelta / 120;
   break;

  case "wheel":
   delta = event.deltaY;
   switch (event.deltaMode) {
   case 0:
    delta /= 100;
    break;

   case 1:
    delta /= 3;
    break;

   case 2:
    delta *= 80;
    break;

   default:
    throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
   }
   break;

  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 },
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseCoords(pageX, pageY) {
  var rect = Module["canvas"].getBoundingClientRect();
  var cw = Module["canvas"].width;
  var ch = Module["canvas"].height;
  var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
  var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
  var adjustedX = pageX - (scrollX + rect.left);
  var adjustedY = pageY - (scrollY + rect.top);
  adjustedX = adjustedX * (cw / rect.width);
  adjustedY = adjustedY * (ch / rect.height);
  return {
   x: adjustedX,
   y: adjustedY
  };
 },
 setMouseCoords(pageX, pageY) {
  const {x: x, y: y} = Browser.calculateMouseCoords(pageX, pageY);
  Browser.mouseMovementX = x - Browser.mouseX;
  Browser.mouseMovementY = y - Browser.mouseY;
  Browser.mouseX = x;
  Browser.mouseY = y;
 },
 calculateMouseEvent(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && ("mozMovementX" in event)) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     last ||= coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   Browser.setMouseCoords(event.pageX, event.pageY);
  }
 },
 resizeListeners: [],
 updateResizeListeners() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
 },
 setCanvasSize(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[((SDL.screen) >> 2)];
   flags = flags | 8388608;
   HEAP32[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[((SDL.screen) >> 2)];
   flags = flags & ~8388608;
   HEAP32[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if (((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode) && (typeof screen != "undefined")) {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }
};

var _emscripten_set_main_loop_timing = (mode, value) => {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (!Browser.mainLoop.running) {
  Browser.mainLoop.running = true;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
   setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (typeof Browser.setImmediate == "undefined") {
   if (typeof setImmediate == "undefined") {
    var setImmediates = [];
    var emscriptenMainLoopMessageId = "setimmediate";
    /** @param {Event} event */ var Browser_setImmediate_messageHandler = event => {
     if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
      event.stopPropagation();
      setImmediates.shift()();
     }
    };
    addEventListener("message", Browser_setImmediate_messageHandler, true);
    Browser.setImmediate = /** @type{function(function(): ?, ...?): number} */ (function Browser_emulated_setImmediate(func) {
     setImmediates.push(func);
     if (ENVIRONMENT_IS_WORKER) {
      if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
      Module["setImmediates"].push(func);
      postMessage({
       target: emscriptenMainLoopMessageId
      });
     } else postMessage(emscriptenMainLoopMessageId, "*");
    });
   } else {
    Browser.setImmediate = setImmediate;
   }
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   Browser.setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
};

/**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */ var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = browserIterationFunc;
 Browser.mainLoop.arg = arg;
 /** @type{number} */ var thisMainLoopId = (() => Browser.mainLoop.currentlyRunningMainloop)();
 function checkIsRunning() {
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
   return false;
  }
  return true;
 }
 Browser.mainLoop.running = false;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   Browser.mainLoop.updateStatus();
   if (!checkIsRunning()) return;
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (!checkIsRunning()) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  } else if (Browser.mainLoop.timingMode == 0) {
   Browser.mainLoop.tickStartTime = _emscripten_get_now();
  }
  Browser.mainLoop.runIter(browserIterationFunc);
  if (!checkIsRunning()) return;
  if (typeof SDL == "object") SDL.audio?.queueNewAudioData?.();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) {
   _emscripten_set_main_loop_timing(0, 1e3 / fps);
  } else {
   _emscripten_set_main_loop_timing(1, 1);
  }
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
};

var wasmTableMirror = [];

var wasmTable;

var getWasmTableEntry = funcPtr => {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 return func;
};

var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
 var browserIterationFunc = getWasmTableEntry(func);
 setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
};

var withStackSave = f => {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
};

var lengthBytesUTF8 = str => {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | (u >> 6);
   heap[outIdx++] = 128 | (u & 63);
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | (u >> 12);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | (u >> 18);
   heap[outIdx++] = 128 | ((u >> 12) & 63);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
};

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);

var stringToUTF8OnStack = str => {
 var size = lengthBytesUTF8(str) + 1;
 var ret = stackAlloc(size);
 stringToUTF8(str, ret, size);
 return ret;
};

var WebGPU = {
 errorCallback: (callback, type, message, userdata) => {
  withStackSave(() => {
   var messagePtr = stringToUTF8OnStack(message);
   getWasmTableEntry(callback)(type, messagePtr, userdata);
  });
 },
 initManagers: () => {
  if (WebGPU.mgrDevice) return;
  /** @constructor */ function Manager() {
   this.objects = {};
   this.nextId = 1;
   this.freelist = [];
   this.create = function(object, wrapper = {}) {
    var id;
    if (this.freelist.length) {
     id = this.freelist.pop();
    } else {
     id = this.nextId++;
    }
    wrapper.refcount = 1;
    wrapper.object = object;
    this.objects[id] = wrapper;
    return id;
   };
   this.get = function(id) {
    if (!id) return undefined;
    var o = this.objects[id];
    return o.object;
   };
   this.reference = function(id) {
    var o = this.objects[id];
    o.refcount++;
   };
   this.release = function(id) {
    var o = this.objects[id];
    o.refcount--;
    if (o.refcount <= 0) {
     delete this.objects[id];
     this.freelist.push(id);
    }
   };
  }
  WebGPU.mgrSurface = WebGPU.mgrSurface || new Manager;
  WebGPU.mgrSwapChain = WebGPU.mgrSwapChain || new Manager;
  WebGPU.mgrAdapter = WebGPU.mgrAdapter || new Manager;
  WebGPU.mgrDevice = WebGPU.mgrDevice || new Manager;
  WebGPU.mgrQueue = WebGPU.mgrQueue || new Manager;
  WebGPU.mgrCommandBuffer = WebGPU.mgrCommandBuffer || new Manager;
  WebGPU.mgrCommandEncoder = WebGPU.mgrCommandEncoder || new Manager;
  WebGPU.mgrRenderPassEncoder = WebGPU.mgrRenderPassEncoder || new Manager;
  WebGPU.mgrComputePassEncoder = WebGPU.mgrComputePassEncoder || new Manager;
  WebGPU.mgrBindGroup = WebGPU.mgrBindGroup || new Manager;
  WebGPU.mgrBuffer = WebGPU.mgrBuffer || new Manager;
  WebGPU.mgrSampler = WebGPU.mgrSampler || new Manager;
  WebGPU.mgrTexture = WebGPU.mgrTexture || new Manager;
  WebGPU.mgrTextureView = WebGPU.mgrTextureView || new Manager;
  WebGPU.mgrQuerySet = WebGPU.mgrQuerySet || new Manager;
  WebGPU.mgrBindGroupLayout = WebGPU.mgrBindGroupLayout || new Manager;
  WebGPU.mgrPipelineLayout = WebGPU.mgrPipelineLayout || new Manager;
  WebGPU.mgrRenderPipeline = WebGPU.mgrRenderPipeline || new Manager;
  WebGPU.mgrComputePipeline = WebGPU.mgrComputePipeline || new Manager;
  WebGPU.mgrShaderModule = WebGPU.mgrShaderModule || new Manager;
  WebGPU.mgrRenderBundleEncoder = WebGPU.mgrRenderBundleEncoder || new Manager;
  WebGPU.mgrRenderBundle = WebGPU.mgrRenderBundle || new Manager;
 },
 makeColor: ptr => ({
  "r": HEAPF64[((ptr) >> 3)],
  "g": HEAPF64[(((ptr) + (8)) >> 3)],
  "b": HEAPF64[(((ptr) + (16)) >> 3)],
  "a": HEAPF64[(((ptr) + (24)) >> 3)]
 }),
 makeExtent3D: ptr => ({
  "width": HEAPU32[((ptr) >> 2)],
  "height": HEAPU32[(((ptr) + (4)) >> 2)],
  "depthOrArrayLayers": HEAPU32[(((ptr) + (8)) >> 2)]
 }),
 makeOrigin3D: ptr => ({
  "x": HEAPU32[((ptr) >> 2)],
  "y": HEAPU32[(((ptr) + (4)) >> 2)],
  "z": HEAPU32[(((ptr) + (8)) >> 2)]
 }),
 makeImageCopyTexture: ptr => ({
  "texture": WebGPU.mgrTexture.get(HEAPU32[(((ptr) + (4)) >> 2)]),
  "mipLevel": HEAPU32[(((ptr) + (8)) >> 2)],
  "origin": WebGPU.makeOrigin3D(ptr + 12),
  "aspect": WebGPU.TextureAspect[HEAPU32[(((ptr) + (24)) >> 2)]]
 }),
 makeTextureDataLayout: ptr => {
  var bytesPerRow = HEAPU32[(((ptr) + (16)) >> 2)];
  var rowsPerImage = HEAPU32[(((ptr) + (20)) >> 2)];
  return {
   "offset": HEAPU32[((((ptr + 4)) + (8)) >> 2)] * 4294967296 + HEAPU32[(((ptr) + (8)) >> 2)],
   "bytesPerRow": bytesPerRow === 4294967295 ? undefined : bytesPerRow,
   "rowsPerImage": rowsPerImage === 4294967295 ? undefined : rowsPerImage
  };
 },
 makeImageCopyBuffer: ptr => {
  var layoutPtr = ptr + 8;
  var bufferCopyView = WebGPU.makeTextureDataLayout(layoutPtr);
  bufferCopyView["buffer"] = WebGPU.mgrBuffer.get(HEAPU32[(((ptr) + (32)) >> 2)]);
  return bufferCopyView;
 },
 makePipelineConstants: (constantCount, constantsPtr) => {
  if (!constantCount) return;
  var constants = {};
  for (var i = 0; i < constantCount; ++i) {
   var entryPtr = constantsPtr + 16 * i;
   var key = UTF8ToString(HEAPU32[(((entryPtr) + (4)) >> 2)]);
   constants[key] = HEAPF64[(((entryPtr) + (8)) >> 3)];
  }
  return constants;
 },
 makePipelineLayout: layoutPtr => {
  if (!layoutPtr) return "auto";
  return WebGPU.mgrPipelineLayout.get(layoutPtr);
 },
 makeProgrammableStageDescriptor: ptr => {
  if (!ptr) return undefined;
  var desc = {
   "module": WebGPU.mgrShaderModule.get(HEAPU32[(((ptr) + (4)) >> 2)]),
   "constants": WebGPU.makePipelineConstants(HEAPU32[(((ptr) + (12)) >> 2)], HEAPU32[(((ptr) + (16)) >> 2)])
  };
  var entryPointPtr = HEAPU32[(((ptr) + (8)) >> 2)];
  if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
  return desc;
 },
 Int_BufferMapState: {
  unmapped: 0,
  pending: 1,
  mapped: 2
 },
 Int_CompilationMessageType: {
  error: 0,
  warning: 1,
  info: 2
 },
 Int_DeviceLostReason: {
  undefined: 0,
  destroyed: 1
 },
 Int_PreferredFormat: {
  rgba8unorm: 18,
  bgra8unorm: 23
 },
 WGSLFeatureName: [ , "readonly_and_readwrite_storage_textures", "packed_4x8_integer_dot_product", "unrestricted_pointer_parameters", "pointer_composite_access" ],
 AddressMode: [ , "clamp-to-edge", "repeat", "mirror-repeat" ],
 BlendFactor: [ , "zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant" ],
 BlendOperation: [ , "add", "subtract", "reverse-subtract", "min", "max" ],
 BufferBindingType: [ , "uniform", "storage", "read-only-storage" ],
 BufferMapState: {
  1: "unmapped",
  2: "pending",
  3: "mapped"
 },
 CompareFunction: [ , "never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always" ],
 CompilationInfoRequestStatus: [ "success", "error", "device-lost", "unknown" ],
 CullMode: [ , "none", "front", "back" ],
 ErrorFilter: {
  1: "validation",
  2: "out-of-memory",
  3: "internal"
 },
 FeatureName: [ , "depth-clip-control", "depth32float-stencil8", "timestamp-query", "texture-compression-bc", "texture-compression-etc2", "texture-compression-astc", "indirect-first-instance", "shader-f16", "rg11b10ufloat-renderable", "bgra8unorm-storage", "float32-filterable" ],
 FilterMode: [ , "nearest", "linear" ],
 FrontFace: [ , "ccw", "cw" ],
 IndexFormat: [ , "uint16", "uint32" ],
 LoadOp: [ , "clear", "load" ],
 MipmapFilterMode: [ , "nearest", "linear" ],
 PowerPreference: [ , "low-power", "high-performance" ],
 PrimitiveTopology: [ , "point-list", "line-list", "line-strip", "triangle-list", "triangle-strip" ],
 QueryType: {
  1: "occlusion",
  2: "timestamp"
 },
 SamplerBindingType: [ , "filtering", "non-filtering", "comparison" ],
 StencilOperation: [ , "keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap" ],
 StorageTextureAccess: [ , "write-only", "read-only", "read-write" ],
 StoreOp: [ , "store", "discard" ],
 TextureAspect: [ , "all", "stencil-only", "depth-only" ],
 TextureDimension: [ , "1d", "2d", "3d" ],
 TextureFormat: [ , "r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32float", "r32uint", "r32sint", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rgb9e5ufloat", "rg32float", "rg32uint", "rg32sint", "rgba16uint", "rgba16sint", "rgba16float", "rgba32float", "rgba32uint", "rgba32sint", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb" ],
 TextureSampleType: [ , "float", "unfilterable-float", "depth", "sint", "uint" ],
 TextureViewDimension: [ , "1d", "2d", "2d-array", "cube", "cube-array", "3d" ],
 VertexFormat: [ , "uint8x2", "uint8x4", "sint8x2", "sint8x4", "unorm8x2", "unorm8x4", "snorm8x2", "snorm8x4", "uint16x2", "uint16x4", "sint16x2", "sint16x4", "unorm16x2", "unorm16x4", "snorm16x2", "snorm16x4", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4", "unorm10-10-10-2" ],
 VertexStepMode: [ , "vertex-buffer-not-used", "vertex", "instance" ],
 FeatureNameString2Enum: {
  undefined: "0",
  "depth-clip-control": "1",
  "depth32float-stencil8": "2",
  "timestamp-query": "3",
  "texture-compression-bc": "4",
  "texture-compression-etc2": "5",
  "texture-compression-astc": "6",
  "indirect-first-instance": "7",
  "shader-f16": "8",
  "rg11b10ufloat-renderable": "9",
  "bgra8unorm-storage": "10",
  "float32-filterable": "11"
 }
};

var _emwgpuCommandEncoderBeginRenderPass = (encoderId, descriptor, idOutPtr) => {
 function makeColorAttachment(caPtr) {
  var viewPtr = HEAPU32[(((caPtr) + (4)) >> 2)];
  if (viewPtr === 0) {
   return undefined;
  }
  var depthSlice = HEAP32[(((caPtr) + (8)) >> 2)];
  if (depthSlice == -1) depthSlice = undefined;
  var loadOpInt = HEAPU32[(((caPtr) + (16)) >> 2)];
  var storeOpInt = HEAPU32[(((caPtr) + (20)) >> 2)];
  var clearValue = WebGPU.makeColor(caPtr + 24);
  return {
   "view": WebGPU.mgrTextureView.get(viewPtr),
   "depthSlice": depthSlice,
   "resolveTarget": WebGPU.mgrTextureView.get(HEAPU32[(((caPtr) + (12)) >> 2)]),
   "clearValue": clearValue,
   "loadOp": WebGPU.LoadOp[loadOpInt],
   "storeOp": WebGPU.StoreOp[storeOpInt]
  };
 }
 function makeColorAttachments(count, caPtr) {
  var attachments = [];
  for (var i = 0; i < count; ++i) {
   attachments.push(makeColorAttachment(caPtr + 56 * i));
  }
  return attachments;
 }
 function makeDepthStencilAttachment(dsaPtr) {
  if (dsaPtr === 0) return undefined;
  return {
   "view": WebGPU.mgrTextureView.get(HEAPU32[((dsaPtr) >> 2)]),
   "depthClearValue": HEAPF32[(((dsaPtr) + (12)) >> 2)],
   "depthLoadOp": WebGPU.LoadOp[HEAPU32[(((dsaPtr) + (4)) >> 2)]],
   "depthStoreOp": WebGPU.StoreOp[HEAPU32[(((dsaPtr) + (8)) >> 2)]],
   "depthReadOnly": !!(HEAPU32[(((dsaPtr) + (16)) >> 2)]),
   "stencilClearValue": HEAPU32[(((dsaPtr) + (28)) >> 2)],
   "stencilLoadOp": WebGPU.LoadOp[HEAPU32[(((dsaPtr) + (20)) >> 2)]],
   "stencilStoreOp": WebGPU.StoreOp[HEAPU32[(((dsaPtr) + (24)) >> 2)]],
   "stencilReadOnly": !!(HEAPU32[(((dsaPtr) + (32)) >> 2)])
  };
 }
 function makeRenderPassTimestampWrites(twPtr) {
  if (twPtr === 0) return undefined;
  return {
   "querySet": WebGPU.mgrQuerySet.get(HEAPU32[((twPtr) >> 2)]),
   "beginningOfPassWriteIndex": HEAPU32[(((twPtr) + (4)) >> 2)],
   "endOfPassWriteIndex": HEAPU32[(((twPtr) + (8)) >> 2)]
  };
 }
 function makeRenderPassDescriptor(descriptor) {
  var nextInChainPtr = HEAPU32[((descriptor) >> 2)];
  var maxDrawCount = undefined;
  if (nextInChainPtr !== 0) {
   var sType = HEAPU32[(((nextInChainPtr) + (4)) >> 2)];
   var renderPassDescriptorMaxDrawCount = nextInChainPtr;
   maxDrawCount = HEAPU32[((((renderPassDescriptorMaxDrawCount + 4)) + (8)) >> 2)] * 4294967296 + HEAPU32[(((renderPassDescriptorMaxDrawCount) + (8)) >> 2)];
  }
  var desc = {
   "label": undefined,
   "colorAttachments": makeColorAttachments(HEAPU32[(((descriptor) + (8)) >> 2)], HEAPU32[(((descriptor) + (12)) >> 2)]),
   "depthStencilAttachment": makeDepthStencilAttachment(HEAPU32[(((descriptor) + (16)) >> 2)]),
   "occlusionQuerySet": WebGPU.mgrQuerySet.get(HEAPU32[(((descriptor) + (20)) >> 2)]),
   "timestampWrites": makeRenderPassTimestampWrites(HEAPU32[(((descriptor) + (24)) >> 2)]),
   "maxDrawCount": maxDrawCount
  };
  var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  return desc;
 }
 var desc = makeRenderPassDescriptor(descriptor);
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 var pass = commandEncoder["beginRenderPass"](desc);
 var id = WebGPU.mgrRenderPassEncoder.create(pass);
 HEAP32[((idOutPtr) >> 2)] = id;
 return pass;
};

var generateRenderPipelineDesc = descriptor => {
 function makePrimitiveState(rsPtr) {
  if (!rsPtr) return undefined;
  return {
   "topology": WebGPU.PrimitiveTopology[HEAPU32[(((rsPtr) + (4)) >> 2)]],
   "stripIndexFormat": WebGPU.IndexFormat[HEAPU32[(((rsPtr) + (8)) >> 2)]],
   "frontFace": WebGPU.FrontFace[HEAPU32[(((rsPtr) + (12)) >> 2)]],
   "cullMode": WebGPU.CullMode[HEAPU32[(((rsPtr) + (16)) >> 2)]]
  };
 }
 function makeBlendComponent(bdPtr) {
  if (!bdPtr) return undefined;
  return {
   "operation": WebGPU.BlendOperation[HEAPU32[((bdPtr) >> 2)]],
   "srcFactor": WebGPU.BlendFactor[HEAPU32[(((bdPtr) + (4)) >> 2)]],
   "dstFactor": WebGPU.BlendFactor[HEAPU32[(((bdPtr) + (8)) >> 2)]]
  };
 }
 function makeBlendState(bsPtr) {
  if (!bsPtr) return undefined;
  return {
   "alpha": makeBlendComponent(bsPtr + 12),
   "color": makeBlendComponent(bsPtr + 0)
  };
 }
 function makeColorState(csPtr) {
  var formatInt = HEAPU32[(((csPtr) + (4)) >> 2)];
  return formatInt === 0 ? undefined : {
   "format": WebGPU.TextureFormat[formatInt],
   "blend": makeBlendState(HEAPU32[(((csPtr) + (8)) >> 2)]),
   "writeMask": HEAPU32[(((csPtr) + (12)) >> 2)]
  };
 }
 function makeColorStates(count, csArrayPtr) {
  var states = [];
  for (var i = 0; i < count; ++i) {
   states.push(makeColorState(csArrayPtr + 16 * i));
  }
  return states;
 }
 function makeStencilStateFace(ssfPtr) {
  return {
   "compare": WebGPU.CompareFunction[HEAPU32[((ssfPtr) >> 2)]],
   "failOp": WebGPU.StencilOperation[HEAPU32[(((ssfPtr) + (4)) >> 2)]],
   "depthFailOp": WebGPU.StencilOperation[HEAPU32[(((ssfPtr) + (8)) >> 2)]],
   "passOp": WebGPU.StencilOperation[HEAPU32[(((ssfPtr) + (12)) >> 2)]]
  };
 }
 function makeDepthStencilState(dssPtr) {
  if (!dssPtr) return undefined;
  return {
   "format": WebGPU.TextureFormat[HEAPU32[(((dssPtr) + (4)) >> 2)]],
   "depthWriteEnabled": !!(HEAPU32[(((dssPtr) + (8)) >> 2)]),
   "depthCompare": WebGPU.CompareFunction[HEAPU32[(((dssPtr) + (12)) >> 2)]],
   "stencilFront": makeStencilStateFace(dssPtr + 16),
   "stencilBack": makeStencilStateFace(dssPtr + 32),
   "stencilReadMask": HEAPU32[(((dssPtr) + (48)) >> 2)],
   "stencilWriteMask": HEAPU32[(((dssPtr) + (52)) >> 2)],
   "depthBias": HEAP32[(((dssPtr) + (56)) >> 2)],
   "depthBiasSlopeScale": HEAPF32[(((dssPtr) + (60)) >> 2)],
   "depthBiasClamp": HEAPF32[(((dssPtr) + (64)) >> 2)]
  };
 }
 function makeVertexAttribute(vaPtr) {
  return {
   "format": WebGPU.VertexFormat[HEAPU32[((vaPtr) >> 2)]],
   "offset": HEAPU32[((((vaPtr + 4)) + (8)) >> 2)] * 4294967296 + HEAPU32[(((vaPtr) + (8)) >> 2)],
   "shaderLocation": HEAPU32[(((vaPtr) + (16)) >> 2)]
  };
 }
 function makeVertexAttributes(count, vaArrayPtr) {
  var vas = [];
  for (var i = 0; i < count; ++i) {
   vas.push(makeVertexAttribute(vaArrayPtr + i * 24));
  }
  return vas;
 }
 function makeVertexBuffer(vbPtr) {
  if (!vbPtr) return undefined;
  var stepModeInt = HEAPU32[(((vbPtr) + (8)) >> 2)];
  return stepModeInt === 1 ? null : {
   "arrayStride": HEAPU32[(((vbPtr + 4)) >> 2)] * 4294967296 + HEAPU32[((vbPtr) >> 2)],
   "stepMode": WebGPU.VertexStepMode[stepModeInt],
   "attributes": makeVertexAttributes(HEAPU32[(((vbPtr) + (12)) >> 2)], HEAPU32[(((vbPtr) + (16)) >> 2)])
  };
 }
 function makeVertexBuffers(count, vbArrayPtr) {
  if (!count) return undefined;
  var vbs = [];
  for (var i = 0; i < count; ++i) {
   vbs.push(makeVertexBuffer(vbArrayPtr + i * 24));
  }
  return vbs;
 }
 function makeVertexState(viPtr) {
  if (!viPtr) return undefined;
  var desc = {
   "module": WebGPU.mgrShaderModule.get(HEAPU32[(((viPtr) + (4)) >> 2)]),
   "constants": WebGPU.makePipelineConstants(HEAPU32[(((viPtr) + (12)) >> 2)], HEAPU32[(((viPtr) + (16)) >> 2)]),
   "buffers": makeVertexBuffers(HEAPU32[(((viPtr) + (20)) >> 2)], HEAPU32[(((viPtr) + (24)) >> 2)])
  };
  var entryPointPtr = HEAPU32[(((viPtr) + (8)) >> 2)];
  if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
  return desc;
 }
 function makeMultisampleState(msPtr) {
  if (!msPtr) return undefined;
  return {
   "count": HEAPU32[(((msPtr) + (4)) >> 2)],
   "mask": HEAPU32[(((msPtr) + (8)) >> 2)],
   "alphaToCoverageEnabled": !!(HEAPU32[(((msPtr) + (12)) >> 2)])
  };
 }
 function makeFragmentState(fsPtr) {
  if (!fsPtr) return undefined;
  var desc = {
   "module": WebGPU.mgrShaderModule.get(HEAPU32[(((fsPtr) + (4)) >> 2)]),
   "constants": WebGPU.makePipelineConstants(HEAPU32[(((fsPtr) + (12)) >> 2)], HEAPU32[(((fsPtr) + (16)) >> 2)]),
   "targets": makeColorStates(HEAPU32[(((fsPtr) + (20)) >> 2)], HEAPU32[(((fsPtr) + (24)) >> 2)])
  };
  var entryPointPtr = HEAPU32[(((fsPtr) + (8)) >> 2)];
  if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
  return desc;
 }
 var desc = {
  "label": undefined,
  "layout": WebGPU.makePipelineLayout(HEAPU32[(((descriptor) + (8)) >> 2)]),
  "vertex": makeVertexState(descriptor + 12),
  "primitive": makePrimitiveState(descriptor + 40),
  "depthStencil": makeDepthStencilState(HEAPU32[(((descriptor) + (60)) >> 2)]),
  "multisample": makeMultisampleState(descriptor + 64),
  "fragment": makeFragmentState(HEAPU32[(((descriptor) + (80)) >> 2)])
 };
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 return desc;
};

var _emwgpuDeviceCreateRenderPipeline = (deviceId, descriptor, idOutPtr) => {
 var desc = generateRenderPipelineDesc(descriptor);
 var device = WebGPU.mgrDevice.get(deviceId);
 var pipeline = device["createRenderPipeline"](desc);
 var id = WebGPU.mgrRenderPipeline.create(pipeline);
 HEAP32[((idOutPtr) >> 2)] = id;
 return pipeline;
};

var _emwgpuRenderPassEncoderNoOp_JSByExternref = (encoder, x) => {
 encoder.noOp(x);
};

var printCharBuffers = [ null, [], [] ];

var printChar = (stream, curr) => {
 var buffer = printCharBuffers[stream];
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
};

var _fd_write = (fd, iov, iovcnt, pnum) => {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = HEAPU32[((iov) >> 2)];
  var len = HEAPU32[(((iov) + (4)) >> 2)];
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, HEAPU8[ptr + j]);
  }
  num += len;
 }
 HEAPU32[((pnum) >> 2)] = num;
 return 0;
};

var _wgpuAdapterRelease = id => WebGPU.mgrAdapter.release(id);

var _wgpuAdapterRequestDevice = (adapterId, descriptor, callback, userdata) => {
 var adapter = WebGPU.mgrAdapter.get(adapterId);
 var desc = {};
 if (descriptor) {
  var requiredFeatureCount = HEAPU32[(((descriptor) + (8)) >> 2)];
  if (requiredFeatureCount) {
   var requiredFeaturesPtr = HEAPU32[(((descriptor) + (12)) >> 2)];
   desc["requiredFeatures"] = Array.from(HEAP32.subarray((requiredFeaturesPtr) >> 2, (requiredFeaturesPtr + requiredFeatureCount * 4) >> 2), feature => WebGPU.FeatureName[feature]);
  }
  var requiredLimitsPtr = HEAPU32[(((descriptor) + (16)) >> 2)];
  if (requiredLimitsPtr) {
   var limitsPtr = requiredLimitsPtr + 8;
   var requiredLimits = {};
   function setLimitU32IfDefined(name, limitOffset) {
    var ptr = limitsPtr + limitOffset;
    var value = HEAPU32[((ptr) >> 2)];
    if (value != 4294967295) {
     requiredLimits[name] = value;
    }
   }
   function setLimitU64IfDefined(name, limitOffset) {
    var ptr = limitsPtr + limitOffset;
    var limitPart1 = HEAPU32[((ptr) >> 2)];
    var limitPart2 = HEAPU32[(((ptr) + (4)) >> 2)];
    if (limitPart1 != 4294967295 || limitPart2 != 4294967295) {
     requiredLimits[name] = HEAPU32[(((ptr + 4)) >> 2)] * 4294967296 + HEAPU32[((ptr) >> 2)];
    }
   }
   setLimitU32IfDefined("maxTextureDimension1D", 0);
   setLimitU32IfDefined("maxTextureDimension2D", 4);
   setLimitU32IfDefined("maxTextureDimension3D", 8);
   setLimitU32IfDefined("maxTextureArrayLayers", 12);
   setLimitU32IfDefined("maxBindGroups", 16);
   setLimitU32IfDefined("maxBindGroupsPlusVertexBuffers", 20);
   setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout", 28);
   setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout", 32);
   setLimitU32IfDefined("maxSampledTexturesPerShaderStage", 36);
   setLimitU32IfDefined("maxSamplersPerShaderStage", 40);
   setLimitU32IfDefined("maxStorageBuffersPerShaderStage", 44);
   setLimitU32IfDefined("maxStorageTexturesPerShaderStage", 48);
   setLimitU32IfDefined("maxUniformBuffersPerShaderStage", 52);
   setLimitU32IfDefined("minUniformBufferOffsetAlignment", 72);
   setLimitU32IfDefined("minStorageBufferOffsetAlignment", 76);
   setLimitU64IfDefined("maxUniformBufferBindingSize", 56);
   setLimitU64IfDefined("maxStorageBufferBindingSize", 64);
   setLimitU32IfDefined("maxVertexBuffers", 80);
   setLimitU32IfDefined("maxVertexAttributes", 96);
   setLimitU32IfDefined("maxVertexBufferArrayStride", 100);
   setLimitU32IfDefined("maxInterStageShaderComponents", 104);
   setLimitU32IfDefined("maxInterStageShaderVariables", 108);
   setLimitU32IfDefined("maxColorAttachments", 112);
   setLimitU32IfDefined("maxComputeWorkgroupStorageSize", 120);
   setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup", 124);
   setLimitU32IfDefined("maxComputeWorkgroupSizeX", 128);
   setLimitU32IfDefined("maxComputeWorkgroupSizeY", 132);
   setLimitU32IfDefined("maxComputeWorkgroupSizeZ", 136);
   setLimitU32IfDefined("maxComputeWorkgroupsPerDimension", 140);
   desc["requiredLimits"] = requiredLimits;
  }
  var defaultQueuePtr = HEAPU32[(((descriptor) + (20)) >> 2)];
  if (defaultQueuePtr) {
   var defaultQueueDesc = {};
   var labelPtr = HEAPU32[(((defaultQueuePtr) + (4)) >> 2)];
   if (labelPtr) defaultQueueDesc["label"] = UTF8ToString(labelPtr);
   desc["defaultQueue"] = defaultQueueDesc;
  }
  var deviceLostCallbackPtr = HEAPU32[(((descriptor) + (28)) >> 2)];
  var deviceLostUserdataPtr = HEAPU32[(((descriptor) + (32)) >> 2)];
  var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 }
 adapter["requestDevice"](desc).then(device => {
  callUserCallback(() => {
   var deviceWrapper = {
    queueId: WebGPU.mgrQueue.create(device["queue"])
   };
   var deviceId = WebGPU.mgrDevice.create(device, deviceWrapper);
   if (deviceLostCallbackPtr) {
    device["lost"].then(info => {
     callUserCallback(() => WebGPU.errorCallback(deviceLostCallbackPtr, WebGPU.Int_DeviceLostReason[info.reason], info.message, deviceLostUserdataPtr));
    });
   }
   getWasmTableEntry(callback)(0, deviceId, 0, userdata);
  });
 }, function(ex) {
  callUserCallback(() => {
   withStackSave(() => {
    var messagePtr = stringToUTF8OnStack(ex.message);
    getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
   });
  });
 });
};

var _wgpuBindGroupLayoutReference = id => WebGPU.mgrBindGroupLayout.reference(id);

var _wgpuBindGroupLayoutRelease = id => WebGPU.mgrBindGroupLayout.release(id);

var _wgpuBindGroupRelease = id => WebGPU.mgrBindGroup.release(id);

var _wgpuCommandBufferRelease = id => WebGPU.mgrCommandBuffer.release(id);

var _wgpuCommandEncoderFinish = (encoderId, descriptor) => {
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 return WebGPU.mgrCommandBuffer.create(commandEncoder["finish"]());
};

var _wgpuCommandEncoderRelease = id => WebGPU.mgrCommandEncoder.release(id);

var readI53FromI64 = ptr => HEAPU32[((ptr) >> 2)] + HEAP32[(((ptr) + (4)) >> 2)] * 4294967296;

var _wgpuDeviceCreateBindGroup = (deviceId, descriptor) => {
 function makeEntry(entryPtr) {
  var bufferId = HEAPU32[(((entryPtr) + (8)) >> 2)];
  var samplerId = HEAPU32[(((entryPtr) + (32)) >> 2)];
  var textureViewId = HEAPU32[(((entryPtr) + (36)) >> 2)];
  var binding = HEAPU32[(((entryPtr) + (4)) >> 2)];
  if (bufferId) {
   var size = readI53FromI64((entryPtr) + (24));
   if (size == -1) size = undefined;
   return {
    "binding": binding,
    "resource": {
     "buffer": WebGPU.mgrBuffer.get(bufferId),
     "offset": HEAPU32[((((entryPtr + 4)) + (16)) >> 2)] * 4294967296 + HEAPU32[(((entryPtr) + (16)) >> 2)],
     "size": size
    }
   };
  } else if (samplerId) {
   return {
    "binding": binding,
    "resource": WebGPU.mgrSampler.get(samplerId)
   };
  } else {
   return {
    "binding": binding,
    "resource": WebGPU.mgrTextureView.get(textureViewId)
   };
  }
 }
 function makeEntries(count, entriesPtrs) {
  var entries = [];
  for (var i = 0; i < count; ++i) {
   entries.push(makeEntry(entriesPtrs + 40 * i));
  }
  return entries;
 }
 var desc = {
  "label": undefined,
  "layout": WebGPU.mgrBindGroupLayout.get(HEAPU32[(((descriptor) + (8)) >> 2)]),
  "entries": makeEntries(HEAPU32[(((descriptor) + (12)) >> 2)], HEAPU32[(((descriptor) + (16)) >> 2)])
 };
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrBindGroup.create(device["createBindGroup"](desc));
};

var _wgpuDeviceCreateBindGroupLayout = (deviceId, descriptor) => {
 function makeBufferEntry(entryPtr) {
  var typeInt = HEAPU32[(((entryPtr) + (4)) >> 2)];
  if (!typeInt) return undefined;
  return {
   "type": WebGPU.BufferBindingType[typeInt],
   "hasDynamicOffset": !!(HEAPU32[(((entryPtr) + (8)) >> 2)]),
   "minBindingSize": HEAPU32[((((entryPtr + 4)) + (16)) >> 2)] * 4294967296 + HEAPU32[(((entryPtr) + (16)) >> 2)]
  };
 }
 function makeSamplerEntry(entryPtr) {
  var typeInt = HEAPU32[(((entryPtr) + (4)) >> 2)];
  if (!typeInt) return undefined;
  return {
   "type": WebGPU.SamplerBindingType[typeInt]
  };
 }
 function makeTextureEntry(entryPtr) {
  var sampleTypeInt = HEAPU32[(((entryPtr) + (4)) >> 2)];
  if (!sampleTypeInt) return undefined;
  return {
   "sampleType": WebGPU.TextureSampleType[sampleTypeInt],
   "viewDimension": WebGPU.TextureViewDimension[HEAPU32[(((entryPtr) + (8)) >> 2)]],
   "multisampled": !!(HEAPU32[(((entryPtr) + (12)) >> 2)])
  };
 }
 function makeStorageTextureEntry(entryPtr) {
  var accessInt = HEAPU32[(((entryPtr) + (4)) >> 2)];
  if (!accessInt) return undefined;
  return {
   "access": WebGPU.StorageTextureAccess[accessInt],
   "format": WebGPU.TextureFormat[HEAPU32[(((entryPtr) + (8)) >> 2)]],
   "viewDimension": WebGPU.TextureViewDimension[HEAPU32[(((entryPtr) + (12)) >> 2)]]
  };
 }
 function makeEntry(entryPtr) {
  return {
   "binding": HEAPU32[(((entryPtr) + (4)) >> 2)],
   "visibility": HEAPU32[(((entryPtr) + (8)) >> 2)],
   "buffer": makeBufferEntry(entryPtr + 16),
   "sampler": makeSamplerEntry(entryPtr + 40),
   "texture": makeTextureEntry(entryPtr + 48),
   "storageTexture": makeStorageTextureEntry(entryPtr + 64)
  };
 }
 function makeEntries(count, entriesPtrs) {
  var entries = [];
  for (var i = 0; i < count; ++i) {
   entries.push(makeEntry(entriesPtrs + 80 * i));
  }
  return entries;
 }
 var desc = {
  "entries": makeEntries(HEAPU32[(((descriptor) + (8)) >> 2)], HEAPU32[(((descriptor) + (12)) >> 2)])
 };
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrBindGroupLayout.create(device["createBindGroupLayout"](desc));
};

var _wgpuDeviceCreateCommandEncoder = (deviceId, descriptor) => {
 var desc;
 if (descriptor) {
  desc = {
   "label": undefined
  };
  var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 }
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrCommandEncoder.create(device["createCommandEncoder"](desc));
};

var _wgpuDeviceCreatePipelineLayout = (deviceId, descriptor) => {
 var bglCount = HEAPU32[(((descriptor) + (8)) >> 2)];
 var bglPtr = HEAPU32[(((descriptor) + (12)) >> 2)];
 var bgls = [];
 for (var i = 0; i < bglCount; ++i) {
  bgls.push(WebGPU.mgrBindGroupLayout.get(HEAPU32[(((bglPtr) + (4 * i)) >> 2)]));
 }
 var desc = {
  "label": undefined,
  "bindGroupLayouts": bgls
 };
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrPipelineLayout.create(device["createPipelineLayout"](desc));
};

var _wgpuDeviceCreateShaderModule = (deviceId, descriptor) => {
 var nextInChainPtr = HEAPU32[((descriptor) >> 2)];
 var sType = HEAPU32[(((nextInChainPtr) + (4)) >> 2)];
 var desc = {
  "label": undefined,
  "code": ""
 };
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 switch (sType) {
 case 5:
  {
   var count = HEAPU32[(((nextInChainPtr) + (8)) >> 2)];
   var start = HEAPU32[(((nextInChainPtr) + (12)) >> 2)];
   var offset = ((start) >> 2);
   desc["code"] = HEAPU32.subarray(offset, offset + count);
   break;
  }

 case 6:
  {
   var sourcePtr = HEAPU32[(((nextInChainPtr) + (8)) >> 2)];
   if (sourcePtr) {
    desc["code"] = UTF8ToString(sourcePtr);
   }
   break;
  }
 }
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrShaderModule.create(device["createShaderModule"](desc));
};

var _wgpuDeviceCreateSwapChain = (deviceId, surfaceId, descriptor) => {
 var device = WebGPU.mgrDevice.get(deviceId);
 var context = WebGPU.mgrSurface.get(surfaceId);
 var canvasSize = [ HEAPU32[(((descriptor) + (16)) >> 2)], HEAPU32[(((descriptor) + (20)) >> 2)] ];
 if (canvasSize[0] !== 0) {
  context["canvas"]["width"] = canvasSize[0];
 }
 if (canvasSize[1] !== 0) {
  context["canvas"]["height"] = canvasSize[1];
 }
 var configuration = {
  "device": device,
  "format": WebGPU.TextureFormat[HEAPU32[(((descriptor) + (12)) >> 2)]],
  "usage": HEAPU32[(((descriptor) + (8)) >> 2)],
  "alphaMode": "opaque"
 };
 context["configure"](configuration);
 return WebGPU.mgrSwapChain.create(context);
};

var _wgpuDeviceGetQueue = deviceId => {
 var queueId = WebGPU.mgrDevice.objects[deviceId].queueId;
 WebGPU.mgrQueue.reference(queueId);
 return queueId;
};

var _wgpuDeviceReference = id => WebGPU.mgrDevice.reference(id);

var _wgpuDeviceRelease = id => WebGPU.mgrDevice.release(id);

var _wgpuDeviceSetUncapturedErrorCallback = (deviceId, callback, userdata) => {
 var device = WebGPU.mgrDevice.get(deviceId);
 device["onuncapturederror"] = function(ev) {
  callUserCallback(() => {
   var Validation = 1;
   var OutOfMemory = 2;
   var type;
   if (ev.error instanceof GPUValidationError) type = Validation; else if (ev.error instanceof GPUOutOfMemoryError) type = OutOfMemory;
   WebGPU.errorCallback(callback, type, ev.error.message, userdata);
  });
 };
};

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

var specialHTMLTargets = [ 0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0 ];

/** @suppress {duplicate } */ var findEventTarget = target => {
 target = maybeCStringToJsString(target);
 var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
 return domElement;
};

var findCanvasEventTarget = findEventTarget;

var _wgpuInstanceCreateSurface = (instanceId, descriptor) => {
 var nextInChainPtr = HEAPU32[((descriptor) >> 2)];
 var descriptorFromCanvasHTMLSelector = nextInChainPtr;
 var selectorPtr = HEAPU32[(((descriptorFromCanvasHTMLSelector) + (8)) >> 2)];
 var canvas = findCanvasEventTarget(selectorPtr);
 var context = canvas.getContext("webgpu");
 if (!context) return 0;
 var labelPtr = HEAPU32[(((descriptor) + (4)) >> 2)];
 if (labelPtr) context.surfaceLabelWebGPU = UTF8ToString(labelPtr);
 return WebGPU.mgrSurface.create(context);
};

var _wgpuInstanceRequestAdapter = (instanceId, options, callback, userdata) => {
 var opts;
 if (options) {
  opts = {
   "powerPreference": WebGPU.PowerPreference[HEAPU32[(((options) + (8)) >> 2)]],
   "forceFallbackAdapter": !!(HEAPU32[(((options) + (16)) >> 2)])
  };
 }
 if (!("gpu" in navigator)) {
  withStackSave(() => {
   var messagePtr = stringToUTF8OnStack("WebGPU not available on this browser (navigator.gpu is not available)");
   getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
  });
  return;
 }
 navigator["gpu"]["requestAdapter"](opts).then(adapter => {
  callUserCallback(() => {
   if (adapter) {
    var adapterId = WebGPU.mgrAdapter.create(adapter);
    getWasmTableEntry(callback)(0, adapterId, 0, userdata);
   } else {
    withStackSave(() => {
     var messagePtr = stringToUTF8OnStack("WebGPU not available on this system (requestAdapter returned null)");
     getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
    });
   }
  });
 }, ex => {
  callUserCallback(() => {
   withStackSave(() => {
    var messagePtr = stringToUTF8OnStack(ex.message);
    getWasmTableEntry(callback)(2, 0, messagePtr, userdata);
   });
  });
 });
};

var _wgpuPipelineLayoutRelease = id => WebGPU.mgrPipelineLayout.release(id);

var _wgpuQuerySetRelease = id => WebGPU.mgrQuerySet.release(id);

var _wgpuQueueRelease = id => WebGPU.mgrQueue.release(id);

var _wgpuQueueSubmit = (queueId, commandCount, commands) => {
 var queue = WebGPU.mgrQueue.get(queueId);
 var cmds = Array.from(HEAP32.subarray((commands) >> 2, (commands + commandCount * 4) >> 2), function(id) {
  return WebGPU.mgrCommandBuffer.get(id);
 });
 queue["submit"](cmds);
};

var _wgpuRenderPassEncoderEnd = encoderId => {
 var encoder = WebGPU.mgrRenderPassEncoder.get(encoderId);
 encoder["end"]();
};

var _wgpuRenderPassEncoderRelease = id => WebGPU.mgrRenderPassEncoder.release(id);

var _wgpuRenderPipelineRelease = id => WebGPU.mgrRenderPipeline.release(id);

var _wgpuShaderModuleGetCompilationInfo = (shaderModuleId, callback, userdata) => {
 var shaderModule = WebGPU.mgrShaderModule.get(shaderModuleId);
 shaderModule["getCompilationInfo"]().then(compilationInfo => {
  callUserCallback(() => {
   var compilationMessagesPtr = _malloc(72 * compilationInfo.messages.length);
   var messageStringPtrs = [];
   for (var i = 0; i < compilationInfo.messages.length; ++i) {
    var compilationMessage = compilationInfo.messages[i];
    var compilationMessagePtr = compilationMessagesPtr + 72 * i;
    var messageSize = lengthBytesUTF8(compilationMessage.message) + 1;
    var messagePtr = _malloc(messageSize);
    messageStringPtrs.push(messagePtr);
    stringToUTF8(compilationMessage.message, messagePtr, messageSize);
    HEAPU32[(((compilationMessagePtr) + (4)) >> 2)] = messagePtr;
    HEAP32[(((compilationMessagePtr) + (8)) >> 2)] = WebGPU.Int_CompilationMessageType[compilationMessage.type];
    (tempI64 = [ compilationMessage.lineNum >>> 0, (tempDouble = compilationMessage.lineNum, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (16)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (20)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.linePos >>> 0, (tempDouble = compilationMessage.linePos, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (24)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (28)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.offset >>> 0, (tempDouble = compilationMessage.offset, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (32)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (36)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.length >>> 0, (tempDouble = compilationMessage.length, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (40)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (44)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.linePos >>> 0, (tempDouble = compilationMessage.linePos, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (48)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (52)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.offset >>> 0, (tempDouble = compilationMessage.offset, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (56)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (60)) >> 2)] = tempI64[1]);
    (tempI64 = [ compilationMessage.length >>> 0, (tempDouble = compilationMessage.length, 
    (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
    HEAP32[(((compilationMessagePtr) + (64)) >> 2)] = tempI64[0], HEAP32[(((compilationMessagePtr) + (68)) >> 2)] = tempI64[1]);
   }
   var compilationInfoPtr = _malloc(12);
   HEAPU32[(((compilationInfoPtr) + (4)) >> 2)] = compilationInfo.messages.length;
   HEAPU32[(((compilationInfoPtr) + (8)) >> 2)] = compilationMessagesPtr;
   getWasmTableEntry(callback)(0, compilationInfoPtr, userdata);
   messageStringPtrs.forEach(ptr => {
    _free(ptr);
   });
   _free(compilationMessagesPtr);
   _free(compilationInfoPtr);
  });
 });
};

var _wgpuShaderModuleReference = id => WebGPU.mgrShaderModule.reference(id);

var _wgpuShaderModuleRelease = id => WebGPU.mgrShaderModule.release(id);

var _wgpuSurfaceRelease = id => WebGPU.mgrSurface.release(id);

var _wgpuSwapChainGetCurrentTextureView = swapChainId => {
 var context = WebGPU.mgrSwapChain.get(swapChainId);
 return WebGPU.mgrTextureView.create(context["getCurrentTexture"]()["createView"]());
};

var _wgpuSwapChainRelease = id => WebGPU.mgrSwapChain.release(id);

var _wgpuTextureViewReference = id => WebGPU.mgrTextureView.reference(id);

var _wgpuTextureViewRelease = id => WebGPU.mgrTextureView.release(id);

Module["requestFullscreen"] = Browser.requestFullscreen;

Module["requestAnimationFrame"] = Browser.requestAnimationFrame;

Module["setCanvasSize"] = Browser.setCanvasSize;

Module["pauseMainLoop"] = Browser.mainLoop.pause;

Module["resumeMainLoop"] = Browser.mainLoop.resume;

Module["getUserMedia"] = Browser.getUserMedia;

Module["createContext"] = Browser.createContext;

var preloadedImages = {};

var preloadedAudios = {};

WebGPU.initManagers();

var wasmImports = {
 /** @export */ a: ___assert_fail,
 /** @export */ T: __emscripten_get_now_is_monotonic,
 /** @export */ S: _abort,
 /** @export */ R: _emscripten_get_now,
 /** @export */ Q: _emscripten_memcpy_js,
 /** @export */ P: _emscripten_resize_heap,
 /** @export */ O: _emscripten_set_main_loop,
 /** @export */ N: _emwgpuCommandEncoderBeginRenderPass,
 /** @export */ M: _emwgpuDeviceCreateRenderPipeline,
 /** @export */ L: _emwgpuRenderPassEncoderNoOp_JSByExternref,
 /** @export */ b: _fd_write,
 /** @export */ K: _wgpuAdapterRelease,
 /** @export */ J: _wgpuAdapterRequestDevice,
 /** @export */ I: _wgpuBindGroupLayoutReference,
 /** @export */ H: _wgpuBindGroupLayoutRelease,
 /** @export */ G: _wgpuBindGroupRelease,
 /** @export */ F: _wgpuCommandBufferRelease,
 /** @export */ E: _wgpuCommandEncoderFinish,
 /** @export */ D: _wgpuCommandEncoderRelease,
 /** @export */ C: _wgpuDeviceCreateBindGroup,
 /** @export */ B: _wgpuDeviceCreateBindGroupLayout,
 /** @export */ A: _wgpuDeviceCreateCommandEncoder,
 /** @export */ z: _wgpuDeviceCreatePipelineLayout,
 /** @export */ y: _wgpuDeviceCreateShaderModule,
 /** @export */ x: _wgpuDeviceCreateSwapChain,
 /** @export */ w: _wgpuDeviceGetQueue,
 /** @export */ v: _wgpuDeviceReference,
 /** @export */ u: _wgpuDeviceRelease,
 /** @export */ t: _wgpuDeviceSetUncapturedErrorCallback,
 /** @export */ s: _wgpuInstanceCreateSurface,
 /** @export */ r: _wgpuInstanceRequestAdapter,
 /** @export */ q: _wgpuPipelineLayoutRelease,
 /** @export */ p: _wgpuQuerySetRelease,
 /** @export */ o: _wgpuQueueRelease,
 /** @export */ n: _wgpuQueueSubmit,
 /** @export */ m: _wgpuRenderPassEncoderEnd,
 /** @export */ l: _wgpuRenderPassEncoderRelease,
 /** @export */ k: _wgpuRenderPipelineRelease,
 /** @export */ j: _wgpuShaderModuleGetCompilationInfo,
 /** @export */ i: _wgpuShaderModuleReference,
 /** @export */ h: _wgpuShaderModuleRelease,
 /** @export */ g: _wgpuSurfaceRelease,
 /** @export */ f: _wgpuSwapChainGetCurrentTextureView,
 /** @export */ e: _wgpuSwapChainRelease,
 /** @export */ d: _wgpuTextureViewReference,
 /** @export */ c: _wgpuTextureViewRelease
};

var wasmExports = createWasm();

var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["V"])();

var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["X"])(a0, a1);

var _malloc = a0 => (_malloc = wasmExports["Y"])(a0);

var _free = a0 => (_free = wasmExports["Z"])(a0);

var _memalign = (a0, a1) => (_memalign = wasmExports["memalign"])(a0, a1);

var stackSave = () => (stackSave = wasmExports["_"])();

var stackRestore = a0 => (stackRestore = wasmExports["$"])(a0);

var stackAlloc = a0 => (stackAlloc = wasmExports["aa"])(a0);

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain() {
 var entryFunction = _main;
 var argc = 0;
 var argv = 0;
 try {
  var ret = entryFunction(argc, argv);
  exitJS(ret, /* implicit = */ true);
  return ret;
 } catch (e) {
  return handleException(e);
 }
}

function run() {
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (shouldRunNow) callMain();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();