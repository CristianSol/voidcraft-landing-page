import type { PoseName } from './poses'

export interface Member {
  id: string
  /** username de Minecraft: se usa para descargar la skin */
  username: string
  displayName: string
  role: string
  pose: PoseName
  /** fila de la foto: atrás de pie, adelante sentados/agachados */
  row: 'back' | 'front'
}

// Staff según la página vieja (voidcraft.netlify.app/members). Para sumar más
// miembros basta con agregarlos acá; la escena se acomoda sola por fila.
export const STAFF: Member[] = [
  // fila de atrás (de pie); el owner al centro
  { id: 'ferriwan', username: 'Ferriwan', displayName: 'Ferriwan', role: 'Moderador · Técnico', pose: 'jarra', row: 'back' },
  { id: 'rodrir', username: 'Rodrir', displayName: 'Rodrir', role: 'Moderador · Técnico', pose: 'apunta', row: 'back' },
  { id: 'hopkins15', username: 'Hopkins15', displayName: 'Hopkins15', role: 'Owner · Redstoner', pose: 'victoria', row: 'back' },
  { id: 'rambopro5', username: 'Rambopro5', displayName: 'Rambopro5', role: 'Helper · Técnico', pose: 'saludo', row: 'back' },
  { id: 'soloyael', username: 'SoloYael', displayName: 'SoloYael', role: 'Helper · Redstoner', pose: 'jarra', row: 'back' },
  // fila de adelante
  { id: 'loperso', username: 'loperso', displayName: 'loperso', role: 'Moderador · Builder', pose: 'sentado', row: 'front' },
  { id: 'daelsntn', username: 'DaelSntn', displayName: 'DaelSntn', role: 'Moderador · Mano de obra', pose: 'sentadoRelajado', row: 'front' },
  { id: 'luchitog', username: 'Luchitog', displayName: 'Luchitog', role: 'Helper · Builder', pose: 'sentadoSaludo', row: 'front' },
  { id: 'daxafar', username: 'Daxafar', displayName: 'Daxafar', role: 'Helper · Builder', pose: 'sentadoManosRodillas', row: 'front' },
]
