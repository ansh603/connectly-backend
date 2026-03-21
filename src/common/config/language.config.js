import ar from "../../language/ar.language.js";
import en from "../../language/en.language.js";

const messages = {
  en, ar
};

export const messageData = (lang = "en", key) => {
  return messages[lang]?.[key] || messages["en"][key] || "Message not found";
};
