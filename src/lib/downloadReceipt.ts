type ReceiptData = {
  id: string;
  roomName: string;
  roomNumber?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  methodName: string;
  pricePerNight: number;
  total: number;
  paidAt: string;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

function dateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export async function downloadReceiptPdf(receipt: ReceiptData) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const contentWidth = width - margin * 2;

  doc.setProperties({
    title: `Bukti Pembayaran Demo - ${receipt.id}`,
    subject: "Struk demo portofolio SÉLA Stay",
    author: "SÉLA Stay",
  });

  // Header.
  doc.setFillColor(23, 62, 53);
  doc.rect(0, 0, width, 48, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.text("SÉLA STAY", margin, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Boutique Hotel & Retreat | Ubud, Bali",
    margin,
    33,
  );

  let y = 62;

  doc.setTextColor(23, 62, 53);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Bukti Pembayaran Demo", margin, y);

  y += 10;

  doc.setFillColor(232, 239, 230);
  doc.roundedRect(margin, y, 43, 10, 2, 2, "F");

  doc.setFontSize(10);
  doc.text("LUNAS - DEMO", margin + 5, y + 6.5);

  y += 22;

  function ensureSpace(required: number) {
    if (y + required > height - 25) {
      doc.addPage();
      y = 25;
    }
  }

  function section(title: string) {
    ensureSpace(24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(23, 62, 53);
    doc.text(title, margin, y);

    y += 4;

    doc.setDrawColor(218, 225, 218);
    doc.line(margin, y, width - margin, y);

    y += 9;
  }

  function row(label: string, value: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const valueX = margin + 58;
    const valueWidth = contentWidth - 58;
    const lines: string[] = doc.splitTextToSize(
      value,
      valueWidth,
    );

    const rowHeight = Math.max(9, lines.length * 5 + 4);

    ensureSpace(rowHeight);

    doc.setTextColor(100, 110, 104);
    doc.text(label, margin, y);

    doc.setTextColor(23, 62, 53);
    doc.text(lines, valueX, y);

    y += rowHeight;
  }

  section("INFORMASI PEMBAYARAN");

  row("Kode booking", receipt.id);

  row(
    "Waktu pembayaran",
    new Date(receipt.paidAt).toLocaleString("id-ID"),
  );

  row("Metode", `${receipt.methodName} (simulasi)`);

  y += 4;

  section("DATA PEMESAN");

  row("Nama", receipt.guestName);
  row("Email", receipt.guestEmail);
  row("Nomor HP", receipt.guestPhone);

  y += 4;

  section("DETAIL MENGINAP");

  row("Tipe kamar", receipt.roomName);
  row(
    "Nomor kamar",
    receipt.roomNumber?.trim() || "Belum ditentukan",
  );

  row(
    "Check-in",
    `${dateLabel(receipt.checkIn)} | Mulai 14.00 WITA`,
  );

  row(
    "Check-out",
    `${dateLabel(receipt.checkOut)} | Maks. 12.00 WITA`,
  );

  row("Jumlah tamu", `${receipt.guests} orang`);
  row("Durasi", `${receipt.nights} malam`);
  row("Harga per malam", rupiah(receipt.pricePerNight));

  y += 4;
  ensureSpace(28);

  doc.setFillColor(232, 239, 230);
  doc.roundedRect(
    margin,
    y,
    contentWidth,
    19,
    3,
    3,
    "F",
  );

  doc.setTextColor(23, 62, 53);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text("TOTAL PEMBAYARAN", margin + 6, y + 12);

  doc.text(
    rupiah(receipt.total),
    width - margin - 6,
    y + 12,
    { align: "right" },
  );

  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const disclaimer: string[] = doc.splitTextToSize(
    "DEMO PORTOFOLIO: Dokumen ini bukan bukti transaksi atau reservasi sungguhan. Tidak ada uang yang dipotong atau diterima. Email hanya berupa preview dan tidak dikirim.",
    contentWidth,
  );

  ensureSpace(disclaimer.length * 5 + 8);

  doc.setTextColor(110, 100, 80);
  doc.text(disclaimer, margin, y);

  // Footer dan nomor halaman.
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    doc.text(
      `SÉLA Stay | Demo Portofolio | ${page}/${pages}`,
      width / 2,
      height - 12,
      { align: "center" },
    );
  }

  doc.save(`${receipt.id}.pdf`);
}