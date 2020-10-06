mod utils;

use wasm_bindgen::prelude::*;

use motokigo;
use renderjack;

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
pub fn shade_window_space(width: usize, height: usize, shader: String) -> wasm_bindgen::Clamped<Vec<u8>> {
    let mut program = motokigo::parser::parse(&shader);
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
