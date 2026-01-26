import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Import Models
import Course from '../src/models/Course.js';
import Notice from '../src/models/Notice.js';
import Schedule from '../src/models/Schedule.js';
import AuditLog from '../src/models/AuditLog.js';
import Complaint from '../src/models/Complaint.js';
import Opinion from '../src/models/Opinion.js';
import Syllabus from '../src/models/Syllabus.js';
import User from '../src/models/User.js';
import Message from '../src/models/Message.js';
import Settings from '../src/models/Settings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Configure Cloudinary Manually
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const connectDB = async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
};

const uploadFile = async (filePath, folder) => {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found, skipping: ${filePath}`);
        return null;
    }
    try {
        const result = await cloudinary.uploader.upload(filePath, { folder });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (e) {
        console.error(`❌ Upload failed for ${filePath}:`, e.message);
        return null;
    }
};

const migrate = async () => {
    await connectDB();

    // 1. Users
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data/users.json'))) {
        const users = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/users.json'), 'utf8'));
        console.log(`Migrating ${users.length} Users...`);
        for (const u of users) {
            await User.findOneAndUpdate({ id: u.id }, u, { upsert: true });
        }
    }

    // 2. Syllabus
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data/syllabus.json'))) {
        const syllabus = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/syllabus.json'), 'utf8'));
        console.log(`Migrating ${syllabus.length} Syllabus items...`);
        for (const s of syllabus) {
            await Syllabus.findOneAndUpdate({ code: s.code }, s, { upsert: true });
        }
    }

    // 3. Schedule
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data/schedule.json'))) {
        const schedule = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/schedule.json'), 'utf8'));
        console.log(`Migrating ${schedule.length} Schedule items...`);
        for (const s of schedule) {
            await Schedule.findOneAndUpdate({ id: s.id }, s, { upsert: true });
        }
    }

    // 4. Notices (With PDF Uploads)
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data/notices.json'))) {
        const notices = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/notices.json'), 'utf8'));
        console.log(`Migrating ${notices.length} Notices...`);
        for (const n of notices) {
            let pdfInfo = {};
            if (n.pdfPath) {
                // pdfPath is like '/notices/notice-123.pdf' -> public/notices/notice-123.pdf
                const localPath = path.join(PROJECT_ROOT, 'public', n.pdfPath);
                const upload = await uploadFile(localPath, 'notices');
                if (upload) {
                    pdfInfo = { pdfUrl: upload.url, publicId: upload.publicId };
                }
            }
            await Notice.findOneAndUpdate({ id: n.id }, { ...n, ...pdfInfo }, { upsert: true });
        }
    }

    // 5. Courses (With File Uploads)
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data/courses.json'))) {
        const courses = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/courses.json'), 'utf8'));
        console.log(`Migrating ${courses.length} Courses...`);

        for (const c of courses) {
            // Process files
            const newFiles = [];
            if (c.files) {
                for (const f of c.files) {
                    // f.path is like '/materials/CSE101/lecture.pdf'
                    const localPath = path.join(PROJECT_ROOT, 'public', f.path);
                    const upload = await uploadFile(localPath, `materials/${c.id}`);
                    if (upload) {
                        newFiles.push({
                            ...f,
                            url: upload.url,
                            publicId: upload.publicId
                        });
                    } else {
                        // Keep metadata even if file missing? prefer skipping to avoid broken links
                        console.warn(`Skipping missing file record: ${f.name}`);
                    }
                }
            }
            c.files = newFiles;
            await Course.findOneAndUpdate({ id: c.id }, c, { upsert: true });
        }
    }

    // 6. Others (Simple)
    const simpleCollections = [
        { file: 'complaints.json', model: Complaint, key: 'id' },
        { file: 'opinions.json', model: Opinion, key: 'id' },
        { file: 'messages.json', model: Message, key: 'id' },
        { file: 'audit_logs.json', model: AuditLog, key: 'id' },
        { file: 'settings.json', model: Settings, key: null } // Singleton
    ];

    for (const { file, model, key } of simpleCollections) {
        if (fs.existsSync(path.join(PROJECT_ROOT, 'src/data', file))) {
            const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data', file), 'utf8'));
            console.log(`Migrating ${file}...`);
            if (key) {
                if (Array.isArray(data)) {
                    for (const item of data) {
                        await model.findOneAndUpdate({ [key]: item[key] }, item, { upsert: true });
                    }
                }
            } else {
                // Singleton Settings
                await model.findOneAndUpdate({}, data, { upsert: true });
            }
        }
    }

    console.log('✅ Migration Complete!');
    process.exit(0);
};

migrate().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
