// ============================================
// CONFIGURACIÓN DE COORDENADAS Y VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

const ZONA_VALIDA = {
    xMin: 50,
    xMax: 1225,
    yMin: 50,
    yMax: 1600
};

// Diccionario de coordenadas ajustado para segunda etapa
const coordenadasCasas = {};

// Coordenadas para las casas 1-16 (zona morada derecha)
for (let i = 1; i <= 16; i++) {
    coordenadasCasas[i] = {
        x: 925,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 1265 + (i - 1) * -60))
    };
}

// Coordenadas para las casas 17-32 (zona morada izquierda)
for (let i = 17; i <= 32; i++) {
    coordenadasCasas[i] = {
        x: 630,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 365 + (i - 17) * 60))
    };
}

// ============================================
// INICIALIZACIÓN SEGURA DE DATOS
// ============================================

function inicializarStorage() {
    try {
        let marcas = localStorage.getItem('marcasSegundaEtapa');
        
        if (!marcas) {
            localStorage.setItem('marcasSegundaEtapa', JSON.stringify([]));
            console.log('✓ localStorage inicializado para segunda etapa');
        } else {
            JSON.parse(marcas);
        }
        
        return true;
    } catch (error) {
        console.error('✗ Error inicializando localStorage:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de almacenamiento',
            text: 'No se puede guardar datos. Verifica que tu navegador permita cookies y almacenamiento local.',
            footer: '<a href="https://support.google.com/chrome/answer/95647" target="_blank">¿Cómo habilitar cookies?</a>'
        });
        return false;
    }
}

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    verificarCoordenadas();
    
    if (inicializarStorage()) {
        cargarMarcasDesdeStorage();
    }
});

function verificarCoordenadas() {
    console.log("Verificación de coordenadas - Segunda Etapa:");
    console.log(`Dimensiones del plano: ${PLANO_ANCHO_REAL}x${PLANO_ALTO_REAL}`);
    
    for (const [casa, coord] of Object.entries(coordenadasCasas)) {
        const valida = (
            coord.x >= ZONA_VALIDA.xMin && 
            coord.x <= ZONA_VALIDA.xMax && 
            coord.y >= ZONA_VALIDA.yMin && 
            coord.y <= ZONA_VALIDA.yMax
        );
        
        if (!valida) {
            console.warn(`⚠ Casa ${casa} fuera de zona válida:`, coord);
        }
    }
}

// ============================================
// CARGA DE DATOS DESDE STORAGE
// ============================================

function cargarMarcasDesdeStorage() {
    try {
        const marcasJSON = localStorage.getItem('marcasSegundaEtapa');
        const marcas = JSON.parse(marcasJSON) || [];
        
        const ddlMarcas = document.getElementById('ddlMarcas');
        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';
        
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.numeroCasa;
            option.textContent = `Casa ${marca.numeroCasa} - ${marca.cliente}`;
            ddlMarcas.appendChild(option);
        });
        
        console.log(`✓ Cargadas ${marcas.length} marcas desde localStorage`);
    } catch (error) {
        console.error('✗ Error cargando marcas:', error);
        Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
    }
}

// ============================================
// VALIDACIÓN DE ENTRADA (¡RANGO DIFERENTE!)
// ============================================

function validarNumeroCasa(numero) {
    const num = numero.trim();
    
    if (!/^\d+$/.test(num)) {
        Swal.fire('Advertencia', 'El número de casa debe ser numérico', 'warning');
        return null;
    }
    
    const numeroInt = parseInt(num, 10);
    
    // ⚠️ RANGO DIFERENTE: 1-32 para segunda etapa (vs 33-65 en primera)
    if (numeroInt < 1 || numeroInt > 32) {
        Swal.fire({
            icon: 'warning',
            title: 'Número fuera de rango',
            text: `La segunda etapa solo incluye casas del 1 al 32. Casa ${numeroInt} no existe en este plano.`
        });
        return null;
    }
    
    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        Swal.fire({
            icon: 'error',
            title: 'Casa no encontrada',
            text: `No se encontraron coordenadas para la casa ${numeroInt} en el plano de segunda etapa.`
        });
        return null;
    }
    
    return numeroInt;
}

// ============================================
// FUNCIONES DE MANEJO DE FORMULARIO
// ============================================

function habilitarNumeroCasa() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    txtNumeroCasa.value = '';
    txtNumeroCasa.disabled = false;
    txtNumeroCasa.focus();
    
    document.getElementById('marcadoresContainer').innerHTML = '';
    document.getElementById('txtCliente').value = '';
}

function limpiarFormulario() {
    document.getElementById('txtNumeroCasa').value = '';
    document.getElementById('ddlMarcas').value = '0';
    document.getElementById('marcadoresContainer').innerHTML = '';
    document.getElementById('txtCliente').value = '';
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    marcadoresContainer.innerHTML = '';
    
    if (!imgPlano.complete) {
        imgPlano.onload = function() {
            agregarMarcador(numeroCasa, originalX, originalY);
        };
        return;
    }
    
    const scaleX = imgPlano.clientWidth / PLANO_ANCHO_REAL;
    const scaleY = imgPlano.clientHeight / PLANO_ALTO_REAL;
    
    const x = originalX * scaleX;
    const y = originalY * scaleY;
    
    if (x < 0 || x > imgPlano.clientWidth || y < 0 || y > imgPlano.clientHeight) {
        console.error('⚠ Coordenadas fuera del plano visible:', {numeroCasa, x, y});
        Swal.fire('Error', `La casa ${numeroCasa} no puede mostrarse (fuera del área visible)`, 'error');
        return;
    }
    
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = x + 'px';
    marcador.style.top = y + 'px';
    marcador.textContent = numeroCasa;
    marcadoresContainer.appendChild(marcador);
    
    console.log(`✓ Marcador ${numeroCasa} posicionado en: X=${x.toFixed(1)}, Y=${y.toFixed(1)}`);
}

