import { Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE_STORAGE = 'mhesus:tema';

/**
 * Modo oscuro de toda la app: la mayoría de los colores neutros (texto, fondos,
 * bordes) están definidos como variables CSS en styles.css y se leen a través de
 * la paleta "ink" de Tailwind, así que alternar la clase .dark en <html> adapta
 * casi toda la interfaz sin variantes dark: repartidas por cada componente.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private tema = signal<Tema>(this.leerPreferenciaInicial());
  readonly temaActual = this.tema.asReadonly();
  readonly esOscuro = () => this.tema() === 'oscuro';

  constructor() {
    this.aplicar(this.tema());
  }

  private leerPreferenciaInicial(): Tema {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    const prefiereOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefiereOscuro ? 'oscuro' : 'claro';
  }

  private aplicar(tema: Tema): void {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
  }

  alternar(): void {
    const nuevo: Tema = this.tema() === 'oscuro' ? 'claro' : 'oscuro';
    this.tema.set(nuevo);
    this.aplicar(nuevo);
    localStorage.setItem(CLAVE_STORAGE, nuevo);
  }
}
