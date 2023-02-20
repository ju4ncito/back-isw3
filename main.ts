import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Status } from "https://deno.land/std@0.173.0/http/http_status.ts";
import { z } from "https://deno.land/x/zod@v3.20.5/mod.ts";
import "https://deno.land/x/dotenv/load.ts";

import { repositoryFactory } from "./database.ts";

const repository = await repositoryFactory(Deno.env.get("DATABASE_URL"));

const port = 8080;

export const Transaction = z.object({
  nft: z.string(),
  price: z.number(),
  status: z.enum(["sold", "bought"]),
});

export type Transaction = z.infer<typeof Transaction>;

async function getTransactions(request: Request): Promise<Response> {
  const transactions = await repository.getAll();
  return new Response(JSON.stringify(transactions), {
    status: Status.OK,
    headers: { "Content-Type": "application/json" },
  });
}

async function createTransaction(request: Request): Promise<Response> {
  const data = await request.json();
  const transaction = await Transaction.safeParseAsync(data);

  if (!transaction.success) {
    const res = { "error": transaction.error.issues };
    return new Response(JSON.stringify(res), {
      status: Status.UnprocessableEntity,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = await repository.save(transaction.data);
  const res = { ...transaction.data, id: id };
  return new Response(JSON.stringify(res), {
    status: Status.Created,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function handleTransaction(request: Request): Promise<Response> {
  console.log(request.method);
  switch (request.method) {
    case "GET":
      return await getTransactions(request);
    case "POST":
      return await createTransaction(request);
  }
  const res = { error: "invalid method" };
  return new Response(JSON.stringify(res), {
    status: Status.MethodNotAllowed,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// async function handler(request: Request): Promise<Response> {
//   const { pathname } = new URL(request.url);
//   switch (pathname) {
//     case "/transaction":
//       return await handleTransaction(request);
//     default:
//       return new Response("not found", { status: Status.NotFound });
//   }
// }

async function handler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case "/transaction":
      const response = await handleTransaction(request);
      response.headers.set(
        "Access-Control-Allow-Origin",
        "http://localhost:3000 , https://afraid-tiger-production.up.railway.app/",
      );
      return response;
    default:
      return new Response("not found", { status: Status.NotFound });
  }
}


if (import.meta.main) {
  console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
  await serve(handler, { port });
}
