module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);          // details only in the server log (NFR 08)
  res.status(status).json({ message: status === 500 ? 'Something went wrong' : 'Bad request' });
};