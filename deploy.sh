echo "Deleting old files..."
rm -rf dist function.zip

echo "Compiling TypeScript files..."
tsc

echo "Pruning dev dependencies from node_modules..."
npm prune --production

echo "Zipping files..."
# -r for recursive, -q for quiet mode, -dg to show loading indicator dots
zip -rqdg function.zip dist node_modules
ls -lh function.zip

echo "Uploading to AWS..."
export AWS_PAGER="" # Don't pipe output to less
aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip

echo "Reinstalling dev dependencies..."
npm install