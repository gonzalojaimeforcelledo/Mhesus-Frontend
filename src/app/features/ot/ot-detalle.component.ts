import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { FotoCapturaComponent } from '../../shared/components/foto-captura.component';
import { PasoProceso, ProcesoStepperComponent } from '../../shared/components/proceso-stepper.component';
import { EstadoOT, OrdenTrabajo, SECUENCIA_ESTADOS_OT } from '../../core/models/models';
import { descargarOtPdf } from './ot-pdf.util';

type Seccion = 'diagnostico' | 'almacen' | 'cotizacion' | 'auditoria';

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

          @if (o.fotoIngreso || o.fotoIngresoTrasera || o.fotoIngresoLateralIzq || o.fotoIngresoLateralDer) {
            <div class="mt-4 pt-4 border-t border-ink-100">
              <p class="text-xs text-ink-500 mb-2">Fotos de ingreso (4 caras)</p>
              <div class="flex flex-wrap gap-2">
                @if (o.fotoIngreso) {
                  <div><img [src]="o.fotoIngreso" alt="Frontal" class="h-28 rounded-lg border border-ink-100 object-cover" /><p class="text-[11px] text-ink-400 mt-1 text-center">Frontal</p></div>
                }
                @if (o.fotoIngresoTrasera) {
                  <div><img [src]="o.fotoIngresoTrasera" alt="Trasera" class="h-28 rounded-lg border border-ink-100 object-cover" /><p class="text-[11px] text-ink-400 mt-1 text-center">Trasera</p></div>
                }
                @if (o.fotoIngresoLateralIzq) {
                  <div><img [src]="o.fotoIngresoLateralIzq" alt="Lateral izquierdo" class="h-28 rounded-lg border border-ink-100 object-cover" /><p class="text-[11px] text-ink-400 mt-1 text-center">Lateral izq.</p></div>
                }
                @if (o.fotoIngresoLateralDer) {
                  <div><img [src]="o.fotoIngresoLateralDer" alt="Lateral derecho" class="h-28 rounded-lg border border-ink-100 object-cover" /><p class="text-[11px] text-ink-400 mt-1 text-center">Lateral der.</p></div>
                }
                @if (o.fotoTablero) {
                  <div><img [src]="o.fotoTablero" alt="Tablero" class="h-28 rounded-lg border border-ink-100 object-cover" /><p class="text-[11px] text-ink-400 mt-1 text-center">Tablero</p></div>
                } @else if (o.tableroNoEnciende) {
                  <div class="h-28 w-28 rounded-lg border border-amber-400/40 bg-amber-400/5 flex items-center justify-center text-center px-2">
                    <p class="text-[11px] text-amber-600">Tablero no encendió</p>
                  </div>
                }
              </div>
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

            @if (esMecanicoAsignado() && trabajoEnCurso()) {
              <button (click)="avanzar(o.id)" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium">
                ✓ Marcar servicio concluido
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
              <button (click)="reenviarWhatsapp(o.id)" class="px-4 py-2 rounded-lg border border-emerald-500 text-emerald-600 text-sm font-medium hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-2">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.79 2.4a8.2 8.2 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.29-8.24Zm-3.3 4.5c-.16 0-.42.06-.65.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.13.17 1.72 2.63 4.24 3.68 2.1.87 2.52.7 2.98.65.46-.04 1.48-.6 1.69-1.19.2-.58.2-1.08.14-1.19-.06-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.82-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.37-.78-1.87-.2-.48-.41-.42-.56-.42Z"/></svg>
                Enviar por WhatsApp
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

        <!-- Sección: Pedido de almacén (resumen — el detalle está en su propia pantalla) -->
        @if (seccion() === 'almacen') {
          <div class="panel p-5">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 class="font-display font-600 text-ink-900">Pedido de almacén</h2>
                <p class="text-sm text-ink-500 mt-1">
                  {{ pedidos().length ? pedidos().length + ' pedido(s) registrado(s)' : 'Sin pedidos registrados todavía.' }}
                  @if (pedidosPendientesCount() > 0) { — <span class="text-amber-600 font-medium">{{ pedidosPendientesCount() }} pendiente(s)</span> }
                </p>
              </div>
              <a [routerLink]="['/ot', otId(), 'pedido']" class="px-5 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-900 text-white text-sm font-medium">Ver pedido de almacén →</a>
            </div>
          </div>
        }

        <!-- Sección: Cotización (resumen — el detalle está en su propia pantalla) -->
        @if (seccion() === 'cotizacion') {
          <div class="panel p-5">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 class="font-display font-600 text-ink-900">Cotización</h2>
                @if (cotizacion(); as cot) {
                  <p class="text-sm text-ink-500 mt-1">
                    Total: S/ {{ cot.montoTotal }}
                    @if (cot.autorizado) { — <span class="text-emerald-600 font-medium">Autorizado por el cliente</span> } @else { — <span class="text-amber-600 font-medium">Pendiente de autorización</span> }
                  </p>
                } @else {
                  <p class="text-sm text-ink-500 mt-1">Aún no se ha generado una cotización.</p>
                }
              </div>
              <a [routerLink]="['/ot', otId(), 'cotizacion']" class="px-5 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-900 text-white text-sm font-medium">Ver cotización →</a>
            </div>
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
  mensajeExito = signal<string | null>(null);
  generandoPdf = signal(false);

  formDiag = { diagnostico: '', sugerencias: '', foto: null as string | null };
  intentoDiagnostico = signal(false);

  otId = signal<string>('');
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

  esRecepcion(): boolean { return this.auth.rol() === 'recepcion'; }
  esAdministracion(): boolean { return this.auth.rol() === 'administracion'; }
  esMecanicoAsignado(): boolean {
    const o = this.ot();
    return this.auth.rol() === 'mecanico' && !!o && o.mecanicoId === this.auth.usuario()?.id;
  }

  puedeAsignar(): boolean { return this.esRecepcion(); }
  trabajoEnCurso = computed(() => {
    const o = this.ot();
    return !!o && !!o.trabajoIniciadoEn && !o.trabajoFinalizadoEn;
  });
  puedeDiagnosticar(): boolean { return this.esMecanicoAsignado(); }

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

  /** Botón "Enviar por WhatsApp" visible una vez la OT ya está cerrada — para reenviar sin necesidad de volver a cobrar. */
  async reenviarWhatsapp(otId: string): Promise<void> {
    const o = this.store.ot(otId);
    if (!o) return;
    await this.descargarPdf(o);
    this.mensaje.set('PDF descargado — adjúntalo en el chat de WhatsApp que se acaba de abrir.');
    this.enviarWhatsappCierre(otId);
  }

  async cerrar(otId: string): Promise<void> {
    const res = await this.store.cerrarOT(otId, this.uid());
    if (res.ok) {
      await this.descargarPdf(this.store.ot(otId)!);
      this.mensaje.set('PDF descargado — adjúntalo en el chat de WhatsApp que se acaba de abrir.');
      this.enviarWhatsappCierre(otId);
    } else {
      this.mensaje.set(res.error ?? 'No se pudo cerrar la OT.');
    }
  }

  /**
   * Abre WhatsApp con el mensaje de cierre ya redactado y el número del
   * cliente ya seleccionado, para que solo falte darle "Enviar". El PDF de
   * la OT (con las sugerencias del técnico) se descarga aparte justo antes
   * de esto — WhatsApp no permite adjuntar un archivo automáticamente desde
   * un link, así que hay que arrastrarlo al chat manualmente una vez abierto.
   * Tampoco es 100% automático de extremo a extremo porque WhatsApp no deja
   * mandar mensajes de negocio sin intervención humana salvo que se contrate
   * la API oficial de WhatsApp Business (de pago, cuenta verificada de Meta)
   * — esto es lo más cercano a "automático" sin esa integración paga.
   */
  private enviarWhatsappCierre(otId: string): void {
    const o = this.store.ot(otId);
    if (!o) return;
    const cliente = this.store.cliente(o.clienteId);
    const moto = this.store.moto(o.motoId);
    if (!cliente?.celular) return;

    const numero = this.formatearNumeroWhatsapp(cliente.celular);
    if (!numero) return;

    const cot = this.store.cotizacionDeOT(otId);
    const totalTexto = cot ? `\n💰 Total: S/ ${cot.montoTotal.toFixed(2)}` : '';
    const mensaje =
      `👋 Hola ${cliente.nombres}, tu moto ${moto?.placa ?? ''} (${moto?.marca ?? ''} ${moto?.modelo ?? ''}) ` +
      `ya está lista ✅, el servicio se realizó con éxito.\n\n` +
      `🧾 OT: ${o.numeroOT}\n🔧 Servicio: ${o.servicioARealizar}${totalTexto}\n\n` +
      `📎 Te comparto tu orden de trabajo en PDF con las sugerencias del técnico (adjunta abajo).\n\n` +
      `🏍️ ¡Te esperamos!`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  /** Deja el celular en formato E.164 sin "+" que pide wa.me. Asume Perú (51) si el número no trae código de país. */
  private formatearNumeroWhatsapp(celular: string): string | null {
    const soloDigitos = celular.replace(/\D/g, '');
    if (!soloDigitos) return null;
    if (soloDigitos.length === 9) return `51${soloDigitos}`; // celular peruano sin código de país
    if (soloDigitos.startsWith('51') && soloDigitos.length === 11) return soloDigitos;
    return soloDigitos; // ya trae algún código de país distinto — se manda tal cual
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
