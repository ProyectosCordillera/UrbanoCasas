// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================

// Variables globales para las dimensiones del plano
const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

// Inicializar la página al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado");
    inicializar();
});

// Inicialización principal
function inicializar() {
    const imgPlano = document.getElementById('imgPlano');

    // Configurar eventos
    imgPlano.addEventListener('load', function () {
        console.log("Imagen del plano cargada completamente");
        ajustarContenedorMarcadores();
        cargarDatosYColocarMarcadores();
    });

    window.addEventListener('resize', manejarRedimensionamiento);

    // Ejecutar inicialmente si la imagen ya está cargada
    if (imgPlano.complete) {
        console.log("Imagen ya cargada, colocando marcadores iniciales");
        ajustarContenedorMarcadores();
        cargarDatosYColocarMarcadores();
    } else {
        console.log("Imagen no cargada aún, esperando evento load");
    }
}

// ============================================
// FUNCIONES DE CARGA DE DATOS
// ============================================

// Cargar datos desde JSON y colocar marcadores
function cargarDatosYColocarMarcadores() {
    fetch('../data/datos-informe.json')
        .then(response => response.json())
        .then(data => {
            // Llenar la tabla con los datos
            llenarTabla(data.marcas);
            
            // Colocar los marcadores en el plano
            colocarMarcadores();
        })
        .catch(error => {
            console.error('Error cargando datos:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos del informe', 'error');
        });
}

// Llenar la tabla con los datos
function llenarTabla(marcas) {
    const tbody = document.getElementById('tbodyDatos');
    tbody.innerHTML = '';

    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        
        const celdaNumero = document.createElement('td');
        celdaNumero.textContent = marca.numeroCasa;
        
        const celdaCoordX = document.createElement('td');
        celdaCoordX.textContent = marca.coordenadas.x;
        
        const celdaCoordY = document.createElement('td');
        celdaCoordY.textContent = marca.coordenadas.y;
        
        const celdaCliente = document.createElement('td');
        celdaCliente.textContent = marca.cliente;
        
        fila.appendChild(celdaNumero);
        fila.appendChild(celdaCoordX);
        fila.appendChild(celdaCoordY);
        fila.appendChild(celdaCliente);
        
        tbody.appendChild(fila);
    });
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

// Función mejorada para colocar los marcadores en el plano con precisión
function colocarMarcadores() {
    const tabla = document.getElementById('tblCasas');
    const filas = tabla.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');

    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';

    if (!imgPlano.complete) {
        console.log("La imagen del plano no está completamente cargada");
        return;
    }

    // Obtener dimensiones reales de la imagen
    const planoAnchoReal = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
    const planoAltoReal = imgPlano.naturalHeight || PLANO_ALTO_REAL;
    console.log(`Dimensiones reales del plano: ${planoAnchoReal}x${planoAltoReal}`);
    console.log(`Dimensiones mostradas: ${imgPlano.clientWidth}x${imgPlano.clientHeight}`);

    // Procesar cada fila de la tabla
    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].getElementsByTagName('td');

        if (celdas.length >= 4) {
            const numeroCasa = celdas[0].textContent.trim();
            const coordX = parseInt(celdas[1].textContent.trim(), 10);
            const coordY = parseInt(celdas[2].textContent.trim(), 10);
            const nombreCliente = celdas[3].textContent.trim();

            console.log(`Procesando casa ${numeroCasa}: X=${coordX}, Y=${coordY}`);

            if (!isNaN(coordX) && !isNaN(coordY)) {
                // Calcular posición exacta
                const posX = (coordX / planoAnchoReal) * imgPlano.clientWidth;
                const posY = (coordY / planoAltoReal) * imgPlano.clientHeight;

                console.log(`Posición calculada para casa ${numeroCasa}: X=${posX}, Y=${posY}`);

                // Crear marcador
                const marcador = document.createElement('div');
                marcador.className = 'marcador';
                marcador.textContent = numeroCasa;
                marcador.style.left = `${posX}px`;
                marcador.style.top = `${posY}px`;

                // Tooltip con nombre del cliente
                marcador.title = `Casa ${numeroCasa}\nCliente: ${nombreCliente}`;

                marcadoresContainer.appendChild(marcador);
            } else {
                console.warn(
                    `Coordenadas no válidas para casa ${numeroCasa}: X="${celdas[1].textContent}", Y="${celdas[2].textContent}"`
                );
            }
        }
    }
}

