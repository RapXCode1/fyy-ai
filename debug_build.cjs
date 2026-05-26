Error.prepareStackTrace = (err, structuredStackTrace) => {
  return err.toString() + '\n' + structuredStackTrace.map(frame => {
    return `    at ${frame.getFunctionName() || '<anonymous>'} (${frame.getFileName()}:${frame.getLineNumber()}:${frame.getColumnNumber()})`;
  }).join('\n');
};

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION CAUGHT BY CUSTOM FORMATTER:');
  console.error(err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION CAUGHT BY CUSTOM FORMATTER:');
  console.error(reason.stack || reason);
});

// Require and run next build directly so it runs in-process
const build = require('next/dist/build').default;
build('D:\\Projects\\Mobile\\fyy-ai-main')
  .then(() => console.log('Build done!'))
  .catch(err => {
    console.error('Captured Build error:', err.stack || err);
  });
