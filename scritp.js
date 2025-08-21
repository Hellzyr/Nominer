// --- FUNCIÓN DE CÁLCULO DE NÓMINA ---
function calcularNomina() {
    // Constantes (valores de referencia para el año 2025)
    const SALARIO_MINIMO_2025 = 1423500;
    const AUXILIO_TRANSPORTE_2025 = 200000;

    // Obtener valores del formulario
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    const diasTrabajados = parseInt(document.getElementById('diasTrabajados').value) || 0;
    const horasExtras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
    const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
    const libranzas = parseFloat(document.getElementById('libranzas').value) || 0;
    const retenciones = parseFloat(document.getElementById('retenciones').value) || 0;

    // --- CÁLCULO DE LIQUIDACIÓN DE CONTRATO ---
    const fechaInicioStr = document.getElementById('fechaInicioContrato').value;
    const fechaFinStr = document.getElementById('fechaFinContrato').value;
    let liquidacionData = null;
    let totalDevengadoLiquidacion = 0;
    
    if (fechaInicioStr && fechaFinStr) {
        const fechaInicio = new Date(fechaInicioStr + 'T00:00:00');
        const fechaFin = new Date(fechaFinStr + 'T00:00:00');
        
        // Calcular días laborados en el último período
        const diffTime = Math.abs(fechaFin - fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diasLiquidar = diffDays;

        // Calcular valores proporcionales
        const salarioProporcional = (salarioBase / 360) * diasLiquidar;
        const cesantiasLiquidadas = (salarioBase * diasLiquidar) / 360;
        const interesesCesantiasLiquidados = (cesantiasLiquidadas * diasLiquidar * 0.12) / 360;
        const primaLiquidada = (salarioBase * diasLiquidar) / 360;
        const vacacionesLiquidadas = (salarioBase * diasLiquidar) / 720;
        
        // Indemnización (ejemplo simplificado)
        const causaTerminacion = document.getElementById('causaTerminacion').value;
        let indemnizacion = 0;
        if (causaTerminacion === "sin_justa") {
            indemnizacion = salarioBase; // Simplificación, el cálculo real es complejo
        }
        
        totalDevengadoLiquidacion = salarioProporcional + cesantiasLiquidadas + interesesCesantiasLiquidados + primaLiquidada + vacacionesLiquidadas + indemnizacion;
        
        liquidacionData = {
            diasLiquidar: diasLiquidar,
            cesantias: cesantiasLiquidadas,
            interesesCesantias: interesesCesantiasLiquidados,
            prima: primaLiquidada,
            vacaciones: vacacionesLiquidadas,
            indemnizacion: indemnizacion,
            total: totalDevengadoLiquidacion
        };
    }

    // Cálculos principales de nómina mensual (independientes de la liquidación)
    let sueldoDevengado = (salarioBase / 30) * diasTrabajados;
    let auxilioTransporte = (salarioBase < (SALARIO_MINIMO_2025 * 2)) ? AUXILIO_TRANSPORTE_2025 : 0;
    
    const deduccionSalud = sueldoDevengado * 0.04;
    const deduccionPension = sueldoDevengado * 0.04;

    // Cálculos de Provisiones (mensuales)
    const cesantias = (sueldoDevengado + auxilioTransporte) * 0.0833;
    const interesesCesantias = cesantias * 0.01;
    const primaServicios = (sueldoDevengado + auxilioTransporte) * 0.0833;
    const vacaciones = sueldoDevengado * 0.0417;

    // Totales
    const totalDevengado = sueldoDevengado + auxilioTransporte + horasExtras + comisiones + bonificaciones + totalDevengadoLiquidacion;
    const totalDeducciones = deduccionSalud + deduccionPension + libranzas + retenciones;
    const netoPagar = totalDevengado - totalDeducciones;

    return {
        sueldo: sueldoDevengado,
        auxilio_transporte: auxilioTransporte,
        horas_extras: horasExtras,
        comisiones: comisiones,
        bonificaciones: bonificaciones,
        salud: deduccionSalud,
        pension: deduccionPension,
        libranzas: libranzas,
        retenciones: retenciones,
        cesantias: cesantias,
        interesesCesantias: interesesCesantias,
        primaServicios: primaServicios,
        vacaciones: vacaciones,
        totalDevengado: totalDevengado,
        totalDeducciones: totalDeducciones,
        netoPagar: netoPagar,
        liquidacionData: liquidacionData
    };
}

// --- FUNCIÓN PARA ACTUALIZAR LOS CAMPOS DE RESUMEN ---
function actualizarResumen() {
    const resultados = calcularNomina();
    
    // Actualizar resumen de nómina
    document.getElementById('totalDevengadoDisplay').textContent = resultados.totalDevengado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    document.getElementById('totalDeduccionesDisplay').textContent = resultados.totalDeducciones.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    document.getElementById('netoPagarDisplay').textContent = resultados.netoPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    
    // Actualizar provisiones mensuales
    document.getElementById('cesantiasDisplay').textContent = resultados.cesantias.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    document.getElementById('interesesCesantiasDisplay').textContent = resultados.interesesCesantias.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    document.getElementById('primaServiciosDisplay').textContent = resultados.primaServicios.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    document.getElementById('vacacionesDisplay').textContent = resultados.vacaciones.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

    // Actualizar resultados de liquidación (si existen)
    const liquidacionResultadosDiv = document.getElementById('liquidacionResultados');
    if (resultados.liquidacionData) {
        document.getElementById('diasLiquidarDisplay').textContent = resultados.liquidacionData.diasLiquidar;
        document.getElementById('vacacionesLiquidadasDisplay').textContent = resultados.liquidacionData.vacaciones.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('cesantiasLiquidadasDisplay').textContent = resultados.liquidacionData.cesantias.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('primaLiquidadaDisplay').textContent = resultados.liquidacionData.prima.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('indemnizacionDisplay').textContent = resultados.liquidacionData.indemnizacion.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        liquidacionResultadosDiv.classList.remove('hidden');
    } else {
        liquidacionResultadosDiv.classList.add('hidden');
    }
}

// --- FUNCIÓN DE GENERACIÓN DE XML ---
function generarXML(datos) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString("<NominaElectronica/>", "text/xml");
    const root = xmlDoc.documentElement;
    
    // Atributos de ejemplo para DIAN
    root.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    root.setAttribute("xmlns", "http://facturaelectronica.dian.gov.co/dian/apn");
    root.setAttribute("version", "1.0");
    root.setAttribute("periodoInicio", datos.fechaInicioContrato);
    root.setAttribute("periodoFin", new Date().toISOString().slice(0, 10)); // Usando fecha actual como proxy
    root.setAttribute("numeroNomina", "1");
    
    // Datos del Empleador
    const empleador = xmlDoc.createElement("Empleador");
    empleador.setAttribute("nit", datos.nit);
    empleador.setAttribute("razonSocial", datos.razonSocial);
    root.appendChild(empleador);
    
    // Datos del Empleado
    const empleadoElem = xmlDoc.createElement("Empleado");
    empleadoElem.setAttribute("tipoDocumento", datos.tipoDocumento);
    empleadoElem.setAttribute("identificacion", datos.identificacion);
    empleadoElem.setAttribute("primerNombre", datos.nombreEmpleado);
    empleadoElem.setAttribute("cargo", datos.cargo);
    empleadoElem.setAttribute("tipoContrato", datos.tipoContrato);
    empleadoElem.setAttribute("fechaInicioContrato", datos.fechaInicioContrato);
    empleadoElem.setAttribute("centroCosto", datos.centroCosto);
    root.appendChild(empleadoElem);
    
    // Conceptos de Devengados
    const devengados = xmlDoc.createElement("Devengados");
    devengados.appendChild(xmlDoc.createElement("Sueldo")).setAttribute("valor", Math.round(datos.sueldo).toString());
    devengados.appendChild(xmlDoc.createElement("AuxilioTransporte")).setAttribute("valor", Math.round(datos.auxilio_transporte).toString());
    devengados.appendChild(xmlDoc.createElement("HorasExtras")).setAttribute("valor", Math.round(datos.horas_extras).toString());
    devengados.appendChild(xmlDoc.createElement("Comisiones")).setAttribute("valor", Math.round(datos.comisiones).toString());
    devengados.appendChild(xmlDoc.createElement("Bonificaciones")).setAttribute("valor", Math.round(datos.bonificaciones).toString());
    root.appendChild(devengados);
    
    // Conceptos de Deducciones
    const deducciones = xmlDoc.createElement("Deducciones");
    deducciones.appendChild(xmlDoc.createElement("Salud")).setAttribute("valor", Math.round(datos.salud).toString());
    deducciones.appendChild(xmlDoc.createElement("Pension")).setAttribute("valor", Math.round(datos.pension).toString());
    deducciones.appendChild(xmlDoc.createElement("Libranzas")).setAttribute("valor", Math.round(datos.libranzas).toString());
    deducciones.appendChild(xmlDoc.createElement("Retenciones")).setAttribute("valor", Math.round(datos.retenciones).toString());
    root.appendChild(deducciones);

    // Provisiones y Prestaciones (mensuales)
    const provisiones = xmlDoc.createElement("Provisiones");
    provisiones.appendChild(xmlDoc.createElement("Cesantias")).setAttribute("valor", Math.round(datos.cesantias).toString());
    provisiones.appendChild(xmlDoc.createElement("InteresesCesantias")).setAttribute("valor", Math.round(datos.interesesCesantias).toString());
    provisiones.appendChild(xmlDoc.createElement("PrimaServicios")).setAttribute("valor", Math.round(datos.primaServicios).toString());
    provisiones.appendChild(xmlDoc.createElement("Vacaciones")).setAttribute("valor", Math.round(datos.vacaciones).toString());
    root.appendChild(provisiones);

    // Liquidación de Contrato (si se aplica)
    if (datos.liquidacionData) {
        const liquidacion = xmlDoc.createElement("LiquidacionContrato");
        liquidacion.appendChild(xmlDoc.createElement("FechaFin")).setAttribute("valor", datos.fechaFinContrato);
        liquidacion.appendChild(xmlDoc.createElement("DiasLiquidar")).setAttribute("valor", datos.liquidacionData.diasLiquidar.toString());
        liquidacion.appendChild(xmlDoc.createElement("VacacionesLiquidadas")).setAttribute("valor", Math.round(datos.liquidacionData.vacaciones).toString());
        liquidacion.appendChild(xmlDoc.createElement("CesantiasLiquidadas")).setAttribute("valor", Math.round(datos.liquidacionData.cesantias).toString());
        liquidacion.appendChild(xmlDoc.createElement("PrimaLiquidada")).setAttribute("valor", Math.round(datos.liquidacionData.prima).toString());
        liquidacion.appendChild(xmlDoc.createElement("Indemnizacion")).setAttribute("valor", Math.round(datos.liquidacionData.indemnizacion).toString());
        root.appendChild(liquidacion);
    }
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}

