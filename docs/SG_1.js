// ==============================================
// CONFIGURACIÓN PRINCIPAL
// ==============================================

// ID DE TU HOJA DE CÁLCULO (REEMPLAZAR)
const SPREADSHEET_ID = "COLOCA TU ID DE TU HOJA DE CALCULO";

// Nombres de las pestañas
const HOJA_GASTOS = "GASTOS";
const HOJA_SERVICIOS = "SERVICIOS";
const HOJA_PRESUPUESTOS = "PRESUPUESTOS";
const HOJA_REPORTES = "REPORTES";

// Encabezados de columnas
const GASTOS_HEADERS = ["id", "servicio", "monto", "fecha", "mes", "año", "descripcion", "observaciones", "fecha_registro"];
const SERVICIOS_HEADERS = ["id", "nombre", "color", "presupuesto", "activo"];
const PRESUPUESTOS_HEADERS = ["id", "servicio_id", "mes", "año", "presupuesto", "gastado", "diferencia"];
const REPORTES_HEADERS = ["id", "tipo", "periodo", "datos", "fecha_generacion"];

// Servicios por defecto
const SERVICIOS_DEFAULT = [
    { nombre: "LUZ", color: "#f1c40f", presupuesto: 200 },
    { nombre: "AGUA", color: "#3498db", presupuesto: 100 },
    { nombre: "INTERNET", color: "#9b59b6", presupuesto: 80 },
    { nombre: "GAS", color: "#e74c3c", presupuesto: 50 },
    { nombre: "ALIMENTOS", color: "#2ecc71", presupuesto: 400 },
    { nombre: "MASCOTAS", color: "#e67e22", presupuesto: 100 },
    { nombre: "OTROS", color: "#95a5a6", presupuesto: 200 }
];

// ==============================================
// FUNCIONES DE ACCESO A LA HOJA
// ==============================================

// Obtener la hoja de cálculo
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Generar ID único
function generateId() {
    return Utilities.getUuid();
}

// Obtener o crear una hoja
function getOrCreateSheet(name, headers) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(name);
    
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (headers && headers.length > 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setBackground("#2c3e50").setFontColor("white").setFontWeight("bold");
        }
    }
    
    return sheet;
}

// ==============================================
// ENTRADA PRINCIPAL (doGet) - VERSIÓN MEJORADA
// ==============================================

