#!/bin/bash
set -e

echo "Installing client dependencies..."
cd client
npm install

echo "Building React app..."
npm run build

echo "Build complete! Build directory is at client/build"
