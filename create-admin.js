/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      console.log('❌ Admin user already exists. Cannot create another admin.');
      console.log('Existing admin email:', existingAdmin.email);
      return;
    }

    // Get admin credentials from environment variables or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@draftboard.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminName = process.env.ADMIN_NAME || 'Site Administrator';

    console.log('📧 Admin Email:', adminEmail);
    console.log('👤 Admin Name:', adminName);
    console.log('🔑 Admin Password:', adminPassword);

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin user
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: adminName,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('🆔 Admin ID:', admin.id);
    console.log('📧 Admin Email:', admin.email);
    console.log('👤 Admin Name:', admin.fullName);
    console.log('🔑 Admin Role:', admin.role);
    console.log('');
    console.log('🚀 You can now login at: /admin/login');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
