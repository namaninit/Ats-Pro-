const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadResume = async (filePath, fileName) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'ats-resumes',
    resource_type: 'raw',
    public_id: `resume_${Date.now()}_${fileName}`,
    use_filename: true,
  });
  return result.secure_url;
};

const deleteResume = async (publicId) => {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
};

module.exports = { uploadResume, deleteResume };