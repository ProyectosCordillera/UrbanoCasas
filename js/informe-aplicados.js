// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM completamente cargado');
    console.log('📝 Versión: 1.0.1 - Corregida');
    
    // Mostrar año en footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    inicializar();
});

function inicializar() {
    const imgPlano = document.getElementById('imgPlano');

    // Evento cuando la imagen carga
    imgPlano.addEventListener('load', function() {
        console.log('✅ Imagen del plano cargada');
        console.log(`📏 Dimensiones: ${imgPlano.naturalWidth}x${imgPlano.naturalHeight}`);
        
        ajustarContenedorMarcadores();
        cargarDatosCombinadosYColocarMarcadores();
    });

    // Evento si la imagen falla
    imgPlano.addEventListener('error', function() {
        console.error('❌ Error cargando imagen del plano');
        Swal.fire({
            icon: 'error',
            title: 'Error de imagen',
            text: 'No se pudo cargar el plano. Verifique que el archivo exista en la ruta correcta.',
            footer: '<code>../img/plano_General.png</code>'
        });
    });

    // Redimensionamiento
    window.addEventListener('resize', manejarRedimensionamiento);

    // Si la imagen ya está cargada
    if (imgPlano.complete && imgPlano.naturalWidth > 0) {
        console.log('✅ Imagen ya estaba cargada');
        ajustarContenedorMarcadores();
        cargarDatosCombinadosYColocarMarcadores();
    } else {
        console.log('⏳ Esperando carga de imagen...');
    }
}

// ============================================
// CARGA DE DATOS COMBINADOS DE AMBAS ETAPAS
// ============================================

