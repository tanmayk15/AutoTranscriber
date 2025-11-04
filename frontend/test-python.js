// Test script to verify Python integration
const { spawn } = require('child_process');
const path = require('path');

console.log('='.repeat(60));
console.log('Testing Python Integration');
console.log('='.repeat(60));

// Test 1: Python version
console.log('\n1. Testing Python installation...');
const pythonVersion = spawn('python', ['--version']);

pythonVersion.stdout.on('data', (data) => {
  console.log(`   ✓ ${data.toString().trim()}`);
});

pythonVersion.stderr.on('data', (data) => {
  console.log(`   ✓ ${data.toString().trim()}`);
});

pythonVersion.on('close', (code) => {
  if (code === 0) {
    console.log('   ✓ Python is installed\n');
    
    // Test 2: Check auto_subtitle module
    console.log('2. Testing auto_subtitle module...');
    const checkModule = spawn('python', ['-c', 'import auto_subtitle; print("Module found!")']);
    
    checkModule.stdout.on('data', (data) => {
      console.log(`   ✓ ${data.toString().trim()}`);
    });
    
    checkModule.stderr.on('data', (data) => {
      console.log(`   ✗ Error: ${data.toString().trim()}`);
    });
    
    checkModule.on('close', (code) => {
      if (code === 0) {
        console.log('   ✓ auto_subtitle module is accessible\n');
        
        // Test 3: Check required packages
        console.log('3. Testing required packages...');
        const packages = ['whisper', 'gtts', 'transformers', 'ffmpeg'];
        
        packages.forEach(pkg => {
          const checkPkg = spawn('python', ['-c', `import ${pkg}; print("${pkg} OK")`]);
          
          checkPkg.stdout.on('data', (data) => {
            console.log(`   ✓ ${data.toString().trim()}`);
          });
          
          checkPkg.stderr.on('data', (data) => {
            console.log(`   ✗ ${pkg}: ${data.toString().trim()}`);
          });
        });
        
        setTimeout(() => {
          console.log('\n' + '='.repeat(60));
          console.log('Test complete! Check results above.');
          console.log('='.repeat(60));
        }, 2000);
      } else {
        console.log('   ✗ auto_subtitle module not found');
        console.log('   → You may need to run: cd auto-subtitle-main && pip install -e .');
      }
    });
  } else {
    console.log('   ✗ Python is not installed or not in PATH');
  }
});
