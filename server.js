// ============================================
// server.js - Monitoraggio Spese Mediche
// Fatto con: http, fs, path (moduli di Node.js)
// ============================================

const http = require('http')
const fs   = require('fs')
const path = require('path')

const PORTA    = 3000
const FILE_JSON = path.join(__dirname, 'data', 'spese.json')
const FILE_CSV  = path.join(__dirname, 'data', 'spese.csv')
const FILE_XML  = path.join(__dirname, 'data', 'spese.xml')

// -----------------------------------------------
// Legge il file JSON e restituisce l'array spese
// -----------------------------------------------
function leggiSpese() {
  const testo = fs.readFileSync(FILE_JSON, 'utf8')
  return JSON.parse(testo)
}

// -----------------------------------------------
// Salva l'array spese in tutti e 3 i formati
// -----------------------------------------------
function salvaSpese(spese) {
  // JSON
  fs.writeFileSync(FILE_JSON, JSON.stringify(spese, null, 2), 'utf8')

  // CSV
  let csv = 'id,data,descrizione,categoria,importo,rimborsabile\n'
  for (const s of spese) {
    csv += `${s.id},${s.data},${s.descrizione},${s.categoria},${s.importo},${s.rimborsabile}\n`
  }
  fs.writeFileSync(FILE_CSV, csv, 'utf8')

  // XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<spese>\n'
  for (const s of spese) {
    xml += `  <spesa>\n`
    xml += `    <id>${s.id}</id>\n`
    xml += `    <data>${s.data}</data>\n`
    xml += `    <descrizione>${s.descrizione}</descrizione>\n`
    xml += `    <categoria>${s.categoria}</categoria>\n`
    xml += `    <importo>${s.importo}</importo>\n`
    xml += `    <rimborsabile>${s.rimborsabile}</rimborsabile>\n`
    xml += `  </spesa>\n`
  }
  xml += '</spese>'
  fs.writeFileSync(FILE_XML, xml, 'utf8')
}

// -----------------------------------------------
// Prende il corpo della richiesta HTTP (testo)
// -----------------------------------------------
function leggiBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => resolve(body))
  })
}

// -----------------------------------------------
// Manda una risposta JSON
// -----------------------------------------------
function rispostaJSON(res, codice, dati) {
  res.writeHead(codice, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(dati))
}

// -----------------------------------------------
// Serve i file statici (html, css)
// -----------------------------------------------
function serveFile(res, percorso) {
  try {
    const contenuto = fs.readFileSync(percorso)
    const estensione = path.extname(percorso)
    const tipi = { '.html': 'text/html', '.css': 'text/css' }
    res.writeHead(200, { 'Content-Type': tipi[estensione] || 'text/plain' })
    res.end(contenuto)
  } catch {
    res.writeHead(404)
    res.end('File non trovato')
  }
}

// -----------------------------------------------
// SERVER HTTP - gestisce tutte le richieste
// -----------------------------------------------
const server = http.createServer(async (req, res) => {
  const url    = req.url
  const metodo = req.method

  // --- Pagina principale ---
  if (url === '/' || url === '/index.html') {
    return serveFile(res, path.join(__dirname, 'public', 'index.html'))
  }

  if (url === '/style.css') {
    return serveFile(res, path.join(__dirname, 'public', 'style.css'))
  }

  // --- Download file ---
  if (url === '/download/json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="spese.json"' })
    return res.end(fs.readFileSync(FILE_JSON))
  }
  if (url === '/download/csv') {
    res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="spese.csv"' })
    return res.end(fs.readFileSync(FILE_CSV))
  }
  if (url === '/download/xml') {
    res.writeHead(200, { 'Content-Type': 'application/xml', 'Content-Disposition': 'attachment; filename="spese.xml"' })
    return res.end(fs.readFileSync(FILE_XML))
  }

  // --- API: lista spese ---
  if (url === '/api/spese' && metodo === 'GET') {
    const spese = leggiSpese()
    return rispostaJSON(res, 200, spese)
  }

  // --- API: aggiungi spesa ---
  if (url === '/api/spese' && metodo === 'POST') {
    const body  = await leggiBody(req)
    const nuova = JSON.parse(body)
    const spese = leggiSpese()

    // Crea un id nuovo (il massimo + 1)
    nuova.id = spese.length === 0 ? 1 : Math.max(...spese.map(s => s.id)) + 1
    nuova.importo = parseFloat(nuova.importo)

    spese.push(nuova)
    salvaSpese(spese)
    return rispostaJSON(res, 201, nuova)
  }

  // --- API: elimina spesa ---
  if (url.startsWith('/api/spese/') && metodo === 'DELETE') {
    const id    = parseInt(url.split('/')[3])
    let spese   = leggiSpese()
    const prima = spese.length
    spese       = spese.filter(s => s.id !== id)

    if (spese.length === prima) {
      return rispostaJSON(res, 404, { errore: 'Spesa non trovata' })
    }
    salvaSpese(spese)
    return rispostaJSON(res, 200, { messaggio: 'Eliminata' })
  }

  // --- 404 ---
  rispostaJSON(res, 404, { errore: 'Percorso non trovato' })
})

server.listen(PORTA, () => {
  console.log(`Server avviato su http://localhost:${PORTA}`)
})