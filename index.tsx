import "./main.css"

import * as wasm from "renderjack-wasm";

const dims = [800, 600]





import React, { useEffect, useLayoutEffect } from 'react'
import { render } from 'react-dom'
import MonacoEditor from 'react-monaco-editor/lib/editor'
import * as monaco from "monaco-editor"

const EditorPanel = ({code, onChange, onSaveFile}) => {
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

	let img = React.useRef()

	useLayoutEffect(() => {
		function resizeImage() {
			canvas.width = (img.current as HTMLImageElement).clientWidth
			canvas.height = (img.current as HTMLImageElement).clientWidth * (9.0 / 16.0);
			console.log("Recreating framebuffers", canvas.width, canvas.height)
		}

		window.onresize = resizeImage
		resizeImage()
	})

	const [code, setCode] = React.useState(`

in Float ux
in Float uy

Vec3 main() {
	return Vec3(ux, uy, 1.0)
}
`	);

	const render = () => {
		console.log("Queueing render", canvas.width, canvas.height)
		let data = wasm.shade_window_space(canvas.width, canvas.height, code);
		let iData = new ImageData(data, canvas.width, canvas.height)
		context.putImageData(iData, 0, 0);
		setImgUri(canvas.toDataURL())

	}

	return <>
		<div className="image-container">
			<img ref={img} src={imgUri} />
			<button onClick={render}>Render</button>
		</div>
		<EditorPanel code={code} onChange={setCode} onSaveFile={render} />
	</>
}

render(
	<App />,
	document.getElementById('app')
);