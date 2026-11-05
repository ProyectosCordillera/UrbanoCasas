// ============================================
// CONFIGURACIÓN
// ============================================
const PLANO_ANCHO_REAL = 2298;
const PLANO_ALTO_REAL = 1452;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Informe Aplicados cargado');
    
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    cargarDatos();
    
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
        
        // MODO CAPTURA: Click en el número del plano para asociar
        imgPlano.style.cursor = 'crosshair';
        imgPlano.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Pedir al usuario que ingrese el número de casa
            const numeroCasa = prompt('¿Qué número de casa está en esta posición?\n\nIngresa el número exacto:');
            
            if (numeroCasa && !isNaN(numeroCasa)) {
                const coord = { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
                
                // Mostrar confirmación
                console.log(`%c✅ CASA ${numeroCasa} CAPTURADA:`, 'color: #0f0; font-weight: bold');
                console.log(`"${numeroCasa}": { x: ${coord.x}, y: ${coord.y} },`);
                
                // Copiar al portapapeles
                const texto = `"${numeroCasa}": { x: ${coord.x}, y: ${coord.y} },`;
                navigator.clipboard.writeText(texto).then(() => {
                    console.log('%c✅ Copiado al portapapeles - Pégalo en mapeo-casas.js', 'color: #0f0');
                });
                
                // Mostrar punto verde
                const marker = document.createElement('div');
                marker.style.cssText = `
                    position: absolute;
                    left: ${e.clientX - rect.left}px;
                    top: ${e.clientY - rect.top}px;
                    width: 25px;
                    height: 25px;
                    background: #0f0;
                    border: 3px solid white;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 9999;
                    box-shadow: 0 0 15px rgba(0,255,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: black;
                    font-weight: bold;
                    font-size: 12px;
                `;
                marker.textContent = numeroCasa;
                this.parentElement.appendChild(marker);
                
                // Actualizar MAPEO_CASAS en tiempo real si existe
                if (typeof MAPEO_CASAS !== 'undefined') {
                    MAPEO_CASAS[numeroCasa.trim()] = coord;
                    colocarMarcadores(); // Recolocar marcadores
                }
            }
        });
    }
    
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
// CARGAR DATOS
// ============================================
async function cargarDatos() {
    const tbody = document.getElementById('tbodyDatos');
    if (!tbody) return;
    
    console.log('📥 Cargando datos...');
    
    try {
        if (typeof window.Database !== 'undefined' && window.Database.getCasas) {
            const casas = await window.Database.getCasas();
            console.log("✅ Datos recibidos:", casas.length, "casas");
            mostrarDatosEnTabla(casas);
        } else {
            console.log('⚠️ Usando datos de prueba');
            const casasPrueba = [];
            for (let i = 1; i <= 99; i++) {
                casasPrueba.push({
                    numero_casa: i.toString(),
                    nombre_cliente: `Cliente ${i}`
                });
            }
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
    casas.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));
    
    let countPrimera = 0;
    let countSegunda = 0;
    let countOtras = 0;
    
    casas.forEach(casa => {
        const numeroCasa = parseInt(casa.numero_casa);
        const fila = document.createElement('tr');
        
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
        } else if (numeroCasa >= 66) {
            etapa = 'Etapa 3/4';
            badgeClass = 'bg-warning text-dark';
            rowClass = 'table-warning';
            countOtras++;
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
    
    console.log(`📊 Total: ${casas.length} casas (${countPrimera} 1ra, ${countSegunda} 2da, ${countOtras} otras)`);
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
    
    if (typeof MAPEO_CASAS === 'undefined') {
        console.warn('⚠️ MAPEO_CASAS no definido');
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
        const numeroCasa = numeroMatch ? numeroMatch[1].trim() : null;
        
        if (!numeroCasa) return;
        
        // Buscar en el mapeo (con y sin espacio)
        const posicion = MAPEO_CASAS[numeroCasa] || MAPEO_CASAS[numeroCasa + ' '];
        
        if (!posicion) {
            sinMapeo.push(numeroCasa);
            return;
        }
        
        const posX = (posicion.x / 100) * ancho;
        const posY = (posicion.y / 100) * alto;
        const cliente = celdas[3].textContent.trim();
        
        const marcador = document.createElement('div');
        marcador.className = 'marcador';
        marcador.textContent = numeroCasa;
        marcador.style.left = posX + 'px';
        marcador.style.top = posY + 'px';
        
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
        
        marcador.addEventListener('click', function(e) {
            e.stopPropagation();
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
        console.warn(`️ Casas sin mapeo (${sinMapeo.length}): ${sinMapeo.slice(0, 10).join(', ')}...`);
        console.log('💡 Haz clic en el plano sobre estos números para capturarlos');
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

function imprimirPlano() {
    window.print();
}

function verResumen() {
    const tbody = document.querySelector('#tblCasas tbody');
    if (!tbody) return;
    
    const filas = tbody.querySelectorAll('tr');
    let total = filas.length;
    let primera = 0;
    let segunda = 0;
    let otras = 0;
    
    filas.forEach(fila => {
        const texto = fila.innerHTML;
        if (texto.includes('Primera Etapa')) primera++;
        else if (texto.includes('Segunda Etapa')) segunda++;
        else otras++;
    });
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: ' Resumen de Ocupación',
            html: `
                <div class="text-start">
                    <p><strong>Total casas registradas:</strong> ${total}</p>
                    <hr>
                    <p><span class="badge bg-primary">Primera Etapa:</span> ${primera}</p>
                    <p><span class="badge bg-success">Segunda Etapa:</span> ${segunda}</p>
                    <p><span class="badge bg-warning text-dark">Etapas 3 y 4:</span> ${otras}</p>
                </div>
            `,
            confirmButtonText: 'Cerrar'
        });
    } else {
        alert(`Total: ${total}\nPrimera: ${primera}\nSegunda: ${segunda}\nOtras: ${otras}`);
    }
}
