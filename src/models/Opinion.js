import mongoose from 'mongoose';

const OpinionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    rating: Number,
    feedback: String,
    date: String
});

export default mongoose.models.Opinion || mongoose.model('Opinion', OpinionSchema);
