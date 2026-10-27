const { withGradleProperties } = require('expo/config-plugins');

// SPEC-GAP: La spec no define herramientas C++ para rutas largas en Windows.
// CMake 3.31.6 acorta rutas de objetos que 3.22.1 deja completas; Ninja actualizado puede compilarlas.
const windowsProperties = {
  'android.cmakeVersion': '3.31.6',
  'expo.android.cmakeObjectPathMax': '240',
};

function withWindowsCmake(config) {
  if (process.platform !== 'win32') return config;

  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = modConfig.modResults.filter(
      (item) => item.type !== 'property' || !(item.key in windowsProperties),
    );

    for (const [key, value] of Object.entries(windowsProperties)) {
      modConfig.modResults.push({ type: 'property', key, value });
    }

    return modConfig;
  });
}

module.exports = withWindowsCmake;
