/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Antrian, Petugas, ActiveCall, Layanan } from './src/types.js';

async function startServer() {
  const PORT = 3000;
  const app = express();
  app.use(express.json());

  // In-Memory state with fallback file persistence
  let queues: Antrian[] = [];
  let officers: Petugas[] = [
    { id: 'p1', nama: 'Andi', jenis_layanan: 'kasir', nomor_meja: 1, status: 'aktif' },
    { id: 'p2', nama: 'Budi', jenis_layanan: 'kasir', nomor_meja: 2, status: 'aktif' },
    { id: 'p3', nama: 'Citra', jenis_layanan: 'cs', nomor_meja: 1, status: 'aktif' },
    { id: 'p4', nama: 'Dewi', jenis_layanan: 'cs', nomor_meja: 2, status: 'aktif' },
  ];
  let activeCall: ActiveCall | null = null;
  let currentKasirNumber = 0;
  let currentCsNumber = 0;
  let lastResetDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const DATA_FILE = path.join(process.cwd(), 'db_queue.json');

  // Load database
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.queues)) queues = data.queues;
      if (Array.isArray(data.officers)) officers = data.officers;
      if (data.activeCall !== undefined) activeCall = data.activeCall;
      if (typeof data.currentKasirNumber === 'number') currentKasirNumber = data.currentKasirNumber;
      if (typeof data.currentCsNumber === 'number') currentCsNumber = data.currentCsNumber;
      if (data.lastResetDate) lastResetDate = data.lastResetDate;
      console.log('Database successfully loaded from', DATA_FILE);
    } catch (e) {
      console.error('Error loading JSON database:', e);
    }
  }

  function saveData() {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          {
            queues,
            officers,
            activeCall,
            currentKasirNumber,
            currentCsNumber,
            lastResetDate,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.error('Error saving JSON database:', e);
    }
  }

  // Automatic check for Daily Reset (jam 00:00)
  function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastResetDate) {
      queues = [];
      currentKasirNumber = 0;
      currentCsNumber = 0;
      activeCall = null;
      lastResetDate = today;
      console.log('Daily Reset Triggered! Date changed from', lastResetDate, 'to', today);
      saveData();
    }
  }

  // API Endpoints
  app.get('/api/status', (req, res) => {
    checkDailyReset();
    res.json({
      queues,
      officers,
      activeCall,
    });
  });

  // Kiosk: Create Queue Number
  app.post('/api/kiosk/ambil', (req, res) => {
    checkDailyReset();
    const { jenis_layanan, nama, alamat, no_telp, tujuan } = req.body;

    if (!jenis_layanan || (jenis_layanan !== 'kasir' && jenis_layanan !== 'cs')) {
      return res.status(400).json({ error: 'Jenis layanan tidak valid.' });
    }

    if (jenis_layanan === 'cs') {
      if (!nama || !alamat || !no_telp || !tujuan) {
        return res.status(400).json({ error: 'Form Customer Service wajib diisi lengkap.' });
      }
    }

    let nextNumber = 0;
    let code = '';

    if (jenis_layanan === 'kasir') {
      currentKasirNumber += 1;
      nextNumber = currentKasirNumber;
      code = 'K';
    } else {
      currentCsNumber += 1;
      nextNumber = currentCsNumber;
      code = 'CS';
    }

    const nomor_antrian = `${code}${String(nextNumber).padStart(3, '0')}`;
    const newQueue: Antrian = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      nomor_antrian,
      jenis_layanan,
      nama: jenis_layanan === 'cs' ? nama : undefined,
      alamat: jenis_layanan === 'cs' ? alamat : undefined,
      no_telp: jenis_layanan === 'cs' ? no_telp : undefined,
      tujuan: jenis_layanan === 'cs' ? tujuan : undefined,
      status: 'menunggu',
      waktu_ambil: new Date().toISOString(),
      waktu_panggil: null,
      meja_tujuan: null,
      nama_petugas: null,
    };

    queues.push(newQueue);
    saveData();

    res.status(201).json(newQueue);
  });

  // Officer: Call Queue
  app.post('/api/petugas/panggil', (req, res) => {
    checkDailyReset();
    const { petugasId } = req.body;
    const officer = officers.find((o) => o.id === petugasId);

    if (!officer) {
      return res.status(404).json({ error: 'Petugas tidak ditemukan.' });
    }

    // Resolve any current active queue handled by this officer to 'selesai'
    queues.forEach((q) => {
      if (
        q.jenis_layanan === officer.jenis_layanan &&
        q.meja_tujuan === officer.nomor_meja &&
        q.status === 'dipanggil'
      ) {
        q.status = 'selesai';
      }
    });

    // Find first 'menunggu' queue for this service type (FIFO)
    const nextQueue = queues
      .filter((q) => q.jenis_layanan === officer.jenis_layanan && q.status === 'menunggu')
      .sort((a, b) => new Date(a.waktu_ambil).getTime() - new Date(b.waktu_ambil).getTime())[0];

    if (!nextQueue) {
      saveData();
      return res.json({ queue: null, message: `Antrean ${officer.jenis_layanan.toUpperCase()} kosong.` });
    }

    nextQueue.status = 'dipanggil';
    nextQueue.waktu_panggil = new Date().toISOString();
    nextQueue.meja_tujuan = officer.nomor_meja;
    nextQueue.nama_petugas = officer.nama;

    // Trigger active audio/visual call event
    activeCall = {
      id: `call_${Date.now()}`,
      nomor_antrian: nextQueue.nomor_antrian,
      jenis_layanan: nextQueue.jenis_layanan,
      nomor_meja: officer.nomor_meja,
      timestamp: new Date().toISOString(),
    };

    saveData();
    res.json({ queue: nextQueue, activeCall });
  });

  // Officer: Recall (Ulangi panggilan)
  app.post('/api/petugas/ulangi', (req, res) => {
    const { queueId } = req.body;
    const queue = queues.find((q) => q.id === queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Antrean tidak ditemukan.' });
    }

    // Retrigger speaker / display call event
    activeCall = {
      id: `call_${Date.now()}`,
      nomor_antrian: queue.nomor_antrian,
      jenis_layanan: queue.jenis_layanan,
      nomor_meja: queue.meja_tujuan || 1,
      timestamp: new Date().toISOString(),
    };

    saveData();
    res.json({ success: true, activeCall });
  });

  // Officer: Pass Queue (Lewati)
  app.post('/api/petugas/lewati', (req, res) => {
    const { queueId } = req.body;
    const queue = queues.find((q) => q.id === queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Antrean tidak ditemukan.' });
    }

    queue.status = 'dilewati';
    saveData();
    res.json({ success: true, queue });
  });

  // Officer: Finish Queue (Selesai)
  app.post('/api/petugas/selesai', (req, res) => {
    const { queueId } = req.body;
    const queue = queues.find((q) => q.id === queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Antrean tidak ditemukan.' });
    }

    queue.status = 'selesai';
    saveData();
    res.json({ success: true, queue });
  });

  // Admin: Reset Antrean
  app.post('/api/admin/reset', (req, res) => {
    queues = [];
    currentKasirNumber = 0;
    currentCsNumber = 0;
    activeCall = null;
    saveData();
    res.json({ success: true, message: 'Sistem antrean dan nomor berhasil di-reset.' });
  });

  // Admin: Kelola Petugas (Save/Update list)
  app.post('/api/admin/petugas/update', (req, res) => {
    const updatedOfficers = req.body.officers;
    if (Array.isArray(updatedOfficers)) {
      officers = updatedOfficers;
      saveData();
      return res.json({ success: true, officers });
    }
    res.status(400).json({ error: 'Format data petugas tidak valid.' });
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
