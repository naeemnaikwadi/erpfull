const express = require('express');
const router = express.Router();
const Library = require('../models/Library');
const StudentLibrary = require('../models/StudentLibrary');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const CloudinaryService = require('../services/cloudinaryService');

// Apply authentication middleware to all routes
router.use(auth);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to check librarian access
const checkLibrarianAccess = (req, res, next) => {
  if (req.user.role !== 'librarian' && req.user.role !== 'admin' && req.user.role !== 'registrar') {
    return res.status(403).json({ message: 'Access denied. Librarian role required.' });
  }
  next();
};

// ==================== BOOK MANAGEMENT ====================

// Get all books with search and filter
router.get('/books', async (req, res) => {
  try {
    const { 
      search, 
      genre, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (genre) query.genre = genre;
    if (status) query.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Library.find(query)
      .populate('addedBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Library.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// Download sample Excel template (must be before /books/:id route)
router.get('/books/template', checkLibrarianAccess, (req, res) => {
  try {
    const sampleData = [
      {
        'Title': 'Sample Book Title',
        'Author': 'Sample Author',
        'ISBN': '978-1234567890',
        'Genre': 'Fiction',
        'Quantity': '5',
        'Shelf No': 'A-001',
        'Description': 'Sample book description',
        'Edition': '1st Edition',
        'Publisher': 'Sample Publisher',
        'Publication Year': '2023',
        'Language': 'English',
        'Pages': '300',
        'Price': '500',
        'Is Research Paper': 'false',
        'Research Paper Type': 'Journal',
        'DOI': '10.1000/sample',
        'Keywords': 'sample, book, test',
        'Abstract': 'Sample abstract'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=library_books_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Error generating template', error: error.message });
  }
});

// Get single book
router.get('/books/:id', checkLibrarianAccess, async (req, res) => {
  try {
    const book = await Library.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('lastUpdatedBy', 'name email');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
});

// Add new book
router.post('/books', checkLibrarianAccess, async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      addedBy: req.user.id,
      lastUpdatedBy: req.user.id
    };

    // Set available quantity same as total quantity for new books
    if (!bookData.availableQuantity) {
      bookData.availableQuantity = bookData.quantity;
    }

    const book = new Library(bookData);
    await book.save();

    const populatedBook = await Library.findById(book._id)
      .populate('addedBy', 'name email');

    res.status(201).json(populatedBook);
  } catch (error) {
    console.error('Error adding book:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'ISBN already exists' });
    } else {
      res.status(500).json({ message: 'Error adding book', error: error.message });
    }
  }
});

// Update book
router.put('/books/:id', checkLibrarianAccess, async (req, res) => {
  try {
    const book = await Library.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update available quantity if total quantity changes
    if (req.body.quantity !== undefined) {
      const quantityDiff = req.body.quantity - book.quantity;
      req.body.availableQuantity = book.availableQuantity + quantityDiff;
    }

    const updatedBook = await Library.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('addedBy', 'name email')
     .populate('lastUpdatedBy', 'name email');

    res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
});

// Delete book
router.delete('/books/:id', checkLibrarianAccess, async (req, res) => {
  try {
    const book = await Library.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book has any active issues
    const activeIssues = await StudentLibrary.countDocuments({
      book: req.params.id,
      status: { $in: ['Issued', 'Overdue'] }
    });

    if (activeIssues > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete book with active issues. Please return all copies first.' 
      });
    }

    await Library.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
});

// Upload book cover image
router.post('/books/:id/cover', checkLibrarianAccess, upload.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const book = await Library.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(req.file, 'library/covers');
    
    // Update book with cover image info
    book.coverImage = {
      fileName: req.file.originalname,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      cloudinaryUrl: result.secure_url
    };
    book.lastUpdatedBy = req.user.id;
    
    await book.save();

    res.json({ 
      message: 'Cover image uploaded successfully',
      coverImage: book.coverImage
    });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    res.status(500).json({ message: 'Error uploading cover image', error: error.message });
  }
});

// ==================== BULK UPLOAD ====================

// Upload books from Excel
router.post('/books/bulk-upload', checkLibrarianAccess, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file provided' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      errors: 0,
      errorDetails: []
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Validate required fields
        if (!row.Title || !row.Author || !row.Genre || !row.Quantity || !row['Shelf No']) {
          results.errors++;
          results.errorDetails.push({
            row: i + 2,
            error: 'Missing required fields (Title, Author, Genre, Quantity, Shelf No)'
          });
          continue;
        }

        // Process keywords
        const keywords = row.Keywords ? row.Keywords.split(',').map(k => k.trim()) : [];

        const bookData = {
          title: row.Title,
          author: row.Author,
          isbn: row.ISBN || undefined,
          genre: row.Genre,
          quantity: parseInt(row.Quantity) || 1,
          availableQuantity: parseInt(row.Quantity) || 1,
          shelfNo: row['Shelf No'],
          description: row.Description || '',
          edition: row.Edition || '',
          publisher: row.Publisher || '',
          publicationYear: row['Publication Year'] ? parseInt(row['Publication Year']) : undefined,
          language: row.Language || 'English',
          pages: row.Pages ? parseInt(row.Pages) : undefined,
          price: row.Price ? parseFloat(row.Price) : undefined,
          isResearchPaper: row['Is Research Paper'] === 'true' || row['Is Research Paper'] === true,
          researchPaperType: row['Research Paper Type'] || 'Journal',
          doi: row.DOI || undefined,
          keywords: keywords,
          abstract: row.Abstract || '',
          addedBy: req.user.id,
          lastUpdatedBy: req.user.id
        };

        const book = new Library(bookData);
        await book.save();
        results.success++;

      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          row: i + 2,
          error: error.message
        });
      }
    }

    res.json({
      message: `Bulk upload completed. ${results.success} books added, ${results.errors} errors.`,
      results
    });

  } catch (error) {
    console.error('Error processing bulk upload:', error);
    res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
  }
});

