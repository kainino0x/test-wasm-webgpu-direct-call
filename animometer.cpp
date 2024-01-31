// Most code taken from:
// https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/samples/Animometer.cpp
// This is a simpler port so performance is NOT comparable with the real Animometer benchmark.

#include <webgpu/webgpu_cpp.h>

#undef NDEBUG
#include <cassert>
#include <cstdio>
#include <cstdlib>
#include <memory>

#include <emscripten.h>
#include <emscripten/html5.h>
#include <emscripten/html5_webgpu.h>

static const wgpu::Instance instance = wgpuCreateInstance(nullptr);

void GetDevice(void (*callback)(wgpu::Device)) {
    instance.RequestAdapter(nullptr, [](WGPURequestAdapterStatus status, WGPUAdapter cAdapter, const char* message, void* userdata) {
        if (message) {
            printf("RequestAdapter: %s\n", message);
        }
        assert(status == WGPURequestAdapterStatus_Success);

        wgpu::Adapter adapter = wgpu::Adapter::Acquire(cAdapter);
        adapter.RequestDevice(nullptr, [](WGPURequestDeviceStatus status, WGPUDevice cDevice, const char* message, void* userdata) {
            if (message) {
                printf("RequestDevice: %s\n", message);
            }
            assert(status == WGPURequestDeviceStatus_Success);

            wgpu::Device device = wgpu::Device::Acquire(cDevice);
            reinterpret_cast<void (*)(wgpu::Device)>(userdata)(device);
        }, userdata);
    }, reinterpret_cast<void*>(callback));
}

static const char shaderCode[] = R"(
    struct Constants {
        time: f32,
        offsetX: f32,
        offsetY: f32,
    };
    @group(0) @binding(0) var<uniform> c: Constants;

    struct VertexOut {
        @location(0) v_color: vec4f,
        @builtin(position) Position: vec4f,
    };

    @vertex fn main_v(@builtin(vertex_index) VertexIndex: u32) -> VertexOut {
        var positions = array(
            vec4f( 0.0,  0.1, 0.0, 1.0),
            vec4f(-0.1, -0.1, 0.0, 1.0),
            vec4f( 0.1, -0.1, 0.0, 1.0)
        );

        var colors = array(
            vec4f(1.0, 0.0, 0.0, 1.0),
            vec4f(0.0, 1.0, 0.0, 1.0),
            vec4f(0.0, 0.0, 1.0, 1.0)
        );

        var position = positions[VertexIndex];
        var color = colors[VertexIndex];

        // TODO(dawn:572): Revisit once modf has been reworked in WGSL.
        var fade = (c.time + c.offsetX + c.offsetY) / 10.0;
        fade = fade - floor(fade);
        if (fade < 0.5) {
            fade = fade * 2.0;
        } else {
            fade = (1.0 - fade) * 2.0;
        }

        var xpos = position.x * 0.1;
        var ypos = position.y * 0.1;
        let angle = 3.14159 * 2.0 * fade;
        let xrot = xpos * cos(angle) - ypos * sin(angle);
        let yrot = xpos * sin(angle) + ypos * cos(angle);
        xpos = xrot + c.offsetX;
        ypos = yrot + c.offsetY;

        var output: VertexOut;
        output.v_color = vec4f(fade, 1.0 - fade, 0.0, 1.0) + color;
        output.Position = vec4f(xpos, ypos, 0.0, 1.0);
        return output;
    }

    @fragment fn main_f(@location(0) v_color: vec4f) -> @location(0) vec4f {
        return v_color;
    }
)";

static wgpu::Device device;
static wgpu::Queue queue;
static wgpu::RenderPipeline pipeline;
static wgpu::BindGroup bindGroup;
static wgpu::Buffer ubo;

float RandomFloat(float min, float max) {
    float zeroOne = rand() / static_cast<float>(RAND_MAX);
    return zeroOne * (max - min) + min;
}

static size_t numTriangles = 10000;

// Aligned as minUniformBufferOffsetAlignment
struct alignas(256) ShaderData {
    float time;
    float offsetX;
    float offsetY;
};

static std::vector<ShaderData> shaderData;

