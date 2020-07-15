import * as wasm from "renderjack-wasm";
import "./main.css"

wasm.greet();


import React, { useEffect } from 'react';
import { render } from 'react-dom';
import MonacoEditor from 'react-monaco-editor';


const EditorPanel = () => {
    const [code, setCode] = React.useState("// type your code");

    return <MonacoEditor
        theme="vs-dark"
        value={code}
        onChange={setCode}
        editorDidMount={e => e.focus()}
        options={{glyphMargin: true, lineNumbersMinChars: 2, automaticLayout: true}}
    />
}

render(
  <EditorPanel />,
  document.getElementById('app')
);