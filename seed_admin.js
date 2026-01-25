import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminUser = await User.findOne({ username: 'admin' });
        if (adminUser) {
            console.log('Admin user exists. Updating password...');
            adminUser.password = 'admin123';
            adminUser.role = 'admin';
            await adminUser.save();
        } else {
            console.log('Creating admin user...');
            await User.create({
                username: 'admin',
                password: 'admin123',
                name: 'System Admin',
                role: 'admin',
                permissions: {}
            });
        }
        console.log('Admin user ready: admin / admin123');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedAdmin();
