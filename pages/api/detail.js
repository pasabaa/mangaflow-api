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

  const { id } = req.query;

  const URL_BASE = 'https://ww6.mangakakalot.tv/'

  const data = {};

  const info = [];

  const chapters = [];

  axios
    .get(`https://ww6.mangakakalot.tv/manga/${id}`)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const descriptionValue = $("#noidungm")
        .text()
        .replace(/Sekai Saikyou No Shinjuu Tsukai summary:/, "")
        .trim();

      $(".manga-info-top", html).each(function () {
        const title = $(this).find(".manga-info-text h1").text().trim();
        const img = URL_BASE + $(this)
          .find(".manga-info-pic img")
          .attr("src");
        const alternative = $(this).find(".story-alternative").text().trim();

        const author = $(this)
          .find(".manga-info-text li:nth(1) a")
          .text()
          .trim();
        const status = $(this).find(".manga-info-text li:nth(2)").text().trim();
        const genres = $(this).find(".manga-info-text li:nth(6)").text().trim();

        const updated = $(this)
          .find(".manga-info-text li:nth(3)")
          .text()
          .trim();
        const views = $(this).find(".manga-info-text li:nth(5)").text().trim();

        info.push({
          id: id,
          title,
          description: descriptionValue,
          img,
          alternative,
          author,
          status,
          genres,
          updated,
          views,
        });
      });

      const chapterElements = $(".chapter-list .row");

      chapterElements.each((index, elemento) => {
        const titleElement = $(elemento).find("a"); // Encuentra el elemento <a> dentro de cada "row"
        const title = titleElement.text().trim(); // Obtiene el texto del título
        const href = titleElement.attr("href"); // Obtiene el valor del atributo href
        chapters.push({ title, href }); // Almacena el título y el enlace en el array
      });

      data.info = info;

      data.chapters = chapters;


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