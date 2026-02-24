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

// Diccionario de coordenadas ajustado para segunda etapa (Casas 1-32)
const coordenadasCasas = {};

// Coordenadas para las casas 1-16 (zona derecha)
for (let i = 1; i <= 16; i++) {
    coordenadasCasas[i] = {
        x: 925,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 1265 + (i - 1) * -60))
    };
}

// Coordenadas para las casas 17-32 (zona izquierda)
for (let i = 17; i <= 32; i++) {
    coordenadasCasas[i] = {
        x: 630,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 365 + (i - 17) * 60))
    };
}

// ============================================
// INICIALIZACIÓN Y CARGA DE DATOS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Segunda Etapa v2.0 (API Conectada)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));
    
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    verificarCoordenadas();
    cargarDatosCompletos();
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
// CARGA DE DATOS COMPLETOS
// ============================================

async function cargarDatosCompletos() {
    try {
        // 1. Cargar datos actuales de la base de datos
        await cargarMarcasDesdeBD();

        // 2. Migración histórica (Solo si aún no se ha hecho)
        await migrarDatosHistoricos();

        console.log('✅ Datos cargados completamente');
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
        }
    }
}

// ============================================
// MIGRACIÓN DE DATOS HISTÓRICOS (DE LOCALSTORAGE A BD)
// ============================================

async function migrarDatosHistoricos() {
    try {
        const datosMigrados = localStorage.getItem('datosHistoricosMigrados_segundaEtapa');
        if (datosMigrados === 'true') return; // Ya migrado

        console.log('📥 Migrando datos históricos de localStorage a BD...');
        
        // Intentar leer de localStorage (donde estaban antes)
        const marcasJSON = localStorage.getItem('marcasSegundaEtapa');
        if (!marcasJSON) {
            console.log('ℹ️ No hay datos locales para migrar.');
            return;
        }

        const marcasLocales = JSON.parse(marcasJSON);
        if (!Array.isArray(marcasLocales) || marcasLocales.length === 0) return;

        let migradas = 0;
        let errores = 0;

        for (const marca of marcasLocales) {
            try {
                const numeroCasa = marca.numeroCasa.toString();
                const nombreCliente = marca.cliente || 'Cliente no especificado';
                
                // Verificar si ya existe en BD
                const casaExistente = await Database.getCasaByNumero(numeroCasa);

                if (!casaExistente) {
                    const coords = coordenadasCasas[parseInt(numeroCasa)];
                    if (coords) {
                        await Database.insertarCasaConCliente(
                            numeroCasa, coords.x, coords.y, nombreCliente
                        );
                        migradas++;
                    } else {
                        errores++;
                    }
                }
            } catch (error) {
                console.error(`❌ Error migrando casa ${marca.numeroCasa}:`, error);
                errores++;
            }
        }

        if (migradas > 0) {
            localStorage.setItem('datosHistoricosMigrados_segundaEtapa', 'true');
            console.log(`✅ Migración completada: ${migradas} éxitos, ${errores} errores.`);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Migración completada',
                    html: `Se migraron <strong>${migradas}</strong> casas a la base de datos central.`,
                    timer: 3000,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false
                });
            }
            // Recargar dropdown con datos frescos de BD
            await cargarMarcasDesdeBD();
        }
    } catch (error) {
        console.warn('⚠️ No se pudieron migrar datos históricos:', error.message);
    }
}

// ============================================
// CARGA DE DATOS DESDE BASE DE DATOS
// ============================================

