import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Cliente, NOMBRE_TIPO_VENTA, Venta } from '../../core/models/models';

/** Genera el PDF de una boleta/factura/proforma y lo descarga en el navegador. */
export async function descargarVentaPdf(venta: Venta, cliente: Cliente | undefined): Promise<void> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width: W, height: H } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.05, 0.05, 0.42);
  const gris = rgb(0.35, 0.37, 0.42);
  const negro = rgb(0.08, 0.09, 0.11);
  const lineaGris = rgb(0.85, 0.86, 0.9);

  let y = H - 50;

  // Encabezado: nombre del taller
  page.drawText('MHESUS', { x: 40, y, size: 22, font: bold, color: navy });
  page.drawText('Taller profesional de motos lineales', { x: 40, y: y - 18, size: 9, font: normal, color: gris });
  page.drawText('Chincha, Perú', { x: 40, y: y - 31, size: 9, font: normal, color: gris });

  // Recuadro del tipo de comprobante y número, arriba a la derecha
  const cajaX = W - 220;
  const cajaY = y - 55;
  page.drawRectangle({ x: cajaX, y: cajaY, width: 180, height: 60, borderColor: navy, borderWidth: 1.2 });
  const tituloComprobante = NOMBRE_TIPO_VENTA[venta.tipo].toUpperCase();
  const anchoTitulo = bold.widthOfTextAtSize(tituloComprobante, 11);
  page.drawText(tituloComprobante, { x: cajaX + (180 - anchoTitulo) / 2, y: cajaY + 38, size: 11, font: bold, color: navy });
  const numeroTexto = `${venta.serie}-${String(venta.numero).padStart(6, '0')}`;
  const anchoNumero = bold.widthOfTextAtSize(numeroTexto, 13);
  page.drawText(numeroTexto, { x: cajaX + (180 - anchoNumero) / 2, y: cajaY + 18, size: 13, font: bold, color: negro });

  y -= 90;
  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 1, color: lineaGris });
  y -= 25;

  // Datos del cliente y de la venta
  const fecha = new Date(venta.creadoEn);
  const fechaTexto = fecha.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const filaDato = (etiqueta: string, valor: string, x: number, yy: number) => {
    page.drawText(etiqueta, { x, y: yy, size: 8, font: normal, color: gris });
    page.drawText(valor || '—', { x, y: yy - 13, size: 10, font: bold, color: negro });
  };

  filaDato('Cliente', cliente ? `${cliente.nombres} ${cliente.apellidos}` : (venta.clienteNombre ?? 'Cliente varios'), 40, y);
  filaDato('Documento', cliente?.dni ?? venta.clienteDocumento ?? '', 320, y);
  filaDato('Fecha de emisión', fechaTexto, 440, y);
  y -= 40;
  if (cliente?.direccion) {
    filaDato('Dirección', cliente.direccion, 40, y);
    y -= 40;
  }

  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 1, color: lineaGris });
  y -= 22;

  // Tabla de ítems
  const colDesc = 40, colCant = 340, colPU = 400, colImp = 480;
  page.drawText('Descripción', { x: colDesc, y, size: 9, font: bold, color: gris });
  page.drawText('Cant.', { x: colCant, y, size: 9, font: bold, color: gris });
  page.drawText('P. Unit.', { x: colPU, y, size: 9, font: bold, color: gris });
  page.drawText('Importe', { x: colImp, y, size: 9, font: bold, color: gris });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 1, color: lineaGris });
  y -= 18;

  for (const item of venta.items) {
    const importe = item.cantidad * item.precioUnitario;
    page.drawText(item.descripcion.slice(0, 55), { x: colDesc, y, size: 9.5, font: normal, color: negro });
    page.drawText(String(item.cantidad), { x: colCant, y, size: 9.5, font: normal, color: negro });
    page.drawText(`S/ ${item.precioUnitario.toFixed(2)}`, { x: colPU, y, size: 9.5, font: normal, color: negro });
    page.drawText(`S/ ${importe.toFixed(2)}`, { x: colImp, y, size: 9.5, font: normal, color: negro });
    y -= 20;
    if (y < 160) break; // evita desbordar la página en comprobantes muy largos
  }

  y -= 10;
  page.drawLine({ start: { x: 320, y }, end: { x: W - 40, y }, thickness: 1, color: lineaGris });
  y -= 20;

  const filaTotal = (etiqueta: string, valor: number, destacado = false) => {
    page.drawText(etiqueta, { x: 380, y, size: destacado ? 11 : 9.5, font: destacado ? bold : normal, color: destacado ? navy : gris });
    const texto = `S/ ${valor.toFixed(2)}`;
    const ancho = (destacado ? bold : normal).widthOfTextAtSize(texto, destacado ? 11 : 9.5);
    page.drawText(texto, { x: W - 40 - ancho, y, size: destacado ? 11 : 9.5, font: destacado ? bold : normal, color: destacado ? navy : negro });
    y -= 17;
  };
  filaTotal('Subtotal', venta.subtotal);
  filaTotal('IGV (18%)', venta.igv);
  filaTotal('TOTAL', venta.total, true);

  // Pie de página
  page.drawText(
    venta.tipo === 'PROFORMA'
      ? 'Documento no válido para efectos tributarios — solo referencial.'
      : 'Comprobante generado por el sistema interno de MHESUS.',
    { x: 40, y: 50, size: 8, font: normal, color: gris }
  );

  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${NOMBRE_TIPO_VENTA[venta.tipo].replace(/\s+/g, '_')}_${venta.serie}-${venta.numero}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
