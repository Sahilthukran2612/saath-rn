const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = withNativewind(getDefaultConfig(__dirname));

// NativeWind swaps every `import ... from 'react-native'` for its own wrapper, which does not re-export
// AssetRegistry. expo-asset and expo-font need the real one (fonts and images failed to load without this), so they
// keep the plain react-native. Everything else still gets NativeWind's styled components.
const wrapped = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native' && /node_modules[\\/](expo-asset|expo-font)[\\/]/.test(context.originModulePath)) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return wrapped(context, moduleName, platform);
};

module.exports = config;
