# 🔧 ERP User Creation Guide

## 🚨 **Issue**: Users not created in MongoDB

The login credentials are not working because the users haven't been created in the MongoDB database yet. Here are **3 different methods** to create the users:

## 🎯 **Method 1: Using the Setup Page (Recommended)**

1. **Make sure your server is running**:
   ```bash
   npm run dev
   ```

2. **Open the setup page**:
   - Navigate to: `http://localhost:3000/setup`
   - Click **"Create ERP Users"** button
   - Wait for the success message

3. **Login with credentials**:
   ```
   Admin: admin@college.edu / admin123
   Student: student@college.edu / student123
   ```

## 🎯 **Method 2: Using the HTML Page**

1. **Open the HTML file**:
   - Open `create-users.html` in your browser
   - Click **"Create ERP Users"** button
   - Wait for success message

2. **Make sure server is running on port 5000**

## 🎯 **Method 3: Direct MongoDB (If above methods fail)**

### **Option A: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database: `smart-learning-dashboard`
3. Go to the `users` collection
4. Copy and paste the content from `mongo-create-users.js`
5. Run the script

### **Option B: Using MongoDB Shell**
1. Open MongoDB shell
2. Run these commands:
   ```javascript
   use smart-learning-dashboard
   
   // Clear existing users
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
   
   // Create users (with hashed passwords)
   db.users.insertMany([
     {
       firstName: "Admin",
       lastName: "User",
       email: "admin@college.edu",
       password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
       role: "admin",
       isActive: true,
       createdAt: new Date()
     },
     {
       firstName: "Test",
       lastName: "Student",
       email: "student@college.edu",
       password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
       role: "student",
       department: "Computer Science",
       designation: "Student",
       employeeId: "STU001",
       isActive: true,
       createdAt: new Date()
     }
   ])
   ```

## 🔑 **Login Credentials (After Creating Users)**

```
👑 ADMIN
Email: admin@college.edu
Password: admin123

👥 ERP STAFF
Admission Officer: admission@college.edu / admission123
Fee Manager: fees@college.edu / fees123
Hostel Manager: hostel@college.edu / hostel123
Exam Controller: exam@college.edu / exam123
Accountant: accountant@college.edu / account123
Registrar: registrar@college.edu / registrar123

👨‍🏫 INSTRUCTOR & STUDENT
Instructor: instructor@college.edu / instructor123
Student: student@college.edu / student123
```

## 🔍 **Verify Users Were Created**

After creating users, you can verify by:

1. **Check MongoDB**:
   ```javascript
   db.users.find({}, {email: 1, role: 1})
   ```

2. **Check via API**:
   - Visit: `http://localhost:5000/api/setup/check-erp-users`
   - Should show all 9 users

3. **Try logging in**:
   - Go to your login page
   - Use any of the credentials above

## 🚀 **Quick Test**

1. **Create users** using Method 1 (setup page)
2. **Login as admin**: `admin@college.edu / admin123`
3. **Check navigation**: You should see all ERP modules
4. **Login as student**: `student@college.edu / student123`
5. **Check navigation**: You should see "My Academic Info" and "My Results"

## 🆘 **If Still Not Working**

1. **Check server logs** for any errors
2. **Verify MongoDB connection** in your `.env` file
3. **Make sure MongoDB is running**
4. **Check if the database name is correct**

## 📞 **Need Help?**

If you're still having issues:
1. Check the server console for error messages
2. Verify your MongoDB connection string
3. Make sure all dependencies are installed
4. Try the direct MongoDB method (Method 3)

The system is fully implemented - we just need to create the users in the database!
