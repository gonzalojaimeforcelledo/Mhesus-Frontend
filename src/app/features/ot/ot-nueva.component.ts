import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente, Motocicleta, NIVELES_COMBUSTIBLE, NivelCombustible, OrdenTrabajo } from '../../core/models/models';
import { PasoProceso, ProcesoStepperComponent } from '../../shared/components/proceso-stepper.component';
import { FotoCapturaComponent } from '../../shared/components/foto-captura.component';

type Paso = 'moto' | 'detalle' | 'mecanico';
type ModoAltaMoto = 'dni' | 'nuevoCliente';

@Component({
  selector: 'app-ot-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProcesoStepperComponent, FotoCapturaComponent],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div>
        <a routerLink="/ot" class="text-xs text-brand-700 hover:underline">← Volver a Órdenes de Trabajo</a>
        <h1 class="font-display font-700 text-2xl text-ink-900 mt-1">Nueva Orden de Trabajo</h1>
      </div>

      <!-- Indicador de pasos -->
      <div class="panel px-6 pt-5 pb-3">
        <app-proceso-stepper [pasos]="pasosProceso()" (seleccion)="irAPaso($any($event))" />
      </div>

      <!-- Paso 1: motocicleta (por placa) -->
      @if (paso() === 'moto') {
        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-1">Motocicleta</h2>
          <p class="text-sm text-ink-500 mb-4">Ingresa el número de placa: si ya está registrada, reconocemos sus datos y a su dueño automáticamente.</p>

          @if (!motoSeleccionada()) {
            <div class="flex items-center gap-3 border border-ink-100 rounded-lg px-3 py-2.5">
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                [(ngModel)]="placa" name="placa" placeholder="Número de placa..." autofocus
                (ngModelChange)="onPlacaChange($event)" class="w-full text-sm outline-none font-mono uppercase"
              />
              @if (motoEncontrada()) {
                <span class="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-500/10 rounded-full px-2.5 py-1">Encontrada ✓</span>
              }
            </div>

            <!-- Sugerencias mientras escribe -->
            @if (sugerenciasMotos().length) {
              <div class="mt-2 border border-ink-100 rounded-lg divide-y divide-ink-50 overflow-hidden">
                @for (m of sugerenciasMotos(); track m.id) {
                  <button type="button" (click)="reconocerMoto(m)" class="w-full text-left px-3 py-2.5 hover:bg-wing-100/40 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-ink-900 font-mono">{{ m.placa }}</p>
                      <p class="text-xs text-ink-500">{{ m.marca }} {{ m.modelo }} · {{ nombreDueno(m) }}</p>
                    </div>
                  </button>
                }
              </div>
            }

            <!-- Moto reconocida: datos de la unidad + dueño -->
            @if (motoEncontrada(); as m) {
              <div class="mt-4 bg-wing-100/40 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p class="text-sm font-medium text-ink-900 font-mono">{{ m.placa }} — {{ m.marca }} {{ m.modelo }}</p>
                  <p class="text-xs text-ink-500">{{ m.anio }} · {{ m.kmActual | number }} km</p>
                  @if (duenoDe(m); as d) {
                    <p class="text-xs text-ink-700 mt-1">Dueño: <span class="font-medium">{{ d.nombres }} {{ d.apellidos }}</span> · DNI {{ d.dni }} · {{ d.celular }}</p>
                  }
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <a [routerLink]="['/motos', m.id, 'historial']" class="px-3 py-2 rounded-lg border border-ink-100 text-xs font-medium text-ink-700 hover:border-navy-500">Ver historial</a>
                  <button type="button" (click)="reconocerMoto(m)" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900">Usar estos datos →</button>
                </div>
              </div>
            }

            <!-- Placa no encontrada: resolver dueño -->
            @if (placa.length >= 5 && !motoEncontrada() && !sugerenciasMotos().length) {
              <div class="mt-4 border border-dashed border-ink-100 rounded-lg p-4">
                <p class="text-xs font-medium text-ink-500 mb-3">No encontramos esta placa. ¿A qué cliente pertenece?</p>

                <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1 w-fit mb-3">
                  <button type="button" (click)="modoAlta.set('dni')" [class.bg-surface]="modoAlta() === 'dni'" [class.shadow]="modoAlta() === 'dni'" class="px-3 py-1.5 rounded-md text-xs font-medium">Cliente existente</button>
                  <button type="button" (click)="modoAlta.set('nuevoCliente')" [class.bg-surface]="modoAlta() === 'nuevoCliente'" [class.shadow]="modoAlta() === 'nuevoCliente'" class="px-3 py-1.5 rounded-md text-xs font-medium">Cliente nuevo</button>
                </div>

                @if (modoAlta() === 'dni') {
                  <input
                    [(ngModel)]="dniBusqueda" name="dniBusqueda" inputmode="numeric" maxlength="8" placeholder="DNI del cliente..."
                    class="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 font-mono"
                  />
                  @if (sugerenciasClientes().length) {
                    <div class="mt-2 border border-ink-100 rounded-lg divide-y divide-ink-50 overflow-hidden">
                      @for (c of sugerenciasClientes(); track c.id) {
                        <button type="button" (click)="elegirClienteParaMotoNueva(c)" class="w-full text-left px-3 py-2.5 hover:bg-wing-100/40" [class]="clienteParaMotoNueva()?.id === c.id ? 'bg-wing-100/50' : ''">
                          <p class="text-sm font-medium text-ink-900">{{ c.nombres }} {{ c.apellidos }}</p>
                          <p class="text-xs text-ink-500 font-mono">DNI {{ c.dni }}</p>
                        </button>
                      }
                    </div>
                  }
                  @if (clienteParaMotoNueva(); as c) {
                    <div class="mt-3 bg-wing-100/40 rounded-lg p-3">
                      <p class="text-sm font-medium text-ink-900">{{ c.nombres }} {{ c.apellidos }}</p>
                      <p class="text-xs text-ink-500 font-mono">DNI {{ c.dni }}</p>
                    </div>
                  }
                } @else {
                  <div class="grid sm:grid-cols-2 gap-3">
                    <input [(ngModel)]="nuevoCliente.nombres" name="ncNombres" placeholder="Nombres" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                    <input [(ngModel)]="nuevoCliente.apellidos" name="ncApellidos" placeholder="Apellidos" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                    <input [(ngModel)]="nuevoCliente.dni" name="ncDni" inputmode="numeric" maxlength="8" placeholder="DNI" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 font-mono" />
                    <input [(ngModel)]="nuevoCliente.celular" name="ncCelular" placeholder="Celular" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                  </div>
                }

                <p class="text-xs font-medium text-ink-500 mt-4 mb-3">Datos de la moto lineal</p>
                <div class="grid sm:grid-cols-3 gap-3">
                  <input [(ngModel)]="nuevaMoto.marca" name="mMarca" placeholder="Marca" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                  <input [(ngModel)]="nuevaMoto.modelo" name="mModelo" placeholder="Modelo" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                  <input [(ngModel)]="nuevaMoto.anio" name="mAnio" type="number" placeholder="Año" required class="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <button
                  type="button" (click)="registrarMotoYDueno()"
                  [disabled]="!puedeRegistrarMotoNueva()"
                  class="mt-3 px-4 py-2 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900 disabled:opacity-40"
                >
                  Registrar y continuar →
                </button>
              </div>
            }
          } @else {
            <div class="flex items-center justify-between bg-wing-100/40 rounded-lg p-3">
              <div>
                <p class="text-sm font-medium text-ink-900 font-mono">{{ motoSeleccionada()!.placa }} — {{ motoSeleccionada()!.marca }} {{ motoSeleccionada()!.modelo }}</p>
                <p class="text-xs text-ink-500">{{ clienteSeleccionado()!.nombres }} {{ clienteSeleccionado()!.apellidos }} · DNI {{ clienteSeleccionado()!.dni }}</p>
              </div>
              <button type="button" (click)="reiniciar()" class="text-xs font-medium text-brand-700 hover:underline shrink-0">Cambiar</button>
            </div>
          }
        </div>
      }

      <!-- Paso 2: detalle de ingreso -->
      @if (paso() === 'detalle') {
        <div class="panel p-5">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-display font-600 text-ink-900">Detalle de ingreso</h2>
            <button type="button" (click)="irAPaso('moto')" class="text-xs font-medium text-brand-700 hover:underline">← Cambiar motocicleta</button>
          </div>
          <p class="text-sm text-ink-500 mb-4">
            {{ clienteSeleccionado()!.nombres }} {{ clienteSeleccionado()!.apellidos }} ·
            <span class="font-mono">{{ motoSeleccionada()!.placa }}</span> ({{ motoSeleccionada()!.marca }} {{ motoSeleccionada()!.modelo }})
          </p>

          <form (ngSubmit)="crear()" class="space-y-5 max-w-2xl">
            <div>
              <label class="text-sm font-medium text-ink-700">Observación del cliente</label>
              <textarea [(ngModel)]="form.observacionCliente" name="observacionCliente" rows="2" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="Ej. Ruido extraño al frenar"></textarea>
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Servicio a realizar</label>
              <input [(ngModel)]="form.servicioARealizar" name="servicioARealizar" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="Ej. Mantenimiento 5,000 km" />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-ink-700">Kilometraje actual</label>
                <div class="mt-1 flex items-center rounded-lg border border-ink-100 focus-within:border-navy-500">
                  <input [(ngModel)]="form.kmActual" name="kmActual" type="number" min="0" required class="w-full px-3 py-2 text-sm outline-none rounded-lg" placeholder="Ej. 12500" />
                  <span class="pr-3 text-xs text-ink-400">km</span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-ink-700">Nivel de combustible</label>
                <div class="mt-1 grid grid-cols-5 rounded-lg border border-ink-100 overflow-hidden">
                  @for (n of niveles; track n) {
                    <button
                      type="button" (click)="form.nivelCombustible = n"
                      class="py-2 text-sm font-mono font-medium border-r border-ink-100 last:border-r-0 transition-colors"
                      [class]="form.nivelCombustible === n ? 'bg-navy-700 text-white' : 'bg-surface text-ink-500 hover:bg-ink-50'"
                    >
                      {{ n }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <app-foto-captura
              label="Foto de ingreso de la moto (recomendado)" textoBoton="Tomar o subir foto de ingreso"
              [valor]="form.fotoIngreso" (valorChange)="form.fotoIngreso = $event"
            />

            <div class="flex justify-end gap-3 pt-2">
              <a routerLink="/ot" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">Cancelar</a>
              <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Crear Orden de Trabajo →</button>
            </div>
          </form>
        </div>
      }

      <!-- Paso 3: asignar mecánico -->
      @if (paso() === 'mecanico' && otCreada(); as ot) {
        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-1">Asignar mecánico</h2>
          <p class="text-sm text-ink-500 mb-4">
            OT <span class="font-mono text-brand-700">{{ ot.numeroOT }}</span> creada correctamente. Asigna un mecánico para que reciba la notificación de inmediato, o hazlo más tarde.
          </p>

          @if (mensajeAsignacion()) {
            <div class="mb-4 rounded-lg px-4 py-2.5 text-sm bg-emerald-500/10 text-emerald-600 flex items-center gap-2">
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
              {{ mensajeAsignacion() }}
            </div>
          }

          @if (!otAsignada()) {
            <div class="max-w-md flex items-center gap-3">
              <select [(ngModel)]="mecanicoElegido" name="mecanico" class="flex-1 rounded-lg border border-ink-100 px-3 py-2.5 text-sm">
                <option [ngValue]="null" disabled>Selecciona un mecánico...</option>
                @for (m of store.mecanicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombre }}</option> }
              </select>
              <button type="button" (click)="asignar(ot.id)" [disabled]="!mecanicoElegido" class="px-4 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900 disabled:opacity-40 shrink-0">Asignar</button>
            </div>
            <button type="button" (click)="irADetalle(ot.id)" class="mt-4 text-xs font-medium text-ink-500 hover:underline">Asignar más tarde →</button>
          } @else {
            <button type="button" (click)="irADetalle(ot.id)" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Ir a la orden →</button>
          }
        </div>
      }
    </div>
  `
})
export class OtNuevaComponent implements OnInit {
  pasosInfo: { id: Paso; etiqueta: string }[] = [
    { id: 'moto', etiqueta: 'Motocicleta' },
    { id: 'detalle', etiqueta: 'Detalle de ingreso' },
    { id: 'mecanico', etiqueta: 'Asignar mecánico' }
  ];
  niveles = NIVELES_COMBUSTIBLE;

  placa = '';
  dniBusqueda = '';
  modoAlta = signal<ModoAltaMoto>('nuevoCliente');
  clienteParaMotoNueva = signal<Cliente | null>(null);

  clienteSeleccionado = signal<Cliente | null>(null);
  motoSeleccionada = signal<Motocicleta | null>(null);
  paso = signal<Paso>('moto');
  otCreada = signal<OrdenTrabajo | null>(null);
  mecanicoElegido: string | null = null;
  mensajeAsignacion = signal<string | null>(null);

  nuevoCliente = { nombres: '', apellidos: '', dni: '', celular: '' };
  nuevaMoto = { marca: '', modelo: '', anio: new Date().getFullYear() };
  form: { observacionCliente: string; servicioARealizar: string; nivelCombustible: NivelCombustible; kmActual: number | null; fotoIngreso: string | null } = {
    observacionCliente: '', servicioARealizar: '', nivelCombustible: '1/2', kmActual: null, fotoIngreso: null
  };

  constructor(public store: StoreService, private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
    const motoId = this.route.snapshot.queryParamMap.get('motoId');
    if (motoId) {
      const m = this.store.moto(motoId);
      if (m) { this.reconocerMoto(m); }
    } else if (clienteId) {
      const c = this.store.cliente(clienteId);
      if (c) {
        this.clienteParaMotoNueva.set(c);
        this.dniBusqueda = c.dni;
        this.modoAlta.set('dni');
      }
    }
  }

  onPlacaChange(valor: string): void {
    this.placa = valor.toUpperCase();
  }

  motoEncontrada = computed(() => (this.placa.length >= 5 ? this.store.buscarMotoPorPlaca(this.placa) : undefined));
  sugerenciasMotos = computed(() => {
    if (this.placa.length < 2) return [];
    const encontrada = this.motoEncontrada();
    if (encontrada) return [];
    return this.store.motosPorPlacaParcial(this.placa);
  });

  sugerenciasClientes = computed(() => {
    if (this.dniBusqueda.length < 3) return [];
    return this.store.clientes().filter((c) => c.dni.startsWith(this.dniBusqueda)).slice(0, 5);
  });

  otAsignada = computed(() => {
    const ot = this.otCreada();
    return ot ? !!this.store.ot(ot.id)?.mecanicoId : false;
  });

  nombreDueno(m: Motocicleta): string {
    const c = this.store.cliente(m.clienteId);
    return c ? `${c.nombres} ${c.apellidos}` : '—';
  }

  duenoDe(m: Motocicleta): Cliente | undefined {
    return this.store.cliente(m.clienteId);
  }

  completado(p: Paso): boolean {
    if (p === 'moto') return !!this.motoSeleccionada();
    if (p === 'detalle') return !!this.otCreada();
    if (p === 'mecanico') return this.otAsignada();
    return false;
  }

  puedeIrA(p: Paso): boolean {
    if (p === 'moto') return true;
    if (p === 'detalle') return !!this.clienteSeleccionado() && !!this.motoSeleccionada();
    return !!this.otCreada();
  }

  irAPaso(p: Paso): void {
    if (this.puedeIrA(p)) this.paso.set(p);
  }

  pasosProceso = computed<PasoProceso[]>(() =>
    this.pasosInfo.map((p) => ({
      id: p.id,
      etiqueta: p.etiqueta,
      estado: this.paso() === p.id ? 'actual' : this.completado(p.id) ? 'completado' : this.puedeIrA(p.id) ? 'pendiente' : 'bloqueado'
    }))
  );

  reiniciar(): void {
    this.clienteSeleccionado.set(null);
    this.motoSeleccionada.set(null);
    this.clienteParaMotoNueva.set(null);
    this.placa = '';
    this.dniBusqueda = '';
  }

  reconocerMoto(m: Motocicleta): void {
    const c = this.store.cliente(m.clienteId);
    if (!c) return;
    this.clienteSeleccionado.set(c);
    this.motoSeleccionada.set(m);
    this.placa = m.placa;
    this.form.kmActual = m.kmActual || null;
    this.paso.set('detalle');
  }

  elegirClienteParaMotoNueva(c: Cliente): void {
    this.clienteParaMotoNueva.set(c);
  }

  puedeRegistrarMotoNueva(): boolean {
    if (!this.nuevaMoto.marca || !this.nuevaMoto.modelo) return false;
    if (this.modoAlta() === 'dni') return !!this.clienteParaMotoNueva();
    return !!this.nuevoCliente.nombres && !!this.nuevoCliente.apellidos && !!this.nuevoCliente.dni && !!this.nuevoCliente.celular;
  }

  async registrarMotoYDueno(): Promise<void> {
    if (!this.puedeRegistrarMotoNueva()) return;
    let cliente = this.modoAlta() === 'dni' ? this.clienteParaMotoNueva() : null;
    if (this.modoAlta() === 'nuevoCliente') {
      cliente = await this.store.crearCliente({
        nombres: this.nuevoCliente.nombres,
        apellidos: this.nuevoCliente.apellidos,
        dni: this.nuevoCliente.dni,
        celular: this.nuevoCliente.celular,
        direccion: ''
      });
    }
    if (!cliente) return;
    const moto = await this.store.agregarMoto({
      clienteId: cliente.id,
      placa: this.placa,
      marca: this.nuevaMoto.marca,
      modelo: this.nuevaMoto.modelo,
      anio: this.nuevaMoto.anio,
      kmActual: 0
    });
    this.reconocerMoto(moto);
  }

  async crear(): Promise<void> {
    const cliente = this.clienteSeleccionado();
    const moto = this.motoSeleccionada();
    const asesorId = this.auth.usuario()?.id;
    if (!cliente || !moto || !asesorId) return;
    const ot = await this.store.crearOT({
      clienteId: cliente.id,
      motoId: moto.id,
      asesorId,
      nivelCombustible: this.form.nivelCombustible,
      observacionCliente: this.form.observacionCliente,
      servicioARealizar: this.form.servicioARealizar,
      kmActual: this.form.kmActual ?? undefined,
      fotoIngreso: this.form.fotoIngreso
    });
    this.otCreada.set(ot);
    this.paso.set('mecanico');
  }

  async asignar(otId: string): Promise<void> {
    if (!this.mecanicoElegido) return;
    const uid = this.auth.usuario()?.id;
    if (!uid) return;
    await this.store.asignarMecanico(otId, this.mecanicoElegido, uid);
    const mecanico = this.store.usuario(this.mecanicoElegido);
    this.mensajeAsignacion.set(`Se asignó a ${mecanico?.nombre ?? 'el mecánico'} y se le notificó.`);
    this.mecanicoElegido = null;
  }

  irADetalle(otId: string): void {
    this.router.navigate(['/ot', otId]);
  }
}
