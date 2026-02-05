// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado");
    inicializar();
});

function inicializar() {
    const imgPlano = document.getElementById('imgPlano');

    imgPlano.addEventListener('load', function () {
        console.log("Imagen del plano cargada completamente");
        ajustarContenedorMarcadores();
        cargarDatosCombinadosYColocarMarcadores();
    });

    window.addEventListener('resize', manejarRedimensionamiento);

    if (imgPlano.complete) {
        console.log("Imagen ya cargada, colocando marcadores iniciales");
        ajustarContenedorMarcadores();
        cargarDatosCombinadosYColocarMarcadores();
    } else {
        console.log("Imagen no cargada aún, esperando evento load");
    }
}

// ============================================
// CARGA DE DATOS COMBINADOS DE AMBAS ETAPAS
// ============================================

function cargarDatosCombinadosYColocarMarcadores() {
    try {
        // Cargar datos de PRIMERA ETAPA
        const marcasPrimeraJSON = localStorage.getItem('marcasPrimerEtapa');
        const marcasPrimera = marcasPrimeraJSON ? JSON.parse(marcasPrimeraJSON) : [];
        console.log(`✓ Cargadas ${marcasPrimera.length} marcas de PRIMERA ETAPA`);

        // Cargar datos de SEGUNDA ETAPA
        const marcasSegundaJSON = localStorage.getItem('marcasSegundaEtapa');
        const marcasSegunda = marcasSegundaJSON ? JSON.parse(marcasSegundaJSON) : [];
        console.log(`✓ Cargadas ${marcasSegunda.length} marcas de SEGUNDA ETAPA`);

        // Combinar ambos conjuntos de datos
        const todasMarcas = [...marcasPrimera, ...marcasSegunda];
        
        console.log(`📊 Total combinado: ${todasMarcas.length} marcas`);

        if (todasMarcas.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos registrados',
                text: 'No hay casas registradas en ninguna etapa. Registre casas en Primer Etapa o Segunda Etapa para verlas aquí.',
                footer: '<a href="../paginas/primer-etapa.html">Ir a Primer Etapa</a> o <a href="../paginas/segunda-etapa.html">Ir a Segunda Etapa</a>'
            });
            
            // Limpiar tabla y marcadores
            document.getElementById('tbodyDatos').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-info-circle me-2"></i>
                        No hay datos registrados
                    </td>
                </tr>
            `;
            document.getElementById('marcadoresContainer').innerHTML = '';
            return;
        }

        // Llenar la tabla con todos los datos combinados
        llenarTabla(todasMarcas);
        
        // Colocar los marcadores en el plano
        colocarMarcadores();
        
        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Datos cargados',
            html: `Se encontraron <strong>${todasMarcas.length}</strong> casas registradas:<br>
                   <small>• ${marcasPrimera.length} de Primera Etapa<br>
                   • ${marcasSegunda.length} de Segunda Etapa</small>`,
            timer: 2500,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('✗ Error cargando datos combinados:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar datos',
            text: 'No se pudieron cargar los datos del informe. Verifique la consola para más detalles.',
            footer: `<code>${error.message}</code>`
        });
    }
}

// ============================================
// LLENAR TABLA CON DATOS COMBINADOS
// ============================================

function llenarTabla(marcas) {
    const tbody = document.getElementById('tbodyDatos');
    tbody.innerHTML = '';

    // Ordenar por número de casa
    marcas.sort((a, b) => a.numeroCasa - b.numeroCasa);

    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        
        // Determinar etapa según el número de casa
        const etapa = (marca.numeroCasa >= 33 && marca.numeroCasa <= 65) ? 'Primera Etapa' :
                     (marca.numeroCasa >= 1 && marca.numeroCasa <= 32) ? 'Segunda Etapa' : 'Desconocida';
        
        // Clase CSS según etapa para colorear filas
        const claseEtapa = (etapa === 'Primera Etapa') ? 'table-info' :
                          (etapa === 'Segunda Etapa') ? 'table-success' : '';
        
        if (claseEtapa) {
            fila.classList.add(claseEtapa);
        }

        // Celda: Número de Casa
        const celdaNumero = document.createElement('td');
        celdaNumero.innerHTML = `
            <strong>${marca.numeroCasa}</strong>
            <span class="badge bg-secondary ms-2">${etapa}</span>
        `;
        
        // Celda: Coordenada X
        const celdaCoordX = document.createElement('td');
        celdaCoordX.textContent = marca.coordenadas.x;
        
        // Celda: Coordenada Y
        const celdaCoordY = document.createElement('td');
        celdaCoordY.textContent = marca.coordenadas.y;
        
        // Celda: Cliente
        const celdaCliente = document.createElement('td');
        celdaCliente.textContent = marca.cliente || 'Cliente no especificado';
        
        // Celda: Fecha (opcional)
        const celdaFecha = document.createElement('td');
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
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

function colocarMarcadores() {
    const tabla = document.getElementById('tblCasas');
    const filas = tabla.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');

    marcadoresContainer.innerHTML = '';

    if (!imgPlano.complete) {
        console.log("La imagen del plano no está completamente cargada");
        return;
    }

    const planoAnchoReal = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
    const planoAltoReal = imgPlano.naturalHeight || PLANO_ALTO_REAL;
    console.log(`Dimensiones reales del plano: ${planoAnchoReal}x${planoAltoReal}`);

    let marcadoresColocados = 0;

    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].getElementsByTagName('td');

        if (celdas.length >= 5) {
            const numeroCasa = celdas[0].textContent.match(/\d+/)?.[0] || '';
            const coordX = parseInt(celdas[1].textContent.trim(), 10);
            const coordY = parseInt(celdas[2].textContent.trim(), 10);
            const nombreCliente = celdas[3].textContent.trim();

            if (!numeroCasa || isNaN(coordX) || isNaN(coordY)) {
                console.warn(`⚠ Datos inválidos en fila ${i + 1}`);
                continue;
            }

            // Calcular posición exacta
            const posX = (coordX / planoAnchoReal) * imgPlano.clientWidth;
            const posY = (coordY / planoAltoReal) * imgPlano.clientHeight;

            // Crear marcador con color según etapa
            const marcador = document.createElement('div');
            marcador.className = 'marcador';
            
            // Colores diferentes según etapa
            if (numeroCasa >= 33 && numeroCasa <= 65) {
                marcador.style.backgroundColor = 'rgba(13, 110, 253, 0.9)'; // Azul para primera etapa
                marcador.title = `Casa ${numeroCasa} - Primera Etapa\nCliente: ${nombreCliente}`;
            } else if (numeroCasa >= 1 && numeroCasa <= 32) {
                marcador.style.backgroundColor = 'rgba(25, 135, 84, 0.9)'; // Verde para segunda etapa
                marcador.title = `Casa ${numeroCasa} - Segunda Etapa\nCliente: ${nombreCliente}`;
            } else {
                marcador.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'; // Rojo para desconocido
                marcador.title = `Casa ${numeroCasa} - Etapa desconocida\nCliente: ${nombreCliente}`;
            }
            
            marcador.textContent = numeroCasa;
            marcador.style.left = `${posX}px`;
            marcador.style.top = `${posY}px`;

            marcadoresContainer.appendChild(marcador);
            marcadoresColocados++;
        }
    }

    console.log(`✓ ${marcadoresColocados} marcadores colocados en el plano`);
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
        console.log(`Ajustando contenedor a: ${imgPlano.clientWidth}x${imgPlano.clientHeight}`);
    }
}

let resizeTimeout;
function manejarRedimensionamiento() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
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
        html: 'Recargando información de ambas etapas',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                cargarDatosCombinadosYColocarMarcadores();
                Swal.close();
            }, 300);
        }
    });
}

// Agregar botón de actualización al DOM
document.addEventListener('DOMContentLoaded', function() {
    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
        const btnActualizar = document.createElement('button');
        btnActualizar.className = 'btn btn-primary flex-grow-1';
        btnActualizar.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i> Actualizar Datos';
        btnActualizar.onclick = actualizarDatos;
        btnActualizar.style.marginLeft = '10px';
        
        const btnImp = document.getElementById('btnImp');
        if (btnImp && btnImp.parentElement) {
            btnImp.parentElement.appendChild(btnActualizar);
        }
    }
});
