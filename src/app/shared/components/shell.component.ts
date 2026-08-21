import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StoreService } from '../../core/services/store.service';
import { ThemeService } from '../../core/services/theme.service';
import { Modulo, NOMBRE_ROL, permisoDe, puedeAcceder } from '../../core/services/permissions';
import { Notificacion } from '../../core/models/models';

interface NavItem {
  modulo: Modulo;
  ruta: string;
  etiqueta: string;
  icono: string; // path data para el ícono SVG de 24x24
}

const NAV: NavItem[] = [
  { modulo: 'ot', ruta: '/inicio', etiqueta: 'Inicio', icono: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9' },
  { modulo: 'clientes', ruta: '/clientes', etiqueta: 'Clientes', icono: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
  { modulo: 'ot', ruta: '/ot', etiqueta: 'Órdenes de Trabajo', icono: 'M4 5h16v14H4zM4 9h16M9 5v4' },
  { modulo: 'calendario', ruta: '/calendario', etiqueta: 'Calendario', icono: 'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z' },
  { modulo: 'ventas', ruta: '/ventas', etiqueta: 'Facturación', icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14h6M9 18h4' },
  { modulo: 'almacen', ruta: '/despacho', etiqueta: 'Despacho', icono: 'M20 12H4m16 0-5-5m5 5-5 5M4 12l5-5m-5 5 5 5' },
  { modulo: 'almacen', ruta: '/almacen', etiqueta: 'Almacén', icono: 'M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10' },
  { modulo: 'cotizacion', ruta: '/cotizaciones', etiqueta: 'Cotizaciones', icono: 'M6 3h9l5 5v13H6zM14 3v5h5M9 13h6M9 17h6' },
  { modulo: 'reportes', ruta: '/reportes', etiqueta: 'Reportes', icono: 'M4 20V10m6 10V4m6 16v-7' },
  { modulo: 'usuarios', ruta: '/administracion', etiqueta: 'Administración', icono: 'M10.3 3.4a1.9 1.9 0 0 1 3.4 0l.4.9a1.9 1.9 0 0 0 2.3 1l.9-.3a1.9 1.9 0 0 1 2.4 2.4l-.3.9a1.9 1.9 0 0 0 1 2.3l.9.4a1.9 1.9 0 0 1 0 3.4l-.9.4a1.9 1.9 0 0 0-1 2.3l.3.9a1.9 1.9 0 0 1-2.4 2.4l-.9-.3a1.9 1.9 0 0 0-2.3 1l-.4.9a1.9 1.9 0 0 1-3.4 0l-.4-.9a1.9 1.9 0 0 0-2.3-1l-.9.3a1.9 1.9 0 0 1-2.4-2.4l.3-.9a1.9 1.9 0 0 0-1-2.3l-.9-.4a1.9 1.9 0 0 1 0-3.4l.9-.4a1.9 1.9 0 0 0 1-2.3l-.3-.9a1.9 1.9 0 0 1 2.4-2.4l.9.3a1.9 1.9 0 0 0 2.3-1l.4-.9ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' }
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-ink-50">
      <!-- Fondo oscuro al abrir el menú en móvil -->
      @if (mobileAbierto()) {
        <div class="fixed inset-0 bg-transparent z-30 lg:hidden" (click)="mobileAbierto.set(false)"></div>
      }

      <!-- Sidebar: menú lateral fijo en escritorio, cajón deslizable en móvil.
           "Flotante": separado de los bordes de la pantalla, con esquinas
           redondeadas en las 4 puntas, en vez de ir pegado y recto al borde. -->
      <aside
        class="fixed inset-y-3 left-3 z-40 flex flex-col bg-navy-900 text-white transition-all duration-200 ease-out w-64 rounded-2xl shadow-lg lg:translate-x-0 overflow-hidden"
        [class]="mobileAbierto() ? 'translate-x-0' : '-translate-x-[calc(100%+0.75rem)] lg:translate-x-0'"
        [class.lg:w-64]="!colapsado()" [class.lg:w-[76px]]="colapsado()"
      >
        <div class="flex items-center gap-3 px-3 h-16 border-b border-white/10" [class.justify-center]="colapsado() && !mobileAbierto()">
          <img src="assets/logo.png" alt="MHESUS" class="w-11 h-11 shrink-0" />
          @if (!colapsado() || mobileAbierto()) {
            <div class="leading-tight overflow-hidden flex-1">
              <p class="font-display font-700 text-lg tracking-wide">MHESUS</p>
              <p class="text-[11px] text-wing-300 -mt-1">Taller de motos lineales</p>
            </div>
          }
          <button type="button" (click)="mobileAbierto.set(false)" class="lg:hidden p-1.5 rounded-lg hover:bg-white/10 shrink-0">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1.5">
          @for (item of navVisible(); track item.ruta) {
            <a
              [routerLink]="item.ruta" routerLinkActive="bg-navy-500 text-white shadow-sm"
              [routerLinkActiveOptions]="{ exact: item.ruta === '/inicio' }"
              (click)="mobileAbierto.set(false)"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-wing-100/80 hover:bg-white/10 hover:text-white transition-colors"
              [title]="etiquetaNav(item)"
            >
              <svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icono" />
              </svg>
              @if (!colapsado() || mobileAbierto()) { <span class="truncate">{{ etiquetaNav(item) }}</span> }
            </a>
          }
        </nav>

        <button
          type="button" (click)="salir()"
          class="flex items-center gap-3 px-3.5 mx-2 mb-1 py-2.5 rounded-xl text-sm font-medium text-wing-100/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1M10 12h11m0 0-3-3m3 3-3 3"/></svg>
          @if (!colapsado() || mobileAbierto()) { <span class="truncate">Cerrar sesión</span> }
        </button>

        <button
          type="button" (click)="colapsado.set(!colapsado())"
          class="hidden lg:flex items-center gap-2 px-4 py-3 text-xs text-wing-300 hover:text-white border-t border-white/10"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
            <path [attr.d]="colapsado() ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'" />
          </svg>
          @if (!colapsado()) { <span>Contraer menú</span> }
        </button>
      </aside>

      <!-- Contenido -->
      <div class="flex-1 flex flex-col min-w-0" [class.lg:ml-[280px]]="!colapsado()" [class.lg:ml-[100px]]="colapsado()">
        <header class="h-16 sticky top-3 z-20 mx-3 bg-surface/90 backdrop-blur rounded-2xl shadow-lg border border-ink-100 flex items-center justify-between gap-3 px-4 sm:px-6">          <div class="flex items-center gap-3 min-w-0">
            <button type="button" (click)="mobileAbierto.set(true)" class="lg:hidden p-2 -ml-2 rounded-lg text-ink-500 hover:bg-ink-100 shrink-0">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div class="min-w-0">
              <p class="text-xs text-ink-500 hidden sm:block">Sistema interno</p>
              <p class="font-display font-600 text-ink-900 truncate">Panel de {{ nombreRol() }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-4 shrink-0">
            @if (stockBajoCount() > 0 && puedeVerAlmacenCompleto()) {
              <a routerLink="/almacen" class="hidden md:flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1.5">
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
                {{ stockBajoCount() }} producto(s) con stock bajo
              </a>
            }

            <!-- Tema claro / oscuro -->
            <button type="button" (click)="theme.alternar()" title="Cambiar tema" class="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-700">
              @if (theme.esOscuro()) {
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
              }
            </button>

            <!-- Notificaciones -->
            <div class="relative">
              <button type="button" (click)="notifAbiertas.set(!notifAbiertas())" class="relative p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-700">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.65V5a2 2 0 1 0-4 0v.35A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
                @if (noLeidas() > 0) {
                  <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-crimson-500 text-white text-[9px] font-semibold grid place-items-center">{{ noLeidas() }}</span>
                }
              </button>
              @if (notifAbiertas()) {
                <!-- Backdrop invisible: cierra el panel al tocar fuera -->
                <div class="fixed inset-0 z-30" (click)="notifAbiertas.set(false)"></div>

                <div class="fixed sm:absolute inset-x-4 sm:inset-x-auto top-16 sm:top-auto right-0 sm:mt-2.5 w-auto sm:w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto panel z-40 origin-top-right">
                  <div class="fixed sm:absolute inset-x-4 sm:inset-x-auto top-[76px] sm:top-auto right-0 sm:mt-2.5 w-auto sm:w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto panel z-40 origin-top-right">                    <p class="text-sm font-semibold text-ink-900">Notificaciones</p>
                    @if (noLeidas() > 0) {
                      <button type="button" (click)="marcarTodasLeidas()" class="text-xs font-medium text-brand-700 hover:underline shrink-0">Marcar todas leídas</button>
                    }
                  </div>
                  <ul class="divide-y divide-ink-50">
                    @for (n of misNotificaciones(); track n.id) {
                      <li>
                        <button
                          type="button" (click)="abrirNotificacion(n)"
                          class="w-full text-left px-4 py-3 hover:bg-ink-50/60 flex items-start gap-2.5"
                        >
                          @if (!n.leida) { <span class="w-1.5 h-1.5 rounded-full bg-navy-700 mt-1.5 shrink-0"></span> } @else { <span class="w-1.5 h-1.5 shrink-0"></span> }
                          <div class="min-w-0">
                            <p class="text-sm leading-snug" [class]="n.leida ? 'text-ink-500' : 'text-ink-900 font-medium'">{{ n.mensaje }}</p>
                            <p class="text-xs text-ink-400 mt-1">{{ n.creadoEn | date:'short' }}</p>
                          </div>
                        </button>
                      </li>
                    } @empty {
                      <li class="px-4 py-8 text-center text-sm text-ink-500">Sin notificaciones.</li>
                    }
                  </ul>
                </div>
              }
            </div>

            <div class="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-ink-100">
              <div class="w-9 h-9 rounded-full bg-navy-700 text-white grid place-items-center font-display font-600 text-sm shrink-0">
                {{ iniciales() }}
              </div>
              <div class="hidden md:block leading-tight">
                <p class="text-sm font-medium text-ink-900">{{ auth.usuario()?.nombre }}</p>
                <p class="text-xs text-ink-500">{{ nombreRol() }}</p>
              </div>
              <button type="button" (click)="salir()" title="Cerrar sesión" class="hidden sm:block ml-2 p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-crimson-500">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1M10 12h11m0 0-3-3m3 3-3 3"/></svg>
              </button>
            </div>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6 min-w-0">
          <router-outlet />
        </main>
      </div>

      <!-- Notificaciones flotantes en tiempo real (incluye avisos llegados desde otra pestaña) -->
      <div class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:w-80 space-y-2">
        @for (t of toasts(); track t.id) {
          <div class="panel p-4 flex items-start gap-3 shadow-lg animate-[fadeIn_.2s_ease-out]">
            <span class="w-8 h-8 rounded-full bg-navy-700/10 text-brand-700 grid place-items-center shrink-0">
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.65V5a2 2 0 1 0-4 0v.35A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
            </span>
            <button type="button" (click)="abrirToast(t)" class="flex-1 text-left min-w-0">
              <p class="text-sm text-ink-900 leading-snug">{{ t.mensaje }}</p>
              <p class="text-xs text-ink-400 mt-0.5">Ahora</p>
            </button>
            <button type="button" (click)="cerrarToast(t.id)" class="text-ink-300 hover:text-ink-600 shrink-0">
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        }
      </div>

      <!-- Alerta de stock bajo al ingresar (Almacén / Administración) -->
      @if (mostrarAlertaStock()) {
        <div class="fixed inset-0 z-[60] bg-transparent flex items-center justify-center p-4">
          <div class="panel w-full max-w-lg max-h-[80vh] flex flex-col">
            <div class="flex items-start gap-3 p-5 border-b border-ink-100">
              <span class="w-10 h-10 rounded-full bg-amber-400/15 text-amber-500 grid place-items-center shrink-0">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
              </span>
              <div>
                <h2 class="font-display font-700 text-lg text-ink-900">Productos con stock bajo</h2>
                <p class="text-sm text-ink-500">{{ productosBajoStock().length }} producto(s) están en o por debajo de su stock mínimo. Conviene reponerlos pronto.</p>
              </div>
            </div>
            <ul class="overflow-y-auto divide-y divide-ink-50 px-5">
              @for (p of productosBajoStock(); track p.id) {
                <li class="py-3 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-ink-900 truncate">{{ p.nombre }}</p>
                    <p class="text-xs font-mono text-ink-500">{{ p.codigo }}</p>
                  </div>
                  <p class="text-sm text-right shrink-0">
                    <span class="font-semibold text-crimson-500">{{ p.stockActual }}</span>
                    <span class="text-ink-400"> / mín. {{ p.stockMinimo }}</span>
                  </p>
                </li>
              }
            </ul>
            <div class="flex items-center justify-end gap-3 p-5 border-t border-ink-100">
              <button type="button" (click)="mostrarAlertaStock.set(false)" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">Cerrar</button>
              <a routerLink="/almacen" (click)="mostrarAlertaStock.set(false)" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Ir a Almacén</a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ShellComponent implements OnInit, OnDestroy {
  colapsado = signal(false);
  mobileAbierto = signal(false);
  notifAbiertas = signal(false);
  toasts = signal<Notificacion[]>([]);
  mostrarAlertaStock = signal(false);
  nav = NAV;

  private idsConocidos = new Set<string>();
  private toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pollingNotificaciones?: ReturnType<typeof setInterval>;

  // ---- Cierre de sesión por inactividad (token de sesión, ver AuthService) ----
  private readonly eventosActividad = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
  private inactivityTimer?: ReturnType<typeof setTimeout>;
  private inactivityCheck?: ReturnType<typeof setInterval>;
  private onActividad = () => {
    this.auth.renovarSesion();
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => this.cerrarPorInactividad(), AuthService.SESION_INACTIVIDAD_MS);
  };

  private routerSub;

  constructor(public auth: AuthService, public theme: ThemeService, private store: StoreService, private router: Router) {
    // Cierra el cajón móvil automáticamente al navegar (por ejemplo, tras seleccionar una fila con routerLink en una tabla)
    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.mobileAbierto.set(false);
    });
  }

  async ngOnInit(): Promise<void> {
    await this.store.cargarTodo();
    this.idsConocidos = new Set(this.misNotificaciones().map((n) => n.id));

    // Sondeo periódico de notificaciones nuevas (reemplaza el antiguo "storage" event de localStorage,
    // que ya no aplica porque los datos ahora viven en el backend en vez del navegador).
    this.pollingNotificaciones = setInterval(async () => {
      await this.store.cargarNotificaciones();
      this.detectarNuevasNotificaciones();
    }, 15000);

    const rol = this.auth.rol();
    if ((rol === 'almacen' || rol === 'administracion') && this.productosBajoStock().length > 0) {
      this.mostrarAlertaStock.set(true);
    }

    this.eventosActividad.forEach((ev) => window.addEventListener(ev, this.onActividad, { passive: true }));
    this.onActividad();
    // Respaldo: si el navegador pausa el setTimeout (pestaña en segundo plano), esto igual detecta la sesión vencida.
    this.inactivityCheck = setInterval(() => {
      if (this.auth.sesionExpirada()) this.cerrarPorInactividad();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.pollingNotificaciones) clearInterval(this.pollingNotificaciones);
    this.toastTimers.forEach((t) => clearTimeout(t));
    this.eventosActividad.forEach((ev) => window.removeEventListener(ev, this.onActividad));
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.inactivityCheck) clearInterval(this.inactivityCheck);
    this.routerSub.unsubscribe();
  }

  private cerrarPorInactividad(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.inactivityCheck) clearInterval(this.inactivityCheck);
    this.auth.logout();
    this.router.navigate(['/login'], { queryParams: { motivo: 'inactividad' } });
  }

  private detectarNuevasNotificaciones(): void {
    for (const n of this.misNotificaciones()) {
      if (!this.idsConocidos.has(n.id)) {
        this.idsConocidos.add(n.id);
        this.mostrarToast(n);
      }
    }
  }

  private mostrarToast(n: Notificacion): void {
    this.toasts.update((arr) => [...arr, n]);
    const timer = setTimeout(() => this.cerrarToast(n.id), 7000);
    this.toastTimers.set(n.id, timer);
  }

  cerrarToast(id: string): void {
    this.toasts.update((arr) => arr.filter((t) => t.id !== id));
    const timer = this.toastTimers.get(id);
    if (timer) clearTimeout(timer);
    this.toastTimers.delete(id);
  }

  async abrirToast(n: Notificacion): Promise<void> {
    await this.store.marcarNotificacionLeida(n.id);
    this.cerrarToast(n.id);
    if (n.otId) this.router.navigate(['/ot', n.otId]);
  }

  navVisible = computed(() => {
    const rol = this.auth.rol();
    if (!rol) return [];
    const vistos = new Set<string>();
    return this.nav.filter((item) => {
      // Almacén tiene su propia cola de "Despacho" en vez de ver todas las Órdenes de Trabajo
      if (item.ruta === '/ot' && rol === 'almacen') return false;
      if (item.ruta === '/despacho' && permisoDe(rol, 'almacen') !== 'todo') return false;
      if (vistos.has(item.ruta)) return false;
      if (!puedeAcceder(rol, item.modulo)) return false;
      vistos.add(item.ruta);
      return true;
    });
  });

  /** Para el mecánico, "Almacén" se muestra como "Repuestos": es lo único que ve de ese módulo. */
  etiquetaNav(item: NavItem): string {
    if (item.ruta === '/almacen' && this.auth.rol() === 'mecanico') return 'Repuestos';
    return item.etiqueta;
  }

  nombreRol = computed(() => (this.auth.rol() ? NOMBRE_ROL[this.auth.rol()!] : ''));
  stockBajoCount = computed(() => this.store.productosStockBajo().length);
  productosBajoStock = computed(() => this.store.productosStockBajo());

  misNotificaciones = computed(() => {
    const uid = this.auth.usuario()?.id;
    if (!uid) return [];
    return this.store.notificacionesDe(uid);
  });
  noLeidas = computed(() => this.misNotificaciones().filter((n) => !n.leida).length);

  abrirNotificacion(n: Notificacion): void {
    this.store.marcarNotificacionLeida(n.id);
    this.notifAbiertas.set(false);
    if (n.otId) this.router.navigate(['/ot', n.otId]);
  }

  async marcarTodasLeidas(): Promise<void> {
    const uid = this.auth.usuario()?.id;
    if (uid) await this.store.marcarTodasLeidas(uid);
  }

  iniciales(): string {
    const n = this.auth.usuario()?.nombre ?? '';
    return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  puedeVerAlmacenCompleto(): boolean {
    const rol = this.auth.rol();
    return !!rol && permisoDe(rol, 'almacen') === 'todo';
  }

  salir(): void {
    this.auth.logout();
    this.store.limpiarTodo();
    this.router.navigateByUrl('/login');
  }
}
