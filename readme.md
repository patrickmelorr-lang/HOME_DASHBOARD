# Gestor de Gastos del Hogar

Sistema web para gestionar gastos de servicios del hogar (Luz, Agua, Internet, Gas, etc.) usando Google Apps Script y Google Sheets como base de datos.

## Características

- ✅ Dashboard interactivo con gráficos
- ✅ Registro de gastos desde la misma interfaz
- ✅ Control de presupuestos por servicio
- ✅ Historial completo de gastos
- ✅ Filtros avanzados por fecha y servicio
- ✅ Reportes mensuales y anuales
- ✅ Exportación de datos a CSV
- ✅ Configuración personalizable de servicios

## Instalación

1. **Crear una nueva hoja de cálculo de Google**
   - Nombre: "Gestor de Gastos del Hogar"
   - Guardar el ID de la hoja (aparece en la URL)

2. **Configurar Google Apps Script**
   - En la hoja de cálculo, ir a Extensiones → Apps Script
   - Pegar el código de `SG_1.js`
   - Reemplazar `SPREADSHEET_ID` con el ID de tu hoja
   - Guardar el proyecto

3. **Desplegar como Web App**
   - Ir a Deploy → New deployment
   - Tipo: Web App
   - Ejecutar como: Yo (tu cuenta)
   - Quién tiene acceso: Cualquiera
   - Copiar la URL generada

4. **Configurar los archivos web**
   - Descargar los 4 archivos (ESTILO_HOGAR.css, INDEX_HOGAR.html, SCRIPT_1.js, SG_1.js)
   - Reemplazar `TU_URL_DE_WEB_APP_AQUI` en `SCRIPT_1.js` con tu URL de Web App
   - Subir a tu servidor web o usar localmente

## Estructura de archivos

- `INDEX_HOGAR.html` - Interfaz principal del dashboard
- `ESTILO_HOGAR.css` - Estilos CSS personalizados
- `SCRIPT_1.js` - Lógica del frontend y comunicación con Google Apps Script
- `SG_1.js` - Código de Google Apps Script (backend)

## Uso

1. **Primer uso**: Click en "Configurar Servicios" y luego "Iniciar Base de Datos"
2. **Registrar gastos**: Ir a "Registrar Gasto", completar formulario y guardar
3. **Ver estadísticas**: Dashboard muestra gráficos y resúmenes automáticamente
4. **Generar reportes**: Sección "Reportes" para análisis detallados

## Personalización

- **Servicios**: Modificar en sección "Configurar Servicios"
- **Colores**: Editar códigos HEX en la configuración de servicios
- **Presupuestos**: Ajustar montos mensuales por servicio

## Notas

- Los datos se guardan automáticamente en Google Sheets
- No requiere base de datos externa
- Funciona completamente en la nube
- Accesible desde cualquier dispositivo con navegador web
