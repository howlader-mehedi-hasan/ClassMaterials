import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    id: String, // Keep original ID for frontend compatibility if needed
    name: String,
    type: String,
    path: String, // Cloudinary URL
    publicId: String, // Cloudinary Public ID
    uploadedBy: String,
    uploadDate: Date
});

const examSchema = new mongoose.Schema({
    id: String,
    title: String,
    date: String,
    time: String,
    syllabus: String
});

const courseSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Course ID (e.g., CSE-101)
    name: String,
    instructor: String,
    files: [fileSchema],
    exams: [examSchema]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
