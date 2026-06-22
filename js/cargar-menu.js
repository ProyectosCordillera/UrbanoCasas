// js/cargar-menu.js
document.addEventListener('DOMContentLoaded', function () {
    // Detectar la ruta base automáticamente
    const basePath = window.location.pathname.includes('/UrbanoCasas/') 
        ? '/UrbanoCasas' 
        : '';
    
    // Cargar el menú desde includes/menu.html
    fetch(basePath + '/includes/menu.html')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar el menú');
            return response.text();
        })
        .then(html => {
            // Insertar el menú al inicio del body
            document.body.insertAdjacentHTML('afterbegin', html);
            
            // Marcar la página actual como activa
            marcarPaginaActiva();
            
            // Agregar los <br><br> necesarios para el fixed-top
            const nav = document.querySelector('.navbar.fixed-top');
            if (nav) {
                const br = document.createElement('div');
                br.style.height = '70px'; // Altura aproximada del navbar
                nav.after(br);
            }
        })
        .catch(error => {
            console.error('❌ Error cargando el menú:', error);
        });
});

// Función para marcar el item activo según la página actual
function marcarPaginaActiva() {
    const paginaActual = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.dropdown-item');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(paginaActual)) {
            link.classList.add('active');
        }
    });
}
