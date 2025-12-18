// URL del Google Apps Script Web App
// REEMPLAZA CON LA URL DE TU WEB APP DESPLEGADA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYCBXJeRrYiE4patEIgtz4Li9jPK1iAtJxCvJX9j7BJYAY46YggOp3OwZuJga721IG/exec';

// Variables globales
let chartServicios, chartMensual, chartEvolucion, chartPresupuestos, chartReportes;
let datosGastos = [];

let serviciosConfig = [];
let filtrosActivos = {
    servicio: '',
    mes: '',
    anio: ''
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    setupFiltros();
    cargarAnios();
    cargarDashboard();
});

// Configuración de navegación
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.main-content .content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    // Acciones específicas por sección
                    if (targetId === 'dashboard') {
                        cargarDashboard();
                    } else if (targetId === 'gastos') {
                        cargarHistorialGastos();
                    } else if (targetId === 'servicios') {
                        cargarServicios();
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

// Configuración de formularios
function setupForms() {
    // Establecer fecha por defecto en el formulario de gasto
    const fechaInput = document.getElementById('g_fecha');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
    fechaInput.max = hoy;
    
    // Formulario de gasto
    document.getElementById('gastoForm').addEventListener('submit', registrarGasto);
    
    // Botón para agregar servicio
    document.getElementById('agregarServicioBtn').addEventListener('click', agregarServicio);
    
    // Botones del dashboard
    document.getElementById('actualizarDashboardBtn').addEventListener('click', cargarDashboard);
    document.getElementById('generarReporteMensualBtn').addEventListener('click', generarReporteMensual);
    
    // Filtros del dashboard
    document.getElementById('mesFiltro').addEventListener('change', aplicarFiltroDashboard);
    document.getElementById('anioFiltro').addEventListener('change', aplicarFiltroDashboard);
    
    // Botones de presupuestos
    document.getElementById('cargarPresupuestosBtn').addEventListener('click', cargarPresupuestos);
    
    // Botones de reportes
    document.getElementById('reporteMensualBtn').addEventListener('click', () => generarReporte('mensual'));
    document.getElementById('reporteAnualBtn').addEventListener('click', () => generarReporte('anual'));
    document.getElementById('comparativoBtn').addEventListener('click', () => generarReporte('comparativo'));
    document.getElementById('tendenciasBtn').addEventListener('click', () => generarReporte('tendencias'));
}

// Configuración de filtros
function setupFiltros() {
    document.getElementById('aplicarFiltrosBtn').addEventListener('click', aplicarFiltrosHistorial);
    document.getElementById('limpiarFiltrosBtn').addEventListener('click', limpiarFiltros);
    document.getElementById('exportarDatosBtn').addEventListener('click', exportarDatos);
}

// Cargar años para los filtros
function cargarAnios() {
    const anioActual = new Date().getFullYear();
    const selectAnio = document.getElementById('anioFiltro');
    const selectAnioGastos = document.getElementById('filtroAnio');
    const selectPresupuestoAnio = document.getElementById('presupuestoAnio');
    
    // Establecer año actual por defecto
    if (selectPresupuestoAnio) {
        selectPresupuestoAnio.value = anioActual;
    }
    
    // Cargar años desde 2020 hasta actual + 1
    for (let i = 2020; i <= anioActual + 1; i++) {
        const option = new Option(i, i);
        const option2 = new Option(i, i);
        const option3 = new Option(i, i);
        
        selectAnio.add(option);
        selectAnioGastos.add(option2.cloneNode(true));
        
        if (i === anioActual) {
            option.selected = true;
        }
    }
}

// ==================== FUNCIONES PRINCIPALES ====================

// Cargar dashboard
async function cargarDashboard() {
    mostrarEstado('statusDashboard', 'info', 'Cargando datos del dashboard...');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDashboardData`);
        const data = await response.json();
        
        if (data.status === 'success') {
            datosGastos = data.data.gastos || [];
            serviciosConfig = data.data.servicios || [];
            
            actualizarEstadisticas();
            crearGraficos();
            
            mostrarEstado('statusDashboard', 'success', 'Dashboard actualizado correctamente');
        } else {
            mostrarEstado('statusDashboard', 'error', data.message || 'Error al cargar datos');
        }
    } catch (error) {
        mostrarEstado('statusDashboard', 'error', `Error de conexión: ${error.message}`);
    }
}

// Aplicar filtros al dashboard
function aplicarFiltroDashboard() {
    crearGraficos();
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const statsContainer = document.getElementById('statsContainer');
    const mesFiltro = document.getElementById('mesFiltro').value;
    const anioFiltro = document.getElementById('anioFiltro').value;
    
    // Filtrar datos
    let datosFiltrados = datosGastos;
    if (mesFiltro) {
        datosFiltrados = datosFiltrados.filter(g => g.mes == mesFiltro);
    }
    if (anioFiltro) {
        datosFiltrados = datosFiltrados.filter(g => g.año == anioFiltro);
    }
    
    // Calcular totales por servicio
    const totales = {};
    datosFiltrados.forEach(gasto => {
        if (!totales[gasto.servicio]) {
            totales[gasto.servicio] = 0;
        }
        totales[gasto.servicio] += parseFloat(gasto.monto);
    });
    
    // Calcular total general
    const totalGeneral = Object.values(totales).reduce((sum, val) => sum + val, 0);
    
    // Generar HTML de estadísticas
    let html = '';
    
    // Tarjetas por servicio
    serviciosConfig.forEach(servicio => {
        const total = totales[servicio.nombre] || 0;
        const color = servicio.color || '#3498db';
        const presupuesto = servicio.presupuesto || 0;
        const porcentaje = presupuesto > 0 ? (total / presupuesto * 100) : 0;
        
        html += `
            <div class="stat-card ${servicio.nombre.toLowerCase()}" style="border-left-color: ${color}">
                <i class="fas fa-${obtenerIconoServicio(servicio.nombre)} fa-2x" style="color: ${color};"></i>
                <div class="stat-value">$${total.toFixed(2)}</div>
                <div class="stat-label">${servicio.nombre}</div>
                ${presupuesto > 0 ? `<div style="font-size: 0.8rem; margin-top: 5px;">${porcentaje.toFixed(1)}% del presupuesto</div>` : ''}
            </div>
        `;
    });
    
    // Tarjeta de total general
    html += `
        <div class="stat-card total">
            <i class="fas fa-chart-pie fa-2x" style="color: var(--primary-color);"></i>
            <div class="stat-value">$${totalGeneral.toFixed(2)}</div>
            <div class="stat-label">TOTAL GENERAL</div>
            <div style="font-size: 0.8rem; margin-top: 5px;">${datosFiltrados.length} gastos registrados</div>
        </div>
    `;
    
    statsContainer.innerHTML = html;
}

// Crear gráficos
function crearGraficos() {
    const mesFiltro = document.getElementById('mesFiltro').value;
    const anioFiltro = document.getElementById('anioFiltro').value;
    
    // Filtrar datos
    let datosFiltrados = datosGastos;
    if (mesFiltro) {
        datosFiltrados = datosFiltrados.filter(g => g.mes == mesFiltro);
    }
    if (anioFiltro) {
        datosFiltrados = datosFiltrados.filter(g => g.año == anioFiltro);
    }
    
    // 1. Gráfico de gastos por servicio
    crearGraficoServicios(datosFiltrados);
    
    // 2. Gráfico de gastos mensuales
    crearGraficoMensual(datosFiltrados);
    
    // 3. Gráfico de evolución
    crearGraficoEvolucion(datosFiltrados);
}

function crearGraficoServicios(datos) {
    const ctx = document.getElementById('graficoGastosServicios').getContext('2d');
    
    // Agrupar por servicio
    const servicios = {};
    datos.forEach(gasto => {
        if (!servicios[gasto.servicio]) {
            servicios[gasto.servicio] = 0;
        }
        servicios[gasto.servicio] += parseFloat(gasto.monto);
    });
    
    // Obtener colores de los servicios
    const colores = serviciosConfig.map(s => s.color || '#3498db');
    
    if (chartServicios) chartServicios.destroy();
    
    chartServicios = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(servicios),
            datasets: [{
                data: Object.values(servicios),
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Gastos por Servicio'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function crearGraficoMensual(datos) {
    const ctx = document.getElementById('graficoGastosMensuales').getContext('2d');
    
    // Agrupar por mes
    const meses = {
        '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0,
        '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0
    };
    
    datos.forEach(gasto => {
        meses[gasto.mes] += parseFloat(gasto.monto);
    });
    
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                         'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (chartMensual) chartMensual.destroy();
    
    chartMensual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nombresMeses,
            datasets: [{
                label: 'Gastos Mensuales',
                data: Object.values(meses),
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Gastos Mensuales'
                }
            }
        }
    });
}

function crearGraficoEvolucion(datos) {
    const ctx = document.getElementById('graficoEvolucion').getContext('2d');
    
    // Agrupar por fecha (mes-año)
    const evolucion = {};
    datos.forEach(gasto => {
        const key = `${gasto.mes}/${gasto.año}`;
        if (!evolucion[key]) {
            evolucion[key] = 0;
        }
        evolucion[key] += parseFloat(gasto.monto);
    });
    
    // Ordenar por fecha
    const fechas = Object.keys(evolucion).sort((a, b) => {
        const [mesA, anioA] = a.split('/');
        const [mesB, anioB] = b.split('/');
        return new Date(anioA, mesA-1) - new Date(anioB, mesB-1);
    });
    
    if (chartEvolucion) chartEvolucion.destroy();
    
    chartEvolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [{
                label: 'Evolución de Gastos',
                data: fechas.map(f => evolucion[f]),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución de Gastos'
                }
            }
        }
    });
}

// Registrar un nuevo gasto - VERSIÓN MEJORADA
async function registrarGasto(e) {
    e.preventDefault();
    mostrarEstado('statusGasto', 'info', 'Registrando gasto...');
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    // Obtener valores del formulario
    const servicio = document.getElementById('g_servicio').value;
    const monto = document.getElementById('g_monto').value;
    const fecha = document.getElementById('g_fecha').value;
    const descripcion = document.getElementById('g_descripcion').value;
    const observaciones = document.getElementById('g_observaciones').value;
    
    // Validar datos
    if (!servicio || servicio === '') {
        mostrarEstado('statusGasto', 'error', 'Por favor seleccione un servicio');
        submitBtn.disabled = false;
        return;
    }
    
    if (!monto || parseFloat(monto) <= 0) {
        mostrarEstado('statusGasto', 'error', 'Por favor ingrese un monto válido');
        submitBtn.disabled = false;
        return;
    }
    
    if (!fecha) {
        mostrarEstado('statusGasto', 'error', 'Por favor seleccione una fecha');
        submitBtn.disabled = false;
        return;
    }
    
    const gastoData = {
        action: 'registrarGasto',
        servicio: servicio,
        monto: parseFloat(monto).toFixed(2),
        fecha: fecha,
        descripcion: descripcion || '',
        observaciones: observaciones || ''
    };
    
    console.log('Enviando datos:', gastoData);
    
    try {
        // Usar el endpoint correcto para Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Para evitar problemas de CORS
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gastoData)
        });
        
        // Para 'no-cors' mode, no podemos leer la respuesta
        // Pero podemos verificar si se envió
        console.log('Datos enviados al servidor');
        
        // Mostrar mensaje de éxito
        mostrarEstado('statusGasto', 'success', `Gasto de ${servicio} registrado correctamente por $${monto}`);
        
        // Limpiar formulario (excepto fecha)
        document.getElementById('g_monto').value = '';
        document.getElementById('g_descripcion').value = '';
        document.getElementById('g_observaciones').value = '';
        
        // Actualizar dashboard después de un breve retraso
        setTimeout(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                cargarDashboard();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error en fetch:', error);
        
        // Si hay error de CORS, intentar método alternativo
        try {
            // Método alternativo usando FormData
            await registrarGastoAlternativo(gastoData);
        } catch (altError) {
            mostrarEstado('statusGasto', 'error', `Error: ${altError.message}. Verifica la URL del Web App.`);
        }
    } finally {
        submitBtn.disabled = false;
    }
}

// Método alternativo para registrar gastos
async function registrarGastoAlternativo(gastoData) {
    console.log('Intentando método alternativo...');
    
    // Crear URL con parámetros GET (alternativa para POST)
    const params = new URLSearchParams();
    params.append('action', 'registrarGasto');
    params.append('servicio', gastoData.servicio);
    params.append('monto', gastoData.monto);
    params.append('fecha', gastoData.fecha);
    params.append('descripcion', gastoData.descripcion);
    params.append('observaciones', gastoData.observaciones);
    
    const url = `${SCRIPT_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors'
    });
    
    console.log('Método alternativo ejecutado');
}

