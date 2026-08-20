import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { EstadoOT, SECUENCIA_ESTADOS_OT } from '../../core/models/models';
import { permisoDe } from '../../core/services/permissions';

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EstadoBadgeComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Órdenes de Trabajo</h1>
          <p class="text-sm text-ink-500">
            @if (soyMecanico()) { Mostrando únicamente las OT asignadas a ti. }
            @else { Vista general del flujo de trabajo del taller. }
          </p>
        </div>
        @if (puedeCrear()) {
          <a routerLink="/ot/nueva" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">+ Nueva OT</a>
        }
      </div>

      <div class="panel px-4">
        <div class="flex flex-wrap items-center gap-3 py-3 border-b border-ink-100">
          <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input [ngModel]="filtro()" (ngModelChange)="filtro.set($event)" placeholder="Buscar por N° de OT, placa o cliente..." class="flex-1 min-w-[200px] text-sm outline-none" />
          <select [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)" class="text-sm rounded-lg border border-ink-100 px-3 py-1.5 shrink-0">
            <option [ngValue]="null">Todos los estados</option>
            @for (e of estados; track e) { <option [ngValue]="e">{{ e }}</option> }
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 pr-4 font-medium">N° OT</th>
                <th class="py-2.5 pr-4 font-medium">Cliente</th>
                <th class="py-2.5 pr-4 font-medium">Moto</th>
                <th class="py-2.5 pr-4 font-medium">Mecánico</th>
                <th class="py-2.5 pr-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (ot of otsFiltradas(); track ot.id) {
                <tr class="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer" [routerLink]="['/ot', ot.id]">
                  <td class="py-3 pr-4 font-mono text-xs font-semibold text-brand-700">{{ ot.numeroOT }}</td>
                  <td class="py-3 pr-4 text-ink-900">{{ store.cliente(ot.clienteId)?.nombres }} {{ store.cliente(ot.clienteId)?.apellidos }}</td>
                  <td class="py-3 pr-4 text-ink-500 font-mono text-xs">{{ store.moto(ot.motoId)?.placa }}</td>
                  <td class="py-3 pr-4 text-ink-500">{{ store.usuario(ot.mecanicoId)?.nombre ?? '—' }}</td>
                  <td class="py-3 pr-4"><app-estado-badge [estado]="ot.estado" /></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-8 text-center text-ink-500">No se encontraron órdenes de trabajo.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class OtListComponent {
  estados: EstadoOT[] = SECUENCIA_ESTADOS_OT;
  filtro = signal('');
  filtroEstado = signal<EstadoOT | null>(null);

  constructor(public store: StoreService, private auth: AuthService, private router: Router) {}

  soyMecanico = computed(() => this.auth.rol() === 'mecanico');

  private baseOTs = computed(() => {
    const todas = this.store.ots();
    if (this.soyMecanico()) {
      const uid = this.auth.usuario()?.id;
      return todas.filter((o) => o.mecanicoId === uid);
    }
    return todas;
  });

  otsFiltradas = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    let lista = this.baseOTs();
    const estado = this.filtroEstado();
    if (estado) lista = lista.filter((o) => o.estado === estado);
    if (!q) return lista;
    return lista.filter((o) =>
      o.numeroOT.toLowerCase().includes(q) ||
      (this.store.moto(o.motoId)?.placa ?? '').toLowerCase().includes(q) ||
      `${this.store.cliente(o.clienteId)?.nombres} ${this.store.cliente(o.clienteId)?.apellidos}`.toLowerCase().includes(q)
    );
  });

  puedeCrear = computed(() => {
    const rol = this.auth.rol();
    return !!rol && permisoDe(rol, 'ot') === 'todo';
  });
}
