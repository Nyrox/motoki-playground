function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function initBuffers(gl) {

    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square.

    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);

    return {
        position: positionBuffer,
    };
}


const vsSource = `#version 300 es
in vec2 vertexPos;

out float ux;
out float uy;

void main() {
    ux = (vertexPos.x + 1.0) / 2.0;
    uy = (vertexPos.y + 1.0) / 2.0;
    gl_Position = vec4(vertexPos, 0.5, 1.0);
}
`

export const createData = (gl: WebGL2RenderingContext, fs: String) => {
    let fsSource = fs.replace("#version 330 core", "#version 300 es\nprecision mediump float;\n");

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
    const buffers = initBuffers(gl)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(
            0,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.enableVertexAttribArray(0)
    }

    return {
        program: shaderProgram,
        buffers: buffers,
        uniforms: {
            iTime: gl.getUniformLocation(shaderProgram, "iTime")
        }
    }
}

export const draw = (gl: WebGL2RenderingContext, { program, buffers, uniforms }, frameCount) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.useProgram(program)

    if(uniforms.iTime) gl.uniform1i(uniforms.iTime, frameCount)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

}