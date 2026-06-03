/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Layanan = 'kasir' | 'cs';

export interface Antrian {
  id: string;
  nomor_antrian: string;
  jenis_layanan: Layanan;
  nama?: string;
  alamat?: string;
  no_telp?: string;
  tujuan?: string;
  status: 'menunggu' | 'dipanggil' | 'selesai' | 'dilewati';
  waktu_ambil: string;
  waktu_panggil: string | null;
  meja_tujuan: number | null;
  nama_petugas: string | null;
}

export interface Petugas {
  id: string;
  nama: string;
  jenis_layanan: Layanan;
  nomor_meja: number;
  status: 'aktif' | 'tidak';
}

export interface ActiveCall {
  id: string;
  nomor_antrian: string;
  jenis_layanan: Layanan;
  nomor_meja: number;
  timestamp: string;
}

export interface SystemStatus {
  queues: Antrian[];
  officers: Petugas[];
  activeCall: ActiveCall | null;
}