async function cargarMarcasDesdeBD() {
    try {
        // 1. Obtener TODAS las casas de la BD
        const todasLasCasas = await Database.getCasas();
        
        // 2. FILTRO ESTRICTO: Solo Segunda Etapa (1 al 32)
        const casasSegundaEtapa = todasLasCasas.filter(c => {
            const num = parseInt(c.numero_casa);
            // Verificamos explícitamente el rango
            return !isNaN(num) && num >= 1 && num <= 32;
        });

        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }

        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';

        // Ordenar numéricamente
        casasSegundaEtapa.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));

        console.log(`🔍 Filtrado: Total en BD=${todasLasCasas.length}, Mostrando Segunda Etapa=${casasSegundaEtapa.length}`);

        if (casasSegundaEtapa.length === 0) {
            console.log('ℹ️ No hay casas registradas en la Segunda Etapa aún.');
        }

        for (const casa of casasSegundaEtapa) {
            const option = document.createElement('option');
            option.value = casa.numero_casa;
            
            const nombreCliente = (casa.nombre_cliente && casa.nombre_cliente !== 'Sin propietario') 
                                  ? casa.nombre_cliente 
                                  : 'Sin cliente';
            
            option.textContent = `Casa ${casa.numero_casa} - ${nombreCliente}`;
            
            ddlMarcas.appendChild(option);
        }

        console.log(`✅ Dropdown Segunda Etapa cargado con ${casasSegundaEtapa.length} marcas.`);
    } catch (error) {
        console.error('❌ Error cargando marcas desde BD:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
        }
    }
}
// ============================================
// VALIDACIÓN DE ENTRADA (RANGO 1-32)
// ============================================

function validarNumeroCasa(numero) {
    const num = numero.trim();
    
    if (!/^\d+$/.test(num)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Advertencia', 'El número de casa debe ser numérico', 'warning');
        } else {
            alert('Advertencia: El número de casa debe ser numérico');
        }
        return null;
    }
    
    const numeroInt = parseInt(num, 10);
    
    if (numeroInt < 1 || numeroInt > 32) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Número fuera de rango',
                text: `La segunda etapa solo incluye casas del 1 al 32.`
            });
        } else {
            alert(`Número fuera de rango: Solo casas del 1 al 32.`);
        }
        return null;
    }
    
    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', `No hay coordenadas para la casa ${numeroInt}`, 'error');
        } else {
            alert(`Error: No hay coordenadas para la casa ${numeroInt}`);
        }
        return null;
    }

    return numeroInt;
}

// ============================================
// FUNCIONES DE MANEJO DE FORMULARIO
// ============================================

function habilitarNumeroCasa() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const txtCliente = document.getElementById('txtCliente');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (txtNumeroCasa) {
        txtNumeroCasa.value = '';
        txtNumeroCasa.disabled = false;
        txtNumeroCasa.focus();
    }
    if (txtCliente) txtCliente.value = '';
    if (marcadoresContainer) marcadoresContainer.innerHTML = '';
}

function limpiarFormulario() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const ddlMarcas = document.getElementById('ddlMarcas');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const txtCliente = document.getElementById('txtCliente');

    if (txtNumeroCasa) txtNumeroCasa.value = '';
    if (ddlMarcas) ddlMarcas.value = '0';
    if (marcadoresContainer) marcadoresContainer.innerHTML = '';
    if (txtCliente) txtCliente.value = '';
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (!marcadoresContainer || !imgPlano) return;

    marcadoresContainer.innerHTML = '';

    if (!imgPlano.complete) {
        imgPlano.onload = () => agregarMarcador(numeroCasa, originalX, originalY);
        return;
    }

    const scaleX = imgPlano.clientWidth / PLANO_ANCHO_REAL;
    const scaleY = imgPlano.clientHeight / PLANO_ALTO_REAL;

    const x = originalX * scaleX;
    const y = originalY * scaleY;

    if (x < 0 || x > imgPlano.clientWidth || y < 0 || y > imgPlano.clientHeight) {
        console.error('⚠ Coordenadas fuera del plano:', { x, y });
        return;
    }

    // ✅ Marcador optimizado para impresión
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        background: #dc3545;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    `;
    marcador.textContent = numeroCasa;
    marcador.setAttribute('aria-label', `Casa ${numeroCasa}`);
    
    marcadoresContainer.appendChild(marcador);

    console.log(`✅ Marcador ${numeroCasa} en X=${x.toFixed(1)}, Y=${y.toFixed(1)}`);
}

// ============================================
// CARGAR MARCA SELECCIONADA
// ============================================

