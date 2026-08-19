import { Rol } from '../models/models';

export type Modulo = 'clientes' | 'ot' | 'almacen' | 'cotizacion' | 'reportes' | 'usuarios';
export type Permiso = 'todo' | 'lectura' | 'su_ot' | 'genera_pedido' | 'solicita_repuestos' | 'control_calidad' | 'ninguno';

// Matriz de permisos — sección 8 "Seguridad y control de acceso (RBAC)" del Design Doc
const MATRIZ: Record<Modulo, Record<Rol, Permiso>> = {
  clientes: {
    recepcion: 'todo', mecanico: 'ninguno', almacen: 'ninguno', jefe_taller: 'lectura', administracion: 'todo'
  },
  ot: {
    recepcion: 'todo', mecanico: 'su_ot', almacen: 'lectura', jefe_taller: 'control_calidad', administracion: 'todo'
  },
  almacen: {
    recepcion: 'genera_pedido', mecanico: 'solicita_repuestos', almacen: 'todo', jefe_taller: 'ninguno', administracion: 'todo'
  },
  cotizacion: {
    recepcion: 'todo', mecanico: 'ninguno', almacen: 'ninguno', jefe_taller: 'ninguno', administracion: 'lectura'
  },
  reportes: {
    recepcion: 'ninguno', mecanico: 'ninguno', almacen: 'ninguno', jefe_taller: 'ninguno', administracion: 'todo'
  },
  usuarios: {
    recepcion: 'ninguno', mecanico: 'ninguno', almacen: 'ninguno', jefe_taller: 'ninguno', administracion: 'todo'
  }
};

export function permisoDe(rol: Rol, modulo: Modulo): Permiso {
  return MATRIZ[modulo][rol];
}

export function puedeAcceder(rol: Rol, modulo: Modulo): boolean {
  return permisoDe(rol, modulo) !== 'ninguno';
}

export const NOMBRE_ROL: Record<Rol, string> = {
  recepcion: 'Recepción',
  mecanico: 'Mecánico',
  almacen: 'Almacén',
  jefe_taller: 'Jefe de Taller',
  administracion: 'Administración'
};

// Nivel de detalle de producto visible por rol (independiente del permiso de módulo Almacén)
export type NivelProducto = 'completo' | 'con_precio' | 'solo_nombre';
export function nivelVistaProducto(rol: Rol): NivelProducto {
  if (rol === 'almacen' || rol === 'administracion') return 'completo';
  if (rol === 'recepcion') return 'con_precio';
  return 'solo_nombre'; // mecánico y jefe_taller
}
