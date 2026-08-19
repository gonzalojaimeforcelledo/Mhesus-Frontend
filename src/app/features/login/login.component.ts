import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NOMBRE_ROL } from '../../core/services/permissions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-ink-50">
      <!-- Panel de marca -->
      <div class="relative hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12 overflow-hidden">
        <img src="assets/logo-wings.png" alt="" class="absolute -right-20 -top-16 w-[640px] opacity-[0.10] pointer-events-none select-none" />
        <div class="relative">
          <img src="assets/logo-icon.png" alt="MHESUS" class="w-32 h-32 -ml-3" />
          <p class="font-display font-700 text-2xl tracking-wide -mt-1">MHESUS</p>
          <p class="text-wing-300 text-sm">Taller profesional de motos lineales</p>
        </div>
        <div class="relative">
          <h1 class="font-display font-700 text-4xl leading-tight max-w-md">
            Una sola fuente de verdad para cada orden de trabajo.
          </h1>
          <p class="text-wing-100/70 mt-4 max-w-md">
            Recepción, mecánica, almacén y administración trabajando sobre el mismo sistema, en tiempo real.
          </p>
        </div>
        <p class="relative text-xs text-wing-300/60">Chincha, Perú — 2026</p>
      </div>

      <!-- Panel de login -->
      <div class="flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
          <div class="flex lg:hidden items-center gap-3 mb-8">
            <img src="assets/logo.png" alt="MHESUS" class="w-14 h-14" />
            <p class="font-display font-700 text-xl text-brand-900">MHESUS</p>
          </div>

          <h2 class="font-display font-700 text-2xl text-ink-900">Ingresar al sistema</h2>
          <p class="text-sm text-ink-500 mt-1">Usa tus credenciales de taller para continuar.</p>

          @if (cerradaPorInactividad()) {
            <p class="mt-4 text-sm text-amber-600 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              Tu sesión se cerró por 5 minutos de inactividad. Vuelve a iniciar sesión.
            </p>
          }

          <form class="mt-6 space-y-4" (ngSubmit)="ingresar()">
            <div>
              <label class="text-sm font-medium text-ink-700">Usuario</label>
              <input
                type="text" [(ngModel)]="usuario" name="usuario" autocomplete="username" required
                (ngModelChange)="onUsuarioChange()"
                class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                placeholder="ej. recepcion"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Contraseña</label>
              <input
                type="password" [(ngModel)]="password" name="password" autocomplete="current-password" required
                [disabled]="bloqueado()"
                class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            @if (bloqueado()) {
              <p class="text-sm text-amber-600 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                Acceso bloqueado por intentos fallidos. Vuelve a intentar en <span class="font-mono font-medium">{{ tiempoRestante() }}</span>.
              </p>
            } @else if (error()) {
              <p class="text-sm text-crimson-500 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">{{ error() }}</p>
            }

            <button type="submit" [disabled]="bloqueado()" class="w-full bg-navy-700 hover:bg-navy-900 transition-colors text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {{ bloqueado() ? 'Bloqueado' : 'Ingresar' }}
            </button>
          </form>

          <div class="mt-8 border-t border-ink-100 pt-5">
            <p class="text-xs font-medium text-ink-500 mb-2">Accesos rápidos por rol (clic para autocompletar usuario)</p>
            <div class="grid grid-cols-2 gap-2">
              @for (u of usuariosDemo(); track u.usuario) {
                <button
                  type="button" (click)="usarDemo(u.usuario)"
                  class="text-left rounded-lg border border-ink-100 hover:border-navy-500 hover:bg-wing-100/40 px-3 py-2 transition-colors"
                >
                  <p class="text-xs font-medium text-ink-900">{{ nombreRol(u.rol) }}</p>
                  <p class="text-[11px] text-ink-500 font-mono">{{ u.usuario }}</p>
                </button>
              }
            </div>
            <p class="text-[11px] text-ink-300 mt-2">Contraseña de demostración: <span class="font-mono">demo1234</span></p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnDestroy {
  private static readonly CLAVE_ULTIMO_USUARIO = 'mhesus:ultimoUsuarioLogin';

  usuario = '';
  password = '';
  error = signal<string | null>(null);
  cerradaPorInactividad = signal(false);
  bloqueadoHasta = signal<number | null>(null);
  private ahora = signal(Date.now());
  private intervalo?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.cerradaPorInactividad.set(this.route.snapshot.queryParamMap.get('motivo') === 'inactividad');
    this.intervalo = setInterval(() => this.ahora.set(Date.now()), 1000);

    // Si al recargar la página el último usuario que intentó entrar sigue bloqueado,
    // restauramos el campo y el contador en vivo automáticamente (el bloqueo en sí
    // ya persiste en AuthService; esto solo evita que la cuenta regresiva "desaparezca"
    // visualmente al refrescar).
    const ultimoUsuario = localStorage.getItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
    if (ultimoUsuario) {
      this.usuario = ultimoUsuario;
      this.onUsuarioChange();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  bloqueado(): boolean {
    const hasta = this.bloqueadoHasta();
    if (!hasta) return false;
    if (hasta <= this.ahora()) {
      this.bloqueadoHasta.set(null);
      localStorage.removeItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
      return false;
    }
    return true;
  }

  tiempoRestante(): string {
    const hasta = this.bloqueadoHasta();
    if (!hasta) return '';
    const segs = Math.max(0, Math.ceil((hasta - this.ahora()) / 1000));
    const m = Math.floor(segs / 60);
    const s = segs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onUsuarioChange(): void {
    const hasta = this.auth.estadoBloqueo(this.usuario);
    this.bloqueadoHasta.set(hasta);
    if (hasta) {
      localStorage.setItem(LoginComponent.CLAVE_ULTIMO_USUARIO, this.usuario.trim());
    } else {
      localStorage.removeItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
    }
  }

  /** Lista fija (no viene del backend: antes de iniciar sesión no hay token para pedir /usuarios) — coincide con los usuarios de demostración sembrados en el backend. */
  usuariosDemo(): { usuario: string; rol: keyof typeof NOMBRE_ROL }[] {
    return [
      { usuario: 'recepcion', rol: 'recepcion' },
      { usuario: 'mecanico', rol: 'mecanico' },
      { usuario: 'mecanico2', rol: 'mecanico' },
      { usuario: 'almacen', rol: 'almacen' },
      { usuario: 'jefe', rol: 'jefe_taller' },
      { usuario: 'admin', rol: 'administracion' }
    ];
  }

  nombreRol(rol: keyof typeof NOMBRE_ROL) {
    return NOMBRE_ROL[rol];
  }

  usarDemo(usuario: string): void {
    this.usuario = usuario;
    this.password = 'demo1234';
    this.onUsuarioChange();
  }

  async ingresar(): Promise<void> {
    if (this.bloqueado()) return;
    const res = await this.auth.login(this.usuario.trim(), this.password);
    if (!res.ok) {
      this.error.set(res.error ?? 'No se pudo iniciar sesión.');
      this.bloqueadoHasta.set(res.bloqueadoHasta ?? null);
      if (res.bloqueadoHasta) {
        localStorage.setItem(LoginComponent.CLAVE_ULTIMO_USUARIO, this.usuario.trim());
      }
      return;
    }
    this.error.set(null);
    localStorage.removeItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
    this.router.navigateByUrl('/inicio');
  }
}
