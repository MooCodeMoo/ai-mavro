import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      surface,
      contamination,
      product,
      dilution,
      steps,
      safety,
      aiAnalysis,
      customerName = "",
      location = "",
      contactInfo = "",
      productUrl = "",
      productPrice,
    } = body;

    const logoPath = path.join(process.cwd(), "public", "mavro-logo.png");
    const timestamp = Date.now();

    const pythonScript = `
import sys, os, json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from datetime import datetime

data = json.loads('''${JSON.stringify(body).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}''')
logo_path = '${logoPath}'

# ── Palette ───────────────────────────────────────────────
DARK   = colors.HexColor('#1f2937')
ACCENT = colors.HexColor('#374151')
MED    = colors.HexColor('#6b7280')
LIGHT  = colors.HexColor('#f9fafb')
BORDER = colors.HexColor('#e5e7eb')
WHITE  = colors.white

W, H     = A4
MARGIN   = 1.8 * cm
FULL_W   = W - 2 * MARGIN   # approx 493 pt / 17.4 cm
HEADER_H = 2.5 * cm

# ── Header + Footer callback ──────────────────────────────
def header_footer(canv, doc):
    canv.saveState()

    # Logo — read actual dimensions to avoid skew
    logo_w = 5 * cm
    if os.path.exists(logo_path):
        try:
            from reportlab.lib.utils import ImageReader
            ir = ImageReader(logo_path)
            iw, ih = ir.getSize()
            logo_h = logo_w * ih / iw
            logo_y = H - HEADER_H + (HEADER_H - logo_h) / 2
            canv.drawImage(logo_path, MARGIN, logo_y,
                           width=logo_w, height=logo_h, mask='auto')
        except Exception:
            canv.setFont('Helvetica-Bold', 16)
            canv.setFillColor(DARK)
            canv.drawString(MARGIN, H - HEADER_H / 2 - 6, 'MAVRO')

    # Title + date (right-aligned)
    canv.setFont('Helvetica-Bold', 9)
    canv.setFillColor(DARK)
    canv.drawRightString(W - MARGIN, H - HEADER_H / 2 + 4,
                         'SURFACE TREATMENT PLAN')
    canv.setFont('Helvetica', 7.5)
    canv.setFillColor(MED)
    canv.drawRightString(W - MARGIN, H - HEADER_H / 2 - 8,
                         datetime.now().strftime('%d %B %Y'))

    # Separator line below header
    canv.setStrokeColor(BORDER)
    canv.setLineWidth(0.5)
    canv.line(MARGIN, H - HEADER_H, W - MARGIN, H - HEADER_H)

    # Footer band
    canv.setFillColor(DARK)
    canv.rect(0, 0, W, 1.4 * cm, fill=1, stroke=0)
    canv.setFont('Helvetica', 7)
    canv.setFillColor(WHITE)
    canv.drawCentredString(W / 2, 0.65 * cm,
        'Mavro International  \u00b7  Heksekamp 1, 5301 LX Zaltbommel, Netherlands')
    canv.drawCentredString(W / 2, 0.28 * cm,
        '+31 418 680 680  \u00b7  info@mavro-int.com  \u00b7  www.mavro-int.com')
    canv.restoreState()

# ── Document ──────────────────────────────────────────────
filename = '/tmp/mavro-treatment-plan-${timestamp}.pdf'
doc = SimpleDocTemplate(
    filename, pagesize=A4,
    rightMargin=MARGIN, leftMargin=MARGIN,
    topMargin=HEADER_H + 0.6 * cm, bottomMargin=2 * cm
)

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, parent=styles['Normal'], **kw)

section_s = S('Se',  fontSize=9.5,  textColor=DARK,   fontName='Helvetica-Bold')
label_s   = S('L',   fontSize=8.5,  textColor=MED,    fontName='Helvetica-Bold')
value_s   = S('V',   fontSize=9.5,  textColor=DARK)
body_s    = S('B',   fontSize=9.5,  textColor=DARK,   leading=14)
step_no_s = S('SN',  fontSize=9,    textColor=WHITE,  fontName='Helvetica-Bold', alignment=TA_CENTER)
prod_s    = S('P',   fontSize=13,   textColor=DARK,   fontName='Helvetica-Bold')

def sh(title):
    """Section header with dark left accent bar."""
    t = Table([[' ', Paragraph(title, section_s)]],
              colWidths=[0.25 * cm, FULL_W - 0.25 * cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, 0),  ACCENT),
        ('BACKGROUND',    (1, 0), (1, 0),  LIGHT),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (1, 0), (1,  0),  10),
        ('RIGHTPADDING',  (1, 0), (1,  0),  10),
        ('LEFTPADDING',   (0, 0), (0,  0),  0),
    ]))
    return t

elems = []

# ── Customer info ─────────────────────────────────────────
if data.get('customerName') or data.get('location') or data.get('contactInfo'):
    rows = []
    for lbl, key in [('Customer', 'customerName'), ('Location', 'location'), ('Contact', 'contactInfo')]:
        if data.get(key):
            rows.append([Paragraph(lbl, label_s), Paragraph(str(data[key]), value_s)])
    rows.append([Paragraph('Date', label_s),
                 Paragraph(datetime.now().strftime('%d.%m.%Y'), value_s)])
    t = Table(rows, colWidths=[3.5 * cm, FULL_W - 3.5 * cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), LIGHT),
        ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.3, BORDER),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 0.6 * cm))

# ── Surface & Contamination ───────────────────────────────
elems.append(sh('SURFACE & CONTAMINATION'))
elems.append(Spacer(1, 0.15 * cm))

sc_rows = [
    [Paragraph('Surface Type',  label_s), Paragraph(data['surface'],       value_s)],
    [Paragraph('Contamination', label_s), Paragraph(data['contamination'], value_s)],
]
if data.get('aiAnalysis') and data['aiAnalysis'].get('confidence'):
    sc_rows.append([
        Paragraph('AI Confidence', label_s),
        Paragraph(str(int(data['aiAnalysis']['confidence'] * 100)) + '%', value_s)
    ])
if data.get('aiAnalysis') and data['aiAnalysis'].get('notes'):
    sc_rows.append([Paragraph('AI Notes', label_s),
                    Paragraph(str(data['aiAnalysis']['notes']), value_s)])

sc_style = [
    ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
    ('LINEBELOW',     (0, 0), (-1, -2), 0.3, BORDER),
    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING',    (0, 0), (-1, -1), 7),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ('LEFTPADDING',   (0, 0), (-1, -1), 10),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
]
for i in range(len(sc_rows)):
    sc_style.append(('BACKGROUND', (0, i), (-1, i), WHITE if i % 2 == 0 else LIGHT))

sc_t = Table(sc_rows, colWidths=[3.5 * cm, FULL_W - 3.5 * cm])
sc_t.setStyle(TableStyle(sc_style))
elems.append(sc_t)
elems.append(Spacer(1, 0.6 * cm))

# ── Recommended Solution ──────────────────────────────────
elems.append(sh('RECOMMENDED SOLUTION'))
elems.append(Spacer(1, 0.15 * cm))

sol_t = Table([
    [Paragraph('Recommended Product', label_s)],
    [Paragraph(str(data['product']), prod_s)],
    [Spacer(1, 4)],
    [Paragraph('Dilution Ratio', label_s)],
    [Paragraph(str(data['dilution']), value_s)],
], colWidths=[FULL_W])
sol_t.setStyle(TableStyle([
    ('BACKGROUND',    (0, 0), (-1, -1), WHITE),
    ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
    ('TOPPADDING',    (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING',   (0, 0), (-1, -1), 12),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
]))
elems.append(sol_t)
elems.append(Spacer(1, 0.6 * cm))

# ── Application Steps ─────────────────────────────────────
elems.append(sh('APPLICATION INSTRUCTIONS'))
elems.append(Spacer(1, 0.15 * cm))

step_rows = [
    [Paragraph(str(i + 1), step_no_s), Paragraph(str(s), body_s)]
    for i, s in enumerate(data['steps'])
]
step_style = [
    ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
    ('LINEBELOW',     (0, 0), (-1, -2), 0.3, BORDER),
    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING',    (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING',   (0, 0), (0,  -1), 0),
    ('RIGHTPADDING',  (0, 0), (0,  -1), 0),
    ('LEFTPADDING',   (1, 0), (1,  -1), 10),
    ('RIGHTPADDING',  (1, 0), (1,  -1), 10),
]
for i in range(len(data['steps'])):
    step_style.append(('BACKGROUND', (0, i), (0, i), ACCENT))
    step_style.append(('BACKGROUND', (1, i), (1, i), WHITE if i % 2 == 0 else LIGHT))

steps_t = Table(step_rows, colWidths=[0.8 * cm, FULL_W - 0.8 * cm])
steps_t.setStyle(TableStyle(step_style))
elems.append(steps_t)
elems.append(Spacer(1, 0.6 * cm))

# ── Safety Guidelines ─────────────────────────────────────
elems.append(sh('SAFETY GUIDELINES'))
elems.append(Spacer(1, 0.15 * cm))

saf_t = Table([[Paragraph(str(data['safety']), body_s)]], colWidths=[FULL_W])
saf_t.setStyle(TableStyle([
    ('BACKGROUND',    (0, 0), (-1, -1), colors.HexColor('#fafafa')),
    ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
    ('LEFTPADDING',   (0, 0), (-1, -1), 12),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ('TOPPADDING',    (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
elems.append(saf_t)
elems.append(Spacer(1, 0.6 * cm))

# ── Order CTA ─────────────────────────────────────────────
order_url = data.get('productUrl') or 'https://mavro-int.shop/sl/'
price_part = ''
if data.get('productPrice'):
    price_part = f'  \u00b7  <b>\u20ac{float(data["productPrice"]):.2f}/L</b>'
order_t = Table([[Paragraph(
    '<b>Order ' + str(data['product']) + ' online:</b>  '
    '<font color="#374151"><u>' + order_url + '</u></font>' + price_part,
    body_s
)]], colWidths=[FULL_W])
order_t.setStyle(TableStyle([
    ('BACKGROUND',    (0, 0), (-1, -1), LIGHT),
    ('BOX',           (0, 0), (-1, -1), 0.5, BORDER),
    ('LEFTPADDING',   (0, 0), (-1, -1), 12),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ('TOPPADDING',    (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
elems.append(order_t)

# ── Build ─────────────────────────────────────────────────
doc.build(elems, onFirstPage=header_footer, onLaterPages=header_footer)
print(filename)
`;

    const scriptPath = `/tmp/generate-pdf-${timestamp}.py`;
    await fs.writeFile(scriptPath, pythonScript);

    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
    if (stderr) console.error("PDF stderr:", stderr);
    const pdfPath = stdout.trim();

    const pdfBuffer = await fs.readFile(pdfPath);

    await fs.unlink(scriptPath).catch(() => {});
    await fs.unlink(pdfPath).catch(() => {});

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Mavro-Treatment-Plan-${timestamp}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: (error as Error).message },
      { status: 500 }
    );
  }
}