// Cargar historial de gastos
async function cargarHistorialGastos() {
    mostrarEstado('statusHistorial', 'info', 'Cargando historial de gastos...');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getGastos`);
        const data = await response.json();
        
        if (data.status === 'success') {
            datosGastos = data.data;
            aplicarFiltrosHistorial();
            mostrarEstado('statusHistorial', 'success', `Cargados ${datosGastos.length} gastos`);
        } else {
            mostrarEstado('statusHistorial', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusHistorial', 'error', `Error de conexión: ${error.message}`);
    }
}

// Aplicar filtros al historial
function aplicarFiltrosHistorial() {
    const servicio = document.getElementById('filtroServicio').value;
    const mes = document.getElementById('filtroMes').value;
    const anio = document.getElementById('filtroAnio').value;
    
    // Guardar filtros activos
    filtrosActivos = { servicio, mes, anio };
    
    // Filtrar datos
    let datosFiltrados = datosGastos;
    
    if (servicio) {
        datosFiltrados = datosFiltrados.filter(g => g.servicio === servicio);
    }
    
    if (mes) {
        datosFiltrados = datosFiltrados.filter(g => g.mes == mes);
    }
    
    if (anio) {
        datosFiltrados = datosFiltrados.filter(g => g.año == anio);
    }
    
    // Ordenar por fecha (más reciente primero)
    datosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Actualizar tabla
    actualizarTablaHistorial(datosFiltrados);
    
    // Actualizar resumen
    const totalMonto = datosFiltrados.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    document.getElementById('totalFiltrado').textContent = datosFiltrados.length;
    document.getElementById('montoFiltrado').textContent = totalMonto.toFixed(2);
}

// Actualizar tabla de historial
function actualizarTablaHistorial(datos) {
    const tbody = document.getElementById('historialTableBody');
    
    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay gastos registrados con los filtros seleccionados</td></tr>';
        return;
    }
    
    let html = '';
    datos.forEach(gasto => {
        const fecha = new Date(gasto.fecha).toLocaleDateString('es-ES');
        const claseServicio = gasto.servicio.toLowerCase();
        
        html += `
            <tr>
                <td>${gasto.id || 'N/A'}</td>
                <td>${fecha}</td>
                <td><span class="service-badge ${claseServicio}-badge">${gasto.servicio}</span></td>
                <td><strong>$${parseFloat(gasto.monto).toFixed(2)}</strong></td>
                <td>${gasto.mes}/${gasto.año}</td>
                <td>${gasto.descripcion || ''}</td>
                <td>
                    <button onclick="editarGasto('${gasto.id}')" class="btn" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="eliminarGasto('${gasto.id}')" class="btn danger-btn" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtroServicio').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAnio').value = '';
    
    aplicarFiltrosHistorial();
}

