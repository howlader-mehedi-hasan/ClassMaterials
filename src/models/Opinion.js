import mongoose from 'mongoose';

const opinionSchema = new mongoose.Schema({
    originalId: String,
    rating: Number,
    feedback: String,
    date: String
}, { timestamps: true });

export default mongoose.model('Opinion', opinionSchema);
