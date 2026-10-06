// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================
const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Informe Aplicados v5.0 (API Unificada)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));
    
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    cargarDatosDesdeAPI();
    configurarEventosImagen();
    window.addEventListener('resize', manejarRedimensionamiento);
    
    const btnActualizar = document.getElementById('btnActualizar');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarDatos);
    }
});

// ============================================
// CARGA DE DATOS DESDE LA API (POSTGRESQL)
// ============================================
async function cargarDatosDesdeAPI() {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;

    console.log('📥 Consultando todas las casas a la API...');
    
    try {
        const todasLasCasas = await window.Database.getCasas();
        console.log(`✅ API devolvió ${todasLasCasas.length} casas totales.`);
        
        if (todasLasCasas.length > 0) {
            mostrarDatosEnTabla(todasLasCasas);
            if (document.getElementById('imgPlano').complete) {
                setTimeout(colocarMarcadores, 100);
            }
        } else {
            mostrarMensajeVacio();
        }
    } catch (error) {
        console.error('❌ Error cargando datos desde API:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error de Conexión', 'No se pudieron cargar los datos de la base de datos. Verifica tu conexión.', 'error');
        }
        mostrarMensajeVacio();
    }
}

function mostrarMensajeVacio() {
    const tbody = document.getElementById('tbodyDatos');
    const container = document.getElementById('marcadoresContainer');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="alert alert-warning">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>No hay casas registradas</strong>
                        <p class="mb-0 mt-2">Registre casas en <a href="../paginas/primer-etapa.html" class="alert-link">Primera Etapa</a> 
                        o <a href="../paginas/segunda-etapa.html" class="alert-link">Segunda Etapa</a></p>
                    </div>
                </td>
            </tr>
        `;
    }
    if (container) container.innerHTML = '';
}

// ============================================
// MOSTRAR DATOS EN TABLA
// ============================================
function mostrarDatosEnTabla(casas) {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    casas.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));
    
    let countPrimera = 0;
    let countSegunda = 0;
    
    casas.forEach(casa => {
        const numeroCasa = parseInt(casa.numero_casa);
        const fila = document.createElement('tr');
        
        let etapa = 'Desconocida';
        let badgeClass = 'bg-secondary';
        
        if (numeroCasa >= 33 && numeroCasa <= 65) {
            etapa = 'Primera Etapa';
            fila.classList.add('table-info');
            badgeClass = 'bg-primary';
            countPrimera++;
        } else if (numeroCasa >= 1 && numeroCasa <= 32) {
            etapa = 'Segunda Etapa';
            fila.classList.add('table-success');
            badgeClass = 'bg-success';
            countSegunda++;
        }
        
        // Ya no usamos coordenadas GPS en la tabla visual
        const coordX = '-'; 
        const coordY = '-';
        
        const nombreCliente = (casa.nombre_cliente && casa.nombre_cliente !== 'Sin propietario') 
                              ? casa.nombre_cliente 
                              : 'Sin cliente';

        const celdas = [
            { content: `<strong>${numeroCasa}</strong><br><small class="badge ${badgeClass}">${etapa}</small>`, className: 'fw-bold' },
            { content: coordX, className: 'text-center text-muted' },
            { content: coordY, className: 'text-center text-muted' },
            { content: nombreCliente, className: '' },
            { content: '<small class="text-muted">En línea</small>', className: 'text-center' }
        ];
        
        celdas.forEach(celda => {
            const td = document.createElement('td');
            td.innerHTML = celda.content;
            if (celda.className) td.className = celda.className;
            fila.appendChild(td);
        });
        
        tbody.appendChild(fila);
    });
    
    console.log(`📊 Total: ${casas.length} casas (${countPrimera} primera, ${countSegunda} segunda)`);
    
    if (casas.length > 0 && typeof Swal !== 'undefined') {
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'Datos cargados',
                html: `Se muestran <strong>${casas.length}</strong> casas registradas:<br>
                       <small>• ${countPrimera} Primera Etapa<br>• ${countSegunda} Segunda Etapa</small>`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }, 300);
    }
}

// ============================================
// CONFIGURACIÓN DE IMAGEN
// ============================================
function configurarEventosImagen() {
    const imgPlano = document.getElementById('imgPlano');
    
    imgPlano.addEventListener('load', function() {
        console.log(`✅ Plano General cargado: ${this.naturalWidth}x${this.naturalHeight}px`);
        ajustarContenedorMarcadores();
        
        const tbody = document.getElementById('tbodyDatos');
        if (tbody && tbody.children.length > 0 && !tbody.querySelector('.alert')) {
            setTimeout(colocarMarcadores, 100);
        }
    });
    
    imgPlano.addEventListener('error', function() {
        console.error('❌ Error cargando plano_General.png');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Plano no disponible',
                html: `No se pudo cargar el plano general.<br><small>Verifique: <code>../img/plano_General.png</code></small>`,
                confirmButtonText: 'Aceptar'
            });
        }
    });
    
    if (imgPlano.complete && imgPlano.naturalWidth > 0) {
        console.log('✅ Plano ya cargado al inicio');
        ajustarContenedorMarcadores();
        const tbody = document.getElementById('tbodyDatos');
        if (tbody && tbody.children.length > 0 && !tbody.querySelector('.alert')) {
            setTimeout(colocarMarcadores, 100);
        }
    }
}

// ============================================
// MARCADORES Y AJUSTES
// ============================================
function colocarMarcadores() {
    const tbody = document.querySelector('#tblCasas tbody');
    if (!tbody) return;
    
    const filas = tbody.querySelectorAll('tr');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');
    
    if (!marcadoresContainer || !imgPlano || !imgPlano.complete) return;
    
    marcadoresContainer.innerHTML = '';
    
    const planoAncho = imgPlano.clientWidth || PLANO_ANCHO_REAL;
    const planoAlto = imgPlano.clientHeight || PLANO_ALTO_REAL;
    
    let colocados = 0;
    let sinMapeo = [];
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 4) return;
        
        const numeroMatch = celdas[0].innerHTML.match(/<strong>(\d+)<\/strong>/);
        const numeroCasa = numeroMatch ? numeroMatch[1] : null;
        
        if (!numeroCasa) return;
        
        // BUSCAR EN EL MAPEO (mapeo-casas.js)
        const posicion = MAPEO_CASAS[numeroCasa];
        
        if (!posicion) {
            sinMapeo.push(numeroCasa);
            return;
        }
        
        // Convertir porcentaje a píxeles
        const posX = (posicion.x / 100) * planoAncho;
        const posY = (posicion.y / 100) * planoAlto;
        
        const cliente = celdas[3].textContent.trim();
        
        // Crear marcador
        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        marcador.textContent = numeroCasa;
        marcador.style.left = `${posX}px`;
        marcador.style.top = `${posY}px`;
        
        // ✅ Asignar clase de color según etapa (CSS se encarga del color)
        const numCasaInt = parseInt(numeroCasa);
        if (numCasaInt >= 33 && numCasaInt <= 65) {
            marcador.classList.add('etapa-primera');
        } else if (numCasaInt >= 1 && numCasaInt <= 32) {
            marcador.classList.add('etapa-segunda');
        } else {
            marcador.classList.add('etapa-otro');
        }
        
        marcador.title = `Casa ${numeroCasa}\nCliente: ${cliente}`;
        marcador.style.cursor = 'pointer';
        
        marcador.addEventListener('click', () => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: `Casa #${numeroCasa}`,
                    text: `Cliente: ${cliente}`,
                    icon: 'info',
                    confirmButtonText: 'Cerrar'
                });
            }
        });
        
        marcadoresContainer.appendChild(marcador);
        colocados++;
    });
    
    console.log(`📍 ${colocados} marcadores colocados en el plano`);
    
    if (sinMapeo.length > 0) {
        console.warn(`⚠️ Casas sin mapeo (${sinMapeo.length}): ${sinMapeo.join(', ')}`);
    }
}

