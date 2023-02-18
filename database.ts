import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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
        if (transaction.status === "sold") {
          profit += transaction.price;
        } else if (transaction.status === "bought") {
          profit -= transaction.price;
        }
      }
    });
    return profit;
  }
}

export class PostgresTransactionRepository implements TransactionRepository {
  #client?: Client;

  constructor(url: string) {
    this.connect(url).then((client) => {
      this.#client = client;
      this.#client.queryArray(`
CREATE TABLE IF NOT EXISTS transactions(
  id SERIAL PRIMARY KEY,
  nft VARCHAR(40) NOT NULL,
  price REAL NOT NULL,
  status VARCHAR(10) NOT NULL
);
      `);
    });
  }

  async connect(url: string): Promise<Client> {
    const client = new Client(url);
    await client.connect();
    return client;
  }

  async save(transaction: Transaction): Promise<number> {
    const res = await this.#client?.queryArray<[number]>(`
INSERT INTO transactions (
  nft,
  price,
  status
) VALUES (
  '${transaction.nft}',
  ${transaction.price},
  '${transaction.status}'
) RETURNING id;
    `);
    if (res == undefined) {
      return 0;
    }
    console.log(res.rows[0]);
    return res.rows[0][0];
  }

  async get(nft: string): Promise<Transaction[]> {
    return [{ nft: nft, price: 1.0, status: "bought" }];
  }

  async getAll(): Promise<Transaction[]> {
    const res = await this.#client?.queryArray<
      [number, string, number, "sold" | "bought"]
    >(
      "SELECT id, nft, price, status FROM transactions;",
    );
    if (res == undefined) {
      return [];
    }

    const transactions = res.rows.map((tx) => {
      return { nft: tx[1], price: tx[2], status: tx[3] };
    });

    return transactions;
  }

  async profit(nft: string): Promise<number> {
    return 0;
  }
}

export async function repositoryFactory(
  url?: string,
): Promise<TransactionRepository> {
  if (url) {
    return new PostgresTransactionRepository(url);
  }
  return new InMemoryTransactionRepository();
}
