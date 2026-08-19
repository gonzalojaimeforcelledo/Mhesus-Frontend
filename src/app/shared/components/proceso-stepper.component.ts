import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EstadoPaso = 'completado' | 'actual' | 'pendiente' | 'bloqueado';

export interface PasoProceso {
  id: string;
  etiqueta: string;
  estado: EstadoPaso;
  contador?: number;
}

@Component({
  selector: 'app-proceso-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto -mx-1 px-1">
      <div class="flex items-start min-w-max">
        @for (p of pasos; track p.id; let i = $index) {
          <div class="flex items-center" [class.flex-1]="i < pasos.length - 1">
            <button
              type="button" (click)="seleccionar(p)" [disabled]="p.estado === 'bloqueado'"
              class="flex flex-col items-center gap-2 shrink-0 group"
            >
              <span
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center text-sm font-display font-700 border-2 transition-colors"
                [class]="claseCirculo(p)"
              >
                @if (p.estado === 'completado') {
                  <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                } @else {
                  {{ i + 1 }}
                }
                @if (p.contador) {
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-semibold grid place-items-center">{{ p.contador }}</span>
                }
              </span>
              <span class="text-[11px] sm:text-xs font-medium text-center w-20 sm:w-[104px] leading-tight" [class]="claseEtiqueta(p)">{{ p.etiqueta }}</span>
            </button>
            @if (i < pasos.length - 1) {
              <div class="flex-1 w-8 sm:w-auto h-0.5 mx-1 -mt-6 rounded-full" [class]="claseLinea(p)"></div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ProcesoStepperComponent {
  @Input({ required: true }) pasos: PasoProceso[] = [];
  @Output() seleccion = new EventEmitter<string>();

  seleccionar(p: PasoProceso): void {
    if (p.estado === 'bloqueado') return;
    this.seleccion.emit(p.id);
  }

  claseCirculo(p: PasoProceso): string {
    if (p.estado === 'completado') return 'bg-emerald-500 border-emerald-500 text-white';
    if (p.estado === 'actual') return 'bg-navy-700 border-navy-700 text-white';
    if (p.estado === 'bloqueado') return 'bg-surface border-ink-100 text-ink-300 cursor-not-allowed';
    return 'bg-surface border-ink-300 text-ink-500 group-hover:border-navy-500 group-hover:text-brand-700';
  }

  claseEtiqueta(p: PasoProceso): string {
    if (p.estado === 'bloqueado') return 'text-ink-300';
    if (p.estado === 'actual') return 'text-brand-900';
    return 'text-ink-500';
  }

  claseLinea(p: PasoProceso): string {
    return p.estado === 'completado' ? 'bg-emerald-500' : 'bg-ink-100';
  }
}
