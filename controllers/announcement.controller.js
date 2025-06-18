import mongoose from 'mongoose'
import Announcement from '../models/announcement.model.js'
import fs from 'fs'
import multer from 'multer'
import csv from 'csv-parser'
import { messages } from '../utils/constants.js'

export const getAnnouncement = async (req, res) => {
  try {
    const title = await Announcement.findOne({ active: true }).sort({ updatedAt: -1 })
    return res.status(200).json(title)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const addAnnouncement = async (req, res) => {
  const title = new Announcement({
    title: req.body.title
  })
  try {
    if (req.body.title?.length > 140) {
      return res.status(400).json({ message: messages.VALIDATION_ERROR })
    }
    title.save()
    return res.status(200).json({ message: messages.ANNOUNCEMENT_CREATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const editAnnouncement = async (req, res) => {
  const { id } = req.params
  const { title, active } = req.body
  if (!JSON.stringify(active) || !title) {
    return res.status(400).json({ message: messages.VALIDATION_ERROR })
  }
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: messages.BAD_REQUEST })
  }

  try {
    if (active) {
      await Announcement.updateMany({ $set: { active: false } })
    }
    const response = await Announcement.findByIdAndUpdate(id, { $set: { title, active } })
    return res.status(200).json({ message: messages.ANNOUNCEMENT_UPDATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const disableAllAnnouncements = async (req, res) => {
  try {
    const resp = await Announcement.updateMany({ active: true }, { $set: { active: false } })
    return res.status(200).json({ message: messages.ANNOUNCEMENT_DISABLED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getAllAnnouncements = async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''

    const query = {}
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }]
    }

    const skip = (offset - 1) * limit

    const dbAnnouncements = await Announcement.find(query).skip(skip).limit(limit)

    const totalCount = await Announcement.countDocuments(query)

    return res.status(200).json({
      data: dbAnnouncements,
      totalCount: totalCount
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const deleteAnnouncement = async (req, res) => {
  const id = req.params.id
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: messages.NOT_FOUND })
  }
  try {
    const response = await Announcement.findByIdAndDelete(id)
    return res.status(200).json({ message: messages.ANNOUNCEMENT_DELETED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

// Set up multer for file upload
const upload = multer({
  dest: 'uploads/', // Ensure this directory exists
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
})

export const importAnnouncements = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    const { path: filePath, originalname } = req.file
    const announcements = []

    try {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', row => {
          if (row.title) {
            announcements.push({ title: row.title })
          }
        })
        .on('end', async () => {
          try {
            await Announcement.insertMany(announcements)
            return res.status(200).json({ message: messages.ANNOUNCEMENT_CREATED })
          } catch (error) {
            console.log(error)
            return res.status(500).json({ message: messages.INTERNAL_ERROR })
          } finally {
            // Clean up file after processing
            fs.unlink(filePath, error => {
              if (error) console.log('Error deleting file:', error)
            })
          }
        })
        .on('error', error => {
          console.log('File reading error:', error)
          fs.unlink(filePath, error => {
            if (error) console.log('Error deleting file:', error)
          })
          return res.status(500).json({ message: messages.INTERNAL_ERROR })
        })
    } catch (error) {
      console.log(error)
      // Ensure file deletion in case of unexpected errors
      fs.unlink(filePath, error => {
        if (error) console.log('Error deleting file:', error)
      })
      return res.status(500).json({ message: messages.INTERNAL_ERROR })
    }
  }
]
