import axios from "axios";
import cheerio from "cheerio";

const BASE =
  "https://tsctup.com/running_sahyogsuchi_list.php?search=&district=572&block=704&page=";

// memory storage (persists while serverless instance is warm)
let allRecords = [];
let currentPage = 1;
let finished = false;

// ⭐ Real browser-like axios client (prevents 403)
const axiosClient = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://tsctup.com/",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  }
});

async function scrapePage(page) {
  const url = BASE + page;
  const { data } = await axiosClient.get(url);

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

export default async function handler(req, res) {
  // ⭐ CORS HEADERS (for GitHub Pages)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    // scrape ONLY ONE page per request (Vercel time-limit safe)
    if (!finished) {
      const records = await scrapePage(currentPage);

      if (records.length === 0) {
        finished = true;
      } else {
        allRecords = allRecords.concat(records);
        currentPage++;
      }
    }

    res.status(200).json({
      records: allRecords,
      finished
    });

  } catch (err) {
    // never crash function — always return JSON
    res.status(200).json({
      records: allRecords,
      finished,
      error: err.message
    });
  }
}
