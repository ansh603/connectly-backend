import {
  adminLoginService,
  changeAdminPasswordService,
  addCityService,
  addInterestService,
  getSiteContentsService,
  upsertSiteContentService,
  getSupportMessagesService,
  upsertInterestIconService,
} from "./service.js";

export const adminLogin = async (req, res) => {
  try {
    const result = await adminLoginService(req.body.email, req.body.password);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const result = await changeAdminPasswordService(
      req.admin,
      req.body.current_password,
      req.body.new_password
    );
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addCity = async (req, res) => {
  try {
    const result = await addCityService(req.body.name);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addInterest = async (req, res) => {
  try {
    const result = await addInterestService(req.body.name);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSiteContents = async (req, res) => {
  try {
    const result = await getSiteContentsService();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertSiteContent = async (req, res) => {
  try {
    const { key } = req.params;
    const { title, html } = req.body;
    const result = await upsertSiteContentService(key, title, html);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportMessages = async (req, res) => {
  try {
    const result = await getSupportMessagesService({
      type: req.query.type,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertInterestIcon = async (req, res) => {
  try {
    const result = await upsertInterestIconService(req.params.interestId, req.file);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
