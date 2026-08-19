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

// ============================================
// COORDENADAS - TERCERA ETAPA
// ============================================
const coordenadasCasas = {};

// Lado DERECHO (Calle 03 Este)
coordenadasCasas[66] = { x: 470, y: 234 };
coordenadasCasas[67] = { x: 470, y: 287 };
coordenadasCasas[68] = { x: 470, y: 340 };
coordenadasCasas[69] = { x: 470, y: 393 };
coordenadasCasas[70] = { x: 470, y: 446 };
coordenadasCasas[71] = { x: 470, y: 499 };
coordenadasCasas[72] = { x: 470, y: 552 };
coordenadasCasas[73] = { x: 470, y: 605 };
coordenadasCasas[74] = { x: 470, y: 658 };
coordenadasCasas[75] = { x: 470, y: 711 };
coordenadasCasas[76] = { x: 470, y: 764 };
coordenadasCasas[77] = { x: 470, y: 817 };
coordenadasCasas[78] = { x: 470, y: 870 };
coordenadasCasas[79] = { x: 470, y: 923 };
coordenadasCasas[80] = { x: 468, y: 968 };
coordenadasCasas[81] = { x: 469, y: 1021 };

// Lado IZQUIERDO (Calle 03 Oeste)
coordenadasCasas[82] = { x: 195, y: 1030 };
coordenadasCasas[83] = { x: 192, y: 978 };
coordenadasCasas[84] = { x: 192, y: 926 };
coordenadasCasas[85] = { x: 192, y: 874 };
coordenadasCasas[86] = { x: 192, y: 822 };
coordenadasCasas[87] = { x: 192, y: 770 };
coordenadasCasas[88] = { x: 192, y: 718 };
coordenadasCasas[89] = { x: 192, y: 666 };
coordenadasCasas[90] = { x: 192, y: 614 };
coordenadasCasas[91] = { x: 192, y: 562 };
coordenadasCasas[92] = { x: 192, y: 510 };
coordenadasCasas[93] = { x: 192, y: 458 };
coordenadasCasas[94] = { x: 192, y: 406 };
coordenadasCasas[95] = { x: 192, y: 354 };
coordenadasCasas[96] = { x: 192, y: 307 };
coordenadasCasas[97] = { x: 220, y: 500 };

// ============================================
// INICIALIZACIÓN Y CARGA DE DATOS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Tercera Etapa v2.0 (API Conectada)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));
    
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    verificarCoordenadas();
    cargarDatosCompletos();
});

function verificarCoordenadas() {
    console.log("Verificación de coordenadas - Tercera Etapa:");
    console.log(`Dimensiones base del plano: ${PLANO_ANCHO_REAL}x${PLANO_ALTO_REAL}`);
    
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
        await cargarMarcasDesdeBD();
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
        const datosMigrados = localStorage.getItem('datosHistoricosMigrados_terceraEtapa');
        if (datosMigrados === 'true') return;

        console.log('📥 Migrando datos históricos de localStorage a BD...');
        
        const marcasJSON = localStorage.getItem('marcasTerceraEtapa');
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
            localStorage.setItem('datosHistoricosMigrados_terceraEtapa', 'true');
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
        const todasLasCasas = await Database.getCasas();
        
        const casasTerceraEtapa = todasLasCasas.filter(c => {
            const num = parseInt(c.numero_casa);
            return !isNaN(num) && num >= 66 && num <= 97;
        });

        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }

        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';

        casasTerceraEtapa.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));

        console.log(`🔍 Filtrado: Total en BD=${todasLasCasas.length}, Mostrando Tercera Etapa=${casasTerceraEtapa.length}`);

        for (const casa of casasTerceraEtapa) {
            const option = document.createElement('option');
            option.value = casa.numero_casa;
            
            const nombreCliente = (casa.nombre_cliente && casa.nombre_cliente !== 'Sin propietario') 
                                  ? casa.nombre_cliente 
                                  : 'Sin cliente';
            
            option.textContent = `Casa ${casa.numero_casa} - ${nombreCliente}`;
            ddlMarcas.appendChild(option);
        }

        console.log(`✅ Dropdown Tercera Etapa cargado con ${casasTerceraEtapa.length} marcas.`);
    } catch (error) {
        console.error('❌ Error cargando marcas desde BD:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
        }
    }
}

// ============================================
// VALIDACIÓN DE ENTRADA (RANGO 66-97)
// ============================================

function validarNumeroCasa(numero) {
    const num = numero.trim();
    
    if (!/^\d+$/.test(num)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Advertencia', 'El número de casa debe ser numérico', 'warning');
        }
        return null;
    }
    
    const numeroInt = parseInt(num, 10);
    
    if (numeroInt < 66 || numeroInt > 97) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Número fuera de rango',
                text: `La tercera etapa solo incluye casas del 66 al 97.`
            });
        }
        return null;
    }
    
    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', `No hay coordenadas para la casa ${numeroInt}`, 'error');
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
// FUNCIONES DE MARCADORES (VERSIÓN SEGURA Y CORREGIDA)
// ============================================

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (!marcadoresContainer || !imgPlano) {
        console.error("No se encontró el contenedor o la imagen del plano.");
        return;
    }

    // Limpiar marcadores anteriores
    marcadoresContainer.innerHTML = '';

    // Función interna para calcular y dibujar de forma segura
    const dibujar = () => {
        // ✅ CLAVE: Usamos las dimensiones REALES de la imagen cargada. 
        // Si por alguna razón son 0, usamos las constantes como respaldo de seguridad.
        const anchoBase = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
        const altoBase = imgPlano.naturalHeight || PLANO_ALTO_REAL;

        const xPercent = (originalX / anchoBase) * 100;
        const yPercent = (originalY / altoBase) * 100;

        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        marcador.style.left = xPercent + '%';
        marcador.style.top = yPercent + '%';
        marcador.textContent = numeroCasa;
        marcador.title = `Casa ${numeroCasa} (Coord: ${originalX}, ${originalY})`;

        marcadoresContainer.appendChild(marcador);
        console.log(`✅ Marcador ${numeroCasa} dibujado en: ${xPercent.toFixed(2)}%, ${yPercent.toFixed(2)}% (Base real: ${anchoBase}x${altoBase})`);
    };

    // Verificar si la imagen ya está cargada
    if (imgPlano.complete && imgPlano.naturalWidth > 0) {
        dibujar();
    } else {
        // Si no, esperar a que termine de cargar
        imgPlano.onload = () => dibujar();
    }
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
        }
        return;
    }

    const ddlMarcas = document.getElementById('ddlMarcas');
    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Casa registrada', text: `La casa ${numeroCasa} ya existe.` });
            }
            return;
        }
    }

    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'Coordenadas no encontradas', 'error');
        }
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
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (!marcadoresContainer || marcadoresContainer.children.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Sin marcadores', text: 'Aplique una casa primero' });
        }
        return false;
    }

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
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    
    if (marcadoresContainer && txtNumeroCasa) {
        const numeroCasa = txtNumeroCasa.value.trim();
        const numValido = parseInt(numeroCasa, 10);
        
        if (numeroCasa && !isNaN(numValido) && coordenadasCasas.hasOwnProperty(numValido)) {
            const coords = coordenadasCasas[numValido];
            // No limpiamos todo, solo actualizamos para evitar parpadeos, 
            // pero si hay múltiples, mejor limpiar y redraw.
            marcadoresContainer.innerHTML = '';
            agregarMarcador(numValido, coords.x, coords.y);
        }
    }
}
