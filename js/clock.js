// ========================================
// Reloj Analógico y Digital
// ========================================

/**
 * Actualiza la posición de las agujas del reloj
 */
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calcular ángulos para las agujas
    const hourAngle = (hours * 30) + (minutes * 0.5);  // 30° por hora + 0.5° por minuto
    const minuteAngle = minutes * 6;                    // 6° por minuto
    const secondAngle = seconds * 6;                    // 6° por segundo

    // Aplicar rotación a las agujas
    const hourHand = document.querySelector('.hour-hand');
    const minuteHand = document.querySelector('.minute-hand');
    const secondHand = document.querySelector('.second-hand');
    const digitalClock = document.getElementById('digitalClock');

    if (hourHand) {
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
    }
    
    if (minuteHand) {
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }
    
    if (secondHand) {
        secondHand.style.transform = `rotate(${secondAngle}deg)`;
    }

    // Actualizar reloj digital
    if (digitalClock) {
        digitalClock.textContent = now.toLocaleTimeString('es-ES');
    }
}

/**
 * Inicializa el reloj
 */
function initClock() {
    // Actualizar inmediatamente
    updateClock();
    
    // Actualizar cada segundo
    setInterval(updateClock, 1000);
    
    console.log('✔ Reloj iniciado correctamente');
}

// Iniciar el reloj cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.analog-clock') || document.getElementById('digitalClock')) {
        initClock();
    }
});
