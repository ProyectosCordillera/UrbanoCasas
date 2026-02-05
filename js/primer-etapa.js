// ============================================
// CONFIGURACIÓN DE COORDENADAS Y VARIABLES
// ============================================

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
var coordenadasCasas = {};

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

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

// Inicializar la página al cargar
document.addEventListener('DOMContentLoaded', function() {
    verificarCoordenadas();
    cargarMarcasDesdeJSON();
});

// Función para verificar coordenadas
function verificarCoordenadas() {
    console.log("Verificación de coordenadas respecto al plano real:");
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

// ============================================
// FUNCIONES DE CARGA DE DATOS
// ============================================

// Cargar marcas desde archivo JSON
function cargarMarcasDesdeJSON() {
    fetch('../data/marcas.json')
        .then(response => response.json())
        .then(data => {
            const ddlMarcas = document.getElementById('ddlMarcas');
            ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';
            
            data.marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.numeroCasa;
                option.textContent = `Casa ${marca.numeroCasa} - ${marca.cliente}`;
                ddlMarcas.appendChild(option);
            });
            
            // Si hay una casa seleccionada, cargarla
            if (ddlMarcas.value && ddlMarcas.value != '0') {
                cargarMarcaSeleccionada();
            }
        })
        .catch(error => {
            console.error('Error cargando marcas:', error);
            Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
        });
}

// ============================================
// FUNCIONES DE MANEJO DE FORMULARIO
// ============================================

// Habilitar campo de número de casa
function habilitarNumeroCasa() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    txtNumeroCasa.value = '';
    txtNumeroCasa.disabled = false;
    txtNumeroCasa.focus();
    
    // Limpiar marcadores
    document.getElementById('marcadoresContainer').innerHTML = '';
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('txtNumeroCasa').value = '';
    document.getElementById('ddlMarcas').value = '0';
    document.getElementById('marcadoresContainer').innerHTML = '';
    document.getElementById('txtCliente').value = '';
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

// Agregar marcador al plano
function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';
    
    // Verificar si la imagen está cargada
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
    
    console.log(`Marcador ${numeroCasa} en:`, {x, y, originalX, originalY});
}

// Cargar marca seleccionada
function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa > 0) {
        // Mostrar el número en el campo de texto
        document.getElementById('txtNumeroCasa').value = numeroCasa;
        document.getElementById('txtNumeroCasa').disabled = true;

        // Obtener coordenadas desde el diccionario local
        if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
            const coords = coordenadasCasas[numeroCasa];
            
            // Limpiar marcadores existentes
            document.getElementById('marcadoresContainer').innerHTML = '';

            // Crear nuevo marcador
            agregarMarcador(numeroCasa, coords.x, coords.y);
        } else {
            Swal.fire('Error', `No se encontraron coordenadas para la casa ${numeroCasa}`, 'error');
        }
    }
}

// ============================================
// FUNCIONES DE GUARDADO Y ELIMINACIÓN
// ============================================

// Marcar en plano (guardar nueva marca)
function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const numeroCasa = txtNumeroCasa.value.trim();
    const txtCliente = document.getElementById('txtCliente').value.trim();
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const ddlMarcas = document.getElementById('ddlMarcas');

    if (!numeroCasa) {
        Swal.fire('Advertencia', 'Por favor ingrese un número de casa válido', 'warning');
        return;
    }

    if (!txtCliente) {
        Swal.fire('Advertencia', 'Por favor ingrese el nombre del cliente', 'warning');
        return;
    }

    // Verificar si el número ya existe en el dropdown
    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            Swal.fire({
                title: 'Número existente',
                text: 'Esta casa ya está registrada en el sistema',
                icon: 'warning'
            });
            return;
        }
    }

    if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
        const coords = coordenadasCasas[numeroCasa];
        agregarMarcador(numeroCasa, coords.x, coords.y);

        // Guardar en JSON (simulación)
        guardarMarcaEnJSON(numeroCasa, txtCliente, coords.x, coords.y)
            .then(() => {
                txtNumeroCasa.value = '';
                txtNumeroCasa.disabled = true;
                document.getElementById('txtCliente').value = '';
                Swal.fire('Éxito', 'Datos guardados correctamente', 'success');
                // Recargar dropdown
                cargarMarcasDesdeJSON();
            })
            .catch(error => {
                marcadoresContainer.innerHTML = '';
                Swal.fire('Error', 'Error al guardar los datos: ' + error, 'error');
            });
    } else {
        Swal.fire('Error', 'La casa número ' + numeroCasa + ' no fue encontrada en el plano', 'error');
    }
}

// Guardar marca en archivo JSON (simulación con localStorage)
function guardarMarcaEnJSON(numeroCasa, cliente, x, y) {
    return new Promise((resolve, reject) => {
        try {
            // Obtener datos existentes o crear nuevo array
            let marcas = [];
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            // Agregar nueva marca
            marcas.push({
                numeroCasa: parseInt(numeroCasa),
                cliente: cliente,
                coordenadas: { x: x, y: y },
                fecha: new Date().toISOString()
            });
            
            // Guardar en localStorage
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
            
            // También actualizar el archivo JSON simulado
            fetch('../data/marcas.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    numeroCasa: parseInt(numeroCasa),
                    cliente: cliente,
                    coordenadas: { x: x, y: y }
                })
            })
            .then(response => {
                if (response.ok) {
                    resolve();
                } else {
                    reject('Error en la respuesta del servidor');
                }
            })
            .catch(() => {
                // Si falla el fetch, usar localStorage como fallback
                resolve();
            });
        } catch (error) {
            reject(error.message);
        }
    });
}

