// Respaldo: si por alguna razón el entorno no resuelve los tipos que trae el
// propio paquete "xlsx" (node_modules/xlsx/types/index.d.ts), esta declaración
// evita que el build falle con TS2307 ("Cannot find module 'xlsx'").
// TypeScript usa los tipos reales del paquete cuando puede resolverlos; esta
// declaración solo actúa como red de seguridad.
declare module 'xlsx';
