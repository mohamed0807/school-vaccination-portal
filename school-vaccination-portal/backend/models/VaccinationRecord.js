const mongoose = require('mongoose');

const VaccinationRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student',
    required: true
  },
  vaccinationDrive: {
    type: mongoose.Schema.ObjectId,
    ref: 'VaccinationDrive',
    required: true
  },
  vaccineName: {
    type: String,
    required: true
  },
  administeredDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  administeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

VaccinationRecordSchema.index(
  { student: 1, vaccineName: 1 },
  { unique: true }
);

module.exports = mongoose.model('VaccinationRecord', VaccinationRecordSchema);