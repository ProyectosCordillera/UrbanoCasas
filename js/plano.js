// ========================================
// Funcionalidad del Plano Urbano
// ========================================

// Configuración con dimensiones reales del plano
const PLANO_ANCHO_REAL = 1275;  // Ancho en píxeles del plano
const PLANO_ALTO_REAL = 1650;   // Alto en píxeles del plano

// Zona válida para marcación
const ZONA_VALIDA = {
    xMin: 50,
    xMax: 1225,
    yMin: 50,
    yMax: 1600
};

// Diccionario de coordenadas ajustado
const coordenadasCasas = {};

// Coordenadas para las casas 33-47
for (let i = 33; i <= 47; i++) {
    coordenadasCasas[i] = {
        x: 455,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 1268 - (i - 33) * 60))
    };
}

// Coordenadas para las casas 48-65
for (let i = 48; i <= 65; i++) {
    coordenadasCasas[i] = {
        x: 145,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 437 + (i - 48) * 60))
    };
}

/**
 * Verificar coordenadas al cargar
 */
function verificarCoordenadas() {
    console.log("Verificación de coordenadas:");
    console.log(`Dimensiones del plano: ${PLANO_ANCHO_REAL}x${PLANO_ALTO_REAL}`);
    
    for (const [casa, coord] of Object.entries(coordenadasCasas)) {
        const valida = (
            coord.x >= ZONA_VALIDA.xMin && 
            coord.x <= ZONA_VALIDA.xMax && 
            coord.y >= ZONA_VALIDA.yMin && 
            coord.y <= ZONA_VALIDA.yMax
        );
        
        if (!valida) {
            console.warn(`Casa ${casa} fuera de zona válida:`, coord);
        }
    }
}

/**
 * Agregar marcador al plano
 * @param {string} numeroCasa - Número de casa
 * @param {number} originalX - Coordenada X original
 * @param {number} originalY - Coordenada Y original
 */
function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (!imgPlano || !marcadoresContainer) return;

    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';
    
    // Esperar a que la imagen esté cargada
    if (!imgPlano.complete) {
        imgPlano.onload = function() {
            agregarMarcador(numeroCasa, originalX, originalY);
        };
        return;
    }
    
    // Calcular relación de escala
    const scaleX = imgPlano.clientWidth / PLANO_ANCHO_REAL;
    const scaleY = imgPlano.clientHeight / PLANO_ALTO_REAL;
    
    // Calcular posición ajustada
    const x = originalX * scaleX;
    const y = originalY * scaleY;
    
    // Verificar que esté dentro del plano visible
    if (x < 0 || x > imgPlano.clientWidth || y < 0 || y > imgPlano.clientHeight) {
        console.error('Coordenadas fuera del plano visible:', {numeroCasa, x, y});
        Swal.fire('Error', `La casa ${numeroCasa} no puede mostrarse (fuera del área visible)`, 'error');
        return;
    }
    
    // Crear marcador
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = x + 'px';
    marcador.style.top = y + 'px';
    marcador.textContent = numeroCasa;
    marcadoresContainer.appendChild(marcador);
    
    console.log(`Marcador ${numeroCasa} en:`, {x, y});
}

/**
 * Cargar marca seleccionada desde dropdown
 */
function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa === '0') return;

    // Mostrar el número en el campo de texto
    document.getElementById('txtNumeroCasa').value = numeroCasa;

    // Obtener datos de la marca
    const marca = obtenerMarcaPorNumero(numeroCasa);
    if (marca) {
        // Mostrar cliente si existe
        if (marca.cliente) {
            document.getElementById('txtCliente').value = marca.cliente;
        }
        
        // Mostrar marcador en el plano
        if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
            const coords = coordenadasCasas[numeroCasa];
            agregarMarcador(numeroCasa, coords.x, coords.y);
        }
    }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
    document.getElementById('txtNumeroCasa').value = '';
    document.getElementById('txtCliente').value = '';
    document.getElementById('ddlMarcas').value = '0';
    document.getElementById('marcadoresContainer').innerHTML = '';
    document.getElementById('txtNumeroCasa').focus();
}

