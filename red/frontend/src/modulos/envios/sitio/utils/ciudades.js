// Lista única de ciudades para el cotizador, la edición y el panel.
// El valor que se guarda en la base va en minúsculas.
export const CIUDADES = [
  ['tarapoto', 'Tarapoto'], ['moyobamba', 'Moyobamba'], ['yurimaguas', 'Yurimaguas'],
  ['lima', 'Lima'], ['chiclayo', 'Chiclayo'], ['trujillo', 'Trujillo'], ['piura', 'Piura'],
  ['arequipa', 'Arequipa'], ['cuzco', 'Cuzco'], ['iquitos', 'Iquitos'], ['pucallpa', 'Pucallpa'],
  ['huancayo', 'Huancayo'], ['ayacucho', 'Ayacucho'], ['cajamarca', 'Cajamarca'], ['ica', 'Ica'],
  ['puno', 'Puno'], ['tacna', 'Tacna'], ['tumbes', 'Tumbes'], ['moquegua', 'Moquegua']
];

export const normalizarCiudad = (valor) => String(valor ?? '').trim().toLowerCase();
