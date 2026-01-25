import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    originalId: String,
    subject: String,
    department: String,
    description: String,
    anonymous: Boolean,
    date: String
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
