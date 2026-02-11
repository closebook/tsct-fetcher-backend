import axios from "axios";
import cheerio from "cheerio";

const BASE =
  "https://tsctup.com/running_sahyogsuchi_list.php?search=&district=572&block=704&page=";

let allRecords = [];
let currentPage = 1;
let finished = false;
let scrapingStarted = false;

async function scrapePage(page) {
  const { data } = await axios.get(BASE + page);
  const $ = cheerio.load(data);

  let records = [];

  $("table tbody tr").each((i, el) => {
    const cols = $(el).find("td");
    if (cols.length > 0) {
      records.push({
        ehrms: $(cols[1]).text().trim(),
        donor: $(cols[2]).text().trim(),
        school: $(cols[3]).text().trim()
      });
    }
  });

  return records;
}

async function startScraping() {
  if (scrapingStarted) return;
  scrapingStarted = true;

  while (!finished) {
    const records = await scrapePage(currentPage);

    if (records.length === 0) {
      finished = true;
      break;
    }

    allRecords = allRecords.concat(records);
    currentPage++;
  }
}

export default async function handler(req, res) {
  await startScraping();

  res.status(200).json({
    records: allRecords,
    finished
  });
}
