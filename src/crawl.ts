import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import { CrawlWords, tables } from "./utils/db.js";

async function main({
  page,
  context,
  stagehand,
}: {
  page: Page;
  context: BrowserContext;
  stagehand: Stagehand;
}) {

  await page.goto("https://www.dictionary.com/list/a/1");
  await page.waitForSelector("#browse-nav > nav > menu");
  const letters = await page.evaluate(() => {
    const list = document.querySelector("#browse-nav > nav > menu");
    const items = (list as HTMLUListElement).querySelectorAll("li");
    const letters = Array.from(items).map((item) => item.textContent);
    return letters;
  });
  console.log("letters",letters);

  for (const letter of letters.slice(24)) {
    const _l = letter === "#"? "0": letter;
    await page.goto(`https://www.dictionary.com/list/${_l}/1`);
    await page.waitForSelector("#content > div.cs30rl9RI3fBcNDr3Hhc > ul:nth-child(3) > li:nth-child(2) > a");
    const maxPage = await page.evaluate(() => {
      const item = document.querySelector("#content > div.cs30rl9RI3fBcNDr3Hhc > ul:nth-child(3) > li:nth-child(2) > a");
      const maxPage = item?.getAttribute("href")?.split("/").pop();
      return Number(maxPage!);
    });
    console.log("letter",letter,"maxPage",maxPage);   
    let stored = await tables<CrawlWords>('crawl_words').where('letter', letter).orderBy('page', 'desc').limit(1);
    let startPage = stored[0]?.page ? stored[0].page + 1 : 1;
    for (let i = startPage; i <= maxPage; i++) {
        console.log("start letter",letter,"page",i);
        await page.goto(`https://www.dictionary.com/list/${_l}/${i}`);
        await page.waitForSelector("#content > div.dDeYl3zUalQgXsSgFtAi > ul");
        const words = await page.evaluate(() => {
        const list = document.querySelector("#content > div.dDeYl3zUalQgXsSgFtAi > ul");
        const items = (list as HTMLUListElement).querySelectorAll("li");
        const words = Array.from(items).map((item) => item.textContent);
        return words as string[];
      });
      await tables.transaction(async (trx) => {
        await trx('crawl_words').insert(words.map((word) => ({
          word: word,
          letter: letter,
          page: i,
        }))).onConflict('word').ignore();
      });
    }
  }
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();
  const page = stagehand.page;
  const context = stagehand.context;
  await main({
    page,
    context,
    stagehand,
  });
  await stagehand.close();
}

run();
