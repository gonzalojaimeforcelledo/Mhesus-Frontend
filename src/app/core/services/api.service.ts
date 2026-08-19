import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private params(query?: Record<string, string | undefined>): HttpParams {
    let p = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') p = p.set(k, v);
      }
    }
    return p;
  }

  get<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${this.base}${path}`, { params: this.params(query) }));
  }

  post<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.base}${path}`, body));
  }

  patch<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.patch<T>(`${this.base}${path}`, body));
  }

  put<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${this.base}${path}`, body));
  }

  delete<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${this.base}${path}`));
  }
}

/** Extrae un mensaje legible del error HTTP devuelto por el backend ({ mensaje: string }), con un mensaje genérico de respaldo. */
export function mensajeDeError(err: unknown, porDefecto = 'No se pudo completar la operación.'): string {
  const anyErr = err as { error?: { mensaje?: string }; message?: string };
  return anyErr?.error?.mensaje ?? anyErr?.message ?? porDefecto;
}
