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
        // Usamos la misma función del adapter que trae todo unificado
        const todasLasCasas = await Database.getCasas();
        
        // Filtramos solo las de la segunda etapa (1 al 32)
        const casasSegundaEtapa = todasLasCasas.filter(c => {
            const num = parseInt(c.numero_casa);
            return num >= 1 && num <= 32;
        });

        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }

        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';

        // Ordenar numéricamente
        casasSegundaEtapa.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));

        for (const casa of casasSegundaEtapa) {
            const option = document.createElement('option');
            option.value = casa.numero_casa;
            
            // El nombre viene directo de la vista unificada
            const nombreCliente = casa.nombre_cliente !== 'Sin propietario' ? casa.nombre_cliente : 'Sin cliente';
            option.textContent = `Casa ${casa.numero_casa} - ${nombreCliente}`;
            
            ddlMarcas.appendChild(option);
        }

        console.log(`✅ Dropdown cargado con ${casasSegundaEtapa.length} marcas de la 2da Etapa.`);
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

    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = x + 'px';
    marcador.style.top = y + 'px';
    marcador.textContent = numeroCasa;
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
// IMPRESIÓN (Misma lógica que primera etapa)
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
