import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoPedido, Producto } from '../../core/models/models';
import { FotoCapturaComponent } from '../../shared/components/foto-captura.component';

interface ItemPedidoForm { productoId: string; nombreBusqueda: string; cantidad: number; abierto: boolean }

@Component({
  selector: 'app-ot-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FotoCapturaComponent],
  template: `
    @if (ot(); as o) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a [routerLink]="['/ot', otId()]" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver a la OT {{ o.numeroOT }}
        </a>

        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Pedido de almacén</h1>
          <p class="text-sm text-ink-500">{{ o.numeroOT }} — {{ store.moto(o.motoId)?.placa }} · {{ store.cliente(o.clienteId)?.nombres }} {{ store.cliente(o.clienteId)?.apellidos }}</p>
        </div>

        <div class="panel p-6">
          @for (p of pedidos(); track p.id) {
            <div class="border border-ink-100 rounded-xl p-4 mb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-ink-500">Pedido {{ p.creadoEn | date:'short' }}</span>
                <span class="text-sm font-medium" [class]="claseEstadoPedido(p.estado)">{{ p.estado }}</span>
              </div>
              <ul class="text-sm space-y-1">
                @for (d of store.detalleDePedido(p.id); track d.id) {
                  <li class="flex justify-between text-ink-700">
                    <span>{{ etiquetaPedidoItem(d.productoId) }} × {{ d.cantidadSolicitada }}</span>
                    <span class="text-xs text-ink-400">{{ d.cantidadDespachada }}/{{ d.cantidadSolicitada }} desp.</span>
                  </li>
                }
              </ul>
              @if (p.fotoDespacho) {
                <img [src]="p.fotoDespacho" alt="Foto del despacho" class="mt-3 h-24 rounded-lg border border-ink-100 object-cover" />
              }

              @if (p.estado === 'Solicitado' && esRecepcion()) {
                <button (click)="confirmarYEnviar(o.id, p.id)" class="mt-3 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">
                  Cliente aceptó → Enviar a Almacén
                </button>
              }
              @if (p.estado === 'Solicitado' && puedeDespachar()) {
                <p class="mt-3 text-sm text-ink-400">Pendiente de que Recepción confirme el presupuesto con el cliente.</p>
              }
              @if (p.estado === 'Aprobado' && puedeDespachar()) {
                <div class="mt-3 pt-3 border-t border-ink-100">
                  <app-foto-captura
                    label="Foto de los productos entregados (opcional)" textoBoton="Tomar o subir foto del despacho"
                    [valor]="fotosDespacho[p.id] ?? null" (valorChange)="fotosDespacho[p.id] = $event"
                  />
                  <button (click)="despachar(p.id)" class="mt-3 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Confirmar despacho</button>
                </div>
              }
            </div>
          } @empty {
            <p class="text-sm text-ink-500 mb-4">Sin pedidos registrados todavía.</p>
          }

          @if (mensaje()) { <p class="text-sm text-crimson-500 mb-3">{{ mensaje() }}</p> }
          @if (mensajeExito()) { <p class="text-sm text-emerald-600 mb-3">{{ mensajeExito() }}</p> }

          @if (puedeGenerarPedido()) {
            <div class="pt-5 border-t border-ink-100 mt-5">
              <p class="text-sm font-medium text-ink-700 mb-4">Nuevo pedido</p>
              @for (item of pedidoItems(); track $index; let i = $index) {
                <div class="flex items-center gap-3 mb-3">
                  <div class="relative flex-1">
                    <div class="flex items-center gap-2 rounded-xl border border-ink-100 focus-within:border-navy-500 px-3 py-2.5">
                      <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                      <input
                        [(ngModel)]="item.nombreBusqueda" [name]="'prodq'+i" placeholder="Buscar producto por nombre..."
                        (focus)="item.abierto = true" (blur)="item.abierto = false"
                        (ngModelChange)="item.productoId = ''"
                        class="w-full text-sm outline-none"
                      />
                    </div>
                    @if (item.abierto && productosFiltrados(item.nombreBusqueda).length) {
                      <div class="absolute z-10 mt-1.5 w-full bg-surface border border-ink-100 rounded-xl shadow-panel max-h-64 overflow-y-auto py-1">
                        @for (p of productosFiltrados(item.nombreBusqueda); track p.id) {
                          <button type="button" (mousedown)="elegirProducto(item, p)" class="w-full flex items-center gap-3 text-left px-3 py-2.5 hover:bg-wing-100/40">
                            <span class="w-9 h-9 rounded-full bg-wing-100 grid place-items-center shrink-0">
                              <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 1-5.66 5.66L4 17v3h3l5.03-5.03a4 4 0 0 1 5.67-5.67L21 6l-3-3-3.3 3.3Z"/></svg>
                            </span>
                            <span class="text-sm font-medium text-ink-900">{{ etiquetaProducto(p) }}</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <input type="number" min="1" [(ngModel)]="item.cantidad" [name]="'cant'+i" class="w-20 rounded-xl border border-ink-100 px-3 py-2.5 text-sm text-center" />
                  <button type="button" (click)="quitarItemPedido(i)" class="text-ink-300 hover:text-crimson-500 text-lg leading-none px-1">✕</button>
                </div>
              }
              <div class="flex items-center gap-3 mt-4">
                <button type="button" (click)="agregarItemPedido()" class="text-sm font-medium text-brand-700 hover:underline">+ Agregar producto</button>
                <button type="button" (click)="generarPedido(o.id)" [disabled]="!huboSeleccion()" class="ml-auto px-6 py-2.5 rounded-xl bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 disabled:opacity-40">Generar pedido</button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class OtPedidoComponent implements OnInit {
  otId = signal<string>('');
  mensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  fotosDespacho: Record<string, string | null> = {};
  private _pedidoItems = signal<ItemPedidoForm[]>([{ productoId: '', nombreBusqueda: '', cantidad: 1, abierto: false }]);
  pedidoItems = this._pedidoItems.asReadonly();

  constructor(public store: StoreService, private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => this.otId.set(params.get('id') ?? ''));
    this.store.cargarOts();
    this.store.cargarPedidos();
    this.store.cargarPedidoDetalle();
    this.store.cargarProductos();
  }

  ot = computed(() => this.store.ot(this.otId()));
  pedidos = computed(() => this.store.pedidosDeOT(this.otId()));

  esRecepcion(): boolean { return this.auth.rol() === 'recepcion'; }
  esMecanicoAsignado(): boolean {
    const o = this.ot();
    return this.auth.rol() === 'mecanico' && !!o && o.mecanicoId === this.auth.usuario()?.id;
  }
  puedeGenerarPedido(): boolean { return this.esMecanicoAsignado(); }
  puedeDespachar(): boolean { return this.auth.rol() === 'almacen'; }

  private nivelProducto() {
    const rol = this.auth.rol();
    if (rol === 'almacen' || rol === 'administracion') return 'completo' as const;
    if (rol === 'recepcion') return 'con_precio' as const;
    return 'solo_nombre' as const;
  }
  etiquetaProducto(p: Producto): string {
    const nivel = this.nivelProducto();
    if (nivel === 'solo_nombre') return p.nombre;
    if (nivel === 'con_precio') return `${p.codigo} — ${p.nombre} (S/ ${p.precio})`;
    return `${p.codigo} — ${p.nombre} (stock ${p.stockActual})`;
  }
  etiquetaPedidoItem(productoId: string): string {
    const p = this.store.producto(productoId);
    if (!p) return '—';
    return this.nivelProducto() === 'solo_nombre' ? p.nombre : `${p.codigo} — ${p.nombre}`;
  }
  productosFiltrados(query: string): Producto[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.store.productos().filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 6);
  }
  elegirProducto(item: ItemPedidoForm, p: Producto): void {
    item.productoId = p.id;
    item.nombreBusqueda = p.nombre;
    item.abierto = false;
  }
  huboSeleccion(): boolean {
    return this.pedidoItems().some((i) => i.productoId && i.cantidad > 0);
  }
  claseEstadoPedido(estado: EstadoPedido): string {
    if (estado === 'Despachado') return 'text-emerald-600';
    if (estado === 'Aprobado') return 'text-brand-700';
    if (estado === 'Cancelado') return 'text-crimson-500';
    return 'text-amber-500';
  }

  private uid(): string { return this.auth.usuario()?.id ?? ''; }

  agregarItemPedido(): void { this._pedidoItems.update((arr) => [...arr, { productoId: '', nombreBusqueda: '', cantidad: 1, abierto: false }]); }
  quitarItemPedido(i: number): void { this._pedidoItems.update((arr) => arr.filter((_, idx) => idx !== i)); }

  async generarPedido(otId: string): Promise<void> {
    const items = this._pedidoItems().filter((i) => i.productoId && i.cantidad > 0).map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
    if (!items.length) return;
    await this.store.generarPedidoAlmacen(otId, items, this.uid());
    this._pedidoItems.set([{ productoId: '', nombreBusqueda: '', cantidad: 1, abierto: false }]);
  }

  async confirmarYEnviar(otId: string, pedidoId: string): Promise<void> {
    const res = await this.store.confirmarAceptacionYEnviarAAlmacen(otId, pedidoId, this.uid());
    if (res.ok) {
      this.mensajeExito.set('Confirmado: el cliente aceptó el presupuesto. Pedido enviado a Almacén.');
      this.mensaje.set(null);
    } else {
      this.mensaje.set(res.error ?? null);
    }
  }

  async despachar(pedidoId: string): Promise<void> {
    const res = await this.store.despacharPedido(pedidoId, this.uid(), this.fotosDespacho[pedidoId] ?? null);
    this.mensaje.set(res.ok ? null : res.error ?? null);
  }
}
