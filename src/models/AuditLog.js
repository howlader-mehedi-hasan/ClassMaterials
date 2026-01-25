import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    originalId: String, // For migration
    action: String,
    username: String,
    details: String,
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
