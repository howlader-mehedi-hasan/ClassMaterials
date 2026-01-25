import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Custom ID from frontend
    title: String,
    date: String,
    pdfPath: String, // Cloudinary URL
    publicId: String, // Cloudinary Public ID
    username: String
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);
