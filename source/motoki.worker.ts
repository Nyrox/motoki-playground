import { ShaderCompilationResult } from "motokigo-wasm";

const ctx: Worker = self as any;

const postMessage = (msg: Notification) => {
    ctx.postMessage(msg)
}

import("motokigo-wasm").then(wasm => {
    wasm.greet()
    
    ctx.addEventListener("message", event => {
        console.log(event.data);
    
        let message: Message = event.data
    
        switch (message.messageType) {
            case "request_shader_compilation":
                console.log("Received request for shader compilation")
                console.log(message.shaderSource)
                let result = wasm.check_shader_compilation(message.shaderSource)
                
                let errors = [];
                console.log(result, result.has_error)
                if (result.has_error) {
                    errors = [wasm.shader_compilation_output_errors(result)]
                }
                console.log(result)
                console.log(errors)

                let response = createShaderCompilationResultNotification(errors, [], wasm.shader_compilation_output_glsl(result))
                postMessage(response)
            break;
        }
    })

    postMessage({ notificationType: "worker_initialized" })
})





export default null as any;

export interface ShaderCompilationResultNotification {
    notificationType: "shader_compilation_result";
    errors: string[];
    warnings: string[];
    glsl: string;
}

function createShaderCompilationResultNotification(errors: string[], warnings: string[], glsl: string): ShaderCompilationResultNotification {
    return {
        notificationType: "shader_compilation_result",
        errors, warnings, glsl
    }
}

export type Notification =
    | ShaderCompilationResultNotification
    | WorkerInitializedNotification

export interface WorkerInitializedNotification {
    notificationType: "worker_initialized";
}

export interface RequestShaderCompilationMessage {
    messageType: "request_shader_compilation";
    shaderSource: string;
}

export type Message =
    | RequestShaderCompilationMessage