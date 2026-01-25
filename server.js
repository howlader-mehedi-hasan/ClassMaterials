import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import { upload, cloudinary } from './src/config/cloudinary.js';

// Models
import User from './src/models/User.js';
import Course from './src/models/Course.js';
import Notice from './src/models/Notice.js';
import Schedule from './src/models/Schedule.js';
import Complaint from './src/models/Complaint.js';
import Opinion from './src/models/Opinion.js';
import AuditLog from './src/models/AuditLog.js';
import Syllabus from './src/models/Syllabus.js';
import Setting from './src/models/Setting.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve uploaded files (Legacy support)
app.use(express.static(path.join(__dirname, 'dist'))); // Serve frontend build

// Audit Log Helper
const logAudit = async (action, username, details) => {
    try {
        await AuditLog.create({
            action,
            username: username || 'Unknown',
            details
        });
        console.log(`[AUDIT] Logged: ${action} by ${username}`);
    } catch (e) {
        console.error("Audit Log Error:", e);
    }
};

// GET courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read courses' });
    }
});

// GET Audit Logs
app.get('/api/admin/logs', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// DELETE Single Log
app.delete('/api/admin/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AuditLog.findOneAndDelete({ $or: [{ _id: id }, { id: id }, { originalId: id }] });
        if (!result) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true, message: 'Log deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete log' });
    }
});

// DELETE All Logs (Clear)
app.delete('/api/admin/logs', async (req, res) => {
    try {
        await AuditLog.deleteMany({});
        logAudit('CLEAR_LOGS', req.body.username || 'Admin', 'Cleared all activity logs');
        res.json({ success: true, message: 'All logs cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

// POST Batch Delete Logs
app.post('/api/admin/logs/batch-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs format' });

        await AuditLog.deleteMany({
            $or: [
                { _id: { $in: ids } },
                { id: { $in: ids } }
            ]
        });
        res.json({ success: true, message: 'Logs deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to batch delete logs' });
    }
});

// POST new course or update existing
app.post('/api/courses', upload.array('files'), async (req, res) => {
    const { courseId, courseName, instructor, username } = req.body;

    try {
        let course = await Course.findOne({ id: courseId });
        let isNewCourse = false;

        if (!course) {
            isNewCourse = true;
            course = new Course({
                id: courseId,
                name: courseName,
                instructor: instructor,
                files: [],
                exams: []
            });
        } else {
            course.name = courseName;
            course.instructor = instructor;
        }

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const ext = path.extname(file.originalname).toLowerCase();
                const fileType = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext) ? 'image' : 'pdf';

                const newFile = {
                    id: `file-${Date.now()}-${Math.round(Math.random() * 1000)}`,
                    name: file.originalname,
                    type: fileType,
                    path: file.path,
                    publicId: file.filename,
                    uploadedBy: username,
                    uploadDate: new Date()
                };
                course.files.push(newFile);
                logAudit('UPLOAD_FILE', username, `Uploaded ${file.originalname} to ${courseId}`);
            });
        }

        await course.save();

        if (isNewCourse) logAudit('CREATE_COURSE', username, `Created course ${courseId}`);
        else logAudit('UPDATE_COURSE', username, `Updated course ${courseId}`);

        res.json({ success: true, message: 'Course updated successfully', course });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save course data' });
    }
});

