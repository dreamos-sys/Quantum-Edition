module.exports = {
  ci: {
    collect: {
      url: ['https://dreamos.sif.sch.id'],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: { disabled: true },
        throttlingMethod: 'devtools'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:pwa': ['error', { minScore: 1.0 }],
        'categories:accessibility': ['error', { minScore: 0.98 }]
      }
    }
  }
};