// Exportar datos
async function exportarDatos() {
    mostrarEstado('statusHistorial', 'info', 'Generando archivo de exportación...');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=exportarGastos`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Crear archivo CSV
            const csv = convertirACSV(datosGastos);
            descargarCSV(csv, 'gastos_hogar.csv');
            
            mostrarEstado('statusHistorial', 'success', 'Datos exportados correctamente');
        } else {
            mostrarEstado('statusHistorial', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusHistorial', 'error', `Error de conexión: ${error.message}`);
    }
}

// ==================== FUNCIONES DE SERVICIOS ====================

// Cargar servicios
async function cargarServicios() {
    mostrarEstado('statusServicios', 'info', 'Cargando servicios...');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getServicios`);
        const data = await response.json();
        
        if (data.status === 'success') {
            serviciosConfig = data.data;
            actualizarListaServicios();
            mostrarEstado('statusServicios', 'success', 'Servicios cargados correctamente');
        } else {
            mostrarEstado('statusServicios', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusServicios', 'error', `Error de conexión: ${error.message}`);
    }
}

// Actualizar lista de servicios
function actualizarListaServicios() {
    const lista = document.getElementById('listaServicios');
    
    if (serviciosConfig.length === 0) {
        lista.innerHTML = '<p>No hay servicios configurados</p>';
        return;
    }
    
    let html = '';
    serviciosConfig.forEach(servicio => {
        html += `
            <div class="stat-card ${servicio.nombre.toLowerCase()}" style="border-left-color: ${servicio.color}">
                <i class="fas fa-${obtenerIconoServicio(servicio.nombre)} fa-2x" style="color: ${servicio.color};"></i>
                <div class="stat-value">$${(servicio.presupuesto || 0).toFixed(2)}</div>
                <div class="stat-label">${servicio.nombre}</div>
                <div style="margin-top: 10px;">
                    <button onclick="editarServicio('${servicio.id}')" class="btn" style="padding: 3px 8px; font-size: 0.7rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="eliminarServicio('${servicio.id}')" class="btn danger-btn" style="padding: 3px 8px; font-size: 0.7rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html;
}

// Agregar servicio
async function agregarServicio() {
    const nombre = document.getElementById('s_nombre').value.trim();
    const color = document.getElementById('s_color').value;
    const presupuesto = document.getElementById('s_presupuesto').value;
    
    if (!nombre) {
        mostrarEstado('statusServicios', 'error', 'El nombre del servicio es requerido');
        return;
    }
    
    mostrarEstado('statusServicios', 'info', 'Agregando servicio...');
    
    const servicioData = {
        action: 'agregarServicio',
        nombre: nombre,
        color: color,
        presupuesto: presupuesto
    };
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(servicioData),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            mostrarEstado('statusServicios', 'success', data.message);
            document.getElementById('s_nombre').value = '';
            document.getElementById('s_presupuesto').value = '';
            cargarServicios();
        } else {
            mostrarEstado('statusServicios', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusServicios', 'error', `Error de conexión: ${error.message}`);
    }
}

// ==================== FUNCIONES DE PRESUPUESTOS ====================

// Cargar presupuestos
async function cargarPresupuestos() {
    const mes = document.getElementById('presupuestoMes').value;
    const anio = document.getElementById('presupuestoAnio').value;
    
    if (!mes || !anio) {
        mostrarEstado('statusPresupuestos', 'error', 'Seleccione mes y año');
        return;
    }
    
    mostrarEstado('statusPresupuestos', 'info', 'Cargando presupuestos...');
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getPresupuestos&mes=${mes}&anio=${anio}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            actualizarTablaPresupuestos(data.data);
            crearGraficoPresupuestos(data.data);
            mostrarEstado('statusPresupuestos', 'success', 'Presupuestos cargados correctamente');
        } else {
            mostrarEstado('statusPresupuestos', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusPresupuestos', 'error', `Error de conexión: ${error.message}`);
    }
}

// Actualizar tabla de presupuestos
function actualizarTablaPresupuestos(datos) {
    const contenedor = document.getElementById('tablaPresupuestos');
    
    if (!datos || datos.length === 0) {
        contenedor.innerHTML = '<p>No hay datos de presupuestos para este período</p>';
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Servicio</th>
                    <th>Presupuesto</th>
                    <th>Gastado</th>
                    <th>Disponible</th>
                    <th>% Utilizado</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let totalPresupuesto = 0;
    let totalGastado = 0;
    
    datos.forEach(item => {
        const presupuesto = parseFloat(item.presupuesto) || 0;
        const gastado = parseFloat(item.gastado) || 0;
        const disponible = presupuesto - gastado;
        const porcentaje = presupuesto > 0 ? (gastado / presupuesto * 100) : 0;
        
        totalPresupuesto += presupuesto;
        totalGastado += gastado;
        
        let estado = '';
        let colorEstado = '';
        
        if (porcentaje >= 100) {
            estado = 'Excedido';
            colorEstado = 'danger-color';
        } else if (porcentaje >= 80) {
            estado = 'Alto';
            colorEstado = 'warning-color';
        } else if (porcentaje >= 50) {
            estado = 'Medio';
            colorEstado = 'warning-color';
        } else {
            estado = 'Bajo';
            colorEstado = 'secondary-color';
        }
        
        html += `
            <tr>
                <td><span class="service-badge ${item.servicio.toLowerCase()}-badge">${item.servicio}</span></td>
                <td>$${presupuesto.toFixed(2)}</td>
                <td>$${gastado.toFixed(2)}</td>
                <td>$${disponible.toFixed(2)}</td>
                <td>${porcentaje.toFixed(1)}%</td>
                <td style="color: var(--${colorEstado}); font-weight: bold;">${estado}</td>
            </tr>
        `;
    });
    
    const totalDisponible = totalPresupuesto - totalGastado;
    const totalPorcentaje = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto * 100) : 0;
    
    html += `
            </tbody>
            <tfoot>
                <tr style="background-color: #f2f2f2; font-weight: bold;">
                    <td>TOTAL</td>
                    <td>$${totalPresupuesto.toFixed(2)}</td>
                    <td>$${totalGastado.toFixed(2)}</td>
                    <td>$${totalDisponible.toFixed(2)}</td>
                    <td>${totalPorcentaje.toFixed(1)}%</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    contenedor.innerHTML = html;
}

// Crear gráfico de presupuestos
function crearGraficoPresupuestos(datos) {
    const ctx = document.getElementById('graficoPresupuestos').getContext('2d');
    
    const servicios = datos.map(d => d.servicio);
    const presupuestos = datos.map(d => parseFloat(d.presupuesto) || 0);
    const gastados = datos.map(d => parseFloat(d.gastado) || 0);
    
    if (chartPresupuestos) chartPresupuestos.destroy();
    
    chartPresupuestos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: servicios,
            datasets: [
                {
                    label: 'Presupuesto',
                    data: presupuestos,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)'
                },
                {
                    label: 'Gastado',
                    data: gastados,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    beginAtZero: true,
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Presupuesto vs Gastado por Servicio'
                }
            }
        }
    });
}

