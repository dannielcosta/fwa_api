const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs");

async function generatePhysicalCardPDF(designMeta) {
  console.log("start generating PDF");

  // Create a new PDF
  const pdfDoc = await PDFDocument.create();

  // Card size in points: 1px ≈ 0.75pt → 340×428px ≈ 255×321pt
  const width = 340;
  const height = 428;

  const page = pdfDoc.addPage([width, height]);

  // Optional: Background color
  if (designMeta.backgroundColor) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(...designMeta.backgroundColor),
    });
  }

  // Load a font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw text
  if (designMeta.name) {
    page.drawText(designMeta.name, {
      x: 20,
      y: height - 60,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Draw an image if present (PNG or JPG)
  if (designMeta.imageBuffer) {
    const img = designMeta.imageType === "png"
      ? await pdfDoc.embedPng(designMeta.imageBuffer)
      : await pdfDoc.embedJpg(designMeta.imageBuffer);

    page.drawImage(img, {
      x: 20,
      y: height - 200,
      width: 200,
      height: 150,
    });
  }

  // Finish
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generatePhysicalCardPDF };