// ============================================
// FUNCIONES DE AJUSTE Y REDIMENSIONAMIENTO
// ============================================

// Asegurar que el contenedor de marcadores tenga el mismo tamaño que la imagen
function ajustarContenedorMarcadores() {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    
    if (imgPlano && marcadoresContainer) {
        marcadoresContainer.style.width = `${imgPlano.clientWidth}px`;
        marcadoresContainer.style.height = `${imgPlano.clientHeight}px`;
        console.log(`Ajustando contenedor a: ${imgPlano.clientWidth}x${imgPlano.clientHeight}`);
    }
}

// Manejar redimensionamiento con debounce
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

// Función para imprimir el plano
function imprimirPlano() {
    // Verificar que hay marcadores
    const marcadores = document.getElementById('marcadoresContainer').children;
    if (marcadores.length === 0) {
        Swal.fire('Advertencia', 'No hay marcadores para imprimir', 'warning');
        return false;
    }

    Swal.fire({
        title: 'Preparando impresión',
        html: 'Calculando posiciones exactas...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();

            setTimeout(() => {
                // 1. Obtener elementos clave
                const imgPlano = document.getElementById('imgPlano');
                const planoContainer = document.querySelector('.plano-container');

                // 2. Dimensiones reales de la imagen
                const imgRealWidth = imgPlano.naturalWidth;
                const imgRealHeight = imgPlano.naturalHeight;

                // 3. Configuración de página para impresión (carta 8.5x11 pulgadas)
                const printPageWidth = 8.5 * 96; // 816px a 96dpi
                const printPageHeight = 11 * 96; // 1056px a 96dpi
                const printMargin = 20; // Márgenes en px

                // 4. Calcular escalado para impresión
                const printScale = Math.min(
                    (printPageWidth - 2 * printMargin) / imgRealWidth,
                    (printPageHeight - 2 * printMargin) / imgRealHeight
                );

                // 5. Crear HTML para los marcadores
                let marcadoresHTML = '';
                Array.from(marcadores).forEach(marcador => {
                    // Obtener posición original
                    const originalLeft = parseInt(marcador.style.left || '0');
                    const originalTop = parseInt(marcador.style.top || '0');

                    // Calcular posición relativa a la imagen real
                    const relLeft = (originalLeft / planoContainer.offsetWidth) * imgRealWidth;
                    const relTop = (originalTop / planoContainer.offsetHeight) * imgRealHeight;

                    // Calcular nueva posición para impresión
                    const printLeft = relLeft * printScale;
                    const printTop = relTop * printScale;

                    // Tamaño del marcador ajustado
                    const markerSize = Math.max(48 * printScale, 30);
                    const fontSize = Math.max(24 * printScale, 18);

                    marcadoresHTML += `
                        <div class="marcador-print" 
                             style="position: absolute;
                                    left: ${printLeft}px;
                                    top: ${printTop}px;
                                    width: ${markerSize}px;
                                    height: ${markerSize}px;
                                    font-size: ${fontSize}px;
                                    background-color: #dc3545;
                                    color: white;
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    transform: translate(-50%, -50%);
                                    z-index: 1000;">
                            ${marcador.innerText}
                        </div>
                    `;
                });

                // 6. Crear ventana de impresión
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Plano con Marcadores</title>
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
                                width: ${imgRealWidth * printScale}px;
                                height: ${imgRealHeight * printScale}px;
                            }
                            .print-image {
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                            }
                            .marcador-print {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            <img class="print-image" src="${imgPlano.src}" 
                                 onload="window.print(); setTimeout(function(){ window.close(); }, 100);"
                                 width="${imgRealWidth * printScale}" 
                                 height="${imgRealHeight * printScale}">
                            ${marcadoresHTML}
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
