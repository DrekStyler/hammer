#!/bin/bash

# Find all js and jsx files in the src directory
find frontend/my-app/src -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    # Remove lines that import CSS files
    sed -i '' '/import.*\.css/d' "$file"
    echo "Processed $file"
done

echo "All CSS imports have been removed!" 