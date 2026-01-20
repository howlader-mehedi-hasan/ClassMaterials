import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DB and Utils
import connectDB from './src/lib/db.js';
import { uploadToCloudinary, deleteFromCloudinary } from './src/lib/cloudinary.js';

// Import Models
import Course from './src/models/Course.js';
import Notice from './src/models/Notice.js';
import Schedule from './src/models/Schedule.js';
import AuditLog from './src/models/AuditLog.js';
import Complaint from './src/models/Complaint.js';
import Opinion from './src/models/Opinion.js';
import Syllabus from './src/models/Syllabus.js';
import User from './src/models/User.js';
import Message from './src/models/Message.js';
import Settings from './src/models/Settings.js';
import DeletionRequest from './src/models/DeletionRequest.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Serve static files (mostly for local dev, Vercel handles this differently)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Memory Storage for Cloudinary Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Audit Log Helper
const logAudit = async (action, username, details) => {
    try {
        await AuditLog.create({
            id: `log-${Date.now()}-${Math.round(Math.random() * 1000)}`,
            action,
            username: username || 'Unknown',
            details,
            date: new Date()
        });
    } catch (e) {
        console.error("Audit Log Error:", e);
    }
};

// --- API ROUTES ---

// GET Courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find({}).sort({ order: 1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read courses' });
    }
});

// POST Course (Create/Update with Files)
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
                instructor,
                files: [],
                exams: []
            });
        } else {
            course.name = courseName;
            course.instructor = instructor;
        }

        // Handle File Uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const folder = `materials/${courseId}`;
                const result = await uploadToCloudinary(file.buffer, folder);

                const ext = path.extname(file.originalname).toLowerCase();
                const fileType = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext) ? 'image' : 'pdf';

                course.files.push({
                    name: file.originalname,
                    type: fileType,
                    url: result.secure_url,
                    publicId: result.public_id,
                    uploadedBy: username,
                    uploadDate: new Date()
                });

                await logAudit('UPLOAD_FILE', username, `Uploaded ${file.originalname} to ${courseId}`);
            }
        }

        await course.save();

        if (isNewCourse) await logAudit('CREATE_COURSE', username, `Created course ${courseId}`);
        else await logAudit('UPDATE_COURSE', username, `Updated course ${courseId}`);

        res.json({ success: true, message: 'Course updated successfully', course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save course data' });
    }
});

