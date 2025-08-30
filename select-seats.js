// ====== CONFIG ======
let selectedSeats = [];
const requiredSeats = 1;                         // jumlah kursi berurutan yang dibutuhkan
const preferredRows = ["SG", "SH", "SI"];        // prioritas: SG dulu, lalu SH, lalu SI
const reloadDelayMs = 200;                       // jeda cek/refresh kecil

// ====== HELPERS ======
function closeAlertIfNeeded() {
  const alertButton = document.querySelector("button.btn-red.w-auto[onclick='MessageClose()']");
  if (alertButton) alertButton.click();
}

function areSeatsAdjacent(seats, rowCode) {
  if (seats.length < requiredSeats) return false;

  // semua harus di row yang sama & sesuai prioritas saat ini
  const rows = seats.map(seat => seat.split("-")[0]);
  const uniqueRows = [...new Set(rows)];
  if (uniqueRows.length !== 1 || uniqueRows[0] !== rowCode) return false;

  // harus berurutan (consecutive)
  const seatNumbers = seats.map(seat => parseInt(seat.split("-")[1], 10)).sort((a,b)=>a-b);
  for (let i = 1; i < seatNumbers.length; i++) {
    if (seatNumbers[i] !== seatNumbers[i-1] + 1) return false;
  }
  return true;
}

function getAvailableSeatIdsForRow(rowCode) {
  // cari semua td yang punya div.seatuncheck & bukan .not-available
  const tds = Array.from(document.querySelectorAll("#tableseats tbody td[title]"));
  return tds
    .filter(td => {
      const title = td.getAttribute("title") || "";
      const hasSeat = td.querySelector("div.seatuncheck");
      const notBlocked = !td.classList.contains("not-available");
      return hasSeat && notBlocked && title.startsWith(rowCode + "-");
    })
    .map(td => td.getAttribute("title"))
    // sort by nomor tempat duduk agar gampang cari consecutive
    .sort((a,b) => parseInt(a.split("-")[1],10) - parseInt(b.split("-")[1],10));
}

function trySelectRun(seatRun) {
  // klik semua kursi dalam run
  seatRun.forEach(seat => {
    const el = document.getElementById(`checkseat-${seat}`);
    if (el && !el.classList.contains("seatchecked")) el.click();
  });

  // tunggu sejenak untuk alert
  setTimeout(() => {
    closeAlertIfNeeded();

    const ok = seatRun.every(seat => {
      const el = document.getElementById(`checkseat-${seat}`);
      return el && el.classList.contains("seatchecked");
    });

    if (ok) {
      console.log("✅ Kursi terpilih:", seatRun.join(", "));
      const confirmButton = document.querySelector("a#bookmnow span");
      if (confirmButton && confirmButton.innerText.trim() === "ยืนยันที่นั่ง") {
        confirmButton.click();
        console.log("➡️ Klik 'ยืนยันที่นั่ง' untuk lanjut pembayaran.");
        setTimeout(() => {
          const alertButton = document.querySelector("button.btn-red.w-auto[onclick='MessageClose()']");
          if (alertButton) {
            console.log("⚠️ Ada alert sesudah konfirmasi. Reload halaman.");
            location.reload();
          }
        }, 500);
      } else {
        console.error("❌ Tombol konfirmasi tidak ditemukan.");
      }
      selectedSeats = seatRun;
      return;
    } else {
      // batalkan jika gagal (misal karena alert)
      seatRun.forEach(seat => {
        const el = document.getElementById(`checkseat-${seat}`);
        if (el && el.classList.contains("seatchecked")) el.click();
      });
      console.log("⛔ Gagal pilih run ini, coba run berikutnya.");
    }
  }, 200);
}

// ====== CORE SEARCH ======
function selectAdjacentSeatsPriority() {
  // loop sesuai prioritas: SG -> SH -> SI
  for (const rowCode of preferredRows) {
    const seatIds = getAvailableSeatIdsForRow(rowCode);
    if (seatIds.length === 0) continue;

    // sliding window untuk cari 'requiredSeats' yang berurutan
    for (let i = 0; i <= seatIds.length - requiredSeats; i++) {
      const windowSeats = seatIds.slice(i, i + requiredSeats);
      if (areSeatsAdjacent(windowSeats, rowCode)) {
        trySelectRun(windowSeats);
        return; // stop setelah mencoba satu kandidat; jika gagal, fungsi trySelectRun akan reset & lanjut via reload/recursive call
      }
    }
    // kalau row ini tidak punya run yang valid, lanjut ke prioritas berikutnya
  }

  // tidak ada kursi di SG/SH/SI yang memenuhi
  console.log("❌ Belum ada kursi adjacent di SG/SH/SI. Reload untuk scan ulang.");
  setTimeout(() => location.reload(), reloadDelayMs);
}

// ====== START ======
selectAdjacentSeatsPriority();
