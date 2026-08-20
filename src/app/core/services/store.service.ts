import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import {
  Cliente, Cotizacion, Diagnostico, EstadoOT, ItemCotizacion, Motocicleta,
  MovimientoInventario, Notificacion, NivelCombustible, OrdenTrabajo, PedidoAlmacen, PedidoDetalle, Producto,
  RegistroAuditoria, Rol, Usuario
} from '../models/models';

/**
 * StoreService — capa de datos de la app, respaldada por HTTP en vez de localStorage.
 * Cada colección vive en un signal (mismo patrón reactivo de siempre); la diferencia
 * es que ahora se llena con GET al backend (Java o .NET, mismo contrato) y las
 * mutaciones llaman al endpoint correspondiente y luego refrescan las colecciones
 * afectadas desde el servidor, en vez de escribir directo a localStorage.
 *
 * `cargarTodo()` la llama ShellComponent en su ngOnInit (una vez autenticado);
 * antes de eso los signals están vacíos, ya que la mayoría de estos endpoints
 * requieren el JWT de sesión.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  usuarios = signal<Usuario[]>([]);
  clientes = signal<Cliente[]>([]);
  motos = signal<Motocicleta[]>([]);
  ots = signal<OrdenTrabajo[]>([]);
  diagnosticos = signal<Diagnostico[]>([]);
  pedidos = signal<PedidoAlmacen[]>([]);
  pedidoDetalle = signal<PedidoDetalle[]>([]);
  productos = signal<Producto[]>([]);
  movimientos = signal<MovimientoInventario[]>([]);
  cotizaciones = signal<Cotizacion[]>([]);
  auditoria = signal<RegistroAuditoria[]>([]);
  notificaciones = signal<Notificacion[]>([]);

  productosStockBajo = computed(() => this.productos().filter((p) => p.stockActual <= p.stockMinimo));

  constructor(private api: ApiService) {}

  // ---------- Carga inicial / recarga de colecciones ----------
  async cargarTodo(): Promise<void> {
    await Promise.all([
      this.cargarUsuarios(), this.cargarClientes(), this.cargarMotos(), this.cargarOts(),
      this.cargarDiagnosticos(), this.cargarProductos(), this.cargarMovimientos(),
      this.cargarPedidos(), this.cargarPedidoDetalle(), this.cargarCotizaciones(),
      this.cargarAuditoria(), this.cargarNotificaciones()
    ]);
  }

  async cargarUsuarios(): Promise<void> { this.usuarios.set(await this.api.get<Usuario[]>('/usuarios')); }
  async cargarClientes(): Promise<void> { this.clientes.set(await this.api.get<Cliente[]>('/clientes')); }
  async cargarMotos(): Promise<void> { this.motos.set(await this.api.get<Motocicleta[]>('/motos')); }
  async cargarOts(): Promise<void> { this.ots.set(await this.api.get<OrdenTrabajo[]>('/ot')); }
  async cargarDiagnosticos(): Promise<void> { this.diagnosticos.set(await this.api.get<Diagnostico[]>('/diagnosticos')); }
  async cargarProductos(): Promise<void> { this.productos.set(await this.api.get<Producto[]>('/productos')); }
  async cargarMovimientos(): Promise<void> { this.movimientos.set(await this.api.get<MovimientoInventario[]>('/productos/movimientos')); }
  async cargarPedidos(): Promise<void> { this.pedidos.set(await this.api.get<PedidoAlmacen[]>('/pedidos')); }
  async cargarPedidoDetalle(): Promise<void> { this.pedidoDetalle.set(await this.api.get<PedidoDetalle[]>('/pedido-detalle')); }
  async cargarCotizaciones(): Promise<void> { this.cotizaciones.set(await this.api.get<Cotizacion[]>('/cotizaciones')); }
  async cargarAuditoria(): Promise<void> { this.auditoria.set(await this.api.get<RegistroAuditoria[]>('/auditoria')); }
  async cargarNotificaciones(): Promise<void> { this.notificaciones.set(await this.api.get<Notificacion[]>('/notificaciones/mias')); }

  /** Limpia todos los signals (se usa al cerrar sesión). */
  limpiarTodo(): void {
    this.usuarios.set([]); this.clientes.set([]); this.motos.set([]); this.ots.set([]);
    this.diagnosticos.set([]); this.pedidos.set([]); this.pedidoDetalle.set([]);
    this.productos.set([]); this.movimientos.set([]); this.cotizaciones.set([]);
    this.auditoria.set([]); this.notificaciones.set([]);
  }

  // ---------- Clientes / Motos ----------
  buscarClientePorDni(dni: string): Cliente | undefined {
    return this.clientes().find((c) => c.dni === dni);
  }

  /** Búsqueda exacta por placa (sin distinguir mayúsculas/espacios) — usada para reconocer una moto ya registrada. */
  buscarMotoPorPlaca(placa: string): Motocicleta | undefined {
    const q = placa.trim().toUpperCase();
    if (!q) return undefined;
    return this.motos().find((m) => m.placa.toUpperCase() === q);
  }

  /**
   * Igual que buscarMotoPorPlaca, pero le pregunta directo al backend en vez de
   * mirar la lista guardada en memoria — para el chequeo de "placa duplicada" al
   * crear una OT, donde necesitamos el dato más actual posible sin depender de
   * cuándo se cargó por última vez la lista completa de motos.
   */
  async buscarMotoPorPlacaEnServidor(placa: string): Promise<Motocicleta | undefined> {
    const q = placa.trim();
    if (!q) return undefined;
    try {
      return await this.api.get<Motocicleta>('/motos', { placa: q });
    } catch {
      return undefined; // 404: no existe esa placa
    }
  }

  /** Sugerencias en vivo mientras se escribe la placa (coincidencia parcial), para autocompletar antes de tener el número completo. */
  motosPorPlacaParcial(query: string, limite = 5): Motocicleta[] {
    const q = query.trim().toUpperCase();
    if (q.length < 2) return [];
    return this.motos().filter((m) => m.placa.toUpperCase().includes(q)).slice(0, limite);
  }

  motosDeCliente(clienteId: string): Motocicleta[] {
    return this.motos().filter((m) => m.clienteId === clienteId);
  }

  /** Historial de una moto: todas sus OT, más recientes primero — para el reporte "Historial por placa". */
  historialDeMoto(motoId: string): OrdenTrabajo[] {
    return this.ots()
      .filter((o) => o.motoId === motoId)
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }

  async crearCliente(datos: Omit<Cliente, 'id' | 'creadoEn'>): Promise<Cliente> {
    const nuevo = await this.api.post<Cliente>('/clientes', datos);
    await this.cargarClientes();
    return nuevo;
  }

  async agregarMoto(datos: Omit<Motocicleta, 'id'>): Promise<Motocicleta> {
    const nueva = await this.api.post<Motocicleta>(`/clientes/${datos.clienteId}/motocicletas`, datos);
    await this.cargarMotos();
    return nueva;
  }

  // ---------- OT ----------
  async crearOT(datos: {
    clienteId: string; motoId: string; asesorId: string; nivelCombustible: NivelCombustible;
    observacionCliente: string; servicioARealizar: string; kmActual?: number; fotoIngreso?: string | null;
  }): Promise<OrdenTrabajo> {
    const nueva = await this.api.post<OrdenTrabajo>('/ot', datos);
    await Promise.all([this.cargarOts(), this.cargarMotos(), this.cargarAuditoria()]);
    return nueva;
  }

  async asignarMecanico(otId: string, mecanicoId: string, _usuarioId: string): Promise<void> {
    await this.api.patch(`/ot/${otId}/asignar`, { mecanicoId });
    await Promise.all([this.cargarOts(), this.cargarAuditoria(), this.cargarNotificaciones()]);
  }

  /** Avanza al siguiente estado de la secuencia. Si `forzar` es true (solo Administración), permite saltar y queda auditado como excepción. */
  async cambiarEstadoOT(otId: string, nuevoEstado: EstadoOT, _usuarioId: string, forzar = false): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/ot/${otId}/estado`, { estado: nuevoEstado, forzar });
      await Promise.all([this.cargarOts(), this.cargarAuditoria()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  async avanzarEstadoOT(otId: string, _usuarioId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/ot/${otId}/avanzar`);
      await Promise.all([this.cargarOts(), this.cargarAuditoria()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  /** El mecánico marca el servicio como concluido: detiene el temporizador de trabajo y avanza la OT a Control de calidad. */
  async finalizarServicioYAvanzar(otId: string, _usuarioId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/ot/${otId}/finalizar-servicio`);
      await Promise.all([this.cargarOts(), this.cargarAuditoria()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  async cerrarOT(otId: string, usuarioId: string): Promise<{ ok: boolean; error?: string }> {
    return this.cambiarEstadoOT(otId, 'Cerrada', usuarioId);
  }

  async registrarDiagnostico(otId: string, diagnostico: string, sugerencias: string, mecanicoNombre: string, fotoDiagnostico?: string | null): Promise<Diagnostico> {
    const nuevo = await this.api.post<Diagnostico>(`/ot/${otId}/diagnostico`, { diagnostico, sugerencias, mecanicoNombre, fotoDiagnostico });
    await this.cargarDiagnosticos();
    return nuevo;
  }

  diagnosticoDeOT(otId: string): Diagnostico | undefined {
    return this.diagnosticos().find((d) => d.otId === otId);
  }

  // ---------- Almacén ----------
  async generarPedidoAlmacen(otId: string, items: { productoId: string; cantidad: number }[], _creadoPor: string): Promise<PedidoAlmacen> {
    const pedido = await this.api.post<PedidoAlmacen>(`/ot/${otId}/pedidos`, { items });
    await Promise.all([this.cargarPedidos(), this.cargarPedidoDetalle()]);
    return pedido;
  }

  pedidosDeOT(otId: string): PedidoAlmacen[] {
    return this.pedidos().filter((p) => p.otId === otId);
  }

  detalleDePedido(pedidoId: string): PedidoDetalle[] {
    return this.pedidoDetalle().filter((d) => d.pedidoId === pedidoId);
  }

  /** Genera una cotización básica a partir del pedido (si no existe), la autoriza y envía el pedido a Almacén: un solo clic para Recepción una vez que el cliente aceptó. */
  async confirmarAceptacionYEnviarAAlmacen(otId: string, pedidoId: string, _usuarioId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/ot/${otId}/pedidos/${pedidoId}/confirmar-y-enviar`);
      await Promise.all([this.cargarPedidos(), this.cargarCotizaciones(), this.cargarAuditoria(), this.cargarNotificaciones()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  /** Recepción confirma que el cliente aceptó el presupuesto y libera el pedido para que Almacén lo despache. */
  async aprobarPedidoParaAlmacen(pedidoId: string, _usuarioId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/pedidos/${pedidoId}/aprobar`);
      await Promise.all([this.cargarPedidos(), this.cargarAuditoria(), this.cargarNotificaciones()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  /** Confirma despacho y descuenta stock — solo productos del pedido (sección 6, PATCH /pedidos-almacen/:id/despachar) */
  async despacharPedido(pedidoId: string, _usuarioId: string, fotoDespacho?: string | null): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.api.patch(`/pedidos/${pedidoId}/despachar`, { fotoDespacho });
      await Promise.all([
        this.cargarPedidos(), this.cargarPedidoDetalle(), this.cargarProductos(),
        this.cargarMovimientos(), this.cargarOts(), this.cargarAuditoria(), this.cargarNotificaciones()
      ]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: this.mensajeError(err) };
    }
  }

  buscarProductoPorCodigo(codigo: string): Producto | undefined {
    return this.productos().find((p) => p.codigo.toLowerCase() === codigo.toLowerCase());
  }

  async crearProducto(datos: Omit<Producto, 'id'>): Promise<Producto> {
    const nuevo = await this.api.post<Producto>('/productos', datos);
    await this.cargarProductos();
    return nuevo;
  }

  async eliminarProducto(productoId: string): Promise<void> {
    await this.api.delete(`/productos/${productoId}`);
    await this.cargarProductos();
  }

  /** Edita los datos de un producto existente (nombre, código, precio, stock, lugar, etc.) desde Almacén. */
  async actualizarProducto(productoId: string, datos: Partial<Omit<Producto, 'id'>>): Promise<void> {
    await this.api.patch(`/productos/${productoId}`, datos);
    await this.cargarProductos();
  }

  /** Crea el producto si el código no existe, o actualiza sus datos si ya existe (usado por la importación desde Excel). */
  async importarProductos(lista: Omit<Producto, 'id'>[]): Promise<{ creados: number; actualizados: number }> {
    const resultados = await this.api.post<{ producto: Producto; creado: boolean }[]>('/productos/importar', lista);
    await this.cargarProductos();
    const creados = resultados.filter((r) => r.creado).length;
    return { creados, actualizados: resultados.length - creados };
  }

  async ajustarStock(productoId: string, cantidad: number, _usuarioId: string): Promise<void> {
    await this.api.patch(`/productos/${productoId}/ajustar-stock`, { delta: cantidad });
    await Promise.all([this.cargarProductos(), this.cargarMovimientos()]);
  }

  // ---------- Cotización ----------
  async generarCotizacion(otId: string, detalle: ItemCotizacion[]): Promise<Cotizacion> {
    const nueva = await this.api.post<Cotizacion>(`/ot/${otId}/cotizacion`, { detalle });
    await this.cargarCotizaciones();
    return nueva;
  }

  cotizacionDeOT(otId: string): Cotizacion | undefined {
    return this.cotizaciones().find((c) => c.otId === otId);
  }

  async autorizarCotizacion(cotizacionId: string, _usuarioId: string): Promise<void> {
    await this.api.patch(`/cotizaciones/${cotizacionId}/autorizar`);
    await Promise.all([this.cargarCotizaciones(), this.cargarAuditoria()]);
  }

  // ---------- Notificaciones ----------
  notificacionesDe(usuarioId: string): Notificacion[] {
    return this.notificaciones().filter((n) => n.usuarioId === usuarioId);
  }

  async marcarNotificacionLeida(id: string): Promise<void> {
    await this.api.patch(`/notificaciones/${id}/leida`);
    await this.cargarNotificaciones();
  }

  async marcarTodasLeidas(_usuarioId: string): Promise<void> {
    await this.api.patch('/notificaciones/leer-todas');
    await this.cargarNotificaciones();
  }

  // ---------- Administración ----------
  async crearUsuario(datos: { nombre: string; usuario: string; rol: Rol }): Promise<Usuario> {
    const nuevo = await this.api.post<Usuario>('/usuarios', datos);
    await this.cargarUsuarios();
    return nuevo;
  }

  async toggleUsuarioActivo(usuarioId: string): Promise<void> {
    await this.api.patch(`/usuarios/${usuarioId}/alternar`);
    await this.cargarUsuarios();
  }

  async restablecerPasswordUsuario(usuarioId: string, nuevaPassword: string): Promise<void> {
    await this.api.patch(`/usuarios/${usuarioId}/restablecer-password`, { nuevaPassword });
  }

  // ---------- Helpers de lectura cruzada ----------
  cliente(id: string): Cliente | undefined { return this.clientes().find((c) => c.id === id); }
  moto(id: string): Motocicleta | undefined { return this.motos().find((m) => m.id === id); }
  usuario(id: string | null): Usuario | undefined { return id ? this.usuarios().find((u) => u.id === id) : undefined; }
  producto(id: string): Producto | undefined { return this.productos().find((p) => p.id === id); }
  ot(id: string): OrdenTrabajo | undefined { return this.ots().find((o) => o.id === id); }

  mecanicos(): Usuario[] { return this.usuarios().filter((u) => u.rol === 'mecanico' && u.activo); }

  private mensajeError(err: unknown): string {
    const anyErr = err as { error?: { mensaje?: string }; message?: string };
    return anyErr?.error?.mensaje ?? anyErr?.message ?? 'No se pudo completar la operación.';
  }
}
