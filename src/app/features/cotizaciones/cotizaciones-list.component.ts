import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Cotizaciones</h1>
        <p class="text-sm text-ink-500">Consolidado de cotizaciones por Orden de Trabajo y su estado de autorización.</p>
      </div>

      <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1 w-fit">
        <button (click)="filtro.set('todas')" [class.bg-surface]="filtro() === 'todas'" [class.shadow]="filtro() === 'todas'" class="px-4 py-1.5 rounded-md text-xs font-medium">Todas</button>
        <button (click)="filtro.set('pendientes')" [class.bg-surface]="filtro() === 'pendientes'" [class.shadow]="filtro() === 'pendientes'" class="px-4 py-1.5 rounded-md text-xs font-medium">Pendientes de autorización</button>
        <button (click)="filtro.set('autorizadas')" [class.bg-surface]="filtro() === 'autorizadas'" [class.shadow]="filtro() === 'autorizadas'" class="px-4 py-1.5 rounded-md text-xs font-medium">Autorizadas</button>
      </div>

      <div class="panel overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-500 border-b border-ink-100">
              <th class="py-2.5 px-4 font-medium">N° OT</th>
              <th class="py-2.5 px-4 font-medium">Cliente</th>
              <th class="py-2.5 px-4 font-medium">Ítems</th>
              <th class="py-2.5 px-4 font-medium">Monto total</th>
              <th class="py-2.5 px-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (c of cotizacionesFiltradas(); track c.id) {
              <tr class="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer" [routerLink]="['/ot', c.otId]">
                <td class="py-3 px-4 font-mono text-xs font-semibold text-brand-700">{{ store.ot(c.otId)?.numeroOT }}</td>
                <td class="py-3 px-4 text-ink-900">{{ nombreCliente(c.otId) }}</td>
                <td class="py-3 px-4 text-ink-500">{{ c.detalle.length }} ítem(s)</td>
                <td class="py-3 px-4 text-ink-900 font-medium">S/ {{ c.montoTotal }}</td>
                <td class="py-3 px-4">
                  @if (c.autorizado) {
                    <span class="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">Autorizada</span>
                  } @else {
                    <span class="text-xs font-medium text-amber-500 bg-amber-400/10 px-2.5 py-1 rounded-full">Pendiente</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="py-8 text-center text-ink-500">Sin cotizaciones registradas.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CotizacionesListComponent {
  filtro = signal<'todas' | 'pendientes' | 'autorizadas'>('todas');

  constructor(public store: StoreService) {}

  cotizacionesFiltradas = computed(() => {
    const lista = this.store.cotizaciones();
    if (this.filtro() === 'pendientes') return lista.filter((c) => !c.autorizado);
    if (this.filtro() === 'autorizadas') return lista.filter((c) => c.autorizado);
    return lista;
  });

  nombreCliente(otId: string): string {
    const ot = this.store.ot(otId);
    if (!ot) return '—';
    const c = this.store.cliente(ot.clienteId);
    return c ? `${c.nombres} ${c.apellidos}` : '—';
  }
}
