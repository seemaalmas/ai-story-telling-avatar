module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta.env.X -> process.env.X for web compatibility
      // Zustand and other libs use import.meta.env which Metro doesn't handle
      function importMetaTransform() {
        return {
          visitor: {
            MetaProperty(path) {
              // Transform import.meta.env.MODE -> process.env.NODE_ENV
              if (
                path.parent.type === 'MemberExpression' &&
                path.parent.property.name === 'env'
              ) {
                const grandParent = path.parentPath.parent;
                if (
                  grandParent.type === 'MemberExpression' &&
                  grandParent.property.name === 'MODE'
                ) {
                  path.parentPath.parentPath.replaceWithSourceString(
                    'process.env.NODE_ENV'
                  );
                } else {
                  // import.meta.env -> process.env
                  path.parentPath.replaceWithSourceString('process.env');
                }
              }
              // import.meta.url -> ""
              if (
                path.parent.type === 'MemberExpression' &&
                path.parent.property.name === 'url'
              ) {
                path.parentPath.replaceWithSourceString('""');
              }
            },
          },
        };
      },
      'react-native-reanimated/plugin',
    ],
  };
};
