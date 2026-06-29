// ============================================
// CONFIGURACIÓN
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

const ZONA_VALIDA = {
    xMin: 50,
    xMax: 1225,
    yMin: 50,
    yMax: 1600
};

// Diccionario de coordenadas
const coordenadasCasas = {};

// Lado DERECHO (66-81)
const X_DERECHA = 850;
const Y_INICIAL_DERECHA = 180;
const ESPACIADO = 70;

for (let i = 66; i <= 81; i++) {
    coordenadasCasas[i] = {
        x: X_DERECHA,
        y: Y_INICIAL_DERECHA + (i - 66) * ESPACIADO
    };
}

// Lado IZQUIERDO (82-97, sin 85)
const X_IZQUIERDA = 425;
const Y_INICIAL_IZQUIERDA = 1230;

for (let i = 82; i <= 97; i++) {
    if (i !== 85) {
        coordenadasCasas[i] = {
            x: X_IZQUIERDA,
            y: Y_INICIAL_IZQUIERDA - (i - 82) * ESPACIADO
        };
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('🔍 terc-era-etapa.js se está cargando...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOMContentLoaded disparado');
    
    const imgPlano = document.getElementById('imgPlano');
    const container = document.getElementById('marcadoresContainer');
    
    console.log('📷 imgPlano:', imgPlano);
    console.log('📦 container:', container);
    
    if (!imgPlano) {
        console.error('❌ ERROR: No se encontró el elemento con id="imgPlano"');
    }
    
    if (!container) {
        console.error('❌ ERROR: No se encontró el elemento con id="marcadoresContainer"');
    }
    
    if (imgPlano && container) {
        console.log('🎯 ACTIVANDO MODO AJUSTE - Haz clic en el plano');
        imgPlano.style.cursor = 'crosshair';
        
        imgPlano.addEventListener('click', function(e) {
            console.log('👆 CLICK detectado en el plano');
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const sistemaX = Math.round((x / rect.width) * PLANO_ANCHO_REAL);
            const sistemaY = Math.round((y / rect.height) * PLANO_ALTO_REAL);
            
            console.log(`📍 Coordenadas: { x: ${sistemaX}, y: ${sistemaY} }`);
            
            // Crear marcador
            const marker = document.createElement('div');
            marker.style.position = 'absolute';
            marker.style.left = x + 'px';
            marker.style.top = y + 'px';
            marker.style.width = '40px';
            marker.style.height = '40px';
            marker.style.background = 'red';
            marker.style.border = '3px solid white';
            marker.style.borderRadius = '50%';
            marker.style.transform = 'translate(-50%, -50%)';
            marker.style.zIndex = '9999';
            marker.style.pointerEvents = 'none';
            
            container.appendChild(marker);
            
            setTimeout(() => marker.remove(), 3000);
            
            alert(`Coordenadas:\nX: ${sistemaX}\nY: ${sistemaY}`);
        });
    }
    
    // Continuar con el resto de la inicialización
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    verificarCoordenadas();
    cargarDatosCompletos();
});

// ============================================
// RESTO DE FUNCIONES (sin cambios)
// ============================================

function verificarCoordenadas() {
    console.log("Verificación de coordenadas - Tercera Etapa:");
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

async function cargarDatosCompletos() {
    try {
        await cargarMarcasDesdeBD();
        await migrarDatosHistoricos();
        console.log('✅ Datos cargados completamente');
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
}

async function migrarDatosHistoricos() {
    try {
        const datosMigrados = localStorage.getItem('datosHistoricosMigrados_terceraEtapa');
        if (datosMigrados === 'true') return;

        const marcasJSON = localStorage.getItem('marcasTerceraEtapa');
        if (!marcasJSON) return;

        const marcasLocales = JSON.parse(marcasJSON);
        if (!Array.isArray(marcasLocales) || marcasLocales.length === 0) return;

        let migradas = 0;
        for (const marca of marcasLocales) {
            try {
                const numeroCasa = marca.numeroCasa.toString();
                const nombreCliente = marca.cliente || 'Cliente';
                const casaExistente = await Database.getCasaByNumero(numeroCasa);

                if (!casaExistente) {
                    const coords = coordenadasCasas[parseInt(numeroCasa)];
                    if (coords) {
                        await Database.insertarCasaConCliente(numeroCasa, coords.x, coords.y, nombreCliente);
                        migradas++;
                    }
                }
            } catch (error) {
                console.error('Error migrando:', error);
            }
        }

        if (migradas > 0) {
            localStorage.setItem('datosHistoricosMigrados_terceraEtapa', 'true');
            await cargarMarcasDesdeBD();
        }
    } catch (error) {
        console.warn('No se pudieron migrar datos:', error);
    }
}

async function cargarMarcasDesdeBD() {
    try {
        const todasLasCasas = await Database.getCasas();
        const casasTerceraEtapa = todasLasCasas.filter(c => {
            const num = parseInt(c.numero_casa);
            return !isNaN(num) && num >= 66 && num <= 97;
        });

        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) return;

        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';
        casasTerceraEtapa.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));

        for (const casa of casasTerceraEtapa) {
            const option = document.createElement('option');
            option.value = casa.numero_casa;
            const nombreCliente = (casa.nombre_cliente && casa.nombre_cliente !== 'Sin propietario') 
                                  ? casa.nombre_cliente : 'Sin cliente';
            option.textContent = `Casa ${casa.numero_casa} - ${nombreCliente}`;
            ddlMarcas.appendChild(option);
        }
    } catch (error) {
        console.error('Error cargando marcas:', error);
    }
}

