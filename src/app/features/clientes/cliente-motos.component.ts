import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-cliente-motos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/clientes" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver a Clientes
      </a>

      @if (cliente(); as c) {
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">{{ c.nombres }} {{ c.apellidos }}</h1>
          <p class="text-sm text-ink-500">DNI {{ c.dni }} · {{ c.celular }} · {{ motosDelCliente().length }} moto(s) registrada(s)</p>
        </div>

        <div class="panel">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-ink-500 border-b border-ink-100">
                  <th class="py-2.5 px-5 font-medium">Placa</th>
                  <th class="py-2.5 px-5 font-medium">Moto lineal</th>
                  <th class="py-2.5 px-5 font-medium">Kilometraje</th>
                  <th class="py-2.5 px-5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                @for (m of motosDelCliente(); track m.id) {
                  <tr [routerLink]="['/motos', m.id, 'historial']" class="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer">
                    <td class="py-3 px-5 font-mono font-medium text-brand-700">{{ m.placa }}</td>
                    <td class="py-3 px-5 text-ink-900">{{ m.marca }} {{ m.modelo }} · {{ m.anio }}</td>
                    <td class="py-3 px-5 text-ink-500">{{ m.kmActual | number }} km</td>
                    <td class="py-3 px-5 text-brand-700 text-xs font-medium whitespace-nowrap">Ver historial →</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="py-8 text-center text-ink-500">Este cliente no tiene motos registradas.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <p class="text-sm text-ink-500">Cliente no encontrado.</p>
      }
    </div>
  `
})
export class ClienteMotosComponent implements OnInit {
  clienteId = signal('');

  constructor(public store: StoreService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.clienteId.set(params.get('id') ?? '');
    });
    this.store.cargarClientes();
    this.store.cargarMotos();
  }

  cliente = computed(() => this.store.cliente(this.clienteId()));
  motosDelCliente = computed(() => this.store.motos().filter((m) => m.clienteId === this.clienteId()));
}
