/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  ToggleLeft,
  X,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Antrian, Petugas, Layanan, SystemStatus } from '../types.js';

interface AdminPanelProps {
  status: SystemStatus;
  onRefresh: () => void;
}

export default function AdminPanel({ status, onRefresh }: AdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Officers inline editing states
  const [editedOfficers, setEditedOfficers] = useState<Petugas[]>([...status.officers]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refresh editedOfficers local state if status changes from server
  React.useEffect(() => {
    setEditedOfficers([...status.officers]);
  }, [status.officers]);

  // Statistics calculations
  const totalTickets = status.queues.length;
  const selesaiCount = status.queues.filter((q) => q.status === 'selesai').length;
  const dilewatiCount = status.queues.filter((q) => q.status === 'dilewati').length;
  const menungguCount = status.queues.filter((q) => q.status === 'menunggu').length;
  const dipanggilCount = status.queues.filter((q) => q.status === 'dipanggil').length;

  const handleResetSystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Gagal me-reset antrean harian.');
      onRefresh();
      setConfirmReset(false);
    } catch (e) {
      alert('Reset gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerChange = (idx: number, field: keyof Petugas, val: any) => {
    const updated = [...editedOfficers];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditedOfficers(updated);
  };

  const handleSaveOfficersSetup = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/admin/petugas/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officers: editedOfficers }),
      });
      if (!response.ok) throw new Error('Gagal mengupdate daftar petugas.');
      onRefresh();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Gagal menyisipkan pengaturan petugas.');
    } finally {
      setLoading(false);
    }
  };

  // Generate 5 Mock Tickets to test quickly!
  const handleGenerateMockData = async () => {
    setLoading(true);
    try {
      const mockTickets = [
        { jenis_layanan: 'kasir' },
        {
          jenis_layanan: 'cs',
          nama: 'Bambang Sunarya',
          alamat: 'Kebayoran Baru No. 12',
          no_telp: '081288887777',
          tujuan: 'Akun Baru',
        },
        { jenis_layanan: 'kasir' },
        {
          jenis_layanan: 'cs',
          nama: 'Rina Herawati',
          alamat: 'Tebet Timur Dalam Gg 4',
          no_telp: '085712345678',
          tujuan: 'Keluhan Layanan',
        },
        { jenis_layanan: 'kasir' },
      ];

      for (const t of mockTickets) {
        await fetch('/api/kiosk/ambil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t),
        });
      }

      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col gap-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total antrean */}
        <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-xs text-center">
          <span className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
            TOTAL TIKET HARI INI
          </span>
          <h2 className="text-4xl font-black text-zinc-950 font-mono tracking-tight mt-1">{totalTickets}</h2>
        </div>

        {/* Menunggu */}
        <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-xs text-center border-l-4 border-l-amber-500">
          <span className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
            SEDANG MENUNGGU
          </span>
          <h2 className="text-4xl font-black text-amber-600 font-mono tracking-tight mt-1">{menungguCount}</h2>
        </div>

        {/* Dipanggil */}
        <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-xs text-center border-l-4 border-l-indigo-500">
          <span className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
            SEDANG DIPANGGIL
          </span>
          <h2 className="text-4xl font-black text-indigo-600 font-mono tracking-tight mt-1">{dipanggilCount}</h2>
        </div>

        {/* Selesai */}
        <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-xs text-center border-l-4 border-l-emerald-500">
          <span className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
            SELESAI DILAYANI
          </span>
          <h2 className="text-4xl font-black text-emerald-600 font-mono tracking-tight mt-1">{selesaiCount}</h2>
        </div>

        {/* Dilewati */}
        <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-xs text-center border-l-4 border-l-red-500 col-span-2 md:col-span-1">
          <span className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px]">
            DILEWATI (SKIP)
          </span>
          <h2 className="text-4xl font-black text-red-650 font-mono tracking-tight mt-1">{dilewatiCount}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full pb-8">
        {/* LEFT COLUMN: PETUGAS & MEJA CONFIGURATION (7 cols) */}
        <div className="lg:col-span-7 bg-white/85 backdrop-blur-md border border-zinc-200 p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between border-b pb-4 mb-5">
            <h3 className="text-lg font-extrabold text-zinc-950 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Kelola Petugas Loket & Meja
            </h3>
            <span className="text-[10px] bg-zinc-100 text-zinc-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
              Admin Mode
            </span>
          </div>

          <div className="space-y-4">
            {editedOfficers.map((off, idx) => (
              <div
                key={off.id}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row items-center gap-4 justify-between"
              >
                {/* Name edit */}
                <div className="w-full md:w-1/3">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-0.5">Nama Petugas</label>
                  <input
                    type="text"
                    value={off.nama}
                    onChange={(e) => handleOfficerChange(idx, 'nama', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Service Select code */}
                <div className="w-full md:w-1/4">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-0.5">Layanan</label>
                  <select
                    value={off.jenis_layanan}
                    onChange={(e) => handleOfficerChange(idx, 'jenis_layanan', e.target.value as Layanan)}
                    className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-zinc-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="cs">CS</option>
                  </select>
                </div>

                {/* Desk input */}
                <div className="w-full md:w-1/6">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-0.5">Nomor Meja</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={off.nomor_meja}
                    onChange={(e) => handleOfficerChange(idx, 'nomor_meja', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 text-xs font-semibold text-center bg-white border border-zinc-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Active check toggle */}
                <div className="w-full md:w-1/6 flex flex-col items-center">
                  <span className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Status aktif</span>
                  <button
                    onClick={() => handleOfficerChange(idx, 'status', off.status === 'aktif' ? 'tidak' : 'aktif')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all select-none cursor-pointer ${
                      off.status === 'aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-650'
                    }`}
                  >
                    {off.status === 'aktif' ? 'Aktif' : 'Libur'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold self-center animate-pulse">
                Pengaturan petugas berhasil disimpan!
              </span>
            )}
            <button
              onClick={handleSaveOfficersSetup}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-650 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              Simpan Perubahan Petugas
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE CONTROLS AND MOCK ENGINE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Debug Testing Suite */}
          <div className="bg-gradient-to-br from-white/85 to-indigo-50/85 backdrop-blur-md border border-indigo-200 p-6 rounded-2xl shadow-sm">
            <h4 className="text-zinc-950 font-extrabold text-sm flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Peralatan Pengujian & Simulasi
            </h4>
            <p className="text-xs text-zinc-600 mb-5 leading-relaxed leading-[1.4]">
              Gunakan pintasan di bawah ini untuk menguji sistem dengan cepat tanpa harus mengisi form Kiosk berulang kali. Ini akan memasukkan data antrean simulasi langsung ke database.
            </p>

            <button
              onClick={handleGenerateMockData}
              disabled={loading}
              className="w-full px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-300 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 select-none shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Simulasikan 5 Antrean Acak (K & CS)
            </button>
          </div>

          {/* Reset Queue System */}
          <div className="bg-white/85 backdrop-blur-md border border-zinc-200 p-6 rounded-2xl shadow-xs">
            <h4 className="text-red-800 font-extrabold text-sm flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Reset Total Antrean Harian
            </h4>
            <p className="text-xs text-zinc-500 mb-5 leading-[1.4]">
              Mengosongkan semua daftar antrean saat ini, mereset nomor antrean Kasir (K) dan CS ke 001, serta mematikan monitor spotlight yang sedang berjalan.
            </p>

            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full px-5 py-3 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs border border-red-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                Mulai Reset Antrean
              </button>
            ) : (
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/80">
                <p className="text-xs text-red-800 font-semibold mb-3 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-650" />
                  Konfirmasi: Tindakan ini tidak dapat dibatalkan. Yakin ingin mengosongkan seluruh antrean?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 bg-white border border-zinc-300 text-zinc-700 font-semibold text-[11px] rounded transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetSystem}
                    disabled={loading}
                    className="flex-1 py-1.5 bg-red-650 text-white font-bold text-[11px] rounded hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Ya, Reset Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