function ajustarContenedorMarcadores() {
    const img = document.getElementById('imgPlano');
    const container = document.getElementById('marcadoresContainer');
    if (img && container) {
        container.style.width = `${img.clientWidth}px`;
        container.style.height = `${img.clientHeight}px`;
    }
}

function manejarRedimensionamiento() {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        const tbody = document.getElementById('tbodyDatos');
        if (tbody && tbody.children.length > 0 && !tbody.querySelector('.alert')) {
            ajustarContenedorMarcadores();
            colocarMarcadores();
        }
    }, 200);
}

// ============================================
// FUNCIÓN DE ACTUALIZACIÓN
// ============================================
async function actualizarDatos() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Actualizando...',
            html: '<div class="spinner-border text-primary"></div><p class="mt-2">Consultando base de datos...</p>',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(null)
        });
    }
    
    await cargarDatosDesdeAPI();
    
    setTimeout(() => {
        if (typeof Swal !== 'undefined') {
            Swal.close();
            const total = document.querySelectorAll('#tblCasas tbody tr').length;
            if (total > 0 && !document.querySelector('#tblCasas .alert')) {
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    html: `Se muestran <strong>${total}</strong> casas actualizadas desde la BD`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    }, 500);
}

// ============================================
// IMPRESIÓN
// ============================================
function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (marcadores.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Sin marcadores', text: 'No hay casas registradas para imprimir' });
        } else {
            alert('Advertencia: No hay casas registradas para imprimir');
        }
        return;
    }
    window.print();
}

