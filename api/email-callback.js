const email = require('./email');
module.exports = (req, res) => {
  const url = new URL(req.url, 'https://localhost');
  url.searchParams.set('action', 'callback');
  req.url = '/api/email?' + url.searchParams.toString();
  return email(req, res);
};
