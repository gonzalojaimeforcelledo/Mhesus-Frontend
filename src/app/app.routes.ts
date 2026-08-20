import { Routes } from '@angular/router';
import { authGuard, moduloGuard, permisoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'terminos',
    loadComponent: () => import('./features/terminos/terminos.component').then((m) => m.TerminosComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'clientes',
        canActivate: [moduloGuard('clientes')],
        loadComponent: () => import('./features/clientes/clientes-list.component').then((m) => m.ClientesListComponent)
      },
      {
        path: 'ot',
        canActivate: [moduloGuard('ot')],
        loadComponent: () => import('./features/ot/ot-list.component').then((m) => m.OtListComponent)
      },
      {
        path: 'ot/nueva',
        canActivate: [permisoGuard('ot', 'todo')],
        loadComponent: () => import('./features/ot/ot-nueva.component').then((m) => m.OtNuevaComponent)
      },
      {
        path: 'ot/:id',
        canActivate: [moduloGuard('ot')],
        loadComponent: () => import('./features/ot/ot-detalle.component').then((m) => m.OtDetalleComponent)
      },
      {
        path: 'motos/:id/historial',
        canActivate: [moduloGuard('ot')],
        loadComponent: () => import('./features/ot/moto-historial.component').then((m) => m.MotoHistorialComponent)
      },
      {
        path: 'almacen',
        canActivate: [moduloGuard('almacen')],
        loadComponent: () => import('./features/almacen/almacen.component').then((m) => m.AlmacenComponent)
      },
      {
        path: 'despacho',
        canActivate: [permisoGuard('almacen', 'todo')],
        loadComponent: () => import('./features/almacen/despacho.component').then((m) => m.DespachoComponent)
      },
      {
        path: 'cotizaciones',
        canActivate: [moduloGuard('cotizacion')],
        loadComponent: () => import('./features/cotizaciones/cotizaciones-list.component').then((m) => m.CotizacionesListComponent)
      },
      {
        path: 'reportes',
        canActivate: [moduloGuard('reportes')],
        loadComponent: () => import('./features/reportes/reportes.component').then((m) => m.ReportesComponent)
      },
      {
        path: 'calendario',
        canActivate: [moduloGuard('calendario')],
        loadComponent: () => import('./features/calendario/calendario.component').then((m) => m.CalendarioComponent)
      },
      {
        path: 'administracion',
        canActivate: [moduloGuard('usuarios')],
        loadComponent: () => import('./features/administracion/administracion.component').then((m) => m.AdministracionComponent)
      }
    ]
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) }
];