// Eliminar marca
function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const numeroCasa = ddlMarcas.value;

    if (numeroCasa == '0') {
        Swal.fire('Advertencia', 'Seleccione una marca para eliminar', 'warning');
        return;
    }

    Swal.fire({
        title: '¿Eliminar esta marca?',
        text: "La casa número " + numeroCasa + " será eliminada",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarMarcaDeJSON(numeroCasa)
                .then(() => {
                    limpiarFormulario();
                    cargarMarcasDesdeJSON();
                    Swal.fire('Éxito', 'Marca eliminada correctamente', 'success');
                })
                .catch(error => {
                    Swal.fire('Error', 'No se pudo eliminar la marca: ' + error, 'error');
                });
        }
    });
}

// Eliminar marca del JSON
function eliminarMarcaDeJSON(numeroCasa) {
    return new Promise((resolve, reject) => {
        try {
            let marcas = [];
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
                
                // Filtrar para eliminar la marca
                marcas = marcas.filter(marca => marca.numeroCasa != numeroCasa);
                
                // Guardar de nuevo
                localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
            }
            
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
}

// ============================================
// FUNCIONES DE IMPRESIÓN
// ============================================

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        Swal.fire('Advertencia', 'Primero aplique un número de casa para marcar en el plano', 'warning');
        return false;
    }

    // Obtener elementos
    const planoContainer = document.querySelector('.plano-container');
    const imgPlano = document.getElementById('imgPlano');
    const marcador = marcadores[0];

    // Guardar estilos originales
    const originalStyles = {
        containerWidth: planoContainer.style.width,
        containerHeight: planoContainer.style.height,
        imgWidth: imgPlano.style.width,
        imgHeight: imgPlano.style.height,
        markerLeft: marcador.style.left,
        markerTop: marcador.style.top
    };

    // Obtener dimensiones reales de la imagen
    const imgNaturalWidth = imgPlano.naturalWidth;
    const imgNaturalHeight = imgPlano.naturalHeight;

    // Configurar para impresión (hoja carta 8.5x11 pulgadas)
    const pageWidth = 8.5 * 96;  // 816px
    const pageHeight = 11 * 96;  // 1056px

    // Calcular el máximo tamaño que cabe manteniendo la relación de aspecto
    const scale = Math.min(pageWidth / imgNaturalWidth, pageHeight / imgNaturalHeight);
    const printWidth = imgNaturalWidth * scale;
    const printHeight = imgNaturalHeight * scale;

    // Calcular márgenes para centrar
    const marginLeft = (pageWidth - printWidth) / 2;
    const marginTop = (pageHeight - printHeight) / 2;

    // Aplicar estilos de impresión
    planoContainer.style.width = printWidth + 'px';
    planoContainer.style.height = printHeight + 'px';
    imgPlano.style.width = '100%';
    imgPlano.style.height = '100%';

    // Asegurar que el marcador mantenga su posición relativa
    const originalLeft = parseInt(marcador.style.left);
    const originalTop = parseInt(marcador.style.top);
    marcador.style.left = (originalLeft * scale) + 'px';
    marcador.style.top = (originalTop * scale) + 'px';

    // Configurar estilos específicos para impresión
    marcador.style.backgroundColor = 'red';
    marcador.style.color = 'white';
    marcador.style.border = '2px solid white';
    marcador.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    marcador.style.width = '39px';
    marcador.style.height = '39px';
    marcador.style.fontSize = '18px';

    // Esperar un momento para que se apliquen los cambios y luego imprimir
    setTimeout(function () {
        window.print();

        // Restaurar estilos originales después de imprimir
        planoContainer.style.width = originalStyles.containerWidth;
        planoContainer.style.height = originalStyles.containerHeight;
        imgPlano.style.width = originalStyles.imgWidth;
        imgPlano.style.height = originalStyles.imgHeight;
        marcador.style.left = originalStyles.markerLeft;
        marcador.style.top = originalStyles.markerTop;
        marcador.style.width = '48px';
        marcador.style.height = '48px';
        marcador.style.fontSize = '20px';
    }, 200);

    return false;
}

// ============================================
// FUNCIONES DE REDIMENSIONAMIENTO
// ============================================

function recalcularPosiciones() {
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer.children.length > 0) {
        const numeroCasa = document.getElementById('txtNumeroCasa').value.trim();
        if (numeroCasa && coordenadasCasas.hasOwnProperty(numeroCasa)) {
            const coords = coordenadasCasas[numeroCasa];
            marcadoresContainer.innerHTML = '';
            agregarMarcador(numeroCasa, coords.x, coords.y);
        }
    }
}

// Actualiza el event listener para redimensionar con debounce
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(recalcularPosiciones, 200);
});
