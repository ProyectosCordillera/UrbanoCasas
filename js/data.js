// ========================================
// Manejo de datos con localStorage
// ========================================

/**
 * Inicializar datos en localStorage
 */
function initData() {
    if (!localStorage.getItem('marcasPrimerEtapa')) {
        localStorage.setItem('marcasPrimerEtapa', JSON.stringify([]));
    }
    console.log('✔ Datos inicializados');
}

/**
 * Guardar marca en localStorage
 * @param {Object} marca - Objeto con datos de la marca
 */
function guardarMarca(marca) {
    const marcas = obtenerMarcas();
    marcas.push(marca);
    localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
    console.log('Marca guardada:', marca);
}

/**
 * Obtener todas las marcas
 * @returns {Array} Array de marcas
 */
function obtenerMarcas() {
    const data = localStorage.getItem('marcasPrimerEtapa');
    return data ? JSON.parse(data) : [];
}

/**
 * Obtener marca por número de casa
 * @param {string} numeroCasa - Número de casa
 * @returns {Object|null} Marca o null
 */
function obtenerMarcaPorNumero(numeroCasa) {
    const marcas = obtenerMarcas();
    return marcas.find(m => m.numeroCasa === numeroCasa) || null;
}

/**
 * Eliminar marca por número de casa
 * @param {string} numeroCasa - Número de casa
 * @returns {boolean} Éxito de la operación
 */
function eliminarMarcaStorage(numeroCasa) {
    let marcas = obtenerMarcas();
    const lengthAntes = marcas.length;
    marcas = marcas.filter(m => m.numeroCasa !== numeroCasa);
    localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
    return marcas.length < lengthAntes;
}

/**
 * Cargar marcas en el dropdown
 */
function cargarMarcasDropdown() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;

    const marcas = obtenerMarcas();
    ddlMarcas.innerHTML = '<option value="0">Seleccione una casa</option>';
    
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca.numeroCasa;
        option.textContent = `Casa #${marca.numeroCasa}`;
        if (marca.cliente) {
            option.textContent += ` - ${marca.cliente}`;
        }
        ddlMarcas.appendChild(option);
    });
}

// Inicializar datos al cargar
document.addEventListener('DOMContentLoaded', initData);
