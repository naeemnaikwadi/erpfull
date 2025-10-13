const express = require('express');
const router = express.Router();
const FinancialTransaction = require('../models/FinancialTransaction');
const Fee = require('../models/Fee');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Middleware to ensure only accountants and admins can access these routes
router.use((req, res, next) => {
  if (!['admin', 'accountant'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Accountant access only.' });
  }
  next();
});

// Get financial dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get financial summary
    const financialSummary = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$transactionType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get income vs expense breakdown
    const incomeExpenseBreakdown = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            type: '$transactionType',
            category: '$category'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get fee collection summary
    const feeSummary = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalFees: { $sum: '$totalAmount' },
          collectedFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await FinancialTransaction.find(dateFilter)
      .populate('createdBy', 'name email')
      .sort({ transactionDate: -1 })
      .limit(10);

    // Get monthly trends
    const monthlyTrends = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            type: '$transactionType'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      financialSummary,
      incomeExpenseBreakdown,
      feeSummary: feeSummary[0] || { totalFees: 0, collectedFees: 0, pendingFees: 0 },
      recentTransactions,
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all financial transactions
router.get('/transactions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      category, 
      status, 
      startDate, 
      endDate,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;
    
    let filter = {};
    if (type) filter.transactionType = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await FinancialTransaction.find(filter)
      .populate('createdBy', 'name email')
      .populate('studentId', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FinancialTransaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new financial transaction
router.post('/transactions', async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: req.user.id
    };

    const transaction = await FinancialTransaction.create(transactionData);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update financial transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete financial transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await FinancialTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance sheet
router.get('/balance-sheet', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get income summary
    const incomeSummary = await FinancialTransaction.aggregate([
      { $match: { ...dateFilter, transactionType: 'Income' } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get expense summary
    const expenseSummary = await FinancialTransaction.aggregate([
      { $match: { ...dateFilter, transactionType: 'Expense' } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate totals
    const totalIncome = incomeSummary.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalExpense = expenseSummary.reduce((sum, item) => sum + item.totalAmount, 0);
    const netIncome = totalIncome - totalExpense;

    res.json({
      incomeSummary,
      expenseSummary,
      totals: {
        totalIncome,
        totalExpense,
        netIncome
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profit and loss statement
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all transactions grouped by type and category
    const transactions = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            type: '$transactionType',
            category: '$category'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Separate income and expenses
    const income = transactions.filter(t => t._id.type === 'Income');
    const expenses = transactions.filter(t => t._id.type === 'Expense');

    const totalIncome = income.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.totalAmount, 0);
    const netProfit = totalIncome - totalExpenses;

    res.json({
      income,
      expenses,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cash flow statement
router.get('/cash-flow', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get cash flow by month
    const monthlyCashFlow = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'Income'] }, '$amount', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'Expense'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $addFields: {
          netCashFlow: { $subtract: ['$income', '$expense'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Calculate cumulative cash flow
    let cumulativeCashFlow = 0;
    const cashFlowWithCumulative = monthlyCashFlow.map(month => {
      cumulativeCashFlow += month.netCashFlow;
      return {
        ...month,
        cumulativeCashFlow
      };
    });

    res.json({
      monthlyCashFlow: cashFlowWithCumulative,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get fee collection report
router.get('/fee-collection', async (req, res) => {
  try {
    const { startDate, endDate, course, branch } = req.query;
    
    let filter = {};
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get fee collection by course
    const feeCollectionByCourse = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$course',
          totalFees: { $sum: '$totalAmount' },
          collectedFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get fee collection by month
    const feeCollectionByMonth = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalFees: { $sum: '$totalAmount' },
          collectedFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get overall fee statistics
    const overallStats = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalFees: { $sum: '$totalAmount' },
          collectedFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' },
          totalStudents: { $sum: 1 }
        }
      }
    ]);

    res.json({
      feeCollectionByCourse,
      feeCollectionByMonth,
      overallStats: overallStats[0] || {
        totalFees: 0,
        collectedFees: 0,
        pendingFees: 0,
        totalStudents: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate financial report
router.get('/reports/financial', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, type = 'summary' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let reportData = {};

    if (type === 'summary') {
      const summary = await FinancialTransaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$transactionType',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      reportData = { summary };
    } else if (type === 'detailed') {
      const transactions = await FinancialTransaction.find(dateFilter)
        .populate('createdBy', 'name email')
        .sort({ transactionDate: -1 });
      reportData = { transactions };
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = reportData.transactions ? 
        reportData.transactions.map(t => ({
          'Transaction ID': t.transactionId,
          'Type': t.transactionType,
          'Category': t.category,
          'Amount': t.amount,
          'Description': t.description,
          'Date': t.transactionDate,
          'Status': t.status,
          'Created By': t.createdBy?.name || 'N/A'
        })) : [];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=financial_report.csv');
      
      const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
        csvData.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csv);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get budget vs actual analysis
router.get('/budget-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // This would typically involve budget data
    // For now, we'll return actual vs planned based on categories
    const actualExpenses = await FinancialTransaction.aggregate([
      { $match: { ...dateFilter, transactionType: 'Expense' } },
      {
        $group: {
          _id: '$category',
          actualAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Mock budget data - in real implementation, this would come from a budget table
    const budgetData = [
      { category: 'Salaries', budgetAmount: 500000 },
      { category: 'Utilities', budgetAmount: 50000 },
      { category: 'Maintenance', budgetAmount: 30000 },
      { category: 'Equipment', budgetAmount: 100000 },
      { category: 'Marketing', budgetAmount: 25000 }
    ];

    const analysis = budgetData.map(budget => {
      const actual = actualExpenses.find(exp => exp._id === budget.category);
      const actualAmount = actual ? actual.actualAmount : 0;
      const variance = actualAmount - budget.budgetAmount;
      const variancePercentage = budget.budgetAmount > 0 ? (variance / budget.budgetAmount) * 100 : 0;

      return {
        category: budget.category,
        budgetAmount: budget.budgetAmount,
        actualAmount,
        variance,
        variancePercentage,
        status: variance > 0 ? 'Over Budget' : variance < 0 ? 'Under Budget' : 'On Budget'
      };
    });

    res.json({
      analysis,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
