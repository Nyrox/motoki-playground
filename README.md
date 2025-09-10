

# Motoki Playground

Motoki Playground is a web-based environment for experimenting with the Motoki shader programming language. It leverages `motokigo` compiled to WebAssembly (via `wasm-pack` at `/motokigo-wasm`) and compiles shaders in web worker and runs the generated GLSL in a WebGL canvas.

## Project Structure

- `/motokigo-wasm`: Contains the Motoki compiler wasm bindings.
- `/source`: Main React + TypeScript application.

## Building the Application

1. **Build the Motoki WebAssembly package:**
  ```bash
  cd motokigo-wasm
  wasm-pack build
  ```

2. **Install dependencies for the main app:**
  ```bash
  npm install
  ```

3. **Start the development server:**
  ```bash
  npm start
  ```
  The app will be available at `http://localhost:8080`.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.