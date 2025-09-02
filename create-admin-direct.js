/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdminDirect() {
  try {
    console.log('🔍 Checking database for admin accounts...');
    
    // Check if any admin exists
    const existingAdmins = await prisma.admin.findMany();
    console.log(`Found ${existingAdmins.length} admin account(s)`);
    
    if (existingAdmins.length > 0) {
      console.log('Existing admins:');
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.fullName}) - Active: ${admin.isActive}`);
      });
      
      // Test the password for the first admin
      const admin = existingAdmins[0];
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log(`Password "admin123" valid for ${admin.email}: ${isValid}`);
      
      if (!isValid) {
        console.log('🔄 Updating password...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await prisma.admin.update({
          where: { id: admin.id },
          data: { password: newHash }
        });
        console.log('✅ Password updated!');
      }
    } else {
      console.log('❌ No admin accounts found. Creating one...');
      
      const adminEmail = 'admin@gmail.com';
      const adminPassword = 'admin123';
      const adminName = 'Site Administrator';
      
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
    }
    
    console.log('');
    console.log('🚀 Admin login credentials:');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login URL: /admin/login');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminDirect();

