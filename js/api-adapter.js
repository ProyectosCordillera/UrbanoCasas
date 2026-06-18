// ============================================
// API ADAPTER - VERSIÓN OPTIMIZADA (VISTA UNIFICADA)
// Conectado a: vista_casas_completas (SQL)
// Elimina peticiones dobles: Todo viene en un solo GET
// ============================================

// ============================================
// 1. CONFIGURACIÓN DE URLS Y CONEXIÓN
// ============================================

// Lista de URLs a intentar en orden de prioridad (HTTPS)
// Lista de URLs a intentar en orden de prioridad (HTTPS)
const API_URLS = [
    // ÚNICA URL VÁLIDA: Puerto 443 con certificado Let's Encrypt
    'https://pcordillera.duckdns.org/api-casas/api/casas'
];

//const API_URLS = [
    // 1. NUEVA URL PRINCIPAL: Dominio DuckDNS + HTTPS (Puerto 443 implícito)
  //  'https://pcordillera.duckdns.org/api-casas/api/casas', 
    
    // 2. Fallback: Si por alguna razón el dominio falla, intenta la IP directa (puede dar error de cert si no se actualizó el binding de IP)
 //   'https://170.84.108.45/api-casas/api/casas',
    
    // 3. Local (Solo si estás en la misma red WiFi probando en local)
 //   'https://192.168.1.69/api-casas/api/casas'
//];

let API_BASE = sessionStorage.getItem('apiBaseUrl') || null;

// ============================================
// 2. FUNCIONES DE INFRAESTRUCTURA (CONEXIÓN)
// ============================================

