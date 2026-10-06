// Compartida por día: completar y borrar esperan a TODOS los guardados pendientes.
const queues = new Map();
export function enqueueSave(key, task) {
  const previous = queues.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  queues.set(key, next);
  next.finally(() => { if (queues.get(key) === next) queues.delete(key); }).catch(() => {});
  return next;
}

export async function drainSaves(key) {
  while (queues.has(key)) await queues.get(key).catch(() => {});
}
