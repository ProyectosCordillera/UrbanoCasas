// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;
let datosCargados = false;
let imagenCargada = false;

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Informe Aplicados v3.1 (Optimizado)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));
    
    // Mostrar año en footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Cargar datos de AMBAS etapas desde el mismo archivo
    cargarDatosCombinados();
    
    // Configurar eventos de imagen
    configurarEventosImagen();
    
    // Redimensionamiento
    window.addEventListener('resize', manejarRedimensionamiento);
    
    // Botón de actualización
    const btnActualizar = document.getElementById('btnActualizar');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarDatos);
    }
});

// ============================================
// CARGA DE DATOS COMBINADOS (UN SOLO ARCHIVO)
// ============================================

function cargarDatosCombinados() {
    const tbody = document.getElementById('tbodyDatos');
    
    // Validación de elementos DOM
    if (!tbody) {
        console.error('❌ tbodyDatos no encontrado en el DOM');
        mostrarError('Error interno: Elemento tbody no encontrado');
        return;
    }

    console.log('📥 Iniciando carga de datos...');
    
    // 1. Intentar cargar desde localStorage (datos nuevos)
    let todasMarcas = [];
    try {
        const stored = localStorage.getItem('marcasCombinadas');
        if (stored && stored !== 'undefined' && stored !== 'null') {
            todasMarcas = JSON.parse(stored);
            console.log(`✅ Cargadas ${todasMarcas.length} casas desde localStorage`);
        } else {
            console.log('ℹ️ localStorage vacío o no inicializado');
        }
    } catch (e) {
        console.warn('⚠️ Error leyendo localStorage:', e.message);
        // Limpiar localStorage corrupto
        localStorage.removeItem('marcasCombinadas');
    }
    
    // 2. Si localStorage está vacío o no tiene datos, cargar desde JSON
    if (!todasMarcas || todasMarcas.length === 0) {
        console.log('🔄 localStorage vacío. Cargando desde JSON...');
        
        fetch('../data/marcas-combinadas.json?' + Date.now()) // Cache busting
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error('Datos JSON no son un array válido');
                }
                
                todasMarcas = data;
                console.log(`✅ Cargadas ${todasMarcas.length} casas desde JSON`);
                
                // Validar estructura de datos
                validarEstructuraDatos(todasMarcas);
                
                // Guardar en localStorage para futuras visitas
                try {
                    localStorage.setItem('marcasCombinadas', JSON.stringify(todasMarcas));
                    console.log('💾 Datos guardados en localStorage');
                } catch (e) {
                    console.warn('⚠️ No se pudo guardar en localStorage:', e.message);
                }
                
                // Mostrar datos en tabla
                mostrarDatosEnTabla(todasMarcas);
                datosCargados = true;
                
                // Colocar marcadores si la imagen ya cargó
                if (imagenCargada) {
                    console.log('🖼️ Imagen ya cargada, colocando marcadores...');
                    setTimeout(colocarMarcadores, 100);
                } else {
                    console.log('⏳ Esperando carga de imagen para colocar marcadores');
                }
            })
            .catch(error => {
                console.error('❌ Error crítico cargando JSON:', error);
                mostrarError(`Error al cargar los datos: ${error.message}<br>
                             <small>Verifique que exista el archivo: <code>../data/marcas-combinadas.json</code></small>`);
                
                // Intentar recuperar datos anteriores si existen
                const backupData = localStorage.getItem('marcasCombinadas_backup');
                if (backupData) {
                    console.log('🔄 Restaurando datos desde backup...');
                    try {
                        const backupMarcas = JSON.parse(backupData);
                        mostrarDatosEnTabla(backupMarcas);
                        datosCargados = true;
                    } catch (e) {
                        console.error('❌ Error restaurando backup:', e);
                    }
                }
            });
            
        return; // Salir porque el fetch es asíncrono
    }
    
    // 3. Mostrar datos de localStorage
    console.log('📊 Mostrando datos desde localStorage');
    mostrarDatosEnTabla(todasMarcas);
    datosCargados = true;
    
    // 4. Si la imagen ya cargó, colocar marcadores inmediatamente
    if (imagenCargada) {
        console.log('🖼️ Colocando marcadores (imagen ya cargada)');
        setTimeout(colocarMarcadores, 100);
    }
}

