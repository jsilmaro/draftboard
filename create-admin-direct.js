/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    const adminEmail = 'admin@draftboard.com';
    const adminPassword = 'admin123456';
    const adminFullName = 'System Administrator';
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: adminFullName,
        role: 'super_admin',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 Admin ID:', admin.id);
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

