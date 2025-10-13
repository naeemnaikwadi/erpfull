const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@erp-system.com',
      password: hashedPassword,
      role: 'admin',
      accessLevel: 'super_admin',
      permissions: ['all'],
      isActive: true
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@erp-system.com');
    console.log('🔑 Password: admin123');
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Create sample ERP staff
const createERPStaff = async (adminId) => {
  try {
    const staffRoles = [
      { role: 'admission_officer', name: 'Admission Officer', email: 'admission@erp-system.com' },
      { role: 'fee_manager', name: 'Fee Manager', email: 'fees@erp-system.com' },
      { role: 'hostel_manager', name: 'Hostel Manager', email: 'hostel@erp-system.com' },
      { role: 'exam_controller', name: 'Exam Controller', email: 'exams@erp-system.com' },
      { role: 'accountant', name: 'Accountant', email: 'accountant@erp-system.com' },
      { role: 'registrar', name: 'Registrar', email: 'registrar@erp-system.com' }
    ];

    for (const staff of staffRoles) {
      const existingStaff = await User.findOne({ email: staff.email });
      if (existingStaff) {
        console.log(`✅ ${staff.role} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash('staff123', 10);
      
      await User.create({
        name: staff.name,
        email: staff.email,
        password: hashedPassword,
        role: staff.role,
        accessLevel: 'intermediate',
        permissions: getRolePermissions(staff.role),
        createdBy: adminId,
        isActive: true
      });

      console.log(`✅ ${staff.role} created successfully`);
    }
  } catch (error) {
    console.error('❌ Error creating ERP staff:', error);
  }
};

// Create sample hostels
const createSampleHostels = async (adminId) => {
  try {
    const hostels = [
      {
        name: 'Boys Hostel A',
        type: 'Boys',
        address: {
          street: '123 University Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        totalRooms: 50,
        totalCapacity: 200,
        currentOccupancy: 0,
        monthlyRent: 5000,
        securityDeposit: 10000,
        amenities: [
          { name: 'WiFi', description: 'High-speed internet', available: true },
          { name: 'Laundry', description: 'Washing machines', available: true },
          { name: 'Gym', description: 'Fitness center', available: true }
        ],
        createdBy: adminId
      },
      {
        name: 'Girls Hostel B',
        type: 'Girls',
        address: {
          street: '456 University Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        totalRooms: 40,
        totalCapacity: 160,
        currentOccupancy: 0,
        monthlyRent: 5000,
        securityDeposit: 10000,
        amenities: [
          { name: 'WiFi', description: 'High-speed internet', available: true },
          { name: 'Laundry', description: 'Washing machines', available: true },
          { name: 'Study Room', description: 'Quiet study area', available: true }
        ],
        createdBy: adminId
      }
    ];

    for (const hostelData of hostels) {
      const existingHostel = await Hostel.findOne({ name: hostelData.name });
      if (existingHostel) {
        console.log(`✅ ${hostelData.name} already exists`);
        continue;
      }

      const hostel = await Hostel.create(hostelData);
      console.log(`✅ ${hostelData.name} created successfully`);

      // Create sample rooms for each hostel
      await createSampleRooms(hostel._id, adminId);
    }
  } catch (error) {
    console.error('❌ Error creating sample hostels:', error);
  }
};

// Create sample rooms
const createSampleRooms = async (hostelId, adminId) => {
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return;

    const roomsPerFloor = Math.ceil(hostel.totalRooms / 4); // Assuming 4 floors
    const roomTypes = ['Single', 'Double', 'Triple', 'Quad'];

    for (let floor = 1; floor <= 4; floor++) {
      for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
        const roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`;
        const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const capacity = roomType === 'Single' ? 1 : 
                        roomType === 'Double' ? 2 : 
                        roomType === 'Triple' ? 3 : 4;

        await Room.create({
          roomNumber,
          floorNumber: floor,
          hostelId,
          capacity,
          roomType,
          status: 'Available',
          monthlyRent: hostel.monthlyRent,
          securityDeposit: hostel.securityDeposit,
          createdBy: adminId
        });
      }
    }

    console.log(`✅ Sample rooms created for hostel ${hostel.name}`);
  } catch (error) {
    console.error('❌ Error creating sample rooms:', error);
  }
};

// Helper function to get role permissions
const getRolePermissions = (role) => {
  const permissions = {
    admission_officer: ['view_admissions', 'create_admissions', 'update_admissions', 'approve_admissions'],
    fee_manager: ['view_fees', 'create_fees', 'update_fees', 'process_payments', 'generate_receipts'],
    hostel_manager: ['view_hostels', 'manage_hostels', 'allocate_rooms', 'manage_allocations'],
    exam_controller: ['view_exams', 'create_exams', 'manage_papers', 'publish_results'],
    accountant: ['view_financials', 'create_transactions', 'generate_reports', 'manage_accounts'],
    registrar: ['view_transcripts', 'create_transcripts', 'issue_certificates', 'manage_records']
  };
  
  return permissions[role] || [];
};

// Main setup function
const setupERPSystem = async () => {
  try {
    console.log('🚀 Setting up ERP System...\n');

    // Connect to database
    await connectDB();

    // Create admin user
    const admin = await createAdminUser();

    // Create ERP staff
    await createERPStaff(admin._id);

    // Create sample hostels and rooms
    await createSampleHostels(admin._id);

    console.log('\n✅ ERP System setup completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@erp-system.com / admin123');
    console.log('Admission Officer: admission@erp-system.com / staff123');
    console.log('Fee Manager: fees@erp-system.com / staff123');
    console.log('Hostel Manager: hostel@erp-system.com / staff123');
    console.log('Exam Controller: exams@erp-system.com / staff123');
    console.log('Accountant: accountant@erp-system.com / staff123');
    console.log('Registrar: registrar@erp-system.com / staff123');
    console.log('\n🔧 Next Steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Start the client: cd client && npm start');
    console.log('3. Access the system at http://localhost:3000');
    console.log('4. Change default passwords after first login');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run setup
setupERPSystem();
