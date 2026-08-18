// ============================================
// FUNCIONES DE MARCADORES (VERSIÓN CORREGIDA)
// ============================================

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (!marcadoresContainer || !imgPlano) return;

    // Limpiar marcadores anteriores
    marcadoresContainer.innerHTML = '';

    // Esperar a que la imagen esté completamente cargada para leer sus dimensiones reales
    if (!imgPlano.complete || imgPlano.naturalWidth === 0) {
        imgPlano.onload = () => agregarMarcador(numeroCasa, originalX, originalY);
        return;
    }

    // ✅ CLAVE: Usar las dimensiones REALES de la imagen en el navegador
    // Esto corrige automáticamente el desfase si la imagen fue comprimida o redimensionada
    const anchoReal = imgPlano.naturalWidth;
    const altoReal = imgPlano.naturalHeight;

    // Calcular porcentajes basados en el tamaño real, no en constantes fijas
    const xPercent = (originalX / anchoReal) * 100;
    const yPercent = (originalY / altoReal) * 100;

    // Crear el marcador
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = xPercent + '%';
    marcador.style.top = yPercent + '%';
    marcador.textContent = numeroCasa;
    
    // Tooltip útil para depuración (pasa el mouse sobre el marcador para ver las coordenadas)
    marcador.title = `Casa ${numeroCasa} | Orig: ${originalX},${originalY} | %: ${xPercent.toFixed(1)}%,${yPercent.toFixed(1)}%`;

    marcadoresContainer.appendChild(marcador);

    console.log(`✅ Marcador ${numeroCasa} colocado en: ${xPercent.toFixed(2)}%, ${yPercent.toFixed(2)}%`);
    console.log(`📏 Dimensiones reales de la imagen usadas: ${anchoReal} x ${altoReal}`);
}