function doGet(e) {
    const action = e.parameter.action;
    const tipo = e.parameter.tipo;
    const mes = e.parameter.mes;
    const anio = e.parameter.anio;
    const query = e.parameter.query;
    
    let result;
    
    try {
        switch(action) {
            case "getDashboardData":
                result = getDashboardData();
                break;
            case "getGastos":
                result = getGastos();
                break;
            case "getServicios":
                result = getServicios();
                break;
            case "getPresupuestos":
                result = getPresupuestos(mes, anio);
                break;
            case "generarReporte":
                result = generarReporte(tipo);
                break;
            case "exportarGastos":
                result = exportarGastos();
                break;
            case "iniciarBaseDatos":
                result = iniciarBaseDatos();
                break;
            case "resetearBaseDatos":
                result = resetearBaseDatos();
                break;
            default:
                result = { status: "error", message: "Acción no válida" };
        }
    } catch (error) {
        console.error("Error en doGet:", error);
        result = { status: "error", message: error.toString() };
    }
    
    // Configurar headers para CORS
    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ==============================================
// ENTRADA PRINCIPAL (doPost) - VERSIÓN MEJORADA
// ==============================================

function doPost(e) {
    let result;
    
    try {
        // Manejar diferentes formatos de datos
        let data;
        if (typeof e.postData === 'string') {
            data = JSON.parse(e.postData);
        } else if (e.postData && e.postData.contents) {
            data = JSON.parse(e.postData.contents);
        } else {
            data = e.parameter;
        }
        
        const action = data.action;
        
        switch(action) {
            case "registrarGasto":
                result = registrarGasto(data);
                break;
            case "agregarServicio":
                result = agregarServicio(data);
                break;
            case "editarGasto":
                result = editarGasto(data);
                break;
            case "eliminarGasto":
                result = eliminarGasto(data);
                break;
            case "actualizarPresupuesto":
                result = actualizarPresupuesto(data);
                break;
            default:
                result = { status: "error", message: "Acción POST no válida" };
        }
    } catch (error) {
        console.error("Error en doPost:", error);
        result = { status: "error", message: error.toString() };
    }
    
    // Configurar headers para CORS
    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ==============================================
// Función OPTIONS para manejar CORS preflight
// ==============================================

function doOptions(e) {
    return ContentService
        .createTextOutput(JSON.stringify({}))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type")
        .addHeader("Access-Control-Max-Age", "86400");
}

// ==============================================
// FUNCIONES DE GASTOS
// ==============================================

// Obtener todos los gastos
function getGastos() {
    const sheet = getOrCreateSheet(HOJA_GASTOS, GASTOS_HEADERS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
        return { status: "success", data: [] };
    }
    
    const headers = data[0];
    const gastos = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const gasto = {};
        
        headers.forEach((header, index) => {
            gasto[header] = row[index];
        });
        
        gastos.push(gasto);
    }
    
    return { status: "success", data: gastos };
}

// Registrar un nuevo gasto
function registrarGasto(data) {
    const sheet = getOrCreateSheet(HOJA_GASTOS, GASTOS_HEADERS);
    
    // Validar datos
    if (!data.servicio || !data.monto || !data.fecha) {
        return { status: "error", message: "Servicio, monto y fecha son requeridos" };
    }
    
    // Convertir fecha
    const fecha = new Date(data.fecha);
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();
    
    // Crear nueva fila
    const newRow = [
        generateId(),
        data.servicio,
        parseFloat(data.monto),
        fecha,
        mes,
        año,
        data.descripcion || "",
        data.observaciones || "",
        new Date()
    ];
    
    // Agregar a la hoja
    sheet.appendRow(newRow);
    
    // Formatear la nueva fila
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setNumberFormat("dd/mm/yyyy");
    sheet.getRange(lastRow, 9).setNumberFormat("dd/mm/yyyy hh:mm");
    sheet.getRange(lastRow, 3).setNumberFormat('"$"#,##0.00');
    
    // Actualizar presupuesto
    actualizarPresupuestoServicio(data.servicio, mes, año, parseFloat(data.monto));
    
    return { 
        status: "success", 
        message: `Gasto de ${data.servicio} registrado correctamente por $${data.monto}` 
    };
}

// Actualizar presupuesto del servicio
function actualizarPresupuestoServicio(servicio, mes, año, monto) {
    const sheetServicios = getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
    const sheetPresupuestos = getOrCreateSheet(HOJA_PRESUPUESTOS, PRESUPUESTOS_HEADERS);
    
    // Obtener ID del servicio
    const serviciosData = sheetServicios.getDataRange().getValues();
    let servicioId = null;
    
    for (let i = 1; i < serviciosData.length; i++) {
        if (serviciosData[i][1] === servicio) {
            servicioId = serviciosData[i][0];
            break;
        }
    }
    
    if (!servicioId) return;
    
    // Buscar presupuesto existente
    const presupuestosData = sheetPresupuestos.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < presupuestosData.length; i++) {
        if (presupuestosData[i][1] === servicioId && 
            presupuestosData[i][2] == mes && 
            presupuestosData[i][3] == año) {
            
            // Actualizar gastado
            const gastadoActual = parseFloat(presupuestosData[i][5]) || 0;
            const nuevoGastado = gastadoActual + monto;
            const presupuesto = parseFloat(presupuestosData[i][4]) || 0;
            const diferencia = presupuesto - nuevoGastado;
            
            sheetPresupuestos.getRange(i + 1, 6).setValue(nuevoGastado);
            sheetPresupuestos.getRange(i + 1, 7).setValue(diferencia);
            found = true;
            break;
        }
    }
    
    // Si no existe, crear nuevo registro
    if (!found) {
        const servicioData = sheetServicios.getDataRange().getValues();
        let presupuesto = 0;
        
        for (let i = 1; i < servicioData.length; i++) {
            if (servicioData[i][0] === servicioId) {
                presupuesto = parseFloat(servicioData[i][3]) || 0;
                break;
            }
        }
        
        const diferencia = presupuesto - monto;
        const newRow = [
            generateId(),
            servicioId,
            mes,
            año,
            presupuesto,
            monto,
            diferencia
        ];
        
        sheetPresupuestos.appendRow(newRow);
    }
}

// ==============================================
// FUNCIONES DE SERVICIOS
// ==============================================

// Obtener todos los servicios
function getServicios() {
    const sheet = getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
        // Si no hay servicios, crear los por defecto
        crearServiciosPorDefecto();
        return getServicios();
    }
    
    const headers = data[0];
    const servicios = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const servicio = {};
        
        headers.forEach((header, index) => {
            servicio[header] = row[index];
        });
        
        servicios.push(servicio);
    }
    
    return { status: "success", data: servicios };
}

// Crear servicios por defecto
function crearServiciosPorDefecto() {
    const sheet = getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
    
    SERVICIOS_DEFAULT.forEach(servicio => {
        const newRow = [
            generateId(),
            servicio.nombre,
            servicio.color,
            servicio.presupuesto,
            true
        ];
        
        sheet.appendRow(newRow);
    });
}

