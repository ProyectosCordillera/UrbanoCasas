// Actualizar año automáticamente
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Inicializar tooltips si los necesitas
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

// Función para cargar contenido dinámico (opcional)
function loadContent(page) {
    // Esta función se puede usar si quieres cargar contenido sin recargar la página
    fetch(page)
        .then(response => response.text())
        .then(data => {
            document.querySelector('.main-content').innerHTML = data;
            // Actualizar título de la página
            const titleMatch = data.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
                document.title = titleMatch[1];
            }
        })
        .catch(error => console.error('Error cargando contenido:', error));
}

// Evento para links del menú (opcional - carga dinámica)
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.dropdown-item');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Puedes usar loadContent(href) para carga dinámica
            // O simplemente window.location.href = href para navegación normal
            window.location.href = href;
        });
    });
});
