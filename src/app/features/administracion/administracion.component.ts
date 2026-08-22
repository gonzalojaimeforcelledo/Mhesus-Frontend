import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { NOMBRE_ROL } from '../../core/services/permissions';
import { Deuda, ResumenIgv, Rol, TipoDeuda } from '../../core/models/models';

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

      <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1 sm:w-fit">
        <button (click)="tab.set('usuarios')" [class.bg-surface]="tab() === 'usuarios'" [class.shadow]="tab() === 'usuarios'" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium">Usuarios</button>
        <button (click)="tab.set('deudas')" [class.bg-surface]="tab() === 'deudas'" [class.shadow]="tab() === 'deudas'" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium">Deudas</button>
        <button (click)="tab.set('igv')" [class.bg-surface]="tab() === 'igv'" [class.shadow]="tab() === 'igv'" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium">IGV</button>
        <button (click)="tab.set('auditoria')" [class.bg-surface]="tab() === 'auditoria'" [class.shadow]="tab() === 'auditoria'" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium">Auditoría</button>
        <button (click)="tab.set('sistema')" [class.bg-surface]="tab() === 'sistema'" [class.shadow]="tab() === 'sistema'" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium">Sistema</button>
      </div>

      @if (tab() === 'usuarios') {
        <div class="panel p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-600 text-ink-900">Crear usuario</h2>
          </div>
          <form (ngSubmit)="crear()" class="grid sm:grid-cols-5 gap-3">
            <input [(ngModel)]="nuevo.nombre" name="nombre" placeholder="Nombre completo" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevo.usuario" name="usuario" placeholder="Usuario de acceso" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevo.email" name="email" type="email" placeholder="Correo (opcional)" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <select [(ngModel)]="nuevo.rol" name="rol" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm">
              <option value="" disabled>Rol...</option>
              @for (r of roles; track r) { <option [value]="r">{{ nombreRol(r) }}</option> }
            </select>
            <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Crear</button>
          </form>
          @if (rolQueRequiereEmail()) {
            <p class="text-xs text-amber-600 mt-2">
              El correo es obligatorio para cuentas de administración — sin él, esta cuenta no podrá usar "Recuperar acceso por correo" si olvida la contraseña.
            </p>
          }
        </div>

        <div class="panel overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Nombre</th>
                <th class="py-2.5 px-4 font-medium">Usuario</th>
                <th class="py-2.5 px-4 font-medium">Rol</th>
                <th class="py-2.5 px-4 font-medium">Correo</th>
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
                  <td class="py-3 px-4 text-ink-500">
                    @if (u.email) { {{ u.email }} } @else { <span class="text-ink-300 italic">sin correo</span> }
                  </td>
                  <td class="py-3 px-4">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full" [class]="u.activo ? 'text-emerald-600 bg-emerald-500/10' : 'text-ink-400 bg-ink-100'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                  </td>
                  <td class="py-3 px-4 flex items-center gap-3">
                    <button (click)="store.toggleUsuarioActivo(u.id)" class="text-xs font-medium text-brand-700 hover:underline">{{ u.activo ? 'Desactivar' : 'Reactivar' }}</button>
                    <button (click)="abrirRestablecer(u)" class="text-xs font-medium text-navy-700 hover:underline">Restablecer contraseña</button>
                    @if (u.rol === 'administracion') {
                      <button (click)="abrirEmail(u)" class="text-xs font-medium text-navy-700 hover:underline">{{ u.email ? 'Cambiar correo' : 'Agregar correo' }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'deudas') {
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Total por cobrar (pendiente)</p>
            <p class="font-display font-700 text-2xl text-amber-600 mt-1">S/ {{ totalPendientePorCobrar().toFixed(2) }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Total deuda de banco (pendiente)</p>
            <p class="font-display font-700 text-2xl text-crimson-500 mt-1">S/ {{ totalPendienteBanco().toFixed(2) }}</p>
          </div>
        </div>

        <div class="flex gap-1 border-b border-ink-100 mt-4">
          <button (click)="tabDeuda.set('POR_COBRAR')" class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px" [class]="tabDeuda() === 'POR_COBRAR' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500'">Por cobrar</button>
          <button (click)="tabDeuda.set('BANCO')" class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px" [class]="tabDeuda() === 'BANCO' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500'">De banco</button>
        </div>

        <div class="panel p-5 mt-4">
          <h2 class="font-display font-600 text-ink-900 mb-3">{{ tabDeuda() === 'POR_COBRAR' ? 'Nueva deuda por cobrar' : 'Nueva deuda de banco' }}</h2>
          <form (ngSubmit)="crearDeuda()" class="grid sm:grid-cols-4 gap-3">
            <input [(ngModel)]="nuevaDeuda.nombre" name="dNombre" [placeholder]="tabDeuda() === 'POR_COBRAR' ? 'Nombre del cliente' : 'Nombre del banco/entidad'" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevaDeuda.descripcion" name="dDescripcion" placeholder="Descripción (opcional)" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevaDeuda.montoOriginal" type="number" min="0" step="0.01" name="dMonto" placeholder="Monto (S/)" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="nuevaDeuda.fechaVencimiento" type="date" name="dFecha" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <button type="submit" class="sm:col-span-4 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 w-fit">Registrar</button>
          </form>
        </div>

        <div class="panel overflow-x-auto mt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">{{ tabDeuda() === 'POR_COBRAR' ? 'Cliente' : 'Banco/Entidad' }}</th>
                <th class="py-2.5 px-4 font-medium">Descripción</th>
                <th class="py-2.5 px-4 font-medium">Vencimiento</th>
                <th class="py-2.5 px-4 font-medium">Original</th>
                <th class="py-2.5 px-4 font-medium">Pendiente</th>
                <th class="py-2.5 px-4 font-medium">Estado</th>
                <th class="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (d of deudasFiltradas(); track d.id) {
                <tr class="border-b border-ink-50" [class.opacity-50]="d.estado === 'PAGADA'">
                  <td class="py-3 px-4 text-ink-900">{{ d.nombre }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ d.descripcion || '—' }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ d.fechaVencimiento || '—' }}</td>
                  <td class="py-3 px-4 text-ink-500">S/ {{ d.montoOriginal.toFixed(2) }}</td>
                  <td class="py-3 px-4 font-medium" [class]="d.estado === 'PAGADA' ? 'text-emerald-600' : 'text-amber-600'">S/ {{ d.montoPendiente.toFixed(2) }}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full" [class]="d.estado === 'PAGADA' ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-400/10'">{{ d.estado }}</span>
                  </td>
                  <td class="py-3 px-4 flex items-center gap-3">
                    @if (d.estado === 'PENDIENTE') {
                      <button (click)="abonar(d)" class="text-xs font-medium text-navy-700 hover:underline">Abonar</button>
                    }
                    <button (click)="store.eliminarDeuda(d.id)" class="text-xs font-medium text-crimson-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="py-8 text-center text-ink-500">Sin deudas registradas.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'igv') {
        <div class="grid lg:grid-cols-2 gap-4 items-start">
          @if (resumenIgv(); as r) {
            <div class="panel p-6" [class]="r.debePagar ? 'border-2 border-crimson-500' : 'border-2 border-emerald-500'">
              <div class="flex items-center gap-3 mb-1">
                <span class="w-3 h-3 rounded-full shrink-0" [class]="r.debePagar ? 'bg-crimson-500' : 'bg-emerald-500'"></span>
                <h2 class="font-display font-700 text-lg" [class]="r.debePagar ? 'text-crimson-500' : 'text-emerald-600'">
                  {{ r.debePagar ? 'Hay IGV por pagar este mes' : 'No hay IGV por pagar este mes' }}
                </h2>
              </div>
              <p class="text-sm text-ink-500 mb-4">{{ nombreMesActual() }}</p>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg border border-ink-100 p-3">
                  <p class="text-xs text-ink-500">IGV de ventas</p>
                  <p class="font-display font-700 text-xl text-ink-900 mt-1">S/ {{ r.igvVentas.toFixed(2) }}</p>
                </div>
                <div class="rounded-lg border border-ink-100 p-3">
                  <p class="text-xs text-ink-500">IGV de compras</p>
                  <p class="font-display font-700 text-xl text-ink-900 mt-1">S/ {{ r.igvCompras.toFixed(2) }}</p>
                </div>
              </div>
              <div class="rounded-lg p-3 mt-3" [class]="r.debePagar ? 'bg-crimson-500/10' : 'bg-emerald-500/10'">
                <p class="text-xs" [class]="r.debePagar ? 'text-crimson-500' : 'text-emerald-600'">IGV a pagar (ventas − compras)</p>
                <p class="font-display font-700 text-2xl mt-1" [class]="r.debePagar ? 'text-crimson-500' : 'text-emerald-600'">S/ {{ r.igvAPagar.toFixed(2) }}</p>
              </div>

              @if (r.sinVentasEsteMes || r.sinComprasEsteMes) {
                <div class="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/5 p-3 flex items-start gap-2">
                  <svg viewBox="0 0 24 24" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
                  <p class="text-xs text-amber-700">
                    @if (r.sinVentasEsteMes) { Todavía no hay ventas registradas este mes. }
                    @if (r.sinVentasEsteMes && r.sinComprasEsteMes) { <br /> }
                    @if (r.sinComprasEsteMes) { Todavía no hay compras registradas este mes. }
                    Este cálculo puede estar incompleto.
                  </p>
                </div>
              }
            </div>
          }

          <div class="panel p-5">
            <h2 class="font-display font-600 text-ink-900 mb-3">Registrar compra (crédito fiscal)</h2>
            <form (ngSubmit)="crearCompra()" class="grid sm:grid-cols-2 gap-3">
              <input [(ngModel)]="nuevaCompra.proveedor" name="cProveedor" placeholder="Proveedor" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
              <input [(ngModel)]="nuevaCompra.numeroComprobante" name="cComprobante" placeholder="N° de comprobante (opcional)" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
              <input [(ngModel)]="nuevaCompra.descripcion" name="cDescripcion" placeholder="Descripción (opcional)" class="sm:col-span-2 rounded-lg border border-ink-100 px-3 py-2 text-sm" />
              <input [(ngModel)]="nuevaCompra.montoTotal" type="number" min="0" step="0.01" name="cMonto" placeholder="Monto total (S/, con IGV)" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
              <input [(ngModel)]="nuevaCompra.fecha" type="date" name="cFecha" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
              <button type="submit" class="sm:col-span-2 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 w-fit">Registrar compra</button>
            </form>
          </div>
        </div>

        <div class="panel overflow-x-auto mt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Proveedor</th>
                <th class="py-2.5 px-4 font-medium">Fecha</th>
                <th class="py-2.5 px-4 font-medium">Monto</th>
                <th class="py-2.5 px-4 font-medium">IGV</th>
                <th class="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (c of store.compras(); track c.id) {
                <tr class="border-b border-ink-50">
                  <td class="py-3 px-4 text-ink-900">{{ c.proveedor }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ c.fecha }}</td>
                  <td class="py-3 px-4 text-ink-500">S/ {{ c.montoTotal.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-ink-500">S/ {{ c.igv.toFixed(2) }}</td>
                  <td class="py-3 px-4"><button (click)="eliminarCompra(c.id)" class="text-xs font-medium text-crimson-500 hover:underline">Eliminar</button></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-8 text-center text-ink-500">Sin compras registradas.</td></tr>
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

    <!-- Modal: restablecer contraseña -->
    @if (usuarioARestablecer(); as u) {
      <div class="fixed inset-0 z-30 bg-ink-900/40 flex items-center justify-center p-4" (click)="cerrarRestablecer()">
        <div class="bg-surface rounded-xl shadow-panel max-w-sm w-full p-5" (click)="$event.stopPropagation()">
          <h3 class="font-display font-700 text-lg text-ink-900">Restablecer contraseña</h3>
          <p class="text-sm text-ink-500 mt-1">Nueva contraseña para <span class="font-medium text-ink-900">{{ u.nombre }}</span> ({{ u.usuario }}).</p>

          <div class="mt-4">
            <label class="text-sm font-medium text-ink-700">Nueva contraseña</label>
            <input
              type="text" [(ngModel)]="nuevaPassword" name="nuevaPassword"
              class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          @if (restablecerError()) {
            <p class="text-sm text-crimson-500 mt-2">{{ restablecerError() }}</p>
          }
          @if (restablecerHecho()) {
            <p class="text-sm text-emerald-600 mt-2">Contraseña actualizada. Comunícasela a {{ u.nombre }} de forma segura.</p>
          }

          <div class="flex justify-end gap-2 mt-5">
            <button (click)="cerrarRestablecer()" class="px-4 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-ink-50">Cerrar</button>
            @if (!restablecerHecho()) {
              <button (click)="confirmarRestablecer()" [disabled]="restableciendo()" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">
                {{ restableciendo() ? 'Guardando...' : 'Restablecer' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal: correo (para poder usar "Recuperar acceso por correo") -->
    @if (usuarioAEditarEmail(); as u) {
      <div class="fixed inset-0 z-30 bg-ink-900/40 flex items-center justify-center p-4" (click)="cerrarEmail()">
        <div class="bg-surface rounded-xl shadow-panel max-w-sm w-full p-5" (click)="$event.stopPropagation()">
          <h3 class="font-display font-700 text-lg text-ink-900">Correo de la cuenta</h3>
          <p class="text-sm text-ink-500 mt-1">
            Para <span class="font-medium text-ink-900">{{ u.nombre }}</span> ({{ u.usuario }}). Se usa solo para
            "Recuperar acceso por correo" si esta cuenta olvida su contraseña.
          </p>

          <div class="mt-4">
            <label class="text-sm font-medium text-ink-700">Correo</label>
            <input
              type="email" [(ngModel)]="emailEditado" name="emailEditado"
              class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
              placeholder="correo@gmail.com"
            />
          </div>

          @if (emailHecho()) {
            <p class="text-sm text-emerald-600 mt-2">Correo actualizado.</p>
          }

          <div class="flex justify-end gap-2 mt-5">
            <button (click)="cerrarEmail()" class="px-4 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-ink-50">Cerrar</button>
            <button (click)="confirmarEmail()" [disabled]="guardandoEmail()" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">
              {{ guardandoEmail() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdministracionComponent implements OnInit {
  tab = signal<'usuarios' | 'deudas' | 'igv' | 'auditoria' | 'sistema'>('usuarios');
  roles: Rol[] = ['recepcion', 'mecanico', 'almacen', 'administracion'];
  nuevo: { nombre: string; usuario: string; rol: Rol | ''; email: string } = { nombre: '', usuario: '', rol: '', email: '' };

  usuarioARestablecer = signal<{ id: string; nombre: string; usuario: string } | null>(null);
  nuevaPassword = '';
  restableciendo = signal(false);
  restablecerHecho = signal(false);
  restablecerError = signal<string | null>(null);

  usuarioAEditarEmail = signal<{ id: string; nombre: string; usuario: string; email?: string | null } | null>(null);
  emailEditado = '';
  guardandoEmail = signal(false);
  emailHecho = signal(false);

  // ---------- Deudas ----------
  tabDeuda = signal<TipoDeuda>('POR_COBRAR');
  nuevaDeuda: { nombre: string; descripcion: string; montoOriginal: number | null; fechaVencimiento: string } = {
    nombre: '', descripcion: '', montoOriginal: null, fechaVencimiento: ''
  };

  constructor(public store: StoreService) {}

  ngOnInit(): void {
    this.store.cargarDeudas();
    this.store.cargarCompras();
    this.cargarResumenIgv();
  }

  // ---------- IGV ----------
  resumenIgv = signal<ResumenIgv | null>(null);
  nuevaCompra: { proveedor: string; descripcion: string; numeroComprobante: string; montoTotal: number | null; fecha: string } = {
    proveedor: '', descripcion: '', numeroComprobante: '', montoTotal: null, fecha: ''
  };

  private hoy = new Date();

  nombreMesActual(): string {
    return this.hoy.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }

  async cargarResumenIgv(): Promise<void> {
    this.resumenIgv.set(await this.store.resumenIgvMensual(this.hoy.getFullYear(), this.hoy.getMonth() + 1));
  }

  async crearCompra(): Promise<void> {
    if (!this.nuevaCompra.proveedor.trim() || !this.nuevaCompra.montoTotal || this.nuevaCompra.montoTotal <= 0 || !this.nuevaCompra.fecha) return;
    await this.store.crearCompra({
      proveedor: this.nuevaCompra.proveedor.trim(),
      descripcion: this.nuevaCompra.descripcion.trim() || undefined,
      numeroComprobante: this.nuevaCompra.numeroComprobante.trim() || undefined,
      montoTotal: this.nuevaCompra.montoTotal,
      fecha: this.nuevaCompra.fecha
    });
    this.nuevaCompra = { proveedor: '', descripcion: '', numeroComprobante: '', montoTotal: null, fecha: '' };
    await this.cargarResumenIgv();
  }

  async eliminarCompra(id: string): Promise<void> {
    await this.store.eliminarCompra(id);
    await this.cargarResumenIgv();
  }

  deudasFiltradas = computed(() => this.store.deudas().filter((d) => d.tipo === this.tabDeuda()));

  totalPendientePorCobrar = computed(() =>
    this.store.deudas().filter((d) => d.tipo === 'POR_COBRAR' && d.estado === 'PENDIENTE').reduce((acc, d) => acc + d.montoPendiente, 0)
  );

  totalPendienteBanco = computed(() =>
    this.store.deudas().filter((d) => d.tipo === 'BANCO' && d.estado === 'PENDIENTE').reduce((acc, d) => acc + d.montoPendiente, 0)
  );

  async crearDeuda(): Promise<void> {
    if (!this.nuevaDeuda.nombre.trim() || !this.nuevaDeuda.montoOriginal || this.nuevaDeuda.montoOriginal <= 0) return;
    await this.store.crearDeuda({
      tipo: this.tabDeuda(),
      nombre: this.nuevaDeuda.nombre.trim(),
      descripcion: this.nuevaDeuda.descripcion.trim() || undefined,
      montoOriginal: this.nuevaDeuda.montoOriginal,
      fechaVencimiento: this.nuevaDeuda.fechaVencimiento || null
    });
    this.nuevaDeuda = { nombre: '', descripcion: '', montoOriginal: null, fechaVencimiento: '' };
  }

  async abonar(d: Deuda): Promise<void> {
    const texto = prompt(`Abonar a "${d.nombre}" (pendiente: S/ ${d.montoPendiente.toFixed(2)}). ¿Cuánto?`);
    if (!texto) return;
    const monto = Number(texto);
    if (!monto || monto <= 0) return;
    await this.store.abonarDeuda(d.id, monto);
  }

  nombreRol(rol: Rol): string {
    return NOMBRE_ROL[rol];
  }

  rolQueRequiereEmail(): boolean {
    return this.nuevo.rol === 'administracion' && !this.nuevo.email.trim();
  }

  async crear(): Promise<void> {
    if (!this.nuevo.nombre || !this.nuevo.usuario || !this.nuevo.rol) return;
    await this.store.crearUsuario({
      nombre: this.nuevo.nombre, usuario: this.nuevo.usuario, rol: this.nuevo.rol as Rol,
      email: this.nuevo.email.trim() || undefined
    });
    this.nuevo = { nombre: '', usuario: '', rol: '', email: '' };
  }

  abrirRestablecer(u: { id: string; nombre: string; usuario: string }): void {
    this.usuarioARestablecer.set(u);
    this.nuevaPassword = '';
    this.restablecerHecho.set(false);
    this.restablecerError.set(null);
  }

  cerrarRestablecer(): void {
    this.usuarioARestablecer.set(null);
  }

  async confirmarRestablecer(): Promise<void> {
    const u = this.usuarioARestablecer();
    if (!u) return;
    if (this.nuevaPassword.trim().length < 6) {
      this.restablecerError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.restableciendo.set(true);
    this.restablecerError.set(null);
    try {
      await this.store.restablecerPasswordUsuario(u.id, this.nuevaPassword.trim());
      this.restablecerHecho.set(true);
    } catch {
      this.restablecerError.set('No se pudo restablecer la contraseña. Intenta de nuevo.');
    } finally {
      this.restableciendo.set(false);
    }
  }

  abrirEmail(u: { id: string; nombre: string; usuario: string; email?: string | null }): void {
    this.usuarioAEditarEmail.set(u);
    this.emailEditado = u.email ?? '';
    this.emailHecho.set(false);
  }

  cerrarEmail(): void {
    this.usuarioAEditarEmail.set(null);
  }

  async confirmarEmail(): Promise<void> {
    const u = this.usuarioAEditarEmail();
    if (!u) return;
    this.guardandoEmail.set(true);
    try {
      await this.store.actualizarEmailUsuario(u.id, this.emailEditado.trim());
      this.emailHecho.set(true);
    } finally {
      this.guardandoEmail.set(false);
    }
  }

  async recargar(): Promise<void> {
    await this.store.cargarTodo();
  }
}
