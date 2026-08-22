import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { MARCAS_MOTO, MODELOS_POR_MARCA, SUBMODELOS_POR_MODELO, MarcaMoto } from '../../core/models/models';

@Component({
  selector: 'app-producto-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/almacen" class="flex items-center gap-2 text-sm text-ink-500 hover:text-navy-700 w-fit">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver a Almacén
      </a>

      <div>
        <h1 class="font-display font-700 text-2xl text-ink-900">Registrar producto</h1>
        <p class="text-sm text-ink-500">Agrega un producto nuevo al catálogo de Almacén.</p>
      </div>

      <form (ngSubmit)="crear()" class="panel p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label class="text-sm font-medium text-ink-700">Código interno</label>
          <input [(ngModel)]="nuevo.codigo" name="codigo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. REP-001" />
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Código de barras (opcional)</label>
          <input [(ngModel)]="nuevo.codigoBarras" name="codigoBarras" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
        <div class="sm:col-span-2 lg:col-span-1">
          <label class="text-sm font-medium text-ink-700">Categoría</label>
          <input [(ngModel)]="nuevo.categoria" name="categoria" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. Frenos" />
        </div>
        <div class="sm:col-span-2 lg:col-span-3">
          <label class="text-sm font-medium text-ink-700">Nombre</label>
          <input [(ngModel)]="nuevo.nombre" name="nombre" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. Pastillas de freno delanteras" />
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

        <div class="sm:col-span-2 lg:col-span-3 pt-2 border-t border-ink-100">
          <p class="text-sm font-medium text-ink-700 mb-1">Compatibilidad con moto</p>
          <p class="text-xs text-ink-400 mb-3">La marca es obligatoria. Modelo, submodelo y años son opcionales — ponlos solo si el repuesto es específico de un modelo.</p>
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Marca (obligatoria)</label>
          <select [(ngModel)]="nuevo.marcaMoto" name="marcaMoto" (ngModelChange)="onMarcaChange()" class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-navy-500" [class]="intentoEnviar() && !nuevo.marcaMoto ? 'border-crimson-500' : 'border-ink-100'">
            <option [ngValue]="null" disabled>Selecciona una marca...</option>
            @for (m of marcas; track m) { <option [value]="m">{{ m }}</option> }
          </select>
          @if (intentoEnviar() && !nuevo.marcaMoto) {
            <p class="text-xs text-crimson-500 mt-1">Elige una marca para poder guardar el producto.</p>
          }
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Modelo</label>
          <select [(ngModel)]="nuevo.modeloMoto" name="modeloMoto" (ngModelChange)="onModeloChange()" [disabled]="!nuevo.marcaMoto" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500 disabled:opacity-50 disabled:bg-ink-50">
            <option [ngValue]="null">—</option>
            @for (m of modelosDisponibles(); track m) { <option [value]="m">{{ m }}</option> }
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-ink-700">Submodelo</label>
          <select [(ngModel)]="nuevo.submodeloMoto" name="submodeloMoto" [disabled]="!nuevo.modeloMoto" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500 disabled:opacity-50 disabled:bg-ink-50">
            <option [ngValue]="null">—</option>
            @for (s of submodelosDisponibles(); track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-ink-700">Año desde</label>
            <input [(ngModel)]="nuevo.anioDesde" type="number" name="anioDesde" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. 2018" />
          </div>
          <div>
            <label class="text-sm font-medium text-ink-700">Año hasta</label>
            <input [(ngModel)]="nuevo.anioHasta" type="number" name="anioHasta" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-navy-500" placeholder="Ej. 2024" />
          </div>
        </div>

        <div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
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
  marcas = MARCAS_MOTO;

  nuevo: {
    codigo: string; codigoBarras: string; nombre: string; categoria: string; lugar: string; precio: number; descuentoMaximo: number | null;
    stockActual: number; stockMinimo: number; marcaMoto: string | null; modeloMoto: string | null; submodeloMoto: string | null;
    anioDesde: number | null; anioHasta: number | null;
  } = {
    codigo: '', codigoBarras: '', nombre: '', categoria: '', lugar: '', precio: 0, descuentoMaximo: null,
    stockActual: 0, stockMinimo: 0, marcaMoto: null, modeloMoto: null, submodeloMoto: null, anioDesde: null, anioHasta: null
  };
  guardando = signal(false);
  intentoEnviar = signal(false);

  constructor(private store: StoreService, private router: Router) {}

  modelosDisponibles(): string[] {
    return this.nuevo.marcaMoto ? MODELOS_POR_MARCA[this.nuevo.marcaMoto as MarcaMoto] ?? [] : [];
  }

  submodelosDisponibles(): string[] {
    if (!this.nuevo.marcaMoto || !this.nuevo.modeloMoto) return [];
    return SUBMODELOS_POR_MODELO[`${this.nuevo.marcaMoto}-${this.nuevo.modeloMoto}`] ?? [];
  }

  onMarcaChange(): void {
    this.nuevo.modeloMoto = null;
    this.nuevo.submodeloMoto = null;
  }

  onModeloChange(): void {
    this.nuevo.submodeloMoto = null;
  }

  async crear(): Promise<void> {
    this.intentoEnviar.set(true);
    if (!this.nuevo.codigo || !this.nuevo.nombre || !this.nuevo.marcaMoto) return;
    this.guardando.set(true);
    try {
      await this.store.crearProducto({ ...this.nuevo });
      this.router.navigateByUrl('/almacen');
    } finally {
      this.guardando.set(false);
    }
  }
}
