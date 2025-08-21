// --- Parámetros base (ajústalos por año) ---
const SALARIO_MINIMO_2025 = 1423500;
const AUXILIO_TRANSPORTE_2025 = 200000;

// --- Cálculo de nómina ---
function calcularNomina() {
  const salarioBase = +document.getElementById('salarioBase').value || 0;
  const diasTrabajados = +document.getElementById('diasTrabajados').value || 0;

  // Otros devengados ingresados como valor monetario directo
  const horasExtras = +document.getElementById('horasExtras').value || 0;
  const recargosNocturnos = +document.getElementById('recargosNocturnos').value || 0;
  const dominicalesFestivos = +document.getElementById('dominicalesFestivos').value || 0;
  const propinas = +document.getElementById('propinas').value || 0;
  const comisiones = +document.getElementById('comisiones').value || 0;
  const bonificaciones = +document.getElementById('bonificaciones').value || 0;

  const libranzas = +document.getElementById('libranzas').value || 0;
  const retenciones = +document.getElementById('retenciones').value || 0;

  // Sueldo proporcional al periodo trabajado
  const sueldoDevengado = (salarioBase / 30) * diasTrabajados;

  // Auxilio de transporte (si gana <= 2 SMMLV)
  const auxilioTransporte = salarioBase <= (SALARIO_MINIMO_2025 * 2) ? AUXILIO_TRANSPORTE_2025 : 0;

  // Deducciones obligatorias estándar (empleado)
  const deduccionSalud = sueldoDevengado * 0.04;
  const deduccionPension = sueldoDevengado * 0.04;

  // Provisiones mensuales (contables)
  const cesantias = (sueldoDevengado + auxilioTransporte) * 0.0833;
  const interesesCesantias = cesantias * 0.01; // ~1% mensual aprox (12% anual prorr.)
  const primaServicios = (sueldoDevengado + auxilioTransporte) * 0.0833;
  const vacaciones = sueldoDevengado * 0.0417;

  // Liquidación (opcional) — cálculo simple proporcional
  const fechaInicioStr = document.getElementById('fechaInicioContrato').value;
  const fechaFinStr = document.getElementById('fechaFinContrato').value;
  let liquidacionData = null;
  let totalDevengadoLiquidacion = 0;

  if (fechaInicioStr && fechaFinStr) {
    const fi = new Date(fechaInicioStr + 'T00:00:00');
    const ff = new Date(fechaFinStr + 'T00:00:00');
    const diffDays = Math.max(0, Math.ceil(Math.abs(ff - fi) / (1000 * 60 * 60 * 24)));
    const salarioProporcional = (salarioBase / 360) * diffDays;
    const cesantiasLiquidadas = (salarioBase * diffDays) / 360;
    const interesesCesantiasLiquidados = (cesantiasLiquidadas * diffDays * 0.12) / 360;
    const primaLiquidada = (salarioBase * diffDays) / 360;
    const vacacionesLiquidadas = (salarioBase * diffDays) / 720;

    let indemnizacion = 0;
    const causaTerminacion = document.getElementById('causaTerminacion').value;
    if (causaTerminacion === 'sin_justa') {
      indemnizacion = salarioBase; // simplificado (las reglas reales dependen de antigüedad)
    }

    totalDevengadoLiquidacion =
      salarioProporcional + cesantiasLiquidadas + interesesCesantiasLiquidados +
      primaLiquidada + vacacionesLiquidadas + indemnizacion;

    liquidacionData = {
      diasLiquidar: diffDays,
      cesantias: cesantiasLiquidadas,
      interesesCesantias: interesesCesantiasLiquidados,
      prima: primaLiquidada,
      vacaciones: vacacionesLiquidadas,
      indemnizacion,
      total: totalDevengadoLiquidacion
    };
  }

  const totalDevengado =
    sueldoDevengado + auxilioTransporte + horasExtras + recargosNocturnos +
    dominicalesFestivos + propinas + comisiones + bonificaciones + totalDevengadoLiquidacion;

  const totalDeducciones = deduccionSalud + deduccionPension + libranzas + retenciones;
  const netoPagar = totalDevengado - totalDeducciones;

  return {
    sueldo: sueldoDevengado,
    auxilio_transporte: auxilioTransporte,
    horas_extras: horasExtras,
    recargosNocturnos,
    dominicalesFestivos,
    propinas,
    comisiones,
    bonificaciones,
    salud: deduccionSalud,
    pension: deduccionPension,
    libranzas,
    retenciones,
    cesantias,
    interesesCesantias,
    primaServicios,
    vacaciones,
    totalDevengado,
    totalDeducciones,
    netoPagar,
    liquidacionData
  };
}

