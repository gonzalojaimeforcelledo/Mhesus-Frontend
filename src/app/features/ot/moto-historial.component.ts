import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';

@Component({
  selector: 'app-moto-historial',
  standalone: true,
  imports: [CommonModule, RouterLink, EstadoBadgeComponent],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <a [routerLink]="volverA()" class="text-xs text-brand-700 hover:underline">← Volver</a>

      @if (moto(); as m) {
        <div class="panel p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-mono text-xs text-ink-500">Historial de la moto lineal</p>
              <h1 class="font-display font-700 text-2xl text-ink-900">{{ m.placa }} — {{ m.marca }} {{ m.modelo }}</h1>
              <p class="text-sm text-ink-500 mt-1">{{ m.anio }} · {{ m.kmActual | number }} km registrados</p>
            </div>
            @if (cliente(); as c) {
              <div class="text-right">
                <p class="text-sm font-medium text-ink-900">{{ c.nombres }} {{ c.apellidos }}</p>
                <p class="text-xs text-ink-500 font-mono">DNI {{ c.dni }} · {{ c.celular }}</p>
              </div>
            }
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-ink-100">
            <div>
              <p class="text-xs text-ink-500">Órdenes de trabajo</p>
              <p class="font-display font-700 text-2xl text-brand-900 mt-0.5">{{ historial().length }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-500">OT cerradas</p>
              <p class="font-display font-700 text-2xl text-emerald-500 mt-0.5">{{ cerradas() }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-500">Última visita</p>
              <p class="font-display font-700 text-lg text-ink-900 mt-0.5">{{ ultimaVisita() }}</p>
            </div>
          </div>
        </div>

        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-4">Línea de tiempo de servicios</h2>
          <ul class="space-y-4">
            @for (ot of historial(); track ot.id) {
              <li>
                <a [routerLink]="['/ot', ot.id]" class="block rounded-lg border border-ink-100 p-4 hover:border-navy-500 transition-colors">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span class="font-mono text-xs font-semibold text-brand-700">{{ ot.numeroOT }}</span>
                      <span class="text-xs text-ink-400 ml-2">{{ ot.creadoEn | date:'d MMM y' }}</span>
                    </div>
                    <app-estado-badge [estado]="ot.estado" />
                  </div>
                  <p class="text-sm text-ink-900 mt-2">{{ ot.servicioARealizar }}</p>
                  @if (ot.observacionCliente) { <p class="text-xs text-ink-500 mt-0.5">Observación: {{ ot.observacionCliente }}</p> }
                  @if (diagnosticoDe(ot.id); as d) {
                    <p class="text-xs text-ink-500 mt-1"><span class="font-medium text-ink-700">Diagnóstico:</span> {{ d.diagnostico }}</p>
                  }
                  <p class="text-xs text-ink-400 mt-2">Mecánico: {{ store.usuario(ot.mecanicoId)?.nombre ?? 'Sin asignar' }} · Km al ingreso: {{ m.kmActual | number }}</p>
                </a>
              </li>
            } @empty {
              <p class="text-sm text-ink-500 text-center py-8">Esta moto todavía no tiene órdenes de trabajo registradas.</p>
            }
          </ul>
        </div>
      } @else {
        <p class="text-sm text-ink-500">No se encontró información de esta moto lineal.</p>
      }
    </div>
  `
})
export class MotoHistorialComponent {
  private motoId = signal<string>('');

  constructor(public store: StoreService, private route: ActivatedRoute) {
    this.motoId.set(this.route.snapshot.paramMap.get('id') ?? '');
  }

  moto = computed(() => this.store.moto(this.motoId()));
  cliente = computed(() => {
    const m = this.moto();
    return m ? this.store.cliente(m.clienteId) : undefined;
  });
  historial = computed(() => this.store.historialDeMoto(this.motoId()));
  cerradas = computed(() => this.historial().filter((o) => o.estado === 'Cerrada').length);
  ultimaVisita = computed(() => {
    const h = this.historial();
    if (!h.length) return '—';
    return new Date(h[0].creadoEn).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  diagnosticoDe(otId: string) {
    return this.store.diagnosticoDeOT(otId);
  }

  volverA(): string {
    return this.cliente() ? '/clientes' : '/ot';
  }
}
