const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('Running postbuild copy script...');
copyFolderSync(
  path.join(__dirname, '../.next/static'),
  path.join(__dirname, '../.next/standalone/.next/static')
);
copyFolderSync(
  path.join(__dirname, '../public'),
  path.join(__dirname, '../.next/standalone/public')
);
console.log('Postbuild copy complete!');
