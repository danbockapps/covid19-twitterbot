echo "Deleting old files..."
rm -rf dist function.zip

echo "Compiling TypeScript files..."
tsc

echo "Zipping files..."
zip -rqdg function.zip dist node_modules
ls -lh function.zip

echo "Uploading to AWS..."
aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip