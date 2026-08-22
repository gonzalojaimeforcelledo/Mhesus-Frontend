import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { NivelProducto, nivelVistaProducto, permisoDe } from '../../core/services/permissions';
import { descargarPlantillaIngresoStock, exportarProductosExcel, leerIngresoStockDesdeArchivo, leerProductosDesdeArchivo } from './excel.util';
import { ItemOferta, MARCAS_MOTO, MarcaMoto, MODELOS_POR_MARCA, Oferta, Producto, SUBMODELOS_POR_MODELO } from '../../core/models/models';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display font-700 text-2xl text-ink-900">Almacén</h1>
          <p class="text-sm text-ink-500">
            @if (nivel() === 'solo_nombre') { Busca repuestos por nombre para incluirlos en un pedido. }
            @else if (nivel() === 'con_precio') { Consulta código y precio de productos para armar cotizaciones. }
            @else { Catálogo de productos y alertas de stock. }
          </p>
        </div>
        @if (puedeEditar()) {
          <div class="flex items-center gap-2">
            <button (click)="exportar()" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500 flex items-center gap-2">
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              Exportar a Excel
            </button>
            <button (click)="archivoImportar.click()" title="Reemplaza los datos del producto (incluido el stock) por lo que traiga el archivo" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500 flex items-center gap-2">
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21V9m0 0-4 4m4-4 4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>
              Importar desde Excel
            </button>
            <input #archivoImportar type="file" accept=".xlsx,.xls,.csv" class="hidden" (change)="importar($event)" />
            <div class="relative">
              <button (click)="menuIngresoAbierto.set(!menuIngresoAbierto())" title="Suma cantidad al stock que el producto ya tiene, no lo reemplaza — para cuando llega mercadería nueva" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500 flex items-center gap-2">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                Ingreso de stock
              </button>
              @if (menuIngresoAbierto()) {
                <div class="absolute right-0 mt-1 w-64 bg-surface border border-ink-100 rounded-lg shadow-panel z-20 py-1">
                  <button (click)="descargarPlantilla()" class="w-full text-left px-3 py-2.5 text-sm hover:bg-ink-50 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                    Descargar plantilla
                  </button>
                  <button (click)="archivoIngreso.click(); menuIngresoAbierto.set(false)" class="w-full text-left px-3 py-2.5 text-sm hover:bg-ink-50 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21V9m0 0-4 4m4-4 4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>
                    Subir Excel de ingreso
                  </button>
                </div>
              }
            </div>
            <input #archivoIngreso type="file" accept=".xlsx,.xls,.csv" class="hidden" (change)="ingresarStock($event)" />
            <a routerLink="/almacen/nuevo" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">
              + Nuevo producto
            </a>
          </div>
        }
      </div>

      @if (mensajeImportacion()) {
        <div class="text-sm rounded-lg px-4 py-2.5" [class]="errorImportacion() ? 'bg-crimson-500/10 text-crimson-500' : 'bg-emerald-500/10 text-emerald-600'">
          {{ mensajeImportacion() }}
        </div>
      }

      @if (nivel() === 'completo') {
        <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1 w-fit">
          <button (click)="tab.set('productos')" [class.bg-surface]="tab() === 'productos'" [class.shadow]="tab() === 'productos'" class="px-4 py-1.5 rounded-md text-xs font-medium">Catálogo</button>
          <button (click)="tab.set('movimientos')" [class.bg-surface]="tab() === 'movimientos'" [class.shadow]="tab() === 'movimientos'" class="px-4 py-1.5 rounded-md text-xs font-medium">Movimientos</button>
          <button (click)="verOfertas()" [class.bg-surface]="tab() === 'ofertas'" [class.shadow]="tab() === 'ofertas'" class="px-4 py-1.5 rounded-md text-xs font-medium">Ofertas</button>
        </div>
      }

      <!-- Buscador (todos los niveles con catálogo) -->
      @if (nivel() !== 'solo_nombre' || true) {
        <div class="panel p-3">
          <div class="flex items-center gap-3 px-1 py-1 flex-wrap">
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input [ngModel]="filtro()" (ngModelChange)="filtro.set($event)" placeholder="Buscar por código o nombre..." class="flex-1 min-w-[160px] text-sm outline-none" />
            <select [ngModel]="filtroMarca()" (ngModelChange)="onFiltroMarcaChange($event)" class="text-sm rounded-lg border border-ink-100 px-2 py-1.5 shrink-0">
              <option [ngValue]="null">Todas las marcas</option>
              @for (m of marcas; track m) { <option [value]="m">{{ m }}</option> }
            </select>
            <select [ngModel]="filtroAnio()" (ngModelChange)="filtroAnio.set($event)" class="text-sm rounded-lg border border-ink-100 px-2 py-1.5 shrink-0">
              <option [ngValue]="null">Todos los años</option>
              @for (a of aniosDisponibles; track a) { <option [value]="a">{{ a }}</option> }
            </select>
          </div>

          @if (filtroMarca()) {
            <div class="flex items-center gap-3 px-1 pt-2 mt-2 border-t border-ink-50 flex-wrap">
              <span class="text-xs text-ink-400 shrink-0">Filtrar más:</span>
              <select [ngModel]="filtroModelo()" (ngModelChange)="onFiltroModeloChange($event)" class="text-sm rounded-lg border border-ink-100 px-2 py-1.5 shrink-0">
                <option [ngValue]="null">Todos los modelos</option>
                @for (m of modelosFiltroDisponibles(); track m) { <option [value]="m">{{ m }}</option> }
              </select>
              @if (filtroModelo()) {
                <select [ngModel]="filtroSubmodelo()" (ngModelChange)="filtroSubmodelo.set($event)" class="text-sm rounded-lg border border-ink-100 px-2 py-1.5 shrink-0">
                  <option [ngValue]="null">Todos los submodelos</option>
                  @for (s of submodelosFiltroDisponibles(); track s) { <option [value]="s">{{ s }}</option> }
                </select>
              }
            </div>
          }
        </div>
      }

      <!-- Mecánico: lista simple de solo nombre -->
      @if (nivel() === 'solo_nombre') {
        <div class="panel px-4">
          <ul class="divide-y divide-ink-50">
            @for (p of productosFiltrados(); track p.id) {
              <li class="py-3 flex items-center justify-between">
                <span class="text-sm text-ink-900">{{ p.nombre }}</span>
                <span class="text-xs text-ink-400">{{ p.categoria }}</span>
              </li>
            } @empty {
              <li class="py-8 text-center text-ink-500 text-sm">No se encontraron productos.</li>
            }
          </ul>
        </div>
      }

      <!-- Recepción / Almacén / Administración: catálogo en tarjetas -->
      @if ((nivel() === 'con_precio' || nivel() === 'completo') && (nivel() !== 'completo' || tab() === 'productos')) {
        <div class="space-y-2">
          @for (p of productosFiltrados(); track p.id) {
            <div class="panel p-4 flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-wing-100 grid place-items-center shrink-0">
                <svg viewBox="0 0 24 24" class="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 1-5.66 5.66L4 17v3h3l5.03-5.03a4 4 0 0 1 5.67-5.67L21 6l-3-3-3.3 3.3Z"/></svg>
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-display font-700 text-sm tracking-wide text-ink-900 truncate">{{ p.nombre | uppercase }}</p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-ink-500">
                  <span class="flex items-center gap-1 font-mono">
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="m20.6 12.3-8.3 8.3a2 2 0 0 1-2.8 0L3 14.1V4a1 1 0 0 1 1-1h10.1l6.5 6.5a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="7.5" r="1.5"/></svg>
                    {{ p.codigo }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h1v12H4zM7 6h2v12H7zM11 6h1v12h-1zM14 6h2v12h-2zM19 6h1v12h-1z"/></svg>
                    {{ p.codigoBarras || 'Sin código de barras' }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-ink-500">
                  <span class="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="m20.6 12.3-8.3 8.3a2 2 0 0 1-2.8 0L3 14.1V4a1 1 0 0 1 1-1h10.1l6.5 6.5a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="7.5" r="1.5"/></svg>
                    {{ p.categoria || 'Sin categoría' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7"/></svg>
                    Unidades
                  </span>
                  @if (p.lugar) {
                    <span class="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>
                      Ubicación: {{ p.lugar }}
                    </span>
                  }
                  @if (p.marcaMoto) {
                    <span class="flex items-center gap-1 text-navy-700 font-medium">
                      <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 1 1-1h2M12 17.5H9m0 0 3-8h4l2 5"/></svg>
                      {{ p.marcaMoto }} {{ p.modeloMoto }} {{ p.submodeloMoto }}{{ p.anioDesde ? ' (' + p.anioDesde + (p.anioHasta && p.anioHasta !== p.anioDesde ? '–' + p.anioHasta : '') + ')' : '' }}
                    </span>
                  }
                </div>
              </div>

              <div class="text-right shrink-0">
                @if (p.precioAnterior && p.precioAnterior !== p.precio) {
                  <p class="text-xs text-ink-400 line-through leading-none mb-0.5">S/ {{ p.precioAnterior.toFixed(2) }}</p>
                }
                <p class="font-display font-700 text-xl text-emerald-600 leading-none">
                  S/ {{ parteEntera(p.precio) }}<span class="text-sm align-top">.{{ parteDecimal(p.precio) }}</span>
                </p>
                @if (p.descuentoMaximo) {
                  <p class="text-[11px] text-amber-600 mt-0.5">Hasta {{ p.descuentoMaximo }}% dscto.</p>
                }
                @if (nivel() === 'completo') {
                  <button (click)="toggleStock(p.id)" class="mt-2 px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900">
                    {{ stockAbierto() === p.id ? 'Ocultar stock' : 'Ver stock' }}
                  </button>
                }
              </div>

              @if (puedeEditar()) {
                <div class="relative shrink-0">
                  <button (click)="menuAbierto.set(menuAbierto() === p.id ? null : p.id)" class="p-2 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                    <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                  </button>
                  @if (menuAbierto() === p.id) {
                    <div class="fixed inset-0 z-10" (click)="menuAbierto.set(null)"></div>
                    <div class="absolute right-0 mt-1 w-40 panel z-20 py-1">
                      <button (click)="abrirEdicion(p)" class="w-full text-left px-3 py-2 text-xs text-ink-700 hover:bg-ink-50">Editar producto</button>
                      <button (click)="eliminar(p.id)" class="w-full text-left px-3 py-2 text-xs text-crimson-500 hover:bg-crimson-500/5">Eliminar producto</button>
                    </div>
                  }
                </div>
              }
            </div>

            @if (nivel() === 'completo' && stockAbierto() === p.id) {
              <div class="panel px-4 py-3 flex items-center justify-between text-sm -mt-1">
                <p>
                  <span class="font-medium" [class]="p.stockActual <= p.stockMinimo ? 'text-crimson-500' : 'text-ink-900'">{{ p.stockActual }}</span>
                  <span class="text-ink-400"> en stock · mínimo {{ p.stockMinimo }}</span>
                </p>
                @if (puedeEditar()) {
                  <div class="flex items-center gap-1">
                    <button (click)="ajustar(p.id, -1)" class="w-7 h-7 rounded border border-ink-100 hover:border-navy-500 text-sm">−</button>
                    <button (click)="ajustar(p.id, 1)" class="w-7 h-7 rounded border border-ink-100 hover:border-navy-500 text-sm">+</button>
                  </div>
                }
              </div>
            }
          } @empty {
            <p class="text-sm text-ink-500 text-center py-8">No se encontraron productos.</p>
          }
        </div>
      }

      @if (nivel() === 'completo' && tab() === 'movimientos') {
        <div class="panel overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Fecha</th>
                <th class="py-2.5 px-4 font-medium">Producto</th>
                <th class="py-2.5 px-4 font-medium">Tipo</th>
                <th class="py-2.5 px-4 font-medium">Cantidad</th>
                <th class="py-2.5 px-4 font-medium">OT</th>
                <th class="py-2.5 px-4 font-medium">Usuario</th>
                <th class="py-2.5 px-4 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              @for (m of movimientosOrdenados(); track m.id) {
                <tr class="border-b border-ink-50">
                  <td class="py-3 px-4 text-ink-500">{{ m.creadoEn | date:'short' }}</td>
                  <td class="py-3 px-4 text-ink-900">{{ store.producto(m.productoId)?.nombre }}</td>
                  <td class="py-3 px-4 capitalize" [class]="m.tipo === 'salida' ? 'text-crimson-500' : 'text-emerald-600'">{{ m.tipo }}</td>
                  <td class="py-3 px-4 text-ink-700">{{ m.cantidad }}</td>
                  <td class="py-3 px-4 font-mono text-xs text-ink-500">{{ m.otId ? store.ot(m.otId)?.numeroOT : '—' }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ store.usuario(m.usuarioId)?.nombre }}</td>
                  <td class="py-3 px-4 text-ink-500">{{ m.nota || '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="py-8 text-center text-ink-500">Sin movimientos.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'ofertas') {
        <div class="panel p-5">
          <h2 class="font-display font-600 text-ink-900 mb-3">{{ ofertaEditando() ? 'Editar oferta' : 'Nueva oferta' }}</h2>
          <div class="grid sm:grid-cols-2 gap-3 mb-3">
            <input [(ngModel)]="formOferta.nombre" name="ofNombre" placeholder="Nombre (ej. Kit de mantenimiento)" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="formOferta.precioOferta" type="number" min="0" step="0.01" name="ofPrecio" placeholder="Precio de la oferta (S/)" class="rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            <input [(ngModel)]="formOferta.descripcion" name="ofDescripcion" placeholder="Descripción (opcional)" class="sm:col-span-2 rounded-lg border border-ink-100 px-3 py-2 text-sm" />
          </div>

          <p class="text-xs font-medium text-ink-500 mb-2">Productos que incluye la oferta (el stock se descuenta de cada uno al venderla)</p>
          <div class="relative mb-2">
            <input [(ngModel)]="buscarProductoOferta" name="buscarProductoOferta" placeholder="Buscar producto por nombre o código..." class="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm" />
            @if (sugerenciasOferta().length) {
              <div class="absolute z-10 mt-1 w-full bg-surface border border-ink-100 rounded-lg shadow-panel max-h-48 overflow-y-auto">
                @for (p of sugerenciasOferta(); track p.id) {
                  <button type="button" (click)="agregarProductoAOferta(p)" class="w-full text-left px-3 py-2 text-sm hover:bg-ink-50">{{ p.nombre }} <span class="text-ink-400 font-mono">· {{ p.codigo }}</span></button>
                }
              </div>
            }
          </div>
          @for (item of formOfertaItems(); track item.productoId) {
            <div class="flex items-center gap-2 mb-1.5">
              <span class="flex-1 text-sm text-ink-700">{{ store.producto(item.productoId)?.nombre }}</span>
              <input type="number" min="1" [ngModel]="item.cantidad" (ngModelChange)="cambiarCantidadOferta(item.productoId, $event)" class="w-16 rounded border border-ink-100 px-2 py-1 text-sm" />
              <button (click)="quitarProductoDeOferta(item.productoId)" class="text-ink-300 hover:text-crimson-500 text-lg leading-none px-1">✕</button>
            </div>
          }

          <div class="flex justify-end gap-2 mt-3">
            @if (ofertaEditando()) {
              <button type="button" (click)="cancelarEdicionOferta()" class="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:bg-ink-50">Cancelar</button>
            }
            <button type="button" (click)="guardarOferta()" [disabled]="!formOferta.nombre || !formOfertaItems().length" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-xs font-medium hover:bg-navy-900 disabled:opacity-40">
              {{ ofertaEditando() ? 'Guardar cambios' : 'Crear oferta' }}
            </button>
          </div>
        </div>

        <div class="panel overflow-x-auto mt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-500 border-b border-ink-100">
                <th class="py-2.5 px-4 font-medium">Oferta</th>
                <th class="py-2.5 px-4 font-medium">Incluye</th>
                <th class="py-2.5 px-4 font-medium">Precio</th>
                <th class="py-2.5 px-4 font-medium">Estado</th>
                <th class="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (o of store.ofertas(); track o.id) {
                <tr class="border-b border-ink-50" [class.opacity-50]="!o.activo">
                  <td class="py-3 px-4 text-ink-900">{{ o.nombre }}</td>
                  <td class="py-3 px-4 text-ink-500 text-xs">{{ descripcionItemsOferta(o) }}</td>
                  <td class="py-3 px-4 text-ink-900 font-medium">S/ {{ o.precioOferta.toFixed(2) }}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full" [class]="o.activo ? 'text-emerald-600 bg-emerald-500/10' : 'text-ink-400 bg-ink-100'">{{ o.activo ? 'Activa' : 'Inactiva' }}</span>
                  </td>
                  <td class="py-3 px-4 flex items-center gap-3">
                    <button (click)="editarOferta(o)" class="text-xs font-medium text-brand-700 hover:underline">Editar</button>
                    <button (click)="store.alternarOfertaActiva(o.id)" class="text-xs font-medium text-navy-700 hover:underline">{{ o.activo ? 'Desactivar' : 'Activar' }}</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-8 text-center text-ink-500">Sin ofertas creadas todavía.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal: editar producto -->
      @if (productoEditando(); as p) {
        <div class="fixed inset-0 z-[60] bg-transparent flex items-center justify-center p-4" (click)="cerrarEdicion()">
          <div class="panel w-full max-w-lg max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-5 border-b border-ink-100">
              <h2 class="font-display font-700 text-lg text-ink-900">Editar producto</h2>
              <button type="button" (click)="cerrarEdicion()" class="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form (ngSubmit)="guardarEdicion()" class="p-5 space-y-4">
              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-medium text-ink-500">Nombre</label>
                  <input [(ngModel)]="edicion.nombre" name="eNombre" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Código</label>
                  <input [(ngModel)]="edicion.codigo" name="eCodigo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 font-mono" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Código de barras</label>
                  <input [(ngModel)]="edicion.codigoBarras" name="eCodigoBarras" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 font-mono" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Categoría</label>
                  <input [(ngModel)]="edicion.categoria" name="eCategoria" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Ubicación</label>
                  <input [(ngModel)]="edicion.lugar" name="eLugar" placeholder="Ej. Estante A3" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Precio (S/)</label>
                  <input [(ngModel)]="edicion.precio" type="number" name="ePrecio" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Descuento máximo (%)</label>
                  <input [(ngModel)]="edicion.descuentoMaximo" type="number" min="0" max="100" name="eDescuento" placeholder="Ej. 10" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Stock actual</label>
                  <input [(ngModel)]="edicion.stockActual" type="number" name="eStock" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Stock mínimo</label>
                  <input [(ngModel)]="edicion.stockMinimo" type="number" name="eStockMinimo" required class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                </div>
                <div class="sm:col-span-2 pt-2 border-t border-ink-100">
                  <p class="text-xs font-medium text-ink-500">Compatibilidad con moto (opcional)</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Marca</label>
                  <select [(ngModel)]="edicion.marcaMoto" name="eMarca" (ngModelChange)="onMarcaEdicionChange()" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500">
                    <option [ngValue]="null">— Cualquiera —</option>
                    @for (m of marcas; track m) { <option [value]="m">{{ m }}</option> }
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Modelo</label>
                  <select [(ngModel)]="edicion.modeloMoto" name="eModelo" (ngModelChange)="onModeloEdicionChange()" [disabled]="!edicion.marcaMoto" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 disabled:opacity-50 disabled:bg-ink-50">
                    <option [ngValue]="null">—</option>
                    @for (m of modelosEdicionDisponibles(); track m) { <option [value]="m">{{ m }}</option> }
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-500">Submodelo</label>
                  <select [(ngModel)]="edicion.submodeloMoto" name="eSubmodelo" [disabled]="!edicion.modeloMoto" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500 disabled:opacity-50 disabled:bg-ink-50">
                    <option [ngValue]="null">—</option>
                    @for (s of submodelosEdicionDisponibles(); track s) { <option [value]="s">{{ s }}</option> }
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-medium text-ink-500">Año desde</label>
                    <input [(ngModel)]="edicion.anioDesde" type="number" name="eAnioDesde" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-ink-500">Año hasta</label>
                    <input [(ngModel)]="edicion.anioHasta" type="number" name="eAnioHasta" class="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-navy-500" />
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-2 border-t border-ink-100">
                <button type="button" (click)="cerrarEdicion()" class="px-4 py-2 rounded-lg border border-ink-100 text-sm font-medium hover:border-navy-500">Cancelar</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-900">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AlmacenComponent implements OnInit {
  tab = signal<'productos' | 'movimientos' | 'ofertas'>('productos');
  filtro = signal('');
  stockAbierto = signal<string | null>(null);
  menuAbierto = signal<string | null>(null);
  mensajeImportacion = signal<string | null>(null);
  menuIngresoAbierto = signal(false);
  errorImportacion = signal(false);

  productoEditando = signal<Producto | null>(null);
  edicion: {
    nombre: string; codigo: string; codigoBarras: string; categoria: string; lugar: string; precio: number; descuentoMaximo: number | null;
    stockActual: number; stockMinimo: number; marcaMoto: string | null; modeloMoto: string | null; submodeloMoto: string | null;
    anioDesde: number | null; anioHasta: number | null;
  } = {
    nombre: '', codigo: '', codigoBarras: '', categoria: '', lugar: '', precio: 0, descuentoMaximo: null,
    stockActual: 0, stockMinimo: 0, marcaMoto: null, modeloMoto: null, submodeloMoto: null, anioDesde: null, anioHasta: null
  };

  constructor(public store: StoreService, private auth: AuthService) {}

  ngOnInit(): void {
    this.store.cargarOfertas();
  }

  // ---------- Ofertas ----------
  ofertaEditando = signal<Oferta | null>(null);
  buscarProductoOferta = '';
  formOferta: { nombre: string; descripcion: string; precioOferta: number | null } = { nombre: '', descripcion: '', precioOferta: null };
  private _formOfertaItems = signal<ItemOferta[]>([]);
  formOfertaItems = this._formOfertaItems.asReadonly();

  verOfertas(): void {
    this.tab.set('ofertas');
  }

  sugerenciasOferta = computed(() => {
    const q = this.buscarProductoOferta.trim().toLowerCase();
    if (q.length < 2) return [];
    const yaAgregados = new Set(this._formOfertaItems().map((i) => i.productoId));
    return this.store.productos()
      .filter((p) => !yaAgregados.has(p.id) && (p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)))
      .slice(0, 8);
  });

  agregarProductoAOferta(p: Producto): void {
    this._formOfertaItems.update((arr) => [...arr, { productoId: p.id, cantidad: 1 }]);
    this.buscarProductoOferta = '';
  }

  cambiarCantidadOferta(productoId: string, cantidad: number): void {
    this._formOfertaItems.update((arr) => arr.map((i) => (i.productoId === productoId ? { ...i, cantidad: Math.max(1, cantidad) } : i)));
  }

  quitarProductoDeOferta(productoId: string): void {
    this._formOfertaItems.update((arr) => arr.filter((i) => i.productoId !== productoId));
  }

  editarOferta(o: Oferta): void {
    this.ofertaEditando.set(o);
    this.formOferta = { nombre: o.nombre, descripcion: o.descripcion ?? '', precioOferta: o.precioOferta };
    this._formOfertaItems.set(o.items.map((i) => ({ ...i })));
    this.tab.set('ofertas');
  }

  cancelarEdicionOferta(): void {
    this.ofertaEditando.set(null);
    this.formOferta = { nombre: '', descripcion: '', precioOferta: null };
    this._formOfertaItems.set([]);
  }

  async guardarOferta(): Promise<void> {
    if (!this.formOferta.nombre.trim() || !this._formOfertaItems().length) return;
    const datos = {
      nombre: this.formOferta.nombre.trim(),
      descripcion: this.formOferta.descripcion.trim() || undefined,
      precioOferta: this.formOferta.precioOferta ?? 0,
      items: this._formOfertaItems()
    };
    const editando = this.ofertaEditando();
    if (editando) {
      await this.store.actualizarOferta(editando.id, datos);
    } else {
      await this.store.crearOferta(datos);
    }
    this.cancelarEdicionOferta();
  }

  descripcionItemsOferta(o: Oferta): string {
    return o.items.map((i) => `${this.store.producto(i.productoId)?.nombre ?? '—'} x${i.cantidad}`).join(', ');
  }

  /** mecánico: solo nombre · Recepción: código+precio, sin stock · Almacén/Admin: catálogo completo. */
  nivel = computed<NivelProducto>(() => nivelVistaProducto(this.auth.rol()!));

  filtroMarca = signal<string | null>(null);
  filtroModelo = signal<string | null>(null);
  filtroSubmodelo = signal<string | null>(null);
  filtroAnio = signal<number | null>(null);
  marcas = MARCAS_MOTO;
  aniosDisponibles = Array.from({ length: new Date().getFullYear() - 2005 + 2 }, (_, i) => new Date().getFullYear() + 1 - i);

  modelosFiltroDisponibles(): string[] {
    const marca = this.filtroMarca();
    return marca ? MODELOS_POR_MARCA[marca as MarcaMoto] ?? [] : [];
  }

  submodelosFiltroDisponibles(): string[] {
    const marca = this.filtroMarca();
    const modelo = this.filtroModelo();
    if (!marca || !modelo) return [];
    return SUBMODELOS_POR_MODELO[`${marca}-${modelo}`] ?? [];
  }

  onFiltroMarcaChange(valor: string | null): void {
    this.filtroMarca.set(valor);
    this.filtroModelo.set(null);
    this.filtroSubmodelo.set(null);
  }

  onFiltroModeloChange(valor: string | null): void {
    this.filtroModelo.set(valor);
    this.filtroSubmodelo.set(null);
  }

  productosFiltrados = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    const marca = this.filtroMarca();
    const modelo = this.filtroModelo();
    const submodelo = this.filtroSubmodelo();
    const anio = this.filtroAnio();
    let lista = this.store.productos();
    if (q) lista = lista.filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q));
    if (marca) lista = lista.filter((p) => p.marcaMoto === marca);
    if (modelo) lista = lista.filter((p) => p.modeloMoto === modelo);
    if (submodelo) lista = lista.filter((p) => p.submodeloMoto === submodelo);
    if (anio) lista = lista.filter((p) => (!p.anioDesde || p.anioDesde <= anio) && (!p.anioHasta || p.anioHasta >= anio));
    return lista;
  });

  movimientosOrdenados = computed(() => [...this.store.movimientos()].reverse());

  puedeEditar = computed(() => {
    const rol = this.auth.rol();
    return !!rol && permisoDe(rol, 'almacen') === 'todo';
  });

  parteEntera(precio: number): string { return Math.floor(precio).toString(); }
  parteDecimal(precio: number): string { return (precio % 1).toFixed(2).slice(2); }

  toggleStock(productoId: string): void {
    this.stockAbierto.set(this.stockAbierto() === productoId ? null : productoId);
  }

  private uid(): string { return this.auth.usuario()?.id ?? ''; }

  async eliminar(productoId: string): Promise<void> {
    this.menuAbierto.set(null);
    if (confirm('¿Eliminar este producto del catálogo?')) {
      await this.store.eliminarProducto(productoId);
    }
  }

  abrirEdicion(p: Producto): void {
    this.menuAbierto.set(null);
    this.edicion = {
      nombre: p.nombre,
      codigo: p.codigo,
      codigoBarras: p.codigoBarras ?? '',
      categoria: p.categoria,
      lugar: p.lugar ?? '',
      precio: p.precio,
      descuentoMaximo: p.descuentoMaximo ?? null,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      marcaMoto: p.marcaMoto ?? null,
      modeloMoto: p.modeloMoto ?? null,
      submodeloMoto: p.submodeloMoto ?? null,
      anioDesde: p.anioDesde ?? null,
      anioHasta: p.anioHasta ?? null
    };
    this.productoEditando.set(p);
  }

  modelosEdicionDisponibles(): string[] {
    return this.edicion.marcaMoto ? MODELOS_POR_MARCA[this.edicion.marcaMoto as MarcaMoto] ?? [] : [];
  }

  submodelosEdicionDisponibles(): string[] {
    if (!this.edicion.marcaMoto || !this.edicion.modeloMoto) return [];
    return SUBMODELOS_POR_MODELO[`${this.edicion.marcaMoto}-${this.edicion.modeloMoto}`] ?? [];
  }

  onMarcaEdicionChange(): void {
    this.edicion.modeloMoto = null;
    this.edicion.submodeloMoto = null;
  }

  onModeloEdicionChange(): void {
    this.edicion.submodeloMoto = null;
  }

  cerrarEdicion(): void {
    this.productoEditando.set(null);
  }

  async guardarEdicion(): Promise<void> {
    const p = this.productoEditando();
    if (!p || !this.edicion.nombre || !this.edicion.codigo) return;
    await this.store.actualizarProducto(p.id, { ...this.edicion });
    this.productoEditando.set(null);
  }

  async ajustar(productoId: string, delta: number): Promise<void> {
    await this.store.ajustarStock(productoId, delta, this.uid());
  }

  exportar(): void {
    exportarProductosExcel(this.store.productos());
  }

  async importar(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    try {
      const filas = await leerProductosDesdeArchivo(archivo);
      if (!filas.length) {
        this.errorImportacion.set(true);
        this.mensajeImportacion.set('El archivo no tiene filas válidas. Verifica que incluya columnas Código y Nombre.');
        return;
      }
      const { creados, actualizados } = await this.store.importarProductos(filas);
      this.errorImportacion.set(false);
      this.mensajeImportacion.set(`Importación completa: ${creados} producto(s) nuevo(s), ${actualizados} actualizado(s).`);
    } catch {
      this.errorImportacion.set(true);
      this.mensajeImportacion.set('No se pudo leer el archivo. Asegúrate de subir un .xlsx, .xls o .csv válido.');
    } finally {
      input.value = '';
    }
  }

  descargarPlantilla(): void {
    descargarPlantillaIngresoStock();
    this.menuIngresoAbierto.set(false);
  }

  async ingresarStock(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    try {
      const items = await leerIngresoStockDesdeArchivo(archivo);
      if (!items.length) {
        this.errorImportacion.set(true);
        this.mensajeImportacion.set('El archivo no tiene filas válidas. Verifica que incluya columnas Código y Cantidad a agregar.');
        return;
      }
      const { encontrados, noEncontrados } = await this.store.ingresarStockPorExcel(items);
      this.errorImportacion.set(noEncontrados.length > 0 && encontrados === 0);
      const detalleNoEncontrados = noEncontrados.length ? ` No se encontraron estos códigos: ${noEncontrados.join(', ')}.` : '';
      this.mensajeImportacion.set(`Ingreso de stock: ${encontrados} producto(s) actualizado(s).${detalleNoEncontrados}`);
    } catch {
      this.errorImportacion.set(true);
      this.mensajeImportacion.set('No se pudo leer el archivo. Asegúrate de subir un .xlsx, .xls o .csv válido.');
    } finally {
      input.value = '';
    }
  }
}
