// ============================================
// CONFIGURACIÓN DE COORDENADAS Y VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1414;
const PLANO_ALTO_REAL = 2000;

const ZONA_VALIDA = {
    xMin: 50,
    xMax: 1225,
    yMin: 50,
    yMax: 1600
};

// Diccionario de coordenadas ajustado para casas 33-65
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
// INICIALIZACIÓN Y CARGA DE DATOS
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Sistema Urbano - Primera Etapa v3.0 (API Conectada)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));

    // Mostrar año en footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    verificarCoordenadas();
    cargarDatosCompletos();
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
// CARGA DE DATOS COMPLETOS (HISTÓRICOS + BASE DE DATOS)
// ============================================

async function cargarDatosCompletos() {
    try {
        // 1. Cargar datos actuales de la base de datos
        await cargarMarcasDesdeBD();

        // 2. Intentar migrar datos históricos si existen (solo la primera vez)
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
// MIGRACIÓN DE DATOS HISTÓRICOS
// ============================================

async function migrarDatosHistoricos() {
    try {
        const datosMigrados = localStorage.getItem('datosHistoricosMigrados_primerEtapa');

        if (datosMigrados === 'true') {
            return; // Ya se migró anteriormente
        }

        console.log('📥 Migrando datos históricos de Access...');
        const response = await fetch('../data/marcasCombinadas.json?' + Date.now());

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Datos JSON inválidos');

        const casasPrimeraEtapa = data.filter(marca =>
            marca.numeroCasa >= 33 && marca.numeroCasa <= 65
        );

        console.log(`✅ Encontradas ${casasPrimeraEtapa.length} casas históricas.`);

        if (casasPrimeraEtapa.length > 0) {
            let migradas = 0;
            let errores = 0;

            for (const casa of casasPrimeraEtapa) {
                try {
                    const numeroCasa = casa.numeroCasa.toString();
                    const nombreCliente = casa.cliente || 'Cliente no especificado';
                    
                    const casaExistente = await Database.getCasaByNumero(numeroCasa);

                    if (!casaExistente) {
                        const coords = coordenadasCasas[parseInt(numeroCasa)];
                        if (coords) {
                            const exito = await Database.insertarCasaConCliente(
                                numeroCasa, coords.x, coords.y, nombreCliente
                            );
                            if (exito) migradas++;
                            else errores++;
                        } else {
                            errores++;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error migrando casa ${casa.numeroCasa}:`, error);
                    errores++;
                }
            }

            localStorage.setItem('datosHistoricosMigrados_primerEtapa', 'true');
            console.log(`✅ Migración completada: ${migradas} éxitos, ${errores} errores.`);

            if (migradas > 0 && typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'info',
                    title: 'Migración completada',
                    html: `Se migraron <strong>${migradas}</strong> casas históricas.`,
                    timer: 3000,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false
                });
                await cargarMarcasDesdeBD(); // Recargar dropdown con nuevos datos
            }
        }
    } catch (error) {
        console.warn('⚠️ No se pudieron migrar datos históricos (esto es normal si ya se hizo o no hay archivo):', error.message);
    }
}

// ============================================
// CARGA DE DATOS DESDE BASE DE DATOS (CORREGIDO)
// ============================================

async function cargarMarcasDesdeBD() {
    try {
        // 1. Obtener TODAS las casas de la BD
        const todasLasCasas = await Database.getCasas();
        
        // 2. FILTRO ESTRICTO: Solo Primera Etapa (33 al 65)
        const casasPrimeraEtapa = todasLasCasas.filter(c => {
            const num = parseInt(c.numero_casa);
            // Verificamos explícitamente el rango
            return !isNaN(num) && num >= 33 && num <= 65;
        });

        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }

        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';

        // Ordenar numéricamente
        casasPrimeraEtapa.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));

        console.log(`🔍 Filtrado: Total en BD=${todasLasCasas.length}, Mostrando Primera Etapa=${casasPrimeraEtapa.length}`);

        if (casasPrimeraEtapa.length === 0) {
            console.log('ℹ️ No hay casas registradas en la Primera Etapa aún.');
        }

        for (const casa of casasPrimeraEtapa) {
            const option = document.createElement('option');
            option.value = casa.numero_casa;
            
            // Mostrar nombre si existe, sino "Sin cliente"
            const nombreCliente = (casa.nombre_cliente && casa.nombre_cliente !== 'Sin propietario') 
                                  ? casa.nombre_cliente 
                                  : 'Sin cliente';
            
            option.textContent = `Casa ${casa.numero_casa} - ${nombreCliente}`;
            
            ddlMarcas.appendChild(option);
        }

        console.log(`✅ Dropdown Primera Etapa cargado con ${casasPrimeraEtapa.length} marcas.`);
    } catch (error) {
        console.error('❌ Error cargando marcas desde BD:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
        }
    }
}

// ============================================
// VALIDACIÓN DE ENTRADA
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

    if (numeroInt < 33 || numeroInt > 65) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Número fuera de rango',
                text: `La primera etapa solo incluye casas del 33 al 65.`
            });
        } else {
            alert(`Número fuera de rango: Solo casas del 33 al 65.`);
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

    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = x + 'px';
    marcador.style.top = y + 'px';
    marcador.textContent = numeroCasa;
    marcadoresContainer.appendChild(marcador);

    console.log(`✅ Marcador ${numeroCasa} en X=${x.toFixed(1)}, Y=${y.toFixed(1)}`);
}

// ============================================
// CARGAR MARCA SELECCIONADA (CORREGIDO)
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

            // ✅ CORRECCIÓN CLAVE: Leer cliente.nombre
            try {
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
// IMPRESIÓN
// ============================================

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    if (marcadores.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Sin marcadores', text: 'Aplique una casa primero' });
        }
        return false;
    }

    const numeroCasa = marcadores[0].textContent;
    const casa = parseInt(numeroCasa, 10);
    
    if (!coordenadasCasas.hasOwnProperty(casa)) {
        Swal.fire('Error', 'Coordenadas no encontradas', 'error');
        return false;
    }

    const coords = coordenadasCasas[casa];
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Imprimiendo...',
            didOpen: () => {
                Swal.showLoading();
                setTimeout(() => {
                    window.print();
                    Swal.close();
                }, 1000);
            }
        });
    } else {
        window.print();
    }
    return false;
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
