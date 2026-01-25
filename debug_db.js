
import mongoose from 'mongoose';
import Course from './src/models/Course.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({});
        console.log("Total courses:", courses.length);
        courses.forEach(c => {
            console.log(`Course: ${c.name}, id: ${c.id}, _id: ${c._id}`);
            if (c.files && c.files.length > 0) {
                console.log(`  Files: ${c.files.length}`);
                c.files.forEach(f => console.log(`    File: ${f.name}, id: ${f.id}`));
            } else {
                console.log("  No files");
            }
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
