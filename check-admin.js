/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAndUpdateAdmin() {
  try {
    console.log('🔍 Checking admin account...');
    
    // Find the admin user
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('✅ Admin found:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.fullName);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.isActive);

    // Test the current password
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('  Password "admin123" valid:', isValid);

    if (!isValid) {
      console.log('🔄 Updating password to "admin123"...');
      const newHash = await bcrypt.hash(testPassword, 10);
      
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: newHash }
      });
      
      console.log('✅ Password updated successfully!');
      console.log('🔑 New password: admin123');
    } else {
      console.log('✅ Password is already correct');
    }

    console.log('');
    console.log('🚀 You can now login at: /admin/login');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateAdmin();

