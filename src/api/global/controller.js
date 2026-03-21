import fs from "fs";
import path from "path";
import models from "../../models/index.js";

export const uploadFile = async (req, res) => {
    try {
      const { folder } = req.query;
  
      if (!req.file) {
        return res.send({ status: false, message: "No file uploaded" });
      }
  
      const filePath = `assets/${folder}/${req.file.filename}`;
  
      return res.json({
        status: true,
        message: "File uploaded successfully",
        path: filePath,
      });
    } catch (error) {
      return res.send({ status: false, message: error.message });
    }
  };

export const deleteFile = async (req, res) => {
  try {
    const { file_path } = req.params;

    if (!file_path) {
      return res.send({ status: false, message: "File delete"});
    }

    // Resolve the absolute file path
    const absolutePath = path.join(process.cwd(), file_path);

    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
      return res.send({ status: false, message: "File not found" });
    }

    // Delete the file
    fs.unlinkSync(absolutePath);

    return res.send({ status: true, message: "File deleted" });

  } catch (error) {
    console.error("Error deleting file:", error);
    return res.send({ status: false, message: error.message});
  }
};

export const getCities = async (req, res) => {
  try {
    const data = await models.City.findAll({
      where: { status: "active" },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterests = async (req, res) => {
  try {
    const data = await models.Interest.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "icon_path"],
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSiteContentAll = async (req, res) => {
  try {
    const rows = await models.SiteContent.findAll({
      attributes: ["key", "title", "html_content"],
      order: [["key", "ASC"]],
    });
    const data = {};
    rows.forEach((r) => {
      data[r.key] = { title: r.title, html: r.html_content };
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSiteContentByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const row = await models.SiteContent.findOne({
      where: { key },
      attributes: ["key", "title", "html_content"],
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Site content not found" });
    }
    return res.status(200).json({
      success: true,
      data: { key: row.key, title: row.title, html: row.html_content },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
