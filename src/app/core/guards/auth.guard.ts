import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Modulo, Permiso, permisoDe, puedeAcceder } from '../services/permissions';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.autenticado()) return true;
  return router.parseUrl('/login');
};

export function moduloGuard(modulo: Modulo): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.autenticado()) return router.parseUrl('/login');
    const rol = auth.rol();
    if (rol && puedeAcceder(rol, modulo)) return true;
    return router.parseUrl('/inicio');
  };
}

/** Igual que moduloGuard, pero exige un nivel de permiso exacto (ej. 'todo') en vez de solo "no ninguno". */
export function permisoGuard(modulo: Modulo, requerido: Permiso): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.autenticado()) return router.parseUrl('/login');
    const rol = auth.rol();
    if (rol && permisoDe(rol, modulo) === requerido) return true;
    return router.parseUrl('/ot');
  };
}
