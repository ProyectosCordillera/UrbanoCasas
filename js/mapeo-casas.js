// ============================================
// PUNTOS DE REFERENCIA (TÚ LOS DEFINES)
// Solo necesitas 2 puntos por columna
// ============================================

const PUNTOS_ANCLAJE = {
    // ETAPA 2 - Columna derecha (casas 1-16)
    "col_etapa2_der": {
        inicio: { casa: 1,  x: 91.5, y: 88.0 },  // Casa 1 (abajo)
        fin:      { casa: 16, x: 91.5, y: 32.0 }   // Casa 16 (arriba)
    },
    
    // ETAPA 2 - Columna izquierda (casas 17-32)
    "col_etapa2_izq": {
        inicio: { casa: 17, x: 83.0, y: 32.0 },   // Casa 17 (arriba)
        fin:      { casa: 32, x: 83.0, y: 81.0 }   // Casa 32 (abajo)
    },
    
    // ETAPA 1 - Columna derecha (casas 33-47)
    "col_etapa1_der": {
        inicio: { casa: 33, x: 76.5, y: 81.0 },   // Casa 33 (abajo)
        fin:      { casa: 47, x: 76.5, y: 32.0 }   // Casa 47 (arriba)
    },
    
    // ETAPA 1 - Columna izquierda (casas 48-65)
    "col_etapa1_izq": {
        inicio: { casa: 48, x: 61.0, y: 32.0 },   // Casa 48 (arriba)
        fin:      { casa: 65, x: 61.0, y: 91.5 }   // Casa 65 (abajo)
    },
    
    // ETAPA 3 - Casas 66-83
    "col_etapa3": {
        inicio: { casa: 66, x: 53.0, y: 91.5 },   // Casa 66 (abajo)
        fin:      { casa: 83, x: 53.0, y: 32.0 }   // Casa 83 (arriba)
    },
    
    // ETAPA 4 - Casas 84-99
    "col_etapa4": {
        inicio: { casa: 84, x: 38.0, y: 32.0 },   // Casa 84 (arriba)
        fin:      { casa: 99, x: 38.0, y: 84.5 }   // Casa 99 (abajo)
    }
};

// ============================================
// GENERADOR AUTOMÁTICO (NO TOCAR)
// Calcula todas las casas intermedias
// ============================================

const MAPEO_CASAS = (function() {
    const mapeo = {};
    
    Object.values(PUNTOS_ANCLAJE).forEach(col => {
        const { inicio, fin } = col;
        const totalCasas = Math.abs(fin.casa - inicio.casa) + 1;
        
        // Calcular paso entre casas
        const pasoX = (fin.x - inicio.x) / (totalCasas - 1);
        const pasoY = (fin.y - inicio.y) / (totalCasas - 1);
        
        // Generar cada casa
        for (let i = 0; i < totalCasas; i++) {
            const numeroCasa = inicio.casa + i;
            const x = inicio.x + (pasoX * i);
            const y = inicio.y + (pasoY * i);
            
            mapeo[numeroCasa.toString()] = {
                x: parseFloat(x.toFixed(1)),
                y: parseFloat(y.toFixed(1))
            };
        }
    });
    
    console.log('✅ MAPEO_CASAS generado automáticamente:', Object.keys(mapeo).length, 'casas');
    return mapeo;
})();
