/**
 * Form and file validation utilities.
 */

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Validates a resume file for type and size.
 * Returns { valid: true } or { valid: false, error: string }
 */
export const validateResumeFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Resume file is required' };
  }

  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const isValidType =
    ALLOWED_RESUME_TYPES.includes(file.type) ||
    ALLOWED_RESUME_EXTENSIONS.includes(extension);

  if (!isValidType) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a PDF, DOC, or DOCX document.',
    };
  }

  if (file.size > MAX_RESUME_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 5 MB. Please choose a smaller file.',
    };
  }

  return { valid: true };
};

/**
 * Validates salary range.
 */
export const validateSalaryRange = (salaryMin, salaryMax) => {
  if (salaryMin !== undefined && salaryMin !== '' && Number(salaryMin) < 0) {
    return { valid: false, error: 'Minimum salary cannot be negative' };
  }
  if (salaryMax !== undefined && salaryMax !== '' && Number(salaryMax) < 0) {
    return { valid: false, error: 'Maximum salary cannot be negative' };
  }
  if (
    salaryMin !== undefined &&
    salaryMin !== '' &&
    salaryMax !== undefined &&
    salaryMax !== ''
  ) {
    if (Number(salaryMax) < Number(salaryMin)) {
      return {
        valid: false,
        error: 'Maximum salary must be greater than or equal to minimum salary',
      };
    }
  }
  return { valid: true };
};
