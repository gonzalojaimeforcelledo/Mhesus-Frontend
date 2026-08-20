import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { permisoDe } from '../../core/services/permissions';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Clientes</h1>
          <p class="text-sm text-ink-500">Busca por placa para abrir el historial de servicios de cada moto lineal.</p>
        </div>
        @if (soloLectura()) {
          <span class="text-xs font-medium text-ink-500 bg-ink-100 rounded-full px-3 py-1.5">Modo lectura</span>
        }
        @if (!soloLectura()) {
          <button (click)="mostrarForm.set(!mostrarForm())" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">
            {{ mostrarForm() ? 'Cancelar' : '+ Nuevo cliente' }}
          </button>
        }
      </div>

      @if (mostrarForm()) {
        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-4">Registrar cliente</h2>
          <form (ngSubmit)="crearCliente()" class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-ink-700">DNI</label>
              <input [(ngModel)]="nuevo.dni" name="dni" required maxlength="8" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="12345678" />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Celular</label>
              <input [(ngModel)]="nuevo.celular" name="celular" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="9XXXXXXXX" />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Nombres</label>
              <input [(ngModel)]="nuevo.nombres" name="nombres" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Apellidos</label>
              <input [(ngModel)]="nuevo.apellidos" name="apellidos" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div class="sm:col-span-2">
              <label class="text-sm font-medium text-ink-700">Dirección</label>
              <input [(ngModel)]="nuevo.direccion" name="direccion" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Guardar cliente</button>
            </div>
          </form>
        </div>
      }

      <div class="panel">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-ink-100 flex-wrap">
          <div class="flex items-center gap-3 flex-1 min-w-[220px]">
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input [(ngModel)]="filtro" placeholder="Buscar por placa, nombre o DNI..." class="w-full text-sm outline-none" />
          </div>
          <label class="flex items-center gap-2 text-xs font-medium text-ink-500 cursor-pointer select-none shrink-0">
            <input type="checkbox" [(ngModel)]="soloVariasMotos" class="rounded border-ink-100 accent-navy-700" />
            Solo dueños con más de una moto
          </label>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-5 font-medium">Placa</th>
                <th class="py-2.5 px-5 font-medium">Moto lineal</th>
                <th class="py-2.5 px-5 font-medium">Dueño</th>
                <th class="py-2.5 px-5 font-medium">DNI</th>
                <th class="py-2.5 px-5 font-medium">Celular</th>
                <th class="py-2.5 px-5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (fila of motosFiltradas(); track fila.moto.id) {
                <tr [routerLink]="['/motos', fila.moto.id, 'historial']" class="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer">
                  <td class="py-3 px-5 font-mono font-medium text-brand-700">{{ fila.moto.placa }}</td>
                  <td class="py-3 px-5 text-ink-900">{{ fila.moto.marca }} {{ fila.moto.modelo }} · {{ fila.moto.anio }}</td>
                  <td class="py-3 px-5 text-ink-900">
                    {{ fila.cliente?.nombres }} {{ fila.cliente?.apellidos }}
                    @if (fila.totalMotosDelDueno > 1) {
                      <span class="ml-1.5 text-xs font-medium text-navy-700 bg-navy-500/10 rounded-full px-2 py-0.5">{{ fila.totalMotosDelDueno }} motos</span>
                    }
                  </td>
                  <td class="py-3 px-5 text-ink-500 font-mono">{{ fila.cliente?.dni }}</td>
                  <td class="py-3 px-5 text-ink-500">{{ fila.cliente?.celular }}</td>
                  <td class="py-3 px-5 text-brand-700 text-xs font-medium whitespace-nowrap">Ver historial →</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-8 text-center text-ink-500">No se encontraron motos lineales.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ClientesListComponent {
  filtro = '';
  soloVariasMotos = false;
  mostrarForm = signal(false);

  nuevo = { dni: '', nombres: '', apellidos: '', celular: '', direccion: '' };

  constructor(public store: StoreService, private auth: AuthService) {}

  private conteoPorCliente = computed(() => {
    const mapa = new Map<string, number>();
    for (const m of this.store.motos()) {
      mapa.set(m.clienteId, (mapa.get(m.clienteId) ?? 0) + 1);
    }
    return mapa;
  });

  private todasLasFilas = computed(() =>
    this.store.motos().map((moto) => ({
      moto,
      cliente: this.store.cliente(moto.clienteId),
      totalMotosDelDueno: this.conteoPorCliente().get(moto.clienteId) ?? 1
    }))
  );

  motosFiltradas = computed(() => {
    const q = this.filtro.trim().toLowerCase();
    let filas = this.todasLasFilas();
    if (q) {
      filas = filas.filter(({ moto, cliente }) =>
        moto.placa.toLowerCase().includes(q) ||
        (cliente?.dni ?? '').includes(q) ||
        `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.toLowerCase().includes(q)
      );
    }
    if (this.soloVariasMotos) {
      filas = filas.filter((f) => f.totalMotosDelDueno > 1);
    }
    return filas;
  });

  soloLectura = computed(() => {
    const rol = this.auth.rol();
    return rol ? permisoDe(rol, 'clientes') === 'lectura' : true;
  });

  async crearCliente(): Promise<void> {
    if (!this.nuevo.dni || !this.nuevo.nombres || !this.nuevo.apellidos || !this.nuevo.celular) return;
    await this.store.crearCliente({ ...this.nuevo });
    this.nuevo = { dni: '', nombres: '', apellidos: '', celular: '', direccion: '' };
    this.mostrarForm.set(false);
  }
}
