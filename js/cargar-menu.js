// js/cargar-menu.js
document.addEventListener('DOMContentLoaded', function () {
    cargarMenu();
});

async function cargarMenu() {
    try {
        // Detectar la ruta base automáticamente
        const path = window.location.pathname;
        let basePath = '';
        
        if (path.includes('/UrbanoCasas/')) {
            basePath = '/UrbanoCasas';
        } else if (path.includes('/paginas/')) {
            basePath = '/UrbanoCasas';
        }
        
        console.log('📍 Base path detectado:', basePath);
        
        // Cargar el menú
        const response = await fetch(basePath + '/includes/menu.html');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Insertar el menú al inicio del body
        document.body.insertAdjacentHTML('afterbegin', html);
        
        // Agregar espacio para el fixed-top
        agregarEspacioNavbar();
        
        // Marcar página activa (después de que el menú esté en el DOM)
        setTimeout(() => {
            marcarPaginaActiva();
        }, 100);
        
        console.log('✅ Menú cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando el menú:', error);
        
        // Mostrar menú alternativo si falla la carga
        mostrarMenuAlternativo();
    }
}

function agregarEspacioNavbar() {
    const nav = document.querySelector('.navbar.fixed-top');
    if (nav) {
        // Verificar si ya existe el espacio
        let spacer = document.getElementById('navbar-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.id = 'navbar-spacer';
            spacer.style.height = '70px';
            nav.after(spacer);
        }
    }
}

function marcarPaginaActiva() {
    const paginaActual = window.location.pathname.split('/').pop();
    console.log('📄 Página actual:', paginaActual);
    
    const links = document.querySelectorAll('.dropdown-item');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(paginaActual)) {
            link.classList.add('active');
            console.log('✅ Marcado como activo:', href);
        }
    });
}

function mostrarMenuAlternativo() {
    // Menú básico por si falla la carga del menú principal
    const menuAlternativo = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
            <div class="container-fluid">
                <a class="navbar-brand" href="/UrbanoCasas/index.html">Sistema Urbano</a>
            </div>
        </nav>
        <div style="height: 70px;"></div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', menuAlternativo);
}
