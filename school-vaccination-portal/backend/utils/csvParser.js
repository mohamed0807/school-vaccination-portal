const csv = require('csv-parser');
const fs = require('fs');

/**
 * Parse a CSV file and return the results as an array of objects
 * @param {string} filePath Path to CSV file
 * @returns {Promise<Array>} Array of objects representing CSV rows
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error removing temp file:', err);
        });
        
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Validate and transform CSV data for student import
 * @param {Array} data Array of raw CSV data objects
 * @returns {Object} Object with valid records and errors
 */
const validateStudentCSV = (data) => {
  const validRecords = [];
  const errors = [];
  
  const requiredFields = [
    'name', 
    'studentId', 
    'dateOfBirth', 
    'gender', 
    'grade', 
    'section', 
    'parentName', 
    'contactNumber'
  ];
  
  data.forEach((record, index) => {
    const rowErrors = [];
    
    requiredFields.forEach(field => {
      if (!record[field] || record[field].trim() === '') {
        rowErrors.push(`Missing required field: ${field}`);
      }
    });
    
    if (record.dateOfBirth) {
      const date = new Date(record.dateOfBirth);
      if (isNaN(date.getTime())) {
        rowErrors.push('Invalid date format for dateOfBirth');
      }
    }
    
    if (record.gender && !['Male', 'Female', 'Other'].includes(record.gender)) {
      rowErrors.push('Gender must be "Male", "Female", or "Other"');
    }
    
    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2,
        record,
        errors: rowErrors
      });
    } else {
      validRecords.push({
        name: record.name.trim(),
        studentId: record.studentId.trim(),
        dateOfBirth: new Date(record.dateOfBirth),
        gender: record.gender.trim(),
        grade: record.grade.trim(),
        section: record.section.trim(),
        parentName: record.parentName.trim(),
        contactNumber: record.contactNumber.trim(),
        address: record.address ? record.address.trim() : ''
      });
    }
  });
  
  return {
    validRecords,
    errors
  };
};

module.exports = {
  parseCSV,
  validateStudentCSV
};