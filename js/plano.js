/**
 * Imprimir plano
 */
function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        Swal.fire('Advertencia', 'Primero aplique un número de casa para marcar en el plano', 'warning');
        return;
    }

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    
    if (!printWindow) {
        Swal.fire('Error', 'Por favor permite las ventanas emergentes para imprimir', 'error');
        return;
    }

    // Obtener datos del plano actual
    const imgPlano = document.getElementById('imgPlano');
    const marcador = marcadores[0];
    const numeroCasa = marcador.textContent;
    const casaData = obtenerMarcaPorNumero(numeroCasa);
    
    // Construir HTML para impresión
    const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Plano - Casa ${numeroCasa}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
            }
            
            .print-container {
                position: relative;
                width: 100%;
                height: auto;
                margin: 0;
                padding: 0;
            }
            
            .print-image {
                width: 100%;
                height: auto;
                display: block;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .print-marcador {
                position: absolute;
                width: 37px;
                height: 37px;
                background-color: red !important;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                z-index: 1000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .info-box {
                position: absolute;
                top: 20px;
                right: 20px;
                background-color: white;
                padding: 15px;
                border: 2px solid #0d6efd;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                max-width: 250px;
                z-index: 1001;
            }
            
            .info-box h3 {
                margin: 0 0 10px 0;
                color: #0d6efd;
                font-size: 18px;
            }
            
            .info-box p {
                margin: 5px 0;
                font-size: 14px;
            }
            
            .info-label {
                font-weight: bold;
                color: #495057;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .print-marcador {
                    background-color: red !important;
                }
            }
        </style>
    </head>
    <body onload="window.print(); window.onafterprint = function() { window.close(); }">
        <div class="print-container">
            <img class="print-image" src="${imgPlano.src}" alt="Plano Urbano" id="printImg" />
            <div class="print-marcador" id="printMarcador">${numeroCasa}</div>
            
            ${casaData ? `
            <div class="info-box">
                <h3>Información de la Casa</h3>
                <p><span class="info-label">Número:</span> ${numeroCasa}</p>
                ${casaData.cliente ? `<p><span class="info-label">Cliente:</span> ${casaData.cliente}</p>` : ''}
                <p><span class="info-label">Fecha:</span> ${new Date(casaData.fecha).toLocaleDateString('es-ES')}</p>
            </div>
            ` : ''}
        </div>
        
        <script>
            // Posicionar el marcador correctamente después de cargar la imagen
            const printImg = document.getElementById('printImg');
            const printMarcador = document.getElementById('printMarcador');
            
            printImg.onload = function() {
                // Usar las mismas coordenadas del plano original
                const coords = ${JSON.stringify(coordenadasCasas[numeroCasa])};
                const scaleX = printImg.clientWidth / ${PLANO_ANCHO_REAL};
                const scaleY = printImg.clientHeight / ${PLANO_ALTO_REAL};
                
                const x = coords.x * scaleX;
                const y = coords.y * scaleY;
                
                printMarcador.style.left = x + 'px';
                printMarcador.style.top = y + 'px';
                
                console.log('Marcador posicionado en impresión:', {x, y});
            };
            
            // Si la imagen ya está cargada
            if (printImg.complete) {
                printImg.onload();
            }
        </script>
    </body>
    </html>
    `;

    // Escribir HTML en la ventana de impresión
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Mostrar mensaje
    Swal.fire({
        title: 'Preparando impresión...',
        text: 'La ventana de impresión se abrirá en breve',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
    });
}