// ==================== BOOK ISSUING & RETURNING ====================

// Search students for book issuing
router.get('/students/search', checkLibrarianAccess, async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json([]);
    }

    const students = await User.find({
      role: 'student',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { prn: { $regex: search, $options: 'i' } }
      ]
    }).select('name email prn course branch semester').limit(10);

    res.json(students);
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ message: 'Error searching students', error: error.message });
  }
});

// Issue book to student
router.post('/issue', checkLibrarianAccess, async (req, res) => {
  try {
    const { studentId, bookId, dueDate } = req.body;

    // Validate student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }

    // Validate book
    const book = await Library.findById(bookId);
    if (!book) {
      return res.status(400).json({ message: 'Book not found' });
    }

    if (!book.canBeIssued()) {
      return res.status(400).json({ message: 'Book not available for issue' });
    }

    // Check if student already has this book
    const existingIssue = await StudentLibrary.findOne({
      student: studentId,
      book: bookId,
      status: { $in: ['Issued', 'Overdue'] }
    });

    if (existingIssue) {
      return res.status(400).json({ message: 'Student already has this book' });
    }

    // Check student's current book limit (max 5 books)
    const currentBooks = await StudentLibrary.countDocuments({
      student: studentId,
      status: { $in: ['Issued', 'Overdue'] }
    });

    if (currentBooks >= 5) {
      return res.status(400).json({ message: 'Student has reached maximum book limit (5 books)' });
    }

    // Create issue record
    const issueData = {
      student: studentId,
      book: bookId,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      issuedBy: req.user.id
    };

    const issue = new StudentLibrary(issueData);
    await issue.save();

    // Update book availability
    book.issueBook();
    await book.save();

    const populatedIssue = await StudentLibrary.findById(issue._id)
      .populate('student', 'name email prn')
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email');

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ message: 'Error issuing book', error: error.message });
  }
});

// Return book
router.post('/return/:issueId', checkLibrarianAccess, async (req, res) => {
  try {
    const { issueId } = req.params;
    const { condition = 'Good' } = req.body;

    const issue = await StudentLibrary.findById(issueId)
      .populate('book student');

    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issue.status === 'Returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    // Return the book
    const success = issue.returnBook(req.user.id, condition);
    if (!success) {
      return res.status(400).json({ message: 'Unable to return book' });
    }

    await issue.save();

    // Update book availability
    issue.book.returnBook();
    await issue.book.save();

    const updatedIssue = await StudentLibrary.findById(issueId)
      .populate('student', 'name email prn')
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email')
      .populate('returnedBy', 'name email');

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ message: 'Error returning book', error: error.message });
  }
});

// Renew book
router.post('/renew/:issueId', checkLibrarianAccess, async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await StudentLibrary.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (!issue.canRenew) {
      return res.status(400).json({ message: 'Book cannot be renewed' });
    }

    const success = issue.renewBook();
    if (!success) {
      return res.status(400).json({ message: 'Unable to renew book' });
    }

    await issue.save();

    const updatedIssue = await StudentLibrary.findById(issueId)
      .populate('student', 'name email prn')
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email');

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error renewing book:', error);
    res.status(500).json({ message: 'Error renewing book', error: error.message });
  }
});

// ==================== ISSUES MANAGEMENT ====================

// Get all issues
router.get('/issues', checkLibrarianAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const issues = await StudentLibrary.find(query)
      .populate('student', 'name email prn course branch')
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email')
      .populate('returnedBy', 'name email')
      .sort({ issueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudentLibrary.countDocuments(query);

    res.json({
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Error fetching issues', error: error.message });
  }
});

// ==================== REPORTS & ANALYTICS ====================

// Get library statistics
router.get('/stats', checkLibrarianAccess, async (req, res) => {
  try {
    const totalBooks = await Library.countDocuments();
    const availableBooks = await Library.countDocuments({ status: 'Available' });
    const totalIssues = await StudentLibrary.countDocuments();
    const activeIssues = await StudentLibrary.countDocuments({ status: { $in: ['Issued', 'Overdue'] } });
    const overdueBooks = await StudentLibrary.countDocuments({ status: 'Overdue' });
    const returnedBooks = await StudentLibrary.countDocuments({ status: 'Returned' });

    // Genre distribution
    const genreStats = await Library.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly issue trends
    const monthlyIssues = await StudentLibrary.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalBooks,
      availableBooks,
      totalIssues,
      activeIssues,
      overdueBooks,
      returnedBooks,
      genreStats,
      monthlyIssues
    });
  } catch (error) {
    console.error('Error fetching library stats:', error);
    res.status(500).json({ message: 'Error fetching library stats', error: error.message });
  }
});

