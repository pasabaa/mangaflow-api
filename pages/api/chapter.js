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
  const data = {};
  const images = [];

  axios
    .get(`https://ww6.mangakakalot.tv${encodeURI(id)}`)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const imgElements = $('#vungdoc .img-loading');
      imgElements.each((index, elemento) => {
        const src = $(elemento).attr('data-src');
        images.push(src); // Almacenar la URL de la imagen en el array
      });

      data.images = images;

      cache.set(cacheKey, data);
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
      );
      res.status(200).json(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
}