export function generarId(prefijo = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefijo}_${Date.now().toString(36)}${rand}`;
}
