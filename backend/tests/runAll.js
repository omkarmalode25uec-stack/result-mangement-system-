import { spawn } from 'child_process';

function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> EXECUTING ${script}...\n`);
    const proc = spawn('node', [script], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    await runScript('tests/runTests.js');
    await runScript('tests/stage3Tests.js');
    await runScript('tests/stage4Tests.js');
    await runScript('tests/stage5Tests.js');
    await runScript('tests/stage6Tests.js');
    await runScript('tests/stage7Tests.js');
    await runScript('tests/stage8Tests.js');
    console.log('\n====================================================');
    console.log('ALL STAGE 2, 3, 4, 5, 6, 7, AND 8 TEST SUITES PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nTest Suite Error:', err.message);
    process.exit(1);
  }
}

main();
