const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Jimp MIME error on web platform
// Create alias to replace jimp-compact with our shim
const shimPath = path.resolve(__dirname, 'jimp-web-shim.js');

// Store the original resolver
const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // On web, replace jimp-compact with our shim
    if (platform === 'web' && (moduleName === 'jimp-compact' || moduleName.startsWith('jimp-compact/'))) {
        return {
            filePath: shimPath,
            type: 'sourceFile',
        };
    }

    // On web, also replace @expo/image-utils references to jimp
    if (platform === 'web' && moduleName.includes('jimp')) {
        return {
            filePath: shimPath,
            type: 'sourceFile',
        };
    }

    // Fall back to default resolver
    if (originalResolver) {
        return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

