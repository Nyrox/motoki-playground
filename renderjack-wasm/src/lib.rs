mod utils;

use wasm_bindgen::prelude::*;

use motokigo;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    log("hello console");
}


#[wasm_bindgen]
#[derive(Clone)]
pub struct ShaderCompilationResult {
    pub has_error: bool,
    errors: Vec<String>,
    warnings: Vec<String>,
}


use motokigo::parser::ParsingError;
use motokigo::scanner::ScanningError;

#[wasm_bindgen]
pub fn check_shader_compilation(shader: String) -> ShaderCompilationResult {
    let mut program = match motokigo::parser::parse(&shader) {
        Ok(p) => p,
        Err(e) => {
            let error_msg = match e {
                ParsingError::UnexpectedEndOfInput => "Encountered error while parsing: Unexpected end of file".to_owned(),
                ParsingError::UnexpectedToken(t) => format!("Encountered error while parsing: Unexpected token {:?} at {}:{}", t.item, t.from.line, t.from.offset.unwrap()),
                ParsingError::ScanningError(e) => match e {
                    ScanningError::UnexpectedEndOfFile => format!("Encountered error while scanning: Unexpected end of file"),
                    ScanningError::UnexpectedCharacter(c) => format!("Encountered error while scanning: Unexpected character {} at {}:{}", c.item, c.from.line, c.from.offset.unwrap()),
                    ScanningError::InvalidLiteral(l) => format!("Encountered error while scanning: Invalid literal at {}:{}", l.from.line, l.from.offset.unwrap())
                }
            };

            return ShaderCompilationResult {
                has_error: true,
                errors: vec![error_msg],
                warnings: vec![],
            }
        }
    };

    let mut program_data = motokigo::compiler::program_data::ProgramData::new();
    match motokigo::compiler::resolve_types::resolve(&mut program, &mut program_data) {
        Ok(_) => {
            return ShaderCompilationResult {
                has_error: false,
                errors: vec![],
                warnings: vec![],
            }
        },
        Err(t) => {
            return ShaderCompilationResult {
                has_error: true,
                errors: vec![format!("{}", t)],
                warnings: vec![]
            }
        }
    }
}

#[wasm_bindgen]
pub fn shader_compilation_output_errors(result: ShaderCompilationResult) -> String {
    result.errors[0].clone()
}



#[wasm_bindgen]
pub fn shade_window_space(width: usize, height: usize, shader: String) -> wasm_bindgen::Clamped<Vec<u8>> {
    let mut program = motokigo::parser::parse(&shader).unwrap();
    let mut program_data = motokigo::compiler::program_data::ProgramData::new();
    motokigo::compiler::resolve_types::resolve(&mut program, &mut program_data).unwrap();
    let compiled =  motokigo::compiler::codegen(program, program_data);

    let mut shadelang_vm = motokigo::vm::VirtualMachine::new(&compiled);

    let mut image_data = vec![0; width * height * 4];

    log(&format!("{:?}", compiled.data.clone()));

    use motokigo::vm::*;

    for y in 0..height {
        for x in 0..width {
            let mut vm = shadelang_vm.clone();

            vm.set_global("ux", x as f32 / width as f32);
            vm.set_global("uy", y as f32 / height as f32);

            let mut vm = match vm.run_fn("main", vec![]) {
                VMState::VMRunFinished(s) => s.reset(),
                _ => {
                    log("Not implemented");
                    panic!();
                }
            };

            let color: [f32; 3] = unsafe { vm.pop_stack() };
            let i_base = (x + y * width) * 4;

            image_data[i_base + 0] = (color[0] * 255.0) as u8;
            image_data[i_base + 1] = (color[1] * 255.0) as u8;
            image_data[i_base + 2] = (color[2] * 255.0) as u8;
            image_data[i_base + 3] = 255;

        }
    }

    return wasm_bindgen::Clamped(image_data);
}
