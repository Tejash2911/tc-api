import mongoose from 'mongoose'
import Announcement from '../models/announcement.model.js'
import fs from 'fs'
import multer from 'multer'
import csv from 'csv-parser'

export const getAnnouncement = async (req, res) => {
  try {
    const title = await Announcement.findOne({ active: true }).sort({ updatedAt: -1 })
    res.status(200).json(title)
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: 'internal server error' })
  }
}

export const addAnnouncement = async (req, res) => {
  const title = new Announcement({
    title: req.body.title
  })
  try {
    if (req.body.title?.length > 140) {
      return res.status(400).json({ error: 'text length can not be more then 140 characters' })
    }
    title.save()
    res.status(200).json('announcement successfully added!')
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'internal server error' })
  }
}

export const editAnnouncement = async (req, res) => {
  const { id } = req.params
  const { title, active } = req.body
  console.log(title)
  if (!JSON.stringify(active) || !title) return res.status(400).json({ message: 'all field is requires!' })
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ message: 'this is not an valid ID that you provided!' })

  try {
    if (active) {
      await Announcement.updateMany({ $set: { active: false } })
    }
    const response = await Announcement.findByIdAndUpdate(id, { $set: { title, active } })
    res.status(200).json({ message: `announcement successfully Updated!` })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'internal server error' })
  }
}

export const disableAllAnnouncements = async (req, res) => {
  try {
    const resp = await Announcement.updateMany({ active: true }, { $set: { active: false } })
    return res.status(200).json({ message: `${resp.modifiedCount} announcement Deactivated successfully!` })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'internal server error' })
  }
}

export const getAllAnnouncements = async (req, res) => {
  try {
    // Parse offset and limit from query parameters, defaulting to 1 and 10 respectively
    const offset = parseInt(req.query.offset) || 1
    const limit = parseInt(req.query.limit) || 10
    // Parse search query parameter, if provided
    const search = req.query.search || ''

    // Construct query based on search parameter
    const query = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } } // Case-insensitive search on 'title' field
      ]
    }

    const skip = (offset - 1) * limit

    // Fetch announcements with pagination and search criteria
    const dbAnnouncements = await Announcement.find(query).skip(skip).limit(limit)

    // Fetch announcements count with search criteria
    const totalCount = await Announcement.countDocuments(query)

    // Return simplified response with data and totalCount
    return res.status(200).json({
      data: dbAnnouncements,
      totalCount: totalCount
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteAnnouncement = async (req, res) => {
  const id = req.params.id
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: `${id} is not valid ID` })
  }
  try {
    const response = await Announcement.findByIdAndDelete(id)
    res.status(200).json({ message: 'announcement updated successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
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
      return res.status(400).json({ message: 'No file uploaded' })
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
            res.status(200).json({ message: 'Announcements imported successfully' })
          } catch (insertError) {
            console.log('Database insert error:', insertError)
            res.status(500).json({ error: 'Error inserting data into the database' })
          } finally {
            // Clean up file after processing
            fs.unlink(filePath, unlinkError => {
              if (unlinkError) console.log('Error deleting file:', unlinkError)
            })
          }
        })
        .on('error', readError => {
          console.log('File reading error:', readError)
          res.status(500).json({ error: 'Error reading the file' })
          fs.unlink(filePath, unlinkError => {
            if (unlinkError) console.log('Error deleting file:', unlinkError)
          })
        })
    } catch (error) {
      console.log('Processing error:', error)
      res.status(500).json({ error: 'Internal server error' })
      // Ensure file deletion in case of unexpected errors
      fs.unlink(filePath, unlinkError => {
        if (unlinkError) console.log('Error deleting file:', unlinkError)
      })
    }
  }
]
