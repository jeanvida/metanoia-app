// backend/middleware/authAdmin.js

module.exports = function authAdmin(req, res, next) {
  // Exemplo simples: token de admin via header (ideal: JWT ou sessão)
  const adminToken = process.env.ADMIN_TOKEN;
  const token = req.headers['x-admin-token'];

  if (!adminToken) {
    return res.status(500).json({ error: 'ADMIN_TOKEN não configurado no backend.' });
  }
  if (!token || token !== adminToken) {
    return res.status(401).json({ error: 'Acesso restrito à área administrativa.' });
  }
  next();
};
