import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { RegistroAsistencia } from '../../core/models/models';

@Component({
  selector: 'app-asistencia-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display font-600 text-ink-900">Mi asistencia de hoy</h2>
        <svg viewBox="0 0 24 24" class="w-4 h-4 text-ink-300" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-lg border border-ink-100 p-3 text-center">
          <p class="text-xs text-ink-500 mb-1">Llegada</p>
          @if (registro()?.horaLlegada; as h) {
            <p class="font-display font-700 text-emerald-600">{{ h.slice(0,5) }}</p>
          } @else {
            <button (click)="marcar('llegada')" [disabled]="cargando()" class="w-full px-2 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-medium">Marcar</button>
          }
        </div>
        <div class="rounded-lg border border-ink-100 p-3 text-center">
          <p class="text-xs text-ink-500 mb-1">Inicio almuerzo</p>
          @if (registro()?.horaInicioAlmuerzo; as h) {
            <p class="font-display font-700 text-emerald-600">{{ h.slice(0,5) }}</p>
          } @else {
            <button (click)="marcar('almuerzoInicio')" [disabled]="cargando() || !registro()?.horaLlegada" class="w-full px-2 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-medium">Marcar</button>
          }
        </div>
        <div class="rounded-lg border border-ink-100 p-3 text-center">
          <p class="text-xs text-ink-500 mb-1">Fin almuerzo</p>
          @if (registro()?.horaFinAlmuerzo; as h) {
            <p class="font-display font-700 text-emerald-600">{{ h.slice(0,5) }}</p>
          } @else {
            <button (click)="marcar('almuerzoFin')" [disabled]="cargando() || !registro()?.horaInicioAlmuerzo" class="w-full px-2 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-medium">Marcar</button>
          }
        </div>
        <div class="rounded-lg border border-ink-100 p-3 text-center">
          <p class="text-xs text-ink-500 mb-1">Salida</p>
          @if (registro()?.horaSalida; as h) {
            <p class="font-display font-700 text-emerald-600">{{ h.slice(0,5) }}</p>
          } @else {
            <button (click)="marcar('salida')" [disabled]="cargando() || !registro()?.horaLlegada" class="w-full px-2 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-medium">Marcar</button>
          }
        </div>
      </div>

      @if (error()) {
        <p class="text-xs text-crimson-500 mt-3">{{ error() }}</p>
      }
      <p class="text-[11px] text-ink-400 mt-3">La llegada y la salida solo se pueden marcar conectado al WiFi de MHESUS o MHESUS 5G.</p>
    </div>
  `
})
export class AsistenciaWidgetComponent implements OnInit {
  registro = signal<RegistroAsistencia | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private store: StoreService) {}

  async ngOnInit(): Promise<void> {
    this.registro.set(await this.store.miAsistenciaDeHoy());
  }

  async marcar(tipo: 'llegada' | 'almuerzoInicio' | 'almuerzoFin' | 'salida'): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    const res = tipo === 'llegada' ? await this.store.marcarLlegada()
      : tipo === 'almuerzoInicio' ? await this.store.marcarInicioAlmuerzo()
      : tipo === 'almuerzoFin' ? await this.store.marcarFinAlmuerzo()
      : await this.store.marcarSalida();
    this.cargando.set(false);
    if (res.ok && res.registro) {
      this.registro.set(res.registro);
    } else {
      this.error.set(res.error ?? 'No se pudo registrar. Intenta de nuevo.');
    }
  }
}
