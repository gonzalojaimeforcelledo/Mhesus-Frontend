import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { NOMBRE_TIPO_VENTA, ResumenDia, TipoVenta, Venta } from '../../core/models/models';
import { descargarVentaPdf } from './venta-pdf.util';

type Tab = 'resumen' | 'ventas' | 'proformas' | 'reportes';

const NOMBRE_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Facturación</h1>
          <p class="text-sm text-ink-500">Ventas, proformas y comprobantes del taller.</p>
        </div>
        <a routerLink="/ventas/nueva" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 text-white text-sm font-medium">+ Nueva venta</a>
      </div>

      <div class="flex gap-1 border-b border-ink-100">
        @for (t of tabsDisponibles; track t.id) {
          <button
            (click)="tab.set(t.id)"
            class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            [class]="tab() === t.id ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500 hover:text-ink-900'"
          >{{ t.etiqueta }}</button>
        }
      </div>

      <!-- Resumen del día -->
      @if (tab() === 'resumen') {
        @if (resumen(); as r) {
          <div class="space-y-6">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="panel rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div class="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-2">
                  <span class="w-7 h-7 rounded-full bg-emerald-500/15 grid place-items-center shrink-0">S/</span> Total
                </div>
                <p class="font-display font-700 text-3xl text-ink-900">S/ {{ r.total.toFixed(2) }}</p>
              </div>
              <div class="panel rounded-xl border border-navy-500/20 bg-navy-500/5 p-5">
                <div class="flex items-center gap-2 text-navy-700 text-sm font-medium mb-2">
                  <span class="w-7 h-7 rounded-full bg-navy-500/15 grid place-items-center shrink-0">#</span> Emisiones
                </div>
                <p class="font-display font-700 text-3xl text-ink-900">{{ r.emisiones }}</p>
              </div>
              <div class="panel rounded-xl border border-ink-100 bg-ink-50/60 p-5">
                <div class="flex items-center gap-2 text-ink-500 text-sm font-medium mb-2">
                  <span class="w-7 h-7 rounded-full bg-ink-100 grid place-items-center shrink-0">~</span> Promedio
                </div>
                <p class="font-display font-700 text-3xl text-ink-900">S/ {{ r.promedio.toFixed(2) }}</p>
              </div>
              <div class="panel rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
                <div class="flex items-center gap-2 text-amber-600 text-sm font-medium mb-2">
                  <span class="w-7 h-7 rounded-full bg-amber-400/15 grid place-items-center shrink-0">%</span> IGV
                </div>
                <p class="font-display font-700 text-3xl text-ink-900">S/ {{ r.igv.toFixed(2) }}</p>
              </div>
            </div>

            <div class="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
              <div class="panel p-6">
                <h2 class="font-display font-700 text-lg text-ink-900 mb-4">Por tipo de comprobante</h2>
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-ink-500 border-b border-ink-100">
                      <th class="py-2.5 font-medium">Tipo</th>
                      <th class="py-2.5 font-medium text-right">Monto</th>
                      <th class="py-2.5 font-medium text-right w-16">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tipo of tiposResumen; track tipo) {
                      <tr class="border-b border-ink-50">
                        <td class="py-3 text-ink-700">{{ nombreTipo(tipo) }}</td>
                        <td class="py-3 text-right text-ink-900 font-medium">S/ {{ montoDeTipo(r, tipo).toFixed(2) }}</td>
                        <td class="py-3 text-right text-ink-500">{{ cantidadDeTipo(r, tipo) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="panel p-6">
                <h2 class="font-display font-700 text-lg text-ink-900 mb-4">Detalle</h2>
                @if (r.ultimaEmision) {
                  <div class="flex items-center gap-2 text-sm text-ink-500 pb-4 mb-4 border-b border-ink-100">
                    <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                    Última emisión <span class="font-medium text-ink-900 ml-1">{{ r.ultimaEmision | date:'shortTime' }}</span>
                  </div>
                }
                <a routerLink="/ventas/nueva" class="block text-center px-4 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-900 text-white text-sm font-medium">+ Nueva venta</a>
              </div>
            </div>
          </div>
        } @else {
          <p class="text-sm text-ink-500">Cargando resumen...</p>
        }
      }

      <!-- Ventas realizadas / Proformas (misma tabla, filtrada por tipo) -->
      @if (tab() === 'ventas' || tab() === 'proformas') {
        <div class="panel overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Comprobante</th>
                <th class="py-2.5 px-4 font-medium">Cliente</th>
                <th class="py-2.5 px-4 font-medium">Fecha</th>
                <th class="py-2.5 px-4 font-medium">Total</th>
                <th class="py-2.5 px-4 font-medium">Estado</th>
                <th class="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (v of ventasFiltradas(); track v.id) {
                <tr class="border-b border-ink-50" [class.opacity-50]="v.estado === 'ANULADA'">
                  <td class="py-3 px-4">
                    <p class="font-medium text-ink-900">{{ nombreTipo(v.tipo) }}</p>
                    <p class="text-xs text-ink-400 font-mono">{{ v.serie }}-{{ String(v.numero).padStart(6, '0') }}</p>
                  </td>
                  <td class="py-3 px-4 text-ink-700">{{ v.clienteNombre ?? 'Cliente varios' }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ v.creadoEn | date:'d MMM, h:mm a' }}</td>
                  <td class="py-3 px-4 font-medium text-ink-900">S/ {{ v.total.toFixed(2) }}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full" [class]="v.estado === 'ANULADA' ? 'bg-crimson-500/10 text-crimson-500' : 'bg-emerald-500/10 text-emerald-600'">{{ v.estado }}</span>
                  </td>
                  <td class="py-3 px-4 flex items-center gap-3">
                    <button (click)="descargar(v)" class="text-xs font-medium text-brand-700 hover:underline">PDF</button>
                    @if (v.estado === 'EMITIDA') {
                      <button (click)="anular(v.id)" class="text-xs font-medium text-crimson-500 hover:underline">Anular</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-8 text-center text-ink-500">No hay {{ tab() === 'proformas' ? 'proformas' : 'ventas' }} registradas todavía.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Reportes -->
      @if (tab() === 'reportes') {
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="panel p-5">
            <h2 class="font-display font-700 text-ink-900 mb-4">Emisiones (histórico)</h2>
            <table class="w-full text-sm">
              <tbody>
                @for (tipo of tiposReporte; track tipo) {
                  <tr class="border-b border-ink-50">
                    <td class="py-2 text-ink-700">{{ nombreTipo(tipo) }}</td>
                    <td class="py-2 text-right font-medium text-ink-900">{{ conteoDeTipo(tipo) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="panel p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display font-700 text-ink-900">Ventas por mes ({{ anioReporte }})</h2>
              <div class="flex gap-1">
                <button (click)="cambiarAnio(-1)" class="p-1 rounded hover:bg-ink-50 text-ink-500">
                  <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button (click)="cambiarAnio(1)" class="p-1 rounded hover:bg-ink-50 text-ink-500">
                  <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
            <div class="space-y-1.5">
              @for (mes of ventasPorMesArr(); track mes.clave) {
                <div class="flex items-center gap-3">
                  <span class="text-xs text-ink-500 w-8">{{ mes.etiqueta }}</span>
                  <div class="flex-1 h-5 bg-ink-50 rounded overflow-hidden">
                    <div class="h-full bg-navy-500 rounded" [style.width.%]="mes.porcentaje"></div>
                  </div>
                  <span class="text-xs text-ink-700 font-medium w-20 text-right">S/ {{ mes.monto.toFixed(0) }}</span>
                </div>
              }
            </div>
          </div>

          <div class="panel p-5 lg:col-span-2">
            <h2 class="font-display font-700 text-ink-900 mb-2">Compras por mes</h2>
            <p class="text-sm text-ink-500">
              Todavía no hay un módulo de compras a proveedores en MHESUS (registro de facturas recibidas, etc.) —
              este reporte solo cubre lo que el taller emite (ventas), no lo que compra. Si lo necesitas, es una
              funcionalidad nueva que se puede agregar aparte.
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class VentasListComponent implements OnInit {
  tab = signal<Tab>('resumen');
  resumen = signal<ResumenDia | undefined>(undefined);
  anioReporte = new Date().getFullYear();
  reporteMensual = signal<Record<string, number>>({});

  tabsDisponibles: { id: Tab; etiqueta: string }[] = [
    { id: 'resumen', etiqueta: 'Resumen del día' },
    { id: 'ventas', etiqueta: 'Ventas realizadas' },
    { id: 'proformas', etiqueta: 'Proformas' },
    { id: 'reportes', etiqueta: 'Reportes' }
  ];

  tiposResumen: TipoVenta[] = ['FACTURA', 'BOLETA', 'NOTA_DEBITO', 'NOTA_CREDITO'];
  tiposReporte: TipoVenta[] = ['FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'PROFORMA', 'GUIA_REMISION'];

  constructor(public store: StoreService) {}

  async ngOnInit(): Promise<void> {
    await this.store.cargarVentas();
    this.resumen.set(await this.store.resumenDelDiaVentas());
    this.reporteMensual.set(await this.store.reporteMensualVentas(this.anioReporte));
  }

  async cambiarAnio(delta: number): Promise<void> {
    this.anioReporte += delta;
    this.reporteMensual.set(await this.store.reporteMensualVentas(this.anioReporte));
  }

  nombreTipo(t: TipoVenta): string { return NOMBRE_TIPO_VENTA[t]; }
  String = String;

  ventasFiltradas = computed(() => {
    const buscado = this.tab() === 'proformas' ? 'PROFORMA' : null;
    return this.store.ventas().filter((v) => (buscado ? v.tipo === buscado : v.tipo !== 'PROFORMA'));
  });

  conteoPorTipo = computed(() => {
    const mapa: Record<string, number> = {};
    for (const v of this.store.ventas()) {
      if (v.estado === 'ANULADA') continue;
      mapa[v.tipo] = (mapa[v.tipo] ?? 0) + 1;
    }
    return mapa;
  });

  conteoDeTipo(tipo: TipoVenta): number {
    return this.conteoPorTipo()[tipo] ?? 0;
  }

  montoDeTipo(r: ResumenDia, tipo: TipoVenta): number {
    return r.porTipo[tipo]?.monto ?? 0;
  }

  cantidadDeTipo(r: ResumenDia, tipo: TipoVenta): number {
    return r.porTipo[tipo]?.cantidad ?? 0;
  }

  ventasPorMesArr = computed(() => {
    const datos = this.reporteMensual();
    const valores = Object.values(datos);
    const max = Math.max(1, ...valores);
    return Object.entries(datos).map(([clave, monto]) => {
      const mesIdx = Number(clave.split('-')[1]) - 1;
      return { clave, etiqueta: NOMBRE_MES[mesIdx] ?? clave, monto, porcentaje: (monto / max) * 100 };
    });
  });

  async descargar(v: Venta): Promise<void> {
    const cliente = v.clienteId ? this.store.cliente(v.clienteId) : undefined;
    await descargarVentaPdf(v, cliente);
  }

  async anular(id: string): Promise<void> {
    await this.store.anularVenta(id);
    this.resumen.set(await this.store.resumenDelDiaVentas());
  }
}
