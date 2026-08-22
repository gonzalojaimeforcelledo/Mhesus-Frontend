import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { NOMBRE_ROL } from '../../core/services/permissions';
import { RegistroAsistenciaAdmin, Rol } from '../../core/models/models';

@Component({
  selector: 'app-asistencia-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Asistencia</h1>
        <p class="text-sm text-ink-500">Control de llegada, almuerzo y salida de todo el personal.</p>
      </div>

      <div class="panel p-4 sm:p-5">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="text-xs font-medium text-ink-500">Desde</label>
            <input type="date" [(ngModel)]="asistenciaDesde" name="asistenciaDesde" class="mt-1 block rounded-lg border border-ink-100 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs font-medium text-ink-500">Hasta</label>
            <input type="date" [(ngModel)]="asistenciaHasta" name="asistenciaHasta" class="mt-1 block rounded-lg border border-ink-100 px-3 py-2 text-sm" />
          </div>
          <button (click)="cargarAsistenciaAdmin()" [disabled]="cargandoAsistencia()" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">
            {{ cargandoAsistencia() ? 'Cargando...' : 'Filtrar' }}
          </button>
        </div>
        <p class="text-xs text-ink-400 mt-2">Sin filtro, se muestra el mes calendario actual.</p>
      </div>

      <div class="panel overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-500 border-b border-ink-100">
              <th class="py-2.5 px-4 font-medium">Fecha</th>
              <th class="py-2.5 px-4 font-medium">Usuario</th>
              <th class="py-2.5 px-4 font-medium">Rol</th>
              <th class="py-2.5 px-4 font-medium">Llegada</th>
              <th class="py-2.5 px-4 font-medium">Inicio almuerzo</th>
              <th class="py-2.5 px-4 font-medium">Fin almuerzo</th>
              <th class="py-2.5 px-4 font-medium">Salida</th>
            </tr>
          </thead>
          <tbody>
            @for (r of asistenciaAdmin(); track r.id) {
              <tr class="border-b border-ink-50">
                <td class="py-3 px-4 text-ink-500">{{ r.fecha }}</td>
                <td class="py-3 px-4 text-ink-900">{{ r.nombreUsuario }}</td>
                <td class="py-3 px-4 text-ink-500">{{ nombreRol(r.rolUsuario) }}</td>
                <td class="py-3 px-4" [class]="r.horaLlegada ? 'text-emerald-600 font-medium' : 'text-ink-300'">{{ r.horaLlegada?.slice(0,5) ?? '—' }}</td>
                <td class="py-3 px-4" [class]="r.horaInicioAlmuerzo ? 'text-emerald-600 font-medium' : 'text-ink-300'">{{ r.horaInicioAlmuerzo?.slice(0,5) ?? '—' }}</td>
                <td class="py-3 px-4" [class]="r.horaFinAlmuerzo ? 'text-emerald-600 font-medium' : 'text-ink-300'">{{ r.horaFinAlmuerzo?.slice(0,5) ?? '—' }}</td>
                <td class="py-3 px-4" [class]="r.horaSalida ? 'text-emerald-600 font-medium' : 'text-ink-300'">{{ r.horaSalida?.slice(0,5) ?? '—' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="py-8 text-center text-ink-500">Sin registros de asistencia en el rango seleccionado.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AsistenciaAdminComponent implements OnInit {
  asistenciaAdmin = signal<RegistroAsistenciaAdmin[]>([]);
  cargandoAsistencia = signal(false);
  asistenciaDesde = '';
  asistenciaHasta = '';

  constructor(private store: StoreService) {}

  ngOnInit(): void {
    this.cargarAsistenciaAdmin();
  }

  async cargarAsistenciaAdmin(): Promise<void> {
    this.cargandoAsistencia.set(true);
    try {
      this.asistenciaAdmin.set(await this.store.listarAsistenciaAdmin(this.asistenciaDesde || undefined, this.asistenciaHasta || undefined));
    } finally {
      this.cargandoAsistencia.set(false);
    }
  }

  nombreRol(rol: Rol | string): string {
    return (NOMBRE_ROL as Record<string, string>)[rol] ?? rol;
  }
}
