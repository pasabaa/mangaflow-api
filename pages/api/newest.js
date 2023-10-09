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
    .get(`https://ww6.mangakakalot.tv/manga_list/?type=newest&category=all&state=all&page=1`)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".list-truyen-item-wrap", html).each(function () {

        const id = $(this).find("a:first").attr("href")?.split('/')?.pop();
        const title = $(this).find("h3 a").text().trim();

        const img = URL_BASE + $(this).find("img").attr("data-src");

        const chapterNumber = $(this).find(".list-story-item-wrap-chapter").text().trim();
        const chapterId = $(this).find(".list-story-item-wrap-chapter").attr("href");

        data.push({
          id,
          title,
          img,
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