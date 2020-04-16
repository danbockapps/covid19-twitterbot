tsc
zip -r function.zip dist node_modules
aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip