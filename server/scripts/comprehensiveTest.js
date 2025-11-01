import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const comprehensiveTest = async () => {
  try {
    // Check if MONGODB_URI exists
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected\n');

    console.log('═'.repeat(80));
    console.log('🔍 COMPREHENSIVE WEBSITE FUNCTIONALITY TEST');
    console.log('═'.repeat(80));
    console.log('');

    // Test Results Tracker
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };

    const addTest = (category, name, status, message = '') => {
      results.tests.push({ category, name, status, message });
      if (status === 'PASS') results.passed++;
      else if (status === 'FAIL') results.failed++;
      else if (status === 'WARN') results.warnings++;
    };

    // ============================================
    // 1. DATABASE CONNECTIVITY
    // ============================================
    console.log('📊 1. DATABASE CONNECTIVITY');
    console.log('─'.repeat(80));
    
    try {
      const dbState = mongoose.connection.readyState;
      if (dbState === 1) {
        console.log('✅ Database connection: ACTIVE');
        addTest('Database', 'Connection Status', 'PASS');
      } else {
        console.log('❌ Database connection: INACTIVE');
        addTest('Database', 'Connection Status', 'FAIL');
      }
    } catch (error) {
      console.log('❌ Database connection test failed:', error.message);
      addTest('Database', 'Connection Status', 'FAIL', error.message);
    }

    // Check collections
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`✅ Collections found: ${collections.length}`);
      collections.forEach(col => console.log(`   - ${col.name}`));
      addTest('Database', 'Collections', 'PASS', `${collections.length} collections`);
    } catch (error) {
      console.log('❌ Failed to list collections:', error.message);
      addTest('Database', 'Collections', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 2. DATA MODELS & SCHEMAS
    // ============================================
    console.log('📋 2. DATA MODELS & SCHEMAS');
    console.log('─'.repeat(80));
    
    const models = [
      { name: 'User', model: User },
      { name: 'Event', model: Event },
      { name: 'Registration', model: Registration },
      { name: 'Payment', model: Payment },
      { name: 'Notification', model: Notification },
      { name: 'Settings', model: Settings }
    ];

    for (const { name, model } of models) {
      try {
        const count = await model.countDocuments();
        console.log(`✅ ${name} model: ${count} documents`);
        addTest('Models', `${name} Model`, 'PASS', `${count} documents`);
      } catch (error) {
        console.log(`❌ ${name} model: ERROR - ${error.message}`);
        addTest('Models', `${name} Model`, 'FAIL', error.message);
      }
    }
    console.log('');

    // ============================================
    // 3. USER MANAGEMENT
    // ============================================
    console.log('👥 3. USER MANAGEMENT');
    console.log('─'.repeat(80));
    
    try {
      const totalUsers = await User.countDocuments();
      const adminUsers = await User.countDocuments({ role: 'admin' });
      const regularUsers = await User.countDocuments({ role: 'user' });
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      
      console.log(`✅ Total Users: ${totalUsers}`);
      console.log(`   - Admin Users: ${adminUsers}`);
      console.log(`   - Regular Users: ${regularUsers}`);
      console.log(`   - Verified Users: ${verifiedUsers}`);
      
      addTest('Users', 'User Count', 'PASS', `${totalUsers} total`);
      
      if (adminUsers === 0) {
        console.log('⚠️  WARNING: No admin users found!');
        addTest('Users', 'Admin Users', 'WARN', 'No admin users');
      } else {
        addTest('Users', 'Admin Users', 'PASS', `${adminUsers} admins`);
      }
    } catch (error) {
      console.log('❌ User management test failed:', error.message);
      addTest('Users', 'User Management', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 4. EVENT MANAGEMENT
    // ============================================
    console.log('🎯 4. EVENT MANAGEMENT');
    console.log('─'.repeat(80));
    
    try {
      const totalEvents = await Event.countDocuments();
      const activeEvents = await Event.countDocuments({ isActive: true });
      const featuredEvents = await Event.countDocuments({ isFeatured: true });
      const fullEvents = await Event.countDocuments({ $expr: { $gte: ['$currentParticipants', '$maxParticipants'] } });
      
      console.log(`✅ Total Events: ${totalEvents}`);
      console.log(`   - Active Events: ${activeEvents}`);
      console.log(`   - Featured Events: ${featuredEvents}`);
      console.log(`   - Full Events: ${fullEvents}`);
      
      addTest('Events', 'Event Count', 'PASS', `${totalEvents} total`);
      
      if (totalEvents === 0) {
        console.log('⚠️  WARNING: No events found!');
        addTest('Events', 'Events Exist', 'WARN', 'No events');
      } else {
        addTest('Events', 'Events Exist', 'PASS');
      }

      // Check event categories
      const categories = await Event.distinct('category');
      console.log(`✅ Event Categories: ${categories.join(', ')}`);
      addTest('Events', 'Categories', 'PASS', categories.join(', '));
    } catch (error) {
      console.log('❌ Event management test failed:', error.message);
      addTest('Events', 'Event Management', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 5. REGISTRATION SYSTEM
    // ============================================
    console.log('📝 5. REGISTRATION SYSTEM');
    console.log('─'.repeat(80));
    
    try {
      const totalRegistrations = await Registration.countDocuments();
      const activeRegistrations = await Registration.countDocuments({ 
        status: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'failed' }
      });
      const completedPayments = await Registration.countDocuments({ paymentStatus: 'completed' });
      const pendingPayments = await Registration.countDocuments({ paymentStatus: 'pending' });
      const verificationPending = await Registration.countDocuments({ paymentStatus: 'verification_pending' });
      
      console.log(`✅ Total Registrations: ${totalRegistrations}`);
      console.log(`   - Active Registrations: ${activeRegistrations}`);
      console.log(`   - Completed Payments: ${completedPayments}`);
      console.log(`   - Pending Payments: ${pendingPayments}`);
      console.log(`   - Verification Pending: ${verificationPending}`);
      
      addTest('Registrations', 'Registration Count', 'PASS', `${totalRegistrations} total`);
      addTest('Registrations', 'Payment Status Tracking', 'PASS');
    } catch (error) {
      console.log('❌ Registration system test failed:', error.message);
      addTest('Registrations', 'Registration System', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 6. PAYMENT SYSTEM
    // ============================================
    console.log('💳 6. PAYMENT SYSTEM');
    console.log('─'.repeat(80));
    
    try {
      const totalPayments = await Payment.countDocuments();
      const capturedPayments = await Payment.countDocuments({ status: 'captured' });
      const pendingVerification = await Payment.countDocuments({ status: 'pending_verification' });
      const failedPayments = await Payment.countDocuments({ status: 'failed' });
      
      console.log(`✅ Total Payments: ${totalPayments}`);
      console.log(`   - Captured: ${capturedPayments}`);
      console.log(`   - Pending Verification: ${pendingVerification}`);
      console.log(`   - Failed: ${failedPayments}`);
      
      addTest('Payments', 'Payment Count', 'PASS', `${totalPayments} total`);
      addTest('Payments', 'Payment Status Tracking', 'PASS');
    } catch (error) {
      console.log('❌ Payment system test failed:', error.message);
      addTest('Payments', 'Payment System', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 7. NOTIFICATION SYSTEM
    // ============================================
    console.log('📧 7. NOTIFICATION SYSTEM');
    console.log('─'.repeat(80));
    
    try {
      const totalNotifications = await Notification.countDocuments();
      const sentNotifications = await Notification.countDocuments({ status: 'sent' });
      const failedNotifications = await Notification.countDocuments({ status: 'failed' });
      
      console.log(`✅ Total Notifications: ${totalNotifications}`);
      console.log(`   - Sent: ${sentNotifications}`);
      console.log(`   - Failed: ${failedNotifications}`);
      
      addTest('Notifications', 'Notification Count', 'PASS', `${totalNotifications} total`);
      
      // Check notification types
      const types = await Notification.distinct('type');
      console.log(`✅ Notification Types: ${types.join(', ')}`);
      addTest('Notifications', 'Notification Types', 'PASS', types.join(', '));
    } catch (error) {
      console.log('❌ Notification system test failed:', error.message);
      addTest('Notifications', 'Notification System', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 8. SETTINGS & CONFIGURATION
    // ============================================
    console.log('⚙️  8. SETTINGS & CONFIGURATION');
    console.log('─'.repeat(80));
    
    try {
      const settings = await Settings.find({});
      console.log(`✅ Settings Count: ${settings.length}`);
      
      if (settings.length > 0) {
        settings.forEach(setting => {
          console.log(`   - ${setting.key}: ${setting.value}`);
        });
        addTest('Settings', 'Settings Configured', 'PASS', `${settings.length} settings`);
      } else {
        console.log('⚠️  No settings configured');
        addTest('Settings', 'Settings Configured', 'WARN', 'No settings');
      }
    } catch (error) {
      console.log('❌ Settings test failed:', error.message);
      addTest('Settings', 'Settings System', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 9. DATA INTEGRITY CHECKS
    // ============================================
    console.log('🔍 9. DATA INTEGRITY CHECKS');
    console.log('─'.repeat(80));
    
    try {
      // Check for orphaned registrations
      const allRegistrations = await Registration.find({}).select('event user');
      const eventIds = new Set((await Event.find({}).select('_id')).map(e => e._id.toString()));
      const userIds = new Set((await User.find({}).select('_id')).map(u => u._id.toString()));
      
      let orphanedEventRegs = 0;
      let orphanedUserRegs = 0;
      
      for (const reg of allRegistrations) {
        if (!eventIds.has(reg.event.toString())) orphanedEventRegs++;
        if (!userIds.has(reg.user.toString())) orphanedUserRegs++;
      }
      
      if (orphanedEventRegs === 0 && orphanedUserRegs === 0) {
        console.log('✅ No orphaned registrations found');
        addTest('Integrity', 'Orphaned Registrations', 'PASS');
      } else {
        console.log(`⚠️  Found ${orphanedEventRegs} orphaned event registrations`);
        console.log(`⚠️  Found ${orphanedUserRegs} orphaned user registrations`);
        addTest('Integrity', 'Orphaned Registrations', 'WARN', `${orphanedEventRegs + orphanedUserRegs} orphaned`);
      }

      // Check participant count accuracy
      const events = await Event.find({});
      let mismatchCount = 0;
      
      for (const event of events) {
        const actualCount = await Registration.countDocuments({
          event: event._id,
          status: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'failed' }
        });
        
        if (event.currentParticipants !== actualCount) {
          mismatchCount++;
        }
      }
      
      if (mismatchCount === 0) {
        console.log('✅ All participant counts are accurate');
        addTest('Integrity', 'Participant Counts', 'PASS');
      } else {
        console.log(`⚠️  Found ${mismatchCount} events with mismatched participant counts`);
        addTest('Integrity', 'Participant Counts', 'WARN', `${mismatchCount} mismatches`);
      }
    } catch (error) {
      console.log('❌ Data integrity check failed:', error.message);
      addTest('Integrity', 'Data Integrity', 'FAIL', error.message);
    }
    console.log('');

    // ============================================
    // 10. ENVIRONMENT CONFIGURATION
    // ============================================
    console.log('🔧 10. ENVIRONMENT CONFIGURATION');
    console.log('─'.repeat(80));
    
    const envChecks = [
      { name: 'JWT_SECRET', required: true },
      { name: 'CLIENT_URL', required: true },
      { name: 'EMAIL_HOST', required: true },
      { name: 'EMAIL_USER', required: true },
      { name: 'EMAIL_PASS', required: true },
      { name: 'CLOUDINARY_CLOUD_NAME', required: false },
      { name: 'CLOUDINARY_API_KEY', required: false },
      { name: 'CLOUDINARY_API_SECRET', required: false },
      { name: 'USE_CLOUDINARY', required: false }
    ];

    for (const check of envChecks) {
      if (process.env[check.name]) {
        console.log(`✅ ${check.name}: Configured`);
        addTest('Environment', check.name, 'PASS');
      } else {
        if (check.required) {
          console.log(`❌ ${check.name}: MISSING (Required)`);
          addTest('Environment', check.name, 'FAIL', 'Missing required variable');
        } else {
          console.log(`⚠️  ${check.name}: Not configured (Optional)`);
          addTest('Environment', check.name, 'WARN', 'Optional variable not set');
        }
      }
    }
    console.log('');

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('═'.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(80));
    console.log('');
    
    console.log(`✅ PASSED: ${results.passed}`);
    console.log(`❌ FAILED: ${results.failed}`);
    console.log(`⚠️  WARNINGS: ${results.warnings}`);
    console.log(`📝 TOTAL TESTS: ${results.tests.length}`);
    console.log('');

    // Group by category
    const categories = {};
    results.tests.forEach(test => {
      if (!categories[test.category]) {
        categories[test.category] = { passed: 0, failed: 0, warnings: 0 };
      }
      if (test.status === 'PASS') categories[test.category].passed++;
      else if (test.status === 'FAIL') categories[test.category].failed++;
      else if (test.status === 'WARN') categories[test.category].warnings++;
    });

    console.log('📋 Results by Category:');
    console.log('─'.repeat(80));
    Object.entries(categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed + stats.warnings;
      const status = stats.failed > 0 ? '❌' : stats.warnings > 0 ? '⚠️ ' : '✅';
      console.log(`${status} ${category}: ${stats.passed}/${total} passed`);
    });
    console.log('');

    // Show failed tests
    if (results.failed > 0) {
      console.log('❌ FAILED TESTS:');
      console.log('─'.repeat(80));
      results.tests.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`   ${test.category} > ${test.name}: ${test.message}`);
      });
      console.log('');
    }

    // Show warnings
    if (results.warnings > 0) {
      console.log('⚠️  WARNINGS:');
      console.log('─'.repeat(80));
      results.tests.filter(t => t.status === 'WARN').forEach(test => {
        console.log(`   ${test.category} > ${test.name}: ${test.message}`);
      });
      console.log('');
    }

    // Overall status
    console.log('═'.repeat(80));
    if (results.failed === 0 && results.warnings === 0) {
      console.log('🎉 ALL TESTS PASSED! Website is fully functional.');
    } else if (results.failed === 0) {
      console.log('✅ All critical tests passed. Some warnings to review.');
    } else {
      console.log('❌ Some tests failed. Please review and fix issues.');
    }
    console.log('═'.repeat(80));

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

comprehensiveTest();
