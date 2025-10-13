# 📚 ERP System API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All API endpoints (except login/register) require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@erp-system.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "name": "Admin User",
      "email": "admin@erp-system.com",
      "role": "admin"
    }
  }
}
```

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

---

## 👑 Admin Endpoints

### Dashboard Statistics
```http
GET /api/admin/dashboard-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalStudents": 120,
    "totalInstructors": 20,
    "totalAdmins": 5,
    "totalClassrooms": 15,
    "totalCourses": 45,
    "totalAdmissions": 25,
    "pendingAdmissions": 5,
    "approvedAdmissions": 20,
    "totalFees": 120,
    "paidFees": 100,
    "pendingFees": 20,
    "totalHostels": 3,
    "totalRooms": 150,
    "totalExaminations": 30,
    "totalExamResults": 500
  }
}
```

### Create ERP Staff
```http
POST /api/admin/create-erp-staff
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "admission_officer",
  "department": "Admissions",
  "designation": "Senior Officer",
  "employeeId": "EMP001"
}
```

### Assign Multiple Instructors to Classroom
```http
POST /api/admin/classrooms/:classroomId/assign-instructors
```

**Request Body:**
```json
{
  "instructors": [
    {
      "instructorId": "instructor-id-1",
      "instructorName": "Dr. John Smith",
      "role": "Primary"
    },
    {
      "instructorId": "instructor-id-2",
      "instructorName": "Prof. Jane Doe",
      "role": "Secondary"
    }
  ]
}
```

### Exam Paper Assignments
```http
GET /api/admin/exam-paper-assignments
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Assignment status
- `examType` (optional): Type of exam

### Assign Exam Papers
```http
POST /api/admin/exam-paper-assignments/:assignmentId/assign
```

**Request Body:**
```json
{
  "instructorIds": ["instructor-id-1", "instructor-id-2"],
  "dueDate": "2024-02-15T23:59:59Z",
  "instructions": "Please complete evaluation by due date"
}
```

---

## 🎓 Student Portal Endpoints

### Dashboard
```http
GET /api/student/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "prn": "PRN001",
      "course": "Computer Science",
      "branch": "CSE",
      "semester": 3
    },
    "feeSummary": {
      "totalFees": 50000,
      "paidFees": 30000,
      "pendingFees": 20000,
      "overdueFees": 5000
    },
    "recentFees": [...],
    "hostelAllocation": {
      "hostelName": "Boys Hostel A",
      "roomNumber": "101",
      "floorNumber": 1
    },
    "recentResults": [...],
    "upcomingExams": [...],
    "performanceSummary": [...]
  }
}
```

### Pay Fees
```http
POST /api/student/fees/:feeId/pay
```

**Request Body:**
```json
{
  "amount": 10000,
  "paymentMethod": "Online",
  "transactionId": "TXN123456789",
  "notes": "Semester fee payment"
}
```

### Get Exam Results
```http
GET /api/student/results
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `examType` (optional): Filter by exam type
- `semester` (optional): Filter by semester

### Request Transcript
```http
POST /api/student/transcript/request
```

**Request Body:**
```json
{
  "purpose": "Higher Education Application",
  "deliveryMethod": "Digital"
}
```

---

## 💰 Fee Management Endpoints

### Get All Fees
```http
GET /api/erp/fees
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `studentId` (optional): Filter by student ID
- `course` (optional): Filter by course
- `branch` (optional): Filter by branch
- `status` (optional): Filter by fee status
- `academicYear` (optional): Filter by academic year

### Create Fee Record
```http
POST /api/erp/fees
```

**Request Body:**
```json
{
  "studentId": "PRN001",
  "admissionId": "admission-id",
  "academicYear": "2023-24",
  "semester": 3,
  "course": "Computer Science",
  "branch": "CSE",
  "tuitionFee": 25000,
  "libraryFee": 2000,
  "laboratoryFee": 3000,
  "examinationFee": 1000,
  "hostelFee": 5000,
  "dueDate": "2024-02-15T23:59:59Z"
}
```

### Record Payment
```http
POST /api/erp/fees/:feeId/payment
```

**Request Body:**
```json
{
  "amount": 10000,
  "paymentMethod": "Online",
  "transactionId": "TXN123456789",
  "notes": "Partial payment"
}
```

### Generate Fee Structure
```http
POST /api/erp/fees/generate-structure
```

**Request Body:**
```json
{
  "course": "Computer Science",
  "branch": "CSE",
  "semester": 3,
  "academicYear": "2023-24",
  "feeStructure": {
    "tuitionFee": 25000,
    "libraryFee": 2000,
    "laboratoryFee": 3000,
    "examinationFee": 1000
  }
}
```

---

## 🏠 Hostel Management Endpoints

### Get All Hostels
```http
GET /api/erp/hostels
```

### Create Hostel
```http
POST /api/erp/hostels
```

**Request Body:**
```json
{
  "name": "Boys Hostel C",
  "type": "Boys",
  "address": {
    "street": "789 University Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "totalRooms": 30,
  "totalCapacity": 120,
  "monthlyRent": 5000,
  "securityDeposit": 10000,
  "amenities": [
    {
      "name": "WiFi",
      "description": "High-speed internet",
      "available": true
    }
  ]
}
```

