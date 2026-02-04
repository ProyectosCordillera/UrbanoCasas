// ========================================
// Scripts Generales de la Aplicación
// ========================================

/**
 * Establecer año actual en el footer
 */
function setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Mostrar mensaje de alerta
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'danger', 'warning', 'info'
 */
function showAlert(message, type = 'info') {
    // Eliminar alerta anterior si existe
    const existingAlert = document.getElementById('customAlert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Crear nueva alerta
    const alertDiv = document.createElement('div');
    alertDiv.id = 'customAlert';
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top`;
    alertDiv.style.marginTop = '70px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.insertBefore(alertDiv, document.body.firstChild);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Inicializar funciones generales
 */
function initApp() {
    setCurrentYear();
    console.log('✔ Aplicación iniciada');
    console.log('📝 Versión: 1.0.0');
}

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);
