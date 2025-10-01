#!/bin/bash
set -e

echo "Installing client dependencies..."
cd client
npm ci

echo "Building React app..."
npm run build

echo "Moving build to root..."
cd ..
mv client/build ./build

echo "Build complete!"
