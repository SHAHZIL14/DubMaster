import config from "../../Configuration/config.js";
import { v2 as cloudinary } from "cloudinary";
import fileSystem from "fs";
// Modules

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinarySecret,
});
// Config

const uploadOnCloudinary = async function(serverFilePath){
  try {
    if (!serverFilePath) return null;
    const response = await cloudinary.uploader.upload(serverFilePath, {
      resource_type: "auto",
    });
    fileSystem.unlinkSync(serverFilePath);
    return response;
  } catch (error) {
    if (fileSystem.existsSync(serverFilePath))
      fileSystem.unlinkSync(serverFilePath);
    console.error("Cloudinary upload failed:", error.message);
    return error;
  }
};
// Uploading

const deleteFromCloudinary = async function (publicId, resourceType = "video"){
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result;
  } catch (error) {
    console.error(
      `Deletion failed on Cloudinary (${resourceType}):`,
      error.message
    );
    return error;
  }
};
//Deleting
export { uploadOnCloudinary, deleteFromCloudinary };