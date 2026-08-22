import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from '../models/models';
import { StorageService } from './storage.service';
import { ApiService, mensajeDeError } from './api.service';
import { TokenService } from './token.service';

interface SesionActiva {
  usuarioId: string;
  expiraEn: number; // epoch ms — se renueva con cada actividad del usuario
}

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

interface LoginErrorResponse {
  mensaje?: string;
  bloqueadoHasta?: number | null;
}

/**
 * Sesión respaldada por un JWT real emitido por el backend (POST /auth/login).
 * El token viaja en cada petición vía el interceptor (core/interceptors/auth.interceptor.ts)
 * y se guarda en TokenService. Además de eso, se mantiene una expiración local por
 * inactividad: si no hay actividad del usuario durante SESION_INACTIVIDAD_MS, la
 * sesión se cierra por seguridad aunque el JWT del backend siga siendo válido
 * (ver ShellComponent, que detecta la inactividad real y llama a renovarSesion()).
 *
 * El control de intentos fallidos (3 intentos, bloqueo de 5 minutos) lo maneja
 * el BACKEND, no el navegador — se guarda en la base de datos (tabla
 * intentos_login), así que sigue vigente aunque el backend se reinicie y no
 * se puede saltar limpiando el localStorage del navegador.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  static readonly SESION_INACTIVIDAD_MS = 10 * 60 * 1000;

  private usuarioActual = signal<Usuario | null>(null);
  readonly usuario = computed(() => this.usuarioActual());
  readonly autenticado = computed(() => this.usuarioActual() !== null);
  readonly rol = computed(() => this.usuarioActual()?.rol ?? null);

  constructor(private storage: StorageService, private api: ApiService, private tokenService: TokenService) {
    const sesion = this.storage.get<SesionActiva>('sesion');
    const token = this.tokenService.token();
    if (!sesion || !token) return;
    if (sesion.expiraEn <= Date.now()) {
      this.cerrarSesionLocal();
      return;
    }
    const usuarioGuardado = this.storage.get<Usuario>('usuarioActual');
    if (usuarioGuardado && usuarioGuardado.id === sesion.usuarioId) {
      this.usuarioActual.set(usuarioGuardado);
      this.renovarSesion();
    }
  }

  /** Milisegundos epoch hasta los que sigue bloqueado ese usuario, o null si puede intentar — se consulta al backend. */
  async estadoBloqueo(usuario: string): Promise<number | null> {
    const clave = usuario.trim();
    if (!clave) return null;
    try {
      const res = await this.api.get<{ bloqueadoHasta: number | null }>('/auth/estado-bloqueo', { usuario: clave });
      return res.bloqueadoHasta ?? null;
    } catch {
      return null;
    }
  }

  async login(usuario: string, password: string): Promise<{ ok: boolean; error?: string; bloqueadoHasta?: number }> {
    try {
      const res = await this.api.post<LoginResponse>('/auth/login', { usuario, password });
      this.tokenService.guardar(res.token);
      this.usuarioActual.set(res.usuario);
      this.storage.set('usuarioActual', res.usuario);
      const sesion: SesionActiva = { usuarioId: res.usuario.id, expiraEn: Date.now() + AuthService.SESION_INACTIVIDAD_MS };
      this.storage.set('sesion', sesion);
      return { ok: true };
    } catch (err) {
      const anyErr = err as { error?: LoginErrorResponse };
      const bloqueadoHasta = anyErr?.error?.bloqueadoHasta ?? undefined;
      const mensaje = mensajeDeError(err, 'Usuario o contraseña incorrectos.');
      return { ok: false, error: mensaje, bloqueadoHasta };
    }
  }

  /** "No me acuerdo la contraseña" — avisa a todos los administradores por notificación interna. */
  async solicitarRestablecimiento(usuario: string): Promise<void> {
    await this.api.post('/auth/solicitar-restablecimiento', { usuario: usuario.trim() });
  }

  /** Administrador: pide el código de 6 dígitos por correo. Siempre "funciona" del lado del usuario, exista o no la cuenta/correo (no se filtra esa info). */
  async solicitarCodigoRecuperacion(usuario: string, email: string): Promise<void> {
    await this.api.post('/auth/recuperar-admin/solicitar', { usuario: usuario.trim(), email: email.trim() });
  }

  /** Administrador: confirma el código y fija la nueva contraseña. */
  async confirmarCodigoRecuperacion(usuario: string, codigo: string, nuevaPassword: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.post('/auth/recuperar-admin/confirmar', { usuario: usuario.trim(), codigo: codigo.trim(), nuevaPassword });
      return { ok: true };
    } catch (err) {
      const anyErr = err as { error?: { mensaje?: string } };
      return { ok: false, error: anyErr?.error?.mensaje ?? 'No se pudo confirmar el código.' };
    }
  }

  private cerrarSesionLocal(): void {
    this.usuarioActual.set(null);
    this.storage.set('sesion', null);
    this.storage.set('usuarioActual', null);
    this.tokenService.limpiar();
  }

  logout(): void {
    this.cerrarSesionLocal();
  }

  /** Extiende la sesión SESION_INACTIVIDAD_MS más — se llama ante cualquier actividad detectada del usuario. */
  renovarSesion(): void {
    if (!this.usuarioActual()) return;
    const sesion = this.storage.get<SesionActiva>('sesion');
    if (!sesion) return;
    this.storage.set('sesion', { ...sesion, expiraEn: Date.now() + AuthService.SESION_INACTIVIDAD_MS });
  }

  /** true si la sesión local (por inactividad) ya venció o no existe. */
  sesionExpirada(): boolean {
    const sesion = this.storage.get<SesionActiva>('sesion');
    return !sesion || sesion.expiraEn <= Date.now();
  }
}
