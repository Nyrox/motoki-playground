import "./css/main.css"

import * as wasm from "motokigo-wasm";

const dims = [800, 600]


import MotokiWorker, { Message, Notification, RequestShaderCompilationMessage } from "./motoki.worker"

class Worker {
	worker: typeof MotokiWorker // any
	constructor() { this.worker = new MotokiWorker() }

	postMessage(message: Message) {
		this.worker.postMessage(message)
	}

	addListener(listener: (Notifcation) => void) {
		this.worker.addEventListener("message", listener)
	}

	removeListener(listener: (Notification) => void) {
		this.worker.removeEventListener("message", listener)
	}
}

export function createRequestShaderCompilationMessage(source: string): RequestShaderCompilationMessage {
	return {
		messageType: "request_shader_compilation",
		shaderSource: source
	}
}

const worker = new Worker()


import React, { useEffect, useLayoutEffect } from 'react'
import { render } from 'react-dom'
import MonacoEditor from 'react-monaco-editor/lib/editor'
import * as monaco from "monaco-editor"


const TabBar = ({ activeTab, onSwitch }) => {

	return <div className="tab-bar">
		<button className={"tab " + (activeTab == "frag" ? "active" : "")} onClick={() => onSwitch("frag")}>Fragment Shader</button>
		<button className={"tab " + (activeTab == "glsl" ? "active" : "")} onClick={() => onSwitch("glsl")}>GlSL</button>
	</div>
}

const EditorPanel = ({ code, onChange, onSaveFile, activeTab, onTabSwitch }) => {
	useEffect(() => {
		window.addEventListener("motoki-render", onSaveFile)
		return () => window.removeEventListener("motoki-render", onSaveFile)
	})

	const onMount = e => {
		console.log("mounted editor")
		e.focus()
		e.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			window.dispatchEvent(new CustomEvent("motoki-render"))
		})
	}

	return <div className="editor-panel">
		<TabBar onSwitch={onTabSwitch} activeTab={activeTab} />
		<MonacoEditor
			language=""
			theme="vs-dark"
			value={code}
			onChange={onChange}
			editorDidMount={onMount}
			options={{ glyphMargin: true, lineNumbersMinChars: 2, automaticLayout: true }}
		/>
	</div>
}

import * as GL from "./gl"

const App = () => {
	let canvasRef = React.useRef()
	let frameTimerRef = React.useRef()

	let [gl, setGl]= React.useState(null);

	useEffect(() => {
		setGl ((canvasRef.current as HTMLCanvasElement).getContext("webgl2"))
	}, [false])

	let [compileOutput, setCompileOutput] = React.useState([])
	let [generatedGLSL, setGeneratedGLSL] = React.useState("")
	let [activeTab, setActiveTab] = React.useState("frag")


	useEffect(() => {
		function listener(message) {
			console.log("Received worker notification", message.data)
			let notification: Notification = message.data
			switch (notification.notificationType) {
				case "shader_compilation_result":
					let output = []
					notification.warnings.forEach(warning => {
						output.push(<li className="warning">{warning}</li>)
					});
					notification.errors.forEach(error => {
						output.push(<li className="error">{error}</li>)
					});

					console.log(output)
					setCompileOutput(output)

					if (notification.errors.length == 0) {
						setGeneratedGLSL(notification.glsl)						
					}
					break;
			}
		}

		worker.addListener(listener)

		return () => worker.removeListener(listener)
	})

	useEffect(() => {
		if (generatedGLSL == "") return;
		let glData = GL.createData(gl, generatedGLSL)
		
		let canvas = canvasRef.current as HTMLCanvasElement
		let frameCount = 0
		let handle;
		handle = requestAnimationFrame(function frame() {
			frameCount += 1;
			(frameTimerRef.current as HTMLElement).innerText = handle
			gl.viewport(0, 0, canvas.width, canvas.height)
			GL.draw(gl, glData, frameCount)
			handle = requestAnimationFrame(frame)
		})

		return () => {
			cancelAnimationFrame(handle)
		}
	}, [generatedGLSL])

	useEffect(() => {
		if (canvasRef.current === undefined) return
		function resizeImage() {
			let canvas = canvasRef.current as HTMLCanvasElement
			canvas.width = (canvas).clientWidth
			canvas.height = (canvas).clientWidth * (9.0 / 16.0);
			console.log("Recreating framebuffers", canvas.width, canvas.height)
		}

		window.onresize = resizeImage
		resizeImage()
	}, [canvasRef])

	const [code, setCode] = React.useState(`
in Float ux
in Float uy

uniform Int iTime

Vec2 square_complex(Vec2 z){
	return Vec2(
		elem(z,0)*elem(z,0) - elem(z,1)*elem(z,1),
		elem(z,0)*elem(z,1) + elem(z,1)*elem(z,0)
	)
}

Float square_length(Vec2 a) {
	return elem(a,0)*elem(a,0) + elem(a,1)*elem(a,1)
}

Vec4 main() {
	let max_steps = 20

	let uv = Vec2(-2.5 + (1.0 - (-2.5)) * ux, -1.0 + (1.0 - (-1.0)) * uy)
	let mut z = uv / (float(iTime) / 50.0)
	
	let mut steps = 0

	for i=0 to max_steps {
		if square_length(z) < 4.0 { 
			z = square_complex(z) + uv
			steps = steps + 1
		}
	}
	
	if (steps == max_steps) {
		return Vec4(1.0, 0.0, 0.0, 1.0)
	}

	return Vec4(float(steps) / 15.0, 0.0, 0.0, 1.0)
}
`	);

	const render = () => {
		worker.postMessage(createRequestShaderCompilationMessage(code))
		// let data = wasm.shade_window_space(canvas.width, canvas.height, code);
		// let iData = new ImageData(data, canvas.width, canvas.height)
		// context.putImageData(iData, 0, 0);
		// setImgUri(canvas.toDataURL())
	}


	return <>
		<div className="left-panel">
			<div className="image-container">
				<canvas ref={canvasRef} />
				<div className="toolbar">
					<span className="frame-timer" ref={frameTimerRef}>1</span>
				</div>
			</div>
			<div className="output-container">
				{compileOutput}
			</div>
		</div>
		{(activeTab == "frag" ?
			<EditorPanel activeTab={activeTab} code={code} onChange={setCode} onSaveFile={render} onTabSwitch={setActiveTab} />
			: <EditorPanel activeTab={activeTab} code={generatedGLSL} onTabSwitch={setActiveTab} onChange={() => { }} onSaveFile={() => { }} />)}
	</>
}

render(
	<App />,
	document.getElementById('app')
);