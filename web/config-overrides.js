module.exports = function override(config, env) {
  // Ignore source map warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  // Find and configure source-map-loader to exclude node_modules
  config.module.rules = config.module.rules.map(rule => {
    if (rule.enforce === 'pre' && rule.use) {
      const sourceMapLoader = Array.isArray(rule.use)
        ? rule.use.find(loader => loader.loader && loader.loader.includes('source-map-loader'))
        : rule.use.loader && rule.use.loader.includes('source-map-loader') ? rule.use : null;

      if (sourceMapLoader) {
        // Exclude all node_modules from source-map-loader
        rule.exclude = /node_modules/;
      }
    }
    return rule;
  });

  return config;
};
