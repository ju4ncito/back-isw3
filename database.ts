import type { Transaction } from "./main.ts";

interface TransactionRepository {
  save(transaction: Transaction): Promise<number>;
  get(nft: string): Promise<Transaction[]>;
  getAll(): Promise<Transaction[]>;
  profit(nft: string): Promise<number>;
}

export class InMemoryTransactionRepository implements TransactionRepository {
  #data = new Map<number, Transaction>();
  #id = 0;

  async save(transaction: Transaction): Promise<number> {
    this.#id++;
    this.#data.set(this.#id, transaction);
    return this.#id;
  }

  async get(nft: string): Promise<Transaction[]> {
    const res: Transaction[] = [];
    this.#data.forEach((transaction) =>
      transaction.nft === nft ? res.push(transaction) : null
    );
    return res;
  }

  async getAll(): Promise<Transaction[]> {
    const res: Transaction[] = [];
    this.#data.forEach((transaction) => res.push(transaction));
    return res;
  }

  async profit(nft: string): Promise<number> {
    let profit = 0;
    this.#data.forEach((transaction) => {
      if (transaction.nft === nft) {
        if (transaction.status === 'sold') {
          profit += transaction.price;
        } else if (transaction.status === 'bought') {
          profit -= transaction.price;
        }
      }
    });
    return profit;
  }
}


export async function repositoryFactory(url?: URL): Promise<TransactionRepository> {
  return new InMemoryTransactionRepository();
}
