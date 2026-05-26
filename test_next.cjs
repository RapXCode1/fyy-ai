const build = require('next/dist/build').default;

build('D:\\Projects\\Mobile\\fyy-ai-main')
  .then(() => console.log('Build done!'))
  .catch(err => {
    console.error('Captured Build error:', err);
    if (err.stack) console.error(err.stack);
  });
