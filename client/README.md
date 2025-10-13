# ERP Exams and Groups UI

This README documents the new UI functionality added for Student Groups and the Examination workflows (MSE/ESE and ISE1/ISE2).

## New Pages and Routes

- Admission Officer / Admin
  - Groups Management: `/admission-officer/groups` and `/admin/groups`
    - Create groups from selected students
    - Assign a group to a Department Admin
    - Assign a group to a Classroom (bulk enroll)
  - Admin Exam Assignments: `/admin/exam-assignments`
    - Assign uploaded exam papers to multiple instructors

- Instructor
  - Exam Assignments: `/instructor/exam-assignments`
    - View assignments from Admin and submit evaluated papers + marks
  - ISE Marks Entry: `/instructor/ise-marks`
    - Select ISE1/ISE2 exam and enter marks out of 10, publish instantly

- Exam Controller
  - Dashboard: `/exam-controller` (existing)
    - Create exams and upload papers (then optionally assign to admin via backend call)

## Data Flow Overview

- Student Groups
  1. Admission Officer/Admin creates a `StudentGroup` with selected students.
  2. Optionally assign group to a Department Admin for visibility.
  3. Assign group to a Classroom which bulk-adds members to `Classroom.students`.

- Major Exams (MSE/ESE)
  1. Exam Controller creates exam and uploads paper.
  2. Controller can assign the paper to a Department Admin (server: `assign-paper` with `assignToAdminId`).
  3. Admin assigns exam papers to multiple instructors in UI (server: `assign-to-instructors`).
  4. Instructors evaluate and submit marks with optional file links (server: `instructor-submit`).
  5. Admin verifies and forwards to Exam Controller (server: `admin-forward`).
  6. Coordinator consolidates and publishes results (server: `results/publish`).
  7. Students see marks and checked papers in their dashboard results.

- Internal Exams (ISE1/ISE2)
  1. Instructor picks an ISE exam and enters marks out of 10 via UI.
  2. Marks go directly to `ExamResult` and are published instantly.
  3. Students see results immediately.

## API Endpoints Used

- Groups
  - GET `/api/erp/groups`
  - POST `/api/erp/groups`
  - POST `/api/erp/groups/:groupId/assign-admin`
  - POST `/api/erp/groups/:groupId/assign-classroom`
  - GET `/api/erp/admin/users?role=student|admin`
  - GET `/api/erp/admin/classrooms`

- Exams
  - GET `/api/erp/examinations`
  - GET `/api/erp/examinations/assignments` (admin/coordinator)
  - GET `/api/erp/examinations/instructor/assignments` (instructor)
  - POST `/api/erp/examinations/:id/assign-paper` (backend, coordinator)
  - POST `/api/erp/examinations/assignments/:assignmentId/assign-to-instructors` (admin)
  - POST `/api/erp/examinations/assignments/:assignmentId/instructor-submit` (instructor)
  - POST `/api/erp/examinations/assignments/:assignmentId/admin-forward` (admin)
  - POST `/api/erp/examinations/:id/ise-marks` (instructor)

## Permissions

- Admission Officer: Manage groups, assign to admin/classroom.
- Admin: Manage groups, assign instructors, review assignments.
- Instructor: Submit evaluations for assigned MSE/ESE; enter ISE marks.
- Exam Controller: Create exams, upload papers, assign to admin.
- Student: View examinations and results.

## UI Notes

- UI uses existing `DashboardLayout` for consistent navigation.
- Forms are minimal, responsive, and optimized for quick actions.

## Future Enhancements

- Add file upload for evaluated papers to Cloudinary in instructor flow.
- Add coordinator-side UI to assign to admins directly.
- Show checked-paper links in student results if available.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
