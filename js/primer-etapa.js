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

// ============================================
// INICIALIZACIÓN SEGURA DE DATOS
// ============================================

function inicializarStorage() {
    try {
        // Verificar si existe en localStorage
        let marcas = localStorage.getItem('marcasPrimerEtapa');
        
        if (!marcas) {
            // Inicializar con array vacío si no existe
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify([]));
            console.log('✓ localStorage inicializado para primer etapa');
        } else {
            // Validar que sea JSON válido
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
    
    // Inicializar storage antes de cargar datos
    if (inicializarStorage()) {
        cargarMarcasDesdeStorage();
    }
});

function verificarCoordenadas() {
    console.log("Verificación de coordenadas - Primer Etapa:");
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
        const marcasJSON = localStorage.getItem('marcasPrimerEtapa');
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
// VALIDACIÓN DE ENTRADA
// ============================================

function validarNumeroCasa(numero) {
    // Eliminar espacios y validar que sea numérico
    const num = numero.trim();
    
    if (!/^\d+$/.test(num)) {
        Swal.fire('Advertencia', 'El número de casa debe ser numérico', 'warning');
        return null;
    }
    
    const numeroInt = parseInt(num, 10);
    
    // Verificar rango válido (33-65 para primera etapa)
    if (numeroInt < 33 || numeroInt > 65) {
        Swal.fire({
            icon: 'warning',
            title: 'Número fuera de rango',
            text: `La primera etapa solo incluye casas del 33 al 65. Casa ${numeroInt} no existe en este plano.`
        });
        return null;
    }
    
    // Verificar que existan coordenadas para esta casa
    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        Swal.fire({
            icon: 'error',
            title: 'Casa no encontrada',
            text: `No se encontraron coordenadas para la casa ${numeroInt} en el plano de primera etapa.`
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
    
    // Limpiar marcadores
    document.getElementById('marcadoresContainer').innerHTML = '';
    
    // Limpiar cliente
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
        console.error('⚠ Coordenadas fuera del plano visible:', {numeroCasa, x, y});
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
            
            // Buscar cliente en localStorage
            try {
                const marcas = JSON.parse(localStorage.getItem('marcasPrimerEtapa')) || [];
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
            // Obtener datos existentes
            let marcas = [];
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            // Verificar si ya existe
            const existe = marcas.some(m => m.numeroCasa == numeroCasa);
            if (existe) {
                reject(`La casa ${numeroCasa} ya está registrada`);
                return;
            }
            
            // Agregar nueva marca
            marcas.push({
                numeroCasa: parseInt(numeroCasa),
                cliente: cliente.trim() || 'Cliente no especificado',
                coordenadas: { x: x, y: y },
                fecha: new Date().toISOString()
            });
            
            // Guardar en localStorage
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
            
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

    // Validar número de casa
    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;

    // Validar cliente
    if (!txtCliente) {
        Swal.fire({
            icon: 'warning',
            title: 'Cliente requerido',
            text: 'Por favor ingrese el nombre del cliente'
        });
        return;
    }

    // Verificar si ya existe en el dropdown
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

    // Obtener coordenadas
    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        Swal.fire('Error', `Coordenadas no encontradas para la casa ${numeroCasa}`, 'error');
        return;
    }

    // Mostrar marcador visualmente primero
    agregarMarcador(numeroCasa, coords.x, coords.y);

    // Guardar en storage
    guardarMarcaEnStorage(numeroCasa, txtCliente, coords.x, coords.y)
        .then(() => {
            // Éxito: limpiar formulario y recargar dropdown
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
            
            // Recargar dropdown después de un breve delay
            setTimeout(() => {
                cargarMarcasDesdeStorage();
                ddlMarcas.value = numeroCasa.toString();
            }, 300);
            
        })
        .catch(error => {
            // Error: eliminar marcador visual y mostrar mensaje
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
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            // Filtrar para eliminar la marca
            const nuevasMarcas = marcas.filter(marca => marca.numeroCasa != numeroCasa);
            
            if (marcas.length === nuevasMarcas.length) {
                reject('La marca no fue encontrada para eliminar');
                return;
            }
            
            // Guardar de nuevo
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify(nuevasMarcas));
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

    const imgPlano = document.getElementById('imgPlano');
    const marcador = marcadores[0];
    const numeroCasa = marcador.textContent;

    // Obtener coordenadas originales de la casa
    const casa = parseInt(numeroCasa, 10);
    if (!coordenadasCasas.hasOwnProperty(casa)) {
        Swal.fire('Error', 'Coordenadas no encontradas para la impresión', 'error');
        return false;
    }

    const coordsOriginales = coordenadasCasas[casa];
    const coordX = coordsOriginales.x;
    const coordY = coordsOriginales.y;

    Swal.fire({
        title: 'Preparando impresión',
        html: `<div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Calculando posición exacta del marcador...</p>
                <small class="text-muted">Casa ${numeroCasa} en coordenadas (${coordX}, ${coordY})</small>
            </div>`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(null);

            setTimeout(() => {
                // 1. Dimensiones reales del plano
                const imgWidth = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
                const imgHeight = imgPlano.naturalHeight || PLANO_ALTO_REAL;

                // 2. Tamaño de hoja carta en píxeles (asumiendo 96 DPI)
                const pageWidth = 8.5 * 96;  // 816px
                const pageHeight = 11 * 96;  // 1056px
                const margin = 40; // Margen en píxeles

                // 3. Calcular escala máxima que cabe en la hoja
                const scaleX = (pageWidth - 2 * margin) / imgWidth;
                const scaleY = (pageHeight - 2 * margin) / imgHeight;
                const scale = Math.min(scaleX, scaleY);

                // 4. Dimensiones del plano escalado
                const printWidth = imgWidth * scale;
                const printHeight = imgHeight * scale;

                // 5. Calcular posición del marcador ESCALADA
                const markerX = (coordX / imgWidth) * printWidth;
                const markerY = (coordY / imgHeight) * printHeight;

                // 6. Tamaño del marcador para impresión
                const markerSize = 42; // Tamaño fijo para impresión
                const fontSize = 20;

                // 7. Crear ventana de impresión con marcador posicionado EXACTAMENTE
                const printWindow = window.open('', '_blank', 'width=800,height=1000');
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Plano - Casa ${numeroCasa}</title>
                        <style>
                            @page {
                                size: letter portrait;
                                margin: 0;
                            }
                            body {
                                margin: ${margin}px;
                                padding: 0;
                                width: ${pageWidth - 2 * margin}px;
                                height: ${pageHeight - 2 * margin}px;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                background: white;
                            }
                            .print-container {
                                position: relative;
                                width: ${printWidth}px;
                                height: ${printHeight}px;
                            }
                            .print-image {
                                width: 100%;
                                height: 100%;
                                display: block;
                            }
                            .print-marker {
                                position: absolute;
                                left: ${markerX}px;
                                top: ${markerY}px;
                                width: ${markerSize}px;
                                height: ${markerSize}px;
                                background-color: #dc3545;
                                color: white;
                                border: 2px solid white;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                font-size: ${fontSize}px;
                                transform: translate(-50%, -50%);
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                            }
                        </style>
                    </head>
                    <body onload="setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 100); }, 200);">
                        <div class="print-container">
                            <img class="print-image" src="${imgPlano.src}" alt="Plano">
                            <div class="print-marker">${numeroCasa}</div>
                        </div>
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                Swal.close();
            }, 300);
        }
    });

    return false;
}
