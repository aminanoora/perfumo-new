import cloudinary from "../../config/cloudinary.js";
import { Readable } from "stream";

export const uploadProductImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "perfumo/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};