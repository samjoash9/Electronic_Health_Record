// jspdf (with the html2canvas and dompurify it pulls in) and html-to-image are
// only needed once someone clicks Export, so they load then rather than in the
// bundle every page pays for.
export async function loadPdfTools() {
  const [{ default: jsPDF }, { toJpeg }] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
  ]);
  return { jsPDF, toJpeg };
}
