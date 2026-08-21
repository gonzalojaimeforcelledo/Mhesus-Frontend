import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-recuperar-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-ink-50 p-6 relative">
      <button
        type="button" (click)="theme.alternar()" title="Cambiar tema"
        class="fixed top-4 right-4 p-2 rounded-lg text-ink-500 bg-surface border border-ink-100 hover:text-navy-700 shadow-sm"
      >
        @if (theme.esOscuro()) {
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        }
      </button>

      <div class="w-full max-w-sm">
        <a routerLink="/login" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit mb-6">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al login
        </a>

        <h1 class="font-display font-700 text-2xl text-ink-900">Recuperar acceso de administrador</h1>
        <p class="text-sm text-ink-500 mt-1">
          Te mandamos un código de verificación al correo que tienes registrado en tu cuenta.
        </p>

        @if (paso() === 1) {
          <form (ngSubmit)="pedirCodigo()" class="mt-6 space-y-4">
            <div>
              <label class="text-sm font-medium text-ink-700">Usuario</label>
              <input
                type="text" [(ngModel)]="usuario" name="usuario" required autocomplete="username"
                class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                placeholder="ej. admin"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-ink-700">Correo registrado</label>
              <input
                type="email" [(ngModel)]="email" name="email" required autocomplete="email"
                class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                placeholder="tucorreo@gmail.com"
              />
              <p class="text-xs text-ink-400 mt-1">Debe ser el mismo correo que Administración registró para tu cuenta.</p>
            </div>

            <button type="submit" [disabled]="enviando()" class="w-full bg-navy-700 hover:bg-navy-900 transition-colors text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50">
              {{ enviando() ? 'Enviando...' : 'Enviar código' }}
            </button>
          </form>
        }

        @if (paso() === 2) {
          <div class="mt-6 space-y-4">
            <p class="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
              Si los datos son correctos, te llegará un código a tu correo en unos minutos.
            </p>

            <form (ngSubmit)="confirmar()" class="space-y-4">
              <div>
                <label class="text-sm font-medium text-ink-700">Código de verificación</label>
                <input
                  type="text" [(ngModel)]="codigo" name="codigo" required maxlength="6" inputmode="numeric"
                  class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500 tracking-[0.3em] font-mono text-center text-lg"
                  placeholder="000000"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-ink-700">Nueva contraseña</label>
                <input
                  type="password" [(ngModel)]="nuevaPassword" name="nuevaPassword" required minlength="6"
                  class="mt-1 w-full rounded-lg border border-ink-100 bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              @if (error()) {
                <p class="text-sm text-crimson-500 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">{{ error() }}</p>
              }
              @if (exito()) {
                <p class="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">Contraseña actualizada. Ya puedes iniciar sesión.</p>
              }

              @if (!exito()) {
                <button type="submit" [disabled]="confirmando()" class="w-full bg-navy-700 hover:bg-navy-900 transition-colors text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50">
                  {{ confirmando() ? 'Confirmando...' : 'Restablecer contraseña' }}
                </button>
              } @else {
                <a routerLink="/login" class="block text-center w-full bg-navy-700 hover:bg-navy-900 transition-colors text-white font-medium rounded-lg py-2.5 text-sm">Ir al login →</a>
              }

              <button type="button" (click)="paso.set(1)" class="text-sm text-ink-500 hover:underline w-full text-center">← Volver a pedir el código</button>
            </form>
          </div>
        }
      </div>
    </div>
  `
})
export class RecuperarAdminComponent {
  paso = signal<1 | 2>(1);
  usuario = '';
  email = '';
  codigo = '';
  nuevaPassword = '';
  enviando = signal(false);
  confirmando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);

  constructor(private auth: AuthService, public theme: ThemeService) {}

  async pedirCodigo(): Promise<void> {
    if (!this.usuario.trim() || !this.email.trim()) return;
    this.enviando.set(true);
    try {
      await this.auth.solicitarCodigoRecuperacion(this.usuario, this.email);
    } catch {
      // No mostramos error distinto: no queremos revelar si la cuenta o el correo existen o no.
    } finally {
      this.enviando.set(false);
      this.paso.set(2);
    }
  }

  async confirmar(): Promise<void> {
    if (!this.codigo.trim() || this.nuevaPassword.trim().length < 6) return;
    this.confirmando.set(true);
    this.error.set(null);
    const res = await this.auth.confirmarCodigoRecuperacion(this.usuario, this.codigo, this.nuevaPassword);
    this.confirmando.set(false);
    if (res.ok) {
      this.exito.set(true);
    } else {
      this.error.set(res.error ?? 'No se pudo confirmar el código.');
    }
  }
}