### Get Rooms for Hostel
```http
GET /api/erp/hostels/:hostelId/rooms
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Room status
- `floorNumber` (optional): Filter by floor

### Create Room
```http
POST /api/erp/hostels/:hostelId/rooms
```

**Request Body:**
```json
{
  "roomNumber": "101",
  "floorNumber": 1,
  "capacity": 2,
  "roomType": "Double",
  "monthlyRent": 5000,
  "securityDeposit": 10000
}
```

### Allocate Hostel to Student
```http
POST /api/erp/hostels/:hostelId/allocate
```

**Request Body:**
```json
{
  "studentId": "PRN001",
  "admissionId": "admission-id",
  "roomNumber": "101",
  "floorNumber": 1,
  "checkInDate": "2024-01-15T00:00:00Z"
}
```

### Get Available Rooms
```http
GET /api/erp/hostels/:hostelId/available-rooms
```

**Query Parameters:**
- `floorNumber` (optional): Filter by floor
- `roomType` (optional): Filter by room type

---

## 📚 Examination Endpoints

### Get All Examinations
```http
GET /api/erp/examinations
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `course` (optional): Filter by course
- `branch` (optional): Filter by branch
- `semester` (optional): Filter by semester
- `examType` (optional): Filter by exam type
- `status` (optional): Filter by exam status

### Create Examination
```http
POST /api/erp/examinations
```

**Request Body:**
```json
{
  "examId": "EXAM001",
  "examName": "Mid-Semester Examination",
  "examType": "MSE",
  "course": "Computer Science",
  "branch": "CSE",
  "semester": 3,
  "academicYear": "2023-24",
  "subject": "Data Structures",
  "subjectCode": "CS301",
  "credits": 4,
  "examDate": "2024-02-15T10:00:00Z",
  "startTime": "10:00",
  "endTime": "13:00",
  "duration": 180,
  "venue": "Main Hall",
  "roomNumber": "A101",
  "seatingCapacity": 50,
  "totalMarks": 100,
  "passingMarks": 40
}
```

### Create Exam Paper Assignment
```http
POST /api/erp/examinations/:examId/assign-paper
```

**Request Body:**
```json
{
  "questionPaper": {
    "fileName": "question_paper.pdf",
    "filePath": "/uploads/papers/question_paper.pdf",
    "fileSize": 1024000
  },
  "answerKey": {
    "fileName": "answer_key.pdf",
    "filePath": "/uploads/papers/answer_key.pdf",
    "fileSize": 512000
  },
  "instructions": "Complete evaluation within 7 days",
  "specialNotes": "Focus on problem-solving approach"
}
```

### Submit Evaluation Results
```http
POST /api/erp/examinations/assignments/:assignmentId/submit-evaluation
```

**Request Body:**
```json
{
  "evaluatedPapers": [
    {
      "studentId": "PRN001",
      "studentName": "John Doe",
      "marksObtained": 85,
      "totalMarks": 100,
      "grade": "A",
      "evaluatedPaper": {
        "fileName": "evaluated_paper_001.pdf",
        "filePath": "/uploads/evaluated/evaluated_paper_001.pdf"
      },
      "remarks": "Excellent work"
    }
  ],
  "notes": "All papers evaluated successfully"
}
```

### Publish Results
```http
PATCH /api/erp/examinations/:examId/results/publish
```

---

## 💼 Accountant Endpoints

### Dashboard
```http
GET /api/accountant/dashboard
```

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering

### Get Financial Transactions
```http
GET /api/accountant/transactions
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Transaction type (Income/Expense)
- `category` (optional): Transaction category
- `status` (optional): Transaction status
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

### Create Financial Transaction
```http
POST /api/accountant/transactions
```

**Request Body:**
```json
{
  "transactionType": "Income",
  "category": "Student Fees",
  "subCategory": "Tuition Fees",
  "amount": 50000,
  "description": "Monthly fee collection",
  "paymentMethod": "Online",
  "transactionDate": "2024-01-15T00:00:00Z",
  "studentId": "PRN001"
}
```

### Get Balance Sheet
```http
GET /api/accountant/balance-sheet
```

**Query Parameters:**
- `startDate` (optional): Start date
- `endDate` (optional): End date

### Get Profit & Loss Statement
```http
GET /api/accountant/profit-loss
```

### Get Cash Flow Statement
```http
GET /api/accountant/cash-flow
```

---

## 🏛️ Registrar Endpoints

### Dashboard
```http
GET /api/registrar/dashboard
```

### Get All Transcripts
```http
GET /api/registrar/transcripts
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Transcript status
- `course` (optional): Filter by course
- `academicYear` (optional): Filter by academic year

### Generate Transcript
```http
POST /api/registrar/transcripts/generate
```

**Request Body:**
```json
{
  "studentId": "PRN001",
  "course": "Computer Science",
  "branch": "CSE",
  "academicYear": "2023-24",
  "semester": 6
}
```

### Verify Transcript
```http
PATCH /api/registrar/transcripts/:id/verify
```

**Request Body:**
```json
{
  "verificationNotes": "All records verified and accurate"
}
```

### Issue Transcript
```http
PATCH /api/registrar/transcripts/:id/issue
```

**Request Body:**
```json
{
  "digitalSignature": "digital-signature-here",
  "qrCode": "qr-code-data-here"
}
```

### Get Graduation List
```http
GET /api/registrar/graduation-list
```

**Query Parameters:**
- `course` (optional): Filter by course
- `academicYear` (optional): Filter by academic year
- `semester` (optional): Filter by semester

---

## 📊 Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Sorting
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (asc/desc, default: desc)

### Date Filtering
- `startDate`: Start date (ISO 8601 format)
- `endDate`: End date (ISO 8601 format)

### Search
- `search`: Search term for text fields
- `status`: Filter by status
- `type`: Filter by type

---

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute

---

## 🔧 Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp-system.com","password":"admin123"}'

# Get dashboard stats (with token)
curl -X GET http://localhost:5000/api/admin/dashboard-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the API collection
2. Set up environment variables
3. Run the authentication request first
4. Use the token in subsequent requests

---

## 📞 Support

For API support and questions:
- Email: api-support@erp-system.com
- Documentation: https://docs.erp-system.com
- Issues: GitHub Issues

---

**Last Updated: January 2024**
