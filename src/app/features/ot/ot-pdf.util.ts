import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import { Cliente, Diagnostico, Motocicleta, NivelCombustible, OrdenTrabajo, Usuario } from '../../core/models/models';

const PLANTILLA_URL = 'assets/orden-trabajo-template.pdf';

export interface DatosOTParaPdf {
  ot: OrdenTrabajo;
  cliente: Cliente;
  moto: Motocicleta;
  diagnostico?: Diagnostico;
  mecanico?: Usuario;
  asesor?: Usuario;
  insumosTexto?: string;
}

// Coordenadas medidas por análisis de píxeles directamente sobre la plantilla oficial
// (centro real de cada círculo detectado programáticamente, no estimado a ojo).
const NIVELES_Y: Record<NivelCombustible, number> = { E: 0.1953, '1/4': 0.2163, '1/2': 0.2377, '3/4': 0.2593, F: 0.2808 };
const NIVEL_X = 0.9092;

/** Descarga la Orden de Trabajo llenada sobre la plantilla oficial (orden-trabajo-template.pdf). Todo el texto se imprime en negrita, con el mismo formato que el N° de OT. */
export async function descargarOtPdf(datos: DatosOTParaPdf): Promise<void> {
  const bytes = await fetch(PLANTILLA_URL).then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const { width: W, height: H } = page.getSize();

  const fuente = await doc.embedFont(StandardFonts.HelveticaBold);
  const tinta = rgb(0.09, 0.11, 0.25);

  const px = (fx: number) => fx * W;
  const py = (fy: number) => H - fy * H;

  function texto(fx: number, fy: number, valor: string, tam = 8): void {
    if (!valor) return;
    page.drawText(valor, { x: px(fx), y: py(fy), size: tam, font: fuente, color: tinta });
  }

  function textoCentrado(fx: number, fy: number, valor: string, tam = 7.5): void {
    const w = fuente.widthOfTextAtSize(valor, tam);
    page.drawText(valor, { x: px(fx) - w / 2, y: py(fy) - tam * 0.32, size: tam, font: fuente, color: tinta });
  }

  function envolver(valor: string, fuenteUsar: PDFFont, tam: number, anchoMaxPt: number): string[] {
    const palabras = valor.split(/\s+/).filter(Boolean);
    const lineas: string[] = [];
    let actual = '';
    for (const palabra of palabras) {
      const intento = actual ? `${actual} ${palabra}` : palabra;
      if (fuenteUsar.widthOfTextAtSize(intento, tam) <= anchoMaxPt) {
        actual = intento;
      } else {
        if (actual) lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  function textoMultilinea(fx: number, fyInicio: number, valor: string, opts: { tam?: number; espaciado?: number; anchoFraccion?: number; maxLineas?: number }): void {
    if (!valor) return;
    const tam = opts.tam ?? 7.5;
    const espaciado = opts.espaciado ?? 0.032;
    const anchoPt = W * (opts.anchoFraccion ?? 0.42);
    const maxLineas = opts.maxLineas ?? 4;
    const lineas = envolver(valor, fuente, tam, anchoPt).slice(0, maxLineas);
    lineas.forEach((linea, i) => texto(fx, fyInicio + i * espaciado, linea, tam));
  }

  const { ot, cliente, moto, diagnostico, mecanico, asesor, insumosTexto } = datos;

  // Cabecera
  texto(0.62, 0.130, ot.numeroOT, 9);

  // Información del propietario
  texto(0.245, 0.211, `${cliente.nombres} ${cliente.apellidos}`);
  texto(0.095, 0.242, cliente.dni);
  texto(0.30, 0.242, cliente.celular);
  texto(0.135, 0.279, new Date(ot.creadoEn).toLocaleDateString('es-PE'));

  // Información de la unidad
  texto(0.505, 0.211, moto.placa);
  texto(0.680, 0.211, moto.marca);
  texto(0.508, 0.242, moto.modelo);
  texto(0.472, 0.279, String(moto.kmActual ?? ''));
  texto(0.678, 0.279, String(moto.anio ?? ''));

  // Nivel de combustible (marca el círculo correspondiente)
  textoCentrado(NIVEL_X, NIVELES_Y[ot.nivelCombustible], 'X');

  // Observación del cliente / Servicio a realizar
  textoMultilinea(0.045, 0.380, ot.observacionCliente, { anchoFraccion: 0.42 });
  textoMultilinea(0.52, 0.380, ot.servicioARealizar, { anchoFraccion: 0.42 });

  // Firmas: cliente y asesor
  texto(0.21, 0.720, `${cliente.nombres} ${cliente.apellidos}`, 7);
  if (asesor) texto(0.65, 0.720, asesor.nombre, 7);

  // Diagnóstico / Sugerencias / Insumos
  if (diagnostico) {
    textoMultilinea(0.045, 0.796, diagnostico.diagnostico, { tam: 6.5, espaciado: 0.016, anchoFraccion: 0.30, maxLineas: 2 });
    textoMultilinea(0.385, 0.796, diagnostico.sugerencias, { tam: 6.5, espaciado: 0.016, anchoFraccion: 0.22, maxLineas: 2 });
  }
  if (insumosTexto) {
    textoMultilinea(0.64, 0.796, insumosTexto, { tam: 6.5, espaciado: 0.016, anchoFraccion: 0.295, maxLineas: 2 });
  }

  // Firma del técnico
  if (mecanico) texto(0.16, 0.940, mecanico.nombre, 7);

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ot.numeroOT}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
