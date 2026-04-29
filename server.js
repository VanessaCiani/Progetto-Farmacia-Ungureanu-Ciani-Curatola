const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, 'spese.json');
const CSV_PATH = path.join(__dirname, 'spese.csv');
const XML_PATH = path.join(__dirname, 'spese.xml');

const DEFAULT_SPESE = [
    { id: 1, data: '2024-01-15', descrizione: 'Visita dal Cardiologo', categoria: 'Visita', importo: 120, rimborsabile: true },
    { id: 2, data: '2024-02-03', descrizione: 'Antibiotici in Farmacia', categoria: 'Farmaci', importo: 34.5, rimborsabile: true },
    { id: 3, data: '2024-03-20', descrizione: 'Ecografia', categoria: 'Esami', importo: 85, rimborsabile: false },
    { id: 4, data: '2024-04-10', descrizione: 'Fisioterapia per la Schiena', categoria: 'Fisioterapia', importo: 300, rimborsabile: false },
    { id: 5, data: '2026-04-30', descrizione: 'Esami del Sangue', categoria: 'Esami', importo: 53, rimborsabile: true }
];

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/spese', (req, res) => {
    const spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    res.json(spese);
});

app.post('/api/spese', (req, res) => {
    const spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const nuovaSpesa = {
        id: Date.now(),
        data: req.body.data,
        descrizione: req.body.descrizione,
        categoria: req.body.categoria,
        importo: parseFloat(req.body.importo),
        rimborsabile: req.body.rimborsabile
    };
    spese.push(nuovaSpesa);
    fs.writeFileSync(DB_PATH, JSON.stringify(spese, null, 2));
    fs.writeFileSync(CSV_PATH, convertToCsv(spese), 'utf8');
    fs.writeFileSync(XML_PATH, convertToXml(spese), 'utf8');
    res.status(201).json(nuovaSpesa);
});

app.delete('/api/spese/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    spese = spese.filter(s => s.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(spese, null, 2));
    fs.writeFileSync(CSV_PATH, convertToCsv(spese), 'utf8');
    fs.writeFileSync(XML_PATH, convertToXml(spese), 'utf8');
    res.status(204).send();
});

function escapeXml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function convertToCsv(spese) {
    const header = ['id', 'data', 'descrizione', 'categoria', 'importo', 'rimborsabile'];
    const rows = spese.map(s => [s.id, s.data, s.descrizione.replace(/\t/g, ' '), s.categoria, s.importo.toFixed(2), s.rimborsabile].join('\t'));
    return header.join('\t') + '\n' + rows.join('\n');
}

function convertToXml(spese) {
    const elementi = spese.map(s => `    <spesa>\n        <id>${escapeXml(s.id)}</id>\n        <data>${escapeXml(s.data)}</data>\n        <descrizione>${escapeXml(s.descrizione)}</descrizione>\n        <categoria>${escapeXml(s.categoria)}</categoria>\n        <importo>${s.importo.toFixed(2)}</importo>\n        <rimborsabile>${escapeXml(s.rimborsabile)}</rimborsabile>\n    </spesa>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<spese_farmacia>\n${elementi}\n</spese_farmacia>`;
}

function resetDatabase() {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_SPESE, null, 2));
    fs.writeFileSync(CSV_PATH, convertToCsv(DEFAULT_SPESE));
    fs.writeFileSync(XML_PATH, convertToXml(DEFAULT_SPESE));
}

resetDatabase();

app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));
