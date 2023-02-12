import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import type { Transaction } from "./main.ts";
import { InMemoryTransactionRepository } from "./database.ts";

Deno.test("in memory repository test", async (t) => {
  await t.step("insert transaction", async () => {
    const transaction: Transaction = {
      nft: 'Sapo',
      price: 1.23,
      status: 'sold',
    }; 
    const repository = new InMemoryTransactionRepository();
    const id = await repository.save(transaction);
    assertEquals(id, 1);
  });

  await t.step("get transactions", async () => {
    const transaction: Transaction = {
      nft: 'Sapo',
      price: 1.23,
      status: 'sold',
    }; 
    const repository = new InMemoryTransactionRepository();
    await repository.save(transaction);
    await repository.save(transaction);

    const transactions = await repository.get('Sapo');
    assertEquals(transactions.length, 2);
  });
});
