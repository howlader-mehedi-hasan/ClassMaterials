import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for compatibility
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app please hash this!
    name: String,
    role: { type: String, default: 'editor' },
    permissions: {
        courses_edit: { type: Boolean, default: false },
        syllabus_edit: { type: Boolean, default: false },
        schedule_edit: { type: Boolean, default: false },
        notices_edit: { type: Boolean, default: false },
        homepage_edit: { type: Boolean, default: false },
        exams_edit: { type: Boolean, default: false },
        course_materials_edit: { type: Boolean, default: false }
    }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
