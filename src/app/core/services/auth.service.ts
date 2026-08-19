import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from '../models/models';
import { StorageService } from './storage.service';
import { ApiService, mensajeDeError } from './api.service';
import { TokenService } from './token.service';

interface SesionActiva {
  usuarioId: string;
  expiraEn: number; // epoch ms — se renueva con cada actividad del usuario
}

interface EstadoIntentos {
  intentos: number;
  bloqueadoHasta: number | null; // epoch ms
}

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/**
 * Sesión respaldada por un JWT real emitido por el backend (POST /auth/login).
 * El token viaja en cada petición vía el interceptor (core/interceptors/auth.interceptor.ts)
 * y se guarda en TokenService. Además de eso, se mantiene una expiración local por
 * inactividad: si no hay actividad del usuario durante SESION_INACTIVIDAD_MS, la
 * sesión se cierra por seguridad aunque el JWT del backend siga siendo válido
 * (ver ShellComponent, que detecta la inactividad real y llama a renovarSesion()).
 *
 * También lleva un control de intentos fallidos por usuario en el propio navegador:
 * al tercer intento incorrecto seguido, ese usuario queda bloqueado 5 minutos antes
 * de poder volver a intentar (persistido, sobrevive a recargar la página). Esto es
 * una capa de UX adicional — la validación real de credenciales siempre la hace el backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  static readonly SESION_INACTIVIDAD_MS = 5 * 60 * 1000;
  static readonly MAX_INTENTOS = 3;
  static readonly BLOQUEO_MS = 5 * 60 * 1000;
  private static readonly CLAVE_INTENTOS = 'mhesus:intentosLogin';

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

  private leerIntentos(): Record<string, EstadoIntentos> {
    try {
      return JSON.parse(localStorage.getItem(AuthService.CLAVE_INTENTOS) ?? '{}');
    } catch {
      return {};
    }
  }

  private guardarIntentos(mapa: Record<string, EstadoIntentos>): void {
    localStorage.setItem(AuthService.CLAVE_INTENTOS, JSON.stringify(mapa));
  }

  /** Milisegundos epoch hasta los que sigue bloqueado ese usuario, o null si puede intentar. Ya limpia bloqueos vencidos. */
  estadoBloqueo(usuario: string): number | null {
    const clave = usuario.trim().toLowerCase();
    if (!clave) return null;
    const mapa = this.leerIntentos();
    const estado = mapa[clave];
    if (!estado?.bloqueadoHasta) return null;
    if (estado.bloqueadoHasta <= Date.now()) {
      delete mapa[clave];
      this.guardarIntentos(mapa);
      return null;
    }
    return estado.bloqueadoHasta;
  }

  async login(usuario: string, password: string): Promise<{ ok: boolean; error?: string; bloqueadoHasta?: number }> {
    const clave = usuario.trim().toLowerCase();
    const bloqueadoHasta = this.estadoBloqueo(usuario);
    if (bloqueadoHasta) {
      const minutos = Math.ceil((bloqueadoHasta - Date.now()) / 60000);
      return {
        ok: false,
        bloqueadoHasta,
        error: `Demasiados intentos fallidos. Vuelve a intentar en ${minutos} minuto${minutos === 1 ? '' : 's'}.`
      };
    }

    const mapa = this.leerIntentos();

    try {
      const res = await this.api.post<LoginResponse>('/auth/login', { usuario, password });

      if (mapa[clave]) {
        delete mapa[clave];
        this.guardarIntentos(mapa);
      }

      this.tokenService.guardar(res.token);
      this.usuarioActual.set(res.usuario);
      this.storage.set('usuarioActual', res.usuario);
      const sesion: SesionActiva = { usuarioId: res.usuario.id, expiraEn: Date.now() + AuthService.SESION_INACTIVIDAD_MS };
      this.storage.set('sesion', sesion);
      return { ok: true };
    } catch (err) {
      const intentosPrevios = mapa[clave]?.intentos ?? 0;
      const intentos = intentosPrevios + 1;
      if (intentos >= AuthService.MAX_INTENTOS) {
        const hasta = Date.now() + AuthService.BLOQUEO_MS;
        mapa[clave] = { intentos: 0, bloqueadoHasta: hasta };
        this.guardarIntentos(mapa);
        return { ok: false, bloqueadoHasta: hasta, error: 'Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.' };
      }
      mapa[clave] = { intentos, bloqueadoHasta: null };
      this.guardarIntentos(mapa);
      const restantes = AuthService.MAX_INTENTOS - intentos;
      const mensajeBase = mensajeDeError(err, 'Usuario o contraseña incorrectos.');
      return { ok: false, error: `${mensajeBase} Te queda${restantes === 1 ? '' : 'n'} ${restantes} intento${restantes === 1 ? '' : 's'}.` };
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
