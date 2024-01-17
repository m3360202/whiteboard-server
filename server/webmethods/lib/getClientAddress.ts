export function getClientAddress(connection) {
  if (!connection) {
    return '';
  }
  return connection.clientAddress || connection.httpHeaders['x-real-ip'];
}