// ============================================
// VER RESUMEN ESTADÍSTICO
// ============================================
async function verResumen() {
    try {
        const todasLasCasas = await window.Database.getCasas();
        
        const casasPrimera = todasLasCasas.filter(c => {
            const n = parseInt(c.numero_casa);
            return n >= 33 && n <= 65;
        });
        
        const casasSegunda = todasLasCasas.filter(c => {
            const n = parseInt(c.numero_casa);
            return n >= 1 && n <= 32;
        });
        
        const total = todasLasCasas.length;
        const primerasCasasNum = casasPrimera.map(c => parseInt(c.numero_casa)).sort((a, b) => a - b);
        const segundasCasasNum = casasSegunda.map(c => parseInt(c.numero_casa)).sort((a, b) => a - b);

        let html = `
            <div class="text-start">
                <h5><i class="bi bi-bar-chart me-2"></i>Estadísticas del Sistema</h5><hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-house-door me-2"></i>Primera Etapa</h6>
                                <h2 class="card-text mb-0">${casasPrimera.length}</h2><small>Casas registradas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card bg-success text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-building me-2"></i>Segunda Etapa</h6>
                                <h2 class="card-text mb-0">${casasSegunda.length}</h2><small>Casas registradas</small>
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
                ${casasPrimera.length > 0 ? `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary"><i class="bi bi-list-ul me-2"></i>Casas Primera Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...primerasCasasNum)} - ${Math.max(...primerasCasasNum)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${primerasCasasNum.join(', ')}</p>
                    </div>
                </div>` : ''}
                ${casasSegunda.length > 0 ? `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-success"><i class="bi bi-list-ul me-2"></i>Casas Segunda Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...segundasCasasNum)} - ${Math.max(...segundasCasasNum)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${segundasCasasNum.join(', ')}</p>
                    </div>
                </div>` : ''}
                <hr><small class="text-muted">Datos en tiempo real desde PostgreSQL<br>${new Date().toLocaleString('es-ES')}</small>
            </div>
        `;

        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: '📊 Resumen Estadístico', html: html, width: '500px', confirmButtonText: 'Cerrar', confirmButtonColor: '#0d6efd' });
        }
    } catch (error) {
        console.error('Error mostrando resumen:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudo generar el resumen estadístico desde la BD', 'error');
        }
    }
}
