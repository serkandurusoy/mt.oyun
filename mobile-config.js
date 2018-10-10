App.accessRule('blob:*');
App.accessRule('data:*', { type: 'navigation' });
App.setPreference('WebAppStartupTimeout', 300000)