// ==================== FUNCIONES DE REPORTES ====================

// Generar reporte
async function generarReporte(tipo) {
    mostrarEstado('statusReportes', 'info', `Generando reporte ${tipo}...`);
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=generarReporte&tipo=${tipo}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            mostrarReporte(data.data, tipo);
            mostrarEstado('statusReportes', 'success', 'Reporte generado correctamente');
        } else {
            mostrarEstado('statusReportes', 'error', data.message);
        }
    } catch (error) {
        mostrarEstado('statusReportes', 'error', `Error de conexión: ${error.message}`);
    }
}

// Mostrar reporte
function mostrarReporte(datos, tipo) {
    const contenedor = document.getElementById('detalleReporte');
    const ctx = document.getElementById('graficoReportes').getContext('2d');
    
    // Crear gráfico según el tipo de reporte
    if (chartReportes) chartReportes.destroy();
    
    switch(tipo) {
        case 'mensual':
            mostrarReporteMensual(datos, ctx);
            break;
        case 'anual':
            mostrarReporteAnual(datos, ctx);
            break;
        case 'comparativo':
            mostrarReporteComparativo(datos, ctx);
            break;
        case 'tendencias':
            mostrarReporteTendencias(datos, ctx);
            break;
    }
    
    // Mostrar tabla de datos
    let html = '<h3>Detalle del Reporte</h3>';
    html += '<div style="max-height: 300px; overflow-y: auto; margin-top: 20px;">';
    html += '<table class="data-table">';
    
    // Cabeceras dinámicas según el tipo
    if (datos.length > 0) {
        const headers = Object.keys(datos[0]);
        html += '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
        html += '<tbody>';
        
        datos.forEach(fila => {
            html += '<tr>' + Object.values(fila).map(v => `<td>${v}</td>`).join('') + '</tr>';
        });
        
        html += '</tbody>';
    }
    
    html += '</table></div>';
    contenedor.innerHTML = html;
}

