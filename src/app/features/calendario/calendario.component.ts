import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { Motocicleta, Tarea, TipoTarea } from '../../core/models/models';

const NOMBRE_TIPO: Record<TipoTarea, string> = {
  nota: 'Nota',
  recordatorio: 'Recordatorio',
  recordatorio_moto: 'Recordatorio de moto',
  tarea_asignada: 'Tarea asignada'
};

const COLOR_TIPO: Record<TipoTarea, string> = {
  nota: '#8B90A3',
  recordatorio: '#3A44C9',
  recordatorio_moto: '#F2A93B',
  tarea_asignada: '#1FA971'
};

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Calendario</h1>
          <p class="text-sm text-ink-500">Notas, recordatorios y tareas del día a día del taller.</p>
        </div>
        <button (click)="abrirNueva(diaSeleccionado())" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">
          + Nueva nota / recordatorio
        </button>
      </div>

      <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <!-- Grilla del mes -->
        <div class="panel p-5">
          <div class="flex items-center justify-between mb-4">
            <button (click)="cambiarMes(-1)" class="p-1.5 rounded-lg hover:bg-ink-50 text-ink-500">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 class="font-display font-700 text-lg text-ink-900 capitalize">{{ tituloMes() }}</h2>
            <button (click)="cambiarMes(1)" class="p-1.5 rounded-lg hover:bg-ink-50 text-ink-500">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400 mb-1">
            @for (d of diasSemana; track d) { <div class="py-1">{{ d }}</div> }
          </div>
          <div class="grid grid-cols-7 gap-1">
            @for (dia of celdasMes(); track dia.fecha) {
              <button
                (click)="dia.delMes && diaSeleccionado.set(dia.fecha)"
                class="aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 relative transition-colors"
                [class]="!dia.delMes ? 'text-ink-300' : diaSeleccionado() === dia.fecha ? 'bg-navy-700 text-white' : dia.fecha === hoy ? 'bg-navy-500/10 text-navy-700 font-medium hover:bg-navy-500/20' : 'text-ink-700 hover:bg-ink-50'"
              >
                {{ dia.numero }}
                @if (dia.delMes && tareasPorFecha().get(dia.fecha)?.length) {
                  <span class="flex gap-0.5">
                    @for (t of (tareasPorFecha().get(dia.fecha) ?? []).slice(0, 3); track t.id) {
                      <span class="w-1.5 h-1.5 rounded-full" [style.background]="diaSeleccionado() === dia.fecha ? '#fff' : colorTipo(t.tipo)"></span>
                    }
                  </span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Panel del día seleccionado -->
        <div class="panel p-5">
          <h3 class="font-display font-700 text-ink-900 mb-4">{{ tituloDiaSeleccionado() }}</h3>
          <div class="space-y-3">
            @for (t of tareasDelDiaSeleccionado(); track t.id) {
              <div class="rounded-lg border border-ink-100 p-3" [class.opacity-50]="t.completada">
                <div class="flex items-start gap-2">
                  <button (click)="completar(t.id)" class="mt-0.5 shrink-0">
                    <svg viewBox="0 0 24 24" class="w-4 h-4" [class]="t.completada ? 'text-emerald-500' : 'text-ink-300'" fill="none" stroke="currentColor" stroke-width="2">
                      @if (t.completada) { <path d="M20 6 9 17l-5-5"/> } @else { <circle cx="12" cy="12" r="9"/> }
                    </svg>
                  </button>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-ink-900" [class.line-through]="t.completada">{{ t.titulo }}</p>
                    @if (t.descripcion) { <p class="text-xs text-ink-500 mt-0.5">{{ t.descripcion }}</p> }
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" [style.background]="colorTipo(t.tipo) + '1A'" [style.color]="colorTipo(t.tipo)">{{ nombreTipo(t.tipo) }}</span>
                      @if (t.hora) { <span class="text-[11px] text-ink-400">{{ t.hora }}</span> }
                      @if (t.motoId; as mid) { <span class="text-[11px] text-ink-400 font-mono">{{ store.moto(mid)?.placa }}</span> }
                      @if (t.asignadoA; as aid) { <span class="text-[11px] text-ink-400">→ {{ store.usuario(aid)?.nombre }}</span> }
                    </div>
                  </div>
                  <button (click)="eliminar(t.id)" class="text-ink-300 hover:text-crimson-500 shrink-0">
                    <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
                  </button>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-ink-500 py-6 text-center">Nada anotado para este día.</p>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: nueva nota / recordatorio -->
    @if (mostrarForm()) {
      <div class="fixed inset-0 z-30 bg-ink-900/40 flex items-center justify-center p-4" (click)="mostrarForm.set(false)">
        <div class="bg-surface rounded-xl shadow-panel max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <h3 class="font-display font-700 text-lg text-ink-900 mb-4">Nueva nota / recordatorio</h3>

          <form (ngSubmit)="guardar()" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-ink-700">Título</label>
              <input [(ngModel)]="form.titulo" name="titulo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="Ej. Llamar a proveedor de repuestos" />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Descripción (opcional)</label>
              <textarea [(ngModel)]="form.descripcion" name="descripcion" rows="2" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium text-ink-700">Fecha</label>
                <input [(ngModel)]="form.fecha" name="fecha" type="date" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
              </div>
              <div>
                <label class="text-sm font-medium text-ink-700">Hora (opcional)</label>
                <input [(ngModel)]="form.hora" name="hora" type="time" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Tipo</label>
              <select [(ngModel)]="form.tipo" name="tipo" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500">
                <option value="nota">Nota</option>
                <option value="recordatorio">Recordatorio</option>
                <option value="recordatorio_moto">Recordatorio de moto (próxima atención)</option>
                @if (esAdmin()) { <option value="tarea_asignada">Tarea asignada</option> }
              </select>
            </div>

            @if (form.tipo === 'recordatorio_moto') {
              <div>
                <label class="text-sm font-medium text-ink-700">Placa de la moto</label>
                <input [(ngModel)]="placaMoto" name="placaMoto" (ngModelChange)="onPlacaMotoChange($event)" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" placeholder="Ej. MTL-812" />
                @if (motoEncontrada(); as m) {
                  <p class="text-xs text-emerald-600 mt-1">{{ m.placa }} — {{ m.marca }} {{ m.modelo }} ({{ store.cliente(m.clienteId)?.nombres }})</p>
                } @else if (placaMoto.length >= 5) {
                  <p class="text-xs text-ink-400 mt-1">No se encontró esa placa.</p>
                }
              </div>
            }

            @if (esAdmin()) {
              <div>
                <label class="text-sm font-medium text-ink-700">Asignar a (opcional)</label>
                <select [(ngModel)]="form.asignadoA" name="asignadoA" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500">
                  <option [ngValue]="null">Solo para mí</option>
                  @for (u of usuariosAsignables(); track u.id) { <option [ngValue]="u.id">{{ u.nombre }} · {{ nombreRolCorto(u.rol) }}</option> }
                </select>
              </div>
            }

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="mostrarForm.set(false)" class="px-4 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-ink-50">Cancelar</button>
              <button type="submit" [disabled]="!form.titulo.trim() || !form.fecha" class="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CalendarioComponent implements OnInit {
  hoy = hoyISO();
  diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  mesActual = signal(new Date().getMonth());
  anioActual = signal(new Date().getFullYear());
  diaSeleccionado = signal(this.hoy);
  mostrarForm = signal(false);

  form: { titulo: string; descripcion: string; fecha: string; hora: string; tipo: TipoTarea; asignadoA: string | null } = {
    titulo: '', descripcion: '', fecha: this.hoy, hora: '', tipo: 'nota', asignadoA: null
  };
  placaMoto = '';
  motoEncontrada = signal<Motocicleta | undefined>(undefined);
  private debouncePlaca?: ReturnType<typeof setTimeout>;

  constructor(public store: StoreService, private auth: AuthService) {}

  ngOnInit(): void {
    this.recargar();
    this.store.cargarUsuarios();
  }

  esAdmin = computed(() => this.auth.rol() === 'administracion');
  usuariosAsignables = computed(() => this.store.usuarios().filter((u) => u.activo));

  private recargarPendiente = false;
  recargar(): void {
    const desde = `${this.anioActual()}-${String(this.mesActual() + 1).padStart(2, '0')}-01`;
    const ultimoDia = new Date(this.anioActual(), this.mesActual() + 1, 0).getDate();
    const hasta = `${this.anioActual()}-${String(this.mesActual() + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    this.store.cargarTareas(desde, hasta);
  }

  async completar(id: string): Promise<void> {
    await this.store.completarTarea(id);
    this.recargar();
  }

  async eliminar(id: string): Promise<void> {
    await this.store.eliminarTarea(id);
    this.recargar();
  }

  cambiarMes(delta: number): void {
    let mes = this.mesActual() + delta;
    let anio = this.anioActual();
    if (mes < 0) { mes = 11; anio--; }
    if (mes > 11) { mes = 0; anio++; }
    this.mesActual.set(mes);
    this.anioActual.set(anio);
    this.recargar();
  }

  tituloMes = computed(() => {
    const f = new Date(this.anioActual(), this.mesActual(), 1);
    return f.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });

  celdasMes = computed(() => {
    const anio = this.anioActual();
    const mes = this.mesActual();
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(anio, mes, 0).getDate();

    const celdas: { fecha: string; numero: number; delMes: boolean }[] = [];
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      celdas.push({ fecha: '', numero: diasMesAnterior - i, delMes: false });
    }
    for (let d = 1; d <= totalDias; d++) {
      celdas.push({ fecha: `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, numero: d, delMes: true });
    }
    while (celdas.length % 7 !== 0) {
      celdas.push({ fecha: '', numero: celdas.length, delMes: false });
    }
    return celdas;
  });

  tareasPorFecha = computed(() => {
    const mapa = new Map<string, Tarea[]>();
    for (const t of this.store.tareas()) {
      const lista = mapa.get(t.fecha) ?? [];
      lista.push(t);
      mapa.set(t.fecha, lista);
    }
    return mapa;
  });

  tareasDelDiaSeleccionado = computed(() => this.tareasPorFecha().get(this.diaSeleccionado()) ?? []);

  tituloDiaSeleccionado = computed(() => {
    const [y, m, d] = this.diaSeleccionado().split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  nombreTipo(t: TipoTarea): string { return NOMBRE_TIPO[t]; }
  colorTipo(t: TipoTarea): string { return COLOR_TIPO[t]; }
  nombreRolCorto(rol: string): string {
    return { recepcion: 'Recepción', mecanico: 'Mecánico', almacen: 'Almacén', administracion: 'Admin' }[rol] ?? rol;
  }

  abrirNueva(fecha: string): void {
    this.form = { titulo: '', descripcion: '', fecha, hora: '', tipo: 'nota', asignadoA: null };
    this.placaMoto = '';
    this.motoEncontrada.set(undefined);
    this.mostrarForm.set(true);
  }

  onPlacaMotoChange(valor: string): void {
    this.placaMoto = valor.toUpperCase();
    if (this.debouncePlaca) clearTimeout(this.debouncePlaca);
    if (this.placaMoto.length < 5) { this.motoEncontrada.set(undefined); return; }
    const consulta = this.placaMoto;
    this.debouncePlaca = setTimeout(async () => {
      const resultado = await this.store.buscarMotoPorPlacaEnServidor(consulta);
      if (this.placaMoto === consulta) this.motoEncontrada.set(resultado);
    }, 350);
  }

  async guardar(): Promise<void> {
    if (!this.form.titulo.trim() || !this.form.fecha) return;
    await this.store.crearTarea({
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim() || undefined,
      fecha: this.form.fecha,
      hora: this.form.hora || null,
      tipo: this.form.tipo,
      motoId: this.form.tipo === 'recordatorio_moto' ? (this.motoEncontrada()?.id ?? null) : null,
      asignadoA: this.form.asignadoA
    });
    this.mostrarForm.set(false);
    this.diaSeleccionado.set(this.form.fecha);
    this.recargar();
  }
}