// Actualiza tarjetas de resumen y sección de liquidación
function actualizarResumen() {
  const r = calcularNomina();
  const fmt = v => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

  document.getElementById('totalDevengadoDisplay').textContent = fmt(r.totalDevengado);
  document.getElementById('totalDeduccionesDisplay').textContent = fmt(r.totalDeducciones);
  document.getElementById('netoPagarDisplay').textContent = fmt(r.netoPagar);

  document.getElementById('cesantiasDisplay').textContent = fmt(r.cesantias);
  document.getElementById('interesesCesantiasDisplay').textContent = fmt(r.interesesCesantias);
  document.getElementById('primaServiciosDisplay').textContent = fmt(r.primaServicios);
  document.getElementById('vacacionesDisplay').textContent = fmt(r.vacaciones);

  const block = document.getElementById('liquidacionResultados');
  if (r.liquidacionData) {
    document.getElementById('diasLiquidarDisplay').textContent = r.liquidacionData.diasLiquidar;
    document.getElementById('vacacionesLiquidadasDisplay').textContent = fmt(r.liquidacionData.vacaciones);
    document.getElementById('cesantiasLiquidadasDisplay').textContent = fmt(r.liquidacionData.cesantias);
    document.getElementById('primaLiquidadaDisplay').textContent = fmt(r.liquidacionData.prima);
    document.getElementById('indemnizacionDisplay').textContent = fmt(r.liquidacionData.indemnizacion);
    block.classList.remove('hidden');
  } else {
    block.classList.add('hidden');
  }
}

