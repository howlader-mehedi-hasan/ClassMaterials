import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    title: String,
    credit: String,
    type: String,
    // Add other fields as discovered from JSON structure, but start flexible
}, { strict: false, timestamps: true });

export default mongoose.model('Syllabus', syllabusSchema);
