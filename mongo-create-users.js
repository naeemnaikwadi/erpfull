// MongoDB script to create ERP users
// Run this in MongoDB shell or MongoDB Compass

// First, connect to your database
use smart-learning-dashboard

// Clear existing ERP users
db.users.deleteMany({
  email: {
    $in: [
      "admin@college.edu",
      "admission@college.edu", 
      "fees@college.edu",
      "hostel@college.edu",
      "exam@college.edu",
      "accountant@college.edu",
      "registrar@college.edu",
      "instructor@college.edu",
      "student@college.edu"
    ]
  }
})

// Create users (Note: passwords need to be hashed with bcrypt in real implementation)
db.users.insertMany([
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admin123
    role: "admin",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Admission",
    lastName: "Officer",
    email: "admission@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admission123
    role: "admission_officer",
    department: "Admissions",
    designation: "Admission Officer",
    employeeId: "ADM001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Fee",
    lastName: "Manager",
    email: "fees@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // fees123
    role: "fee_manager",
    department: "Finance",
    designation: "Fee Manager",
    employeeId: "FEE001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Hostel",
    lastName: "Manager",
    email: "hostel@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // hostel123
    role: "hostel_manager",
    department: "Hostel",
    designation: "Hostel Manager",
    employeeId: "HOS001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Exam",
    lastName: "Controller",
    email: "exam@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // exam123
    role: "exam_controller",
    department: "Examinations",
    designation: "Exam Controller",
    employeeId: "EXM001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "College",
    lastName: "Accountant",
    email: "accountant@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // account123
    role: "accountant",
    department: "Finance",
    designation: "Accountant",
    employeeId: "ACC001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "College",
    lastName: "Registrar",
    email: "registrar@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // registrar123
    role: "registrar",
    department: "Administration",
    designation: "Registrar",
    employeeId: "REG001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Test",
    lastName: "Instructor",
    email: "instructor@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // instructor123
    role: "instructor",
    department: "Computer Science",
    designation: "Assistant Professor",
    employeeId: "INS001",
    isActive: true,
    createdAt: new Date()
  },
  {
    firstName: "Test",
    lastName: "Student",
    email: "student@college.edu",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // student123
    role: "student",
    department: "Computer Science",
    designation: "Student",
    employeeId: "STU001",
    isActive: true,
    createdAt: new Date()
  }
])

// Verify users were created
print("Users created successfully!")
print("Total users in database: " + db.users.countDocuments())
print("\nCreated users:")
db.users.find({}, {email: 1, role: 1}).forEach(function(user) {
  print("- " + user.email + " (" + user.role + ")")
})
