"use strict";

import { v2 as cloudinary } from "cloudinary";

export const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;

export const uploadImage = async (filePath, folder = "uploads") => {
  if (!isCloudinaryConfigured()) return null;

  return cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
};

export const deleteImage = async (publicId) => {
  if (!isCloudinaryConfigured()) return null;
  return cloudinary.uploader.destroy(publicId);
};
