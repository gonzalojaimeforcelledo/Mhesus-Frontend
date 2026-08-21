import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-producto-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-2xl">
      <a routerLink="/almacen" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver a Almacén
      </a>

      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Registrar producto</h1>
        <p class="text-sm text-ink-500">Agrega un producto nuevo al catálogo de Almacén.</p>
      </div>

      <form (ngSubmit)="crear()" class="panel p-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-ink-700">Código interno</label>
          <input [(ngModel)]="nuevo.codigo" name="codigo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. REP-001" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Código de barras (opcional)</label>
          <input [(ngModel)]="nuevo.codigoBarras" name="codigoBarras" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
        <div class="sm:col-span-2">
          <label class="text-sm font-medium text-ink-700">Nombre</label>
          <input [(ngModel)]="nuevo.nombre" name="nombre" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. Pastillas de freno delanteras" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Categoría</label>
          <input [(ngModel)]="nuevo.categoria" name="categoria" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. Frenos" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Ubicación</label>
          <input [(ngModel)]="nuevo.lugar" name="lugar" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. Estante A3" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Precio (S/)</label>
          <input [(ngModel)]="nuevo.precio" type="number" min="0" step="0.01" name="precio" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Descuento máximo (%)</label>
          <input [(ngModel)]="nuevo.descuentoMaximo" type="number" min="0" max="100" step="1" name="descuentoMaximo" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. 10" />
          <p class="text-xs text-ink-400 mt-1">Hasta cuánto se le puede rebajar el precio a este producto.</p>
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Stock inicial</label>
          <input [(ngModel)]="nuevo.stockActual" type="number" min="0" name="stockActual" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Stock mínimo</label>
          <input [(ngModel)]="nuevo.stockMinimo" type="number" min="0" name="stockMinimo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>

        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <a routerLink="/almacen" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">Cancelar</a>
          <button type="submit" [disabled]="guardando()" class="px-6 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium">
            {{ guardando() ? 'Guardando...' : 'Guardar producto' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ProductoNuevoComponent {
  nuevo: { codigo: string; codigoBarras: string; nombre: string; categoria: string; lugar: string; precio: number; descuentoMaximo: number | null; stockActual: number; stockMinimo: number } = {
    codigo: '', codigoBarras: '', nombre: '', categoria: '', lugar: '', precio: 0, descuentoMaximo: null, stockActual: 0, stockMinimo: 0
  };
  guardando = signal(false);

  constructor(private store: StoreService, private router: Router) {}

  async crear(): Promise<void> {
    if (!this.nuevo.codigo || !this.nuevo.nombre) return;
    this.guardando.set(true);
    try {
      await this.store.crearProducto({ ...this.nuevo });
      this.router.navigateByUrl('/almacen');
    } finally {
      this.guardando.set(false);
    }
  }
}