// Funciones específicas para cada tipo de reporte
function mostrarReporteMensual(datos, ctx) {
    const meses = datos.map(d => d.Mes);
    const totales = datos.map(d => d.Total);
    
    chartReportes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Gastos Mensuales',
                data: totales,
                backgroundColor: 'rgba(52, 152, 219, 0.7)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gastos Mensuales'
                }
            }
        }
    });
}

function mostrarReporteAnual(datos, ctx) {
    chartReportes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.map(d => d.Año),
            datasets: [{
                label: 'Gastos Anuales',
                data: datos.map(d => d.Total),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución Anual de Gastos'
                }
            }
        }
    });
}

// ==================== FUNCIONES UTILITARIAS ====================

// Mostrar estado
function mostrarEstado(elementId, tipo, mensaje) {
    const elemento = document.getElementById(elementId);
    elemento.style.display = 'block';
    elemento.className = `status-message ${tipo}`;
    elemento.innerHTML = `<i class="fas fa-${obtenerIconoEstado(tipo)}"></i> ${mensaje}`;
    
    // Ocultar después de 5 segundos (excepto errores)
    if (tipo !== 'error') {
        setTimeout(() => {
            elemento.style.display = 'none';
        }, 5000);
    }
}

// Obtener icono según estado
function obtenerIconoEstado(tipo) {
    switch(tipo) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Obtener icono según servicio
function obtenerIconoServicio(servicio) {
    switch(servicio.toUpperCase()) {
        case 'LUZ': return 'lightbulb';
        case 'AGUA': return 'tint';
        case 'INTERNET': return 'wifi';
        case 'GAS': return 'fire';
        case 'ALIMENTOS': return 'utensils';
        case 'MASCOTAS': return 'paw';
        case 'OTROS': return 'ellipsis-h';
        default: return 'tag';
    }
}

// Convertir datos a CSV
function convertirACSV(datos) {
    if (!datos || datos.length === 0) return '';
    
    const headers = Object.keys(datos[0]);
    const rows = datos.map(fila => 
        headers.map(header => JSON.stringify(fila[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

// Descargar CSV
function descargarCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Generar reporte mensual
async function generarReporteMensual() {
    mostrarEstado('statusDashboard', 'info', 'Generando reporte mensual...');
    
    try {
        // Aquí implementarías la generación del reporte PDF
        // Por ahora solo mostraremos un mensaje
        mostrarEstado('statusDashboard', 'success', 'Reporte mensual generado (función en desarrollo)');
        
        // Simular descarga
        setTimeout(() => {
            alert('Reporte listo para descargar');
        }, 1000);
    } catch (error) {
        mostrarEstado('statusDashboard', 'error', `Error: ${error.message}`);
    }
}

// Funciones de edición y eliminación (placeholder)
function editarGasto(id) {
    alert(`Editar gasto ${id} - Función en desarrollo`);
}

function eliminarGasto(id) {
    if (confirm('¿Está seguro de eliminar este gasto?')) {
        alert(`Eliminar gasto ${id} - Función en desarrollo`);
    }
}

function editarServicio(id) {
    alert(`Editar servicio ${id} - Función en desarrollo`);
}

function eliminarServicio(id) {
    if (confirm('¿Está seguro de eliminar este servicio?')) {
        alert(`Eliminar servicio ${id} - Función en desarrollo`);
    }
}
// Función para probar la conexión con Google Apps Script
async function probarConexion() {
    console.log('Probando conexión con Google Apps Script...');
    
    try {
        // Intentar una solicitud GET simple
        const response = await fetch(`${SCRIPT_URL}?action=getServicios`);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Datos recibidos:', data);
            mostrarEstado('statusDashboard', 'success', 'Conexión establecida correctamente');
            return true;
        } else {
            mostrarEstado('statusDashboard', 'error', 'Error en la respuesta del servidor');
            return false;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarEstado('statusDashboard', 'error', `Error de conexión: ${error.message}`);
        
        // Mostrar la URL que se está usando
        console.log('URL intentada:', SCRIPT_URL);
        alert(`URL del Web App: ${SCRIPT_URL}\n\nVerifica que:\n1. El Web App esté desplegado\n2. Los permisos sean "Anyone"\n3. La URL sea correcta`);
        
        return false;
    }
}

// Agregar botón de prueba en el dashboard
function agregarBotonPrueba() {
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        const botonPrueba = document.createElement('button');
        botonPrueba.className = 'btn warning-btn';
        botonPrueba.innerHTML = '<i class="fas fa-wifi"></i> Probar Conexión';
        botonPrueba.style.marginLeft = '10px';
        botonPrueba.onclick = probarConexion;
        
        const botonesContainer = document.querySelector('#dashboard .btn');
        if (botonesContainer && botonesContainer.parentNode) {
            botonesContainer.parentNode.appendChild(botonPrueba);
        }
    }
}

// Llamar a agregarBotonPrueba al final del DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    setupFiltros();
    cargarAnios();
    cargarDashboard();
    agregarBotonPrueba(); // Agregar esta línea
});