void init() {
    device.SetUncapturedErrorCallback(
        [](WGPUErrorType errorType, const char* message, void*) {
            printf("%d: %s\n", errorType, message);
        }, nullptr);

    queue = device.GetQueue();

    wgpu::ShaderModule shaderModule{};
    {
        wgpu::ShaderModuleWGSLDescriptor wgslDesc{};
        wgslDesc.code = shaderCode;

        wgpu::ShaderModuleDescriptor descriptor{};
        descriptor.nextInChain = &wgslDesc;
        shaderModule = device.CreateShaderModule(&descriptor);
        shaderModule.GetCompilationInfo([](WGPUCompilationInfoRequestStatus status, const WGPUCompilationInfo* info, void*) {
            assert(status == WGPUCompilationInfoRequestStatus_Success);
            assert(info->messageCount == 0);
            std::printf("Shader compile succeeded\n");
        }, nullptr);
    }

    wgpu::BindGroupLayout bgl;
    wgpu::PipelineLayout pl;
    {
        wgpu::BindGroupLayoutEntry entry = {};
        entry.binding = 0;
        entry.visibility = wgpu::ShaderStage::Vertex;
        entry.buffer.type = wgpu::BufferBindingType::Uniform;
        entry.buffer.hasDynamicOffset = true;

        wgpu::BindGroupLayoutDescriptor bglDesc{};
        bglDesc.entryCount = 1;
        bglDesc.entries = &entry;
        bgl = device.CreateBindGroupLayout(&bglDesc);

        wgpu::PipelineLayoutDescriptor plDesc{};
        plDesc.bindGroupLayoutCount = 1;
        plDesc.bindGroupLayouts = &bgl;
        pl = device.CreatePipelineLayout(&plDesc);
    }

    {
        wgpu::ColorTargetState colorTargetState{};
        colorTargetState.format = wgpu::TextureFormat::BGRA8Unorm;

        wgpu::FragmentState fragmentState{};
        fragmentState.module = shaderModule;
        fragmentState.entryPoint = "main_f";
        fragmentState.targetCount = 1;
        fragmentState.targets = &colorTargetState;

        wgpu::RenderPipelineDescriptor descriptor{};
        descriptor.layout = pl;
        descriptor.vertex.module = shaderModule;
        descriptor.vertex.entryPoint = "main_v";
        descriptor.fragment = &fragmentState;
        descriptor.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
        pipeline = device.CreateRenderPipeline(&descriptor);
    }

    shaderData.resize(numTriangles);
    for (auto& data : shaderData) {
        data.time = 0.0;
        data.offsetX = RandomFloat(-0.9f, 0.9f);
        data.offsetY = RandomFloat(-0.9f, 0.9f);
    }

    wgpu::BufferDescriptor bufferDesc;
    bufferDesc.size = numTriangles * sizeof(ShaderData);
    bufferDesc.usage = wgpu::BufferUsage::CopyDst | wgpu::BufferUsage::Uniform;
    ubo = device.CreateBuffer(&bufferDesc);

    {
        wgpu::BindGroupEntry entry = {};
        entry.binding = 0;
        entry.buffer = ubo;
        entry.offset = 0;
        entry.size = sizeof(ShaderData);

        wgpu::BindGroupDescriptor desc{};
        desc.layout = bgl;
        desc.entryCount = 1;
        desc.entries = &entry;
        bindGroup = device.CreateBindGroup(&desc);
    }
}

wgpu::SwapChain swapChain;
const uint32_t kWidth = 640;
const uint32_t kHeight = 480;

std::chrono::time_point<std::chrono::high_resolution_clock> t0;
int frameCount = 0;
int lastTimePrint = 0;
void frame() {
    wgpu::TextureView view = swapChain.GetCurrentTextureView();

    for (auto& data : shaderData) {
        data.time = frameCount / 60.0f;
    }
    queue.WriteBuffer(ubo, 0, shaderData.data(), numTriangles * sizeof(ShaderData));

    wgpu::RenderPassColorAttachment attachment{};
    attachment.view = view;
    attachment.loadOp = wgpu::LoadOp::Clear;
    attachment.storeOp = wgpu::StoreOp::Store;
    attachment.clearValue = {0, 0, 0, 1};

    wgpu::RenderPassDescriptor renderpass{};
    renderpass.colorAttachmentCount = 1;
    renderpass.colorAttachments = &attachment;

    wgpu::CommandBuffer commands;
    {
        wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
        {
            wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&renderpass);
            pass.SetPipeline(pipeline);
            for (size_t i = 0; i < numTriangles; i++) {
                uint32_t offset = i * sizeof(ShaderData);
                pass.SetBindGroup(0, bindGroup, 1, &offset);
                pass.Draw(3);
            }
            pass.End();
        }
        commands = encoder.Finish();
    }

    queue.Submit(1, &commands);

    auto t = std::chrono::high_resolution_clock::now();
    if (frameCount == 0) {
        t0 = t;
    } else {
        double micros = std::chrono::duration_cast<std::chrono::microseconds>(t - t0).count();
        // Print stats every 2s
        if (micros > 2'000'000) {
            double avg = micros / (frameCount - lastTimePrint);
            printf("average frame time (refresh rate limited), %zu triangles: %.1fms (%.1f FPS)\n",
                numTriangles, avg / 1000, 1'000'000 / avg);

            t0 = t;
            lastTimePrint = frameCount;
        }
    }

    frameCount++;
}

void run() {
    init();
    {
        wgpu::SurfaceDescriptorFromCanvasHTMLSelector canvasDesc{};
        canvasDesc.selector = "#canvas";

        wgpu::SurfaceDescriptor surfDesc{};
        surfDesc.nextInChain = &canvasDesc;
        wgpu::Surface surface = instance.CreateSurface(&surfDesc);

        wgpu::SwapChainDescriptor scDesc{};
        scDesc.usage = wgpu::TextureUsage::RenderAttachment;
        scDesc.format = wgpu::TextureFormat::BGRA8Unorm;
        scDesc.width = kWidth;
        scDesc.height = kHeight;
        scDesc.presentMode = wgpu::PresentMode::Fifo;
        swapChain = device.CreateSwapChain(surface, &scDesc);
    }
    emscripten_set_main_loop(frame, 0, false);
}

int main() {
    numTriangles = EM_ASM_INT({
        const triangles = new URLSearchParams(window.location.search).get('triangles');
        if (!triangles) {
            // Redirect
            window.location.search = '?triangles=100000';
        }
        return triangles;
    });

    GetDevice([](wgpu::Device dev) {
        device = dev;
        run();
    });
}
