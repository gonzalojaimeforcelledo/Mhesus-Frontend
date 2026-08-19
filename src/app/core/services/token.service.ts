import { Injectable, signal } from '@angular/core';

const CLAVE = 'mhesus:jwt';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private _token = signal<string | null>(localStorage.getItem(CLAVE));

  token(): string | null {
    return this._token();
  }

  guardar(token: string): void {
    this._token.set(token);
    localStorage.setItem(CLAVE, token);
  }

  limpiar(): void {
    this._token.set(null);
    localStorage.removeItem(CLAVE);
  }
}
