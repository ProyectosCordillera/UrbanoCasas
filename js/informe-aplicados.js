// ============================================
// CONFIGURACIÓN
// ============================================
const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Informe Aplicados cargado');
    
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Cargar datos
    cargarDatos();
    
    // Configurar imagen
    const imgPlano = document.getElementById('imgPlano');
    if (imgPlano) {
        imgPlano.addEventListener('load', function() {
            console.log('✅ Plano cargado:', this.naturalWidth, 'x', this.naturalHeight);
            ajustarContenedorMarcadores();
            colocarMarcadores();
        });
        
        if (imgPlano.complete) {
            ajustarContenedorMarcadores();
            colocarMarcadores();
        }
    }
    
    // Botón actualizar
    const btnActualizar = document.getElementById('btnActualizar');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', function() {
            location.reload();
        });
    }
    
    window.addEventListener('resize', function() {
        ajustarContenedorMarcadores();
        colocarMarcadores();
    });
});

// ============================================
// CARGAR DATOS (SIMPLIFICADO)
// ============================================
async function cargarDatos() {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;
    
    console.log('📥 Cargando datos...');
    
    try {
        // Intentar cargar de la API si existe
        if (typeof window.Database !== 'undefined' && window.Database.getCasas) {
            const casas = await window.Database.getCasas();
            console.log(`✅ API: ${casas.length} casas`);
            mostrarDatosEnTabla(casas);
        } else {
            // DATOS DE PRUEBA si no hay API
            console.log('⚠️ Usando datos de prueba (API no disponible)');
            const casasPrueba = [
                { numero_casa: "1", nombre_cliente: "Cliente 1" },
                { numero_casa: "2", nombre_cliente: "Cliente 2" },
                { numero_casa: "13", nombre_cliente: "Cliente 13" },
                { numero_casa: "17", nombre_cliente: "Cliente 17" },
                { numero_casa: "23", nombre_cliente: "Cliente 23" },
                { numero_casa: "34", nombre_cliente: "Cliente 34" },
                { numero_casa: "47", nombre_cliente: "Cliente 47" },
                { numero_casa: "65", nombre_cliente: "Cliente 65" }
            ];
            mostrarDatosEnTabla(casasPrueba);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error cargando datos</td></tr>';
    }
}

// ============================================
// MOSTRAR DATOS EN TABLA
// ============================================
function mostrarDatosEnTabla(casas) {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Ordenar
    casas.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));
    
    let countPrimera = 0;
    let countSegunda = 0;
    
    casas.forEach(casa => {
        const numeroCasa = parseInt(casa.numero_casa);
        const fila = document.createElement('tr');
        
        // Determinar etapa
        let etapa = 'Desconocida';
        let badgeClass = 'bg-secondary';
        let rowClass = '';
        
        if (numeroCasa >= 33 && numeroCasa <= 65) {
            etapa = 'Primera Etapa';
            badgeClass = 'bg-primary';
            rowClass = 'table-info';
            countPrimera++;
        } else if (numeroCasa >= 1 && numeroCasa <= 32) {
            etapa = 'Segunda Etapa';
            badgeClass = 'bg-success';
            rowClass = 'table-success';
            countSegunda++;
        }
        
        fila.className = rowClass;
        
        const cliente = casa.nombre_cliente || 'Sin cliente';
        
        fila.innerHTML = `
            <td><strong>${numeroCasa}</strong><br><small class="badge ${badgeClass}">${etapa}</small></td>
            <td class="text-center text-muted">-</td>
            <td class="text-center text-muted">-</td>
            <td>${cliente}</td>
            <td class="text-center"><small class="text-muted">En línea</small></td>
        `;
        
        tbody.appendChild(fila);
    });
    
    console.log(` Total: ${casas.length} casas (${countPrimera} primera, ${countSegunda} segunda)`);
}