// --- MANEJO DEL FORMULARIO Y VALIDACIONES ---
document.getElementById('nominaForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-[#132F63]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Cargando...
    `;
    submitButton.disabled = true;

    setTimeout(() => {
        const formInputs = {
            nit: document.getElementById('nit').value,
            razonSocial: document.getElementById('razonSocial').value,
            nombreEmpleado: document.getElementById('nombreEmpleado').value,
            tipoDocumento: document.getElementById('tipoDocumento').value,
            identificacion: document.getElementById('identificacion').value,
            cargo: document.getElementById('cargo').value,
            tipoContrato: document.getElementById('tipoContrato').value,
            fechaInicioContrato: document.getElementById('fechaInicioContrato').value,
            centroCosto: document.getElementById('centroCosto').value,
            salarioBase: parseFloat(document.getElementById('salarioBase').value),
            diasTrabajados: parseInt(document.getElementById('diasTrabajados').value),
            fechaFinContrato: document.getElementById('fechaFinContrato').value,
            causaTerminacion: document.getElementById('causaTerminacion').value
        };

        // Simple validation check
        for (const key in formInputs) {
             if (!formInputs[key] && key !== 'horasExtras' && key !== 'comisiones' && key !== 'bonificaciones' && key !== 'libranzas' && key !== 'retenciones' && key !== 'fechaFinContrato' && key !== 'causaTerminacion') {
                 showToast(`Por favor, completa el campo '${key}'.`, "red");
                 submitButton.innerHTML = "Generar Nómina";
                 submitButton.disabled = false;
                 return;
             }
        }
         if (isNaN(formInputs.salarioBase) || isNaN(formInputs.diasTrabajados) || formInputs.salarioBase <= 0 || formInputs.diasTrabajados <= 0) {
             showToast("Por favor, ingresa valores numéricos válidos (mayores a 0) para salario y días trabajados.", "red");
             submitButton.innerHTML = "Generar Nómina";
             submitButton.disabled = false;
             return;
         }


        const resultados = calcularNomina();
        
        // Actualizar la vista de resultados
        document.getElementById('totalDevengadoDisplay').textContent = resultados.totalDevengado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('totalDeduccionesDisplay').textContent = resultados.totalDeducciones.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('netoPagarDisplay').textContent = resultados.netoPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('cesantiasDisplay').textContent = resultados.cesantias.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('interesesCesantiasDisplay').textContent = resultados.interesesCesantias.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('primaServiciosDisplay').textContent = resultados.primaServicios.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('vacacionesDisplay').textContent = resultados.vacaciones.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

        const xmlString = generarXML({ ...formInputs, ...resultados });
        document.getElementById('xmlOutput').textContent = xmlString;

        document.getElementById('resultsContainer').classList.remove('hidden');
        submitButton.innerHTML = "Generar Nómina";
        submitButton.disabled = false;
        showToast("¡Nómina generada con éxito!", "green");
    }, 1000); // Simulación de carga
});

// Add event listeners for key inputs to update the summary in real-time
['salarioBase', 'diasTrabajados', 'horasExtras', 'comisiones', 'bonificaciones', 'libranzas', 'retenciones', 'fechaFinContrato'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', actualizarResumen);
    }
});

// --- MANEJO DE BOTONES ---
document.getElementById('copyButton').addEventListener('click', function() {
    const xmlContent = document.getElementById('xmlOutput').textContent;
    try {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = xmlContent;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        showToast("XML copiado al portapapeles!", "green");
    } catch (err) {
        showToast("Error al intentar copiar el XML.", "red");
    }
});

document.getElementById('downloadButton').addEventListener('click', function() {
    const xmlContent = document.getElementById('xmlOutput').textContent;
    const filename = `nomina_${document.getElementById('identificacion').value}.xml`;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("XML descargado con éxito!", "green");
});

// --- MANEJO DE NOTIFICACIONES TOAST ---
function showToast(message, type = "red") {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    
    toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-md shadow-lg text-white text-center transition-all duration-300 ease-in-out z-50`;
    toast.classList.remove('hidden');

    if (type === "green") {
        toast.style.backgroundColor = '#27AE60';
    } else {
        toast.style.backgroundColor = '#F6554D';
    }

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
}