// ============================================
// VALIDACIÓN DE ESTRUCTURA DE DATOS
// ============================================

function validarEstructuraDatos(marcas) {
    console.log('🔍 Validando estructura de datos...');
    
    let errores = 0;
    let warnings = 0;
    
    marcas.forEach((marca, index) => {
        // Validar número de casa
        if (typeof marca.numeroCasa !== 'number' || isNaN(marca.numeroCasa)) {
            console.warn(`⚠️ Registro ${index}: numeroCasa inválido (${marca.numeroCasa})`);
            warnings++;
        }
        
        // Validar coordenadas
        if (!marca.coordenadas || typeof marca.coordenadas.x !== 'number' || typeof marca.coordenadas.y !== 'number') {
            console.warn(`⚠️ Registro ${index} (Casa ${marca.numeroCasa}): coordenadas inválidas`);
            warnings++;
        }
        
        // Validar cliente
        if (!marca.cliente) {
            console.warn(`ℹ️ Registro ${index} (Casa ${marca.numeroCasa}): cliente no especificado`);
        }
    });
    
    console.log(`✅ Validación completada: ${marcas.length} registros, ${warnings} advertencias, ${errores} errores`);
}

// ============================================
// MOSTRAR DATOS EN TABLA
// ============================================

function mostrarDatosEnTabla(marcas) {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) {
        console.error('❌ tbodyDatos no encontrado');
        return;
    }
    
    // Eliminar spinner
    tbody.innerHTML = '';
    
    if (!marcas || marcas.length === 0) {
        console.warn('⚠️ No hay datos para mostrar');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="alert alert-warning">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>No hay casas registradas</strong>
                        <p class="mb-0 mt-2">Registre casas en <a href="../paginas/primer-etapa.html" class="alert-link">Primera Etapa</a> 
                        o <a href="../paginas/segunda-etapa.html" class="alert-link">Segunda Etapa</a></p>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">Fuente de datos: marcas-combinadas.json</small>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('marcadoresContainer').innerHTML = '';
        return;
    }
    
    // Ordenar por número de casa
    marcas.sort((a, b) => a.numeroCasa - b.numeroCasa);
    
    // Contadores para estadísticas
    let countPrimera = 0;
    let countSegunda = 0;
    
    // Llenar tabla
    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        
        // Determinar etapa
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
        
        // Celdas
        const celdas = [
            { 
                content: `<strong>${marca.numeroCasa}</strong><br><small class="badge bg-secondary">${etapa}</small>`, 
                className: 'fw-bold' 
            },
            { 
                content: marca.coordenadas?.x !== undefined ? marca.coordenadas.x : 'N/A', 
                className: 'text-center' 
            },
            { 
                content: marca.coordenadas?.y !== undefined ? marca.coordenadas.y : 'N/A', 
                className: 'text-center' 
            },
            { 
                content: marca.cliente || 'Cliente no especificado', 
                className: '' 
            },
            { 
                content: marca.fecha ? 
                    `<small>${new Date(marca.fecha).toLocaleDateString('es-ES')}</small>` : 
                    '<small class="text-muted">Sin fecha</small>', 
                className: 'text-center' 
            }
        ];
        
        celdas.forEach(celda => {
            const td = document.createElement('td');
            td.innerHTML = celda.content;
            if (celda.className) td.className = celda.className;
            if (celda.content.includes('N/A')) td.classList.add('text-muted');
            fila.appendChild(td);
        });
        
        tbody.appendChild(fila);
    });
    
    // Mostrar resumen
    console.log(`📊 Total: ${marcas.length} casas (${countPrimera} primera etapa, ${countSegunda} segunda etapa)`);
    
    // Mostrar mensaje de éxito (solo si Swal está disponible)
    if (marcas.length > 0 && typeof Swal !== 'undefined') {
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'Datos cargados',
                html: `Se muestran <strong>${marcas.length}</strong> casas registradas:<br>
                       <small>• ${countPrimera} Primera Etapa<br>
                       • ${countSegunda} Segunda Etapa</small>`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }, 300);
    }
}

