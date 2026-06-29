// Coordenadas de los lotes de la Tercera Etapa
// Basado en el plano: Lotes 66-97 (derecha) y 81-97 (izquierda)
const coordenadasTerceraEtapa = {
    // Lado Derecho (Calle 03 - Este)
    '66': { x: 72.5, y: 8.5 },
    '67': { x: 72.5, y: 13.5 },
    '68': { x: 72.5, y: 18.5 },
    '69': { x: 72.5, y: 23.5 },
    '70': { x: 72.5, y: 28.5 },
    '71': { x: 72.5, y: 33.5 },
    '72': { x: 72.5, y: 38.5 },
    '73': { x: 72.5, y: 43.5 },
    '74': { x: 72.5, y: 48.5 },
    '75': { x: 72.5, y: 53.5 },
    '76': { x: 72.5, y: 58.5 },
    '77': { x: 72.5, y: 63.5 },
    '78': { x: 72.5, y: 68.5 },
    '79': { x: 72.5, y: 73.5 },
    '80': { x: 72.5, y: 78.5 },
    '81': { x: 72.5, y: 83.5 },
    
    // Lado Izquierdo (Calle 03 - Oeste)
    '97': { x: 27.5, y: 8.5 },
    '96': { x: 27.5, y: 13.5 },
    '95': { x: 27.5, y: 18.5 },
    '94': { x: 27.5, y: 23.5 },
    '93': { x: 27.5, y: 28.5 },
    '92': { x: 27.5, y: 33.5 },
    '91': { x: 27.5, y: 38.5 },
    '90': { x: 27.5, y: 43.5 },
    '89': { x: 27.5, y: 48.5 },
    '88': { x: 27.5, y: 53.5 },
    '87': { x: 27.5, y: 58.5 },
    '86': { x: 27.5, y: 63.5 },
    '84': { x: 27.5, y: 68.5 },
    '83': { x: 27.5, y: 73.5 },
    '82': { x: 27.5, y: 78.5 },
    '81': { x: 27.5, y: 83.5 }
};

let marcaSeleccionada = null;
let modoEdicion = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarMarcasExistentes();
    actualizarAnioFooter();
});

// Cargar marcas desde la API
async function cargarMarcasExistentes() {
    try {
        const response = await fetch('http://localhost:3000/marcas');
        const marcas = await response.json();
        
        const ddlMarcas = document.getElementById('ddlMarcas');
        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';
        
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.id;
            option.textContent = `Casa ${marca.numeroCasa} - ${marca.cliente}`;
            option.dataset.numeroCasa = marca.numeroCasa;
            ddlMarcas.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando marcas:', error);
    }
}

