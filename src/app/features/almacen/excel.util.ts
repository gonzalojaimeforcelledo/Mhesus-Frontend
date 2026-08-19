import * as XLSX from 'xlsx';
import { Producto } from '../../core/models/models';

export interface FilaProductoExcel {
  codigo: string;
  codigoBarras: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
}

/** Genera y descarga un .xlsx con el catálogo actual de productos. */
export function exportarProductosExcel(productos: Producto[]): void {
  const filas = productos.map((p) => ({
    'Código': p.codigo,
    'Código de barras': p.codigoBarras ?? '',
    'Nombre': p.nombre,
    'Categoría': p.categoria,
    'Precio (S/)': p.precio,
    'Stock actual': p.stockActual,
    'Stock mínimo': p.stockMinimo
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Productos');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `mhesus-productos-${fecha}.xlsx`);
}

function valorTexto(fila: Record<string, unknown>, ...claves: string[]): string {
  for (const c of claves) {
    if (fila[c] !== undefined && fila[c] !== null && String(fila[c]).trim() !== '') return String(fila[c]).trim();
  }
  return '';
}

function valorNumero(fila: Record<string, unknown>, ...claves: string[]): number {
  for (const c of claves) {
    if (fila[c] !== undefined && fila[c] !== null && String(fila[c]).trim() !== '') {
      const n = Number(fila[c]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

/** Lee un archivo .xlsx/.csv y devuelve filas de producto normalizadas. Acepta encabezados en español o inglés. */
export function leerProductosDesdeArchivo(archivo: File): Promise<FilaProductoExcel[]> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (evento) => {
      try {
        const datos = new Uint8Array(evento.target?.result as ArrayBuffer);
        const libro = XLSX.read(datos, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' }) as Record<string, unknown>[];

        const productos: FilaProductoExcel[] = filas
          .map((f: Record<string, unknown>) => ({
            codigo: valorTexto(f, 'Código', 'Codigo', 'codigo', 'code', 'Code'),
            codigoBarras: valorTexto(f, 'Código de barras', 'Codigo de barras', 'codigoBarras', 'barcode', 'Barcode'),
            nombre: valorTexto(f, 'Nombre', 'nombre', 'name', 'Name'),
            categoria: valorTexto(f, 'Categoría', 'Categoria', 'categoria', 'category'),
            precio: valorNumero(f, 'Precio (S/)', 'Precio', 'precio', 'price'),
            stockActual: valorNumero(f, 'Stock actual', 'stockActual', 'stock', 'Stock'),
            stockMinimo: valorNumero(f, 'Stock mínimo', 'Stock minimo', 'stockMinimo', 'min_stock')
          }))
          .filter((p: FilaProductoExcel) => p.codigo && p.nombre);

        resolve(productos);
      } catch (err) {
        reject(err);
      }
    };
    lector.onerror = () => reject(lector.error);
    lector.readAsArrayBuffer(archivo);
  });
}
