import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema)

export default RefreshToken
