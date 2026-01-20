import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    visibleDays: [String] // e.g. ["Sunday", "Monday"]
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
