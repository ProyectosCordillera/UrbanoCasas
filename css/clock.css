/* ========================================
   Estilos del Reloj Digital
   ======================================== */

/* Contenedor principal */
.clock-digital-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-left: 20px;
}

/* Reloj digital completo */
.clock-digital {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 12px 20px;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    min-width: 140px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

/* Efecto de brillo */
.clock-digital::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    z-index: 0;
}

/* Hora digital */
.clock-time {
    font-family: 'Courier New', monospace;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    position: relative;
    z-index: 1;
    letter-spacing: 2px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* Fecha digital */
.clock-date {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 1;
    margin-top: 4px;
    letter-spacing: 1px;
}

/* Efecto de parpadeo para los dos puntos */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.clock-time span.blink {
    animation: blink 1s infinite;
}

/* Efecto de neón */
.clock-digital.neon {
    box-shadow: 
        0 0 10px #667eea,
        0 0 20px #667eea,
        0 0 30px #667eea;
}

/* Hover effect */
.clock-digital:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.6);
    transition: all 0.3s ease;
}

/* Responsive */
@media (max-width: 992px) {
    .clock-digital {
        padding: 10px 15px;
        min-width: 120px;
    }
    
    .clock-time {
        font-size: 1.3rem;
    }
    
    .clock-date {
        font-size: 0.8rem;
    }
}

@media (max-width: 768px) {
    .clock-digital {
        padding: 8px 12px;
        min-width: 110px;
    }
    
    .clock-time {
        font-size: 1.1rem;
    }
    
    .clock-date {
        font-size: 0.75rem;
    }
}

@media (max-width: 576px) {
    .clock-digital-container {
        margin-left: 10px;
        margin-right: 10px;
    }
    
    .clock-digital {
        padding: 6px 10px;
        min-width: 100px;
    }
    
    .clock-time {
        font-size: 1rem;
    }
    
    .clock-date {
        font-size: 0.7rem;
    }
}

/* Tema oscuro alternativo */
.clock-digital.dark {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

/* Tema verde */
.clock-digital.green {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    box-shadow: 0 8px 20px rgba(17, 153, 142, 0.4);
}

/* Tema rojo */
.clock-digital.red {
    background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
    box-shadow: 0 8px 20px rgba(255, 65, 108, 0.4);
}

/* Tema azul */
.clock-digital.blue {
    background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
    box-shadow: 0 8px 20px rgba(0, 198, 255, 0.4);
}
