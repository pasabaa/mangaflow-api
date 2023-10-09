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

  const { keyword, page } = req.query;

  const results = []; // Almacena la información de los resultados
  const pagination = {}; // Almacena la información de paginación
  let totalResults = 0; // Almacena la cantidad total de resultados

  axios
    .get(`https://ww6.mangakakalot.tv/search/${keyword}?page=${page}`)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      // Recorre los elementos .story_item para obtener la información de cada resultado
      $('.story_item').each((index, elemento) => {
        const titleElement = $(elemento).find('.story_name a');
        const title = titleElement.text().trim();
        const id = titleElement.attr('href').split('/').pop();
        const authorElement = $(elemento).find('span:contains("Author(s)")');
        const authors = authorElement.text().trim().split('\n').filter(author => author.trim() !== '');
        const updatedElement = $(elemento).find('span:contains("Updated")');
        const updated = updatedElement.text().trim().split(': ')[1];
        
        const viewElement = $(elemento).find('span:contains("View :")');
        const views = viewElement.text().split(':')[1].trim();

        const img = $(elemento).find('img').attr('src');

        results.push({ title, id, authors, updated, views, img });
      });

      // Recorre los elementos .page_blue para obtener la información de paginación
      $('.page_blue').each((index, elemento) => {
        const text = $(elemento).text();
        if (text.includes("First(")) {
          pagination.first = parseInt(text.match(/\d+/)[0]); // Extrae el número de "First(1)"
        } else if (text.includes("Last(")) {
          pagination.last = parseInt(text.match(/\d+/)[0]); // Extrae el número de "Last(33)"
        } else if (text.includes("Total:")) {
          totalResults = parseInt(text.match(/\d+/)[0]); // Extrae el número de "Total: 641 results"
        }
      });

      const data = {
        results,
        pagination,
        totalResults,
      };

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