function cargarDatosCombinadosYColocarMarcadores() {
    try {
        // Limpiar spinner
        const tbody = document.getElementById('tbodyDatos');
        if (!tbody) {
            console.error('❌ tbodyDatos no encontrado');
            return;
        }

        // Cargar datos de PRIMERA ETAPA
        let marcasPrimera = [];
        try {
            const marcasPrimeraJSON = localStorage.getItem('marcasPrimerEtapa');
            if (marcasPrimeraJSON) {
                marcasPrimera = JSON.parse(marcasPrimeraJSON);
                console.log(`✅ Cargadas ${marcasPrimera.length} marcas de PRIMERA ETAPA`);
            } else {
                console.log('ℹ️ No hay datos en marcasPrimerEtapa');
            }
        } catch (error) {
            console.error('❌ Error parseando marcasPrimerEtapa:', error);
        }

        // Cargar datos de SEGUNDA ETAPA
        let marcasSegunda = [];
        try {
            const marcasSegundaJSON = localStorage.getItem('marcasSegundaEtapa');
            if (marcasSegundaJSON) {
                marcasSegunda = JSON.parse(marcasSegundaJSON);
                console.log(`✅ Cargadas ${marcasSegunda.length} marcas de SEGUNDA ETAPA`);
            } else {
                console.log('ℹ️ No hay datos en marcasSegundaEtapa');
            }
        } catch (error) {
            console.error('❌ Error parseando marcasSegundaEtapa:', error);
        }

        // Combinar ambos conjuntos de datos
        const todasMarcas = [...marcasPrimera, ...marcasSegunda];
        
        console.log(`📊 Total combinado: ${todasMarcas.length} marcas`);

        // Si no hay datos
        if (todasMarcas.length === 0) {
            console.warn('⚠️ No hay marcas registradas');
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <div class="alert alert-info mb-4">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>No hay casas registradas</strong>
                            <p class="mb-0 mt-2">Registre casas en <a href="../paginas/primer-etapa.html" class="alert-link">Primera Etapa</a> 
                            o <a href="../paginas/segunda-etapa.html" class="alert-link">Segunda Etapa</a> para verlas aquí.</p>
                        </div>
                        
                        <div class="d-flex justify-content-center gap-2">
                            <a href="../paginas/primer-etapa.html" class="btn btn-primary">
                                <i class="bi bi-house-door me-1"></i> Ir a Primera Etapa
                            </a>
                            <a href="../paginas/segunda-etapa.html" class="btn btn-success">
                                <i class="bi bi-building me-1"></i> Ir a Segunda Etapa
                            </a>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('marcadoresContainer').innerHTML = '';
            
            return;
        }

        // Llenar la tabla con todos los datos combinados
        llenarTabla(todasMarcas);
        
        // Esperar un momento para que el DOM se actualice
        setTimeout(() => {
            // Colocar los marcadores en el plano
            colocarMarcadores();
        }, 100);

        // Mostrar mensaje de éxito (opcional)
        if (marcasPrimera.length > 0 || marcasSegunda.length > 0) {
            console.log('✅ Datos cargados correctamente');
        }

    } catch (error) {
        console.error('❌ Error general cargando datos:', error);
        
        // Mostrar error en la tabla
        document.getElementById('tbodyDatos').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error al cargar datos</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise me-1"></i> Recargar
                    </button>
                </td>
            </tr>
        `;
        
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar datos',
            text: 'Hubo un problema al cargar la información. Verifique la consola para más detalles.',
            footer: `<code>${error.message}</code>`
        });
    }
}

// ============================================
// LLENAR TABLA CON DATOS COMBINADOS
// ============================================

function llenarTabla(marcas) {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Ordenar por número de casa
    marcas.sort((a, b) => a.numeroCasa - b.numeroCasa);

    let countPrimera = 0;
    let countSegunda = 0;

    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        
        // Determinar etapa según el número de casa
        let etapa = 'Desconocida';
        let claseEtapa = '';
        
        if (marca.numeroCasa >= 33 && marca.numeroCasa <= 65) {
            etapa = 'Primera Etapa';
            claseEtapa = 'table-info';
            countPrimera++;
        } else if (marca.numeroCasa >= 1 && marca.numeroCasa <= 32) {
            etapa = 'Segunda Etapa';
            claseEtapa = 'table-success';
            countSegunda++;
        }
        
        if (claseEtapa) {
            fila.classList.add(claseEtapa);
        }

        // Celda: Número de Casa (SIMPLIFICADO - solo texto, no HTML)
        const celdaNumero = document.createElement('td');
        celdaNumero.className = 'fw-bold';
        celdaNumero.textContent = marca.numeroCasa;
        celdaNumero.setAttribute('data-etapa', etapa); // Guardar etapa como atributo
        
        // Celda: Coordenada X
        const celdaCoordX = document.createElement('td');
        celdaCoordX.className = 'text-center';
        celdaCoordX.textContent = marca.coordenadas?.x || 'N/A';
        
        // Celda: Coordenada Y
        const celdaCoordY = document.createElement('td');
        celdaCoordY.className = 'text-center';
        celdaCoordY.textContent = marca.coordenadas?.y || 'N/A';
        
        // Celda: Cliente
        const celdaCliente = document.createElement('td');
        celdaCliente.textContent = marca.cliente || 'Cliente no especificado';
        
        // Celda: Fecha
        const celdaFecha = document.createElement('td');
        celdaFecha.className = 'text-center';
        if (marca.fecha) {
            const fecha = new Date(marca.fecha);
            celdaFecha.innerHTML = `<small class="text-muted">${fecha.toLocaleDateString('es-ES')}</small>`;
        } else {
            celdaFecha.innerHTML = '<small class="text-muted">Sin fecha</small>';
        }
        
        fila.appendChild(celdaNumero);
        fila.appendChild(celdaCoordX);
        fila.appendChild(celdaCoordY);
        fila.appendChild(celdaCliente);
        fila.appendChild(celdaFecha);
        
        tbody.appendChild(fila);
    });

    console.log(`✅ Tabla llena: ${countPrimera} primera etapa, ${countSegunda} segunda etapa`);
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

function colocarMarcadores() {
    const tabla = document.getElementById('tblCasas');
    if (!tabla) {
        console.error('❌ Tabla tblCasas no encontrada');
        return;
    }

    const tbody = tabla.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error('❌ tbody no encontrado');
        return;
    }

    const filas = tbody.getElementsByTagName('tr');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');

    if (!marcadoresContainer || !imgPlano) {
        console.error('❌ Elementos del DOM no encontrados');
        return;
    }

    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';

    if (!imgPlano.complete) {
        console.warn('⚠️ Imagen no completamente cargada');
        return;
    }

    const planoAnchoReal = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
    const planoAltoReal = imgPlano.naturalHeight || PLANO_ALTO_REAL;
    
    console.log(`📏 Dimensiones plano real: ${planoAnchoReal}x${planoAltoReal}`);
    console.log(`📏 Dimensiones mostradas: ${imgPlano.clientWidth}x${imgPlano.clientHeight}`);

    let marcadoresColocados = 0;
    let errores = 0;

    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].getElementsByTagName('td');

        if (celdas.length < 5) {
            console.warn(`⚠️ Fila ${i} tiene ${celdas.length} celdas (esperadas 5)`);
            errores++;
            continue;
        }

        // Extraer datos de las celdas
        const celdaNumero = celdas[0];
        const numeroCasa = celdaNumero.textContent.trim();
        const coordX = parseInt(celdas[1].textContent.trim(), 10);
        const coordY = parseInt(celdas[2].textContent.trim(), 10);
        const nombreCliente = celdas[3].textContent.trim();
        
        // Obtener etapa desde atributo data
        const etapa = celdaNumero.getAttribute('data-etapa') || 'Desconocida';

        // Validar datos
        if (!numeroCasa || isNaN(coordX) || isNaN(coordY)) {
            console.warn(`⚠️ Datos inválidos en fila ${i + 1}: Casa=${numeroCasa}, X=${coordX}, Y=${coordY}`);
            errores++;
            continue;
        }

        // Calcular posición exacta
        const posX = (coordX / planoAnchoReal) * imgPlano.clientWidth;
        const posY = (coordY / planoAltoReal) * imgPlano.clientHeight;

        // Validar posición
        if (isNaN(posX) || isNaN(posY)) {
            console.warn(`⚠️ Posición inválida para casa ${numeroCasa}`);
            errores++;
            continue;
        }

        // Crear marcador con color según etapa
        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        
        // Colores diferentes según etapa
        if (etapa === 'Primera Etapa') {
            marcador.style.backgroundColor = 'rgba(13, 110, 253, 0.95)'; // Azul más intenso
        } else if (etapa === 'Segunda Etapa') {
            marcador.style.backgroundColor = 'rgba(25, 135, 84, 0.95)'; // Verde más intenso
        } else {
            marcador.style.backgroundColor = 'rgba(220, 53, 69, 0.95)'; // Rojo
        }
        
        marcador.textContent = numeroCasa;
        marcador.style.left = `${posX}px`;
        marcador.style.top = `${posY}px`;
        marcador.title = `Casa ${numeroCasa} - ${etapa}\nCliente: ${nombreCliente}`;

        marcadoresContainer.appendChild(marcador);
        marcadoresColocados++;
    }

    console.log(`✅ ${marcadoresColocados} marcadores colocados en el plano`);
    if (errores > 0) {
        console.warn(`⚠️ ${errores} errores al colocar marcadores`);
    }

    // Mostrar resumen en consola
    if (marcadoresColocados > 0) {
        console.log(`🎉 Plano listo con ${marcadoresColocados} marcadores`);
    }
}

// ============================================
// FUNCIONES DE AJUSTE Y REDIMENSIONAMIENTO
// ============================================

function ajustarContenedorMarcadores() {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    
    if (imgPlano && marcadoresContainer) {
        marcadoresContainer.style.width = `${imgPlano.clientWidth}px`;
        marcadoresContainer.style.height = `${imgPlano.clientHeight}px`;
        console.log(`📐 Contenedor ajustado a: ${imgPlano.clientWidth}x${imgPlano.clientHeight}`);
    }
}

let resizeTimeout;
function manejarRedimensionamiento() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        console.log('🔄 Redimensionando...');
        ajustarContenedorMarcadores();
        colocarMarcadores();
    }, 200);
}

// ============================================
// FUNCIONES DE IMPRESIÓN
// ============================================

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin marcadores',
            text: 'No hay casas registradas para imprimir. Registre casas primero.'
        });
        return false;
    }

    Swal.fire({
        title: 'Preparando impresión',
        html: `<div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Generando plano con ${marcadores.length} marcadores...</p>
                <small class="text-muted">Esto puede tardar unos segundos</small>
            </div>`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(null);

            setTimeout(() => {
                const imgPlano = document.getElementById('imgPlano');
                const imgRealWidth = imgPlano.naturalWidth;
                const imgRealHeight = imgPlano.naturalHeight;

                const printPageWidth = 8.5 * 96;
                const printPageHeight = 11 * 96;
                const printMargin = 20;

                const printScale = Math.min(
                    (printPageWidth - 2 * printMargin) / imgRealWidth,
                    (printPageHeight - 2 * printMargin) / imgRealHeight
                );

                const printWidth = imgRealWidth * printScale;
                const printHeight = imgRealHeight * printScale;

                // Crear HTML para los marcadores
                let marcadoresHTML = '';
                Array.from(marcadores).forEach(marcador => {
                    const originalLeft = parseInt(marcador.style.left || '0');
                    const originalTop = parseInt(marcador.style.top || '0');

                    const relLeft = (originalLeft / imgPlano.clientWidth) * imgRealWidth;
                    const relTop = (originalTop / imgPlano.clientHeight) * imgRealHeight;

                    const printLeft = relLeft * printScale;
                    const printTop = relTop * printScale;

                    const markerSize = Math.max(40 * printScale, 30);
                    const fontSize = Math.max(18 * printScale, 16);

                    // Obtener color del marcador original
                    const bgColor = window.getComputedStyle(marcador).backgroundColor;
                    
                    marcadoresHTML += `
                        <div style="position: absolute;
                                   left: ${printLeft}px;
                                   top: ${printTop}px;
                                   width: ${markerSize}px;
                                   height: ${markerSize}px;
                                   font-size: ${fontSize}px;
                                   background-color: ${bgColor};
                                   color: white;
                                   border: 2px solid white;
                                   border-radius: 50%;
                                   display: flex;
                                   align-items: center;
                                   justify-content: center;
                                   font-weight: bold;
                                   transform: translate(-50%, -50%);
                                   z-index: 1000;
                                   -webkit-print-color-adjust: exact;
                                   print-color-adjust: exact;">
                            ${marcador.innerText}
                        </div>
                    `;
                });

                const printWindow = window.open('', '_blank', 'width=800,height=1000');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Informe de Casas Aplicadas</title>
                        <style>
                            @page {
                                size: letter portrait;
                                margin: ${printMargin}px;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                width: 100%;
                                height: 100%;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                background-color: white;
                            }
                            .print-container {
                                position: relative;
                                width: ${printWidth}px;
                                height: ${printHeight}px;
                            }
                            .print-image {
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                            }
                        </style>
                    </head>
                    <body onload="setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 100); }, 200);">
                        <div class="print-container">
                            <img class="print-image" src="${imgPlano.src}" 
                                 width="${printWidth}" 
                                 height="${printHeight}">
                            ${marcadoresHTML}
                        </div>
                        <div style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; color: #666;">
                            Total: ${marcadores.length} casas | ${new Date().toLocaleDateString('es-ES')}
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                Swal.close();
            }, 500);
        }
    });
    return false;
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR DATOS MANUALMENTE
// ============================================

function actualizarDatos() {
    Swal.fire({
        title: 'Actualizando datos...',
        html: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(null);
            
            // Limpiar y recargar
            setTimeout(() => {
                cargarDatosCombinadosYColocarMarcadores();
                Swal.close();
                
                // Mensaje de éxito
                setTimeout(() => {
                    const totalMarcas = document.querySelectorAll('#tblCasas tbody tr').length;
                    if (totalMarcas > 0) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Datos actualizados',
                            text: `Se encontraron ${totalMarcas} casas registradas`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                }, 300);
            }, 300);
        }
    });
}

// ============================================
// FUNCIÓN PARA VER RESUMEN ESTADÍSTICO
// ============================================

function verResumen() {
    try {
        const marcasPrimera = JSON.parse(localStorage.getItem('marcasPrimerEtapa') || '[]');
        const marcasSegunda = JSON.parse(localStorage.getItem('marcasSegundaEtapa') || '[]');
        const total = marcasPrimera.length + marcasSegunda.length;

        // Calcular estadísticas
        const primerasCasas = marcasPrimera.map(m => m.numeroCasa).sort((a, b) => a - b);
        const ultimasCasas = marcasSegunda.map(m => m.numeroCasa).sort((a, b) => a - b);

        let html = `
            <div class="text-start">
                <h5><i class="bi bi-bar-chart me-2"></i>Estadísticas del Sistema</h5>
                <hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-house-door me-2"></i>Primera Etapa</h6>
                                <h2 class="card-text mb-0">${marcasPrimera.length}</h2>
                                <small>Casas registradas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card bg-success text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-building me-2"></i>Segunda Etapa</h6>
                                <h2 class="card-text mb-0">${marcasSegunda.length}</h2>
                                <small>Casas registradas</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="bi bi-collection me-2"></i>Total General</h6>
                        <h3 class="text-primary">${total} casas</h3>
                    </div>
                </div>

                ${marcasPrimera.length > 0 ? `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary"><i class="bi bi-list-ul me-2"></i>Casas Primera Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...primerasCasas)} - ${Math.max(...primerasCasas)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${primerasCasas.join(', ')}</p>
                    </div>
                </div>
                ` : ''}

                ${marcasSegunda.length > 0 ? `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-success"><i class="bi bi-list-ul me-2"></i>Casas Segunda Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...ultimasCasas)} - ${Math.max(...ultimasCasas)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${ultimasCasas.join(', ')}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        Swal.fire({
            title: '📊 Resumen Estadístico',
            html: html,
            width: '500px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd'
        });
    } catch (error) {
        console.error('Error mostrando resumen:', error);
        Swal.fire('Error', 'No se pudo generar el resumen estadístico', 'error');
    }
}

// ============================================
// FUNCIÓN DE DEBUG PARA VER DATOS EN LOCALSTORAGE
// ============================================

function debugDatos() {
    console.log('🔍 DEBUG - Datos en localStorage:');
    
    try {
        const primera = localStorage.getItem('marcasPrimerEtapa');
        const segunda = localStorage.getItem('marcasSegundaEtapa');
        
        console.log('📝 marcasPrimerEtapa:', primera ? JSON.parse(primera) : 'VACÍO');
        console.log('📝 marcasSegundaEtapa:', segunda ? JSON.parse(segunda) : 'VACÍO');
        
        Swal.fire({
            title: 'Debug - Datos en Storage',
            html: `
                <div class="text-start">
                    <p><strong>Primera Etapa:</strong> ${primera ? JSON.parse(primera).length : 0} registros</p>
                    <p><strong>Segunda Etapa:</strong> ${segunda ? JSON.parse(segunda).length : 0} registros</p>
                    <hr>
                    <small class="text-muted">Ver consola para detalles completos</small>
                </div>
            `,
            icon: 'info'
        });
    } catch (error) {
        console.error('Error en debug:', error);
    }
}

// Botón de debug (opcional - para desarrollo)
// <button onclick="debugDatos()">Debug</button>
