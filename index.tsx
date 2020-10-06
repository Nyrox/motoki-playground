import "./main.css"

import * as wasm from "renderjack-wasm";

const dims = [800, 600]





import React, { useEffect, useLayoutEffect } from 'react'
import { render } from 'react-dom'
import MonacoEditor from 'react-monaco-editor/lib/editor'
import * as monaco from "monaco-editor"

const EditorPanel = ({code, onChange, onSaveFile}) => {

	const onMount = e => {
		console.log("mounted editor")
		e.focus()
		e.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			onSaveFile()
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
		}

		window.onresize = resizeImage
		resizeImage()
	})

	const [code, setCode] = React.useState(`

Vec3 main() {
	return Vec3(1.0, 0.0, 0.0)
}
`	);

	const render = () => {
		let data = wasm.shade_window_space(dims[0], dims[1], code);
		let iData = new ImageData(data, dims[0], dims[1])
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