async function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;

    const numeroCasa = ddlMarcas.value;

    if (numeroCasa > 0) {
        const txtNumeroCasa = document.getElementById('txtNumeroCasa');
        if (txtNumeroCasa) {
            txtNumeroCasa.value = numeroCasa;
            txtNumeroCasa.disabled = true;
        }

        if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
            const marcadoresContainer = document.getElementById('marcadoresContainer');
            if (marcadoresContainer) marcadoresContainer.innerHTML = '';

            const coords = coordenadasCasas[numeroCasa];
            agregarMarcador(numeroCasa, coords.x, coords.y);

            // Obtener nombre del cliente desde la lista unificada o consulta directa
            try {
                // Opción rápida: buscar en la lista que ya cargamos (si está en memoria)
                // Opción segura: consultar por ID
                const cliente = await Database.getClienteByCasa(numeroCasa);
                const txtCliente = document.getElementById('txtCliente');
                if (txtCliente) {
                    txtCliente.value = cliente ? cliente.nombre : '';
                }
            } catch (e) {
                console.warn('No se pudo cargar el cliente:', e);
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire('Error', `No hay coordenadas para la casa ${numeroCasa}`, 'error');
            }
        }
    }
}

// ============================================
// FUNCIÓN PRINCIPAL DE GUARDADO
// ============================================

async function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const txtClienteInput = document.getElementById('txtCliente');
    const numeroCasaRaw = txtNumeroCasa.value.trim();
    const txtCliente = txtClienteInput ? txtClienteInput.value.trim() : '';
    
    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;

    if (!txtCliente) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Ingrese el nombre del cliente' });
        } else {
            alert('Cliente requerido');
        }
        return;
    }

    // Verificar duplicados en el dropdown actual
    const ddlMarcas = document.getElementById('ddlMarcas');
    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Casa registrada', text: `La casa ${numeroCasa} ya existe.` });
            } else {
                alert(`La casa ${numeroCasa} ya está registrada.`);
            }
            return;
        }
    }

    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        Swal.fire('Error', 'Coordenadas no encontradas', 'error');
        return;
    }

    agregarMarcador(numeroCasa, coords.x, coords.y);

    try {
        const exito = await Database.insertarCasaConCliente(
            numeroCasa.toString(), coords.x, coords.y, txtCliente
        );

        if (exito) {
            txtNumeroCasa.value = '';
            txtNumeroCasa.disabled = true;
            txtClienteInput.value = '';

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success', title: '¡Guardado!', text: `Casa ${numeroCasa} asignada a ${txtCliente}`,
                    timer: 2000, showConfirmButton: false
                });
            }

            setTimeout(async () => {
                await cargarMarcasDesdeBD();
                ddlMarcas.value = numeroCasa.toString();
            }, 300);
        }
    } catch (error) {
        document.getElementById('marcadoresContainer').innerHTML = '';
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: error.message });
        } else {
            alert(`Error: ${error.message}`);
        }
    }
}

// ============================================
// ELIMINACIÓN DE MARCAS
// ============================================

