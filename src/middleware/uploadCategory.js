import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = "src/public/admin/uploads/categories";


if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadPath);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() + path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const fileFilter = (req, file, cb) => {

    const allowedTypes = /jpg|jpeg|png|webp/;

    const extension =
        allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

    const mimeType =
        allowedTypes.test(file.mimetype);

    if (extension && mimeType) {

        cb(null, true);

    } else {

        cb(new Error("Only JPG, PNG and WEBP images are allowed"));

    }

};

const uploadCategory = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 2 * 1024 * 1024 // 2MB

    }

});

export default uploadCategory;