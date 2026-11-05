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
            console.log("✅ Datos recibidos de la Base de Datos:", casas);
            mostrarDatosEnTabla(casas);
        } else {
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
    casas.sort((a, b) => parseInt(a.numero_casa) - parseInt(b.numero_casa));
    
    let countPrimera = 0;
    let countSegunda = 0;
    
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
    
    console.log(`📊 Total: ${casas.length} casas`);
}

// ============================================
// HERRAMIENTA TEMPORAL: OBTENER COORDENADAS EXACTAS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const imgPlano = document.getElementById('imgPlano');
    if (imgPlano) {
        imgPlano.style.cursor = 'crosshair';
        
        imgPlano.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const coordText = `{ x: ${x.toFixed(1)}, y: ${y.toFixed(1)} }`;
            console.log(`📍 Casa #___: ${coordText}`);
            console.log(`%c Copia esto: "${numero}": ${coordText},`, 'background: #222; color: #0f0; font-size: 12px');
            
            // Mostrar punto rojo
            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                left: ${e.clientX - rect.left}px;
                top: ${e.clientY - rect.top}px;
                width: 15px;
                height: 15px;
                background: red;
                border: 2px solid white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 9999;
            `;
            this.parentElement.appendChild(marker);
            
            navigator.clipboard.writeText(coordText).then(() => {
                console.log('✅ Coordenada copiada al portapapeles');
            });
        });
    }
});

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
        // .trim() asegura que no haya espacios accidentales
        const numeroCasa = numeroMatch ? numeroMatch[1].trim() : null;
        
        if (!numeroCasa) return;
        
       const posicion = MAPEO_CASAS[numeroCasa.trim()];
        
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
            e.stopPropagation(); // Evita conflictos con otros clics en la página
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: `Casa #${numeroCasa}`,
                    text: `Cliente: ${cliente}`,
                    icon: 'info',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                alert(`Casa ${numeroCasa}\nCliente: ${cliente}`);
            }
        });
        
        container.appendChild(marcador);
        colocados++;
    });
    
    console.log(`📍 ${colocados} marcadores colocados exitosamente`);
    if (sinMapeo.length > 0) {
        console.warn(`⚠️ Casas sin mapeo en MAPEO_CASAS: ${sinMapeo.join(', ')}`);
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
            title: '📊 Resumen de Ocupación',
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

// ============================================
// HERRAMIENTA: CAPTURAR COORDENADAS AL HACER CLIC
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const imgPlano = document.getElementById('imgPlano');
    if (imgPlano) {
        // Cambiar cursor para indicar que se puede hacer clic
        imgPlano.style.cursor = 'crosshair';
        
        imgPlano.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const coordText = `{ x: ${x.toFixed(1)}, y: ${y.toFixed(1)} }`;
            
            // Mostrar en consola
            console.log('%c📍 CLIC DETECTADO:', 'color: #0f0; font-size: 14px; font-weight: bold');
            console.log(`Coordenada: ${coordText}`);
            console.log(`%cPara copiar: "${numeroCasa}": ${coordText},`, 'background: #222; color: #ff0; font-size: 12px; padding: 2px');
            
            // Mostrar punto rojo visual
            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                left: ${e.clientX - rect.left}px;
                top: ${e.clientY - rect.top}px;
                width: 20px;
                height: 20px;
                background: red;
                border: 3px solid white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            `;
            this.parentElement.appendChild(marker);
            
            // Copiar al portapapeles
            navigator.clipboard.writeText(coordText).then(() => {
                console.log('%c✅ COPIADO AL PORTAPAPELES', 'color: #0f0; font-weight: bold');
            }).catch(err => {
                console.log('⚠️ No se pudo copiar automáticamente');
            });
            
            // Remover marcador después de 3 segundos
            setTimeout(() => marker.remove(), 3000);
        });
    }
});
