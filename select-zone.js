// ====== SETUP ZONA ======
const allowedZones = ['SG', 'SH', 'SI']; // ubah/urutkan sesuai prioritasmu (kiri -> kanan = prioritas saat seri)

// ====== BUKA POPUP KURSI ======
const btn = document.getElementById('popup-avail');
if (btn) {
  btn.click();
  waitForDataToLoad().then(() => selectBestZone(allowedZones));
} else {
  console.error('Tombol #popup-avail tidak ditemukan.');
}

// ====== TUNGGU DATA TABEL MUNCUL ======
function waitForDataToLoad() {
  return new Promise((resolve) => {
    const obs = new MutationObserver(() => {
      if (document.querySelector('tr')) {
        obs.disconnect();
        resolve();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(); }, 1500); // timeout aman
  });
}

// ====== PILIH ZONA DENGAN KURSI TERBANYAK (HANYA SG/SH/SI) ======
function selectBestZone(whitelist) {
  const rows = document.querySelectorAll('tr');
  let best = { row: null, seats: -1, zone: null, zoneRank: 999 };

  rows.forEach((row) => {
    // Ambil kolom zona & jumlah kursi (fallback ke text jika tidak ada <a>)
    const zoneEl  = row.querySelector('td:nth-child(1) a, td:nth-child(1)');
    const seatsEl = row.querySelector('td:nth-child(2) a, td:nth-child(2)');
    if (!zoneEl || !seatsEl) return;

    const zoneIdRaw = (zoneEl.id || zoneEl.textContent || '').trim();
    const zoneId = zoneIdRaw.toUpperCase();
    const seatsCount = parseInt((seatsEl.textContent || '').replace(/[^\d]/g, ''), 10) || 0;

    // Hanya terima zona yang diawali SG/SH/SI
    const idx = whitelist.findIndex(z => zoneId.startsWith(z));
    if (idx === -1) return;

    // Pilih yang kursinya paling banyak; jika seri, pakai urutan whitelist sebagai tie-breaker
    const isBetter =
      seatsCount > best.seats ||
      (seatsCount === best.seats && idx < best.zoneRank);

    if (isBetter) {
      best = { row, seats: seatsCount, zone: zoneId, zoneRank: idx };
    }
  });

  if (!best.row) {
    console.error(`Tidak ada kursi tersedia di zona: ${whitelist.join('/')}.`);
    return;
  }

  // Klik baris terbaik & lanjut
  best.row.click();
  try {
    if (typeof gonextstep === 'function') {
      gonextstep('fixed.php', best.zone, window.event || undefined);
    }
  } catch (e) {
    console.warn('gonextstep() gagal dipanggil, tapi baris sudah diklik:', e);
  }
  console.log(`Dipilih zona ${best.zone} dengan ${best.seats} kursi.`);
}
