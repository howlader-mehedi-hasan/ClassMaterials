import mongoose from 'mongoose';

const SyllabusSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: String,
    credit: Number,
    type: String // Theory / Lab / Project
});

export default mongoose.models.Syllabus || mongoose.model('Syllabus', SyllabusSchema);
