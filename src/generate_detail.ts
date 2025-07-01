import { generateObject, embed } from "ai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { voyage } from "voyage-ai-provider";
import { CrawlWords, tables, WordsDetail } from "./utils/db.js"
const model = anthropic("claude-3-7-sonnet-20250219");
const embeddingModel = voyage("voyage-3-large");


const generateDetail = async (word: string) => {
  const { object } = await generateObject({
    model: model,
    schema: WordsDetail.omit({
      explain_embedding: true,
    }),
    prompt: `You are a professional English teacher specializing in teaching 8-year-old children. Your task is to create educational content for the word "${word}".

Please provide:
1. **explain**: A simple, clear definition using vocabulary appropriate for 8-year-olds (1-2 sentences)
2. **examples**: 3-4 simple sentences showing how to use the word in context that children can understand
3. **advance_learning**: An array of related words with simple explanations, formatted as objects with "word" and "explain" properties

Guidelines:
- Use simple, age-appropriate language
- Make examples relatable to children's daily experiences
- Keep explanations concise but clear
- For advance_learning, choose 3-5 related words that help expand vocabulary naturally`
  });

  // Generate embedding for the explanation
//   const { embedding } = await embed({
//     model: embeddingModel,
//     value: object.explain,
//   });

  return {
    ...object,
    explain_embedding: new Array(1024).fill(0),
  };
};


const main = async () => {
  const words = await tables<CrawlWords>('crawl_words').orderBy('page', 'desc');
  for (const word of words) {
    const stored = await tables<WordsDetail>('words_detail').where('word', word.word).first();
    if (stored) {
      continue;
    }
    const detail = await generateDetail(word.word);
    await tables<WordsDetail>('words_detail').insert({
      word: word.word,
      explain: detail.explain,
      examples: JSON.stringify(detail.examples) as any,
      advance_learning: JSON.stringify(detail.advance_learning) as any,
      explain_embedding: JSON.stringify(detail.explain_embedding) as any,
    });
  }
};

main();