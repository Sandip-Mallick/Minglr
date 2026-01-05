// Shim for jimp-compact on web platform
// This prevents the "Could not find MIME for Buffer" error
module.exports = {
    // Empty implementation - image processing won't work on web but app won't crash
    read: () => Promise.reject(new Error('Jimp not available on web')),
    MIME_PNG: 'image/png',
    MIME_JPEG: 'image/jpeg',
    AUTO: -1,
};
