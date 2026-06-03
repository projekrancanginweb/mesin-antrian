/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Play,
  Volume2,
  CheckCircle,
  SkipForward,
  User,
  ArrowLeft,
  ChevronRight,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import { Antrian, Petugas, SystemStatus } from '../types.js';

interface OfficerDashboardProps {
  status: SystemStatus;
  onRefresh: () => void;
}

export default function OfficerDashboard({ status, onRefresh }: OfficerDashboardProps) {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const officer = status.officers.find((o) => o.id === selectedOfficerId);

  // Filter queues that wait for this specific operator role ('kasir' or 'cs')
  const relativeWaitingQueues = status.queues.filter(
    (q) => q.status === 'menunggu' && q.jenis_layanan === (officer?.jenis_layanan || '')
  );

  // Get active queue currently at this officer's table (status: dipanggil, meja_tujuan: officer.nomor_meja, jenis_layanan: officer.jenis_layanan)
  const currentActiveQueue = status.queues.find(
    (q) =>
      q.jenis_layanan === officer?.jenis_layanan &&
      q.meja_tujuan === officer?.nomor_meja &&
      q.status === 'dipanggil'
  );

  // History for this officer
  const officerHistory = status.queues
    .filter(
      (q) =>
        q.jenis_layanan === officer?.jenis_layanan &&
        q.meja_tujuan === officer?.nomor_meja &&
        (q.status === 'selesai' || q.status === 'dilewati')
    )
    .sort((a, b) => new Date(b.waktu_ambil).getTime() - new Date(a.waktu_ambil).getTime());

  const handleLogin = (id: string) => {
    setSelectedOfficerId(id);
  };

  const handleLogout = () => {
    setSelectedOfficerId(null);
  };

  const handlePanggilNext = async () => {
    if (!officer) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/petugas/panggil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petugasId: officer.id }),
      });
      if (!response.ok) throw new Error('Gagal memanggil antrean berikutnya.');
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Gagal memanggil antrean.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUlangiPanggilan = async () => {
    if (!currentActiveQueue) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/petugas/ulangi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: currentActiveQueue.id }),
      });
      if (!response.ok) throw new Error('Gagal mengulai panggilan.');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLewati = async () => {
    if (!currentActiveQueue) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/petugas/lewati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: currentActiveQueue.id }),
      });
      if (!response.ok) throw new Error('Gagal melewati antrean ini.');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelesai = async () => {
    if (!currentActiveQueue) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/petugas/selesai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: currentActiveQueue.id }),
      });
      if (!response.ok) throw new Error('Gagal merampungkan antrean ini.');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // 1. LOGIN / PROFILE SELECTION VIEW
  if (!officer) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">Login Petugas Loket</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Silakan pilih nama petugas dan jenis layanan di bawah ini untuk masuk ke dashboard penanganan antrean.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl">
          {status.officers.map((off) => (
            <button
              key={off.id}
              onClick={() => handleLogin(off.id)}
              className="group bg-white/85 backdrop-blur-md p-6 border-2 border-zinc-200 hover:border-indigo-600 rounded-2xl cursor-pointer text-center hover:shadow-lg transition-all flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 w-full h-1 ${
                  off.jenis_layanan === 'kasir' ? 'bg-indigo-500' : 'bg-teal-500'
                }`}
              />

              <div
                className={`p-4 rounded-full mb-4 group-hover:scale-105 transition-transform ${
                  off.jenis_layanan === 'kasir'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                <User className="w-8 h-8" />
              </div>

              <h4 className="font-bold text-zinc-800 text-lg group-hover:text-indigo-600 transition-colors">
                {off.nama}
              </h4>
              <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
                Meja {off.nomor_meja}
              </p>

              <span
                className={`inline-block text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase mt-3 ${
                  off.jenis_layanan === 'kasir'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {off.jenis_layanan === 'kasir' ? 'Kasir' : 'CS'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. ACTIVE OFFICER DESK VIEW
  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col gap-6">
      {/* Upper Officer Sub-header */}
      <div className="bg-white/80 backdrop-blur-md border border-zinc-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 border border-zinc-250 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Kembali ke Pilih Tugas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-950">Meja Layanan: {officer.nama}</h2>
              <span
                className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                  officer.jenis_layanan === 'kasir'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {officer.jenis_layanan === 'kasir' ? 'KASIR MEJA' : 'CS MEJA'} {officer.nomor_meja}
              </span>
            </div>
            <p className="text-zinc-500 text-xs">Petugas berhasil masuk • Siap melayani pelanggan</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-red-650 hover:text-white font-bold hover:bg-red-650 border border-red-200 hover:border-red-650 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Keluar dari Meja Sessi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* LEFT COLUMN: CALL ACTION SYSTEM (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white/85 backdrop-blur-md border-2 border-zinc-300 rounded-2.5xl p-6.5 shadow-md flex flex-col min-h-[420px] justify-between relative overflow-hidden">
            {/* Action Top bar flair decoration */}
            <div
              className={`absolute top-0 inset-x-0 h-1.5 ${
                officer.jenis_layanan === 'kasir' ? 'bg-indigo-500' : 'bg-teal-400'
              }`}
            />

            {currentActiveQueue ? (
              <div className="h-full flex flex-col justify-between flex-1 gap-6">
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      Sedang Melayani
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-pulse uppercase">
                      <Clock className="w-3.5 h-3.5" />
                      Antrean Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Big display queue number */}
                    <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left bg-zinc-50 border border-zinc-200 p-6 rounded-2xl">
                      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                        NOMOR ANTREAN
                      </p>
                      <h3 className="text-5xl font-black text-zinc-950 font-mono tracking-tighter my-1">
                        {currentActiveQueue.nomor_antrian}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Ambil:{' '}
                        {new Date(currentActiveQueue.waktu_ambil).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>

                    {/* Customer Info (especially for CS) */}
                    <div className="md:col-span-8 space-y-3">
                      <h4 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-1.5">
                        <Briefcase className="w-4 h-4 text-zinc-400" />
                        Detail Informasi Pengunjung
                      </h4>

                      {officer.jenis_layanan === 'cs' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                          <div>
                            <span className="block text-[10px] text-zinc-400 uppercase font-black">
                              Nama Lengkap
                            </span>
                            <span className="font-bold text-zinc-900 text-base">
                              {currentActiveQueue.nama || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-zinc-400 uppercase font-black">
                              Nomor Telepon
                            </span>
                            <span className="font-semibold text-zinc-700">
                              {currentActiveQueue.no_telp || '-'}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="block text-[10px] text-zinc-400 uppercase font-black">
                              Alamat Tinggal
                            </span>
                            <span className="text-zinc-600 block text-xs">
                              {currentActiveQueue.alamat || '-'}
                            </span>
                          </div>
                          <div className="md:col-span-2 bg-teal-50 border border-teal-100 p-2 rounded-lg">
                            <span className="text-[9px] text-teal-800 uppercase font-mono font-black tracking-wider block">
                              Keperluan Kerja / Tujuan
                            </span>
                            <span className="font-semibold text-teal-950 text-xs">
                              {currentActiveQueue.tujuan || '-'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 border p-4.5 rounded-xl text-zinc-500 text-xs text-center flex flex-col items-center justify-center gap-1">
                          <Info className="w-5 h-5 text-indigo-500" />
                          <p className="font-medium text-zinc-800">Layanan Kasir Langsung</p>
                          <p className="text-zinc-400 mt-0.5">
                            Nasabah kasir dilayani langsung tanpa registrasi form data diri.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Desk calling actions */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-6 border-t border-dashed border-zinc-250">
                  <button
                    onClick={handleUlangiPanggilan}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-zinc-150 text-zinc-800 rounded-xl hover:bg-zinc-200 select-none font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    Ulangi Suara Panggilan
                  </button>

                  <button
                    onClick={handleLewati}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <SkipForward className="w-4 h-4" />
                    Lewati (Skip)
                  </button>

                  <button
                    onClick={handleSelesai}
                    disabled={actionLoading}
                    className="sm:col-span-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 text-white border-0 rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-md disabled:from-emerald-400 disabled:to-teal-400 pb-3"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tandai Selesai Melayani
                  </button>
                </div>
              </div>
            ) : (
              /* STANDBY SCREEN - NO ACTIVE CUSTOMER */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl mb-4 text-zinc-500">
                  <Users className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-extrabold text-zinc-800 mb-1">Poli Meja Standby</h4>
                <p className="text-zinc-500 text-xs max-w-sm mb-6">
                  Ada <span className="font-bold text-indigo-600">{relativeWaitingQueues.length} antrean</span> dalam
                  antrean antre menunggu untuk layanan Anda saat ini.
                </p>

                <button
                  onClick={handlePanggilNext}
                  disabled={actionLoading || relativeWaitingQueues.length === 0}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 tracking-wide transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Panggil Nomor Berikutnya ({relativeWaitingQueues.length > 0 ? relativeWaitingQueues[0].nomor_antrian : 'Kosong'})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUEUE LIST PANEL (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Waiting Queues specific to role */}
          <div className="bg-white/85 backdrop-blur-md border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3.5 flex items-center gap-1.5 border-b pb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Daftar Antrean Menunggu
            </h4>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {relativeWaitingQueues.length > 0 ? (
                relativeWaitingQueues.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-xxs">
                        {q.nomor_antrian}
                      </span>
                      {q.nama && <span className="text-zinc-600 font-semibold truncate max-w-[100px]">{q.nama}</span>}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(q.waktu_ambil).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 text-xs text-center py-6 font-medium">Tidak ada antrean tunggu.</p>
              )}
            </div>
          </div>

          {/* Riwayat Meja */}
          <div className="bg-white/85 backdrop-blur-md border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3.5 border-b pb-2">
              Riwayat Meja Hari Ini
            </h4>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {officerHistory.length > 0 ? (
                officerHistory.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150/80 bg-zinc-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-650 bg-white border px-1.5 py-0.5 rounded">
                        {q.nomor_antrian}
                      </span>
                      <span className="text-zinc-550 font-medium truncate max-w-[100px]">{q.nama || 'Kasir'}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        q.status === 'selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status === 'selesai' ? 'Selesai' : 'Dilewati'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-450 text-xs text-center py-6 font-medium">Belum ada riwayat meja.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
