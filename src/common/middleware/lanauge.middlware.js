export const setLanguage = (req, res, next) => {
  const lang = req.headers["accept-language"];

  // fallback language
  req.language = lang || "en";

  next();
};