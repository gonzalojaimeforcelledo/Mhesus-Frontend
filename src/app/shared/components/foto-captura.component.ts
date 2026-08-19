import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-foto-captura',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      @if (label) { <label class="text-sm font-medium text-ink-700">{{ label }}</label> }

      @if (!valor) {
        <button
          type="button" (click)="input.click()"
          class="mt-1 w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-100 py-5 text-ink-500 hover:border-navy-500 hover:text-navy-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h1.2a2 2 0 0 0 1.66-.9l.6-.9A2 2 0 0 1 11.1 3h1.8a2 2 0 0 1 1.66.9l.6.9a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.2"/></svg>
          <span class="text-xs font-medium">{{ textoBoton }}</span>
        </button>
        <input #input type="file" accept="image/*" capture="environment" class="hidden" (change)="onArchivo($event)" />
      } @else {
        <div class="mt-1 relative w-fit">
          <img [src]="valor" alt="Evidencia fotográfica" class="h-28 rounded-lg border border-ink-100 object-cover" />
          <button
            type="button" (click)="quitar()"
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-crimson-500 text-white grid place-items-center shadow"
            title="Quitar foto"
          >
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      }

      @if (procesando()) { <p class="text-xs text-ink-400 mt-1">Procesando imagen...</p> }
    </div>
  `
})
export class FotoCapturaComponent {
  @Input() label = '';
  @Input() textoBoton = 'Tomar o subir foto';
  @Input() valor: string | null = null;
  @Output() valorChange = new EventEmitter<string | null>();

  procesando = () => this._procesando;
  private _procesando = false;

  onArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    this._procesando = true;
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const anchoMax = 640;
        const escala = Math.min(1, anchoMax / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        this._procesando = false;
        this.valor = dataUrl;
        this.valorChange.emit(dataUrl);
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  }

  quitar(): void {
    this.valor = null;
    this.valorChange.emit(null);
  }
}
