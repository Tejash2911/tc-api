import { config as conf } from "dotenv";
conf();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGODB_URL,
  cryptoJsSecretKey: process.env.CRYPTOJS_SECRET_KEY,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  jwtSecretExpire: process.env.JWT_SECRET_EXPIRE,
  backendUrl: process.env.BACE_BACKEND_URL,
  frontendUrl: process.env.BACE_FRONTEND_URL,
  mailService: process.env.MAIL_SERVICE,
  emailFrom: process.env.EMAIL_FROM,
  emailUserName: process.env.EMAIL_USERNAME,
  emailPassword: process.env.EMAIL_PASSWORD,
  razorPayKeyId: process.env.RAZORPAY_KEY_ID,
  razorPayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
};

export const config = Object.freeze(_config);
