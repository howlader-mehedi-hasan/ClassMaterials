import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: String,
    date: String,
    pdfUrl: String, // Cloudinary URL
    publicId: String, // Cloudinary Public ID for deletion
    username: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notice || mongoose.model('Notice', NoticeSchema);
