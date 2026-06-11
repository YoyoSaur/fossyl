import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface PingTable {
  id: Generated<number>;
  message: string;
  created_by: string;
  created_at: Generated<string>;
}

export type Ping = Selectable<PingTable>;
export type NewPing = Insertable<PingTable>;
export type PingUpdate = Updateable<PingTable>;

export interface DB {
  ping: PingTable;
}
