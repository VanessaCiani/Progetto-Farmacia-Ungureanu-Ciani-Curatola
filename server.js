const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Definizione dei percorsi file
const JSON_PATH = path.join(__dirname, 'spese.json');
const CSV_PATH = path.join(__dirname, 'spese.csv');
const XML_PATH = path.join(__dirname, 'spese.xml');

// FUNZIONE: escapeXml
// Scopo: Converte i caratteri speciali per evitare errori nel formato dei file XML
const escapeXml = (str) => String(str).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));

// FUNZIONE: salvaTuttiIFile
// Scopo: Sovrascrive contemporaneamente i file JSON, CSV e XML con i nuovi dati per garantire la persistenza
function salvaTuttiIFile(data) {
    // Salva JSON
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    
    // Salva CSV
    const csvHeader = "id\tutente\temail\tdata\tdescrizione\tcategoria\timporto\trimborsabile\n";
    const csvRows = data.map(s => `${s.id}\t${s.utente}\t${s.email}\t${s.data}\t${s.descrizione}\t${s.categoria}\t${s.importo}\t${s.rimborsabile}`).join('\n');
    fs.writeFileSync(CSV_PATH, csvHeader + csvRows);

    // Salva XML
    const xmlItems = data.map(s => `
    <spesa>
        <id>${s.id}</id>
        <utente>${escapeXml(s.utente)}</utente>
        <email>${escapeXml(s.email)}</email>
        <data>${s.data}</data>
        <descrizione>${escapeXml(s.descrizione)}</descrizione>
        <categoria>${escapeXml(s.categoria)}</categoria>
        <importo>${s.importo}</importo>
        <rimborsabile>${s.rimborsabile}</rimborsabile>
    </spesa>`).join('');
    fs.writeFileSync(XML_PATH, `<?xml version="1.0" encoding="UTF-8"?>\n<registro>\n${xmlItems}\n</registro>`);
}

// FUNZIONE: GET /api/spese
// Scopo: Legge il file JSON e restituisce solo le spese associate all'email dell'utente loggato
app.get('/api/spese', (req, res) => {
    const userEmail = req.query.email;
    if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, '[]');
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const filtered = data.filter(s => s.email === userEmail);
    res.json(filtered);
});

// FUNZIONE: POST /api/spese
// Scopo: Riceve una nuova spesa, la aggiunge all'array globale e aggiorna tutti i file (JSON, CSV, XML)
app.post('/api/spese', (req, res) => {
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const nuovaSpesa = { id: Date.now(), ...req.body };
    data.push(nuovaSpesa);
    salvaTuttiIFile(data);
    res.status(201).json(nuovaSpesa);
});

// FUNZIONE: DELETE /api/spese/:id
// Scopo: Rimuove una spesa specifica tramite ID e aggiorna i file di archivio
app.delete('/api/spese/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    data = data.filter(s => s.id !== id);
    salvaTuttiIFile(data);
    res.sendStatus(204);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

//Controllo pagina non trovata 
app.use((req, res) => {
    res.send(`<h1>Errore 404 - Pagina non trovata</h1>`);
});

app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));