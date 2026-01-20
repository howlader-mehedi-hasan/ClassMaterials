import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    day: String,
    time: String,
    subject: String,
    room: String,
    isCancelled: { type: Boolean, default: false }
});

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
