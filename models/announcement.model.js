import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    active: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const Announcement = mongoose.model('Announcement', announcementSchema)

export default Announcement
