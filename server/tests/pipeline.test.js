const { validateTransition, ALLOWED_TRANSITIONS } = require('../src/services/pipeline');

describe('Pipeline Transition Rules', () => {
  describe('validateTransition', () => {
    // All allowed forward transitions
    const allowedMoves = [
      ['Applied', 'Screening'],
      ['Applied', 'Rejected'],
      ['Screening', 'Interview'],
      ['Screening', 'Rejected'],
      ['Interview', 'Offer'],
      ['Interview', 'Rejected'],
      ['Offer', 'Hired'],
      ['Offer', 'Rejected'],
    ];

    test.each(allowedMoves)(
      'allows %s -> %s',
      (from, to) => {
        const result = validateTransition(from, to);
        expect(result.valid).toBe(true);
      }
    );

    // Disallowed skipping transitions
    const disallowedMoves = [
      ['Applied', 'Interview'],
      ['Applied', 'Offer'],
      ['Applied', 'Hired'],
      ['Screening', 'Offer'],
      ['Screening', 'Hired'],
      ['Interview', 'Hired'],
    ];

    test.each(disallowedMoves)(
      'rejects %s -> %s (skip)',
      (from, to) => {
        const result = validateTransition(from, to);
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      }
    );

    // Terminal stages
    test('rejects any transition out of Hired', () => {
      const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
      stages.forEach((to) => {
        const result = validateTransition('Hired', to);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('terminal');
      });
    });

    test('rejects any transition out of Rejected', () => {
      const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
      stages.forEach((to) => {
        const result = validateTransition('Rejected', to);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('terminal');
      });
    });

    // Same-stage moves
    test.each(['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'])(
      'rejects same-stage move for %s',
      (stage) => {
        const result = validateTransition(stage, stage);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('already');
      }
    );
  });
});
