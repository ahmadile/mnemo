"""
Generate the Mnemo project presentation PDF.
Based on the architecture document provided by the user.

Uses ReportLab with:
- Noto Serif SC for body (also covers French accents)
- Tinos / Liberation Serif for Latin
- Dark theme cover + light body pages
- Page breaks only between cover/TOC and TOC/content
"""
import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, Flowable, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import BaseDocTemplate, PageTemplate
from reportlab.platypus.frames import Frame

# ============================================================
# FONT REGISTRATION
# ============================================================
FONT_DIR = '/usr/share/fonts'

# Tinos (serif, has French accents, Google Fonts equivalent of Times)
try:
    pdfmetrics.registerFont(TTFont('Tinos', f'{FONT_DIR}/truetype/english/Tinos-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('Tinos-Bold', f'{FONT_DIR}/truetype/english/Tinos-Bold.ttf'))
    pdfmetrics.registerFont(TTFont('Tinos-Italic', f'{FONT_DIR}/truetype/english/Tinos-Italic.ttf'))
    pdfmetrics.registerFont(TTFont('Tinos-BoldItalic', f'{FONT_DIR}/truetype/english/Tinos-BoldItalic.ttf'))
    registerFontFamily('Tinos', normal='Tinos', bold='Tinos-Bold', italic='Tinos-Italic', boldItalic='Tinos-BoldItalic')
    BODY_FONT = 'Tinos'
    BODY_BOLD = 'Tinos-Bold'
    BODY_ITALIC = 'Tinos-Italic'
except Exception:
    BODY_FONT = 'Helvetica'
    BODY_BOLD = 'Helvetica-Bold'
    BODY_ITALIC = 'Helvetica-Oblique'

# Carlito (sans-serif, Calibri equivalent) for headings/UI
try:
    pdfmetrics.registerFont(TTFont('Carlito', f'{FONT_DIR}/truetype/english/Carlito-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('Carlito-Bold', f'{FONT_DIR}/truetype/english/Carlito-Bold.ttf'))
    registerFontFamily('Carlito', normal='Carlito', bold='Carlito-Bold')
    HEAD_FONT = 'Carlito-Bold'
    SANS_FONT = 'Carlito'
except Exception:
    HEAD_FONT = 'Helvetica-Bold'
    SANS_FONT = 'Helvetica'

# Liberation Mono for code
try:
    pdfmetrics.registerFont(TTFont('LibMono', f'{FONT_DIR}/truetype/liberation/LiberationMono-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('LibMono-Bold', f'{FONT_DIR}/truetype/liberation/LiberationMono-Bold.ttf'))
    MONO_FONT = 'LibMono'
    MONO_BOLD = 'LibMono-Bold'
except Exception:
    MONO_FONT = 'Courier'
    MONO_BOLD = 'Courier-Bold'

# ============================================================
# COLOR PALETTE (matches the Mnemo web app)
# ============================================================
C_BG_DARK = HexColor('#0a0a0a')
C_BG_CARD = HexColor('#18181b')
C_FG_LIGHT = HexColor('#f4f4f5')
C_FG_MUTED = HexColor('#a1a1aa')
C_FG_DIM = HexColor('#52525b')
C_ACCENT = HexColor('#10b981')      # emerald
C_ACCENT_AMBER = HexColor('#f59e0b') # amber
C_ACCENT_BLUE = HexColor('#3b82f6')
C_ACCENT_PURPLE = HexColor('#a855f7')

# Body page palette (light background for readability)
C_BODY_BG = HexColor('#ffffff')
C_BODY_FG = HexColor('#1a1a1a')
C_BODY_MUTED = HexColor('#525252')
C_BODY_BORDER = HexColor('#e4e4e7')
C_BODY_ACCENT = HexColor('#047857')  # darker emerald for contrast on white

# Domain colors
DOMAIN_COLORS = {
    'PYTHON': '#3b82f6',
    'SQL': '#10b981',
    'IA': '#a855f7',
    'DATA': '#f59e0b',
    'WEB': '#ef4444',
}

# ============================================================
# PAGE TEMPLATES
# ============================================================
PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

class MnemoDocTemplate(BaseDocTemplate):
    """Custom doc template with cover page + body pages."""
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        # Cover frame: full page, no margins
        cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id='cover')
        # Body frame: standard margins
        body_frame = Frame(
            MARGIN, MARGIN + 12*mm,
            PAGE_W - 2*MARGIN, PAGE_H - 2*MARGIN - 12*mm,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id='body'
        )
        # TOC frame (same as body)
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=[cover_frame], onPage=draw_cover_bg),
            PageTemplate(id='Body', frames=[body_frame], onPage=draw_body_bg),
        ])

    def afterFlowable(self, flowable):
        """Register TOC entries."""
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            text = flowable.getPlainText()
            if style_name == 'TOC1':
                self.notify('TOCEntry', (0, text, self.page))
            elif style_name == 'TOC2':
                self.notify('TOCEntry', (1, text, self.page))


def draw_cover_bg(canvas, doc):
    """Dark background for cover page."""
    canvas.saveState()
    # Solid dark background
    canvas.setFillColor(C_BG_DARK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Emerald glow circle top-right
    canvas.setFillColor(C_ACCENT)
    canvas.setFillAlpha(0.08)
    canvas.circle(PAGE_W - 30*mm, PAGE_H - 40*mm, 80*mm, fill=1, stroke=0)
    # Amber glow bottom-left
    canvas.setFillColor(C_ACCENT_AMBER)
    canvas.setFillAlpha(0.05)
    canvas.canvas.circle(30*mm, 40*mm, 60*mm, fill=1, stroke=0) if hasattr(canvas, 'canvas') else canvas.circle(30*mm, 40*mm, 60*mm, fill=1, stroke=0)
    # Grid pattern (subtle)
    canvas.setStrokeColor(HexColor('#27272a'))
    canvas.setLineWidth(0.3)
    canvas.setFillAlpha(1)
    for x in range(0, int(PAGE_W), 20):
        canvas.line(x, 0, x, PAGE_H)
    for y in range(0, int(PAGE_H), 20):
        canvas.line(0, y, PAGE_W, y)
    canvas.restoreState()


def draw_body_bg(canvas, doc):
    """Light background + header/footer for body pages."""
    canvas.saveState()
    # White background
    canvas.setFillColor(C_BODY_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Top header bar (thin emerald line)
    canvas.setStrokeColor(C_ACCENT)
    canvas.setLineWidth(2)
    canvas.line(0, PAGE_H - 8*mm, PAGE_W, PAGE_H - 8*mm)
    # Header text
    canvas.setFont(SANS_FONT, 8)
    canvas.setFillColor(C_BODY_MUTED)
    canvas.drawString(MARGIN, PAGE_H - 12*mm, "MNEMO · Document d'architecture v1.0")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 12*mm, 'Plateforme de révision par missions narratives')
    # Footer
    canvas.setStrokeColor(C_BODY_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 12*mm, PAGE_W - MARGIN, 12*mm)
    canvas.setFont(SANS_FONT, 8)
    canvas.setFillColor(C_BODY_MUTED)
    canvas.drawString(MARGIN, 8*mm, 'Mnemo')
    canvas.drawRightString(PAGE_W - MARGIN, 8*mm, f'Page {doc.page - 1}')  # -1 because cover is page 1
    canvas.restoreState()


# ============================================================
# STYLES
# ============================================================
def make_styles():
    s = getSampleStyleSheet()

    # Helper to add or replace a style
    def add_style(name, **kwargs):
        # Override if exists by directly setting
        try:
            s.add(ParagraphStyle(name=name, **kwargs))
        except KeyError:
            # Already exists - update by replacing the internal dict entry
            s.byName[name] = ParagraphStyle(name=name, **kwargs)

    # Cover styles
    add_style('CoverEyebrow',
        fontName=SANS_FONT, fontSize=10, textColor=C_ACCENT,
        leading=14, alignment=TA_LEFT, spaceAfter=8,
    )
    add_style('CoverTitle',
        fontName=HEAD_FONT, fontSize=56, textColor=C_FG_LIGHT,
        leading=58, alignment=TA_LEFT, spaceAfter=12,
    )
    add_style('CoverSubtitle',
        fontName=BODY_ITALIC, fontSize=18, textColor=C_FG_MUTED,
        leading=24, alignment=TA_LEFT, spaceAfter=24,
    )
    add_style('CoverBody',
        fontName=BODY_FONT, fontSize=11, textColor=C_FG_LIGHT,
        leading=17, alignment=TA_LEFT, spaceAfter=10,
    )
    add_style('CoverMeta',
        fontName=SANS_FONT, fontSize=9, textColor=C_FG_MUTED,
        leading=12, alignment=TA_LEFT,
    )
    add_style('CoverTag',
        fontName=SANS_FONT, fontSize=8, textColor=C_ACCENT,
        leading=10, alignment=TA_CENTER,
    )

    # Body styles
    add_style('TOC1',
        fontName=HEAD_FONT, fontSize=14, textColor=C_BODY_FG,
        leading=20, spaceBefore=14, spaceAfter=4,
    )
    add_style('TOC2',
        fontName=BODY_FONT, fontSize=11, textColor=C_BODY_MUTED,
        leading=16, leftIndent=20,
    )
    add_style('H1',
        fontName=HEAD_FONT, fontSize=24, textColor=C_BODY_ACCENT,
        leading=30, spaceBefore=18, spaceAfter=12, keepWithNext=1,
    )
    add_style('H2',
        fontName=HEAD_FONT, fontSize=16, textColor=C_BODY_FG,
        leading=22, spaceBefore=14, spaceAfter=6, keepWithNext=1,
    )
    add_style('H3',
        fontName=HEAD_FONT, fontSize=12, textColor=C_BODY_ACCENT,
        leading=16, spaceBefore=10, spaceAfter=4, keepWithNext=1,
    )
    add_style('Body',
        fontName=BODY_FONT, fontSize=10.5, textColor=C_BODY_FG,
        leading=15, alignment=TA_JUSTIFY, spaceAfter=8,
    )
    add_style('BodyLeft',
        fontName=BODY_FONT, fontSize=10.5, textColor=C_BODY_FG,
        leading=15, alignment=TA_LEFT, spaceAfter=8,
    )
    add_style('BulletBody',
        fontName=BODY_FONT, fontSize=10.5, textColor=C_BODY_FG,
        leading=15, alignment=TA_LEFT, spaceAfter=4,
        leftIndent=20, bulletIndent=8,
    )
    add_style('Quote',
        fontName=BODY_ITALIC, fontSize=11, textColor=C_BODY_MUTED,
        leading=16, alignment=TA_LEFT, spaceAfter=8,
        leftIndent=20, rightIndent=20, borderColor=C_ACCENT, borderWidth=0,
    )
    add_style('Code',
        fontName=MONO_FONT, fontSize=9, textColor=C_BODY_FG,
        leading=12, alignment=TA_LEFT, spaceAfter=6,
        leftIndent=10, rightIndent=10, backColor=HexColor('#f4f4f5'),
        borderColor=C_BODY_BORDER, borderWidth=0.5, borderPadding=6,
    )
    add_style('Caption',
        fontName=SANS_FONT, fontSize=8.5, textColor=C_BODY_MUTED,
        leading=11, alignment=TA_CENTER, spaceAfter=8, spaceBefore=2,
    )
    add_style('TableCell',
        fontName=BODY_FONT, fontSize=9.5, textColor=C_BODY_FG,
        leading=13, alignment=TA_LEFT,
    )
    add_style('TableHeader',
        fontName=HEAD_FONT, fontSize=9.5, textColor=white,
        leading=13, alignment=TA_LEFT,
    )
    return s


# ============================================================
# CUSTOM FLOWABLES
# ============================================================
class HRule(Flowable):
    """Horizontal rule."""
    def __init__(self, color=C_ACCENT, width=None, thickness=1.5):
        super().__init__()
        self.color = color
        self.thickness = thickness
        self._width = width

    def wrap(self, availW, availH):
        self.width = self._width or availW
        return self.width, self.thickness + 2

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


class ColorChip(Flowable):
    """Small colored square for legend."""
    def __init__(self, color, size=8):
        super().__init__()
        self.color = color
        self.size = size

    def wrap(self, availW, availH):
        return self.size + 4, self.size

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.size, self.size, fill=1, stroke=0)


# ============================================================
# CONTENT BUILDERS
# ============================================================
def build_cover(styles):
    """Build the cover page content."""
    flow = []
    # Top spacing
    flow.append(Spacer(1, 50*mm))
    # Eyebrow
    flow.append(Paragraph('PLATEFORME D\'APPRENTISSAGE · v1.0', styles['CoverEyebrow']))
    # Title
    flow.append(Paragraph('MNEMO', styles['CoverTitle']))
    # Subtitle
    flow.append(Paragraph(
        'Réviser par missions narratives.<br/>Capturer ses compétences en agents-mémoire.',
        styles['CoverSubtitle']
    ))
    # Description
    flow.append(Paragraph(
        'Mnemo transforme chaque cours que vous apprenez en une mission de codage interactive, '
        'puis capture votre compétence dans un agent-mémoire interrogeable. Votre réseau grandit '
        'au fur et à mesure — chaque agent est un snapshot de votre savoir à un moment précis, '
        'dans un domaine précis.',
        styles['CoverBody']
    ))
    flow.append(Spacer(1, 16*mm))

    # Tag chips
    tag_data = [
        ['PYTHON', 'SQL', 'IA', 'DATA SCIENCE', 'DEV WEB']
    ]
    tag_table = Table(tag_data, colWidths=[28*mm, 22*mm, 18*mm, 35*mm, 28*mm])
    tag_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), SANS_FONT, 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), C_ACCENT),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (0, 0), 0.5, C_ACCENT),
        ('BOX', (1, 0), (1, 0), 0.5, C_ACCENT),
        ('BOX', (2, 0), (2, 0), 0.5, C_ACCENT),
        ('BOX', (3, 0), (3, 0), 0.5, C_ACCENT),
        ('BOX', (4, 0), (4, 0), 0.5, C_ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    flow.append(tag_table)

    flow.append(Spacer(1, 60*mm))
    # Bottom meta
    flow.append(HRule(C_ACCENT, thickness=1))
    flow.append(Spacer(1, 4*mm))
    meta_data = [
        [Paragraph('DOCUMENT', styles['CoverMeta']),
         Paragraph('AUDIENCE', styles['CoverMeta']),
         Paragraph('STATUT', styles['CoverMeta'])],
        [Paragraph('Architecture v1.0', styles['CoverBody']),
         Paragraph('Apprenant solo · Concepteur', styles['CoverBody']),
         Paragraph('MVP fonctionnel', styles['CoverBody'])],
    ]
    meta_table = Table(meta_data, colWidths=[55*mm, 55*mm, 55*mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    flow.append(meta_table)

    flow.append(PageBreak())
    return flow


def build_toc(styles):
    """Build the table of contents."""
    flow = []
    flow.append(Paragraph('Table des matières', styles['H1']))
    flow.append(HRule(C_ACCENT))
    flow.append(Spacer(1, 6*mm))

    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            name='TOC1',
            fontName=HEAD_FONT, fontSize=11, textColor=C_BODY_FG,
            leading=18, leftIndent=0, spaceBefore=4,
        ),
        ParagraphStyle(
            name='TOC2',
            fontName=BODY_FONT, fontSize=10, textColor=C_BODY_MUTED,
            leading=14, leftIndent=18,
        ),
    ]
    flow.append(toc)
    flow.append(PageBreak())
    return flow


def build_section_1(styles):
    """1. Concept central."""
    flow = []
    flow.append(Paragraph("1. Concept central", styles['TOC1']))
    flow.append(Paragraph("1. Concept central", styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Mnemo transforme la révision technique (Python, SQL, IA, data science, dev web) en un '
        'cycle <b>apprentissage → mission interactive → agent-mémoire persistant</b>. L\'objectif '
        'n\'est pas de "savoir plus", mais de <b>ne jamais perdre ce que vous avez appris</b> — '
        'en ayant un répertoire d\'agents qui incarnent chaque étape de votre progression, et que '
        'vous pouvez réveiller à tout moment pour réviser sans tout reparcourir depuis zéro.',
        styles['Body']
    ))

    flow.append(Paragraph('Deux moteurs complémentaires', styles['H3']))
    flow.append(Paragraph(
        'Le système repose sur deux moteurs qui travaillent ensemble pour transformer un contenu '
        'de cours brut en un artifact de mémoire permanent. Le premier moteur est le générateur '
        'de missions, qui convertit un contenu pédagogique (lien DataCamp, blog, vidéo, ou notes '
        'libres) en exercice de code scénarisé, strictement borné au périmètre du chapitre '
        'soumis. Le second moteur est l\'agent-mémoire, qui capture un "snapshot" de compétence '
        'sous forme d\'agent IA interrogeable, qui répond comme vous, à ce niveau-là, à ce '
        'moment-là de votre apprentissage.',
        styles['Body']
    ))

    flow.append(Spacer(1, 4*mm))

    # Two engines side by side
    engine_data = [
        [
            Paragraph('<b>MOTEUR 1</b>', styles['TableHeader']),
            Paragraph('<b>MOTEUR 2</b>', styles['TableHeader']),
        ],
        [
            Paragraph('<b>Générateur de Missions</b>', styles['TableCell']),
            Paragraph('<b>Agent-Mémoire</b>', styles['TableCell']),
        ],
        [
            Paragraph(
                '<b>Entrée :</b> lien de cours ou résumé texte<br/>'
                '<b>Sortie :</b> mission scénarisée = énoncé narratif + exercice de code + critères de validation<br/>'
                '<b>Rôle :</b> convertir un chapitre en défi interactif borné',
                styles['TableCell']
            ),
            Paragraph(
                '<b>Déclencheur :</b> fin d\'un cursus complet (niveau 3 atteint)<br/>'
                '<b>Sortie :</b> snapshot de compétence interrogeable<br/>'
                '<b>Rôle :</b> capturer et préserver votre savoir dans un domaine précis',
                styles['TableCell']
            ),
        ],
    ]
    engine_table = Table(engine_data, colWidths=[(PAGE_W - 2*MARGIN) / 2 - 4] * 2)
    engine_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_ACCENT),
        ('BACKGROUND', (0, 1), (-1, 1), HexColor('#f0fdf4')),
        ('BACKGROUND', (0, 2), (-1, 2), HexColor('#fafafa')),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
        ('LINEAFTER', (0, 0), (0, -1), 0.5, C_BODY_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    flow.append(engine_table)

    flow.append(Spacer(1, 6*mm))
    flow.append(Paragraph(
        'La boucle complète se déroule en trois temps. D\'abord, vous soumettez le contenu d\'un '
        'chapitre que vous venez d\'étudier (vos notes, un lien DataCamp, une page de documentation). '
        'Ensuite, l\'IA génère une mission de codage scénarisée qui teste exactement les notions '
        'du chapitre, sans jamais déborder sur des concepts non encore vus. Vous codez votre '
        'solution dans un éditeur interactif, vous soumettez, et l\'IA évalue si votre code '
        'répond aux objectifs. Chaque mission validée rapporte de l\'XP dans le cursus '
        'correspondant. Quand vous atteignez le niveau 3 dans un cursus (1500 XP), un agent-mémoire '
        'naît automatiquement dans votre monde virtuel — il devient votre mémoire interrogeable '
        'dans ce domaine précis.',
        styles['Body']
    ))

    return flow


def build_section_2(styles):
    """2. Pourquoi ça marche pédagogiquement."""
    flow = []
    flow.append(Paragraph("2. Pourquoi ça marche p\u00e9dagogiquement", styles['TOC1']))
    flow.append(Paragraph("2. Pourquoi ça marche p\u00e9dagogiquement", styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Mnemo s\'appuie sur quatre principes pédagogiques éprouvés, combinés dans un cycle '
        'cohérent qui maximise la rétention à long terme. Ces principes ne sont pas une '
        'innovation théorique mais une synthèse pragmatico-scientifique de ce qui fonctionne '
        'déjà en apprentissage espacé, en formation active et en gamification sérieuse.',
        styles['Body']
    ))

    flow.append(Paragraph('Granularité stricte', styles['H3']))
    flow.append(Paragraph(
        'Une mission ne couvre jamais plus que le chapitre soumis. Cela évite la surcharge '
        'cognitive et la frustration des exercices "qui mélangent tout". Quand l\'utilisateur '
        'soumet un cours sur les boucles <font face="LibMono">for</font> en Python, la mission '
        'générée ne fait appel qu\'à la syntaxe des boucles <font face="LibMono">for</font>, '
        'jamais à des fonctions, des classes ou des list comprehensions qui n\'ont pas encore '
        'été vues. Ce scoping strict est la pièce la plus délicate techniquement : il faut un '
        'prompt qui force le modèle à lister explicitement "concepts autorisés" versus '
        '"concepts interdits" avant de générer la mission, sinon il y a fuite — le modèle a '
        ' tendance à enrichir naturellement le périmètre.',
        styles['Body']
    ))

    flow.append(Paragraph('Rappel actif espacé (spaced retrieval)', styles['H3']))
    flow.append(Paragraph(
        'Interroger un agent-mémoire force un rappel actif, bien plus efficace pour la rétention '
        'qu\'une relecture passive. Quand vous demandez à votre agent "qu\'est-ce qu\'on a '
        'appris la dernière fois ?", il doit reconstruire la réponse à partir de ce qui a été '
        'capturé, ce qui force votre cerveau à re-parcourir le chemin de la notion. C\'est '
        'l\'essence du spaced retrieval : tester la mémoire à intervalles réguliers, plutôt '
        'que relire passivement. La particularité de Mnemo est que l\'agent répond à la première '
        'personne, comme votre "vous du futur" — ce qui crée un dialogue intime avec votre '
        'propre savoir plutôt qu\'avec un tuteur externe.',
        styles['Body']
    ))

    flow.append(Paragraph('Scénarisation ludique', styles['H3']))
    flow.append(Paragraph(
        'Habiller l\'exercice en mission narrative (façon GTA) augmente l\'engagement et réduit '
        'la sensation de "corvée de révision". Au lieu d\'un énoncé scolaire sec ("Écrivez une '
        'fonction qui calcule la moyenne d\'une liste"), l\'utilisateur reçoit un briefing '
        'narratif ("Un client vient d\'appeler. Il lui faut un script qui analyse les ventes '
        'du dernier trimestre. Tu as 5 minutes. Prouve que tu mérites ton pay."). La mission '
        'est la même, mais l\'engagement émotionnel est radicalement différent. La scénarisation '
        'transforme la révision en jeu, ce qui augmente la durée des sessions et la fréquence '
        'de retour.',
        styles['Body']
    ))

    flow.append(Paragraph('Auto-cohérence narrative', styles['H3']))
    flow.append(Paragraph(
        'Le fait que l\'agent "ingénieur Python junior" puisse plus tard postuler auprès de '
        'l\'agent "ingénieur IA" crée une métaphore visuelle de la progression de carrière — '
        'utile pour visualiser où vous en êtes dans un cursus long (ex: devenir ingénieur IA). '
        'Cette auto-cohérence narrative transforme l\'apprentissage en récit : vous n\'êtes '
        'plus en train de "faire des exercices", vous êtes en train de faire grandir un réseau '
        'de compétences incarnées qui dialoguent entre elles. C\'est une différence fondamentale '
        'avec les plateformes classiques de flashcards ou de quizzes.',
        styles['Body']
    ))

    return flow


def build_section_3(styles):
    """3. Personas."""
    flow = []
    flow.append(Paragraph('3. Personas', styles['TOC1']))
    flow.append(Paragraph('3. Personas (si ça devient un produit)', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Mnemo a été conçu initialement pour un cas d\'usage personnel : un apprenant solo '
        'intensif qui étudie plusieurs domaines en parallèle (Python, SQL, IA, dev web) et qui '
        'veut garder une trace structurée de sa progression sans tout réapprendre à chaque '
        'reprise. Mais l\'architecture se prête à plusieurs personas si le projet évolue vers '
        'un produit. Voici les quatre profils types qui pourraient bénéficier de Mnemo, du '
        'plus proche du cas initial au plus éloigné.',
        styles['Body']
    ))

    persona_data = [
        [Paragraph('<b>Persona</b>', styles['TableHeader']),
         Paragraph('<b>Profil</b>', styles['TableHeader']),
         Paragraph('<b>Besoin principal</b>', styles['TableHeader'])],
        [Paragraph('<b>L\'apprenant solo intensif</b>', styles['TableCell']),
         Paragraph('Apprend plusieurs domaines en parallèle (Python, SQL, IA, dev web)', styles['TableCell']),
         Paragraph('Ne pas oublier, garder une trace structurée de progression', styles['TableCell'])],
        [Paragraph('<b>L\'étudiant en reconversion</b>', styles['TableCell']),
         Paragraph('Suit un bootcamp ou cursus long (6-12 mois)', styles['TableCell']),
         Paragraph('Motivation, gamification, preuve tangible de compétence acquise', styles['TableCell'])],
        [Paragraph('<b>Le formateur / bootcamp</b>', styles['TableCell']),
         Paragraph('Veut un outil d\'évaluation continue pour ses élèves', styles['TableCell']),
         Paragraph('Suivi de progression par chapitre, missions générées automatiquement', styles['TableCell'])],
        [Paragraph('<b>Le recruteur tech (usage dérivé)</b>', styles['TableCell']),
         Paragraph('Veut évaluer un candidat sur compétences réelles', styles['TableCell']),
         Paragraph('Voir l\'historique d\'agents-mémoire = portfolio de compétences vérifiées', styles['TableCell'])],
    ]
    persona_table = Table(persona_data, colWidths=[45*mm, 60*mm, 65*mm])
    persona_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BODY_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#fafafa')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    flow.append(persona_table)

    return flow


def build_section_4(styles):
    """4. Architecture du système."""
    flow = []
    flow.append(Paragraph('4. Architecture du système', styles['TOC1']))
    flow.append(Paragraph('4. Architecture du système', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'L\'architecture de Mnemo s\'organise en couches successives, depuis l\'interface '
        'utilisateur jusqu\'à la couche narrative de gamification. Chaque couche a une '
        'responsabilité claire et peut évoluer indépendamment. Le diagramme ci-dessous présente '
        'la vue d\'ensemble du système, suivie d\'une description détaillée de chaque module.',
        styles['Body']
    ))

    # Architecture diagram (text-based since we use ReportLab)
    flow.append(Spacer(1, 4*mm))
    arch_text = """┌─────────────────────────────────────────────────────────────────┐
│                         INTERFACE UTILISATEUR                    │
│   (Web app — soumission de cours, mode mission, dialogue agent)  │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                               │
   ┌────────────▼────────────┐     ┌────────────▼─────────────┐
   │   MODULE 1 :             │     │   MODULE 2 :              │
   │   GÉNÉRATEUR DE MISSIONS │     │   AGENT-MÉMOIRE           │
   └────────────┬────────────┘     └────────────┬─────────────┘
                │                               │
   ┌────────────▼────────────────────────────────▼─────────────┐
   │                MOTEUR DE CONTEXTE & SCOPING               │
   │  (Extraction du périmètre exact du contenu soumis,        │
   │   évite tout dépassement de chapitre)                     │
   └────────────┬────────────────────────────────┬─────────────┘
                │                               │
   ┌────────────▼────────────┐     ┌────────────▼─────────────┐
   │  Sandbox d'exécution     │     │  Base de profils-agents   │
   │  de code (Python/SQL)    │     │  (vecteurs de compétence  │
   │  + correction automatique│     │   + historique dialogue)  │
   └──────────────────────────┘     └────────────────────────────┘"""
    flow.append(Paragraph(arch_text.replace('\n', '<br/>'), styles['Code']))
    flow.append(Paragraph('Figure 1 — Vue d\'ensemble de l\'architecture Mnemo', styles['Caption']))

    # Module 1
    flow.append(Paragraph('4.1 Module 1 — Générateur de Missions', styles['H2']))
    flow.append(Paragraph(
        'Le générateur de missions prend en entrée un lien de cours OU un résumé texte rédigé '
        'par l\'utilisateur, et produit en sortie une mission scénarisée composée d\'un énoncé '
        'narratif, d\'un exercice de code à compléter, et de critères de validation automatiques. '
        'Le pipeline se déroule en cinq étapes successives qui garantissent la qualité et la '
        'spécificité de la mission générée.',
        styles['Body']
    ))

    pipeline_data = [
        [Paragraph('<b>Étape</b>', styles['TableHeader']),
         Paragraph('<b>Action</b>', styles['TableHeader']),
         Paragraph('<b>Détail</b>', styles['TableHeader'])],
        [Paragraph('1. Ingestion', styles['TableCell']),
         Paragraph('Lien → scraping, ou texte libre → utilisation directe', styles['TableCell']),
         Paragraph('Si lien fourni (DataCamp, doc, blog), extraction du contenu via page_reader. Sinon, utilisation directe du texte soumis.', styles['TableCell'])],
        [Paragraph('2. Scoping', styles['TableCell']),
         Paragraph('Extraction des concepts clés UNIQUEMENT présents dans le contenu', styles['TableCell']),
         Paragraph('Si le contenu ne parle que de variables et boucles for, la mission ne doit JAMAIS utiliser de fonctions ou de classes.', styles['TableCell'])],
        [Paragraph('3. Génération narrative', styles['TableCell']),
         Paragraph('Prompt structuré → scénario GTA', styles['TableCell']),
         Paragraph('Ex : "Tu es un agent infiltré qui doit décoder un signal en utilisant uniquement des boucles for et des listes".', styles['TableCell'])],
        [Paragraph('4. Génération exercice', styles['TableCell']),
         Paragraph('Code à compléter + tests de validation', styles['TableCell']),
         Paragraph('Code de départ minimal (structure), pas de solution complète. Tests automatiques pour valider la soumission.', styles['TableCell'])],
        [Paragraph('5. Correction', styles['TableCell']),
         Paragraph('Exécution en sandbox + feedback contextualisé', styles['TableCell']),
         Paragraph('Pas juste pass/fail : feedback précis sur ce qui manque, ce qui est bien fait, conseil pour aller plus loin.', styles['TableCell'])],
    ]
    pipe_table = Table(pipeline_data, colWidths=[28*mm, 55*mm, 87*mm])
    pipe_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BODY_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#fafafa')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    flow.append(pipe_table)

    flow.append(Spacer(1, 4*mm))
    flow.append(Paragraph(
        '<b>Point critique technique :</b> le scoping strict est la pièce la plus délicate. '
        'Il faut un prompt qui force le modèle à lister explicitement "concepts autorisés" '
        'versus "concepts interdits" avant de générer la mission, sinon il y a fuite. Le modèle '
        'a tendance à enrichir naturellement le périmètre (par exemple, si on lui demande une '
        'mission sur les variables, il va spontanément ajouter des conditions if/else qui '
        'n\'étaient pas dans le cours). Une validation automatique post-génération peut détecter '
        'ces fuites et relancer la génération si nécessaire.',
        styles['Body']
    ))

    # Module 2
    flow.append(Paragraph('4.2 Module 2 — Agent-Mémoire', styles['H2']))
    flow.append(Paragraph(
        'L\'agent-mémoire se déclenche à la fin d\'un cursus complet — pas juste un chapitre. '
        'Un agent = un cursus entier (ex: "Introduction à Python", "SQL avancé", "Ingénieur IA"). '
        'L\'agent contient le résumé structuré de toutes les missions réussies dans ce cursus, '
        'le niveau de maîtrise par concept (basé sur le taux de réussite, le nombre de tentatives, '
        'la vitesse de résolution), un system prompt généré qui capture "comment vous raisonnez" '
        'à ce niveau (style de réponse, erreurs typiques que vous faisiez, façon de nommer les '
        'variables, etc.), et un horodatage — c\'est un snapshot, pas un agent qui continue '
        'd\'apprendre seul.',
        styles['Body']
    ))

    flow.append(Paragraph(
        'L\'interaction se fait par dialogue libre : vous posez une question à l\'agent, il '
        'répond avec les connaissances et le style que vous aviez à ce moment précis, pas avec '
        'les connaissances actuelles du modèle sous-jacent. Cela permet de vérifier "est-ce que '
        'j\'ai vraiment intégré ça, ou est-ce que j\'ai juste copié un exercice". L\'agent est '
        'votre miroir pédagogique — il vous renvoie votre propre niveau, ce qui est à la fois '
        'réconfortant (il ne vous juge pas) et exigeant (il sait exactement où vous en êtes).',
        styles['Body']
    ))

    # Module 3 (V2)
    flow.append(Paragraph('4.3 Couche narrative / multi-agents (V2+)', styles['H2']))
    flow.append(Paragraph(
        'Cette couche n\'est pas dans le MVP mais constitue l\'extension naturelle du concept. '
        'Les agents-mémoire de cursus différents peuvent interagir entre eux dans un scénario : '
        'par exemple, l\'agent "Python débutant" simule un entretien avec l\'agent "recruteur '
        'IA". L\'usage est l\'auto-évaluation par simulation, et la transition entre cursus '
        'rendue visible et ludique. Techniquement, cela correspond à un système multi-agent '
        'où chaque agent a un system prompt distinct + sa propre mémoire de cursus, orchestré '
        'par un agent "modérateur" qui gère le tour de parole. La vue "Monde des Agents" déjà '
        'implémentée dans le MVP visualise ces communications potentielles sous forme de réseau.',
        styles['Body']
    ))

    return flow


def build_section_5(styles):
    """5. Modèles de données."""
    flow = []
    flow.append(Paragraph('5. Modèles de données', styles['TOC1']))
    flow.append(Paragraph('5. Modèles de données', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Le schéma de données de Mnemo est volontairement simple, organisé autour de cinq '
        'entités principales qui reflètent fidèlement les concepts pédagogiques. La base '
        'actuelle utilise SQLite via Prisma ORM, mais le schéma est portable vers PostgreSQL '
        'sans modification structurelle si le projet évolue vers un usage multi-utilisateur. '
        'Voici la définition des entités telles qu\'implémentées dans le MVP.',
        styles['Body']
    ))

    flow.append(Paragraph('Curriculum', styles['H3']))
    flow.append(Paragraph(
        'L\'unité de plus haut niveau. Un cursus regroupe plusieurs missions et peut donner '
        'naissance à un agent-mémoire quand il est poussé jusqu\'au niveau 3. Les champs '
        'principaux sont : <font face="LibMono">id</font>, <font face="LibMono">name</font> '
        '(ex: "Python"), <font face="LibMono">domain</font> (enum : python, sql, ai-engineering, '
        'data-science, web-dev), <font face="LibMono">description</font>, <font face="LibMono">icon</font>, '
        '<font face="LibMono">color</font>, <font face="LibMono">xp</font> (cumul XP), '
        '<font face="LibMono">level</font> (calculé depuis XP, 1 niveau = 500 XP), et une '
        'relation vers ses missions et son agent éventuel.',
        styles['Body']
    ))

    flow.append(Paragraph('Mission', styles['H3']))
    flow.append(Paragraph(
        'Un exercice généré et scénarisé. Chaque mission est rattachée à un cursus et contient : '
        '<font face="LibMono">title</font> (court, percutant), <font face="LibMono">briefing</font> '
        '(récit narratif style GTA, 2-4 phrases), <font face="LibMono">objectives</font> (JSON '
        'array des objectifs à valider), <font face="LibMono">starterCode</font> (code de départ '
        'minimal), <font face="LibMono">hint</font> (indice optionnel), <font face="LibMono">'
        'difficulty</font> (rookie | pro | elite, détermine l\'XP : 100/200/300), '
        '<font face="LibMono">language</font> (Python, SQL, JavaScript), <font face="LibMono">'
        'sourceContent</font> (le cours original qui a généré la mission), et '
        '<font face="LibMono">status</font> (active | completed).',
        styles['Body']
    ))

    flow.append(Paragraph('MissionSubmission', styles['H3']))
    flow.append(Paragraph(
        'Une tentative de l\'utilisateur pour résoudre une mission. Chaque soumission est '
        'évaluée par l\'IA et stockée pour historique. Contient : <font face="LibMono">code</font> '
        '(le code soumis), <font face="LibMono">feedback</font> (feedback textuel de l\'évaluateur '
        'IA), <font face="LibMono">passed</font> (booléen), <font face="LibMono">createdAt</font>. '
        'Une mission est marquée "completed" dès qu\'une soumission passe avec succès.',
        styles['Body']
    ))

    flow.append(Paragraph('Agent', styles['H3']))
    flow.append(Paragraph(
        'Le snapshot de compétence interrogeable. Un agent naît automatiquement quand un cursus '
        'atteint le niveau 3. Contient : <font face="LibMono">name</font> (nom de code stylé, '
        'ex: "PY-7", "SQL-Oracle"), <font face="LibMono">persona</font> (system prompt qui '
        'capture le style et le niveau), <font face="LibMono">skills</font> (JSON array des '
        'compétences maîtrisées), <font face="LibMono">totalXp</font>, <font face="LibMono">'
        'level</font>, <font face="LibMono">status</font> (idle | working | interviewing | '
        'relaxing), <font face="LibMono">activity</font> (description humaine de l\'activité '
        'actuelle). L\'agent a une relation 1:1 avec son cursus.',
        styles['Body']
    ))

    flow.append(Paragraph('AgentConversation', styles['H3']))
    flow.append(Paragraph(
        'L\'historique des messages échangés avec un agent. Contient : <font face="LibMono">'
        'agentId</font>, <font face="LibMono">role</font> (user | agent), '
        '<font face="LibMono">content</font>, <font face="LibMono">createdAt</font>. Cet '
        'historique est utilisé pour alimenter le contexte du LLM à chaque nouveau message, '
        'ce qui permet à l\'agent de "se souvenir" de la conversation en cours et de maintenir '
        'une cohérence narrative avec l\'utilisateur.',
        styles['Body']
    ))

    return flow


def build_section_6(styles):
    """6. Choix techniques."""
    flow = []
    flow.append(Paragraph('6. Choix techniques', styles['TOC1']))
    flow.append(Paragraph('6. Choix techniques recommandés', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Le MVP actuel de Mnemo est implémenté en Next.js 16 + TypeScript + Tailwind CSS + '
        'Prisma (SQLite) + z-ai-web-dev-sdk. Ce choix a été fait pour pouvoir itérer rapidement '
        'sur l\'interface et profiter de l\'écosystème React. Si le projet évolue vers un '
        'produit SaaS, une migration progressive vers une architecture Python (FastAPI) est '
        'recommandée pour cohérence avec l\'apprentissage Python de l\'utilisateur et pour '
        'profiter de l\'écosystème data science mature. Voici les choix techniques recommandés '
        'par composant pour la version produit.',
        styles['Body']
    ))

    tech_data = [
        [Paragraph('<b>Composant</b>', styles['TableHeader']),
         Paragraph('<b>Choix recommandé</b>', styles['TableHeader']),
         Paragraph('<b>Justification</b>', styles['TableHeader'])],
        [Paragraph('Backend', styles['TableCell']),
         Paragraph('Python (FastAPI)', styles['TableCell']),
         Paragraph('Cohérent avec l\'apprentissage actuel, écosystème mature', styles['TableCell'])],
        [Paragraph('Base de données', styles['TableCell']),
         Paragraph('PostgreSQL', styles['TableCell']),
         Paragraph('Relationnel adapté aux modèles, bon support JSON pour les champs flexibles', styles['TableCell'])],
        [Paragraph('Sandbox d\'exécution', styles['TableCell']),
         Paragraph('Docker isolé / Judge0 (self-hosted)', styles['TableCell']),
         Paragraph('Exécution sécurisée du code utilisateur, supporte Python et SQL', styles['TableCell'])],
        [Paragraph('Génération IA', styles['TableCell']),
         Paragraph('z-ai-web-dev-sdk (MVP) / Claude (V2)', styles['TableCell']),
         Paragraph('Déjà intégré, bon raisonnement structuré pour le scoping strict', styles['TableCell'])],
        [Paragraph('Frontend', styles['TableCell']),
         Paragraph('Next.js 16 (MVP) / React (V2)', styles['TableCell']),
         Paragraph('Standard, bon support pour interface interactive type "mission"', styles['TableCell'])],
        [Paragraph('Vectorisation compétences', styles['TableCell']),
         Paragraph('Embeddings simples + scoring manuel au début', styles['TableCell']),
         Paragraph('Pas besoin de ML complexe au MVP, un simple scoring par concept suffit', styles['TableCell'])],
    ]
    tech_table = Table(tech_data, colWidths=[40*mm, 55*mm, 75*mm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BODY_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#fafafa')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    flow.append(tech_table)

    return flow


def build_section_7(styles):
    """7. Roadmap."""
    flow = []
    flow.append(Paragraph('7. Roadmap par phases', styles['TOC1']))
    flow.append(Paragraph('7. Roadmap par phases', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'La roadmap de Mnemo est conçue pour valider le concept progressivement, sans investir '
        'd\'infrastructure lourde avant d\'avoir confirmé que la boucle pédagogique fonctionne. '
        'Chaque phase produit une version utilisable, et la décision de passer à la suivante '
        'se prend sur la base de l\'usage réel, pas sur un calendrier arbitraire.',
        styles['Body']
    ))

    phases = [
        ('Phase 0', 'Validation du concept (manuel, 1-2 semaines)',
         'Test "à la main" avec l\'IA en conversation : on soumet un résumé de cours, on demande une mission scénarisée, on évalue si le scoping reste propre. Objectif : valider que le scoping strict fonctionne avant de coder quoi que ce soit.'),
        ('Phase 1', 'MVP Générateur de Missions (3-4 semaines)',
         'Interface web simple, soumission de texte de cours (pas encore de scraping de lien), génération de mission + éditeur de code Python uniquement. Pas encore d\'agent-mémoire. C\'est la version actuellement déployée.'),
        ('Phase 2', 'Agent-Mémoire (2-3 semaines)',
         'À la fin d\'un cursus (niveau 3 atteint), génération automatique du system prompt de l\'agent. Interface de dialogue avec l\'agent-mémoire. Stockage persistant. Cette phase est également déjà implémentée dans le MVP actuel.'),
        ('Phase 3', 'Extension multi-domaines (2-3 semaines)',
         'Support SQL (sandbox SQL + types de missions adaptés), support data science (missions avec datasets, notebooks), scraping de liens de cours (pas seulement texte collé). L\'intégration DataCamp via page_reader est déjà fonctionnelle.'),
        ('Phase 4', 'Couche narrative / multi-agents (optionnel)',
         'Scénarios d\'interaction entre agents-mémoire. Habillage visuel "monde virtuel" (déjà implémenté en version statique, à étendre avec interactions réelles entre agents).'),
        ('Phase 5', 'Validation produit (si pivot SaaS)',
         'Tester avec 5-10 apprenants externes (amis, communauté dev). Mesurer : rétention de connaissance réelle (test avant/après), engagement, complétion des cursus. Identifier le persona qui paie le plus naturellement.'),
        ('Phase 6', 'SaaS (si validation positive)',
         'Multi-tenant, gestion de comptes, facturation. Dashboard formateur si pivot B2B2C vers les bootcamps. Optimisation des coûts d\'API (cache de missions similaires, modèles plus légers pour le scoping).'),
    ]

    for label, title, desc in phases:
        flow.append(Spacer(1, 2*mm))
        phase_data = [
            [Paragraph(f'<b>{label}</b>', styles['TableHeader']),
             Paragraph(f'<b>{title}</b>', styles['TableCell'])],
            ['', Paragraph(desc, styles['TableCell'])],
        ]
        phase_table = Table(phase_data, colWidths=[28*mm, 142*mm])
        phase_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), C_ACCENT),
            ('BACKGROUND', (1, 0), (1, 0), HexColor('#f0fdf4')),
            ('BACKGROUND', (1, 1), (1, 1), HexColor('#fafafa')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
            ('LINEABOVE', (0, 1), (-1, 1), 0.3, C_BODY_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        flow.append(phase_table)

    return flow


def build_section_8(styles):
    """8. Risques."""
    flow = []
    flow.append(Paragraph('8. Risques et points d\'attention', styles['TOC1']))
    flow.append(Paragraph('8. Risques et points d\'attention', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Tout projet d\'apprentissage basé sur l\'IA comporte des risques spécifiques liés à '
        'la qualité de la génération, au coût des appels API, à la fidélité des agents-mémoire, '
        'et au risque de scope-creep si le projet est mené en parallèle d\'autres initiatives. '
        'Voici les quatre risques principaux identifiés et leurs stratégies de mitigation.',
        styles['Body']
    ))

    risk_data = [
        [Paragraph('<b>Risque</b>', styles['TableHeader']),
         Paragraph('<b>Impact</b>', styles['TableHeader']),
         Paragraph('<b>Mitigation</b>', styles['TableHeader'])],
        [Paragraph('Fuite de scoping (mission dépasse le chapitre)', styles['TableCell']),
         Paragraph('Frustration, perte de confiance dans l\'outil', styles['TableCell']),
         Paragraph('Prompt strict avec liste explicite concepts autorisés/interdits, validation automatique post-génération', styles['TableCell'])],
        [Paragraph('Coût API élevé (génération + correction + dialogue)', styles['TableCell']),
         Paragraph('Modèle économique fragile en SaaS', styles['TableCell']),
         Paragraph('Cache de missions pour contenus similaires, modèles moins chers pour le scoping, modèle premium pour la génération créative uniquement', styles['TableCell'])],
        [Paragraph('Agent-mémoire devient "obsolète" si pas assez fidèle', styles['TableCell']),
         Paragraph('L\'intérêt principal du produit s\'effondre', styles['TableCell']),
         Paragraph('Bien calibrer le system prompt généré, tester qu\'il répond vraiment "à ton niveau" et pas avec les connaissances actuelles du modèle', styles['TableCell'])],
        [Paragraph('Scope-creep (projet mené en parallèle d\'autres)', styles['TableCell']),
         Paragraph('Aucun projet n\'avance', styles['TableCell']),
         Paragraph('Garder Mnemo en mode "perso/phase 0-1" tant que les autres projets n\'ont pas atteint leur MVP', styles['TableCell'])],
    ]
    risk_table = Table(risk_data, colWidths=[50*mm, 45*mm, 75*mm])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_ACCENT_AMBER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BODY_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_BODY_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#fffbeb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    flow.append(risk_table)

    return flow


def build_section_9(styles):
    """9. Prochaine étape."""
    flow = []
    flow.append(Paragraph('9. Prochaine étape concrète', styles['TOC1']))
    flow.append(Paragraph('9. Prochaine étape concrète recommandée', styles['H1']))
    flow.append(HRule(C_ACCENT))

    flow.append(Paragraph(
        'Le MVP étant désormais fonctionnel (génération de missions, éditeur de code, '
        'agents-mémoire, vue Monde, intégration DataCamp), la prochaine étape recommandée est '
        'l\'utilisation réelle en conditions d\'apprentissage. Trois axes prioritaires peuvent '
        'être explorés en parallèle pour faire passer Mnemo de "prototype fonctionnel" à '
        '"outil d\'apprentissage quotidien".',
        styles['Body']
    ))

    flow.append(Paragraph('Axe 1 — Tester le scoping en conditions réelles', styles['H3']))
    flow.append(Paragraph(
        'Prendre les 5 prochains chapitres que vous allez étudier (que ce soit sur DataCamp, '
        'dans un livre, ou en vidéo) et les soumettre à Mnemo. Pour chacun, vérifier : la '
        'mission générée couvre-t-elle exactement le chapitre ? Y a-t-il des fuites (concepts '
        'non vus qui apparaissent) ? Le niveau de difficulté est-il adapté ? Ces 5 tests '
        'permettront de calibrer le prompt du générateur et d\'identifier les cas limites. '
        'Gardez une trace écrite des problèmes rencontrés pour itérer sur le prompt.',
        styles['Body']
    ))

    flow.append(Paragraph('Axe 2 — Évaluer la fidélité des agents-mémoire', styles['H3']))
    flow.append(Paragraph(
        'Une fois un premier cursus poussé au niveau 3 et l\'agent né, mener une session de '
        'questions type : demander à l\'agent des rappels sur les notions apprises, lui '
        'soumettre un défi, lui demander un conseil. Évaluer : les réponses sont-elles '
        'cohérentes avec votre niveau réel ? L\'agent donne-t-il l\'impression de parler '
        'comme vous ? Identifie-t-il correctement vos acquis et vos lacunes ? Cette évaluation '
        'qualitative est cruciale : si l\'agent ne "sonne" pas juste, la valeur perçue du '
        'produit s\'effondre.',
        styles['Body']
    ))

    flow.append(Paragraph('Axe 3 — Étendre la couverture des langages', styles['H3']))
    flow.append(Paragraph(
        'Le MVP supporte Python, SQL et JavaScript. Pour vraiment couvrir les 5 cursus, il '
        'manque : des missions de data science avec datasets réels (pas juste du code Python '
        'générique), des missions d\'IA qui incluent l\'entraînement de modèles simples, et '
        'des missions de dev web qui incluent du HTML/CSS en plus du JavaScript. L\'extension '
        'peut se faire progressivement, un langage à la fois, en commençant par celui qui '
        'vous sert le plus immédiatement.',
        styles['Body']
    ))

    flow.append(Spacer(1, 6*mm))
    flow.append(HRule(C_ACCENT))
    flow.append(Spacer(1, 4*mm))
    flow.append(Paragraph(
        '<i>Mnemo est un projet personnel d\'apprentissage. Le code source est disponible, '
        'itérable, et conçu pour évoluer avec son créateur. La présente architecture est une '
        'base de discussion, pas un contrat — chaque décision technique doit être remise en '
        'question face à l\'usage réel.</i>',
        styles['Quote']
    ))

    return flow


# ============================================================
# BUILD PDF
# ============================================================
def build_pdf():
    output_path = '/home/z/my-project/download/Mnemo-Architecture-v1.0.pdf'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = MnemoDocTemplate(
        output_path,
        pagesize=A4,
        title='Mnemo — Architecture v1.0',
        author='Mnemo',
        subject='Plateforme de révision par missions narratives et agents-mémoire',
        creator='Mnemo',
    )

    styles = make_styles()

    story = []
    # Cover (uses Cover template)
    story.extend(build_cover(styles))

    # Switch to Body template
    from reportlab.platypus.doctemplate import NextPageTemplate
    # The first PageBreak in build_cover ends the cover page; we need to switch template
    # Actually we need to insert NextPageTemplate BEFORE the cover's PageBreak
    # But since cover is already built, we add NextPageTemplate at start of next section
    story.append(NextPageTemplate('Body'))

    # TOC
    story.extend(build_toc(styles))

    # Sections
    story.extend(build_section_1(styles))
    story.extend(build_section_2(styles))
    story.extend(build_section_3(styles))
    story.extend(build_section_4(styles))
    story.extend(build_section_5(styles))
    story.extend(build_section_6(styles))
    story.extend(build_section_7(styles))
    story.extend(build_section_8(styles))
    story.extend(build_section_9(styles))

    # Build
    doc.multiBuild(story)
    return output_path


if __name__ == '__main__':
    path = build_pdf()
    size = os.path.getsize(path)
    print(f'PDF generated: {path}')
    print(f'Size: {size / 1024:.1f} KB')
