// En middleware/auth.js
const API_KEY = process.env.MY_API_KEY;

function requireApiKey(req, res, next) {

  const providedApiKey = req.headers['x-api-key'];

  if (!providedApiKey || providedApiKey !== API_KEY) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  return next();
}

module.exports = { requireApiKey };