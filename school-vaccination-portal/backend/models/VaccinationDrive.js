const mongoose = require('mongoose');

const VaccinationDriveSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: [true, 'Please add a vaccine name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  driveDate: {
    type: Date,
    required: [true, 'Please add a date for the drive']
  },
  doses: {
    type: Number,
    required: [true, 'Please add number of available doses'],
    min: [1, 'Number of doses must be at least 1']
  },
  applicableGrades: {
    type: [String],
    required: [true, 'Please specify applicable grades']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dosesAdministered: {
    type: Number,
    default: 0
  }
});

VaccinationDriveSchema.pre('save', function(next) {
  if (!this.isModified('driveDate')) {
    return next();
  }

  const today = new Date();
  const minimumDate = new Date();
  minimumDate.setDate(today.getDate() + 15);
  
  if (this.driveDate < minimumDate) {
    return next(new Error('Vaccination drives must be scheduled at least 15 days in advance'));
  }
  
  next();
});

module.exports = mongoose.model('VaccinationDrive', VaccinationDriveSchema);