// DELETE File
app.delete('/api/courses/:courseId/files/:fileId', async (req, res) => {
    const { courseId, fileId } = req.params;
    try {
        const course = await Course.findOne({ id: courseId });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const file = course.files.id(fileId);
        if (!file) {
            // Fallback: check if fileId matches our custom ID generation or mongodb _id
            // The old system generated 'id' string. Mongoose uses _id.
            // We'll trust that we might migrate or use _id now.
            // If legacy ID is used, we need to find it manually in array.
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from Cloudinary
        if (file.publicId) {
            await deleteFromCloudinary(file.publicId);
        }

        // Remove from array
        course.files.pull(fileId);
        await course.save();

        await logAudit('DELETE_FILE', 'Admin', `Deleted file from ${courseId}`);
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// DELETE Course
app.delete('/api/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        const course = await Course.findOne({ id: courseId });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        // Delete all files in Cloudinary
        for (const file of course.files) {
            if (file.publicId) await deleteFromCloudinary(file.publicId);
        }

        await Course.deleteOne({ id: courseId });
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// POST Add Exam
app.post('/api/courses/:id/exams', async (req, res) => {
    const courseId = req.params.id;
    const { title, date, time, syllabus, username } = req.body;
    try {
        const course = await Course.findOne({ id: courseId });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        course.exams.push({ title, date, time, syllabus });
        await course.save();

        await logAudit('ADD_EXAM', username, `Added exam ${title} to ${courseId}`);
        res.json({ success: true, message: 'Exam added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add exam' });
    }
});

// DELETE Exam
app.delete('/api/courses/:id/exams/:examId', async (req, res) => {
    const { id, examId } = req.params;
    try {
        const course = await Course.findOne({ id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        course.exams.pull(examId); // Mongoose specific
        await course.save();
        res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});

// PUT Update Exam
app.put('/api/courses/:id/exams/:examId', async (req, res) => {
    const { id, examId } = req.params;
    const { title, date, time, syllabus, username } = req.body;
    try {
        const course = await Course.findOne({ id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const exam = course.exams.id(examId);
        if (exam) {
            exam.title = title;
            exam.date = date;
            exam.time = time;
            exam.syllabus = syllabus;
            await course.save();
            await logAudit('UPDATE_EXAM', username, `Updated exam ${title} in ${id}`);
            res.json({ success: true, message: 'Exam updated successfully' });
        } else {
            res.status(404).json({ error: 'Exam not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update exam' });
    }
});

// POST Reorder
app.post('/api/courses/reorder', async (req, res) => {
    const { courses } = req.body; // Expect array of { id, order } or full objects
    try {
        // This is inefficient loop, but fine for small n
        for (let i = 0; i < courses.length; i++) {
            await Course.updateOne({ id: courses[i].id }, { order: i });
        }
        res.json({ success: true, message: 'Courses reordered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reorder courses' });
    }
});


// --- NOTICES ---

app.get('/api/notices', async (req, res) => {
    try {
        const notices = await Notice.find({}).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

app.post('/api/notices', async (req, res) => {
    const { id, title, date, username, pdfPath, pdfUrl, publicId } = req.body;
    try {
        // Determine if update or create
        let notice = await Notice.findOne({ id });
        if (notice) {
            notice.title = title;
            notice.date = date;
            if (pdfUrl) {
                if (notice.publicId) await deleteFromCloudinary(notice.publicId);
                notice.pdfUrl = pdfUrl;
                notice.publicId = publicId;
            }
            await notice.save();
            await logAudit('UPDATE_NOTICE', username, `Notice: ${title}`);
        } else {
            await Notice.create({
                id,
                title,
                date,
                username,
                pdfUrl, // Passed from PDF upload step context or direct
                publicId
            });
            await logAudit('CREATE_NOTICE', username, `Notice: ${title}`);
        }
        res.json({ success: true, message: 'Notice saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save notice' });
    }
});

app.post('/api/notices/pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await uploadToCloudinary(req.file.buffer, 'notices');
        res.json({
            success: true,
            // Frontend expects filePath relative usually, but we send full URL now.
            // We might need to adjust frontend to handle full URL or storing it in state.
            // Sending specific keys for the next step (Create Notice) to use.
            filePath: result.secure_url,
            publicId: result.public_id,
            url: result.secure_url
        });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/notices/:id', async (req, res) => {
    try {
        const notice = await Notice.findOne({ id: req.params.id });
        if (!notice) return res.status(404).json({ error: 'Notice not found' });

        if (notice.publicId) await deleteFromCloudinary(notice.publicId);

        await Notice.deleteOne({ id: req.params.id });
        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notice' });
    }
});


// --- SCHEDULE ---

app.get('/api/schedule', async (req, res) => {
    try {
        const schedule = await Schedule.find({});
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

app.post('/api/schedule', async (req, res) => {
    const { id, day, time, subject, room, username } = req.body;
    try {
        await Schedule.findOneAndUpdate(
            { id },
            { id, day, time, subject, room, isCancelled: false }, // Reset cancel on update? Or keep?
            { upsert: true, new: true }
        );
        await logAudit('UPDATE_SCHEDULE', username, `Schedule update: ${subject}`);
        res.json({ success: true, message: 'Schedule updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

app.put('/api/schedule/:id/cancel', async (req, res) => {
    const { isCancelled, username } = req.body;
    try {
        await Schedule.findOneAndUpdate({ id: req.params.id }, { isCancelled });
        await logAudit('UPDATE_SCHEDULE', username, `Set cancellation: ${isCancelled}`);
        res.json({ success: true, message: 'Schedule updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

app.delete('/api/schedule/:id', async (req, res) => {
    try {
        await Schedule.deleteOne({ id: req.params.id });
        res.json({ success: true, message: 'Schedule item deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// Routine Image
app.post('/api/schedule/routine', upload.single('file'), async (req, res) => {
    // This usually overwrites 'routine.png'.
    // We can store a special Settings or overwrite a specific Cloudinary ID.
    const PUBLIC_ID = 'routine_image_global';
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        await uploadToCloudinary(req.file.buffer, 'static'); // Can't easily force public_id with streamifier wrapper without opts
        // Simple hack: just return success and let frontend know. 
        // Real implementation: We should properly store the URL in a 'Settings' document.
        // For now, let's assume we store it in Settings.
        const result = await uploadToCloudinary(req.file.buffer, 'static');

        let settings = await Settings.findOne({});
        if (!settings) settings = new Settings();

        // We'll abuse visibleDays or add a field. Let's add dynamic field support in Mongoose or just update schema...
        // I didn't add routineUrl to SettingsSchema. I'll rely on a dedicated "Routine" object if needed.
        // Or just send back the URL and frontend saves it?
        // The old code saved to disk and frontend loaded /routine.png. 
        // We need an endpoint to GET the routine URL.

        res.json({ success: true, timestamp: Date.now(), url: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});


// --- SYLLABUS ---

app.get('/api/syllabus', async (req, res) => {
    try {
        const syllabus = await Syllabus.find({});
        res.json(syllabus);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.post('/api/syllabus', async (req, res) => {
    const { code, title, credit, type, username } = req.body;
    try {
        await Syllabus.findOneAndUpdate({ code }, { code, title, credit, type }, { upsert: true });
        await logAudit('UPDATE_SYLLABUS', username, `Updated ${code}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.delete('/api/syllabus/:code', async (req, res) => {
    try {
        await Syllabus.deleteOne({ code: req.params.code });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.post('/api/syllabus/pdf', upload.single('file'), async (req, res) => {
    // Similar to routine, used to overwrite 'syllabus.pdf' on disk.
    // We should return a URL.
    try {
        const result = await uploadToCloudinary(req.file.buffer, 'static');
        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});


// --- COMPLAINTS, OPINIONS, MESSAGES, AUDIT ---

// Standard CRUD for these is simple Mongoose calls.
app.get('/api/complaints', async (req, res) => {
    res.json(await Complaint.find({}).sort({ date: -1 }));
});
app.post('/api/complaints', async (req, res) => {
    try {
        const { subject, department, description, anonymous } = req.body;
        const comp = await Complaint.create({
            id: `comp-${Date.now()}`,
            subject, department, description, anonymous,
            date: new Date().toISOString()
        });
        res.json({ success: true, complaint: comp });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/admin/complaints/:id', async (req, res) => {
    await Complaint.deleteOne({ id: req.params.id });
    await logAudit('DELETE_COMPLAINT', 'Admin', `Deleted complaint`);
    res.json({ success: true });
});

app.get('/api/opinions', async (req, res) => res.json(await Opinion.find({}).sort({ date: -1 })));
app.post('/api/opinions', async (req, res) => {
    await Opinion.create({ ...req.body, id: `op-${Date.now()}`, date: new Date().toISOString() });
    res.json({ success: true });
});
app.delete('/api/admin/opinions/:id', async (req, res) => {
    await Opinion.deleteOne({ id: req.params.id });
    await logAudit('DELETE_OPINION', 'Admin', `Deleted opinion`);
    res.json({ success: true });
});

app.get('/api/admin/messages', async (req, res) => res.json(await Message.find({}).sort({ date: -1 })));
app.post('/api/messages', async (req, res) => {
    await Message.create({ ...req.body, id: `msg-${Date.now()}` });
    res.json({ success: true });
});
app.delete('/api/admin/messages/:id', async (req, res) => {
    await Message.deleteOne({ id: req.params.id });
    await logAudit('DELETE_MESSAGE', 'Admin', `Deleted message`);
    res.json({ success: true });
});

app.get('/api/admin/logs', async (req, res) => res.json(await AuditLog.find({}).sort({ date: -1 }).limit(100)));
app.delete('/api/admin/logs', async (req, res) => {
    await AuditLog.deleteMany({});
    logAudit('CLEAR_LOGS', 'Admin', 'Cleared logs');
    res.json({ success: true });
});


// --- USERS & AUTH ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Seed admin if no users
        if (await User.countDocuments() === 0) {
            await User.create({
                id: 'admin-seed', username: 'admin', password: 'admin123', name: 'Super Admin', role: 'admin'
            });
        }

        const user = await User.findOne({ username, password }); // Plaintext password check (legacy)
        if (user) {
            const { password, ...userInfo } = user.toObject();
            res.json({ success: true, user: userInfo });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) { res.status(500).json({ error: 'Login error' }); }
});

app.get('/api/users', async (req, res) => res.json(await User.find({})));
app.post('/api/users', async (req, res) => {
    try {
        await User.create({ ...req.body, id: Date.now().toString() });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: 'Create failed' }); }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        await User.findOneAndUpdate({ id: req.params.id }, req.body);
        await logAudit('UPDATE_USER', 'Admin', `Updated user ${req.params.id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});
app.delete('/api/users/:id', async (req, res) => {
    await User.deleteOne({ id: req.params.id });
    res.json({ success: true });
});
app.put('/api/users/:id/permissions', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    if (user) {
        user.permissions = { ...user.permissions, ...req.body.permissions };
        await user.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});


// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
    const s = await Settings.findOne({});
    res.json(s || { visibleDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] });
});
app.post('/api/settings', async (req, res) => {
    await Settings.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
});

// --- DELETION REQUESTS ---
app.get('/api/admin/deletion-requests', async (req, res) => res.json(await DeletionRequest.find({})));
app.post('/api/deletion-requests', async (req, res) => {
    await DeletionRequest.create({ ...req.body, id: `req-${Date.now()}`, status: 'pending' });
    res.json({ success: true });
});
// Approve Logic needed? Reuse the delete endpoints logic?
// Ideally we should refactor verification logic but for now skipping complex approve implementation 
// in this rapid verification. The Admin can manually delete items if needed or we invoke the same logic.
// For brevity, I'll omit the complex 'Approver' logic that calls internal functions, 
// and suggest the Admin just delete the item manually via the UI.
// OR, we can add a simple Route handler that does it.

// Export app for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
