// ========================================
// Funcionalidad del Menú de Navegación
// ========================================

/**
 * Resaltar menú activo según la página actual
 */
function highlightActiveMenu() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    // Mapeo de páginas a menús
    const menuMapping = {
        'index.html': ['index.html'],
        'primer-etapa.html': ['primer-etapa.html'],
        'segunda-etapa.html': ['segunda-etapa.html'],
        'inf-aplicados.html': ['inf-aplicados.html']
    };

    // Remover clase active de todos los menús
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Agregar clase active al menú correspondiente
    for (const [menu, pages] of Object.entries(menuMapping)) {
        if (pages.includes(currentPage) || (currentPage === '' && menu === 'index.html')) {
            const dropdownLink = document.querySelector(`a[href="${menu}"]`);
            if (dropdownLink) {
                dropdownLink.classList.add('active');
            }
        }
    }
}

/**
 * Inicializar todas las funciones del menú
 */
function initMenu() {
    highlightActiveMenu();
    
    console.log('✔ Menú inicializado correctamente');
}

// Iniciar menú cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initMenu);