// Get overdue books
router.get('/overdue', checkLibrarianAccess, async (req, res) => {
  try {
    const overdueBooks = await StudentLibrary.getOverdueBooks();
    res.json(overdueBooks);
  } catch (error) {
    console.error('Error fetching overdue books:', error);
    res.status(500).json({ message: 'Error fetching overdue books', error: error.message });
  }
});

// Get student's library record (for librarians)
router.get('/student/:studentId', checkLibrarianAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const currentBooks = await StudentLibrary.getStudentBooks(studentId);
    const issueHistory = await StudentLibrary.find({ student: studentId })
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email')
      .populate('returnedBy', 'name email')
      .sort({ issueDate: -1 })
      .limit(50);

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        prn: student.prn,
        course: student.course,
        branch: student.branch,
        semester: student.semester
      },
      currentBooks,
      issueHistory
    });
  } catch (error) {
    console.error('Error fetching student library record:', error);
    res.status(500).json({ message: 'Error fetching student library record', error: error.message });
  }
});

// ==================== STUDENT ROUTES ====================

// Get student's own library information (for students)
router.get('/student/me', async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get student information
    const student = await User.findById(studentId).select('name email prn course branch semester');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's issued books
    const issuedBooks = await StudentLibrary.find({ student: studentId })
      .populate('book', 'title author isbn genre coverImage')
      .populate('issuedBy', 'name email')
      .sort({ issueDate: -1 });

    res.json({
      student,
      issuedBooks,
      totalIssued: issuedBooks.length,
      currentlyIssued: issuedBooks.filter(book => book.status === 'Issued').length,
      overdue: issuedBooks.filter(book => book.status === 'Issued' && new Date() > book.dueDate).length
    });
  } catch (error) {
    console.error('Error fetching student library info:', error);
    res.status(500).json({ message: 'Error fetching student library info', error: error.message });
  }
});

// Get student library information (for librarians)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student information
    const student = await User.findById(studentId).select('name email prn course branch semester');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's issued books
    const issuedBooks = await StudentLibrary.find({ student: studentId })
      .populate('book', 'title author isbn genre coverImage')
      .populate('issuedBy', 'name email')
      .sort({ issueDate: -1 });

    res.json({
      student,
      issuedBooks,
      totalIssued: issuedBooks.length,
      currentlyIssued: issuedBooks.filter(book => book.status === 'Issued').length,
      overdue: issuedBooks.filter(book => book.status === 'Issued' && new Date() > book.dueDate).length
    });
  } catch (error) {
    console.error('Error fetching student library info:', error);
    res.status(500).json({ message: 'Error fetching student library info', error: error.message });
  }
});

// Export library data
router.get('/export', checkLibrarianAccess, async (req, res) => {
  try {
    const { type = 'books' } = req.query;

    if (type === 'books') {
      const books = await Library.find()
        .populate('addedBy', 'name email')
        .sort({ createdAt: -1 });

      const data = books.map(book => ({
        'Title': book.title,
        'Author': book.author,
        'ISBN': book.isbn || '',
        'Genre': book.genre,
        'Quantity': book.quantity,
        'Available': book.availableQuantity,
        'Shelf No': book.shelfNo,
        'Status': book.status,
        'Added By': book.addedBy?.name || '',
        'Added Date': book.createdAt.toLocaleDateString()
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Books');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=library_books_export.xlsx');
      res.send(buffer);
    } else if (type === 'issues') {
      const issues = await StudentLibrary.find()
        .populate('student', 'name email prn')
        .populate('book', 'title author isbn')
        .populate('issuedBy', 'name email')
        .sort({ issueDate: -1 });

      const data = issues.map(issue => ({
        'Student Name': issue.student?.name || '',
        'Student Email': issue.student?.email || '',
        'PRN': issue.student?.prn || '',
        'Book Title': issue.book?.title || '',
        'Author': issue.book?.author || '',
        'ISBN': issue.book?.isbn || '',
        'Issue Date': issue.issueDate.toLocaleDateString(),
        'Due Date': issue.dueDate.toLocaleDateString(),
        'Return Date': issue.returnDate ? issue.returnDate.toLocaleDateString() : '',
        'Status': issue.status,
        'Fine Amount': issue.fineAmount,
        'Issued By': issue.issuedBy?.name || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Issues');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=library_issues_export.xlsx');
      res.send(buffer);
    } else {
      res.status(400).json({ message: 'Invalid export type. Use "books" or "issues"' });
    }
  } catch (error) {
    console.error('Error exporting library data:', error);
    res.status(500).json({ message: 'Error exporting library data', error: error.message });
  }
});

module.exports = router;
