import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import { RecordId, Surreal } from 'surrealdb';
import { surrealdbNodeEngines } from '@surrealdb/node';

const db = new Surreal({
  engines: surrealdbNodeEngines(),
});

type Record = {
  letter: string;
  page: number;
  word: string;
}



async function main({
  page,
  context,
  stagehand,
}: {
  page: Page;
  context: BrowserContext;
  stagehand: Stagehand;
}) {
  await db.connect("ws://172.96.160.168:5566");
  await db.signin({
    username: "root",
    password: "root",
  });
  await db.run
  await db.use({
  namespace: "test",
  database: "test",
});

  await page.goto("https://www.dictionary.com/list/a/1");
  await page.waitForSelector("#browse-nav > nav > menu");
  const letters = await page.evaluate(() => {
    const list = document.querySelector("#browse-nav > nav > menu");
    const items = (list as HTMLUListElement).querySelectorAll("li");
    const letters = Array.from(items).map((item) => item.textContent);
    return letters;
  });
  console.log("letters",letters);

  for (const letter of letters) {
    const _l = letter === "#"? "0": letter;
    await page.goto(`https://www.dictionary.com/list/${_l}/1`);
    await page.waitForSelector("#content > div.cs30rl9RI3fBcNDr3Hhc > ul:nth-child(3) > li:nth-child(2) > a");
    const maxPage = await page.evaluate(() => {
      const item = document.querySelector("#content > div.cs30rl9RI3fBcNDr3Hhc > ul:nth-child(3) > li:nth-child(2) > a");
      const maxPage = item?.getAttribute("href")?.split("/").pop();
      return Number(maxPage!);
    });
    console.log("letter",letter,"maxPage",maxPage);
    for (let i = 1; i <= maxPage; i++) {
        let res = await db.query<[Record[]]>(`select * from records where letter = $letter and page = $page limit 1`,{
          letter: letter,
          page: i,
        });

        if(res[0].length > 0){
          console.log(`letter:${letter},page:${i},records`,res[0]);
          continue;
        }
        await page.goto(`https://www.dictionary.com/list/${_l}/${i}`);
        await page.waitForSelector("#content > div.dDeYl3zUalQgXsSgFtAi > ul");
        const words = await page.evaluate(() => {
        const list = document.querySelector("#content > div.dDeYl3zUalQgXsSgFtAi > ul");
        const items = (list as HTMLUListElement).querySelectorAll("li");
        const words = Array.from(items).map((item) => item.textContent);
        return words as string[];
      });
      await Promise.all(words.map(async (word) => {
        await db.create(new RecordId("records",word),{
          letter: letter,
          page: i,
          word: word,
        });
      }));
    console.log("letter",letter,"page",i,"words",words);
    }
  }
  // const words = await page.evaluate(() => {
  //   const list = document.querySelector("#content > div > ul");
  //   const items = (list as HTMLUListElement).querySelectorAll("li");
  //   const words = Array.from(items).map((item) => item.textContent);
  //   return words;
  // });
  // console.log("words",words);
  // await page.waitForSelector("#content > div > ul");
  // const { words } = await page.extract({
  //   instruction:
  //     "提炼出#content > div > ul 的 所有单词，并返回一个数组，数组中每个元素是一个单词",
  //   schema: z.object({
  //     words: z.string().array(),
  //   }),
  // });
  // console.log(words);
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
