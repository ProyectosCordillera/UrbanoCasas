// js/RelojDigital.js
document.addEventListener('DOMContentLoaded', function () {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
});

function actualizarReloj() {
    const clockElement = document.getElementById('digitalClock');
    
    // ✅ Verificar que el elemento existe antes de modificarlo
    if (!clockElement) {
        console.warn('⚠️ Elemento #digitalClock no encontrado');
        return;
    }
    
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    
    clockElement.textContent = `${horas}:${minutos}:${segundos}`;
}

// Actualizar año en el footer
document.addEventListener('DOMContentLoaded', function () {
    const yearElement = document.getElementById('currentYear');
    
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
