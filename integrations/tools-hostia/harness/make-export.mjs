// Vzorový mesačný export ubytovacieho systému (XLSX) na test importu v module Hostia.
// Spustiť z koreňa TOOLS (kde je nainštalované `xlsx`): node harness/make-export.mjs export-hostia.xlsx
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/');
const XLSX = require('xlsx');
const rows = [
  { 'Meno': 'Kovalenko Oleksandr', 'Príchod': '1.9.2026', 'Odchod': '30.11.2026', 'Izba': '111/2', 'Firma': 'Jaguar Land Rover', 'Poznámka': '' },
  { 'Meno': 'Shevchenko Iryna', 'Príchod': '3.9.2026', 'Odchod': '', 'Izba': '214', 'Firma': 'Schaeffler', 'Poznámka': 'nočná zmena' },
  { 'Meno': 'Sharma Rajesh', 'Príchod': '5.9.2026', 'Odchod': '5.3.2027', 'Izba': '325/1', 'Firma': 'Jaguar Land Rover', 'Poznámka': '' },
  { 'Meno': '', 'Príchod': '', 'Odchod': '', 'Izba': '', 'Firma': '', 'Poznámka': 'súčet' },
];
const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Hostia');
XLSX.writeFile(wb, process.argv[2] || 'export-hostia.xlsx');
console.log('ok', process.argv[2] || 'export-hostia.xlsx');
