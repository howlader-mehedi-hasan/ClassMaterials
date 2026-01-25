import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store as is for migration compatibility
    name: { type: String },
    role: { type: String, default: 'user' },
    permissions: {
        courses_edit: { type: Boolean, default: false },
        syllabus_edit: { type: Boolean, default: false },
        schedule_edit: { type: Boolean, default: false },
        notices_edit: { type: Boolean, default: false },
        homepage_edit: { type: Boolean, default: false },
        exams_edit: { type: Boolean, default: false },
        course_materials_edit: { type: Boolean, default: false }
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
