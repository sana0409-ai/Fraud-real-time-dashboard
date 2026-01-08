import { type FraudEvent, type InsertFraudEvent } from "@shared/schema";

export interface IStorage {
  // We can add persistence methods here if needed later, 
  // for now we mainly use in-memory simulation in routes.
  getUser(id: number): Promise<any | undefined>;
}

export class MemStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    return undefined;
  }
}

export const storage = new MemStorage();
