// ============================================
// CONFIGURACIÓN DE VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Informe Aplicados v3.0');
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Cargar datos de AMBAS etapas desde el mismo archivo
    cargarDatosCombinados();
    
    // Configurar eventos de imagen
    configurarEventosImagen();
    
    // Redimensionamiento
    window.addEventListener('resize', manejarRedimensionamiento);
});

// ============================================
// CARGA DE DATOS COMBINADOS (UN SOLO ARCHIVO)
// ============================================

function cargarDatosCombinados() {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;

    console.log('📥 Cargando datos de marcas-combinadas.json...');
    
    // 1. Intentar cargar desde localStorage (datos nuevos)
    let todasMarcas = [];
    try {
        const stored = localStorage.getItem('marcasCombinadas');
        if (stored) {
            todasMarcas = JSON.parse(stored);
            console.log(`✅ Cargadas ${todasMarcas.length} casas desde localStorage`);
        }
    } catch (e) {
        console.warn('⚠️ Error leyendo localStorage:', e.message);
    }
    
    // 2. Si localStorage está vacío, cargar desde JSON
    if (todasMarcas.length === 0) {
        console.log('🔄 localStorage vacío. Cargando desde JSON...');
        
        fetch('../data/marcas-combinadas.json')
            .then(response => {
                if (!response.ok) throw new Error('Archivo JSON no encontrado');
                return response.json();
            })
            .then(data => {
                todasMarcas = data;
                console.log(`✅ Cargadas ${todasMarcas.length} casas desde JSON`);
                
                // Guardar en localStorage para futuras visitas
                localStorage.setItem('marcasCombinadas', JSON.stringify(todasMarcas));
                
                // Mostrar datos en tabla
                mostrarDatosEnTabla(todasMarcas);
                
                // Colocar marcadores si la imagen ya cargó
                if (document.getElementById('imgPlano').complete) {
                    setTimeout(colocarMarcadores, 100);
                }
            })
            .catch(error => {
                console.error('❌ Error cargando JSON:', error);
                mostrarError('No se pudieron cargar los datos. Verifique que exista el archivo: ../data/marcas-combinadas.json');
            });
            
        return; // Salir porque el fetch es asíncrono
    }
    
    // 3. Mostrar datos de localStorage
    mostrarDatosEnTabla(todasMarcas);
    
    // 4. Si la imagen ya cargó, colocar marcadores inmediatamente
    if (document.getElementById('imgPlano').complete) {
        setTimeout(colocarMarcadores, 100);
    }
}

