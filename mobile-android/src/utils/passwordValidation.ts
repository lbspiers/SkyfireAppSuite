// Password Validation Utilities
// Comprehensive password strength analysis and validation

import {
  PasswordStrength,
  PasswordRequirement,
  DEFAULT_PASSWORD_REQUIREMENTS,
} from './passwordResetTypes';

// Common weak passwords list (subset - in production, use a comprehensive list)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'password!', 'admin123', 'root', 'toor', 'pass',
  'test', 'guest', 'info', 'changeme', 'default', 'login',
  'skyfire', 'solar', 'skyfire123', 'solar123',
]);

// Password pattern matchers
const PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
  repeated: /(.)\1{2,}/,
  sequential: /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i,
  keyboard: /(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i,
};

/**
 * Validate password and return strength analysis
 */
export const validatePassword = (password: string): PasswordStrength => {
  const requirements = evaluateRequirements(password);
  const score = calculateStrengthScore(password, requirements);
  const feedback = generateFeedback(password, requirements, score);

  return {
    score,
    feedback,
    requirements,
  };
};

/**
 * Evaluate each password requirement
 */
const evaluateRequirements = (password: string): PasswordRequirement[] => {
  const requirements = [...DEFAULT_PASSWORD_REQUIREMENTS];

  // Check minimum length
  requirements.find(r => r.id === 'min-length')!.isMet = password.length >= 8;

  // Check uppercase letters
  requirements.find(r => r.id === 'uppercase')!.isMet = PATTERNS.uppercase.test(password);

  // Check lowercase letters
  requirements.find(r => r.id === 'lowercase')!.isMet = PATTERNS.lowercase.test(password);

  // Check numbers
  requirements.find(r => r.id === 'number')!.isMet = PATTERNS.number.test(password);

  // Check special characters
  requirements.find(r => r.id === 'special')!.isMet = PATTERNS.special.test(password);

  // Check if not a common password
  requirements.find(r => r.id === 'no-common')!.isMet = !isCommonPassword(password);

  return requirements;
};

/**
 * Calculate password strength score (0-4)
 */
const calculateStrengthScore = (password: string, requirements: PasswordRequirement[]): number => {
  let score = 0;
  let penalties = 0;

  // Base score from requirements
  const metRequiredRequirements = requirements.filter(r => r.isRequired && r.isMet).length;
  const totalRequiredRequirements = requirements.filter(r => r.isRequired).length;
  const metOptionalRequirements = requirements.filter(r => !r.isRequired && r.isMet).length;

  // Basic score based on requirements
  score = (metRequiredRequirements / totalRequiredRequirements) * 3;

  // Bonus for optional requirements
  score += metOptionalRequirements * 0.5;

  // Length bonus
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  // Variety bonus
  const varietyScore = calculateVarietyScore(password);
  score += varietyScore * 0.3;

  // Penalties
  penalties += calculatePenalties(password);
  score -= penalties;

  // Normalize to 0-4 range
  score = Math.max(0, Math.min(4, score));

  return Math.round(score);
};

/**
 * Calculate variety score based on character classes
 */
const calculateVarietyScore = (password: string): number => {
  let variety = 0;

  if (PATTERNS.uppercase.test(password)) variety++;
  if (PATTERNS.lowercase.test(password)) variety++;
  if (PATTERNS.number.test(password)) variety++;
  if (PATTERNS.special.test(password)) variety++;

  // Additional variety checks
  const uniqueChars = new Set(password.toLowerCase()).size;
  const varietyRatio = uniqueChars / password.length;

  if (varietyRatio > 0.7) variety += 0.5;
  if (varietyRatio > 0.8) variety += 0.5;

  return variety;
};

/**
 * Calculate penalties for common patterns
 */
const calculatePenalties = (password: string): number => {
  let penalties = 0;

  // Repeated characters penalty
  if (PATTERNS.repeated.test(password)) {
    penalties += 1;
  }

  // Sequential characters penalty
  if (PATTERNS.sequential.test(password)) {
    penalties += 0.5;
  }

  // Keyboard patterns penalty
  if (PATTERNS.keyboard.test(password)) {
    penalties += 0.5;
  }

  // All same case penalty
  if (password === password.toLowerCase() || password === password.toUpperCase()) {
    penalties += 0.5;
  }

  // Numbers only at end penalty
  if (/\d+$/.test(password) && password.length > 4) {
    const numberSuffix = password.match(/\d+$/)?.[0] || '';
    if (numberSuffix.length >= 2) {
      penalties += 0.3;
    }
  }

  // Personal info patterns (company name, etc.)
  const personalPatterns = ['skyfire', 'solar', 'design'];
  for (const pattern of personalPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      penalties += 0.5;
      break;
    }
  }

  return penalties;
};

/**
 * Check if password is commonly used
 */
