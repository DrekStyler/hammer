// A script to fix problematic node_modules files
const fs = require('fs');
const path = require('path');

function fixEmotionReactFile() {
  try {
    const emotionFilePath = path.resolve('./node_modules/@emotion/react/dist/emotion-react.browser.esm.js');

    if (fs.existsSync(emotionFilePath)) {
      const content = fs.readFileSync(emotionFilePath, 'utf8');

      // Check if the file has the problematic pattern
      if (content.includes('var key = cache.key + "-(typeof window !== "undefined" ? window : global)";')) {
        console.log('Fixing @emotion/react file...');

        // Replace double quotes with single quotes around "undefined"
        const fixed = content.replace(
          'var key = cache.key + "-(typeof window !== "undefined" ? window : global)";',
          'var key = cache.key + "-(typeof window !== \'undefined\' ? window : global)";'
        );

        fs.writeFileSync(emotionFilePath, fixed, 'utf8');
        console.log('Fixed @emotion/react file successfully!');
      } else {
        console.log('@emotion/react file does not have the problematic pattern or was already fixed');
      }
    } else {
      console.log('Could not find @emotion/react file');
    }
  } catch (error) {
    console.error('Error fixing @emotion/react file:', error);
  }
}

function fixWebChannelFile() {
  try {
    // Using a wildcard path since the exact folder might vary
    const baseDir = path.resolve('./node_modules/@firebase/webchannel-wrapper/dist');
    const files = fs.readdirSync(baseDir, { recursive: true });

    let fixed = false;

    files.forEach(file => {
      if (file.includes('webchannel_blob_es2018.js')) {
        const filePath = path.join(baseDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('Cannot find (typeof window !== "undefined"')) {
          console.log(`Fixing Firebase WebChannel file: ${filePath}`);

          const fixedContent = content.replace(
            /(Cannot find \(typeof window !== )"(undefined)/g,
            '$1\'$2\''
          );

          fs.writeFileSync(filePath, fixedContent, 'utf8');
          fixed = true;
          console.log('Fixed Firebase WebChannel file successfully!');
        }
      }
    });

    if (!fixed) {
      console.log('Could not find problematic WebChannel file or it was already fixed');
    }
  } catch (error) {
    console.error('Error fixing WebChannel file:', error);
  }
}

// Run both fixes
fixEmotionReactFile();
fixWebChannelFile();

console.log('Module fixes completed!');