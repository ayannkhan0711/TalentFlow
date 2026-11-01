/**
 * Client-side mirror of the server transition rules.
 * NOTE: The server is the authoritative source of truth.
 * This client mirror is used for instant drop-target feedback and UI disabling.
 */
export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

export const ALLOWED_TRANSITIONS = {
  Applied: ['Screening', 'Rejected'],
  Screening: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: [],
};

/**
 * Checks if transitioning an application from `fromStage` to `toStage` is permitted.
 */
export const isValidTransition = (fromStage, toStage) => {
  if (!fromStage || !toStage) return false;
  if (fromStage === toStage) return false;
  const allowed = ALLOWED_TRANSITIONS[fromStage] || [];
  return allowed.includes(toStage);
};

/**
 * Styling helpers for stage badges & column headers
 */
export const STAGE_CONFIG = {
  Applied: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-100/60',
  },
  Screening: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    headerBg: 'bg-amber-100/60',
  },
  Interview: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    headerBg: 'bg-purple-100/60',
  },
  Offer: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-100/60',
  },
  Hired: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
    headerBg: 'bg-teal-100/60',
  },
  Rejected: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    headerBg: 'bg-rose-100/60',
  },
};
