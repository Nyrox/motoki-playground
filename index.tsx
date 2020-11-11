import "./main.css"

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


const TabBar = ({activeTab, onSwitch}) => {

	return <div className="tab-bar">
		<button className={"tab " + (activeTab == "frag" ? "active" : "")} onClick={() => onSwitch("frag")}>Fragment Shader</button>
		<button className={"tab " + (activeTab == "glsl" ? "active" : "")} onClick={() => onSwitch("glsl")}>GlSL</button>
	</div>
}

const EditorPanel = ({code, onChange, onSaveFile, activeTab, onTabSwitch}) => {
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

const App = () => {
	let [_gfx, _] = React.useState(() => {
		let c = document.createElement("canvas") as HTMLCanvasElement
		let ctx = c.getContext("2d")
		return [c, ctx]
	})

	let [canvas, context] = _gfx as [HTMLCanvasElement, CanvasRenderingContext2D]
	let [imgUri, setImgUri] = React.useState(() => canvas.toDataURL());
	let [compileOutput, setCompileOutput] = React.useState([])
	let [generatedGLSL, setGeneratedGLSL] = React.useState("")
	let [activeTab, setActiveTab] = React.useState("frag")

	let img = React.useRef()

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
		function resizeImage() {
			canvas.width = (img.current as HTMLImageElement).clientWidth
			canvas.height = (img.current as HTMLImageElement).clientWidth * (9.0 / 16.0);
			console.log("Recreating framebuffers", canvas.width, canvas.height)
		}

		window.onresize = resizeImage
		resizeImage()
	}, [false])

	const [code, setCode] = React.useState(`

in Float ux
in Float uy

Vec3 main() {
	return Vec3(ux, uy, 1.0)
}
`	);

	const render = () => {
		worker.postMessage(createRequestShaderCompilationMessage(code))
		console.log("Queueing render", canvas.width, canvas.height)
		let data = wasm.shade_window_space(canvas.width, canvas.height, code);
		let iData = new ImageData(data, canvas.width, canvas.height)
		context.putImageData(iData, 0, 0);
		setImgUri(canvas.toDataURL())

	}

	console.log(compileOutput)

	return <>
		<div className="left-panel">
			<div className="image-container">
				<img ref={img} src={imgUri} />
			</div>
			<div className="output-container">
				{compileOutput}
			</div>
		</div>
		{(activeTab == "frag" ? 
			<EditorPanel activeTab={activeTab} code={code} onChange={setCode} onSaveFile={render}  onTabSwitch={setActiveTab} />
			: <EditorPanel activeTab={activeTab} code={generatedGLSL} onTabSwitch={setActiveTab} onChange={() => {}} onSaveFile={() => {}} />)}
	</>
}

render(
	<App />,
	document.getElementById('app')
);