// ============================================
// MOSTRAR ERROR
// ============================================

function mostrarError(mensaje) {
    const tbody = document.getElementById('tbodyDatos');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle fs-1 mb-2"></i>
                    <p class="h5">${mensaje}</p>
                    <button class="btn btn-outline-primary mt-3" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
    
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer) {
        marcadoresContainer.innerHTML = '';
    }
}

// ============================================
// CONFIGURACIÓN DE IMAGEN
// ============================================

function configurarEventosImagen() {
    const imgPlano = document.getElementById('imgPlano');
    
    if (!imgPlano) {
        console.error('❌ Elemento imgPlano no encontrado');
        mostrarError('Error: Imagen del plano no encontrada');
        return;
    }
    
    // Evento carga exitosa
    imgPlano.addEventListener('load', function() {
        console.log(`✅ Plano cargado: ${this.naturalWidth}x${this.naturalHeight}px`);
        imagenCargada = true;
        ajustarContenedorMarcadores();
        
        // Si los datos ya cargaron, colocar marcadores
        if (datosCargados) {
            console.log('📊 Datos ya cargados, colocando marcadores...');
            setTimeout(colocarMarcadores, 100);
        }
    });
    
    // Evento error de carga
    imgPlano.addEventListener('error', function(e) {
        console.error('❌ Error cargando plano_General.png:', e);
        
        // Intentar cargar plano alternativo
        const rutasAlternativas = [
            '../img/plano1.png',
            '../img/Plano2.png',
            '../img/plano_general.png'
        ];
        
        let intento = 0;
        const intentarCargar = () => {
            if (intento < rutasAlternativas.length) {
                console.log(`🔄 Intentando cargar alternativa ${intento + 1}: ${rutasAlternativas[intento]}`);
                this.src = rutasAlternativas[intento];
                intento++;
            } else {
                // Mostrar error definitivo
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Plano no disponible',
                        html: `No se pudo cargar el plano general.<br>
                               <small>Verifique que el archivo exista en:<br>
                               <code>../img/plano_General.png</code></small>`,
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        };
        
        // Intentar cargar alternativa
        intentarCargar();
    });
    
    // Si ya está cargada al inicio
    if (imgPlano.complete && imgPlano.naturalWidth > 0) {
        console.log('✅ Plano ya cargado al inicio');
        imagenCargada = true;
        ajustarContenedorMarcadores();
        
        if (datosCargados) {
            console.log('📊 Datos ya cargados, colocando marcadores...');
            setTimeout(colocarMarcadores, 100);
        }
    } else {
        console.log('⏳ Esperando carga de imagen...');
    }
}

// ============================================
// MARCADORES Y AJUSTES
// ============================================

function colocarMarcadores() {
    const tbody = document.querySelector('#tblCasas tbody');
    if (!tbody) {
        console.error('❌ tbody no encontrado');
        return;
    }
    
    const filas = tbody.querySelectorAll('tr');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');
    
    if (!marcadoresContainer || !imgPlano || !imgPlano.complete) {
        console.warn('⚠️ Elementos no listos para colocar marcadores');
        return;
    }
    
    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';
    
    const planoAncho = imgPlano.clientWidth || PLANO_ANCHO_REAL;
    const planoAlto = imgPlano.clientHeight || PLANO_ALTO_REAL;
    const escalaX = planoAncho / (imgPlano.naturalWidth || PLANO_ANCHO_REAL);
    const escalaY = planoAlto / (imgPlano.naturalHeight || PLANO_ALTO_REAL);
    
    let colocados = 0;
    let errores = 0;
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 4) {
            console.warn('⚠️ Fila con menos de 4 celdas');
            errores++;
            return;
        }
        
        // Extraer número de casa (del HTML con <strong>)
        const numeroMatch = celdas[0].innerHTML.match(/<strong>(\d+)<\/strong>/);
        const numeroCasa = numeroMatch ? parseInt(numeroMatch[1]) : null;
        
        // Extraer coordenadas
        const coordX = parseInt(celdas[1].textContent) || null;
        const coordY = parseInt(celdas[2].textContent) || null;
        
        if (!numeroCasa || isNaN(coordX) || isNaN(coordY)) {
            console.warn(`⚠️ Datos inválidos para casa: ${numeroCasa}`);
            errores++;
            return;
        }
        
        // Calcular posición
        const posX = coordX * escalaX;
        const posY = coordY * escalaY;
        
        if (isNaN(posX) || isNaN(posY)) {
            console.warn(`⚠️ Posición inválida para casa ${numeroCasa}`);
            errores++;
            return;
        }
        
        // Crear marcador
        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        marcador.textContent = numeroCasa;
        marcador.style.left = `${posX}px`;
        marcador.style.top = `${posY}px`;
        
        // Color por etapa
        if (numeroCasa >= 33 && numeroCasa <= 65) {
            marcador.style.backgroundColor = 'rgba(13, 110, 253, 0.95)';
        } else if (numeroCasa >= 1 && numeroCasa <= 32) {
            marcador.style.backgroundColor = 'rgba(25, 135, 84, 0.95)';
        } else {
            marcador.style.backgroundColor = 'rgba(220, 53, 69, 0.95)';
        }
        
        marcador.title = `Casa ${numeroCasa}\nCliente: ${celdas[3].textContent.trim()}`;
        marcadoresContainer.appendChild(marcador);
        colocados++;
    });
    
    console.log(`📍 ${colocados} marcadores colocados en el plano (${errores} errores)`);
    
    if (colocados > 0 && typeof Swal !== 'undefined') {
        // Mostrar mensaje solo si hay muchos marcadores
        if (colocados > 10) {
            setTimeout(() => {
                Swal.fire({
                    icon: 'info',
                    title: 'Marcadores posicionados',
                    text: `${colocados} casas mostradas en el plano`,
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'bottom-end'
                });
            }, 500);
        }
    }
}

