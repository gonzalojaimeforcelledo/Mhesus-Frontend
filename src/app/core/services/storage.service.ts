import { Injectable } from '@angular/core';

/**
 * Utilidad simple de lectura/escritura en localStorage con prefijo.
 * Ya no es la capa de datos de la app (StoreService ahora habla con el
 * backend por HTTP) — hoy solo la usa AuthService para persistir la sesión
 * local (expiración por inactividad y snapshot del usuario autenticado),
 * ya que el JWT en sí vive en TokenService.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'mhesus:';

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(this.prefix + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  has(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => localStorage.removeItem(k));
  }
}
