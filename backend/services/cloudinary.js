const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadResume = async (filePath, fileName) => {
  const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'ats-resumes',
    resource_type: 'raw',
    public_id: `resume_${Date.now()}`,
    // DO NOT force format — let Cloudinary keep the real file type
  });

  // result.secure_url already works directly — no fl_attachment hack needed for raw files
  return result.secure_url;
};

module.exports = { uploadResume };