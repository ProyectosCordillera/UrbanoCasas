// ============================================
// FUNCIÓN PARA VER RESUMEN ESTADÍSTICO
// ============================================

function verResumen() {
    try {
        const marcasPrimera = JSON.parse(localStorage.getItem('marcasPrimerEtapa') || '[]');
        const marcasSegunda = JSON.parse(localStorage.getItem('marcasSegundaEtapa') || '[]');
        const total = marcasPrimera.length + marcasSegunda.length;

        // Calcular estadísticas
        const primerasCasas = marcasPrimera.map(m => m.numeroCasa).sort((a, b) => a - b);
        const ultimasCasas = marcasSegunda.map(m => m.numeroCasa).sort((a, b) => a - b);

        let html = `
            <div class="text-start">
                <h5><i class="bi bi-bar-chart me-2"></i>Estadísticas del Sistema</h5>
                <hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-house-door me-2"></i>Primera Etapa</h6>
                                <h2 class="card-text mb-0">${marcasPrimera.length}</h2>
                                <small>Casas registradas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card bg-success text-white">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1"><i class="bi bi-building me-2"></i>Segunda Etapa</h6>
                                <h2 class="card-text mb-0">${marcasSegunda.length}</h2>
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

                ${marcasPrimera.length > 0 ? `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary"><i class="bi bi-list-ul me-2"></i>Casas Primera Etapa</h6>
                        <p class="mb-1"><strong>Rango:</strong> ${Math.min(...primerasCasas)} - ${Math.max(...primerasCasas)}</p>
                        <p class="mb-0"><strong>Números:</strong> ${primerasCasas.join(', ')}</p>
                    </div>
                </div>
                ` : ''}

                ${marcasSegunda.length > 0 ? `
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
