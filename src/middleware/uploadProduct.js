import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;

  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
  }
};

const uploadProduct = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const validateProductImages = (req, res, next) => {
  const files = req.files || [];

  if (files.length < 3) {
    req.session.message = {
      type: "error",
      text: "Please upload at least 3 product images.",
    };

    return res.redirect("back");
  }

  if (files.length > 5) {
    req.session.message = {
      type: "error",
      text: "You can upload a maximum of 5 product images.",
    };

    return res.redirect("back");
  }

  next();
};

export default uploadProduct;