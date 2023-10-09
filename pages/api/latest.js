const cheerio = require("cheerio");
const axios = require("axios");
const NodeCache = require("node-cache");

const cache = new NodeCache();

const MAX_REQUESTS_PER_MINUTE = 60;
const requests = {};
setInterval(() => {
  for (const key in requests) {
    delete requests[key];
  }
}, 60000);

export default function handler(req, res) {
  const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (requests[clientIP] && requests[clientIP] >= MAX_REQUESTS_PER_MINUTE) {
    res.status(429).json({
      message: "Too many requests",
    });
    return;
  }

  requests[clientIP] = requests[clientIP] ? requests[clientIP] + 1 : 1;

  const cacheKey = req.url; // Utiliza la URL como clave del caché
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(cachedResponse);
    return;
  }

  const URL_BASE = 'https://ww6.mangakakalot.tv/'
  const data = [];

  axios
    .get(`https://ww6.mangakakalot.tv/`)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".itemupdate", html).each(function () {

        const id = $(this).find("a:first").attr("href")?.split('/')?.pop();
        const title = $(this).find("h3 a").text().trim();

        const img = URL_BASE + $(this).find("img").attr("data-src");

        const updated = $(this).find("li:nth(1) i").text().trim();
        // const viewsText = $(this).find(".item-right > span:nth(2)").text().trim();
        // const views = viewsText === "" ? "N/A" : viewsText;
        const chapterNumber = $(this).find("a.sts:first").text().trim();
        const chapterId = $(this).find("a.sts:first").attr("href");

        data.push({
          id,
          title,
          img,
          updated,
          chapterNumber,
          chapterId
        });

   

      });

      cache.set(cacheKey, data);
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json(data);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
}
