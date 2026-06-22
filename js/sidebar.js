document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');

    // Abrir/cerrar sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    // Cerrar sidebar al hacer clic en un enlace (en móviles)
    document.querySelectorAll('.sidebar-link, .dropdown-item').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                // Solo cerrar si NO es un dropdown-toggle (para no cerrar al abrir submenú)
                if (!link.classList.contains('dropdown-toggle')) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            }
        });
    });

    // Cerrar sidebar al redimensionar a desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});
