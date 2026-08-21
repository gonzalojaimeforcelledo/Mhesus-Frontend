import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente, ItemVenta, TipoVenta } from '../../core/models/models';
import { descargarVentaPdf } from './venta-pdf.util';

interface FilaCarrito extends ItemVenta {
  id: string;
}

@Component({
  selector: 'app-venta-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-5xl">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Nueva venta</h1>
          <p class="text-sm text-ink-500">Genera una boleta, factura o proforma.</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-ink-500 cursor-pointer select-none">
          <input type="checkbox" [(ngModel)]="esProforma" name="esProforma" class="rounded border-ink-100 accent-navy-700" />
          Solo proforma (no genera comprobante oficial)
        </label>
      </div>

      <div class="panel p-6 space-y-5">
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="relative">
            <label class="text-sm font-medium text-ink-700">Cliente</label>
            <input
              [(ngModel)]="dniBusqueda" name="dniBusqueda" (ngModelChange)="onDniChange($event)"
              class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500"
              placeholder="Buscar por DNI, o deja vacío para 'Cliente varios'"
            />
            @if (sugerenciasClientes().length) {
              <div class="absolute z-10 mt-1 w-full bg-surface border border-ink-100 rounded-lg shadow-panel max-h-48 overflow-y-auto">
                @for (c of sugerenciasClientes(); track c.id) {
                  <button type="button" (click)="elegirCliente(c)" class="w-full text-left px-3 py-2 text-sm hover:bg-ink-50">
                    {{ c.nombres }} {{ c.apellidos }} <span class="text-ink-400 font-mono">· {{ c.dni }}</span>
                  </button>
                }
              </div>
            }
            @if (clienteElegido(); as c) {
              <p class="text-xs text-emerald-600 mt-1.5">{{ c.nombres }} {{ c.apellidos }} · {{ c.dni }}</p>
            }
          </div>

          @if (!esProforma) {
            <div>
              <label class="text-sm font-medium text-ink-700">Tipo de comprobante</label>
              <select [(ngModel)]="tipo" name="tipo" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500">
                <option value="BOLETA">Boleta de venta</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>
          }
        </div>

        <!-- Buscador / carrito de productos -->
        <div>
          <label class="text-sm font-medium text-ink-700">Buscar producto</label>
          <div class="relative mt-1">
            <input
              [ngModel]="buscarProducto()" (ngModelChange)="buscarProducto.set($event)" name="buscarProducto"
              class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500"
              placeholder="Buscar por código o nombre..."
            />
            @if (sugerenciasProductos().length) {
              <div class="absolute z-10 mt-1 w-full bg-surface border border-ink-100 rounded-lg shadow-panel max-h-56 overflow-y-auto">
                @for (p of sugerenciasProductos(); track p.id) {
                  <button type="button" (click)="agregarProducto(p)" class="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 flex justify-between">
                    <span>{{ p.nombre }} <span class="text-ink-400 font-mono">· {{ p.codigo }}</span></span>
                    <span class="text-ink-500">S/ {{ p.precio.toFixed(2) }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div class="border border-ink-100 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 bg-ink-50/60">
                <th class="py-2 px-3 font-medium">Descripción</th>
                <th class="py-2 px-3 font-medium w-24">Cant.</th>
                <th class="py-2 px-3 font-medium w-28">P. Unit.</th>
                <th class="py-2 px-3 font-medium w-28">Importe</th>
                <th class="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              @for (fila of carrito(); track fila.id) {
                <tr class="border-t border-ink-50">
                  <td class="py-2 px-3">{{ fila.descripcion }}</td>
                  <td class="py-2 px-3">
                    <input type="number" min="1" [ngModel]="fila.cantidad" (ngModelChange)="cambiarCantidad(fila.id, $event)" class="w-16 rounded border border-ink-100 px-2 py-1 text-sm" />
                  </td>
                  <td class="py-2 px-3 text-ink-500">S/ {{ fila.precioUnitario.toFixed(2) }}</td>
                  <td class="py-2 px-3 font-medium text-ink-900">S/ {{ (fila.cantidad * fila.precioUnitario).toFixed(2) }}</td>
                  <td class="py-2 px-3">
                    <button (click)="quitarFila(fila.id)" class="text-ink-300 hover:text-crimson-500">
                      <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-8 text-center text-ink-400">Busca y agrega productos para empezar.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <div class="w-64 space-y-1.5">
            <div class="flex justify-between text-sm text-ink-500"><span>Subtotal</span><span>S/ {{ subtotal().toFixed(2) }}</span></div>
            <div class="flex justify-between text-sm text-ink-500"><span>IGV (18%)</span><span>S/ {{ igv().toFixed(2) }}</span></div>
            <div class="flex justify-between font-display font-700 text-lg text-navy-700 pt-1 border-t border-ink-100"><span>TOTAL</span><span>S/ {{ total().toFixed(2) }}</span></div>
          </div>
        </div>

        @if (mensajeError()) {
          <p class="text-sm text-crimson-500">{{ mensajeError() }}</p>
        }

        <div class="flex justify-end gap-3">
          <a routerLink="/ventas" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">Cancelar</a>
          <button (click)="procesar()" [disabled]="!carrito().length || procesando()" class="px-6 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">
            {{ procesando() ? 'Procesando...' : 'PROCESAR' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class VentaNuevaComponent implements OnInit {
  esProforma = false;
  tipo: TipoVenta = 'BOLETA';
  dniBusqueda = '';
  buscarProducto = signal('');
  clienteElegido = signal<Cliente | undefined>(undefined);
  sugerenciasClientes = signal<Cliente[]>([]);
  carrito = signal<FilaCarrito[]>([]);
  procesando = signal(false);
  mensajeError = signal<string | null>(null);
  otId: string | null = null;

  private debounceDni?: ReturnType<typeof setTimeout>;
  private contador = 0;

  constructor(public store: StoreService, private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.store.cargarClientes(), this.store.cargarProductos(), this.store.cargarMotos(), this.store.cargarOts(), this.store.cargarCotizaciones()]);
    this.otId = this.route.snapshot.queryParamMap.get('otId');
    if (this.otId) {
      await this.precargarDesdeOT(this.otId);
    }
  }

  /** Si se llega desde una OT (repuestos que el mecánico pidió y el cliente ya autorizó en la cotización), precarga esos ítems. */
  private async precargarDesdeOT(otId: string): Promise<void> {
    const ot = this.store.ot(otId);
    if (!ot) return;
    const cliente = this.store.cliente(ot.clienteId);
    if (cliente) {
      this.clienteElegido.set(cliente);
      this.dniBusqueda = cliente.dni;
    }
    const cot = this.store.cotizacionDeOT(otId);
    if (cot && cot.autorizado) {
      const filas: FilaCarrito[] = cot.detalle.map((item) => ({
        id: `f${this.contador++}`,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      }));
      this.carrito.set(filas);
    }
  }

  onDniChange(valor: string): void {
    this.dniBusqueda = valor;
    this.clienteElegido.set(undefined);
    if (this.debounceDni) clearTimeout(this.debounceDni);
    if (valor.trim().length < 3) {
      this.sugerenciasClientes.set([]);
      return;
    }
    const consulta = valor;
    this.debounceDni = setTimeout(async () => {
      const resultado = await this.store.buscarClientesPorDniEnServidor(consulta);
      if (this.dniBusqueda === consulta) this.sugerenciasClientes.set(resultado.slice(0, 5));
    }, 350);
  }

  elegirCliente(c: Cliente): void {
    this.clienteElegido.set(c);
    this.dniBusqueda = c.dni;
    this.sugerenciasClientes.set([]);
  }

  sugerenciasProductos = computed(() => {
    const q = this.buscarProducto().trim().toLowerCase();
    if (q.length < 2) return [];
    return this.store.productos()
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
      .slice(0, 8);
  });

  agregarProducto(p: { id: string; nombre: string; precio: number }): void {
    this.carrito.update((filas) => [...filas, { id: `f${this.contador++}`, descripcion: p.nombre, cantidad: 1, precioUnitario: p.precio }]);
    this.buscarProducto.set('');
  }

  cambiarCantidad(id: string, cantidad: number): void {
    this.carrito.update((filas) => filas.map((f) => (f.id === id ? { ...f, cantidad: Math.max(1, cantidad) } : f)));
  }

  quitarFila(id: string): void {
    this.carrito.update((filas) => filas.filter((f) => f.id !== id));
  }

  total = computed(() => this.carrito().reduce((acc, f) => acc + f.cantidad * f.precioUnitario, 0));
  subtotal = computed(() => this.total() / 1.18);
  igv = computed(() => this.total() - this.subtotal());

  async procesar(): Promise<void> {
    if (!this.carrito().length) return;
    this.procesando.set(true);
    this.mensajeError.set(null);
    try {
      const c = this.clienteElegido();
      const venta = await this.store.crearVenta({
        tipo: this.esProforma ? 'PROFORMA' : this.tipo,
        otId: this.otId,
        clienteId: c?.id ?? null,
        clienteNombre: c ? `${c.nombres} ${c.apellidos}` : 'Cliente varios',
        clienteDocumento: c?.dni ?? null,
        items: this.carrito().map(({ descripcion, cantidad, precioUnitario }) => ({ descripcion, cantidad, precioUnitario }))
      });
      await descargarVentaPdf(venta, c);
      this.router.navigateByUrl('/ventas');
    } catch {
      this.mensajeError.set('No se pudo procesar la venta. Intenta de nuevo.');
    } finally {
      this.procesando.set(false);
    }
  }
}
