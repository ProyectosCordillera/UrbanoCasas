// Cargar base de datos SQLite desde la carpeta data
async function loadDatabase() {
    try {
        // Importar sql.js
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });

        // Cargar archivo .db desde carpeta data
        const response = await fetch('data/urbano.db');
        const buffer = await response.arrayBuffer();

        // Inicializar base de datos
        const db = new SQL.Database(new Uint8Array(buffer));

        console.log('✅ Base de datos cargada exitosamente');
        return db;

    } catch (error) {
        console.error('❌ Error al cargar base de datos:', error);
        return null;
    }
}

// Función para ejecutar consultas
async function executeQuery(query, params = []) {
    const db = await loadDatabase();

    if (!db) {
        throw new Error('Base de datos no disponible');
    }

    try {
        const results = db.exec(query, params);
        return results;
    } catch (error) {
        console.error('Error en consulta:', error);
        throw error;
    }
}

// Exportar funciones (si usas módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadDatabase, executeQuery };
}