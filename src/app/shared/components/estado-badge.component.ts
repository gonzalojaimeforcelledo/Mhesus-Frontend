import { Component, Input } from '@angular/core';
import { EstadoOT } from '../../core/models/models';
import { colorEstado } from '../../core/services/ot-state-machine';

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ot-badge" [class]="clases()">
      <span class="w-1.5 h-1.5 rounded-full" [class]="puntoClase()"></span>
      {{ estado }}
    </span>
  `
})
export class EstadoBadgeComponent {
  @Input({ required: true }) estado!: EstadoOT;

  private color(): 'navy' | 'amber' | 'emerald' {
    return colorEstado(this.estado);
  }

  clases(): string {
    switch (this.color()) {
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'amber': return 'bg-amber-400/10 text-amber-500 border-amber-400/40';
      default: return 'bg-navy-700/10 text-brand-700 border-navy-700/30';
    }
  }

  puntoClase(): string {
    switch (this.color()) {
      case 'emerald': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-400';
      default: return 'bg-navy-700';
    }
  }
}
