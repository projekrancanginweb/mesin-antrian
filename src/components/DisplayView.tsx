/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Users, Monitor, Sparkles } from 'lucide-react';
import { Antrian, Petugas, ActiveCall, SystemStatus } from '../types.js';
import { playChime, speakQueueId } from '../utils/audio.js';

interface DisplayViewProps {
  status: SystemStatus;
  onRefresh: () => void;
}

export default function DisplayView({ status, onRefresh }: DisplayViewProps) {
  const [time, setTime] = useState(new Date());
  const [muteVoice, setMuteVoice] = useState(false);

  // =========================================================================
  // CONFIGURATION: CHOOSE YOUR VIDEO SOURCE DIRECTLY HERE (URL ATAU YOUTUBE ID)
  // =========================================================================
  // 1. Jika menggunakan file video (.mp4): Masukkan URL video mp4 langsung di bawah.
  // 2. Jika menggunakan YouTube: Masukkan ID video YouTube 11-karakter di bawah (misal: 'kfhk4_vDszM').
  const VIDEO_SOURCE = 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-at-a-clean-workspace-42352-large.mp4';
  const VIDEO_TYPE = 'mp4' as 'mp4' | 'youtube'; // Ganti ke 'youtube' jika menggunakan YouTube ID
  // =========================================================================

  // Track the last handled call ID to avoid repeating speech synthesis
  const lastCalledIdRef = useRef<string | null>(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Watch for changes in activeCall to play the Chime and trigger Indonesian TTS
  useEffect(() => {
    if (status.activeCall) {
      const call = status.activeCall;
      if (call.id !== lastCalledIdRef.current) {
        lastCalledIdRef.current = call.id;

        // Only play if not muted
        if (!muteVoice) {
          playChime().then(() => {
            speakQueueId(call.nomor_antrian, call.jenis_layanan, call.nomor_meja);
          });
        }
      }
    }
  }, [status.activeCall, muteVoice]);

  // Derived arrays
  const waitingQueues = status.queues.filter((q) => q.status === 'menunggu');
  const kasirQueues = status.queues.filter((q) => q.jenis_layanan === 'kasir');
  const csQueues = status.queues.filter((q) => q.jenis_layanan === 'cs');

  // Get current active queue calling for each desk
  const getDeskQueue = (serviceType: 'kasir' | 'cs', tableNo: number) => {
    return status.queues.find(
      (q) => q.jenis_layanan === serviceType && q.meja_tujuan === tableNo && q.status === 'dipanggil'
    );
  };

  const currentKasirMeja1 = getDeskQueue('kasir', 1);
  const currentKasirMeja2 = getDeskQueue('kasir', 2);
  const currentCsMeja1 = getDeskQueue('cs', 1);
  const currentCsMeja2 = getDeskQueue('cs', 2);

  return (
    <div className="w-full max-w-none px-6 py-4 flex flex-col gap-6 min-h-screen bg-transparent">
      {/* Header Panel Monitor (No-border clean layout) */}
      <div className="bg-zinc-900/90 backdrop-blur-md text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl relative animate-pulse flex items-center justify-center">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MONITOR ANTREAN UTAMA</h1>
            <p className="text-zinc-400 text-xs text-left">Papan Display Informasi Panggilan Publik & Video Informasi</p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuteVoice(!muteVoice)}
              className={`p-2 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold select-none transition-colors cursor-pointer ${
                muteVoice
                  ? 'bg-red-900 text-red-100 hover:bg-red-800'
                  : 'bg-emerald-805 bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${muteVoice ? 'opacity-40' : ''}`} />
              <span>{muteVoice ? 'TTS NONAKTIF' : 'TTS AKTIF'}</span>
            </button>
          </div>

          <div className="text-right">
            <h4 className="text-2xl font-extrabold font-mono tracking-wider text-emerald-400">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h4>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Symmetric 50/50 Grid (Left Column & Right Column Side-by-Side Kanan-Kiri) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-stretch animate-in fade-in duration-300">
        
        {/* LEFT COLUMN: ACTIVE CALL & STATUS (Exactly 1 Column / 50% width) */}
        <div className="flex flex-col gap-6">
          {/* Active Call (Frameless elegant card) */}
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px] flex-1">
            {/* Spotlight header background gradient flare */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-500" />
            
            {status.activeCall ? (
              <div className="w-full flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-805 text-red-800 text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider animate-bounce mb-4">
                  <Volume2 className="w-4 h-4" />
                  SEDANG PANGGIL
                </span>

                <h2 className="text-7xl lg:text-8xl font-black text-zinc-950 tracking-tighter my-2 font-mono leading-none drop-shadow-sm">
                  {status.activeCall.nomor_antrian}
                </h2>

                <div className="h-0.5 w-2/3 bg-zinc-100 my-4" />

                <h3 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                  Silakan Menuju Ke:
                </h3>

                <div className="mt-3 px-8 py-4 bg-zinc-950 text-white rounded-2xl shadow-md">
                  <p className="text-emerald-400 uppercase font-mono tracking-widest text-[10px] font-bold">
                    Tujuan Meja Layanan
                  </p>
                  <h4 className="text-3xl font-black uppercase tracking-tight mt-1">
                    {status.activeCall.jenis_layanan === 'kasir' ? 'KASIR' : 'CS'} - MEJA {status.activeCall.nomor_meja}
                  </h4>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center max-w-sm h-full pt-8 pb-4">
                <div className="p-4 bg-zinc-50 rounded-full mb-4">
                  <Monitor className="w-10 h-10 text-zinc-400" />
                </div>
                <h3 className="text-lg font-extrabold text-zinc-800 mb-1">Monitor Siap Dipakai</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Belum ada antrean yang dipanggil saat ini. Petugas loket dapat menekan tombol <strong>&ldquo;Panggil&rdquo;</strong> pada dashboard loket mereka untuk memulai.
                </p>
              </div>
            )}
          </div>

          {/* Status Meja Petugas (Flat clean frameless component) */}
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 flex flex-col">
            <h3 className="text-xs font-black tracking-widest text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              STATUS MEJA PETUGAS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
              {/* MEJA KASIR 1 */}
              <div className="p-4 rounded-2xl flex items-center justify-between bg-zinc-50/70 hover:bg-zinc-100/90 transition-colors">
                <div className="text-left">
                  <span className="text-[9px] tracking-widest font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    KASIR MEJA 1
                  </span>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Andi</p>
                </div>
                <div className="text-right">
                  <h4 className="text-2xl font-black font-mono text-indigo-700">
                    {currentKasirMeja1 ? currentKasirMeja1.nomor_antrian : '----'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase">Dilayani</p>
                </div>
              </div>

              {/* MEJA KASIR 2 */}
              <div className="p-4 rounded-2xl flex items-center justify-between bg-zinc-50/70 hover:bg-zinc-100/90 transition-colors">
                <div className="text-left">
                  <span className="text-[9px] tracking-widest font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    KASIR MEJA 2
                  </span>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Budi</p>
                </div>
                <div className="text-right">
                  <h4 className="text-2xl font-black font-mono text-indigo-700">
                    {currentKasirMeja2 ? currentKasirMeja2.nomor_antrian : '----'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase">Dilayani</p>
                </div>
              </div>

              {/* MEJA CS 1 */}
              <div className="p-4 rounded-2xl flex items-center justify-between bg-zinc-50/70 hover:bg-zinc-100/90 transition-colors">
                <div className="text-left">
                  <span className="text-[9px] tracking-widest font-black uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    CS MEJA 1
                  </span>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Citra</p>
                </div>
                <div className="text-right">
                  <h4 className="text-2xl font-black font-mono text-teal-700">
                    {currentCsMeja1 ? currentCsMeja1.nomor_antrian : '----'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase">Dilayani</p>
                </div>
              </div>

              {/* MEJA CS 2 */}
              <div className="p-4 rounded-2xl flex items-center justify-between bg-zinc-50/70 hover:bg-zinc-100/90 transition-colors">
                <div className="text-left">
                  <span className="text-[9px] tracking-widest font-black uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    CS MEJA 2
                  </span>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Dewi</p>
                </div>
                <div className="text-right">
                  <h4 className="text-2xl font-black font-mono text-teal-700">
                    {currentCsMeja2 ? currentCsMeja2.nomor_antrian : '----'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase">Dilayani</p>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER ROW: WAITING QUEUES LIST (Borderless elegant design) */}
          <div className="bg-white/85 backdrop-blur-md px-6 py-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-indigo-600" />
              <div className="text-left">
                <h4 className="text-sm font-semibold text-zinc-800">Antrean Menunggu</h4>
                <p className="text-xs text-zinc-500">{waitingQueues.length} orang menunggu</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 max-h-[80px] overflow-y-auto">
              {waitingQueues.length > 0 ? (
                waitingQueues.slice(0, 10).map((q) => (
                  <span
                    key={q.id}
                    className={`inline-flex items-center px-3 py-1 bg-zinc-50 rounded-lg font-mono text-sm font-bold ${
                      q.jenis_layanan === 'kasir'
                        ? 'text-indigo-600 border-l-2 border-l-indigo-600'
                        : 'text-teal-600 border-l-2 border-l-teal-600'
                    }`}
                  >
                    {q.nomor_antrian}
                  </span>
                ))
              ) : (
                <span className="text-xs font-semibold text-zinc-400 bg-zinc-50 px-3 py-1 rounded-lg">
                  Tidak ada antrean menunggu
                </span>
              )}
              {waitingQueues.length > 10 && (
                <span className="text-xs font-bold text-zinc-500">+{waitingQueues.length - 10} lainnya</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VIDEO PLAYER (100% CLEAN & FRAMELESS & FULL RANGE SPACE) */}
        <div className="flex flex-col h-full min-h-[500px]">
          <div className="w-full h-full rounded-3xl overflow-hidden bg-black relative flex items-center justify-center shadow-lg">
            {VIDEO_TYPE === 'youtube' ? (
              <iframe
                src={`https://www.youtube.com/embed/${VIDEO_SOURCE}?autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_SOURCE}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
                className="w-full h-full min-h-[500px] border-0 select-none pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={VIDEO_SOURCE}
                className="w-full h-full object-cover min-h-[500px]"
                autoPlay
                loop
                muted
                playsInline
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
