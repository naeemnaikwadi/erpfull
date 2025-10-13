const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  pointsEarned: { type: Number, default: 0 },
  feedback: String,
  timeSpent: Number
});

const courseQuizAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseQuiz', required: true },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  attemptNumber: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  timeSpent: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  createdAt: { type: Date, default: Date.now }
});

courseQuizAttemptSchema.pre('save', function(next) {
  if (this.answers.length > 0) {
    this.totalScore = this.answers.reduce((total, answer) => total + (answer.pointsEarned || 0), 0);
    this.percentage = Math.round((this.totalScore / (this.maxScore || 1)) * 100);
  }
  next();
});

courseQuizAttemptSchema.methods.completeAttempt = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  if (this.startedAt) {
    this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
  }
  return this;
};

module.exports = mongoose.model('CourseQuizAttempt', courseQuizAttemptSchema);


