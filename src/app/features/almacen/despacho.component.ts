import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { FotoCapturaComponent } from '../../shared/components/foto-captura.component';

@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [CommonModule, FotoCapturaComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Despacho</h1>
        <p class="text-sm text-ink-500">Pedidos de repuestos que debes alistar, identificados por código y nombre.</p>
      </div>

      @if (mensaje()) {
        <p class="text-sm rounded-lg px-4 py-2.5" [class]="esError() ? 'bg-crimson-500/10 text-crimson-500' : 'bg-emerald-500/10 text-emerald-600'">{{ mensaje() }}</p>
      }

      <div class="space-y-3">
        @for (p of pedidos(); track p.id) {
          <div class="panel p-4">
            <button type="button" (click)="toggle(p.id)" class="w-full flex items-center justify-between gap-3 text-left">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                <span class="font-mono text-sm font-semibold text-brand-700">{{ store.ot(p.otId)?.numeroOT }}</span>
                <span class="text-sm text-ink-500">{{ store.moto(store.ot(p.otId)?.motoId ?? '')?.placa }}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" [class]="p.estado === 'Aprobado' ? 'text-brand-700 bg-navy-700/10' : 'text-amber-500 bg-amber-400/10'">
                  {{ p.estado === 'Aprobado' ? 'Listo para alistar' : 'Esperando presupuesto' }}
                </span>
              </div>
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0 transition-transform" [class.rotate-180]="abierto() === p.id" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            @if (abierto() === p.id) {
              <div class="mt-3 pt-3 border-t border-ink-100">
                <ul class="divide-y divide-ink-50">
                  @for (d of store.detalleDePedido(p.id); track d.id) {
                    <li class="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p class="text-ink-900">{{ store.producto(d.productoId)?.nombre }}</p>
                        <p class="text-xs font-mono text-ink-500">{{ store.producto(d.productoId)?.codigo }}</p>
                      </div>
                      <span class="text-ink-500 font-medium">{{ d.cantidadSolicitada }} u.</span>
                    </li>
                  }
                </ul>

                @if (p.estado === 'Aprobado') {
                  <div class="mt-3 pt-3 border-t border-ink-100">
                    <app-foto-captura
                      label="Foto de los productos entregados (obligatoria)" textoBoton="Tomar o subir foto del despacho"
                      [valor]="fotos[p.id] ?? null" (valorChange)="fotos[p.id] = $event"
                    />
                    @if (intentoDespacho() === p.id && !fotos[p.id]) {
                      <p class="text-sm text-crimson-500 mt-2">Falta la foto del despacho — es obligatoria para marcar como listo.</p>
                    }
                    <button (click)="marcarListo(p.id)" class="mt-3 w-full sm:w-auto px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">
                      Listo → avisar a Recepción
                    </button>
                  </div>
                } @else {
                  <p class="mt-3 text-xs text-ink-400">Recepción todavía está confirmando el presupuesto con el cliente. En cuanto lo autorice, este pedido pasará a "Listo para alistar".</p>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="panel p-8 text-center">
            <p class="text-sm text-ink-500">No tienes pedidos pendientes por alistar.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class DespachoComponent {
  abierto = signal<string | null>(null);
  mensaje = signal<string | null>(null);
  esError = signal(false);
  fotos: Record<string, string | null> = {};
  intentoDespacho = signal<string | null>(null);

  constructor(public store: StoreService, private auth: AuthService) {}

  pedidos = computed(() => this.store.pedidos().filter((p) => p.estado === 'Solicitado' || p.estado === 'Aprobado'));

  toggle(id: string): void {
    this.abierto.set(this.abierto() === id ? null : id);
  }

  async marcarListo(pedidoId: string): Promise<void> {
    this.intentoDespacho.set(pedidoId);
    if (!this.fotos[pedidoId]) return;
    const uid = this.auth.usuario()?.id ?? '';
    const res = await this.store.despacharPedido(pedidoId, uid, this.fotos[pedidoId] ?? null);
    this.esError.set(!res.ok);
    this.mensaje.set(res.ok ? 'Pedido despachado. Se avisó a Recepción que ya está listo.' : res.error ?? 'No se pudo despachar el pedido.');
    if (res.ok) { this.abierto.set(null); this.intentoDespacho.set(null); }
  }
}

