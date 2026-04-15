/**
 * Utilidad centralizada de telefono — Costa Rica (+506)
 * Reutilizable para BeautySaaS y NailSaaS cambiando COUNTRY_CODE.
 *
 * Regla de negocio:
 *   Usuario escribe : 8888 8888
 *   Se envia al backend: +50688888888
 *   Se muestra al usuario: 8888 8888
 */

const COUNTRY_CODE = '506';

/**
 * Formatea el valor del input para mostrarlo limpio al usuario.
 * Elimina todo excepto digitos y aplica formato XXXX XXXX.
 */
export function formatearInput(valor) {
  const soloDigitos = valor.replace(/\D/g, '').slice(0, 8);
  if (soloDigitos.length <= 4) return soloDigitos;
  return `${soloDigitos.slice(0, 4)} ${soloDigitos.slice(4)}`;
}

/**
 * Convierte el valor del input a formato E.164 para enviar al backend/Twilio.
 * "8888 8888" -> "+50688888888"
 * "+50688888888" -> "+50688888888" (ya esta correcto)
 */
export function formatearTelefono(valor) {
  if (!valor) return '';
  const soloDigitos = valor.replace(/\D/g, '');
  if (soloDigitos.startsWith(COUNTRY_CODE)) return `+${soloDigitos}`;
  return `+${COUNTRY_CODE}${soloDigitos}`;
}