async function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;

    const numeroCasa = ddlMarcas.value;
    if (numeroCasa == '0') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Seleccione', text: 'Seleccione una casa para eliminar' });
        }
        return;
    }

    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
            title: '¿Eliminar marca?',
            html: `Casa <strong>${numeroCasa}</strong> será eliminada permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const exito = await Database.eliminarCasaConCliente(numeroCasa);
                if (exito) {
                    limpiarFormulario();
                    await cargarMarcasDesdeBD();
                    Swal.fire({ icon: 'success', title: '¡Eliminada!', timer: 1500, showConfirmButton: false });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
            }
        }
    } else {
        if (confirm(`¿Eliminar casa ${numeroCasa}?`)) {
            try {
                const exito = await Database.eliminarCasaConCliente(numeroCasa);
                if (exito) {
                    limpiarFormulario();
                    await cargarMarcasDesdeBD();
                    alert('Eliminada correctamente');
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    }
}

// ============================================
// IMPRESIÓN - SOLUCIÓN CON VENTANA DEDICADA
// ============================================

function imprimirPlano() {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    
    // Validaciones iniciales
    if (!imgPlano || !marcadoresContainer) {
        mostrarAlerta('error', 'Elementos del plano no encontrados');
        return false;
    }

    if (marcadoresContainer.children.length === 0) {
        mostrarAlerta('warning', 'Sin marcadores', 'Aplique una casa primero');
        return false;
    }

    // Esperar que la imagen esté completamente cargada
    if (!imgPlano.complete || imgPlano.naturalWidth === 0) {
        mostrarAlerta('info', 'Cargando plano...', null, 2000);
        imgPlano.onload = () => prepararImpresionDedicada();
        return false;
    }

    prepararImpresionDedicada();
    return false;
}

// Función auxiliar para alertas (Swal o fallback)
function mostrarAlerta(icon, title, text = null, timer = null) {
    if (typeof Swal !== 'undefined') {
        const config = { icon, title, showConfirmButton: !timer };
        if (text) config.text = text;
        if (timer) {
            config.timer = timer;
            config.showConfirmButton = false;
        }
        Swal.fire(config);
    } else if (text) {
        alert(`${title}: ${text}`);
    } else {
        alert(title);
    }
}

// Función principal que crea la ventana de impresión
function prepararImpresionDedicada() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '🖨️ Preparando impresión...',
            didOpen: () => Swal.showLoading()
        });
    }

    // Pequeño delay para que el Swal se muestre
    setTimeout(() => {
        crearVentanaImpresion();
        if (typeof Swal !== 'undefined') Swal.close();
    }, 200);
}

// Crea una ventana nueva con el contenido optimizado para imprimir
function crearVentanaImpresion() {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const anchoReal = PLANO_ANCHO_REAL;
    const altoReal = PLANO_ALTO_REAL;

    // Calcular escala actual del plano en pantalla
    const scaleX = imgPlano.clientWidth / anchoReal;
    const scaleY = imgPlano.clientHeight / altoReal;

    // Construir el HTML de la ventana de impresión
    const printHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Imprimir Plano - Segunda Etapa</title>
    <style>
        @page {
            size: auto;
            margin: 5mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        body {
            width: 100%;
            height: auto;
            background: white !important;
            font-family: Arial, sans-serif;
        }
        .print-wrapper {
            position: relative;
            width: 100%;
            max-width: ${anchoReal}px;
            margin: 0 auto;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .print-plano {
            width: 100%;
            height: auto;
            display: block;
            position: relative;
        }
        .print-marcadores {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        }
        .print-marker {
            position: absolute;
            transform: translate(-50%, -50%);
            background: #dc3545 !important;
            color: white !important;
            border: 3px solid white !important;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex !important;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            z-index: 200 !important;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .print-info {
            text-align: center;
            padding: 10px;
            font-size: 14px;
            color: #333;
            page-break-after: always;
        }
        @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-wrapper, .print-plano, .print-marcadores, .print-marker {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="print-info">
        <strong>Plano Segunda Etapa</strong> | Casa(s): ${Array.from(marcadoresContainer.children).map(m => m.textContent).join(', ')}
    </div>
    <div class="print-wrapper">
        <img class="print-plano" src="${imgPlano.src}" alt="Plano" />
        <div class="print-marcadores" id="printMarcadores"></div>
    </div>
    <script>
        // Clonar marcadores con posiciones calculadas
        const originalMarkers = ${JSON.stringify(Array.from(marcadoresContainer.children).map(m => ({
            numero: m.textContent,
            left: m.style.left,
            top: m.style.top
        })))};
        
        const container = document.getElementById('printMarcadores');
        originalMarkers.forEach(marker => {
            const el = document.createElement('div');
            el.className = 'print-marker';
            el.style.left = marker.left;
            el.style.top = marker.top;
            el.textContent = marker.numero;
            container.appendChild(el);
        });
        
        // Imprimir automáticamente al cargar
        window.onload = function() {
            setTimeout(() => {
                window.print();
                // Opcional: cerrar ventana después de imprimir (no funciona en todos los navegadores)
                // window.close();
            }, 500);
        };
    <\/script>
</body>
</html>`;

    // Abrir ventana nueva
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (!printWindow) {
        mostrarAlerta('error', 'Ventana bloqueada', 'Permite las ventanas emergentes para imprimir');
        return;
    }

    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
}
// ============================================
// REDIMENSIONAMIENTO
// ============================================

let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(recalcularPosiciones, 200);
});

function recalcularPosiciones() {
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer && marcadoresContainer.children.length > 0) {
        const numeroCasa = document.getElementById('txtNumeroCasa').value.trim();
        const numValido = parseInt(numeroCasa, 10);
        if (numeroCasa && !isNaN(numValido) && coordenadasCasas.hasOwnProperty(numValido)) {
            const coords = coordenadasCasas[numValido];
            marcadoresContainer.innerHTML = '';
            agregarMarcador(numValido, coords.x, coords.y);
        }
    }
}
