import mongoose from 'mongoose';

const DeletionRequestSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    type: String, // 'course', 'file', 'exam', 'schedule', 'syllabus', 'notice'
    resourceId: String,
    details: mongoose.Schema.Types.Mixed,
    requestedBy: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
});

export default mongoose.models.DeletionRequest || mongoose.model('DeletionRequest', DeletionRequestSchema);
