import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { FotoCapturaComponent } from '../../shared/components/foto-captura.component';
import { PasoProceso, ProcesoStepperComponent } from '../../shared/components/proceso-stepper.component';
import { EstadoOT, EstadoPedido, ItemCotizacion, OrdenTrabajo, Producto, SECUENCIA_ESTADOS_OT } from '../../core/models/models';
import { siguienteEstado } from '../../core/services/ot-state-machine';
import { NivelProducto, nivelVistaProducto } from '../../core/services/permissions';
import { descargarOtPdf } from './ot-pdf.util';

type Seccion = 'diagnostico' | 'almacen' | 'cotizacion' | 'auditoria';
interface ItemPedidoForm { productoId: string; nombreBusqueda: string; cantidad: number; abierto: boolean }

@Component({
  selector: 'app-ot-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EstadoBadgeComponent, ProcesoStepperComponent, FotoCapturaComponent],
  template: `
    @if (ot(); as o) {
      <div class="max-w-4xl mx-auto space-y-6">
        <a routerLink="/ot" class="text-xs text-brand-700 hover:underline">← Volver a Órdenes de Trabajo</a>

        <!-- Cabecera -->
        <div class="panel p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-mono text-xs text-ink-500">{{ o.numeroOT }}</p>
              <h1 class="font-display font-700 text-2xl text-ink-900">{{ store.moto(o.motoId)?.placa }} — {{ store.moto(o.motoId)?.marca }} {{ store.moto(o.motoId)?.modelo }}</h1>
              <p class="text-sm text-ink-500 mt-1">{{ store.cliente(o.clienteId)?.nombres }} {{ store.cliente(o.clienteId)?.apellidos }} · {{ store.cliente(o.clienteId)?.celular }}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <app-estado-badge [estado]="o.estado" />
              <p class="text-xs text-ink-500">Mecánico: {{ store.usuario(o.mecanicoId)?.nombre ?? 'Sin asignar' }}</p>
              @if (tiempoServicio(); as t) {
                <span class="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full" [class]="t.corriendo ? 'bg-navy-700/10 text-brand-700' : 'bg-ink-100 text-ink-500'">
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                  {{ t.corriendo ? 'En curso: ' : 'Tiempo total: ' }}{{ t.texto }}
                </span>
              }
            </div>
          </div>

          <div class="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-ink-100 text-sm">
            <div>
              <p class="text-xs text-ink-500">Observación del cliente</p>
              <p class="text-ink-900">{{ o.observacionCliente }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-500">Servicio a realizar</p>
              <p class="text-ink-900">{{ o.servicioARealizar }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-500">Kilometraje / Combustible</p>
              <p class="text-ink-900">{{ store.moto(o.motoId)?.kmActual | number }} km · {{ o.nivelCombustible }}</p>
            </div>
          </div>

          @if (o.fotoIngreso) {
            <div class="mt-4 pt-4 border-t border-ink-100">
              <p class="text-xs text-ink-500 mb-2">Foto de ingreso</p>
              <img [src]="o.fotoIngreso" alt="Foto de ingreso de la moto" class="h-28 rounded-lg border border-ink-100 object-cover" />
            </div>
          }

          <!-- Acciones de estado -->
          <div class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-ink-100">
            @if (!o.mecanicoId && puedeAsignar()) {
              <select [(ngModel)]="mecanicoElegido" class="rounded-lg border border-ink-100 px-3 py-2 text-sm">
                <option [ngValue]="null" disabled>Asignar mecánico...</option>
                @for (m of store.mecanicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombre }}</option> }
              </select>
              <button (click)="asignar(o.id)" [disabled]="!mecanicoElegido" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 disabled:opacity-40">Asignar</button>
            }

            @if (siguiente() && puedeAvanzar()) {
              <button
                (click)="avanzar(o.id)"
                class="px-4 py-2 rounded-lg text-white text-sm font-medium"
                [class]="esMecanicoAsignado() && trabajoEnCurso() ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-navy-700 hover:bg-navy-900'"
              >
                {{ etiquetaAvanzar(o) }}
              </button>
            }

            @if (o.estado === 'Lista para entrega' && esRecepcion()) {
              <button (click)="cerrar(o.id)" class="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Registrar cobro y cerrar OT</button>
            }

            @if (o.estado === 'Cerrada' && (esRecepcion() || esAdministracion())) {
              <button (click)="descargarPdf(o)" [disabled]="generandoPdf()" class="px-4 py-2 rounded-lg border border-navy-700 text-brand-700 text-sm font-medium hover:bg-navy-700 hover:text-white transition-colors disabled:opacity-40 flex items-center gap-2">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                {{ generandoPdf() ? 'Generando...' : 'Descargar OT (PDF)' }}
              </button>
            }

            @if (esAdministracion() && o.estado !== 'Cerrada') {
              <div class="flex items-center gap-2 ml-auto">
                <select [(ngModel)]="estadoForzado" class="rounded-lg border border-amber-400/50 bg-amber-400/5 px-3 py-2 text-xs">
                  <option [ngValue]="null" disabled>Forzar estado (excepción)...</option>
                  @for (e of estados; track e) { <option [ngValue]="e">{{ e }}</option> }
                </select>
                <button (click)="forzarEstado(o.id)" [disabled]="!estadoForzado" class="px-3 py-2 rounded-lg border border-amber-400 text-amber-500 text-xs font-medium disabled:opacity-40">Aplicar</button>
              </div>
            }
          </div>
          @if (mensaje()) { <p class="text-sm text-crimson-500 mt-3">{{ mensaje() }}</p> }
          @if (mensajeExito()) {
            <p class="text-sm text-emerald-600 mt-3 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
              {{ mensajeExito() }}
            </p>
          }
        </div>

        <!-- Proceso de la OT: una pantalla por paso -->
        <div class="panel px-6 pt-5 pb-3">
          <div class="flex items-center justify-between mb-1">
            <p class="text-xs font-medium text-ink-500">Proceso de la orden</p>
            <button
              type="button" (click)="seccion.set('auditoria')"
              class="flex items-center gap-1.5 text-xs font-medium"
              [class]="seccion() === 'auditoria' ? 'text-brand-700' : 'text-ink-400 hover:text-brand-700'"
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"/></svg>
              Ver historial
            </button>
          </div>
          <app-proceso-stepper [pasos]="pasosProceso()" (seleccion)="irASeccion($any($event))" />
        </div>

        <!-- Sección: Diagnóstico -->
        @if (seccion() === 'diagnostico') {
          <div class="panel p-5">
            <h2 class="font-display font-600 text-ink-900 mb-3">Diagnóstico</h2>
            @if (diagnostico(); as d) {
              <div class="text-sm space-y-2 mb-4">
                <p><span class="text-ink-500">Diagnóstico:</span> {{ d.diagnostico }}</p>
                <p><span class="text-ink-500">Sugerencias:</span> {{ d.sugerencias }}</p>
                <p class="text-xs text-ink-300">Registrado por {{ d.mecanicoNombre }}</p>
                @if (d.fotoDiagnostico) {
                  <img [src]="d.fotoDiagnostico" alt="Evidencia del diagnóstico" class="h-24 rounded-lg border border-ink-100 object-cover" />
                }
              </div>
            }
            @if (puedeDiagnosticar()) {
              <form (ngSubmit)="guardarDiagnostico(o.id)" class="space-y-3" [class.pt-4]="!!diagnostico()" [class.border-t]="!!diagnostico()" [class.border-ink-100]="!!diagnostico()">
                <textarea [(ngModel)]="formDiag.diagnostico" name="diagnostico" rows="3" required placeholder="Diagnóstico técnico..." class="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500"></textarea>
                <textarea [(ngModel)]="formDiag.sugerencias" name="sugerencias" rows="3" placeholder="Sugerencias / insumos necesarios..." class="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500"></textarea>
                <app-foto-captura
                  [label]="diagnostico() ? 'Foto de evidencia (opcional al editar)' : 'Foto de evidencia (obligatoria)'" textoBoton="Tomar o subir foto del diagnóstico"
                  [valor]="formDiag.foto" (valorChange)="formDiag.foto = $event"
                />
                @if (intentoDiagnostico() && !diagnostico() && !formDiag.foto) {
                  <p class="text-sm text-crimson-500">Falta la foto de evidencia — es obligatoria al registrar el diagnóstico por primera vez.</p>
                }
                <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">{{ diagnostico() ? 'Actualizar diagnóstico' : 'Guardar y continuar a Pedido de almacén →' }}</button>
              </form>
            } @else if (!diagnostico()) {
              <p class="text-sm text-ink-500">Aún no se ha registrado un diagnóstico para esta OT.</p>
            }
          </div>
        }

        <!-- Sección: Pedido de almacén -->
        @if (seccion() === 'almacen') {
          <div class="panel p-5">
            <h2 class="font-display font-600 text-ink-900 mb-3">Pedidos de almacén</h2>
            @for (p of pedidos(); track p.id) {
              <div class="border border-ink-100 rounded-lg p-3 mb-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-ink-500">Pedido {{ p.creadoEn | date:'short' }}</span>
                  <span class="text-xs font-medium" [class]="claseEstadoPedido(p.estado)">{{ p.estado }}</span>
                </div>
                <ul class="text-sm space-y-0.5">
                  @for (d of store.detalleDePedido(p.id); track d.id) {
                    <li class="flex justify-between text-ink-700">
                      <span>{{ etiquetaPedidoItem(d.productoId) }} × {{ d.cantidadSolicitada }}</span>
                      <span class="text-xs text-ink-400">{{ d.cantidadDespachada }}/{{ d.cantidadSolicitada }} desp.</span>
                    </li>
                  }
                </ul>
                @if (p.fotoDespacho) {
                  <img [src]="p.fotoDespacho" alt="Foto del despacho" class="mt-2 h-20 rounded-lg border border-ink-100 object-cover" />
                }

                @if (p.estado === 'Solicitado' && esRecepcion()) {
                  <button (click)="confirmarYEnviar(o.id, p.id)" class="mt-2 px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900">
                    Cliente aceptó → Enviar a Almacén
                  </button>
                }
                @if (p.estado === 'Solicitado' && puedeDespachar()) {
                  <p class="mt-2 text-xs text-ink-400">Pendiente de que Recepción confirme el presupuesto con el cliente.</p>
                }
                @if (p.estado === 'Aprobado' && puedeDespachar()) {
                  <div class="mt-2 pt-2 border-t border-ink-100">
                    <app-foto-captura
                      label="Foto de los productos entregados (opcional)" textoBoton="Tomar o subir foto del despacho"
                      [valor]="fotosDespacho[p.id] ?? null" (valorChange)="fotosDespacho[p.id] = $event"
                    />
                    <button (click)="despachar(p.id)" class="mt-2 px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900">Confirmar despacho</button>
                  </div>
                }
              </div>
            } @empty {
              <p class="text-sm text-ink-500 mb-3">Sin pedidos registrados.</p>
            }

            @if (puedeGenerarPedido()) {
              <div class="pt-4 border-t border-ink-100 mt-4">
                <p class="text-sm font-medium text-ink-700 mb-3">Nuevo pedido</p>
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
                <div class="flex items-center gap-3 mt-3">
                  <button type="button" (click)="agregarItemPedido()" class="text-sm font-medium text-brand-700 hover:underline">+ Agregar producto</button>
                  <button type="button" (click)="generarPedido(o.id)" [disabled]="!huboSeleccion()" class="ml-auto px-4 py-2.5 rounded-xl bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 disabled:opacity-40">Generar pedido</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Sección: Cotización -->
        @if (seccion() === 'cotizacion') {
          <div class="panel p-5">
            <h2 class="font-display font-600 text-ink-900 mb-3">Cotización</h2>
            @if (cotizacion(); as cot) {
              <div class="overflow-x-auto mb-3">
                <table class="w-full text-sm">
                  <thead><tr class="text-left text-ink-500 border-b border-ink-100"><th class="py-1.5 font-medium">Descripción</th><th class="py-1.5 font-medium">Cant.</th><th class="py-1.5 font-medium">P. Unit.</th><th class="py-1.5 font-medium text-right">Subtotal</th></tr></thead>
                  <tbody>
                    @for (item of cot.detalle; track item.descripcion) {
                      <tr class="border-b border-ink-50">
                        <td class="py-1.5 text-ink-900">{{ item.descripcion }}</td>
                        <td class="py-1.5 text-ink-500">{{ item.cantidad }}</td>
                        <td class="py-1.5 text-ink-500">S/ {{ item.precioUnitario }}</td>
                        <td class="py-1.5 text-right text-ink-900">S/ {{ item.cantidad * item.precioUnitario }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="flex items-center justify-between">
                <p class="font-display font-700 text-lg text-ink-900">Total: S/ {{ cot.montoTotal }}</p>
                @if (cot.autorizado) {
                  <span class="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">Autorizado por el cliente</span>
                } @else if (esRecepcion()) {
                  <button (click)="autorizar(cot.id)" class="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Registrar autorización del cliente</button>
                }
              </div>
            } @else {
              <p class="text-sm text-ink-500 mb-3">Aún no se ha generado una cotización.</p>
            }

            @if (esRecepcion() && (!cotizacion() || !cotizacion()!.autorizado)) {
              <div class="pt-3 border-t border-ink-100 mt-3">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-medium text-ink-500">{{ cotizacion() ? 'Editar cotización' : 'Nueva cotización' }}</p>
                  @if (pedidos().length) {
                    <button type="button" (click)="cargarProductosDelPedido()" class="text-xs font-medium text-brand-700 hover:underline">Cargar productos del pedido (con precio) →</button>
                  }
                </div>
                @for (item of cotizacionItems(); track $index; let i = $index) {
                  <div class="flex items-center gap-2 mb-2">
                    <input placeholder="Descripción" [(ngModel)]="item.descripcion" [name]="'desc'+i" class="flex-1 rounded-lg border border-ink-100 px-2 py-1.5 text-xs" />
                    <input type="number" min="1" placeholder="Cant." [(ngModel)]="item.cantidad" [name]="'cantc'+i" class="w-16 rounded-lg border border-ink-100 px-2 py-1.5 text-xs" />
                    <input type="number" min="0" placeholder="P. Unit." [(ngModel)]="item.precioUnitario" [name]="'precio'+i" class="w-24 rounded-lg border border-ink-100 px-2 py-1.5 text-xs" />
                    <button type="button" (click)="quitarItemCotizacion(i)" class="text-ink-300 hover:text-crimson-500 text-xs">✕</button>
                  </div>
                }
                <div class="flex items-center gap-2 mt-2">
                  <button type="button" (click)="agregarItemCotizacion()" class="text-xs font-medium text-brand-700 hover:underline">+ Agregar ítem</button>
                  <button type="button" (click)="guardarCotizacion(o.id)" [disabled]="!cotizacionItems().length" class="ml-auto px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900 disabled:opacity-40">Guardar cotización</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Sección: Auditoría -->
        @if (seccion() === 'auditoria') {
          <div class="panel p-5">
            <button type="button" (click)="volverAlProceso()" class="text-xs font-medium text-brand-700 hover:underline mb-3">← Volver al proceso</button>
            <h2 class="font-display font-600 text-ink-900 mb-3">Historial / Auditoría</h2>
            <ul class="space-y-2">
              @for (a of auditoria(); track a.id) {
                <li class="text-sm flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-navy-500 mt-1.5 shrink-0"></span>
                  <div>
                    <p class="text-ink-900">{{ a.accion }} @if (a.estadoAnterior && a.estadoNuevo) { <span class="text-ink-500">({{ a.estadoAnterior }} → {{ a.estadoNuevo }})</span> }</p>
                    <p class="text-xs text-ink-500">{{ store.usuario(a.usuarioId)?.nombre }} · {{ a.creadoEn | date:'medium' }}</p>
                  </div>
                </li>
              } @empty {
                <p class="text-sm text-ink-500">Sin eventos registrados.</p>
              }
            </ul>
          </div>
        }
      </div>
    } @else {
      <p class="text-sm text-ink-500">Orden de trabajo no encontrada.</p>
    }
  `
})
export class OtDetalleComponent implements OnInit, OnDestroy {
  estados = SECUENCIA_ESTADOS_OT;
  private pasosTodos: { id: Seccion; etiqueta: string }[] = [
    { id: 'diagnostico', etiqueta: 'Diagnóstico' },
    { id: 'almacen', etiqueta: 'Pedido de almacén' },
    { id: 'cotizacion', etiqueta: 'Cotización' }
  ];
  seccion = signal<Seccion>('diagnostico');
  private ultimaSeccionProceso: Seccion = 'diagnostico';

