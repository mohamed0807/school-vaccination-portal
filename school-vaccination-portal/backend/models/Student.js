const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Please add a student ID'],
    unique: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Please add gender']
  },
  grade: {
    type: String,
    required: [true, 'Please add grade/class']
  },
  section: {
    type: String,
    required: [true, 'Please add section']
  },
  parentName: {
    type: String,
    required: [true, 'Please add parent name']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add contact number']
  },
  address: {
    type: String,
    required: [true, 'Please add address']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

StudentSchema.index({ name: 'text', studentId: 'text', grade: 'text' });

module.exports = mongoose.model('Student', StudentSchema);