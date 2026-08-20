import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-ink-50">
      <header class="border-b border-ink-100 bg-surface">
        <div class="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button (click)="volver()" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700">
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver
          </button>
          <button
            type="button" (click)="theme.alternar()" title="Cambiar tema"
            class="p-2 rounded-lg text-ink-500 bg-surface border border-ink-100 hover:text-navy-700"
          >
            @if (theme.esOscuro()) {
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
            }
          </button>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-6 py-10">
        <h1 class="font-display font-700 text-3xl text-ink-900">Términos y condiciones</h1>
        <p class="text-sm text-ink-400 mt-1">Última actualización: agosto de 2026</p>

        <div class="mt-8 space-y-7 text-sm leading-relaxed text-ink-700">
          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">1. Alcance del sistema</h2>
            <p>
              MHESUS Sistema Interno es una herramienta de uso exclusivo para el personal
              del taller MHESUS (recepción, mecánica, almacén, jefatura de taller y
              administración), destinada a gestionar órdenes de trabajo, clientes,
              motos lineales, inventario y cotizaciones. No está dirigido al público general
              ni sustituye ningún canal de atención al cliente.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">2. Cuentas de usuario</h2>
            <p>
              El acceso al sistema se otorga mediante cuentas creadas y administradas por el
              área de Administración. Cada persona es responsable de mantener la
              confidencialidad de su contraseña y de toda actividad realizada bajo su cuenta.
              Si sospechas que tu cuenta fue usada sin tu autorización, avisa de inmediato al
              administrador del sistema.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">3. Uso aceptable</h2>
            <p>
              El sistema debe usarse únicamente para las labores propias del taller. Queda
              prohibido: compartir credenciales de acceso, intentar acceder a información de
              módulos fuera del rol asignado, o modificar registros (órdenes de trabajo,
              inventario, cotizaciones) fuera de los flujos previstos por el sistema.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">4. Datos personales</h2>
            <p>
              El sistema almacena datos de clientes (nombre, DNI, celular, dirección) y de
              sus motos lineales, con el único fin de gestionar el servicio del taller. Estos
              datos no se comparten con terceros salvo obligación legal, y se conservan
              mientras exista una relación comercial vigente con el cliente o mientras sea
              necesario para fines administrativos y contables.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">5. Cookies</h2>
            <p>
              El sistema usa cookies y almacenamiento local del navegador únicamente para
              mantener tu sesión iniciada y recordar preferencias como el tema claro/oscuro
              o tu nombre de usuario (si activaste "Recordarme"). No se usan cookies de
              rastreo ni de publicidad.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">6. Disponibilidad</h2>
            <p>
              El sistema puede presentar interrupciones por mantenimiento, actualizaciones o
              causas ajenas al control del taller (proveedor de hosting, conectividad, etc.).
              Se procurará avisar con anticipación cuando sea posible.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">7. Cambios a estos términos</h2>
            <p>
              Estos términos pueden actualizarse en cualquier momento para reflejar cambios
              en el sistema o en la normativa aplicable. El uso continuado del sistema tras
              una actualización implica la aceptación de los términos vigentes.
            </p>
          </section>

          <section>
            <h2 class="font-display font-700 text-lg text-ink-900 mb-2">8. Contacto</h2>
            <p>
              Ante cualquier duda sobre estos términos o sobre el tratamiento de datos,
              comunícate con el área de Administración del taller.
            </p>
          </section>
        </div>
      </main>
    </div>
  `
})
export class TerminosComponent {
  constructor(private router: Router, public theme: ThemeService) {}

  volver(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigateByUrl('/login');
    }
  }
}
