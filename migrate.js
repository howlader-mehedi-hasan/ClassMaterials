import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Course from './src/models/Course.js';
import Notice from './src/models/Notice.js';
import Complaint from './src/models/Complaint.js';
import Opinion from './src/models/Opinion.js';
import Schedule from './src/models/Schedule.js';
import AuditLog from './src/models/AuditLog.js';
import Syllabus from './src/models/Syllabus.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
    try {
        await connectDB();

        const readJson = (file) => {
            const filePath = path.join(__dirname, 'src', 'data', file);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            return [];
        };

        // Users
        const users = readJson('users.json');
        if (users.length > 0) {
            await User.deleteMany();
            await User.insertMany(users);
            console.log('Users Imported!');
        }

        // Courses
        const courses = readJson('courses.json');
        if (courses.length > 0) {
            await Course.deleteMany();
            // Map files path to Cloudinary format if needed? 
            // For now, keep as is, but Cloudinary migration is separate for files.
            // We just migrate metadata here.
            await Course.insertMany(courses);
            console.log('Courses Imported!');
        }

        // Notices
        const notices = readJson('notices.json');
        if (notices.length > 0) {
            await Notice.deleteMany();
            await Notice.insertMany(notices);
            console.log('Notices Imported!');
        }

        // Complaints
        const complaints = readJson('complaints.json');
        if (complaints.length > 0) {
            await Complaint.deleteMany();
            await Complaint.insertMany(complaints);
            console.log('Complaints Imported!');
        }

        // Opinions
        const opinions = readJson('opinions.json');
        if (opinions.length > 0) {
            await Opinion.deleteMany();
            await Opinion.insertMany(opinions);
            console.log('Opinions Imported!');
        }

        // Schedule
        const schedule = readJson('schedule.json');
        if (schedule.length > 0) {
            await Schedule.deleteMany();
            await Schedule.insertMany(schedule);
            console.log('Schedule Imported!');
        }

        // Audit Logs
        const logs = readJson('audit_logs.json');
        if (logs.length > 0) {
            await AuditLog.deleteMany();
            // Map 'id' to 'originalId' if needed
            const logsToInsert = logs.map(l => ({ ...l, originalId: l.id }));
            await AuditLog.insertMany(logsToInsert);
            console.log('Audit Logs Imported!');
        }

        // Syllabus
        const syllabus = readJson('syllabus.json');
        if (syllabus.length > 0) {
            await Syllabus.deleteMany();
            await Syllabus.insertMany(syllabus);
            console.log('Syllabus Imported!');
        }

        console.log('Data Migration Completed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