function ajustarContenedorMarcadores() {
    const img = document.getElementById('imgPlano');
    const container = document.getElementById('marcadoresContainer');
    
    if (img && container) {
        container.style.width = `${img.clientWidth}px`;
        container.style.height = `${img.clientHeight}px`;
        console.log(`📐 Contenedor ajustado: ${img.clientWidth}x${img.clientHeight}px`);
    }
}

function manejarRedimensionamiento() {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        if (datosCargados && imagenCargada) {
            console.log('🔄 Redimensionando...');
            ajustarContenedorMarcadores();
            colocarMarcadores();
        }
    }, 200);
}

// ============================================
// FUNCIONES DE USUARIO
// ============================================

function actualizarDatos() {
    if (typeof Swal === 'undefined') {
        console.error('❌ Swal no está disponible');
        location.reload();
        return;
    }
    
    Swal.fire({
        title: 'Actualizando...',
        html: '<div class="spinner-border text-primary"></div><p class="mt-2">Recargando datos de ambas etapas</p>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
    });
    
    // Forzar recarga de datos
    localStorage.removeItem('marcasCombinadas');
    datosCargados = false;
    
    // Recargar datos
    cargarDatosCombinados();
    
    // Cerrar después de breve delay
    setTimeout(() => {
        Swal.close();
        
        if (datosCargados) {
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Datos recargados correctamente',
                timer: 1000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Esperando datos',
                text: 'Los datos se cargarán en breve',
                timer: 1500,
                showConfirmButton: false
            });
        }
    }, 800);
}

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    
    if (!marcadores || marcadores.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Advertencia', 'No hay marcadores para imprimir', 'warning');
        } else {
            alert('Advertencia: No hay marcadores para imprimir');
        }
        return;
    }
    
    console.log(`🖨️ Imprimiendo plano con ${marcadores.length} marcadores`);
    window.print();
}

