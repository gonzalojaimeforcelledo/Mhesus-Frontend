import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { ItemCotizacion } from '../../core/models/models';

@Component({
  selector: 'app-ot-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (ot(); as o) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a [routerLink]="['/ot', otId()]" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver a la OT {{ o.numeroOT }}
        </a>

        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Cotización</h1>
          <p class="text-sm text-ink-500">{{ o.numeroOT }} — {{ store.moto(o.motoId)?.placa }} · {{ store.cliente(o.clienteId)?.nombres }} {{ store.cliente(o.clienteId)?.apellidos }}</p>
        </div>

        <div class="panel p-6">
          @if (cotizacion(); as cot) {
            <div class="overflow-x-auto mb-5">
              <table class="w-full text-sm">
                <thead><tr class="text-left text-ink-500 border-b border-ink-100"><th class="py-2 font-medium">Descripción</th><th class="py-2 font-medium">Cant.</th><th class="py-2 font-medium">P. Unit.</th><th class="py-2 font-medium text-right">Subtotal</th></tr></thead>
                <tbody>
                  @for (item of cot.detalle; track item.descripcion) {
                    <tr class="border-b border-ink-50">
                      <td class="py-2 text-ink-900">{{ item.descripcion }}</td>
                      <td class="py-2 text-ink-500">{{ item.cantidad }}</td>
                      <td class="py-2 text-ink-500">S/ {{ item.precioUnitario }}</td>
                      <td class="py-2 text-right text-ink-900">S/ {{ item.cantidad * item.precioUnitario }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between flex-wrap gap-3">
              <p class="font-display font-700 text-xl text-ink-900">Total: S/ {{ cot.montoTotal }}</p>
              @if (cot.autorizado) {
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-full">Autorizado por el cliente</span>
                  @if (esRecepcion() || esAdministracion()) {
                    <a [routerLink]="['/ventas/nueva']" [queryParams]="{ otId: otId() }" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 text-white text-sm font-medium">Generar venta →</a>
                  }
                </div>
              } @else if (esRecepcion()) {
                <button (click)="autorizar(cot.id)" class="px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Registrar autorización del cliente</button>
              }
            </div>
          } @else {
            <p class="text-sm text-ink-500 mb-4">Aún no se ha generado una cotización.</p>
          }

          @if (pedidos().length && productosPedido().length) {
            <div class="rounded-lg border border-navy-500/20 bg-navy-500/5 p-4 mt-2 mb-2">
              <p class="text-sm font-medium text-navy-700 mb-3">Productos que pidió el mecánico</p>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-ink-500 border-b border-navy-500/10">
                      <th class="py-1.5 font-medium">Producto</th>
                      <th class="py-1.5 font-medium">Cant.</th>
                      <th class="py-1.5 font-medium">Precio catálogo</th>
                      <th class="py-1.5 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of productosPedido(); track item.productoId) {
                      <tr class="border-b border-navy-500/10 last:border-0">
                        <td class="py-2 text-ink-900">{{ item.nombre }}</td>
                        <td class="py-2 text-ink-500">{{ item.cantidad }}</td>
                        <td class="py-2 text-ink-500">S/ {{ item.precio.toFixed(2) }}</td>
                        <td class="py-2 text-right text-ink-900">S/ {{ (item.cantidad * item.precio).toFixed(2) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="flex justify-end mt-2 pt-2 border-t border-navy-500/10">
                <p class="text-sm font-display font-700 text-navy-700">Total: S/ {{ totalProductosPedido().toFixed(2) }}</p>
              </div>
              <p class="text-xs text-ink-500 mt-2">Úsalo de referencia para armar la cotización — puedes ajustar precios (ej. descuentos) al guardarla.</p>
            </div>
          }

          @if (esRecepcion() && (!cotizacion() || !cotizacion()!.autorizado)) {
            <div class="pt-5 border-t border-ink-100 mt-5">
              <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p class="text-sm font-medium text-ink-700">{{ cotizacion() ? 'Editar cotización' : 'Nueva cotización' }}</p>
                @if (pedidos().length) {
                  <button type="button" (click)="cargarProductosDelPedido()" class="text-sm font-medium text-brand-700 hover:underline">Cargar productos del pedido (con precio) →</button>
                }
              </div>
              @for (item of cotizacionItems(); track $index; let i = $index) {
                <div class="flex items-center gap-3 mb-3">
                  <input placeholder="Descripción" [(ngModel)]="item.descripcion" [name]="'desc'+i" class="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-sm" />
                  <input type="number" min="1" placeholder="Cant." [(ngModel)]="item.cantidad" [name]="'cantc'+i" class="w-20 rounded-lg border border-ink-100 px-3 py-2 text-sm" />
                  <input type="number" min="0" placeholder="P. Unit." [(ngModel)]="item.precioUnitario" [name]="'precio'+i" class="w-28 rounded-lg border border-ink-100 px-3 py-2 text-sm" />
                  <button type="button" (click)="quitarItemCotizacion(i)" class="text-ink-300 hover:text-crimson-500 text-lg leading-none px-1">✕</button>
                </div>
              }
              <div class="flex items-center gap-3 mt-4 flex-wrap">
                <button type="button" (click)="agregarItemCotizacion()" class="text-sm font-medium text-brand-700 hover:underline">+ Agregar ítem</button>
                <button type="button" (click)="agregarServicioMecanico()" class="text-sm font-medium text-brand-700 hover:underline">+ Agregar servicio del mecánico (mano de obra)</button>
                <button type="button" (click)="guardarCotizacion(o.id)" [disabled]="!cotizacionItems().length" class="ml-auto px-6 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 disabled:opacity-40">Guardar cotización</button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class OtCotizacionComponent implements OnInit {
  otId = signal<string>('');
  private _cotizacionItems = signal<ItemCotizacion[]>([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  cotizacionItems = this._cotizacionItems.asReadonly();

  constructor(public store: StoreService, private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => this.otId.set(params.get('id') ?? ''));
    this.store.cargarOts();
    this.store.cargarCotizaciones();
    this.store.cargarPedidos();
    this.store.cargarPedidoDetalle();
    this.store.cargarProductos();
  }

  ot = computed(() => this.store.ot(this.otId()));
  diagnostico = computed(() => this.store.diagnosticoDeOT(this.otId()));
  pedidos = computed(() => this.store.pedidosDeOT(this.otId()));
  cotizacion = computed(() => this.store.cotizacionDeOT(this.otId()));

  /** Productos que el mecánico pidió a Almacén, con su precio de catálogo — referencia para que Recepción cotice con el cliente. */
  productosPedido = computed(() => {
    const pedido = this.pedidos()[this.pedidos().length - 1];
    if (!pedido) return [];
    return this.store.detalleDePedido(pedido.id).map((d) => {
      const p = this.store.producto(d.productoId);
      return { productoId: d.productoId, nombre: p?.nombre ?? 'Producto', cantidad: d.cantidadSolicitada, precio: p?.precio ?? 0 };
    });
  });

  totalProductosPedido = computed(() => this.productosPedido().reduce((acc, i) => acc + i.cantidad * i.precio, 0));

  esRecepcion(): boolean { return this.auth.rol() === 'recepcion'; }
  esAdministracion(): boolean { return this.auth.rol() === 'administracion'; }

  private uid(): string { return this.auth.usuario()?.id ?? ''; }

  agregarItemCotizacion(): void { this._cotizacionItems.update((arr) => [...arr, { descripcion: '', cantidad: 1, precioUnitario: 0 }]); }

  /** Atajo para sumar la mano de obra / servicio del mecánico a la cotización, con precio libre para que Recepción lo complete. */
  agregarServicioMecanico(): void {
    const sugerencia = this.diagnostico()?.diagnostico || this.ot()?.servicioARealizar || '';
    const descripcion = sugerencia ? `Mano de obra — ${sugerencia}` : 'Mano de obra';
    this._cotizacionItems.update((arr) => [...arr, { descripcion, cantidad: 1, precioUnitario: 0 }]);
  }

  quitarItemCotizacion(i: number): void { this._cotizacionItems.update((arr) => arr.filter((_, idx) => idx !== i)); }

  /** Trae los productos solicitados por el mecánico con su precio de catálogo, listos para cotizar. */
  cargarProductosDelPedido(): void {
    const items: ItemCotizacion[] = this.productosPedido().map((i) => ({ descripcion: i.nombre, cantidad: i.cantidad, precioUnitario: i.precio }));
    if (!items.length) return;
    this._cotizacionItems.set(items);
  }

  async guardarCotizacion(otId: string): Promise<void> {
    const items = this._cotizacionItems().filter((i) => i.descripcion && i.cantidad > 0);
    if (!items.length) return;
    await this.store.generarCotizacion(otId, items);
    this._cotizacionItems.set([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  }

  async autorizar(cotizacionId: string): Promise<void> {
    await this.store.autorizarCotizacion(cotizacionId, this.uid());
  }
}