// --- Generación de XML (estructura base UBL DIAN-like) ---
function generarXML(input, calculo) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString('<NominaElectronica/>', 'text/xml');
  const root = xmlDoc.documentElement;

  // Namespaces y metadatos mínimos (placeholders)
  root.setAttribute('xmlns', 'urn:dian:gov:co:facturaelectronica:NominaIndividual');
  root.setAttribute('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
  root.setAttribute('xmlns:cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
  root.setAttribute('version', '1.0');

  // Encabezado
  const enc = xmlDoc.createElement('Encabezado');
  enc.appendChild(elem(xmlDoc, 'NumeroNomina', '1'));
  enc.appendChild(elem(xmlDoc, 'PeriodoInicio', input.periodoInicio));
  enc.appendChild(elem(xmlDoc, 'PeriodoFin', input.periodoFin));
  enc.appendChild(elem(xmlDoc, 'FechaGeneracion', new Date().toISOString().slice(0,10)));
  enc.appendChild(elem(xmlDoc, 'FormaPago', input.formaPago));
  root.appendChild(enc);

  // Empleador
  const emp = xmlDoc.createElement('Empleador');
  emp.appendChild(elem(xmlDoc, 'NIT', input.nit));
  emp.appendChild(elem(xmlDoc, 'RazonSocial', input.razonSocial));
  emp.appendChild(elem(xmlDoc, 'Direccion', input.direccion || ''));
  emp.appendChild(elem(xmlDoc, 'Municipio', input.municipio || ''));
  emp.appendChild(elem(xmlDoc, 'CodigoPostal', input.codigoPostal || ''));
  root.appendChild(emp);

  // Empleado
  const per = xmlDoc.createElement('Empleado');
  per.appendChild(elem(xmlDoc, 'TipoDocumento', input.tipoDocumento));
  per.appendChild(elem(xmlDoc, 'Identificacion', input.identificacion));
  per.appendChild(elem(xmlDoc, 'Nombre', input.nombreEmpleado));
  per.appendChild(elem(xmlDoc, 'Cargo', input.cargo));
  per.appendChild(elem(xmlDoc, 'TipoContrato', input.tipoContrato));
  per.appendChild(elem(xmlDoc, 'FechaInicioContrato', input.fechaInicioContrato));
  per.appendChild(elem(xmlDoc, 'CentroCosto', input.centroCosto));
  root.appendChild(per);

  // Devengados
  const dev = xmlDoc.createElement('Devengados');
  dev.appendChild(money(xmlDoc, 'Sueldo', calculo.sueldo));
  dev.appendChild(money(xmlDoc, 'AuxilioTransporte', calculo.auxilio_transporte));
  dev.appendChild(money(xmlDoc, 'HorasExtras', calculo.horas_extras));
  dev.appendChild(money(xmlDoc, 'RecargosNocturnos', calculo.recargosNocturnos));
  dev.appendChild(money(xmlDoc, 'DominicalesFestivos', calculo.dominicalesFestivos));
  dev.appendChild(money(xmlDoc, 'Propinas', calculo.propinas));
  dev.appendChild(money(xmlDoc, 'Comisiones', calculo.comisiones));
  dev.appendChild(money(xmlDoc, 'Bonificaciones', calculo.bonificaciones));
  root.appendChild(dev);

  // Deducciones
  const ded = xmlDoc.createElement('Deducciones');
  ded.appendChild(money(xmlDoc, 'Salud', calculo.salud));
  ded.appendChild(money(xmlDoc, 'Pension', calculo.pension));
  ded.appendChild(money(xmlDoc, 'Libranzas', calculo.libranzas));
  ded.appendChild(money(xmlDoc, 'Retencion', calculo.retenciones));
  root.appendChild(ded);

  // Provisiones
  const prov = xmlDoc.createElement('Provisiones');
  prov.appendChild(money(xmlDoc, 'Cesantias', calculo.cesantias));
  prov.appendChild(money(xmlDoc, 'InteresesCesantias', calculo.interesesCesantias));
  prov.appendChild(money(xmlDoc, 'PrimaServicios', calculo.primaServicios));
  prov.appendChild(money(xmlDoc, 'Vacaciones', calculo.vacaciones));
  root.appendChild(prov);

  // Liquidación (si aplica)
  if (calculo.liquidacionData) {
    const liq = xmlDoc.createElement('LiquidacionContrato');
    liq.appendChild(elem(xmlDoc, 'FechaFin', input.fechaFinContrato));
    liq.appendChild(elem(xmlDoc, 'DiasLiquidar', calculo.liquidacionData.diasLiquidar));
    liq.appendChild(money(xmlDoc, 'VacacionesLiquidadas', calculo.liquidacionData.vacaciones));
    liq.appendChild(money(xmlDoc, 'CesantiasLiquidadas', calculo.liquidacionData.cesantias));
    liq.appendChild(money(xmlDoc, 'PrimaLiquidada', calculo.liquidacionData.prima));
    liq.appendChild(money(xmlDoc, 'Indemnizacion', calculo.liquidacionData.indemnizacion));
    root.appendChild(liq);
  }

  // Totales
  const tot = xmlDoc.createElement('Totales');
  tot.appendChild(money(xmlDoc, 'TotalDevengado', calculo.totalDevengado));
  tot.appendChild(money(xmlDoc, 'TotalDeducciones', calculo.totalDeducciones));
  tot.appendChild(money(xmlDoc, 'NetoPagar', calculo.netoPagar));
  root.appendChild(tot);

  // Metadatos DIAN (placeholders para firma y proveedor tecnológico)
  const meta = xmlDoc.createElement('DIAN');
  meta.appendChild(elem(xmlDoc, 'SoftwareID', 'PROVEEDOR_TECH_SOFTID')); // reemplaza por el tuyo
  meta.appendChild(elem(xmlDoc, 'SoftwarePIN', 'XXXX'));                  // reemplaza por tu pin
  meta.appendChild(elem(xmlDoc, 'CUFE', 'CUFE-O-UUID-AQUI'));            // calculado al firmar
  meta.appendChild(elem(xmlDoc, 'FirmaDigital', '-----BEGIN SIGNATURE-----...'));
  root.appendChild(meta);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

// Helpers XML
function elem(doc, name, value) {
  const e = doc.createElement(name);
  if (value !== undefined && value !== null) e.textContent = String(value);
  return e;
}
function money(doc, name, value) {
  const e = doc.createElement(name);
  e.setAttribute('moneda', 'COP');
  e.textContent = Math.round(+value || 0);
  return e;
}

// Manejo del formulario
document.getElementById('nominaForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const submitButton = document.getElementById('submitButton');
  submitButton.disabled = true;
  submitButton.textContent = 'Generando…';

  const inputs = {
    nit: document.getElementById('nit').value,
    razonSocial: document.getElementById('razonSocial').value,
    direccion: document.getElementById('direccion').value,
    municipio: document.getElementById('municipio').value,
    codigoPostal: document.getElementById('codigoPostal').value,
    periodoInicio: document.getElementById('periodoInicio').value,
    periodoFin: document.getElementById('periodoFin').value,
    formaPago: document.getElementById('formaPago').value,

    nombreEmpleado: document.getElementById('nombreEmpleado').value,
    tipoDocumento: document.getElementById('tipoDocumento').value,
    identificacion: document.getElementById('identificacion').value,
    cargo: document.getElementById('cargo').value,
    tipoContrato: document.getElementById('tipoContrato').value,
    fechaInicioContrato: document.getElementById('fechaInicioContrato').value,
    centroCosto: document.getElementById('centroCosto').value,
    fechaFinContrato: document.getElementById('fechaFinContrato').value
  };

  // Validaciones rápidas
  for (const [k, v] of Object.entries(inputs)) {
    if (!v && ['direccion','municipio','codigoPostal','fechaFinContrato'].includes(k) === false) {
      showToast(`Completa el campo: ${k}`, 'red');
      submitButton.disabled = false;
      submitButton.textContent = 'Generar Nómina';
      return;
    }
  }

  const resultados = calcularNomina();
  // Pinta resumen
  actualizarResumen();

  // Genera XML
  const xml = generarXML(inputs, resultados);
  document.getElementById('xmlOutput').textContent = xml;
  document.getElementById('resultsContainer').classList.remove('hidden');

  submitButton.disabled = false;
  submitButton.textContent = 'Generar Nómina';
  showToast('¡Nómina generada con éxito!', 'green');
});

// Actualizaciones en tiempo real
[
  'salarioBase','diasTrabajados','horasExtras','recargosNocturnos','dominicalesFestivos',
  'propinas','comisiones','bonificaciones','libranzas','retenciones','fechaFinContrato'
].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', actualizarResumen);
});

// Copiar / Descargar
document.getElementById('copyButton').addEventListener('click', () => {
  const txt = document.getElementById('xmlOutput').textContent;
  const ta = document.createElement('textarea');
  ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy');
  ta.remove(); showToast('XML copiado al portapapeles', 'green');
});
document.getElementById('downloadButton').addEventListener('click', () => {
  const xml = document.getElementById('xmlOutput').textContent;
  const filename = `nomina_${document.getElementById('identificacion').value}.xml`;
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('XML descargado', 'green');
});

// Toast
function showToast(message, color = 'red') {
  const box = document.getElementById('toast');
  const msg = document.getElementById('toast-message');
  msg.textContent = message;
  box.classList.remove('hidden');
  box.style.backgroundColor = color === 'green' ? '#27AE60' : '#F6554D';
  setTimeout(() => box.classList.add('hidden'), 4000);
}
