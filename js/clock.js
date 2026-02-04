// ========================================
// Reloj Digital
// ========================================

/**
 * Formatear número con dos dígitos
 * @param {number} num - Número a formatear
 * @returns {string} Número con dos dígitos
 */
function padNumber(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Actualizar reloj digital
 */
function updateDigitalClock() {
    const now = new Date();
    
    // Obtener hora, minutos y segundos
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Formatear hora (HH:MM:SS)
    const timeString = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
    
    // Obtener fecha
    const day = now.getDate();
    const month = now.getMonth() + 1; // Meses son 0-11
    const year = now.getFullYear();
    
    // Formatear fecha (DD/MM/YYYY)
    const dateString = `${padNumber(day)}/${padNumber(month)}/${year}`;
    
    // Actualizar elementos del DOM
    const timeElement = document.getElementById('digitalTime');
    const dateElement = document.getElementById('digitalDate');
    
    if (timeElement) {
        timeElement.textContent = timeString;
    }
    
    if (dateElement) {
        dateElement.textContent = dateString;
    }
    
    // Cambiar tema según hora del día
    updateClockTheme(hours);
}

/**
 * Actualizar tema del reloj según hora
 * @param {number} hour - Hora actual (0-23)
 */
function updateClockTheme(hour) {
    const clockDigital = document.querySelector('.clock-digital');
    
    if (!clockDigital) return;
    
    // Remover clases de tema anteriores
    clockDigital.classList.remove('neon', 'dark', 'green', 'red', 'blue');
    
    // Aplicar tema según hora
    if (hour >= 6 && hour < 12) {
        // Mañana: verde fresco
        clockDigital.classList.add('green');
    } else if (hour >= 12 && hour < 18) {
        // Tarde: azul brillante
        clockDigital.classList.add('blue');
        clockDigital.classList.add('neon');
    } else if (hour >= 18 && hour < 22) {
        // Noche: púrpura
        clockDigital.classList.add('neon');
    } else {
        // Madrugada: azul oscuro
        clockDigital.classList.add('dark');
    }
}

/**
 * Inicializar reloj digital
 */
function initDigitalClock() {
    // Actualizar inmediatamente
    updateDigitalClock();
    
    // Actualizar cada segundo
    setInterval(updateDigitalClock, 1000);
    
    console.log('✔ Reloj digital iniciado correctamente');
}

// Iniciar el reloj cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('digitalTime') || document.getElementById('digitalDate')) {
        initDigitalClock();
    }
});
