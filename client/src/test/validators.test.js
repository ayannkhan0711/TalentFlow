import { describe, it, expect } from 'vitest';
import { validateResumeFile, validateSalaryRange } from '../utils/validators';

describe('Client Form Validators', () => {
  describe('validateResumeFile', () => {
    it('rejects missing file', () => {
      const res = validateResumeFile(null);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('required');
    });

    it('accepts valid PDF file', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      const res = validateResumeFile(file);
      expect(res.valid).toBe(true);
    });

    it('accepts valid DOCX file', () => {
      const file = new File(['content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const res = validateResumeFile(file);
      expect(res.valid).toBe(true);
    });

    it('rejects invalid file format like .exe or .png', () => {
      const file = new File(['content'], 'resume.exe', { type: 'application/x-msdownload' });
      const res = validateResumeFile(file);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invalid file format');
    });

    it('rejects files larger than 5MB', () => {
      // 6 MB file
      const bigBuffer = new Uint8Array(6 * 1024 * 1024);
      const file = new File([bigBuffer], 'huge_resume.pdf', { type: 'application/pdf' });
      const res = validateResumeFile(file);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds 5 MB');
    });
  });

  describe('validateSalaryRange', () => {
    it('accepts valid min and max salary', () => {
      const res = validateSalaryRange(80000, 120000);
      expect(res.valid).toBe(true);
    });

    it('accepts equal min and max salary', () => {
      const res = validateSalaryRange(100000, 100000);
      expect(res.valid).toBe(true);
    });

    it('rejects max salary less than min salary', () => {
      const res = validateSalaryRange(150000, 100000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('greater than or equal');
    });

    it('rejects negative salary values', () => {
      const res = validateSalaryRange(-500, 100000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot be negative');
    });
  });
});
