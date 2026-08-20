import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoOT, SECUENCIA_ESTADOS_OT } from '../../core/models/models';
import { Modulo, puedeAcceder, permisoDe } from '../../core/services/permissions';

interface AccesoRapido {
  modulo: Modulo;
  ruta: string;
  etiqueta: string;
  icono: string;
  destacado?: boolean;
  soloPermisoTotal?: boolean;
}

const ACCESOS: AccesoRapido[] = [
  { modulo: 'ot', ruta: '/ot/nueva', etiqueta: 'Nueva OT', icono: 'M12 5v14M5 12h14', destacado: true, soloPermisoTotal: true },
  { modulo: 'clientes', ruta: '/clientes', etiqueta: 'Buscar cliente', icono: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-4.35-4.35' },
  { modulo: 'almacen', ruta: '/despacho', etiqueta: 'Ver despacho', icono: 'M20 12H4m16 0-5-5m5 5-5 5M4 12l5-5m-5 5 5 5', soloPermisoTotal: true },
  { modulo: 'almacen', ruta: '/almacen', etiqueta: 'Ver almacén', icono: 'M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10' },
  { modulo: 'cotizacion', ruta: '/cotizaciones', etiqueta: 'Cotizaciones', icono: 'M6 3h9l5 5v13H6zM14 3v5h5M9 13h6M9 17h6' },
  { modulo: 'reportes', ruta: '/reportes', etiqueta: 'Ver reportes', icono: 'M4 20V10m6 10V4m6 16v-7' }
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Encabezado + accesos rápidos -->
      <div class="panel p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="font-display font-700 text-2xl text-ink-900">Hola, {{ primerNombre() }} 👋</h1>
            <p class="text-sm text-ink-500">
              @if (esAlmacen()) { Este es el estado de tu inventario hoy. }
              @else if (esMecanico()) { Este es tu resumen de trabajo hoy. }
              @else { Este es el estado general del taller hoy. }
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            @for (a of accesosVisibles(); track a.ruta) {
              <a
                [routerLink]="a.ruta"
                class="inline-flex items-center gap-2 rounded-lg text-sm font-medium px-4 py-2.5 transition-colors"
                [class]="a.destacado ? 'bg-navy-700 text-white hover:bg-navy-900' : 'border border-ink-100 text-ink-700 hover:border-navy-500'"
              >
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="a.icono" />
                </svg>
                {{ etiquetaAcceso(a) }}
              </a>
            }
          </div>
        </div>
      </div>

      @if (esAlmacen()) {
        <!-- Métricas de Almacén -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Productos en total</p>
            <p class="font-display font-700 text-3xl text-brand-900 mt-1">{{ totalProductos() }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Productos con stock bajo</p>
            <p class="font-display font-700 text-3xl text-crimson-500 mt-1">{{ stockBajo() }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Unidades despachadas</p>
            <p class="font-display font-700 text-3xl text-brand-900 mt-1">{{ unidadesDespachadas() }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Valor despachado (S/)</p>
            <p class="font-display font-700 text-3xl text-emerald-500 mt-1">S/ {{ valorDespachado() }}</p>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-6">
          <div class="panel p-5">
            <p class="text-xs font-medium text-ink-500 mb-2">Producto que más sale</p>
            @if (productoMasVendido(); as p) {
              <p class="font-display font-700 text-lg text-ink-900">{{ p.producto?.nombre }}</p>
              <p class="text-sm text-ink-500 mt-0.5">{{ p.cantidad }} unidades despachadas</p>
            } @else {
              <p class="text-sm text-ink-500">Aún no hay movimientos de salida.</p>
            }
          </div>
          <div class="panel p-5">
            <p class="text-xs font-medium text-ink-500 mb-2">Producto que menos sale</p>
            @if (productoMenosVendido(); as p) {
              <p class="font-display font-700 text-lg text-ink-900">{{ p.producto?.nombre }}</p>
              <p class="text-sm text-ink-500 mt-0.5">{{ p.cantidad }} unidades despachadas</p>
            } @else {
              <p class="text-sm text-ink-500">Aún no hay movimientos de salida.</p>
            }
          </div>
        </div>
      } @else if (esMecanico()) {
        <!-- Cola de OT en espera — lo primero y más grande, es lo que el mecánico necesita ver de inmediato -->
        <div class="panel p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-display font-700 text-xl text-ink-900">Servicios en espera de atender</h2>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-600">{{ serviciosEnEspera().length }} en cola</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-ink-500 border-b border-ink-100">
                  <th class="py-3 pr-4 font-medium text-sm">N° OT</th>
                  <th class="py-3 pr-4 font-medium text-sm">Hora de llegada</th>
                  <th class="py-3 pr-4 font-medium text-sm">Moto</th>
                  <th class="py-3 pr-4 font-medium text-sm">Para</th>
                  <th class="py-3 pr-4 font-medium text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (ot of serviciosEnEspera(); track ot.id) {
                  <tr [routerLink]="['/ot', ot.id]" class="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer">
                    <td class="py-4 pr-4 font-mono text-base font-bold text-brand-700">{{ ot.numeroOT }}</td>
                    <td class="py-4 pr-4 text-ink-500">{{ ot.creadoEn | date:'shortTime' }}</td>
                    <td class="py-4 pr-4 text-lg font-medium text-ink-900">{{ store.moto(ot.motoId)?.placa }}</td>
                    <td class="py-4 pr-4 text-ink-700">{{ store.usuario(ot.mecanicoId)?.nombre ?? 'Sin asignar' }}</td>
                    <td class="py-4 pr-4">
                      <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-600">{{ ot.estado }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="py-10 text-center text-ink-500">No hay servicios en espera por ahora.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resumen del mecánico — debajo, más compacto -->
        <div>
          <h2 class="font-display font-600 text-sm text-ink-500 mb-3">Tu resumen</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="panel p-4">
              <p class="text-xs text-ink-500">Tus servicios realizados</p>
              <p class="font-display font-700 text-3xl text-brand-900 mt-1">{{ misServiciosRealizados() }}</p>
            </div>
            <div class="panel p-4">
              <p class="text-xs text-ink-500">Mecánico con más OT realizadas</p>
              @if (mecanicoTop(); as t) {
                <p class="font-display font-700 text-lg text-emerald-500 mt-1">{{ t.nombre }} <span class="text-ink-400 text-sm font-body">({{ t.cantidad }})</span></p>
              } @else {
                <p class="text-sm text-ink-500 mt-1">Sin datos todavía.</p>
              }
            </div>
          </div>
        </div>
      } @else {
        <!-- Métricas -->
        <div class="grid grid-cols-2 gap-4" [class.lg:grid-cols-4]="!esRecepcion()" [class.lg:grid-cols-3]="esRecepcion()">
          <div class="panel p-4">
            <p class="text-xs text-ink-500">OT activas</p>
            <p class="font-display font-700 text-3xl text-brand-900 mt-1">{{ otActivas() }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">OT sin mecánico</p>
            <p class="font-display font-700 text-3xl text-amber-500 mt-1">{{ otSinMecanico() }}</p>
          </div>
          <div class="panel p-4">
            <p class="text-xs text-ink-500">Listas para entrega</p>
            <p class="font-display font-700 text-3xl text-emerald-500 mt-1">{{ otListas() }}</p>
          </div>
          @if (!esRecepcion()) {
            <div class="panel p-4">
              <p class="text-xs text-ink-500">Productos con stock bajo</p>
              <p class="font-display font-700 text-3xl text-crimson-500 mt-1">{{ stockBajo() }}</p>
            </div>
          }
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Flujo de OT -->
          <div class="lg:col-span-2 panel p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display font-600 text-ink-900">Órdenes de trabajo por estado</h2>
              <a routerLink="/ot" class="text-xs font-medium text-brand-700 hover:underline">Ver todas →</a>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              @for (estado of estados; track estado) {
                <div class="rounded-lg border border-ink-100 p-3">
                  <p class="text-2xl font-display font-700 text-ink-900">{{ conteoPorEstado()[estado] }}</p>
                  <p class="text-[11px] text-ink-500 mt-1 leading-tight">{{ estado }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Actividad reciente -->
          <div class="panel p-5">
            <h2 class="font-display font-600 text-ink-900 mb-4">Actividad reciente</h2>
            <ul class="space-y-3">
              @for (a of actividadReciente(); track a.id) {
                <li class="text-sm border-l-2 border-wing-300 pl-3">
                  <p class="text-ink-900">{{ a.accion }}</p>
                  <p class="text-xs text-ink-500">{{ store.usuario(a.usuarioId)?.nombre ?? 'Sistema' }} · {{ a.creadoEn | date:'short' }}</p>
                </li>
              } @empty {
                <li class="text-sm text-ink-500">Sin actividad todavía.</li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  estados: EstadoOT[] = SECUENCIA_ESTADOS_OT;
  private accesos = ACCESOS;

  constructor(public store: StoreService, private auth: AuthService) {}

  primerNombre = computed(() => (this.auth.usuario()?.nombre ?? '').split(' ')[0]);
  esAlmacen = computed(() => this.auth.rol() === 'almacen');
  esMecanico = computed(() => this.auth.rol() === 'mecanico');
  esRecepcion = computed(() => this.auth.rol() === 'recepcion');

  accesosVisibles = computed(() => {
    const rol = this.auth.rol();
    if (!rol) return [];
    return this.accesos.filter((a) => (a.soloPermisoTotal ? permisoDe(rol, a.modulo) === 'todo' : puedeAcceder(rol, a.modulo)));
  });

  etiquetaAcceso(a: AccesoRapido): string {
    if (a.ruta === '/almacen' && this.esMecanico()) return 'Ver repuestos';
    return a.etiqueta;
  }

  otActivas = computed(() => this.store.ots().filter((o) => o.estado !== 'Cerrada').length);
  otSinMecanico = computed(() => this.store.ots().filter((o) => !o.mecanicoId && o.estado !== 'Cerrada').length);
  otListas = computed(() => this.store.ots().filter((o) => o.estado === 'Lista para entrega').length);
  stockBajo = computed(() => this.store.productosStockBajo().length);

  conteoPorEstado = computed(() => {
    const mapa: Record<string, number> = {};
    for (const e of this.estados) mapa[e] = 0;
    for (const o of this.store.ots()) mapa[o.estado] = (mapa[o.estado] ?? 0) + 1;
    return mapa;
  });

  actividadReciente = computed(() => this.store.auditoria().slice(0, 6));

  // ---------- Métricas de Mecánico ----------
  misServiciosRealizados = computed(() => {
    const uid = this.auth.usuario()?.id;
    if (!uid) return 0;
    return this.store.ots().filter((o) => o.mecanicoId === uid && o.estado === 'Cerrada').length;
  });

  mecanicoTop = computed(() => {
    const mapa = new Map<string, number>();
    for (const o of this.store.ots()) {
      if (o.estado !== 'Cerrada' || !o.mecanicoId) continue;
      mapa.set(o.mecanicoId, (mapa.get(o.mecanicoId) ?? 0) + 1);
    }
    const ranking = [...mapa.entries()]
      .map(([mecanicoId, cantidad]) => ({ nombre: this.store.usuario(mecanicoId)?.nombre ?? '—', cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    return ranking[0] ?? null;
  });

  private readonly ESTADOS_EN_ESPERA = new Set(['Creada', 'Asignada', 'Pedido de repuestos', 'En diagnóstico', 'En espera de autorización']);
  serviciosEnEspera = computed(() =>
    this.store.ots()
      .filter((o) => this.ESTADOS_EN_ESPERA.has(o.estado))
      .sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime())
  );

  // ---------- Métricas de Almacén ----------
  totalProductos = computed(() => this.store.productos().length);

  unidadesDespachadas = computed(() =>
    this.store.movimientos().filter((m) => m.tipo === 'salida').reduce((s, m) => s + m.cantidad, 0)
  );

  valorDespachado = computed(() => {
    let total = 0;
    for (const m of this.store.movimientos()) {
      if (m.tipo !== 'salida') continue;
      total += m.cantidad * (this.store.producto(m.productoId)?.precio ?? 0);
    }
    return total;
  });

  private rankingSalidas = computed(() => {
    const mapa = new Map<string, number>();
    for (const m of this.store.movimientos()) {
      if (m.tipo !== 'salida') continue;
      mapa.set(m.productoId, (mapa.get(m.productoId) ?? 0) + m.cantidad);
    }
    return [...mapa.entries()]
      .map(([productoId, cantidad]) => ({ producto: this.store.producto(productoId), cantidad }))
      .filter((x) => x.producto)
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  productoMasVendido = computed(() => this.rankingSalidas()[0] ?? null);
  productoMenosVendido = computed(() => {
    const lista = this.rankingSalidas();
    return lista.length ? lista[lista.length - 1] : null;
  });
}