function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa > 0) {
        document.getElementById('txtNumeroCasa').value = numeroCasa;
        document.getElementById('txtNumeroCasa').disabled = true;

        if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
            document.getElementById('marcadoresContainer').innerHTML = '';
            const coords = coordenadasCasas[numeroCasa];
            agregarMarcador(numeroCasa, coords.x, coords.y);
            
            try {
                const marcas = JSON.parse(localStorage.getItem('marcasSegundaEtapa')) || [];
                const marca = marcas.find(m => m.numeroCasa == numeroCasa);
                if (marca) {
                    document.getElementById('txtCliente').value = marca.cliente || '';
                }
            } catch (e) {
                console.warn('No se pudo cargar el cliente:', e);
            }
        } else {
            Swal.fire('Error', `No se encontraron coordenadas para la casa ${numeroCasa}`, 'error');
        }
    }
}

// ============================================
// GUARDADO SEGURO EN STORAGE
// ============================================

function guardarMarcaEnStorage(numeroCasa, cliente, x, y) {
    return new Promise((resolve, reject) => {
        try {
            let marcas = [];
            const storedData = localStorage.getItem('marcasSegundaEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            const existe = marcas.some(m => m.numeroCasa == numeroCasa);
            if (existe) {
                reject(`La casa ${numeroCasa} ya está registrada`);
                return;
            }
            
            marcas.push({
                numeroCasa: parseInt(numeroCasa),
                cliente: cliente.trim() || 'Cliente no especificado',
                coordenadas: { x: x, y: y },
                fecha: new Date().toISOString()
            });
            
            localStorage.setItem('marcasSegundaEtapa', JSON.stringify(marcas));
            
            console.log(`✓ Marca ${numeroCasa} guardada exitosamente`);
            resolve();
            
        } catch (error) {
            console.error('✗ Error guardando en localStorage:', error);
            reject('Error al guardar los datos: ' + error.message);
        }
    });
}

// ============================================
// FUNCIÓN PRINCIPAL DE GUARDADO
// ============================================

function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const numeroCasaRaw = txtNumeroCasa.value.trim();
    const txtCliente = document.getElementById('txtCliente').value.trim();
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const ddlMarcas = document.getElementById('ddlMarcas');

    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;

    if (!txtCliente) {
        Swal.fire({
            icon: 'warning',
            title: 'Cliente requerido',
            text: 'Por favor ingrese el nombre del cliente'
        });
        return;
    }

    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            Swal.fire({
                icon: 'warning',
                title: 'Casa ya registrada',
                text: `La casa número ${numeroCasa} ya está registrada en el sistema`
            });
            return;
        }
    }

    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        Swal.fire('Error', `Coordenadas no encontradas para la casa ${numeroCasa}`, 'error');
        return;
    }

    agregarMarcador(numeroCasa, coords.x, coords.y);

    guardarMarcaEnStorage(numeroCasa, txtCliente, coords.x, coords.y)
        .then(() => {
            txtNumeroCasa.value = '';
            txtNumeroCasa.disabled = true;
            document.getElementById('txtCliente').value = '';
            
            Swal.fire({
                icon: 'success',
                title: '¡Guardado exitoso!',
                text: `Casa ${numeroCasa} asignada a ${txtCliente}`,
                timer: 2000,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                cargarMarcasDesdeStorage();
                ddlMarcas.value = numeroCasa.toString();
            }, 300);
            
        })
        .catch(error => {
            marcadoresContainer.innerHTML = '';
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: error || 'No se pudo guardar la marca. Intente nuevamente.'
            });
        });
}

// ============================================
// ELIMINACIÓN DE MARCAS
// ============================================

function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa == '0') {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione una marca',
            text: 'Debe seleccionar una casa del dropdown para eliminar'
        });
        return;
    }

    Swal.fire({
        title: '¿Eliminar esta marca?',
        html: `La casa número <strong>${numeroCasa}</strong> será eliminada permanentemente`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarMarcaDeStorage(numeroCasa)
                .then(() => {
                    limpiarFormulario();
                    cargarMarcasDesdeStorage();
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: `Casa ${numeroCasa} eliminada correctamente`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                })
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar',
                        text: error || 'No se pudo eliminar la marca'
                    });
                });
        }
    });
}

function eliminarMarcaDeStorage(numeroCasa) {
    return new Promise((resolve, reject) => {
        try {
            let marcas = [];
            const storedData = localStorage.getItem('marcasSegundaEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            const nuevasMarcas = marcas.filter(marca => marca.numeroCasa != numeroCasa);
            
            if (marcas.length === nuevasMarcas.length) {
                reject('La marca no fue encontrada para eliminar');
                return;
            }
            
            localStorage.setItem('marcasSegundaEtapa', JSON.stringify(nuevasMarcas));
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
}

// ============================================
// IMPRESIÓN Y REDIMENSIONAMIENTO
// ============================================

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin marcadores',
            text: 'Primero aplique un número de casa para marcar en el plano'
        });
        return false;
    }

    window.print();
    return false;
}

function recalcularPosiciones() {
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer.children.length > 0) {
        const numeroCasa = document.getElementById('txtNumeroCasa').value.trim();
        const numValido = parseInt(numeroCasa, 10);
        if (numeroCasa && !isNaN(numValido) && coordenadasCasas.hasOwnProperty(numValido)) {
            const coords = coordenadasCasas[numValido];
            marcadoresContainer.innerHTML = '';
            agregarMarcador(numValido, coords.x, coords.y);
        }
    }
}

let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(recalcularPosiciones, 200);
});