function validarNumeroCasa(numero) {
    const num = numero.trim();
    if (!/^\d+$/.test(num)) {
        alert('El número debe ser numérico');
        return null;
    }
    const numeroInt = parseInt(num, 10);
    if (numeroInt < 66 || numeroInt > 97) {
        alert('Solo casas del 66 al 97');
        return null;
    }
    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        alert(`No hay coordenadas para la casa ${numeroInt}`);
        return null;
    }
    return numeroInt;
}

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

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (!marcadoresContainer || !imgPlano) return;
    marcadoresContainer.innerHTML = '';
    if (!imgPlano.complete) {
        imgPlano.onload = () => agregarMarcador(numeroCasa, originalX, originalY);
        return;
    }
    const xPercent = (originalX / PLANO_ANCHO_REAL) * 100;
    const yPercent = (originalY / PLANO_ALTO_REAL) * 100;
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = xPercent + '%';
    marcador.style.top = yPercent + '%';
    marcador.textContent = numeroCasa;
    marcadoresContainer.appendChild(marcador);
}

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
            try {
                const cliente = await Database.getClienteByCasa(numeroCasa);
                const txtCliente = document.getElementById('txtCliente');
                if (txtCliente) txtCliente.value = cliente ? cliente.nombre : '';
            } catch (e) {
                console.warn('No se pudo cargar el cliente:', e);
            }
        }
    }
}

async function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const txtClienteInput = document.getElementById('txtCliente');
    const numeroCasaRaw = txtNumeroCasa.value.trim();
    const txtCliente = txtClienteInput ? txtClienteInput.value.trim() : '';
    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;
    if (!txtCliente) {
        alert('Cliente requerido');
        return;
    }
    const ddlMarcas = document.getElementById('ddlMarcas');
    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            alert(`La casa ${numeroCasa} ya está registrada.`);
            return;
        }
    }
    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        alert('Coordenadas no encontradas');
        return;
    }
    agregarMarcador(numeroCasa, coords.x, coords.y);
    try {
        const exito = await Database.insertarCasaConCliente(numeroCasa.toString(), coords.x, coords.y, txtCliente);
        if (exito) {
            txtNumeroCasa.value = '';
            txtNumeroCasa.disabled = true;
            txtClienteInput.value = '';
            alert(`Casa ${numeroCasa} guardada`);
            setTimeout(async () => {
                await cargarMarcasDesdeBD();
                ddlMarcas.value = numeroCasa.toString();
            }, 300);
        }
    } catch (error) {
        document.getElementById('marcadoresContainer').innerHTML = '';
        alert(`Error: ${error.message}`);
    }
}

async function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;
    const numeroCasa = ddlMarcas.value;
    if (numeroCasa == '0') {
        alert('Seleccione una casa para eliminar');
        return;
    }
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

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    if (marcadores.length === 0) {
        alert('Aplique una casa primero');
        return false;
    }
    window.print();
    return false;
}

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
function activarModoAjuste() {
    const imgPlano = document.getElementById('imgPlano');
    const container = document.getElementById('marcadoresContainer');
    
    if (!imgPlano || !container) {
        console.error('❌ No se encontró imgPlano o marcadoresContainer');
        return;
    }
    
    // ✅ IMPORTANTE: Hacer el container transparente a clics
    container.style.pointerEvents = 'none';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    
    console.log('🎯 MODO AJUSTE ACTIVADO - Haz clic en el centro de cada número');
    imgPlano.style.cursor = 'crosshair';
    
    imgPlano.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const sistemaX = Math.round((clickX / rect.width) * PLANO_ANCHO_REAL);
        const sistemaY = Math.round((clickY / rect.height) * PLANO_ALTO_REAL);
        
        // Crear marcador visual
        const marcadorTemp = document.createElement('div');
        marcadorTemp.style.cssText = `
            position: absolute;
            width: 30px;
            height: 30px;
            background: #ff0000;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 10px;
            transform: translate(-50%, -50%);
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
            z-index: 9999;
            pointer-events: none;
            left: ${clickX}px;
            top: ${clickY}px;
        `;
        marcadorTemp.textContent = '📍';
        
        container.appendChild(marcadorTemp);
        
        setTimeout(() => marcadorTemp.remove(), 3000);
        
        console.log(` Coordenadas: { x: ${sistemaX}, y: ${sistemaY} }`);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '📍 Coordenadas del clic',
                html: `
                    <div class="text-start">
                        <p><strong>Coordenadas del sistema:</strong></p>
                        <code class="d-block p-2 bg-light rounded">{ x: ${sistemaX}, y: ${sistemaY} }</code>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Copiar',
                showCancelButton: true,
                cancelButtonText: 'Cerrar'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigator.clipboard.writeText(`{ x: ${sistemaX}, y: ${sistemaY} }`);
                }
            });
        } else {
            alert(`Coordenadas: { x: ${sistemaX}, y: ${sistemaY} }`);
        }
    });
}
