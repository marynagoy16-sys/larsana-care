const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, '..', '..', '..', 'packages', 'shared')

const config = getDefaultConfig(projectRoot)

// @larsana/shared é um symlink para fora do projeto; o Metro precisa observá-lo.
config.watchFolders = [sharedRoot]

// Para web, substitui react-native-maps por um stub (não é compatível com web)
const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'src', 'lib', 'react-native-maps-web-stub.js') }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
