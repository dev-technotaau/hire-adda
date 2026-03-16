import {
  postprocessResume,
  normalizeEmail,
  normalizePhone,
  normalizeName,
  normalizeSkills,
  normalizeDate,
} from '../resume-postprocessing.service';
import type { ParsedResumeData } from '../resume-parser.service';

describe('Resume Postprocessing Service', () => {
  describe('normalizeEmail', () => {
    it('should normalize valid emails to lowercase', () => {
      expect(normalizeEmail('John.Doe@Example.COM')).toBe('john.doe@example.com');
    });

    it('should reject invalid email formats', () => {
      expect(normalizeEmail('not-an-email')).toBeNull();
      expect(normalizeEmail('missing@domain')).toBeNull();
      expect(normalizeEmail('@nodomain.com')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle null input', () => {
      expect(normalizeEmail(null)).toBeNull();
    });
  });

  describe('normalizePhone', () => {
    it('should add +91 for 10-digit Indian numbers', () => {
      expect(normalizePhone('9876543210')).toBe('+919876543210');
    });

    it('should add +1 for 10-digit US numbers starting with other digits', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
    });

    it('should preserve existing country code', () => {
      expect(normalizePhone('+44 20 1234 5678')).toBe('+442012345678');
    });

    it('should remove non-digit characters', () => {
      expect(normalizePhone('(987) 654-3210')).toBe('+919876543210');
    });

    it('should handle numbers with dashes and spaces', () => {
      expect(normalizePhone('+91-987-654-3210')).toBe('+919876543210');
    });

    it('should return original for invalid lengths', () => {
      expect(normalizePhone('123')).toBe('123'); // Too short
    });

    it('should handle null input', () => {
      expect(normalizePhone(null)).toBeNull();
    });
  });

  describe('normalizeName', () => {
    it('should convert to title case', () => {
      expect(normalizeName('JOHN DOE')).toBe('John Doe');
      expect(normalizeName('jane smith')).toBe('Jane Smith');
    });

    it('should remove common prefixes', () => {
      expect(normalizeName('Mr. John Doe')).toBe('John Doe');
      expect(normalizeName('Dr. Jane Smith')).toBe('Jane Smith');
      expect(normalizeName('Prof. Alice Johnson')).toBe('Alice Johnson');
    });

    it('should remove common suffixes', () => {
      expect(normalizeName('John Doe Jr.')).toBe('John Doe');
      expect(normalizeName('Jane Smith III')).toBe('Jane Smith');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeName('John    Doe')).toBe('John Doe');
    });

    it('should handle null input', () => {
      expect(normalizeName(null)).toBeNull();
    });

    it('should preserve hyphenated names', () => {
      expect(normalizeName('mary-jane watson')).toBe('Mary-jane Watson');
    });
  });

  describe('normalizeSkills', () => {
    it('should deduplicate skills case-insensitively', () => {
      const skills = ['JavaScript', 'javascript', 'JAVASCRIPT'];
      const result = normalizeSkills(skills);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('JavaScript');
    });

    it('should normalize common technology names', () => {
      expect(normalizeSkills(['nodejs'])).toContain('Node.js');
      expect(normalizeSkills(['reactjs'])).toContain('React');
      expect(normalizeSkills(['typescript'])).toContain('TypeScript');
      expect(normalizeSkills(['mongodb'])).toContain('MongoDB');
      expect(normalizeSkills(['postgresql'])).toContain('PostgreSQL');
    });

    it('should remove very short skills', () => {
      const skills = ['React', 'JS', 'X', 'TypeScript'];
      const result = normalizeSkills(skills);
      expect(result).toContain('React');
      expect(result).toContain('TypeScript');
      expect(result).not.toContain('X');
    });

    it('should title case multi-word skills', () => {
      const skills = ['machine learning', 'data science'];
      const result = normalizeSkills(skills);
      expect(result).toContain('Machine Learning');
      expect(result).toContain('Data Science');
    });

    it('should handle empty array', () => {
      expect(normalizeSkills([])).toEqual([]);
    });
  });

  describe('normalizeDate', () => {
    it('should handle "Present" as null', () => {
      expect(normalizeDate('Present')).toBeNull();
      expect(normalizeDate('Current')).toBeNull();
      expect(normalizeDate('Now')).toBeNull();
    });

    it('should parse MM/YYYY format', () => {
      expect(normalizeDate('06/2020')).toBe('06/2020');
    });

    it('should parse YYYY only', () => {
      expect(normalizeDate('2020')).toBe('2020-01-01');
    });

    it('should parse Month YYYY format', () => {
      expect(normalizeDate('January 2020')).toBe('2020-01-01');
      expect(normalizeDate('Dec 2021')).toBe('2021-12-01');
    });

    it('should preserve ISO format dates', () => {
      expect(normalizeDate('2020-06-15')).toBe('2020-06-15');
    });

    it('should return original for unparseable dates', () => {
      expect(normalizeDate('invalid date')).toBe('invalid date');
    });

    it('should handle null input', () => {
      expect(normalizeDate(null)).toBeNull();
    });
  });

  describe('postprocessResume', () => {
    it('should normalize all fields', async () => {
      const rawData: ParsedResumeData = {
        name: 'Mr. JOHN DOE',
        email: 'John.Doe@Example.COM',
        phone: '9876543210',
        skills: ['JavaScript', 'javascript', 'reactjs', 'nodejs'],
        experience: [
          {
            company: 'Acme Inc',
            role: 'Software Engineer',
            startDate: '06/2020',
            endDate: 'Present',
            description: 'Developed web applications',
          },
        ],
        education: [
          {
            institution: 'MIT',
            degree: 'B.Tech',
            field: 'Computer Science',
            startDate: '2016',
            endDate: '2020',
          },
        ],
        certifications: ['AWS Certified', 'X'],
        summary: '  Experienced developer  ',
      };

      const result = await postprocessResume(rawData);

      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john.doe@example.com');
      expect(result.data.phone).toBe('+919876543210');
      expect(result.data.skills).toContain('JavaScript');
      expect(result.data.skills).toContain('React');
      expect(result.data.skills).toContain('Node.js');
      expect(result.data.skills).toHaveLength(3); // Deduplicated
      expect(result.data.experience[0].endDate).toBeNull(); // Present → null
      expect(result.data.certifications).not.toContain('X'); // Removed short cert
      expect(result.data.summary).toBe('Experienced developer');
    });

    it('should calculate high confidence for complete data', async () => {
      const completeData: ParsedResumeData = {
        name: 'John Michael Doe',
        email: 'john.doe@example.com',
        phone: '+919876543210',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB'],
        experience: [
          {
            company: 'Acme Corp',
            role: 'Senior Software Engineer',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            description: 'Led development team',
          },
        ],
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor of Technology',
            field: 'Computer Science',
            startDate: '2016-08-01',
            endDate: '2020-05-31',
          },
        ],
        certifications: ['AWS Certified Solutions Architect'],
        summary: 'Experienced software engineer with 5+ years in web development',
      };

      const result = await postprocessResume(completeData);

      expect(result.confidence.overall).toBeGreaterThan(0.85);
      expect(result.confidence.fields.name).toBeGreaterThan(0.9);
      expect(result.confidence.fields.email).toBeGreaterThan(0.9);
      expect(result.confidence.fields.phone).toBeGreaterThan(0.9);
      expect(result.confidence.fields.skills).toBeGreaterThan(0.85);
    });

    it('should detect invalid experience dates', async () => {
      const invalidData: ParsedResumeData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        skills: ['JavaScript'],
        experience: [
          {
            company: 'Acme Corp',
            role: 'Engineer',
            startDate: '2023-01-01',
            endDate: '2020-01-01', // End before start!
            description: null,
          },
        ],
        education: [],
        certifications: [],
        summary: null,
      };

      const result = await postprocessResume(invalidData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('End date before start date'))).toBe(true);
    });

    it('should filter out invalid experience entries', async () => {
      const invalidData: ParsedResumeData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        skills: ['JavaScript'],
        experience: [
          {
            company: '',
            role: '',
            startDate: null,
            endDate: null,
            description: null,
          },
          {
            company: 'Valid Corp',
            role: 'Engineer',
            startDate: '2020-01-01',
            endDate: '2023-01-01',
            description: 'Valid experience',
          },
        ],
        education: [],
        certifications: [],
        summary: null,
      };

      const result = await postprocessResume(invalidData);

      expect(result.data.experience).toHaveLength(1);
      expect(result.data.experience[0].company).toBe('Valid Corp');
    });

    it('should add warnings for low confidence', async () => {
      const lowConfidenceData: ParsedResumeData = {
        name: 'J',
        email: 'invalid-email',
        phone: '123',
        skills: ['JS'],
        experience: [],
        education: [],
        certifications: [],
        summary: null,
      };

      const result = await postprocessResume(lowConfidenceData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.confidence.overall).toBeLessThan(0.7);
    });

    it('should handle completely empty data gracefully', async () => {
      const emptyData: ParsedResumeData = {
        name: null,
        email: null,
        phone: null,
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        summary: null,
      };

      const result = await postprocessResume(emptyData);

      expect(result.data).toBeDefined();
      expect(result.confidence.overall).toBeLessThan(0.5);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should normalize education dates', async () => {
      const data: ParsedResumeData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        skills: ['JavaScript'],
        experience: [],
        education: [
          {
            institution: 'MIT',
            degree: 'B.Tech',
            field: 'CS',
            startDate: '2016',
            endDate: 'May 2020',
          },
        ],
        certifications: [],
        summary: null,
      };

      const result = await postprocessResume(data);

      expect(result.data.education[0].startDate).toBe('2016-01-01');
      expect(result.data.education[0].endDate).toBe('2020-05-01');
    });
  });
});
