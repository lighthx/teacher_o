import knex from 'knex';
import { getRequiredEnv } from './config.js';
import z from 'zod';
export const tables = knex({
    client: 'pg',
    connection: getRequiredEnv('DB_URL'),
    pool: {
      min: 2,
      max: 100,
    },
  });

export const CrawlWords = z.object({
  word: z.string(),
  letter: z.string(),
  page: z.number(),
});

export const WordsDetail = z.object({
  word: z.string(),
  explain: z.string(),
  examples: z.array(z.string()),
  advance_learning: z.array(z.object({
    word: z.string(),
    explain: z.string(),
  })),
  explain_embedding: z.array(z.number()),
});

export type CrawlWords = z.infer<typeof CrawlWords>;
export type WordsDetail = z.infer<typeof WordsDetail>;