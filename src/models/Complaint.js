import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    subject: String,
    department: String,
    description: String,
    anonymous: Boolean,
    date: String
});

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
