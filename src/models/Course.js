import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    name: String,
    type: String, // 'image' or 'pdf'
    url: String, // Cloudinary URL
    publicId: String, // Cloudinary Public ID for deletion
    uploadedBy: String,
    uploadDate: { type: Date, default: Date.now }
});

const ExamSchema = new mongoose.Schema({
    title: String,
    date: String,
    time: String,
    syllabus: String
});

const CourseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for compatibility
    name: { type: String, required: true },
    instructor: String,
    files: [FileSchema],
    exams: [ExamSchema],
    order: { type: Number, default: 0 } // For drag and drop reordering
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