// Cargar marca seleccionada
async function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    const marcaId = ddlMarcas.value;
    
    if (marcaId === '0') {
        limpiarFormulario();
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/marcas/${marcaId}`);
        const marca = await response.json();
        
        document.getElementById('txtCliente').value = marca.cliente;
        document.getElementById('txtNumeroCasa').value = marca.numeroCasa;
        
        // Marcar en el plano
        marcarLoteEnPlano(marca.numeroCasa, marca.cliente, marcaId);
        marcaSeleccionada = marca;
    } catch (error) {
        console.error('Error cargando marca:', error);
        Swal.fire('Error', 'No se pudo cargar la marca seleccionada', 'error');
    }
}

// Habilitar número de casa (modo nuevo)
function habilitarNumeroCasa() {
    modoEdicion = false;
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    txtNumeroCasa.disabled = false;
    txtNumeroCasa.value = '';
    txtNumeroCasa.focus();
    
    Swal.fire({
        title: 'Nuevo Lote',
        input: 'text',
        inputLabel: 'Ingrese el número de lote',
        inputPlaceholder: 'Ej: 66, 67, 97, etc.',
        showCancelButton: true,
        confirmButtonText: 'Seleccionar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un número de lote';
            }
            if (!coordenadasTerceraEtapa[value]) {
                return 'Este lote no existe en la tercera etapa';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const numeroLote = result.value;
            document.getElementById('txtNumeroCasa').value = numeroLote;
            document.getElementById('txtCliente').focus();
        }
    });
}

// Marcar en el plano
async function marcarEnPlano() {
    const numeroCasa = document.getElementById('txtNumeroCasa').value.trim();
    const cliente = document.getElementById('txtCliente').value.trim();
    
    if (!numeroCasa || !cliente) {
        Swal.fire('Atención', 'Debe ingresar número de casa y cliente', 'warning');
        return;
    }
    
    if (!coordenadasTerceraEtapa[numeroCasa]) {
        Swal.fire('Error', `El lote ${numeroCasa} no existe en la tercera etapa`, 'error');
        return;
    }
    
    try {
        const marcaData = {
            numeroCasa: numeroCasa,
            cliente: cliente,
            etapa: '3',
            coordenadas: coordenadasTerceraEtapa[numeroCasa]
        };
        
        let response;
        if (marcaSeleccionada && marcaSeleccionada.id) {
            // Actualizar marca existente
            response = await fetch(`http://localhost:3000/marcas/${marcaSeleccionada.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marcaData)
            });
        } else {
            // Crear nueva marca
            response = await fetch('http://localhost:3000/marcas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marcaData)
            });
        }
        
        if (response.ok) {
            Swal.fire('Éxito', 'Marca guardada correctamente', 'success');
            await cargarMarcasExistentes();
            limpiarFormulario();
            marcarLoteEnPlano(numeroCasa, cliente);
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        console.error('Error guardando marca:', error);
        Swal.fire('Error', 'No se pudo guardar la marca', 'error');
    }
}

// Marcar lote visualmente en el plano
function marcarLoteEnPlano(numeroCasa, cliente, marcaId = null) {
    const container = document.getElementById('marcadoresContainer');
    container.innerHTML = '';
    
    const coordenadas = coordenadasTerceraEtapa[numeroCasa];
    if (!coordenadas) return;
    
    const marcador = document.createElement('div');
    marcador.className = 'marcador-lote';
    marcador.style.left = `${coordenadas.x}%`;
    marcador.style.top = `${coordenadas.y}%`;
    marcador.innerHTML = `
        <div class="marker-pin bg-danger">
            <i class="bi bi-house-fill"></i>
        </div>
        <div class="marker-label">
            <strong>Lote ${numeroCasa}</strong><br>
            <span>${cliente}</span>
        </div>
    `;
    
    if (marcaId) {
        marcador.dataset.marcaId = marcaId;
    }
    
    container.appendChild(marcador);
}

// Eliminar marca
async function eliminarMarca() {
    if (!marcaSeleccionada || !marcaSeleccionada.id) {
        Swal.fire('Atención', 'No hay ninguna marca seleccionada para eliminar', 'warning');
        return;
    }
    
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: `Eliminar la marca del lote ${marcaSeleccionada.numeroCasa}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:3000/marcas/${marcaSeleccionada.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                Swal.fire('Eliminado', 'La marca ha sido eliminada', 'success');
                await cargarMarcasExistentes();
                limpiarFormulario();
                document.getElementById('marcadoresContainer').innerHTML = '';
            } else {
                throw new Error('Error al eliminar');
            }
        } catch (error) {
            console.error('Error eliminando marca:', error);
            Swal.fire('Error', 'No se pudo eliminar la marca', 'error');
        }
    }
}

// Imprimir plano
function imprimirPlano() {
    window.print();
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('txtCliente').value = '';
    document.getElementById('txtNumeroCasa').value = '';
    document.getElementById('txtNumeroCasa').disabled = true;
    document.getElementById('ddlMarcas').value = '0';
    marcaSeleccionada = null;
    modoEdicion = false;
}

// Actualizar año en footer
function actualizarAnioFooter() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}
