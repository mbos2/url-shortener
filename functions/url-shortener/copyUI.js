import fs from 'fs-extra';

// Specify the source and destination directories
const sourceDir = './dev/ui'; // Adjust to your source directory
const destinationDir = './src/ui'; // Adjust to your build output directory

// Use fs-extra to copy files
fs.copySync(sourceDir, destinationDir, { overwrite: true });

console.log('Files copied successfully.');