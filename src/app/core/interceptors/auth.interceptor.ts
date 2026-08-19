import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.token();

  const solicitud = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(solicitud).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        tokenService.limpiar();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
