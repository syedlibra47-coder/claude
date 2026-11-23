const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
  p.on('console', m => console.log('page:', m.text()));
  await p.goto('http://127.0.0.1:8765/.taste-skill/snap.html');
  await p.waitForFunction('window.ready');
  for (const [k, f] of [['towers','sobha-one'],['tall','safa-two'],['villas','palm-jebel-ali'],['creek','creek-waters-2'],['venice','azizi-venice']]) {
    const d = await p.evaluate(k => window.snap(k), k);
    fs.writeFileSync(`assets/models/${f}.webp`, Buffer.from(d.split(',')[1], 'base64')); console.log('saved', f);
  }
  await b.close();
})();
