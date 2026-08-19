import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

interface Barra { etiqueta: string; valor: number; sufijo?: string; }

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Reportes</h1>
        <p class="text-sm text-ink-500">Ventas por cotización autorizada, productividad por mecánico y rotación de inventario.</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="panel p-4">
          <p class="text-xs text-ink-500">Ventas totales (cotizaciones autorizadas)</p>
          <p class="font-display font-700 text-3xl text-brand-900 mt-1">S/ {{ ventasTotales() }}</p>
        </div>
        <div class="panel p-4">
          <p class="text-xs text-ink-500">OT cerradas</p>
          <p class="font-display font-700 text-3xl text-emerald-500 mt-1">{{ otCerradas() }}</p>
        </div>
        <div class="panel p-4">
          <p class="text-xs text-ink-500">Ticket promedio</p>
          <p class="font-display font-700 text-3xl text-ink-900 mt-1">S/ {{ ticketPromedio() }}</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-4">Ventas por cliente</h2>
          <div class="space-y-3">
            @for (b of ventasPorCliente(); track b.etiqueta) {
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-ink-700">{{ b.etiqueta }}</span>
                  <span class="text-ink-500 font-medium">S/ {{ b.valor }}</span>
                </div>
                <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div class="h-full bg-navy-700 rounded-full" [style.width.%]="pct(b.valor, maxVentas())"></div>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-ink-500">Aún no hay cotizaciones autorizadas.</p>
            }
          </div>
        </div>

        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-4">Productividad por mecánico (OT cerradas)</h2>
          <div class="space-y-3">
            @for (b of productividad(); track b.etiqueta) {
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-ink-700">{{ b.etiqueta }}</span>
                  <span class="text-ink-500 font-medium">{{ b.valor }} OT</span>
                </div>
                <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div class="h-full bg-wing-500 rounded-full" [style.width.%]="pct(b.valor, maxProductividad())"></div>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-ink-500">Sin mecánicos registrados.</p>
            }
          </div>
        </div>
      </div>

      <div class="panel p-5">
        <h2 class="font-display font-600 text-ink-900 mb-4">Rotación de inventario (salidas por producto)</h2>
        <div class="space-y-3">
          @for (b of rotacionInventario(); track b.etiqueta) {
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-ink-700">{{ b.etiqueta }}</span>
                <span class="text-ink-500 font-medium">{{ b.valor }} unidades</span>
              </div>
              <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div class="h-full bg-amber-400 rounded-full" [style.width.%]="pct(b.valor, maxRotacion())"></div>
              </div>
            </div>
          } @empty {
            <p class="text-sm text-ink-500">Sin movimientos de salida registrados.</p>
          }
        </div>
      </div>
    </div>
  `
})
export class ReportesComponent {
  constructor(public store: StoreService) {}

  otsCerradas = computed(() => this.store.ots().filter((o) => o.estado === 'Cerrada'));
  otCerradas = computed(() => this.otsCerradas().length);

  cotizacionesAutorizadas = computed(() => this.store.cotizaciones().filter((c) => c.autorizado));
  ventasTotales = computed(() => this.cotizacionesAutorizadas().reduce((s, c) => s + c.montoTotal, 0));
  ticketPromedio = computed(() => {
    const n = this.cotizacionesAutorizadas().length;
    return n ? Math.round(this.ventasTotales() / n) : 0;
  });

  ventasPorCliente = computed<Barra[]>(() => {
    const mapa = new Map<string, number>();
    for (const c of this.cotizacionesAutorizadas()) {
      const ot = this.store.ot(c.otId);
      if (!ot) continue;
      const cliente = this.store.cliente(ot.clienteId);
      const nombre = cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cliente';
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + c.montoTotal);
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
  });
  maxVentas = computed(() => Math.max(1, ...this.ventasPorCliente().map((b) => b.valor)));

  productividad = computed<Barra[]>(() => {
    const mecanicos = this.store.usuarios().filter((u) => u.rol === 'mecanico');
    return mecanicos
      .map((m) => ({ etiqueta: m.nombre, valor: this.otsCerradas().filter((o) => o.mecanicoId === m.id).length }))
      .sort((a, b) => b.valor - a.valor);
  });
  maxProductividad = computed(() => Math.max(1, ...this.productividad().map((b) => b.valor)));

  rotacionInventario = computed<Barra[]>(() => {
    const mapa = new Map<string, number>();
    for (const m of this.store.movimientos()) {
      if (m.tipo !== 'salida') continue;
      const nombre = this.store.producto(m.productoId)?.nombre ?? 'Producto';
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + m.cantidad);
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
  });
  maxRotacion = computed(() => Math.max(1, ...this.rotacionInventario().map((b) => b.valor)));

  pct(valor: number, max: number): number {
    return Math.max(4, Math.round((valor / max) * 100));
  }
}
