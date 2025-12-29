const fs = require('fs');

const content = `[build]
  base = "modules/leitor-editais"
  publish = ".next"
  command = "npm install && npm run build"

[build.environment]
  NODE_VERSION = "18"
  SKIP_ENV_VALIDATION = "true"

[[plugins]]
  package = "@netlify/plugin-nextjs"
`;

// Escreve diretamente no destino final
fs.writeFileSync('c:\\oliccitador\\netlify.toml', content, 'utf8');

console.log('Arquivo netlify.toml recriado com UTF-8 sem BOM com sucesso!');