/**
 * Habilitar campo de número de casa (modo nuevo)
 */
function habilitarNumeroCasa() {
    limpiarFormulario();
    Swal.fire({
        title: 'Nuevo registro',
        text: 'Ingrese el número de casa y haga clic en "Aplicar"',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
    });
}

/**
 * Marcar en el plano
 */
function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const txtCliente = document.getElementById('txtCliente');
    const numeroCasa = txtNumeroCasa.value.trim();
    const cliente = txtCliente.value.trim();

    if (!numeroCasa) {
        Swal.fire('Error', 'Por favor ingrese un número de casa válido', 'error');
        return;
    }

    // Verificar si el número ya existe
    if (obtenerMarcaPorNumero(numeroCasa)) {
        Swal.fire({
            title: 'Número existente',
            text: 'Esta casa ya está registrada en el sistema',
            icon: 'warning'
        });
        return;
    }

    // Verificar si existe en coordenadas
    if (!coordenadasCasas.hasOwnProperty(numeroCasa)) {
        Swal.fire('Error', `La casa número ${numeroCasa} no fue encontrada en el plano`, 'error');
        return;
    }

    // Obtener coordenadas
    const coords = coordenadasCasas[numeroCasa];
    
    // Crear objeto marca
    const marca = {
        numeroCasa: numeroCasa,
        cliente: cliente,
        x: coords.x,
        y: coords.y,
        fecha: new Date().toISOString()
    };

    // Guardar en localStorage
    guardarMarca(marca);
    
    // Mostrar marcador
    agregarMarcador(numeroCasa, coords.x, coords.y);
    
    // Actualizar dropdown
    cargarMarcasDropdown();
    
    // Limpiar campos
    txtNumeroCasa.value = '';
    txtCliente.value = '';
    
    // Mensaje de éxito
    Swal.fire('Éxito', 'Datos guardados correctamente', 'success');
}

/**
 * Eliminar marca
 */
function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa === '0') {
        Swal.fire('Advertencia', 'Seleccione una marca para eliminar', 'warning');
        return;
    }

    Swal.fire({
        title: '¿Eliminar esta marca?',
        text: `La casa número ${numeroCasa} será eliminada`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            if (eliminarMarcaStorage(numeroCasa)) {
                limpiarFormulario();
                cargarMarcasDropdown();
                Swal.fire('Éxito', 'Marca eliminada correctamente', 'success');
            } else {
                Swal.fire('Error', 'No se pudo eliminar la marca', 'error');
            }
        }
    });
}

/**
 * Recalcular posiciones al redimensionar
 */
function recalcularPosiciones() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;
    
    if (numeroCasa !== '0' && coordenadasCasas.hasOwnProperty(numeroCasa)) {
        const coords = coordenadasCasas[numeroCasa];
        document.getElementById('marcadoresContainer').innerHTML = '';
        agregarMarcador(numeroCasa, coords.x, coords.y);
    }
}

/**
 * Imprimir plano
 */
function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        Swal.fire('Advertencia', 'Primero aplique un número de casa para marcar en el plano', 'warning');
        return;
    }

    // Mostrar vista previa de impresión
    Swal.fire({
        title: 'Preparando para imprimir',
        text: 'El plano se abrirá en una nueva ventana para impresión',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
    });

    // Esperar un momento y luego imprimir
    setTimeout(() => {
        window.print();
    }, 1600);
}

/**
 * Inicializar funcionalidad del plano
 */
function initPlano() {
    verificarCoordenadas();
    cargarMarcasDropdown();
    
    // Si hay una casa seleccionada, cargarla
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (ddlMarcas && ddlMarcas.value !== '0') {
        cargarMarcaSeleccionada();
    }
    
    // Event listener para redimensionar
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(recalcularPosiciones, 200);
    });
    
    console.log('✔ Plano inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initPlano);