// DELETE file from course
app.delete('/api/courses/:courseId/files/:fileId', async (req, res) => {
    const { courseId, fileId } = req.params;

    try {
        const course = await Course.findOne({ id: courseId });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const fileIndex = course.files.findIndex(f => f.id === fileId);
        if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

        const fileToDelete = course.files[fileIndex];

        if (fileToDelete.publicId) {
            try {
                await cloudinary.uploader.destroy(fileToDelete.publicId);
            } catch (e) {
                console.error("Cloudinary delete error:", e);
            }
        }

        const result = await Course.updateOne(
            { id: courseId },
            { $pull: { files: { id: fileId } } }
        );

        console.log(`[DELETE DEBUG] Course ${courseId} File ${fileId} - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'File not found or already deleted' });
        }

        logAudit('DELETE_FILE', 'Admin', `Deleted file ${fileToDelete.name} from ${courseId}`);
        res.json({ success: true, message: 'File deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// POST Add Exam to Course
app.post('/api/courses/:id/exams', async (req, res) => {
    const courseId = req.params.id;
    const { title, date, time, syllabus, username } = req.body;

    try {
        const course = await Course.findOne({ id: courseId });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const newExam = {
            id: `exam-${Date.now()}`,
            title,
            date,
            time,
            syllabus: syllabus || ''
        };

        course.exams.push(newExam);
        await course.save();

        logAudit('ADD_EXAM', username, `Added exam ${title} to ${courseId}`);
        res.json({ success: true, message: 'Exam added successfully', exam: newExam });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add exam' });
    }
});

// GET Complaints
app.get('/api/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// POST Complaint
app.post('/api/complaints', async (req, res) => {
    try {
        const { subject, department, description, anonymous } = req.body;
        const newComplaint = await Complaint.create({
            subject,
            department,
            description,
            anonymous,
            date: new Date().toISOString().split('T')[0]
        });
        res.json({ success: true, complaint: newComplaint });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save complaint' });
    }
});

// GET Opinions
app.get('/api/opinions', async (req, res) => {
    try {
        const opinions = await Opinion.find().sort({ createdAt: -1 });
        res.json(opinions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch opinions' });
    }
});

// POST Opinion
app.post('/api/opinions', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const newOpinion = await Opinion.create({
            rating,
            feedback,
            date: new Date().toISOString().split('T')[0]
        });
        res.json({ success: true, opinion: newOpinion });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save opinion' });
    }
});

// DELETE Exam from Course
app.delete('/api/courses/:id/exams/:examId', async (req, res) => {
    const { id, examId } = req.params;
    try {
        const course = await Course.findOne({ id: id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        course.exams = course.exams.filter(e => e.id !== examId);
        await course.save();

        res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});

// PUT Update Exam in Course
app.put('/api/courses/:id/exams/:examId', async (req, res) => {
    const { id, examId } = req.params;
    const { title, date, time, syllabus, username } = req.body;

    try {
        const course = await Course.findOne({ id: id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const exam = course.exams.find(e => e.id === examId);
        if (exam) {
            exam.title = title;
            exam.date = date;
            exam.time = time;
            exam.syllabus = syllabus;
            await course.save();
            logAudit('UPDATE_EXAM', username, `Updated exam ${title} in ${id}`);
            res.json({ success: true, message: 'Exam updated successfully', exam });
        } else {
            res.status(404).json({ error: 'Exam not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update exam' });
    }
});

// POST Reorder Courses
app.post('/api/courses/reorder', async (req, res) => {
    res.json({ success: true, message: 'Reorder saved (simulated)' });
});

// DELETE entire course
app.delete('/api/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        await Course.deleteOne({ id: courseId });
        // Can also find course first, iterate files, delete from Cloudinary.
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// --- Syllabus API ---

app.get('/api/syllabus', async (req, res) => {
    try {
        const syllabus = await Syllabus.find();
        res.json(syllabus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
});

app.post('/api/syllabus', async (req, res) => {
    const newCourse = req.body;
    try {
        await Syllabus.findOneAndUpdate(
            { code: newCourse.code },
            newCourse,
            { upsert: true, new: true }
        );
        logAudit('UPDATE_SYLLABUS', newCourse.username || 'Admin', `Updated syllabus for ${newCourse.code}`);
        res.json({ success: true, message: 'Syllabus updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update syllabus' });
    }
});

app.delete('/api/syllabus/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await Syllabus.deleteOne({ code });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Course not found' });
        res.json({ success: true, message: 'Course deleted from syllabus' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course from syllabus' });
    }
});

app.post('/api/syllabus/pdf', upload.single('file'), (req, res) => {
    try {
        if (req.file) {
            res.json({ success: true, message: 'Syllabus PDF updated successfully', url: req.file.path });
        } else {
            res.status(400).json({ error: 'No file uploaded' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload syllabus PDF' });
    }
});

// --- Notice Board API ---

app.get('/api/notices', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

app.post('/api/notices', async (req, res) => {
    const newNotice = req.body;
    try {
        if (newNotice.id) {
            const exists = await Notice.findOne({ id: newNotice.id });
            if (exists) {
                await Notice.findOneAndUpdate({ id: newNotice.id }, newNotice);
                logAudit('UPDATE_NOTICE', newNotice.username || 'Admin', `Notice: ${newNotice.title}`);
            } else {
                await Notice.create(newNotice);
                logAudit('CREATE_NOTICE', newNotice.username || 'Admin', `Notice: ${newNotice.title}`);
            }
        } else {
            await Notice.create(newNotice);
        }
        res.json({ success: true, message: 'Notice saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save notice' });
    }
});

app.delete('/api/notices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Notice.deleteOne({ id });
        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notice' });
    }
});

app.post('/api/notices/pdf', upload.single('file'), (req, res) => {
    try {
        if (req.file) {
            res.json({ success: true, filePath: req.file.path });
        } else {
            res.status(400).json({ error: 'No file uploaded' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload notice PDF' });
    }
});

// --- Schedule API ---

app.get('/api/schedule', async (req, res) => {
    try {
        const schedule = await Schedule.find();
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

app.put('/api/schedule/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { isCancelled, username } = req.body;
    try {
        const item = await Schedule.findOneAndUpdate({ id }, { isCancelled }, { new: true });
        if (item) {
            logAudit('UPDATE_SCHEDULE', username || 'Admin', `Set cancellation to ${isCancelled} for schedule ${id}`);
            res.json({ success: true, message: 'Schedule updated successfully', item });
        } else {
            res.status(404).json({ error: 'Schedule item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

app.post('/api/schedule', async (req, res) => {
    try {
        const newItem = req.body;
        // Basic validation or just save
        if (!newItem.id) newItem.id = `sched-${Date.now()}`;

        await Schedule.create(newItem);
        logAudit('CREATE_SCHEDULE', newItem.username || 'Admin', `Added schedule: ${newItem.courseName || newItem.type}`);
        res.json({ success: true, message: 'Schedule added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add schedule' });
    }
});

app.delete('/api/schedule/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Schedule.deleteOne({ id });
        logAudit('DELETE_SCHEDULE', 'Admin', `Deleted schedule ${id}`);
        res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// --- Routine Image ---
// New Endpoint to get Routine URL
app.get('/api/schedule/routine', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'routineUrl' });
        if (setting) {
            res.json({ success: true, url: setting.value });
        } else {
            // Fallback to local default if not set? Or null.
            // Frontend should handle it.
            res.json({ success: false, message: 'No routine found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch routine' });
    }
});

app.post('/api/schedule/routine', upload.single('file'), async (req, res) => {
    try {
        if (req.file) {
            const url = req.file.path;
            await Setting.findOneAndUpdate(
                { key: 'routineUrl' },
                { value: url },
                { upsert: true }
            );
            res.json({ success: true, timestamp: Date.now(), url: url });
        } else {
            res.status(400).json({ error: 'No file uploaded' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload routine image' });
    }
});

// --- Settings API ---
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await Setting.find();
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);
        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            await Setting.findOneAndUpdate(
                { key },
                { value },
                { upsert: true, new: true }
            );
        }
        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// --- Users & Auth API ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Seed if empty (check count)
        const count = await User.countDocuments();
        if (count === 0 && username === 'admin' && password === 'admin123') {
            await User.create({ username: 'admin', password: 'admin123', name: 'Super Admin', role: 'admin' });
            return res.json({ success: true, user: { username: 'admin', name: 'Super Admin', role: 'admin' } });
        }

        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, user: { username: user.username, name: user.name, role: user.role } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- User Management API ---

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords for list
        // Map _id to id for frontend compatibility if needed, though frontend seems to use id or _id
        const userList = users.map(u => ({
            id: u._id,
            username: u.username,
            name: u.name,
            role: u.role,
            permissions: u.permissions
        }));
        res.json(userList);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, password, name, role, permissions } = req.body;
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username already exists' });

        const newUser = await User.create({
            username,
            password,
            name,
            role: role || 'user',
            permissions: role === 'admin' ? {} : permissions // Admin usually implies all perms, but saving space
        });

        logAudit('CREATE_USER', 'Admin', `Created user ${username}`);
        res.json({ success: true, user: { id: newUser._id, username: newUser.username } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password } = req.body;

        const updateData = { name, username };
        if (password) updateData.password = password; // Only update if provided

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        logAudit('UPDATE_USER', 'Admin', `Updated profile for ${username}`);
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) return res.status(404).json({ error: 'User not found' });

        logAudit('DELETE_USER', 'Admin', `Deleted user ${deletedUser.username}`);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, { password: newPassword }, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        logAudit('CHANGE_PASSWORD', 'Admin', `Changed password for ${updatedUser.username}`);
        res.json({ success: true, message: 'Password updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

app.put('/api/users/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, { permissions }, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        logAudit('UPDATE_PERMISSIONS', 'Admin', `Updated permissions for ${updatedUser.username}`);
        res.json({ success: true, message: 'Permissions updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update permissions' });
    }
});

// POST Contact Message
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        // In a real app, save to Message model or email admin.
        // For now, log to audit/console.
        console.log(`[CONTACT] Message from ${name} (${email}): ${subject} - ${message}`);

        // Optional: Create an audit log if 'user' is known, but contact might be public.
        // logAudit('CONTACT_MESSAGE', 'Guest', `Message from ${email}`);

        res.json({ success: true, message: 'Message received' });
    } catch (error) {
        console.error("Contact error:", error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