async function probarUrl(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${url}`, { method: 'GET', signal: controller.signal, mode: 'cors', cache: 'no-store' });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function encontrarUrlFuncional() {
    console.log('🔄 [ApiAdapter] Buscando URL funcional...');
    for (const url of API_URLS) {
        console.log(`🔍 Probando: ${url}`);
        if (await probarUrl(url)) {
            console.log(`✅ URL encontrada: ${url}`);
            sessionStorage.setItem('apiBaseUrl', url);
            return url;
        }
    }
    console.error('❌ [ApiAdapter] Ninguna URL funciona.');
    return null;
}

async function getApiBase() {
    if (API_BASE) return API_BASE;
    API_BASE = await encontrarUrlFuncional();
    return API_BASE;
}

// Inicializar objeto global Database
if (typeof window.Database === 'undefined') {
    window.Database = {};
    console.log('🔄 [ApiAdapter] Objeto Database creado');
}

// ============================================
// 3. OBJETO PRINCIPAL CON TODAS LAS FUNCIONES
// ============================================

const ApiDatabase = {

    /**
     * 🏠 OBTENER TODAS LAS CASAS (CON CLIENTES UNIDOS)
     */
    async getCasas() {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No hay conexión API');
            
            console.log(`🔄 [API] Obteniendo casas unificadas desde: ${baseUrl}`);
            const response = await fetch(`${baseUrl}`, { mode: 'cors', cache: 'no-store' });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const casasList = Array.isArray(data) ? data : (data.value || []);

            return casasList.map(casa => ({
                id: casa.id,
                numero_casa: casa.numeroCasa?.toString() || casa.numero_casa?.toString(),
                coordenada_x: parseFloat(casa.coordenadaX ?? casa.coordenada_x),
                coordenada_y: parseFloat(casa.coordenadaY ?? casa.coordenada_y),
                nombre_cliente: casa.nombreCliente ?? casa.nombre_cliente ?? 'Sin propietario'
            }));
            
        } catch (error) {
            console.error('❌ [API] Error en getCasas:', error);
            throw error;
        }
    },

    /**
     * 👤 OBTENER CLIENTE POR CASA
     */
    async getClienteByCasa(numeroCasa) {
        try {
            const casas = await this.getCasas(); // Usamos 'this' para llamar a getCasas dentro del objeto
            const casaEncontrada = casas.find(c => c.numero_casa == numeroCasa);
            
            if (casaEncontrada && casaEncontrada.nombre_cliente && casaEncontrada.nombre_cliente !== 'Sin propietario') {
                return {
                    nombre: casaEncontrada.nombre_cliente,
                    casaNumero: casaEncontrada.numero_casa
                };
            }
            return null;
        } catch (error) {
            console.warn('⚠️ [API] No se pudo obtener el cliente:', error);
            return null;
        }
    },

    /**
     * 🔍 OBTENER CASA POR NÚMERO
     */
    async getCasaByNumero(numeroCasa) {
        try {
            const casas = await this.getCasas();
            return casas.find(c => c.numero_casa === numeroCasa.toString()) || null;
        } catch (error) {
            console.error('❌ [API] Error buscando casa:', error);
            return null;
        }
    },

    /**
     * 💾 INSERTAR CASA CON CLIENTE
     */
    async insertarCasaConCliente(numeroCasa, coordX, coordY, nombreCliente) {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No hay conexión API');
            
            const numCasaInt = parseInt(numeroCasa);
            const xFloat = parseFloat(coordX);
            const yFloat = parseFloat(coordY);
            const nombreFinal = nombreCliente ? nombreCliente.trim() : "";

            console.group(`💾 [API] Guardando Casa #${numCasaInt}`);
            console.log('📦 Datos a enviar:', { numCasaInt, xFloat, yFloat, nombreFinal });

            const payload = {
                numeroCasa: numCasaInt,
                coordenadaX: xFloat,
                coordenadaY: yFloat,
                nombreCliente: nombreFinal
            };

            const response = await fetch(`${baseUrl}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ [API] Éxito! ID generado: ${result.id}`);
            console.groupEnd();
            return true;
            
        } catch (error) {
            console.error('❌ [API] Error al guardar:', error);
            console.groupEnd();
            throw error;
        }
    },

    /**
     * 🗑️ ELIMINAR CASA CON CLIENTE
     */
    async eliminarCasaConCliente(numeroCasa) {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No hay conexión API');
            
            console.log(`🔍 [API] Buscando ID interno para casa #${numeroCasa}...`);
            const casas = await this.getCasas();
            const casaObj = casas.find(c => c.numero_casa === numeroCasa.toString());
            
            if (!casaObj) throw new Error(`Casa #${numeroCasa} no existe`);

            const idInterno = casaObj.id;
            console.log(`🗑️ [API] Eliminando ID interno: ${idInterno}...`);

            const response = await fetch(`${baseUrl}/${idInterno}`, {
                method: 'DELETE',
                mode: 'cors'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            console.log(`✅ [API] Eliminado correctamente.`);
            return true;
            
        } catch (error) {
            console.error('❌ [API] Error al eliminar:', error);
            throw error;
        }
    },

    /**
     * 🔄 ACTUALIZAR CLIENTE
     */
    async actualizarCliente(nombreNuevo, numeroCasa) {
        try {
            const cliente = await this.getClienteByCasa(numeroCasa);
            if (!cliente) throw new Error(`No hay cliente para la casa ${numeroCasa}`);

            const baseUrl = await getApiBase();
            const apiRoot = baseUrl.substring(0, baseUrl.lastIndexOf('/')); 
            const urlUpdate = `${apiRoot}/clientes/${cliente.id}`; 
            
            console.log(`🔄 [API] Actualizando cliente ID ${cliente.id}...`);

            const payload = {
                nombreCliente: nombreNuevo,
                casaNumero: parseInt(numeroCasa)
            };

            const response = await fetch(`${urlUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }

            console.log(`✅ [API] Cliente actualizado.`);
            return true;

        } catch (error) {
            console.error('❌ [API] Error al actualizar:', error);
            throw error;
        }
    }
};

// ============================================
// 4. INICIALIZACIÓN FINAL
// ============================================

// Asignar todas las funciones del objeto ApiDatabase a window.Database
Object.assign(window.Database, ApiDatabase);

console.log('✅ [ApiAdapter] Sistema listo. Funciones cargadas:', Object.keys(window.Database));
console.log('🌐 URLs configuradas:', API_URLS.length);
