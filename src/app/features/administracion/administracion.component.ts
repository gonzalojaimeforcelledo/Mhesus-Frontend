import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { NOMBRE_ROL } from '../../core/services/permissions';
import { Rol } from '../../core/models/models';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Administración</h1>
        <p class="text-sm text-ink-500">Gestión de usuarios, roles y auditoría del sistema.</p>
      </div>

      <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1 w-fit">
        <button (click)="tab.set('usuarios')" [class.bg-surface]="tab() === 'usuarios'" [class.shadow]="tab() === 'usuarios'" class="px-4 py-1.5 rounded-md text-xs font-medium">Usuarios</button>
        <button (click)="tab.set('auditoria')" [class.bg-surface]="tab() === 'auditoria'" [class.shadow]="tab() === 'auditoria'" class="px-4 py-1.5 rounded-md text-xs font-medium">Auditoría</button>
        <button (click)="tab.set('sistema')" [class.bg-surface]="tab() === 'sistema'" [class.shadow]="tab() === 'sistema'" class="px-4 py-1.5 rounded-md text-xs font-medium">Sistema</button>
      </div>

      @if (tab() === 'usuarios') {
        <div class="panel p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-600 text-ink-900">Crear usuario</h2>
          </div>
          <form (ngSubmit)="crear()" class="grid sm:grid-cols-4 gap-3">
            <input [(ngModel)]="nuevo.nombre" name="nombre" placeholder="Nombre completo" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevo.usuario" name="usuario" placeholder="Usuario de acceso" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <select [(ngModel)]="nuevo.rol" name="rol" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm">
              <option value="" disabled>Rol...</option>
              @for (r of roles; track r) { <option [value]="r">{{ nombreRol(r) }}</option> }
            </select>
            <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Crear</button>
          </form>
        </div>

        <div class="panel overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Nombre</th>
                <th class="py-2.5 px-4 font-medium">Usuario</th>
                <th class="py-2.5 px-4 font-medium">Rol</th>
                <th class="py-2.5 px-4 font-medium">Estado</th>
                <th class="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (u of store.usuarios(); track u.id) {
                <tr class="border-b border-ink-50">
                  <td class="py-3 px-4 text-ink-900">{{ u.nombre }}</td>
                  <td class="py-3 px-4 font-mono text-xs text-ink-500">{{ u.usuario }}</td>
                  <td class="py-3 px-4 text-ink-700">{{ nombreRol(u.rol) }}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full" [class]="u.activo ? 'text-emerald-600 bg-emerald-500/10' : 'text-ink-400 bg-ink-100'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <button (click)="store.toggleUsuarioActivo(u.id)" class="text-xs font-medium text-brand-700 hover:underline">{{ u.activo ? 'Desactivar' : 'Reactivar' }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'auditoria') {
        <div class="panel overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Fecha</th>
                <th class="py-2.5 px-4 font-medium">Usuario</th>
                <th class="py-2.5 px-4 font-medium">Acción</th>
                <th class="py-2.5 px-4 font-medium">OT</th>
                <th class="py-2.5 px-4 font-medium">Transición</th>
              </tr>
            </thead>
            <tbody>
              @for (a of store.auditoria(); track a.id) {
                <tr class="border-b border-ink-50">
                  <td class="py-3 px-4 text-ink-500">{{ a.creadoEn | date:'medium' }}</td>
                  <td class="py-3 px-4 text-ink-900">{{ store.usuario(a.usuarioId)?.nombre }}</td>
                  <td class="py-3 px-4 text-ink-700">{{ a.accion }}</td>
                  <td class="py-3 px-4 font-mono text-xs text-brand-700">{{ a.otId ? store.ot(a.otId)?.numeroOT : '—' }}</td>
                  <td class="py-3 px-4 text-ink-500 text-xs">{{ a.estadoAnterior && a.estadoNuevo ? (a.estadoAnterior + ' → ' + a.estadoNuevo) : '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-8 text-center text-ink-500">Sin eventos registrados.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'sistema') {
        <div class="panel p-5 max-w-lg">
          <h2 class="font-display font-600 text-ink-900 mb-2">Datos del sistema</h2>
          <p class="text-sm text-ink-500 mb-4">
            La información de MHESUS (clientes, OT, almacén, cotizaciones, usuarios) se guarda en este dispositivo.
            Si necesitas empezar de cero, puedes restablecer los datos iniciales del sistema.
          </p>
          <button (click)="recargar()" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">
            Recargar datos desde el servidor
          </button>
        </div>
      }
    </div>
  `
})
export class AdministracionComponent {
  tab = signal<'usuarios' | 'auditoria' | 'sistema'>('usuarios');
  roles: Rol[] = ['recepcion', 'mecanico', 'almacen', 'jefe_taller', 'administracion'];
  nuevo: { nombre: string; usuario: string; rol: Rol | '' } = { nombre: '', usuario: '', rol: '' };

  constructor(public store: StoreService) {}

  nombreRol(rol: Rol): string {
    return NOMBRE_ROL[rol];
  }

  async crear(): Promise<void> {
    if (!this.nuevo.nombre || !this.nuevo.usuario || !this.nuevo.rol) return;
    await this.store.crearUsuario({ nombre: this.nuevo.nombre, usuario: this.nuevo.usuario, rol: this.nuevo.rol as Rol });
    this.nuevo = { nombre: '', usuario: '', rol: '' };
  }

  async recargar(): Promise<void> {
    await this.store.cargarTodo();
  }
}
