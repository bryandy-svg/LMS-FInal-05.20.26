from pathlib import Path
from io import BytesIO
from docx import Document
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "output" / "sop" / "LMS_Move_Request_SOP.docx"
DEST = ROOT.parent / "output" / "sop" / "LMS_Move_Request_SOP.pdf"

docx = Document(SRC)
styles = getSampleStyleSheet()
navy = colors.HexColor("#1F2F42")
teal = colors.HexColor("#496673")
slate = colors.HexColor("#5C6A7D")

body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.3, leading=11.5, textColor=navy, spaceAfter=5)
title = ParagraphStyle("Title2", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=29, alignment=TA_CENTER, textColor=navy, spaceAfter=9)
subtitle = ParagraphStyle("Subtitle2", parent=body, fontName="Helvetica", fontSize=14, leading=18, alignment=TA_CENTER, textColor=teal, spaceAfter=14)
h1 = ParagraphStyle("H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=20, textColor=navy, spaceBefore=10, spaceAfter=6, keepWithNext=True)
h2 = ParagraphStyle("H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=teal, spaceBefore=8, spaceAfter=4, keepWithNext=True)
h3 = ParagraphStyle("H3x", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=slate, spaceBefore=6, spaceAfter=3, keepWithNext=True)
caption = ParagraphStyle("Caption2", parent=body, fontName="Helvetica-Oblique", fontSize=8, leading=10, alignment=TA_CENTER, textColor=slate, spaceAfter=6)
bullet = ParagraphStyle("Bullet2", parent=body, leftIndent=14, firstLineIndent=-8, bulletIndent=4)
number = ParagraphStyle("Number2", parent=body, leftIndent=17, firstLineIndent=-12)

def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")

def blocks(parent):
    for child in parent.element.body.iterchildren():
        if isinstance(child, CT_P): yield DocxParagraph(child, parent)
        elif isinstance(child, CT_Tbl): yield DocxTable(child, parent)

def header_footer(canvas, _doc):
    canvas.saveState()
    canvas.setFont("Helvetica-Oblique", 7.5)
    canvas.setFillColor(slate)
    canvas.drawRightString(7.7*inch, 10.63*inch, "LMS IMPORTS  |  STANDARD OPERATING PROCEDURE")
    canvas.drawString(.78*inch, .34*inch, "LMS-TRK-001  •  Internal Training Guide")
    canvas.drawRightString(7.72*inch, .34*inch, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()

story=[]
num_counter=0
for block in blocks(docx):
    if isinstance(block, DocxTable):
        data=[]
        for row in block.rows:
            data.append([Paragraph(esc(cell.text.strip()), body) for cell in row.cells])
        if not data: continue
        cols=len(data[0])
        widths={2:[1.55*inch,5.25*inch],3:[1.35*inch,2.0*inch,3.45*inch]}.get(cols,[6.8*inch/cols]*cols)
        tbl=Table(data,colWidths=widths,repeatRows=1 if len(data)>1 else 0,hAlign="CENTER")
        ts=[("VALIGN",(0,0),(-1,-1),"TOP"),("GRID",(0,0),(-1,-1),.35,colors.HexColor("#C9D4DC")),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]
        if len(data)>1: ts += [("BACKGROUND",(0,0),(-1,0),colors.HexColor("#EAF0F3")),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold")]
        tbl.setStyle(TableStyle(ts)); story += [tbl,Spacer(1,7)]
        continue

    text=block.text.strip()
    # Extract embedded screenshot(s).
    blips=block._p.xpath('.//a:blip')
    if blips:
        for blip in blips:
            rid=blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            part=docx.part.related_parts[rid]
            story.append(Image(BytesIO(part.blob),width=4.0*inch,height=5.0*inch,kind='proportional',hAlign='CENTER'))
        continue
    if not text:
        # Explicit page breaks.
        if block._p.xpath('.//w:br[@w:type="page"]'): story.append(PageBreak())
        else: story.append(Spacer(1,3))
        continue
    style=block.style.name if block.style else "Normal"
    if style=="Title": st=title
    elif style=="Subtitle": st=subtitle
    elif style=="Heading 1": st=h1
    elif style=="Heading 2": st=h2
    elif style=="Heading 3": st=h3
    elif style=="Caption": st=caption
    elif style.startswith("List Bullet"):
        story.append(Paragraph("• " + esc(text), bullet)); continue
    elif style.startswith("List Number"):
        num_counter += 1; story.append(Paragraph(f"{num_counter}. {esc(text)}", number)); continue
    else: st=body
    story.append(Paragraph(esc(text),st))

pdf=SimpleDocTemplate(str(DEST),pagesize=letter,rightMargin=.78*inch,leftMargin=.78*inch,topMargin=.68*inch,bottomMargin=.62*inch,title="LMS Move Request Standard Operating Procedure",author="LMS Imports")
pdf.build(story,onFirstPage=header_footer,onLaterPages=header_footer)
print(DEST)
