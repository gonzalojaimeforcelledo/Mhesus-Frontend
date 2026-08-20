import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-6 text-center relative">
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

      <img src="assets/logo-icon.png" alt="MHESUS" class="w-20 h-20 opacity-80 mb-2" />
      <p class="font-display font-700 text-7xl text-navy-700">404</p>
      <h1 class="font-display font-700 text-2xl text-ink-900 mt-3">Esta página no existe</h1>
      <p class="text-sm text-ink-500 mt-2 max-w-sm">
        Revisa que la dirección esté bien escrita, o vuelve al sistema desde el botón de abajo.
      </p>

      <button
        (click)="irAlInicio()"
        class="mt-8 bg-navy-700 hover:bg-navy-900 transition-colors text-white font-medium rounded-lg px-6 py-2.5 text-sm"
      >
        {{ auth.autenticado() ? 'Volver al inicio' : 'Ir al login' }}
      </button>
    </div>
  `
})
export class NotFoundComponent {
  constructor(private router: Router, public auth: AuthService, public theme: ThemeService) {}

  irAlInicio(): void {
    this.router.navigateByUrl(this.auth.autenticado() ? '/inicio' : '/login');
  }
}
