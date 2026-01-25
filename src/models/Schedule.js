import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    day: String,
    startTime: String,
    endTime: String,
    type: String,
    courseId: String,
    courseName: String,
    instructor: String,
    room: String,
    recurrence: String,
    color: String,
    isCancelled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Schedule', scheduleSchema);
