const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = path.join(__dirname, decodeURIComponent(url.parse(req.url).pathname));
  
  // Si c'est un dossier, servir index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  
  // Par défaut, servir login.html à la racine
  if (filePath === __dirname) {
    filePath = path.join(__dirname, 'login.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - Page non trouvée</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            h1 { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1>404 - Page non trouvée</h1>
          <p>Fichier demandé: ${req.url}</p>
          <a href="http://localhost:${PORT}">Retour à l'accueil</a>
        </body>
        </html>
      `);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📁 Répertoire servi: ${__dirname}`);
  console.log(`Appuyez sur Ctrl+C pour arrêter le serveur\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé!`);
    console.log(`Changez le PORT dans ce fichier ou arrêtez l'application qui l'utilise.`);
  } else {
    console.error('Erreur serveur:', err);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n✅ Serveur arrêté');
  process.exit(0);
});
