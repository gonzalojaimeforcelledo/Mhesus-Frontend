import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdenTrabajo, EstadoOT, SECUENCIA_ESTADOS_OT } from '../../core/models/models';
import { permisoDe } from '../../core/services/permissions';
import { colorEstado } from '../../core/services/ot-state-machine';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Órdenes de Trabajo</h1>
          <p class="text-sm text-ink-500">
            @if (soyMecanico()) { Mostrando únicamente las OT asignadas a ti. }
            @else { Vista general del flujo de trabajo del taller, por estado. }
          </p>
        </div>
        @if (puedeCrear()) {
          <a routerLink="/ot/nueva" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">+ Nueva OT</a>
        }
      </div>

      <div class="panel px-4">
        <div class="flex flex-wrap items-center gap-3 py-3">
          <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input [ngModel]="filtro()" (ngModelChange)="filtro.set($event)" placeholder="Buscar por N° de OT, placa o cliente..." class="flex-1 min-w-[200px] text-sm outline-none" />
          <select [ngModel]="filtroMes()" (ngModelChange)="filtroMes.set($event)" class="text-sm rounded-lg border border-ink-100 px-3 py-1.5 shrink-0">
            <option [ngValue]="null">Todos los meses</option>
            @for (m of meses; track m.valor) { <option [ngValue]="m.valor">{{ m.nombre }}</option> }
          </select>
          <select [ngModel]="filtroAnio()" (ngModelChange)="filtroAnio.set($event)" class="text-sm rounded-lg border border-ink-100 px-3 py-1.5 shrink-0">
            <option [ngValue]="null">Todos los años</option>
            @for (a of aniosDisponibles(); track a) { <option [ngValue]="a">{{ a }}</option> }
          </select>
          @if (filtroMes() !== null || filtroAnio() !== null || filtro()) {
            <button (click)="limpiarFiltros()" class="text-xs font-medium text-ink-500 hover:text-crimson-500 shrink-0">Limpiar filtros</button>
          }
        </div>
      </div>

      <!-- Tablero tipo Trello: todas las OT que calzan con el filtro, agrupadas por estado (solo lectura — el estado
           avanza solo según lo que realmente pasa con cada OT, no se puede arrastrar para cambiar a mano). -->
      <div class="panel p-4 sm:p-5 min-w-0">
        <div class="flex gap-3 overflow-x-auto pb-2">
          @for (estado of estados; track estado) {
            <div class="shrink-0 w-64 bg-ink-50/60 rounded-xl p-3">
              <div class="flex items-center justify-between mb-3 px-1">
                <p class="text-xs font-medium text-ink-700">{{ estado }}</p>
                <span
                  class="text-[11px] font-medium rounded-full px-2 py-0.5"
                  [class]="colorEstado(estado) === 'emerald' ? 'text-emerald-600 bg-emerald-500/10' : colorEstado(estado) === 'amber' ? 'text-amber-600 bg-amber-400/10' : 'text-brand-700 bg-navy-700/10'"
                >{{ otsDeEstado(estado).length }}</span>
              </div>
              <div class="space-y-2 max-h-[32rem] overflow-y-auto">
                @for (ot of otsDeEstado(estado); track ot.id) {
                  <a [routerLink]="['/ot', ot.id]" class="block bg-surface rounded-lg border border-ink-100 p-3 hover:border-navy-500 transition-colors">
                    <p class="text-xs font-mono font-semibold text-brand-700">{{ ot.numeroOT }}</p>
                    <p class="text-sm font-medium text-ink-900 mt-0.5">{{ store.moto(ot.motoId)?.placa }}</p>
                    <p class="text-xs text-ink-500 mt-0.5 truncate">{{ store.cliente(ot.clienteId)?.nombres }} {{ store.cliente(ot.clienteId)?.apellidos }}</p>
                    <p class="text-[11px] text-ink-400 mt-1">{{ ot.creadoEn | date:'d MMM yyyy' }}</p>
                  </a>
                } @empty {
                  <p class="text-xs text-ink-400 text-center py-4">Vacío</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class OtListComponent {
  estados: EstadoOT[] = SECUENCIA_ESTADOS_OT;
  meses = MESES.map((nombre, i) => ({ nombre, valor: i + 1 }));
  colorEstado = colorEstado;

  filtro = signal('');
  filtroMes = signal<number | null>(null);
  filtroAnio = signal<number | null>(null);

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

  aniosDisponibles = computed(() => {
    const anios = new Set<number>();
    for (const o of this.baseOTs()) anios.add(new Date(o.creadoEn).getFullYear());
    return Array.from(anios).sort((a, b) => b - a);
  });

  otsFiltradas = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    const mes = this.filtroMes();
    const anio = this.filtroAnio();
    let lista = this.baseOTs();

    if (mes !== null || anio !== null) {
      lista = lista.filter((o) => {
        const fecha = new Date(o.creadoEn);
        if (mes !== null && fecha.getMonth() + 1 !== mes) return false;
        if (anio !== null && fecha.getFullYear() !== anio) return false;
        return true;
      });
    }

    if (!q) return lista;
    return lista.filter((o) =>
      o.numeroOT.toLowerCase().includes(q) ||
      (this.store.moto(o.motoId)?.placa ?? '').toLowerCase().includes(q) ||
      `${this.store.cliente(o.clienteId)?.nombres} ${this.store.cliente(o.clienteId)?.apellidos}`.toLowerCase().includes(q)
    );
  });

  private otsPorEstado = computed(() => {
    const mapa: Record<string, OrdenTrabajo[]> = {};
    for (const e of this.estados) mapa[e] = [];
    for (const o of this.otsFiltradas()) (mapa[o.estado] ??= []).push(o);
    for (const e of this.estados) mapa[e].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));
    return mapa;
  });

  otsDeEstado(estado: EstadoOT): OrdenTrabajo[] {
    return this.otsPorEstado()[estado] ?? [];
  }

  limpiarFiltros(): void {
    this.filtro.set('');
    this.filtroMes.set(null);
    this.filtroAnio.set(null);
  }

  puedeCrear = computed(() => {
    const rol = this.auth.rol();
    return !!rol && permisoDe(rol, 'ot') === 'todo';
  });
}