// Agregar nuevo servicio
function agregarServicio(data) {
    const sheet = getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
    
    // Validar
    if (!data.nombre) {
        return { status: "error", message: "El nombre del servicio es requerido" };
    }
    
    // Verificar si ya existe
    const servicios = sheet.getDataRange().getValues();
    for (let i = 1; i < servicios.length; i++) {
        if (servicios[i][1] === data.nombre) {
            return { status: "error", message: "El servicio ya existe" };
        }
    }
    
    const newRow = [
        generateId(),
        data.nombre,
        data.color || "#3498db",
        parseFloat(data.presupuesto) || 0,
        true
    ];
    
    sheet.appendRow(newRow);
    
    return { status: "success", message: `Servicio ${data.nombre} agregado correctamente` };
}

// ==============================================
// FUNCIONES DE PRESUPUESTOS
// ==============================================

// Obtener presupuestos por mes y año
function getPresupuestos(mes, año) {
    const sheetPresupuestos = getOrCreateSheet(HOJA_PRESUPUESTOS, PRESUPUESTOS_HEADERS);
    const sheetServicios = getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
    
    const serviciosData = sheetServicios.getDataRange().getValues();
    const serviciosMap = {};
    
    // Crear mapa de servicios
    for (let i = 1; i < serviciosData.length; i++) {
        serviciosMap[serviciosData[i][0]] = {
            nombre: serviciosData[i][1],
            color: serviciosData[i][2]
        };
    }
    
    const presupuestosData = sheetPresupuestos.getDataRange().getValues();
    const presupuestos = [];
    
    // Filtrar por mes y año si se especifican
    for (let i = 1; i < presupuestosData.length; i++) {
        const row = presupuestosData[i];
        
        if ((!mes || row[2] == mes) && (!año || row[3] == año)) {
            const servicio = serviciosMap[row[1]];
            if (servicio) {
                presupuestos.push({
                    servicio: servicio.nombre,
                    presupuesto: row[4],
                    gastado: row[5],
                    diferencia: row[6],
                    color: servicio.color
                });
            }
        }
    }
    
    // Si no hay presupuestos para este período, crear basado en servicios
    if (presupuestos.length === 0 && mes && año) {
        for (let i = 1; i < serviciosData.length; i++) {
            presupuestos.push({
                servicio: serviciosData[i][1],
                presupuesto: serviciosData[i][3],
                gastado: 0,
                diferencia: serviciosData[i][3],
                color: serviciosData[i][2]
            });
        }
    }
    
    return { status: "success", data: presupuestos };
}

// ==============================================
// FUNCIONES DEL DASHBOARD
// ==============================================

// Obtener datos para el dashboard
function getDashboardData() {
    const gastos = getGastos();
    const servicios = getServicios();
    
    return {
        status: "success",
        data: {
            gastos: gastos.data || [],
            servicios: servicios.data || []
        }
    };
}

// ==============================================
// FUNCIONES DE REPORTES
// ==============================================

// Generar reporte
function generarReporte(tipo) {
    const gastos = getGastos().data;
    
    let datos;
    
    switch(tipo) {
        case "mensual":
            datos = generarReporteMensual(gastos);
            break;
        case "anual":
            datos = generarReporteAnual(gastos);
            break;
        case "comparativo":
            datos = generarReporteComparativo(gastos);
            break;
        case "tendencias":
            datos = generarReporteTendencias(gastos);
            break;
        default:
            return { status: "error", message: "Tipo de reporte no válido" };
    }
    
    // Guardar en hoja de reportes
    guardarReporte(tipo, datos);
    
    return { status: "success", data: datos };
}

// Generar reporte mensual
function generarReporteMensual(gastos) {
    const reporte = {};
    
    gastos.forEach(gasto => {
        const key = `${gasto.mes}/${gasto.año}`;
        if (!reporte[key]) {
            reporte[key] = {
                Mes: getNombreMes(gasto.mes),
                Año: gasto.año,
                Total: 0,
                Cantidad: 0
            };
        }
        
        reporte[key].Total += parseFloat(gasto.monto);
        reporte[key].Cantidad++;
    });
    
    return Object.values(reporte).sort((a, b) => {
        if (a.Año !== b.Año) return a.Año - b.Año;
        return getNumeroMes(a.Mes) - getNumeroMes(b.Mes);
    });
}