function mostrarDatosEnTabla(marcas) {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;
    
    // Eliminar spinner
    tbody.innerHTML = '';
    
    if (marcas.length === 0) {
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
    
    // Llenar tabla
    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        
        // Determinar etapa
        let etapa = 'Desconocida';
        if (marca.numeroCasa >= 33 && marca.numeroCasa <= 65) {
            etapa = 'Primera Etapa';
            fila.classList.add('table-info');
        } else if (marca.numeroCasa >= 1 && marca.numeroCasa <= 32) {
            etapa = 'Segunda Etapa';
            fila.classList.add('table-success');
        }
        
        // Celdas
        const celdas = [
            { 
                content: `<strong>${marca.numeroCasa}</strong><br><small class="badge bg-secondary">${etapa}</small>`, 
                className: 'fw-bold' 
            },
            { 
                content: marca.coordenadas?.x || 'N/A', 
                className: 'text-center' 
            },
            { 
                content: marca.coordenadas?.y || 'N/A', 
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
    console.log(`📊 Total: ${marcas.length} casas`);
    if (marcas.length > 0 && window.Swal) {
        Swal.fire({
            icon: 'success',
            title: 'Datos cargados',
            text: `Se muestran ${marcas.length} casas registradas`,
            timer: 1200,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }
}

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
    document.getElementById('marcadoresContainer').innerHTML = '';
}

// ============================================
// CONFIGURACIÓN DE IMAGEN
// ============================================

function configurarEventosImagen() {
    const imgPlano = document.getElementById('imgPlano');
    
    // Evento carga exitosa
    imgPlano.addEventListener('load', function() {
        console.log(`✅ Plano cargado: ${this.naturalWidth}x${this.naturalHeight}px`);
        ajustarContenedorMarcadores();
        
        // Si los datos ya cargaron, colocar marcadores
        if (document.getElementById('tbodyDatos').children.length > 0) {
            setTimeout(colocarMarcadores, 100);
        }
    });
    
    // Evento error de carga
    imgPlano.addEventListener('error', function() {
        console.error('❌ Error cargando plano_General.png');
        Swal.fire({
            icon: 'error',
            title: 'Plano no disponible',
            html: `No se pudo cargar el plano general.<br>
                   <small>Verifique que el archivo exista en:<br>
                   <code>../img/plano_General.png</code></small>`,
            confirmButtonText: 'Aceptar'
        });
    });
    
    // Si ya está cargada al inicio
    if (imgPlano.complete && imgPlano.naturalWidth > 0) {
        console.log('✅ Plano ya cargado al inicio');
        ajustarContenedorMarcadores();
        if (document.getElementById('tbodyDatos').children.length > 0) {
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
    
    // Limpiar marcadores existentes
    marcadoresContainer.innerHTML = '';
    
    const planoAncho = imgPlano.clientWidth || PLANO_ANCHO_REAL;
    const planoAlto = imgPlano.clientHeight || PLANO_ALTO_REAL;
    const escalaX = planoAncho / (imgPlano.naturalWidth || PLANO_ANCHO_REAL);
    const escalaY = planoAlto / (imgPlano.naturalHeight || PLANO_ALTO_REAL);
    
    let colocados = 0;
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 4) return;
        
        // Extraer número de casa (del HTML con <strong>)
        const numeroMatch = celdas[0].innerHTML.match(/<strong>(\d+)<\/strong>/);
        const numeroCasa = numeroMatch ? parseInt(numeroMatch[1]) : null;
        
        // Extraer coordenadas
        const coordX = parseInt(celdas[1].textContent) || null;
        const coordY = parseInt(celdas[2].textContent) || null;
        
        if (!numeroCasa || isNaN(coordX) || isNaN(coordY)) return;
        
        // Calcular posición
        const posX = coordX * escalaX;
        const posY = coordY * escalaY;
        
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
    
    console.log(`📍 ${colocados} marcadores colocados en el plano`);
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
        if (document.getElementById('tbodyDatos').children.length > 0) {
            ajustarContenedorMarcadores();
            colocarMarcadores();
        }
    }, 200);
}

// ============================================
// FUNCIONES DE USUARIO
// ============================================

function actualizarDatos() {
    Swal.fire({
        title: 'Actualizando...',
        html: '<div class="spinner-border text-primary"></div><p class="mt-2">Recargando datos de ambas etapas</p>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
    });
    
    // Forzar recarga de datos
    localStorage.removeItem('marcasCombinadas');
    cargarDatosCombinados();
    
    // Cerrar después de breve delay
    setTimeout(() => {
        Swal.close();
        if (document.getElementById('tbodyDatos').children.length > 0) {
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Datos recargados correctamente',
                timer: 1000,
                showConfirmButton: false
            });
        }
    }, 800);
}

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;
    if (marcadores.length === 0) {
        Swal.fire('Advertencia', 'No hay marcadores para imprimir', 'warning');
        return;
    }
    
    window.print();
}

function verResumen() {
    try {
        const marcas = JSON.parse(localStorage.getItem('marcasCombinadas') || '[]');
        
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
            </div>
        `;

        Swal.fire({
            title: '📊 Resumen Estadístico',
            html: html,
            width: '500px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd'
        });
    } catch (error) {
        console.error('Error mostrando resumen:', error);
        Swal.fire('Error', 'No se pudo generar el resumen estadístico', 'error');
    }
}
