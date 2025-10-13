# 🏛️ ERP-based Integrated Student Management System

A comprehensive, role-based Enterprise Resource Planning (ERP) system designed for educational institutions to manage admissions, fees, hostels, examinations, and academic workflows in a unified platform.

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [System Overview](#-system-overview)
- [User Roles & Functionalities](#-user-roles--functionalities)
- [Technology Stack](#-technology-stack)
- [Installation & Setup](#-installation--setup)
- [System Architecture](#-system-architecture)
- [Data Flow](#-data-flow)
- [API Documentation](#-api-documentation)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Problem Statement

Currently, educational institutions manage admissions, fees, hostels, and examinations through separate, disconnected systems, leading to:

- **Data Duplication**: Student information exists in multiple systems
- **Inefficiency**: Manual data transfer between departments
- **Poor Visibility**: No unified view of student lifecycle
- **Workflow Bottlenecks**: Delayed approvals and processing
- **Limited Analytics**: Difficulty in generating comprehensive reports

This ERP system unifies all student-related processes into a central database with real-time dashboards, role-based access control, and automated workflows.

## 🏗️ System Overview

The ERP system provides a unified platform where:

- **All student data** is centralized in a single database
- **Role-based access** ensures users see only relevant information
- **Real-time dashboards** provide instant insights
- **Automated workflows** streamline administrative processes
- **Digital receipts** and documents eliminate paper-based processes

## 👥 User Roles & Functionalities

### 🔑 1. Admin (Superuser)
**Responsibilities:**
- Manages all ERP staff, instructors, and students
- Approves/oversees admissions, fees, hostel, and exams
- Groups students into Classrooms after admission
- Assigns multiple instructors to a classroom
- Distributes exam papers (PDFs) to instructors for evaluation

**Functionalities:**
- Dashboard with institutional overview (admissions, fees, hostel occupancy, results)
- Classroom Management: Create groups of students → Assign instructors
- Assign/reassign exam papers from Exam Controller to Instructors
- Collect evaluated papers back → forward to Exam Controller
- Full access to all reports and analytics

### 📝 2. Admission Officer
**Responsibilities:**
- Handles admission intake and verification
- Captures complete student profile with all required documents

**Functionalities:**
- Online admission form processing
- Student profile management (Photo, Name, DOB, Email, PRN, Mobile, Address)
- Document verification and upload
- Admission status tracking
- Central student database updates

### 💰 3. Fee Manager
**Responsibilities:**
- Manages fee collection and payment processing
- Issues digital receipts and manages fee records

**Functionalities:**
- Record payments and transactions
- Generate/download digital receipts
- Fee due reports and analytics
- Payment method tracking (Cash, Online, UPI, Card, etc.)
- Late fee management

### 🎓 4. Student (Self-Service)
**Responsibilities:**
- Manages own academic and administrative activities
- Accesses personal information and services

**Functionalities:**
- Pay fees online → Auto receipt generation
- View admission profile and documents
- Download receipts and certificates
- Check hostel allotment status
- Access exam papers (PDFs)
- View marks (ISE1, MSE, ISE2, ESE)
- View evaluated papers (if enabled)

### 🏠 5. Hostel Manager
**Responsibilities:**
- Creates hostel structures and manages room allocations
- Handles student accommodation assignments

**Functionalities:**
- Add Hostels (Boys, Girls, PG, etc.)
- Add Rooms (Room No., Capacity, Status)
- Assign/Deassign students to rooms
- Live hostel occupancy tracking
- Room maintenance management

### 📚 6. Exam Controller
**Responsibilities:**
- Oversees entire exam lifecycle from paper creation to result publishing
- Manages exam schedules and evaluations

**Functionalities:**
- Create exam categories (ISE1, MSE, ISE2, ESE)
- Upload Exam Papers (PDF) → Assign to Admin
- Receive checked papers back from Admin
- Publish results to central database
- Exam schedule management

### 👨‍🏫 7. Instructor
**Responsibilities:**
- Teach courses, manage exams, and grade students
- Evaluate answer sheets and provide feedback

**Functionalities:**
- Assigned to one/multiple classrooms
- Receives exam papers (PDFs) from Admin
- Evaluates answer sheets → Uploads marks & checked papers
- Views students' performance & attendance
- Grade management and feedback

### 🧾 8. Accountant
**Responsibilities:**
- Manages institutional accounts (not just student fees)
- Tracks all financial transactions

**Functionalities:**
- Track all income (fees, grants, donations)
- Track all expenses (salaries, utilities, maintenance)
- Generate balance sheets & audit reports
- Financial analytics and reporting
- Budget management

### 🏛️ 9. Registrar
**Responsibilities:**
- Maintains official academic records
- Issues transcripts and certificates

**Functionalities:**
- Generate transcripts from central database
- Certificate issuance and management
- Approve graduation lists
- Academic record maintenance
- Official document management

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **Socket.io** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud storage

### Additional Tools
- **LiveKit** - Video conferencing
- **ExcelJS** - Excel file processing
- **CSV Parser** - Data import/export
- **Socket.io** - Real-time updates

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/naeemnaikwadi/erpbased.git
cd erpbased
```

### 2. Install Dependencies

#### Server Dependencies
```bash
cd server
npm install
```

#### Client Dependencies
```bash
cd ../client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the server directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/erp_system

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=4000
NODE_ENV=development
```

### 4. Database Setup
```bash
# Start MongoDB service
mongod

# Create initial admin user
cd server
node scripts/create-admin.js
```

### 5. Start the Application

#### Development Mode
```bash
# Terminal 1 - Start Server
cd server
npm run dev

# Terminal 2 - Start Client
cd client
npm start
```

#### Production Mode
```bash
# Build client
cd client
npm run build

# Start server
cd ../server
npm start
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Default Admin**: admin@example.com / admin123

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB DB    │
│                 │    │                 │    │                 │
│  - Role-based   │◄──►│  - REST APIs    │◄──►│  - User Data    │
│    Dashboards   │    │  - Authentication│    │  - Admissions   │
│  - Real-time    │    │  - File Upload  │    │  - Fees         │
│    Updates      │    │  - Data Processing│   │  - Hostels     │
│  - Responsive   │    │  - Socket.io    │    │  - Examinations │
│    UI           │    │                 │    │  - Results      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Data Flow

### 1. Admission Flow
```
Student Application → Admission Officer Review → Admin Approval → Classroom Assignment → Instructor Assignment
```

### 2. Fee Flow
```
Fee Generation → Student Payment → Fee Manager Verification → Digital Receipt → Accountant Consolidation
```

### 3. Hostel Flow
```
Hostel Application → Hostel Manager Review → Room Allocation → Student Notification → Occupancy Tracking
```

### 4. Exam Flow
```
Exam Controller Upload → Admin Assignment → Instructor Evaluation → Result Publishing → Student Access
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admission Endpoints
- `GET /api/erp/admissions` - Get all admissions
- `POST /api/erp/admissions` - Create new admission
- `PUT /api/erp/admissions/:id` - Update admission
- `DELETE /api/erp/admissions/:id` - Delete admission

### Fee Endpoints
- `GET /api/erp/fees` - Get all fees
- `POST /api/erp/fees` - Create fee record
- `POST /api/erp/fees/:id/payment` - Record payment
- `GET /api/erp/fees/:id/receipt` - Generate receipt

### Hostel Endpoints
- `GET /api/erp/hostels` - Get all hostels
- `POST /api/erp/hostels` - Create hostel
- `POST /api/erp/hostels/:id/allocate` - Allocate room
- `GET /api/erp/hostels/occupancy` - Get occupancy stats

### Examination Endpoints
- `GET /api/erp/examinations` - Get all examinations
- `POST /api/erp/examinations` - Create examination
- `POST /api/erp/examinations/:id/upload-paper` - Upload exam paper
- `POST /api/erp/examinations/:id/submit-marks` - Submit marks

## ✨ Features

### 🎯 Core Features
- **Role-based Access Control** - Secure, permission-based access
- **Real-time Dashboards** - Live data updates and analytics
- **Digital Document Management** - Paperless workflow
- **Automated Notifications** - Email and in-app notifications
- **Mobile Responsive** - Works on all devices
- **Dark Mode Support** - User preference-based theming

### 📊 Analytics & Reporting
- **Institutional Overview** - Complete system statistics
- **Financial Reports** - Revenue, expenses, and profit analysis
- **Academic Performance** - Student and instructor analytics
- **Hostel Occupancy** - Real-time accommodation tracking
- **Exam Analytics** - Performance metrics and trends

### 🔒 Security Features
- **JWT Authentication** - Secure token-based auth
- **Password Encryption** - Bcrypt hashing
- **Role-based Permissions** - Granular access control
- **File Upload Security** - Cloudinary integration
- **Data Validation** - Input sanitization and validation

### 🚀 Performance Features
- **Real-time Updates** - Socket.io integration
- **Optimized Queries** - Efficient database operations
- **Caching** - Improved response times
- **Lazy Loading** - Faster page loads
- **Code Splitting** - Optimized bundle sizes

## 📱 Screenshots

### Dashboard Views
- **Admin Dashboard** - Complete system overview
- **Student Dashboard** - Personal academic portal
- **Instructor Dashboard** - Teaching and grading interface
- **Role-specific Dashboards** - Tailored for each user type

### Key Interfaces
- **Admission Form** - Comprehensive student registration
- **Fee Payment** - Online payment processing
- **Hostel Management** - Room allocation interface
- **Exam Management** - Paper upload and evaluation
- **Analytics** - Charts and reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: [Your Email]
- Documentation: [Link to detailed docs]

## 🎉 Acknowledgments

- React community for excellent documentation
- MongoDB for robust database solutions
- Express.js for the powerful backend framework
- All contributors who helped build this system

---

**Built with ❤️ for Educational Institutions**

*Streamlining education management through technology*