// Generar reporte anual
function generarReporteAnual(gastos) {
    const reporte = {};
    
    gastos.forEach(gasto => {
        const año = gasto.año;
        if (!reporte[año]) {
            reporte[año] = {
                Año: año,
                Total: 0,
                Cantidad: 0,
                Promedio: 0
            };
        }
        
        reporte[año].Total += parseFloat(gasto.monto);
        reporte[año].Cantidad++;
    });
    
    // Calcular promedios
    Object.keys(reporte).forEach(año => {
        reporte[año].Promedio = reporte[año].Total / 12;
    });
    
    return Object.values(reporte).sort((a, b) => a.Año - b.Año);
}

// Generar reporte comparativo
function generarReporteComparativo(gastos) {
    const servicios = getServicios().data;
    const reporte = [];
    
    servicios.forEach(servicio => {
        const gastosServicio = gastos.filter(g => g.servicio === servicio.nombre);
        const total = gastosServicio.reduce((sum, g) => sum + parseFloat(g.monto), 0);
        const cantidad = gastosServicio.length;
        const promedio = cantidad > 0 ? total / cantidad : 0;
        
        reporte.push({
            Servicio: servicio.nombre,
            Total: total,
            Cantidad: cantidad,
            Promedio: promedio,
            Presupuesto: servicio.presupuesto,
            Diferencia: servicio.presupuesto - total
        });
    });
    
    return reporte;
}

// Generar reporte de tendencias
function generarReporteTendencias(gastos) {
    const tendencias = {};
    
    gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha);
        const semana = getNumeroSemana(fecha);
        const key = `${gasto.año}-W${semana}`;
        
        if (!tendencias[key]) {
            tendencias[key] = {
                Semana: key,
                Total: 0,
                Cantidad: 0
            };
        }
        
        tendencias[key].Total += parseFloat(gasto.monto);
        tendencias[key].Cantidad++;
    });
    
    return Object.values(tendencias).sort((a, b) => a.Semana.localeCompare(b.Semana));
}

// Guardar reporte
function guardarReporte(tipo, datos) {
    const sheet = getOrCreateSheet(HOJA_REPORTES, REPORTES_HEADERS);
    
    const newRow = [
        generateId(),
        tipo,
        new Date().toLocaleDateString(),
        JSON.stringify(datos),
        new Date()
    ];
    
    sheet.appendRow(newRow);
}

// ==============================================
// FUNCIONES DE EXPORTACIÓN
// ==============================================

// Exportar gastos a CSV
function exportarGastos() {
    const gastos = getGastos().data;
    let csv = "ID,Servicio,Monto,Fecha,Mes,Año,Descripción,Observaciones\n";
    
    gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha).toLocaleDateString();
        csv += `"${gasto.id}","${gasto.servicio}",${gasto.monto},"${fecha}",${gasto.mes},${gasto.año},"${gasto.descripcion || ''}","${gasto.observaciones || ''}"\n`;
    });
    
    return { status: "success", data: csv };
}

// ==============================================
// FUNCIONES DE INICIALIZACIÓN
// ==============================================

// Iniciar base de datos
function iniciarBaseDatos() {
    try {
        // Crear todas las hojas necesarias
        getOrCreateSheet(HOJA_GASTOS, GASTOS_HEADERS);
        getOrCreateSheet(HOJA_SERVICIOS, SERVICIOS_HEADERS);
        getOrCreateSheet(HOJA_PRESUPUESTOS, PRESUPUESTOS_HEADERS);
        getOrCreateSheet(HOJA_REPORTES, REPORTES_HEADERS);
        
        // Crear servicios por defecto si no existen
        const servicios = getServicios().data;
        if (servicios.length === 0) {
            crearServiciosPorDefecto();
        }
        
        return { status: "success", message: "Base de datos iniciada correctamente" };
    } catch (error) {
        return { status: "error", message: error.toString() };
    }
}

// Resetear base de datos
function resetearBaseDatos() {
    try {
        const ss = getSpreadsheet();
        
        // Eliminar todas las hojas excepto la primera
        const sheets = ss.getSheets();
        sheets.forEach(sheet => {
            const name = sheet.getName();
            if (name !== "Hoja 1") {
                ss.deleteSheet(sheet);
            }
        });
        
        // Volver a iniciar
        return iniciarBaseDatos();
    } catch (error) {
        return { status: "error", message: error.toString() };
    }
}

// ==============================================
// FUNCIONES UTILITARIAS
// ==============================================

// Obtener nombre del mes
function getNombreMes(numero) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[numero - 1] || "Desconocido";
}

// Obtener número del mes
function getNumeroMes(nombre) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses.indexOf(nombre) + 1;
}

// Obtener número de semana
function getNumeroSemana(fecha) {
    const date = new Date(fecha);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Función para propósitos de prueba
function test() {
    Logger.log("Función de prueba ejecutada");
    return "OK";
}