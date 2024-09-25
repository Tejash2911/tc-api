import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config/config.js'

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret
})

export const uploadImageToCloudinary = async (image, name) => {
  console.log('me run')
  try {
    const result = await cloudinary.uploader.upload(image, {
      public_id: name
    })

    return {
      success: true,
      url: result.secure_url
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

export const deleteImageFromCloudinary = async name => {
  try {
    const result = await cloudinary.uploader.destroy(name)
    console.log(result)
    return { success: true }
  } catch (error) {
    console.log(error)
    return { success: false, error: error }
  }
}