  volverAlProceso(): void { this.seccion.set(this.ultimaSeccionProceso); }
  irASeccion(id: Seccion): void {
    this.ultimaSeccionProceso = id;
    this.seccion.set(id);
  }

  mecanicoElegido: string | null = null;
  estadoForzado: EstadoOT | null = null;
  mensaje = signal<string | null>(null);
  fotosDespacho: Record<string, string | null> = {};
  mensajeExito = signal<string | null>(null);
  generandoPdf = signal(false);

  formDiag = { diagnostico: '', sugerencias: '', foto: null as string | null };
  intentoDiagnostico = signal(false);
  private _pedidoItems = signal<ItemPedidoForm[]>([{ productoId: '', nombreBusqueda: '', cantidad: 1, abierto: false }]);
  private _cotizacionItems = signal<ItemCotizacion[]>([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);

  private otId = signal<string>('');
  private ahora = signal(Date.now());
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(public store: StoreService, private auth: AuthService, private route: ActivatedRoute) {
    this.otId.set(this.route.snapshot.paramMap.get('id') ?? '');
    if (this.esRecepcion()) {
      this.seccion.set('almacen');
      this.ultimaSeccionProceso = 'almacen';
    }
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.ahora.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  ot = computed(() => this.store.ot(this.otId()));
  diagnostico = computed(() => this.store.diagnosticoDeOT(this.otId()));
  pedidos = computed(() => this.store.pedidosDeOT(this.otId()));
  pedidosPendientesCount = computed(() => this.pedidos().filter((p) => p.estado !== 'Despachado').length);
  cotizacion = computed(() => this.store.cotizacionDeOT(this.otId()));
  auditoria = computed(() => this.store.auditoria().filter((a) => a.otId === this.otId()));
  siguiente = computed(() => (this.ot() ? siguienteEstado(this.ot()!.estado) : null));

  tiempoServicio = computed(() => {
    const o = this.ot();
    if (!o || !o.trabajoIniciadoEn) return null;
    const inicio = new Date(o.trabajoIniciadoEn).getTime();
    const fin = o.trabajoFinalizadoEn ? new Date(o.trabajoFinalizadoEn).getTime() : this.ahora();
    const segundos = Math.max(0, Math.floor((fin - inicio) / 1000));
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const texto = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
    return { texto, corriendo: !o.trabajoFinalizadoEn };
  });

  private pasoCompletado(id: Seccion): boolean {
    if (id === 'diagnostico') return !!this.diagnostico();
    if (id === 'almacen') return this.pedidos().length > 0 && this.pedidosPendientesCount() === 0;
    if (id === 'cotizacion') return !!this.cotizacion()?.autorizado;
    return false;
  }

  /** Recepción sigue el proceso pero no diagnostica; el mecánico no ve la cotización. */
  private pasosBase = computed<{ id: Seccion; etiqueta: string }[]>(() => {
    let lista = this.pasosTodos;
    if (this.esRecepcion()) lista = lista.filter((p) => p.id !== 'diagnostico');
    if (this.auth.rol() === 'mecanico') lista = lista.filter((p) => p.id !== 'cotizacion');
    return lista;
  });

  pasosProceso = computed<PasoProceso[]>(() =>
    this.pasosBase().map((p) => ({
      id: p.id,
      etiqueta: p.etiqueta,
      estado: this.seccion() === p.id ? 'actual' : this.pasoCompletado(p.id) ? 'completado' : 'pendiente',
      contador: p.id === 'almacen' ? this.pedidosPendientesCount() || undefined : undefined
    }))
  );

  pedidoItems = this._pedidoItems.asReadonly();
  cotizacionItems = this._cotizacionItems.asReadonly();

  esRecepcion(): boolean { return this.auth.rol() === 'recepcion'; }
  esAdministracion(): boolean { return this.auth.rol() === 'administracion'; }
  esMecanicoAsignado(): boolean {
    const o = this.ot();
    return this.auth.rol() === 'mecanico' && !!o && o.mecanicoId === this.auth.usuario()?.id;
  }

  /** Nivel de detalle de producto visible según el rol: mecánico solo nombre; Recepción código+precio (sin stock); Almacén/Admin todo. */
  private nivelProducto(): NivelProducto { return nivelVistaProducto(this.auth.rol()!); }
  nombreProducto(productoId: string): string { return this.store.producto(productoId)?.nombre ?? '—'; }
  etiquetaProducto(p: Producto): string {
    const nivel = this.nivelProducto();
    if (nivel === 'solo_nombre') return p.nombre;
    if (nivel === 'con_precio') return `${p.codigo} — ${p.nombre} (S/ ${p.precio})`;
    return `${p.codigo} — ${p.nombre} (stock ${p.stockActual})`;
  }
  /** Cómo mostrar cada línea de un pedido ya generado: Almacén y Recepción identifican el producto por su código. */
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

  puedeAsignar(): boolean { return this.esRecepcion(); }
  trabajoEnCurso = computed(() => {
    const o = this.ot();
    return !!o && !!o.trabajoIniciadoEn && !o.trabajoFinalizadoEn;
  });
  puedeAvanzar(): boolean {
    const o = this.ot();
    if (!o) return false;
    if (this.esRecepcion()) return true;
    if (this.esMecanicoAsignado()) return this.trabajoEnCurso() || ['Asignada', 'Pedido de repuestos', 'En diagnóstico', 'En ejecución'].includes(o.estado);
    if (this.auth.rol() === 'jefe_taller') return o.estado === 'Control de calidad';
    return false;
  }
  etiquetaAvanzar(o: OrdenTrabajo): string {
    if (this.esMecanicoAsignado() && this.trabajoEnCurso()) return '✓ Marcar servicio concluido';
    return `Avanzar a "${this.siguiente()}"`;
  }
  puedeDiagnosticar(): boolean { return this.esMecanicoAsignado(); }
  puedeGenerarPedido(): boolean { return this.esMecanicoAsignado(); }
  puedeDespachar(): boolean { return this.auth.rol() === 'almacen'; }

  private uid(): string { return this.auth.usuario()?.id ?? ''; }

  async asignar(otId: string): Promise<void> {
    if (!this.mecanicoElegido) return;
    await this.store.asignarMecanico(otId, this.mecanicoElegido, this.uid());
    const mecanico = this.store.usuario(this.mecanicoElegido);
    this.mensajeExito.set(`Se asignó a ${mecanico?.nombre ?? 'el mecánico'} y se le notificó.`);
    this.mecanicoElegido = null;
  }

  async avanzar(otId: string): Promise<void> {
    const o = this.ot();
    const debeFinalizar = !!o && this.esMecanicoAsignado() && this.trabajoEnCurso();
    const res = debeFinalizar
      ? await this.store.finalizarServicioYAvanzar(otId, this.uid())
      : await this.store.avanzarEstadoOT(otId, this.uid());
    this.mensaje.set(res.ok ? null : res.error ?? null);
  }

  async forzarEstado(otId: string): Promise<void> {
    if (!this.estadoForzado) return;
    const res = await this.store.cambiarEstadoOT(otId, this.estadoForzado, this.uid(), true);
    this.mensaje.set(res.ok ? null : res.error ?? null);
    this.estadoForzado = null;
  }

  async cerrar(otId: string): Promise<void> {
    await this.store.cerrarOT(otId, this.uid());
  }

  async guardarDiagnostico(otId: string): Promise<void> {
    this.intentoDiagnostico.set(true);
    const yaExistia = !!this.diagnostico();
    if (!this.formDiag.diagnostico) return;
    if (!yaExistia && !this.formDiag.foto) return; // foto obligatoria solo al registrar por primera vez, no al editar
    const nombre = this.auth.usuario()?.nombre ?? '';
    await this.store.registrarDiagnostico(otId, this.formDiag.diagnostico, this.formDiag.sugerencias, nombre, this.formDiag.foto);
    this.formDiag = { diagnostico: '', sugerencias: '', foto: null };
    this.intentoDiagnostico.set(false);
    if (this.esMecanicoAsignado() && !yaExistia) {
      this.irASeccion('almacen');
    }
  }

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

  agregarItemCotizacion(): void { this._cotizacionItems.update((arr) => [...arr, { descripcion: '', cantidad: 1, precioUnitario: 0 }]); }
  quitarItemCotizacion(i: number): void { this._cotizacionItems.update((arr) => arr.filter((_, idx) => idx !== i)); }

  /** Trae los productos solicitados por el mecánico con su precio de catálogo, listos para cotizar. */
  cargarProductosDelPedido(): void {
    const pedido = this.pedidos()[this.pedidos().length - 1];
    if (!pedido) return;
    const detalle = this.store.detalleDePedido(pedido.id);
    if (!detalle.length) return;
    const items: ItemCotizacion[] = detalle.map((d) => {
      const p = this.store.producto(d.productoId);
      return { descripcion: p?.nombre ?? 'Producto', cantidad: d.cantidadSolicitada, precioUnitario: p?.precio ?? 0 };
    });
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

  async descargarPdf(o: OrdenTrabajo): Promise<void> {
    const cliente = this.store.cliente(o.clienteId);
    const moto = this.store.moto(o.motoId);
    if (!cliente || !moto) return;

    const productosDespachados = new Set<string>();
    for (const pedido of this.pedidos()) {
      for (const d of this.store.detalleDePedido(pedido.id)) {
        const p = this.store.producto(d.productoId);
        if (p) productosDespachados.add(p.nombre);
      }
    }

    this.generandoPdf.set(true);
    this.mensaje.set(null);
    try {
      await descargarOtPdf({
        ot: o,
        cliente,
        moto,
        diagnostico: this.diagnostico(),
        mecanico: this.store.usuario(o.mecanicoId) ?? undefined,
        asesor: this.store.usuario(o.asesorId) ?? undefined,
        insumosTexto: [...productosDespachados].join(', ')
      });
    } catch {
      this.mensaje.set('No se pudo generar el PDF de la orden. Intenta nuevamente.');
    } finally {
      this.generandoPdf.set(false);
    }
  }
}
