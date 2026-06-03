/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, UserCheck, Printer, Clock, AlertCircle, Sparkles, X } from 'lucide-react';
import { Antrian } from '../types.js';

interface KioskViewProps {
  onQueueCreated: (queue: Antrian) => void;
}

export default function KioskView({ onQueueCreated }: KioskViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CS Form State
  const [showCsForm, setShowCsForm] = useState(false);
  const [csNama, setCsNama] = useState('');
  const [csAlamat, setCsAlamat] = useState('');
  const [csNoTelp, setCsNoTelp] = useState('');
  const [csTujuan, setCsTujuan] = useState('Keluhan Layanan');

  // Displaying printed ticket state
  const [printedTicket, setPrintedTicket] = useState<Antrian | null>(null);
  const [countdown, setCountdown] = useState(8);

  // Auto-close countdown for ticket dialog
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (printedTicket && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (printedTicket && countdown === 0) {
      setPrintedTicket(null);
    }
    return () => clearTimeout(timer);
  }, [printedTicket, countdown]);

  const triggerPrintTicket = (ticket: Antrian) => {
    setPrintedTicket(ticket);
    setCountdown(8);
    onQueueCreated(ticket);
    // Reset CS form
    setCsNama('');
    setCsAlamat('');
    setCsNoTelp('');
    setCsTujuan('Keluhan Layanan');
    setShowCsForm(false);
  };

  const handleAmbilKasir = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kiosk/ambil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jenis_layanan: 'kasir' }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengambil antrean Kasir.');
      }
      const data: Antrian = await response.json();
      triggerPrintTicket(data);
    } catch (e: any) {
      setError(e.message || 'Koneksi ke server terputus.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmbilCs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csNama.trim() || !csAlamat.trim() || !csNoTelp.trim() || !csTujuan.trim()) {
      setError('Semua kolom form wajib diisi untuk layanan Customer Service.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kiosk/ambil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis_layanan: 'cs',
          nama: csNama.trim(),
          alamat: csAlamat.trim(),
          no_telp: csNoTelp.trim(),
          tujuan: csTujuan,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengambil antrean Customer Service.');
      }
      const data: Antrian = await response.json();
      triggerPrintTicket(data);
    } catch (e: any) {
      setError(e.message || 'Koneksi ke server terputus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto min-h-[70vh]">
      <div className="w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
          <Sparkles className="w-4 h-4" />
          Kios Mandiri Ambil Antrean
        </div>
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Selamat Datang di Unit Layanan
        </h1>
        <p className="text-zinc-600 max-w-lg mx-auto">
          Silakan pilih tombol layanan di bawah ini sesuai kebutuhan Anda. Tiket antrean fisik akan otomatis tercetak setelah diklik.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-md bg-red-50 text-red-800 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Terjadi Kesalahan: </span>
            {error}
          </div>
        </div>
      )}

      {!showCsForm ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Card untuk Kasir */}
          <button
            onClick={handleAmbilKasir}
            disabled={loading}
            className="group flex flex-col items-center justify-between text-center bg-white/85 backdrop-blur-md hover:bg-white/95 p-8 rounded-2xl border-2 border-zinc-200 hover:border-indigo-600 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 group-hover:bg-indigo-600" />
            <div className="bg-indigo-50 text-indigo-700 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-800 mb-2">Layanan KASIR</h2>
              <p className="text-zinc-500 text-sm max-w-[250px] mx-auto min-h-[40px]">
                Untuk pembayaran, setor tunai, penarikan, transaksi kuasi, dan administrasi kas umum.
              </p>
            </div>
            <div className="mt-8 px-6 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-sm tracking-wide group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              Ambil Tiket Kasir (K)
            </div>
          </button>

          {/* Card untuk CS */}
          <button
            onClick={() => setShowCsForm(true)}
            disabled={loading}
            className="group flex flex-col items-center justify-between text-center bg-white/85 backdrop-blur-md hover:bg-white/95 p-8 rounded-2xl border-2 border-zinc-200 hover:border-teal-600 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-500 group-hover:bg-teal-600" />
            <div className="bg-teal-50 text-teal-700 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-800 mb-2">Customer Service (CS)</h2>
              <p className="text-zinc-500 text-sm max-w-[250px] mx-auto min-h-[40px]">
                Pembukaan rekening baru, aduan nasabah, pengurusan berkas, dan konsultasi program.
              </p>
            </div>
            <div className="mt-8 px-6 py-2 bg-teal-50 text-teal-700 font-semibold rounded-lg text-sm tracking-wide group-hover:bg-teal-600 group-hover:text-white transition-colors">
              Isi Form & Ambil Tiket (CS)
            </div>
          </button>
        </div>
      ) : (
        /* Form untuk CS */
        <div className="w-full max-w-xl bg-white/85 backdrop-blur-md p-8 rounded-2xl border border-zinc-200 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-4 mb-6">
            <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-teal-600" />
              Pendaftaran Antrean Customer Service
            </h2>
            <button
              onClick={() => setShowCsForm(false)}
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAmbilCs} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={csNama}
                onChange={(e) => setCsNama(e.target.value)}
                placeholder="cth. Budi Setiawan"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alamat Domisili *</label>
              <input
                type="text"
                required
                value={csAlamat}
                onChange={(e) => setCsAlamat(e.target.value)}
                placeholder="cth. Jl. Sudirman No. 45, Jakarta"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nomor Telepon *</label>
              <input
                type="tel"
                required
                value={csNoTelp}
                onChange={(e) => setCsNoTelp(e.target.value)}
                placeholder="cth. 08123456789"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tujuan / Keperluan *</label>
              <select
                value={csTujuan}
                onChange={(e) => setCsTujuan(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Keluhan Layanan">Keluhan Layanan & Sistem</option>
                <option value="Akun Baru">Pembukaan Akun / Buku Baru</option>
                <option value="Pembuatan Kartu">Pembuatan Kartu / Fasilitas ATM</option>
                <option value="Investasi">Konsultasi Kredit / Investasi</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCsForm(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-300 text-zinc-700 rounded-lg font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:bg-teal-400 cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Cetak Tiket CS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CETAK TIKET FISIK (THERMAL PRINTER EFFECT) */}
      {printedTicket && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white px-6 pt-6 pb-4 rounded-xl shadow-2xl max-w-sm w-full border border-zinc-300 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Thermal Printer Slit Top Card Decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-48 h-3.5 bg-zinc-200 border-x-2 border-b-2 border-zinc-300 rounded-b-xl shadow-inner flex items-center justify-center">
              <span className="w-32 h-0.5 bg-zinc-400/50 block rounded-full" />
            </div>

            {/* Simulated Paper Content */}
            <div className="border border-dashed border-zinc-300 p-5 rounded bg-zinc-50 text-center font-sans">
              <div className="flex items-center justify-center gap-1.5 text-zinc-800 font-bold tracking-tight text-lg mb-1">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>UNIT LAYANAN KOTA</span>
              </div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-dashed border-zinc-350 pb-2 mb-3">
                Kupon Antrean Digital
              </p>

              {/* Large Code Display */}
              <div className="my-3">
                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Nomor Antrean Anda</p>
                <h3 className="text-5xl font-extrabold text-zinc-900 tracking-tight my-1.5 font-mono drop-shadow-xs">
                  {printedTicket.nomor_antrian}
                </h3>
                <span className="inline-block bg-zinc-200 text-zinc-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {printedTicket.jenis_layanan === 'kasir' ? 'Kasir' : 'Customer Service'}
                </span>
              </div>

              {/* Details of CS if present */}
              {printedTicket.nama && (
                <div className="text-left text-xs bg-white p-2.5 rounded-lg border border-zinc-200/80 mb-3 space-y-1">
                  <p className="text-zinc-500"><strong className="text-zinc-700">Nama:</strong> {printedTicket.nama}</p>
                  <p className="text-zinc-500 truncate"><strong className="text-zinc-700">Alamat:</strong> {printedTicket.alamat}</p>
                  <p className="text-zinc-500"><strong className="text-zinc-700">Tujuan:</strong> {printedTicket.tujuan}</p>
                </div>
              )}

              {/* Zebra barcode lines effect */}
              <div className="flex flex-col items-center justify-center my-3 opacity-80">
                <div className="flex h-11 w-full justify-center items-[stretch] gap-[1px] bg-white p-1 border rounded">
                  {/* Generate varying-width vertical bars to emulate barcode */}
                  {[3,1,2,4,1,3,2,1,4,2,3,1,2,1,4,2,3,1].map((w, idx) => (
                    <span key={idx} className="bg-black inline-block" style={{ width: `${w * 1.5}px` }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-zinc-600 mt-1 uppercase">
                  ID-{printedTicket.id.substring(2, 10)}
                </span>
              </div>

              {/* Time taken */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 pt-2 border-t border-dashed border-zinc-350">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{new Date(printedTicket.waktu_ambil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
              </div>
            </div>

            {/* Notification controls */}
            <div className="mt-4 flex flex-col gap-2 items-center text-center">
              <span className="text-xs text-zinc-500 font-medium">
                Kertas tiket berhasil diprint. Kios me-reset dalam <span className="font-bold text-emerald-600">{countdown}s</span>
              </span>
              <button
                onClick={() => setPrintedTicket(null)}
                className="w-full py-2 bg-gradient-to-r from-zinc-800 to-zinc-950 text-white font-semibold rounded-lg text-sm hover:from-zinc-900 hover:to-zinc-950 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                Cetak Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