// ============================================
// COLOCAR MARCADORES
// ============================================
function colocarMarcadores() {
    const tbody = document.querySelector('#tblCasas tbody');
    const container = document.getElementById('marcadoresContainer');
    const imgPlano = document.getElementById('imgPlano');
    
    if (!tbody || !container || !imgPlano) return;
    if (!imgPlano.complete) return;
    
    // Verificar que existe MAPEO_CASAS
    if (typeof MAPEO_CASAS === 'undefined') {
        console.warn('⚠️ MAPEO_CASAS no definido - crea el archivo mapeo-casas.js');
        return;
    }
    
    container.innerHTML = '';
    
    const filas = tbody.querySelectorAll('tr');
    const ancho = imgPlano.clientWidth;
    const alto = imgPlano.clientHeight;
    
    let colocados = 0;
    let sinMapeo = [];
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 4) return;
        
        const numeroMatch = celdas[0].innerHTML.match(/<strong>(\d+)<\/strong>/);
        const numeroCasa = numeroMatch ? numeroMatch[1] : null;
        
        if (!numeroCasa) return;
        
        // Buscar en el mapeo
        const posicion = MAPEO_CASAS[numeroCasa];
        
        if (!posicion) {
            sinMapeo.push(numeroCasa);
            return;
        }
        
        // Calcular posición
        const posX = (posicion.x / 100) * ancho;
        const posY = (posicion.y / 100) * alto;
        
        const cliente = celdas[3].textContent.trim();
        
        // Crear marcador
        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        marcador.textContent = numeroCasa;
        marcador.style.left = posX + 'px';
        marcador.style.top = posY + 'px';
        
        // Color por etapa
        const num = parseInt(numeroCasa);
        if (num >= 33 && num <= 65) {
            marcador.classList.add('etapa-primera');
        } else if (num >= 1 && num <= 32) {
            marcador.classList.add('etapa-segunda');
        } else {
            marcador.classList.add('etapa-otro');
        }
        
        marcador.title = `Casa ${numeroCasa}\nCliente: ${cliente}`;
        marcador.style.cursor = 'pointer';
        
        // Click
        marcador.addEventListener('click', function() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: `Casa #${numeroCasa}`,
                    text: `Cliente: ${cliente}`,
                    icon: 'info'
                });
            } else {
                alert(`Casa ${numeroCasa}\nCliente: ${cliente}`);
            }
        });
        
        container.appendChild(marcador);
        colocados++;
    });
    
    console.log(`📍 ${colocados} marcadores colocados`);
    if (sinMapeo.length > 0) {
        console.warn(`⚠️ Casas sin mapeo: ${sinMapeo.join(', ')}`);
    }
}

function ajustarContenedorMarcadores() {
    const img = document.getElementById('imgPlano');
    const container = document.getElementById('marcadoresContainer');
    if (img && container) {
        container.style.width = img.clientWidth + 'px';
        container.style.height = img.clientHeight + 'px';
    }
}

// ============================================
// IMPRIMIR
// ============================================
function imprimirPlano() {
    window.print();
}

// ============================================
// RESUMEN
// ============================================
function verResumen() {
    const tbody = document.querySelector('#tblCasas tbody');
    if (!tbody) return;
    
    const filas = tbody.querySelectorAll('tr');
    let total = filas.length;
    let primera = 0;
    let segunda = 0;
    
    filas.forEach(fila => {
        const texto = fila.innerHTML;
        if (texto.includes('Primera Etapa')) primera++;
        if (texto.includes('Segunda Etapa')) segunda++;
    });
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '📊 Resumen',
            html: `
                <div class="text-start">
                    <p><strong>Total casas:</strong> ${total}</p>
                    <p><strong>Primera Etapa:</strong> ${primera}</p>
                    <p><strong>Segunda Etapa:</strong> ${segunda}</p>
                </div>
            `,
            confirmButtonText: 'Cerrar'
        });
    } else {
        alert(`Total: ${total}\nPrimera: ${primera}\nSegunda: ${segunda}`);
    }
}
