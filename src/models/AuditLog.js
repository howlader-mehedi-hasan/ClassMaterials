import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    action: String,
    username: String,
    details: String,
    date: { type: Date, default: Date.now }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