const isCommonPassword = (password: string): boolean => {
  const lower = password.toLowerCase();

  // Direct match
  if (COMMON_PASSWORDS.has(lower)) {
    return true;
  }

  // Check variations with numbers at end
  const basePassword = lower.replace(/\d+$/, '');
  if (COMMON_PASSWORDS.has(basePassword)) {
    return true;
  }

  // Check variations with special chars at end
  const basePasswordNoSpecial = lower.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/, '');
  if (COMMON_PASSWORDS.has(basePasswordNoSpecial)) {
    return true;
  }

  // Check leetspeak variations
  const deLeetSpeak = lower
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');

  if (COMMON_PASSWORDS.has(deLeetSpeak)) {
    return true;
  }

  return false;
};

/**
 * Generate helpful feedback messages
 */
const generateFeedback = (
  password: string,
  requirements: PasswordRequirement[],
  score: number
): string[] => {
  const feedback: string[] = [];

  // Score-based feedback
  switch (score) {
    case 0:
      feedback.push('Very weak password. Please follow all requirements.');
      break;
    case 1:
      feedback.push('Weak password. Consider adding more character types.');
      break;
    case 2:
      feedback.push('Fair password. Adding length and variety would improve security.');
      break;
    case 3:
      feedback.push('Good password! Consider making it longer for better security.');
      break;
    case 4:
      feedback.push('Strong password! Well done.');
      break;
  }

  // Specific requirement feedback
  const unmetRequired = requirements.filter(r => r.isRequired && !r.isMet);
  if (unmetRequired.length > 0) {
    feedback.push(`Missing: ${unmetRequired.map(r => r.description.toLowerCase()).join(', ')}`);
  }

  // Length-specific feedback
  if (password.length < 8) {
    feedback.push('Password is too short. Use at least 8 characters.');
  } else if (password.length < 12) {
    feedback.push('Consider using 12+ characters for better security.');
  }

  // Pattern-specific feedback
  if (PATTERNS.repeated.test(password)) {
    feedback.push('Avoid repeating characters (e.g., "aaa").');
  }

  if (PATTERNS.sequential.test(password)) {
    feedback.push('Avoid sequential characters (e.g., "abc", "123").');
  }

  if (PATTERNS.keyboard.test(password)) {
    feedback.push('Avoid keyboard patterns (e.g., "qwerty").');
  }

  if (isCommonPassword(password)) {
    feedback.push('This is a commonly used password. Try something unique.');
  }

  // Positive reinforcement
  if (score >= 3) {
    const strengths: string[] = [];

    if (password.length >= 12) strengths.push('good length');
    if (PATTERNS.special.test(password)) strengths.push('special characters');
    if (calculateVarietyScore(password) >= 3) strengths.push('good variety');

    if (strengths.length > 0) {
      feedback.push(`Strengths: ${strengths.join(', ')}.`);
    }
  }

  return feedback;
};

/**
 * Get password strength color for UI
 */
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
      return '#FF4444'; // Red
    case 1:
      return '#FF8800'; // Orange
    case 2:
      return '#FFCC00'; // Yellow
    case 3:
      return '#88CC00'; // Light Green
    case 4:
      return '#00AA00'; // Green
    default:
      return '#CCCCCC'; // Gray
  }
};

/**
 * Get password strength label for UI
 */
export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
};

/**
 * Check if passwords match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Check if password meets minimum requirements for submission
 */
export const meetsMinimumRequirements = (password: string): boolean => {
  const strength = validatePassword(password);
  const requiredMet = strength.requirements.filter(r => r.isRequired).every(r => r.isMet);
  return requiredMet && strength.score >= 2; // At least "Fair" strength
};

/**
 * Generate password suggestions
 */
export const generatePasswordSuggestions = (): string[] => {
  const suggestions = [
    'Use a passphrase: "Coffee@Dawn&Moon2024"',
    'Combine words: "BlueOcean$Wave23"',
    'Use acronyms: "ILtG2W!n2024" (I Love to Go 2 Work! in 2024)',
    'Personal formula: "Skyfire+Solar=2024!"',
    'Random words: "Tiger#Mountain$42"',
  ];

  // Return 3 random suggestions
  const shuffled = suggestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

/**
 * Estimate password crack time (simplified)
 */
export const estimateCrackTime = (password: string): string => {
  const strength = validatePassword(password);

  switch (strength.score) {
    case 0:
      return 'Seconds';
    case 1:
      return 'Minutes';
    case 2:
      return 'Hours';
    case 3:
      return 'Years';
    case 4:
      return 'Centuries';
    default:
      return 'Unknown';
  }
};

// Export main validation function and utilities
export default {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  doPasswordsMatch,
  meetsMinimumRequirements,
  generatePasswordSuggestions,
  estimateCrackTime,
  isCommonPassword,
};