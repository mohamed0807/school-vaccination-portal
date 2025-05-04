/**
 * Validate vaccination drive date
 * @param {Date} driveDate Date of the vaccination drive
 * @returns {Object} Object with isValid flag and error message
 */
const validateDriveDate = (driveDate) => {
  const today = new Date();
  const minimumDate = new Date();
  minimumDate.setDate(today.getDate() + 15);
  
  if (driveDate < minimumDate) {
    return {
      isValid: false,
      message: 'Vaccination drives must be scheduled at least 15 days in advance'
    };
  }
  
  return {
    isValid: true
  };
};

/**
 * Check if a grade is valid
 * @param {String} grade Student grade/class
 * @returns {Boolean} Whether the grade is valid
 */
const isValidGrade = (grade) => {
  const validGrades = [
    'Nursery', 
    'Kindergarten', 
    'Pre-KG', 
    ...Array.from({ length: 12 }, (_, i) => `${i + 1}`),
    ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)
  ];
  
  return validGrades.includes(grade);
};

/**
 * Format date for display
 * @param {Date} date Date to format
 * @returns {String} Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth Date of birth
 * @returns {Number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

module.exports = {
  validateDriveDate,
  isValidGrade,
  formatDate,
  calculateAge
};