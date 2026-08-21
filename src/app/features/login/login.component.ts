import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-ink-50">
      <!-- Tema claro / oscuro -->
      <button
        type="button" (click)="theme.alternar()" title="Cambiar tema"
        class="fixed top-4 right-4 z-10 p-2 rounded-lg text-ink-500 bg-surface border border-ink-100 hover:text-navy-700 shadow-sm"
      >
        @if (theme.esOscuro()) {
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        }
      </button>

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
              <div class="relative mt-1">
                <input
                  [type]="verPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" autocomplete="current-password" required
                  [disabled]="bloqueado()"
                  class="w-full rounded-lg border border-ink-100 bg-surface pl-3 pr-10 py-2.5 text-sm outline-none focus:border-navy-500 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button" (click)="verPassword.set(!verPassword())" tabindex="-1"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  [title]="verPassword() ? 'Ocultar contraseña' : 'Ver contraseña'"
                >
                  @if (verPassword()) {
                    <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.5A10.4 10.4 0 0 1 12 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.7 3.6M6.3 6.3C4.2 7.6 2.7 9.4 1.5 12 3 15 7 19 12 19c1.2 0 2.4-.2 3.5-.6"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-ink-500 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="recordarme" name="recordarme" class="rounded border-ink-100 accent-navy-700" />
                Recordarme
              </label>
              <button type="button" (click)="mostrarOlvide.set(!mostrarOlvide())" class="text-sm text-navy-700 hover:underline">
                ¿No recuerdas tu contraseña?
              </button>
            </div>

            @if (mostrarOlvide()) {
              <div class="rounded-lg border border-ink-100 bg-ink-50 px-3 py-3 space-y-2">
                @if (olvideEnviado()) {
                  <p class="text-sm text-emerald-600 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                    Se avisó al administrador. Te contactará para restablecer tu acceso.
                  </p>
                } @else {
                  <p class="text-xs text-ink-500">
                    Le avisaremos al administrador para que restablezca tu contraseña. Escribe tu usuario:
                  </p>
                  <div class="flex gap-2">
                    <input
                      type="text" [(ngModel)]="usuarioOlvide" name="usuarioOlvide"
                      class="flex-1 rounded-lg border border-ink-100 bg-surface px-3 py-2 text-sm outline-none focus:border-navy-500"
                      placeholder="Tu usuario"
                    />
                    <button type="button" (click)="enviarOlvide()" [disabled]="!usuarioOlvide.trim() || enviandoOlvide()" class="bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap">
                      {{ enviandoOlvide() ? 'Enviando...' : 'Avisar' }}
                    </button>
                  </div>
                  <p class="text-xs text-ink-400 pt-1">
                    ¿Eres administrador? <a routerLink="/recuperar-admin" class="text-navy-700 hover:underline font-medium">Recupera tu acceso por correo →</a>
                  </p>
                }
              </div>
            }

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

          <p class="text-xs text-ink-400 mt-8 text-center">
            Al continuar, aceptas los <a routerLink="/terminos" class="text-navy-700 hover:underline">Términos y condiciones</a> de uso del sistema.
          </p>
        </div>
      </div>

      <!-- Aviso de cookies -->
      @if (!cookiesAceptadas()) {
        <div class="fixed inset-x-0 bottom-0 z-20 bg-navy-900 text-white px-5 py-4 sm:px-8 flex flex-col sm:flex-row items-center gap-4">
          <p class="text-sm text-wing-100/80 flex-1">
            Usamos cookies para mantener tu sesión activa y recordar tus preferencias (como el tema claro/oscuro). Al continuar, aceptas su uso.
          </p>
          <button type="button" (click)="aceptarCookies()" class="bg-white text-navy-900 text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap shrink-0">Aceptar</button>
        </div>
      }
    </div>
  `
})
export class LoginComponent implements OnDestroy {
  private static readonly CLAVE_ULTIMO_USUARIO = 'mhesus:ultimoUsuarioLogin';
  private static readonly CLAVE_RECORDADO = 'mhesus:usuarioRecordado';
  private static readonly CLAVE_COOKIES = 'mhesus:cookiesAceptadas';

  usuario = '';
  password = '';
  recordarme = false;
  verPassword = signal(false);
  error = signal<string | null>(null);
  cerradaPorInactividad = signal(false);
  bloqueadoHasta = signal<number | null>(null);
  cookiesAceptadas = signal(localStorage.getItem(LoginComponent.CLAVE_COOKIES) === 'true');
  mostrarOlvide = signal(false);
  usuarioOlvide = '';
  enviandoOlvide = signal(false);
  olvideEnviado = signal(false);
  private ahora = signal(Date.now());
  private intervalo?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute, public theme: ThemeService) {
    this.cerradaPorInactividad.set(this.route.snapshot.queryParamMap.get('motivo') === 'inactividad');
    this.intervalo = setInterval(() => this.ahora.set(Date.now()), 1000);

    // "Recordarme": si el usuario lo activó antes, precargamos su nombre de usuario
    // (nunca la contraseña — eso queda a criterio del gestor de contraseñas del navegador).
    const recordado = localStorage.getItem(LoginComponent.CLAVE_RECORDADO);
    if (recordado) {
      this.usuario = recordado;
      this.recordarme = true;
    }

    // Si al recargar la página el último usuario que intentó entrar sigue bloqueado
    // (el backend es quien decide esto de verdad — ver AuthService.estadoBloqueo),
    // restauramos el campo y el contador en vivo automáticamente, para que la cuenta
    // regresiva no "desaparezca" visualmente al refrescar.
    const ultimoUsuario = localStorage.getItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
    if (ultimoUsuario) {
      this.usuario = ultimoUsuario;
      this.onUsuarioChange();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  aceptarCookies(): void {
    localStorage.setItem(LoginComponent.CLAVE_COOKIES, 'true');
    this.cookiesAceptadas.set(true);
  }

  async enviarOlvide(): Promise<void> {
    const nombre = this.usuarioOlvide.trim();
    if (!nombre) return;
    this.enviandoOlvide.set(true);
    try {
      await this.auth.solicitarRestablecimiento(nombre);
    } catch {
      // Aunque falle la llamada, mostramos igual el mensaje de confirmación:
      // no queremos revelar si un usuario existe o no, ni bloquear al que
      // olvidó su contraseña con un error técnico que no puede resolver.
    } finally {
      this.enviandoOlvide.set(false);
      this.olvideEnviado.set(true);
    }
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

  async onUsuarioChange(): Promise<void> {
    const hasta = await this.auth.estadoBloqueo(this.usuario);
    this.bloqueadoHasta.set(hasta);
    if (hasta) {
      localStorage.setItem(LoginComponent.CLAVE_ULTIMO_USUARIO, this.usuario.trim());
    } else {
      localStorage.removeItem(LoginComponent.CLAVE_ULTIMO_USUARIO);
    }
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
    if (this.recordarme) {
      localStorage.setItem(LoginComponent.CLAVE_RECORDADO, this.usuario.trim());
    } else {
      localStorage.removeItem(LoginComponent.CLAVE_RECORDADO);
    }
    this.router.navigateByUrl('/inicio');
  }
}
