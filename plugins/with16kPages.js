const { withGradleProperties } = require('@expo/config-plugins');

const PAGE_SIZE_FLAG_KEY = 'android.enable16kPages';

module.exports = function with16kPages(config) {
  return withGradleProperties(config, (config) => {
    const filtered = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === PAGE_SIZE_FLAG_KEY)
    );

    filtered.push({
      type: 'property',
      key: PAGE_SIZE_FLAG_KEY,
      value: 'true',
    });

    config.modResults = filtered;
    return config;
  });
};