function verResumen() {
    try {
        const marcas = JSON.parse(localStorage.getItem('marcasCombinadas') || '[]');
        
        if (!Array.isArray(marcas) || marcas.length === 0) {
            if (typeof Swal !== 'undefined') {
                Swal.fire('Información', 'No hay datos para mostrar estadísticas', 'info');
            }
            return;
        }
        
        const primera = marcas.filter(m => m.numeroCasa >= 33 && m.numeroCasa <= 65);
        const segunda = marcas.filter(m => m.numeroCasa >= 1 && m.numeroCasa <= 32);
        const total = marcas.length;
        
        // Calcular estadísticas
        const primerasCasas = primera.map(m => m.numeroCasa).sort((a, b) => a - b);
        const ultimasCasas = segunda.map(m => m.numeroCasa).sort((a, b) => a - b);

        let html = `
            <div class="text-start">
                <h5><i class="bi bi-bar-chart me-2"></i>Estadísticas del Sistema</h5>
                <hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-house-door me-2"></i>Primera Etapa</h6>
                                <h2 class="card-text mb-0">${primera.length}</h2>
                                <small>Casas registradas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card bg-success text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-building me-2"></i>Segunda Etapa</h6>
                                <h2 class="card-text mb-0">${segunda.length}</h2>
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

                ${primera.length > 0 ? `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary"><i class="bi bi-list-ul me-2"></i>Casas Primera Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...primerasCasas)} - ${Math.max(...primerasCasas)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${primerasCasas.join(', ')}</p>
                    </div>
                </div>
                ` : ''}

                ${segunda.length > 0 ? `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-success"><i class="bi bi-list-ul me-2"></i>Casas Segunda Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...ultimasCasas)} - ${Math.max(...ultimasCasas)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${ultimasCasas.join(', ')}</p>
                    </div>
                </div>
                ` : ''}
                
                <hr>
                <small class="text-muted">Última actualización: ${new Date().toLocaleString('es-ES')}</small>
            </div>
        `;

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '📊 Resumen Estadístico',
                html: html,
                width: '500px',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#0d6efd'
            });
        }
    } catch (error) {
        console.error('Error mostrando resumen:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudo generar el resumen estadístico', 'error');
        }
    }
}

// ============================================
// FUNCIÓN DE DEBUG (para desarrollo)
// ============================================

function debugInformacion() {
    console.log('🔍 DEBUG - Información del sistema:');
    console.log('----------------------------------------');
    console.log('Estado datosCargados:', datosCargados);
    console.log('Estado imagenCargada:', imagenCargada);
    console.log('localStorage marcasCombinadas:', localStorage.getItem('marcasCombinadas') ? 'EXISTE' : 'NO EXISTE');
    console.log('Tamaño localStorage:', localStorage.getItem('marcasCombinadas')?.length || 0, 'bytes');
    console.log('Elementos DOM:');
    console.log('  - tbodyDatos:', document.getElementById('tbodyDatos') ? 'EXISTE' : 'NO EXISTE');
    console.log('  - imgPlano:', document.getElementById('imgPlano') ? 'EXISTE' : 'NO EXISTE');
    console.log('  - marcadoresContainer:', document.getElementById('marcadoresContainer') ? 'EXISTE' : 'NO EXISTE');
    console.log('----------------------------------------');
}

// Exponer función de debug globalmente (solo para desarrollo)
window.debugInformacion = debugInformacion;
