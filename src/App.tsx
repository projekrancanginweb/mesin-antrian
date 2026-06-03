/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Users, Shield, RefreshCw } from 'lucide-react';
import { SystemStatus } from './types.js';

// Import wave background asset
// @ts-ignore
import waveBg from './assets/images/wave_background_1780464075597.png';

// Import our modular subcomponents
import KioskView from './components/KioskView.tsx';
import DisplayView from './components/DisplayView.tsx';
import OfficerDashboard from './components/OfficerDashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'display' | 'officer' | 'admin'>('kiosk');
  const [status, setStatus] = useState<SystemStatus>({
    queues: [],
    officers: [],
    activeCall: null,
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete queue and status from backend Express API
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Respon server tidak valid.');
      const data: SystemStatus = await response.json();
      setStatus(data);
      if (errorLocal) setErrorLocal(null);
    } catch (e: any) {
      setErrorLocal('Sambungan server terputus. Silakan periksa koneksi.');
    } finally {
      setLoading(false);
    }
  };

  // Poll server state every 1.5 seconds for realtime synchronization
  useEffect(() => {
    fetchStatus(); // initial fetch
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, [errorLocal]);

  const handleQueueCreated = () => {
    fetchStatus();
  };

  // Count active queues in state
  const totalMenunggu = status.queues.filter((q) => q.status === 'menunggu').length;

  return (
    <div 
      className="font-sans antialiased text-zinc-900 min-h-screen flex flex-col selection:bg-indigo-100"
      style={{
        backgroundImage: `url(${waveBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Visual Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand ID */}
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-indigo-650 flex items-center justify-center font-black font-mono text-white text-lg tracking-tight select-none shadow-sm shadow-indigo-200">
              Q
            </span>
            <div className="text-left">
              <h1 className="text-base font-extrabold text-zinc-950 tracking-tight leading-none">
                Sistem Antrean Digital
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                Bank & Costumer Service
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex flex-wrap items-center bg-zinc-100/60 backdrop-blur-sm p-1 rounded-xl border border-zinc-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'kiosk'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-indigo-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Kiosk Mandiri</span>
            </button>

            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
                activeTab === 'display'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-indigo-600'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Layar Monitor</span>
              {status.activeCall && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-650 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('officer')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
                activeTab === 'officer'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-indigo-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Meja Petugas</span>
              {totalMenunggu > 0 && (
                <span className="bg-red-650 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center justify-center leading-none min-w-[16px] border border-white">
                  {totalMenunggu}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-indigo-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Sektor Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connection Failure Error Indicator */}
      {errorLocal && (
        <div className="bg-red-650 text-white text-xs font-semibold py-2 px-4 shadow-md flex items-center justify-center gap-2 relative z-50">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{errorLocal}</span>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 py-8 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm tracking-wide">
                Sedang memuat sistem antrean...
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {activeTab === 'kiosk' && (
              <KioskView onQueueCreated={handleQueueCreated} />
            )}
            {activeTab === 'display' && (
              <DisplayView status={status} onRefresh={fetchStatus} />
            )}
            {activeTab === 'officer' && (
              <OfficerDashboard status={status} onRefresh={fetchStatus} />
            )}
            {activeTab === 'admin' && (
              <AdminPanel status={status} onRefresh={fetchStatus} />
            )}
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-white/50 backdrop-blur-xs border-t border-zinc-200/50 py-4.5 text-center mt-auto">
        <p className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">
          Sistem Antrean Digital • Layanan Cerdas Sehat Terkendali
        </p>
      </footer>
    </div>
  );
}
