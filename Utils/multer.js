const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "pdf") cb(null, "rules/");
    else if (file.fieldname === "photo") cb(null, "uploads/");
    else cb(new Error("Unexpected field"), null);
  },

  filename: function (req, file, cb) {
    if (file.fieldname === "pdf") {
      cb(null, req.params.id + path.extname(file.originalname));
    } else if (file.fieldname === "photo") {
      const unique =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  }
});

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/*");
  const isPdf = file.mimetype === "application/pdf";

  if (isImage || isPdf) cb(null, true);
  else cb(null, false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
