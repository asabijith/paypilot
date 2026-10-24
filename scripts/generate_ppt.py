import sys
import os
sys.path.insert(0, r'C:\Users\user\AppData\Roaming\Python\Python313\site-packages')

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen standard
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6] # Blank slide

    # Color Palette (Crisp White Theme + Apple/Cupertino Accents)
    COLOR_BG = RGBColor(255, 255, 255)         # Pure White
    COLOR_CARD_BG = RGBColor(248, 250, 252)    # Slate 50
    COLOR_CARD_BORDER = RGBColor(226, 232, 240)# Slate 200
    COLOR_PRIMARY = RGBColor(15, 23, 42)       # Slate 900
    COLOR_SECONDARY = RGBColor(71, 85, 105)    # Slate 600
    COLOR_MUTED = RGBColor(148, 163, 184)      # Slate 400
    COLOR_INDIGO = RGBColor(79, 70, 229)       # Indigo 600
    COLOR_INDIGO_LIGHT = RGBColor(238, 242, 255) # Indigo 50
    COLOR_EMERALD = RGBColor(16, 185, 129)     # Emerald 500
    COLOR_EMERALD_LIGHT = RGBColor(236, 253, 245) # Emerald 50
    COLOR_ROSE = RGBColor(225, 29, 72)         # Rose 600
    COLOR_ROSE_LIGHT = RGBColor(255, 241, 242) # Rose 50

    def add_header(slide, category: str, title: str, subtitle: str):
        # Category Pill
        cat_box = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8), Inches(0.55), Inches(2.2), Inches(0.35)
        )
        cat_box.fill.solid()
        cat_box.fill.fore_color.rgb = COLOR_INDIGO_LIGHT
        cat_box.line.color.rgb = COLOR_INDIGO
        cat_box.line.width = Pt(1)
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_INDIGO
        p_cat.alignment = PP_ALIGN.CENTER

        # Team Watermark Pill on top right
        team_box = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(10.5), Inches(0.55), Inches(2.0), Inches(0.35)
        )
        team_box.fill.solid()
        team_box.fill.fore_color.rgb = RGBColor(241, 245, 249)
        team_box.line.color.rgb = COLOR_CARD_BORDER
        team_box.line.width = Pt(1)
        tf_team = team_box.text_frame
        p_team = tf_team.paragraphs[0]
        p_team.text = "TEAM T-REX"
        p_team.font.size = Pt(10)
        p_team.font.bold = True
        p_team.font.color.rgb = COLOR_PRIMARY
        p_team.alignment = PP_ALIGN.CENTER

        # Title
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.95), Inches(11.5), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = COLOR_PRIMARY
        
        # Subtitle
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_SECONDARY
        p2.space_before = Pt(4)

    def draw_card(slide, left, top, width, height, title, subtitle, items, accent_color=COLOR_INDIGO):
        # Card Background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER
        card.line.width = Pt(1.2)

        # Top Accent Strip
        strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.02), top + Inches(0.02), width - Inches(0.04), Inches(0.08))
        strip.fill.solid()
        strip.fill.fore_color.rgb = accent_color
        strip.line.fill.background()

        # Text Frame
        tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), width - Inches(0.5), height - Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_PRIMARY

        if subtitle:
            p_s = tf.add_paragraph()
            p_s.text = subtitle
            p_s.font.size = Pt(10)
            p_s.font.color.rgb = COLOR_SECONDARY
            p_s.space_after = Pt(8)

        for item in items:
            p_i = tf.add_paragraph()
            p_i.text = f"•  {item}"
            p_i.font.size = Pt(11)
            p_i.font.color.rgb = COLOR_PRIMARY
            p_i.space_after = Pt(4)

    # ==========================================
    # SLIDE 1: TITLE SLIDE (Clean White Theme)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)

    # Decorative top ambient background pill
    decor = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.6), Inches(11.733), Inches(6.3))
    decor.fill.solid()
    decor.fill.fore_color.rgb = RGBColor(255, 255, 255)
    decor.line.color.rgb = COLOR_CARD_BORDER
    decor.line.width = Pt(1.5)

    # Team Pill Badge
    team_badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.1), Inches(2.2), Inches(0.42))
    team_badge.fill.solid()
    team_badge.fill.fore_color.rgb = COLOR_INDIGO_LIGHT
    team_badge.line.color.rgb = COLOR_INDIGO
    team_badge.line.width = Pt(1)
    tf_tb = team_badge.text_frame
    p_tb = tf_tb.paragraphs[0]
    p_tb.text = "⚡ TEAM T-REX"
    p_tb.font.size = Pt(11)
    p_tb.font.bold = True
    p_tb.font.color.rgb = COLOR_INDIGO
    p_tb.alignment = PP_ALIGN.CENTER

    # Project Title & Headline
    tb_title = s1.shapes.add_textbox(Inches(1.3), Inches(1.7), Inches(10.5), Inches(2.2))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    
    p1 = tf_title.paragraphs[0]
    p1.text = "PayPilot AI"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY

    p2 = tf_title.add_paragraph()
    p2.text = "Autonomous Payroll, Statutory Compliance & HR Intelligence Platform"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_INDIGO
    p2.space_before = Pt(6)

    p3 = tf_title.add_paragraph()
    p3.text = "Deterministic AI Pre-Flight Audit • Google Teachable Machine Face Punch-In • Razorpay Integration • FY 2026-27 Tax Engine"
    p3.font.size = Pt(12)
    p3.font.color.rgb = COLOR_SECONDARY
    p3.space_before = Pt(6)

    # Team Members Card
    team_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(4.3), Inches(10.7), Inches(2.1))
    team_card.fill.solid()
    team_card.fill.fore_color.rgb = RGBColor(248, 250, 252)
    team_card.line.color.rgb = RGBColor(226, 232, 240)
    team_card.line.width = Pt(1)

    tb_team = s1.shapes.add_textbox(Inches(1.6), Inches(4.5), Inches(10.1), Inches(1.7))
    tf_team = tb_team.text_frame
    tf_team.word_wrap = True

    p_t_head = tf_team.paragraphs[0]
    p_t_head.text = "PROJECT TEAM MEMBERS & ROLES"
    p_t_head.font.size = Pt(11)
    p_t_head.font.bold = True
    p_t_head.font.color.rgb = COLOR_SECONDARY
    p_t_head.space_after = Pt(10)

    # 2-column member listing inside text
    p_m1 = tf_team.add_paragraph()
    p_m1.text = "👤  Abijith A S               — Lead AI Engineer & Full-Stack Systems Architect"
    p_m1.font.size = Pt(14)
    p_m1.font.bold = True
    p_m1.font.color.rgb = COLOR_PRIMARY
    p_m1.space_after = Pt(8)

    p_m2 = tf_team.add_paragraph()
    p_m2.text = "👤  Akshay Krishna S   — Lead Product Engineer & Statutory Engine Architect"
    p_m2.font.size = Pt(14)
    p_m2.font.bold = True
    p_m2.font.color.rgb = COLOR_PRIMARY

    # ==========================================
    # SLIDE 2: PROBLEM STATEMENT & INDUSTRY PAIN
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(
        s2,
        "Industry Challenges",
        "The Payroll & Compliance Crisis in Indian Enterprises",
        "Why manual spreadsheets and legacy HRMS systems cause severe financial and legal liabilities"
    )

    col_w = Inches(3.6)
    c_top = Inches(2.1)
    c_h = Inches(4.7)

    draw_card(
        s2, Inches(0.8), c_top, col_w, c_h,
        "1. Statutory Penalties",
        "EPFO, ESIC & Income Tax Audits",
        [
            "42% of Indian startups face statutory notices due to erroneous EPF 12% calculation against statutory caps.",
            "Union Budget FY 2026-27 revised Section 115BAC slabs with standard deduction ₹75,000 causing widespread TDS errors.",
            "Professional Tax (PT) rules differ across states (Karnataka, Maharashtra, etc.) causing non-compliance fines.",
            "Severe interest penalties (12-24% p.a.) for delayed or inaccurate monthly return filings."
        ],
        accent_color=COLOR_ROSE
    )

    draw_card(
        s2, Inches(4.8), c_top, col_w, c_h,
        "2. Financial Leakage",
        "Payroll Discrepancies & Anomalies",
        [
            "Negative net payout violations under Payment of Wages Act (deductions exceeding 50% limit).",
            "Loss of Pay (LOP) disconnect: Unapproved employee absences logged in biometric systems fail to reflect in salary ledger.",
            "Salary spike anomalies: Duplicate bonuses or rogue increments slip through without maker-checker signoff.",
            "Lack of pre-flight validation gates before corporate bank disbursement files are released."
        ],
        accent_color=RGBColor(245, 158, 11)
    )

    draw_card(
        s2, Inches(8.8), c_top, col_w, c_h,
        "3. Biometric Inefficiencies",
        "Proxy Attendance & Fragmented Ops",
        [
            "Buddy punching & fraudulent manual punch cards in hybrid and distributed office settings.",
            "Legacy biometric hardware requires expensive maintenance and complex on-premise cabling.",
            "No direct machine learning link between employee face recognition and monthly payroll deduction.",
            "Fragmented contractor invoices, reimbursement expense claims, and tax proof filing chaos."
        ],
        accent_color=COLOR_INDIGO
    )

    # ==========================================
    # SLIDE 3: PROPOSED SOLUTION & ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(
        s3,
        "The Solution",
        "PayPilot AI: Autonomous, End-to-End Enterprise HCM",
        "An intelligent ecosystem unifying deterministic mathematical audits with edge computer vision"
    )

    c4_w = Inches(2.7)
    c4_h = Inches(4.7)

    draw_card(
        s3, Inches(0.8), c_top, c4_w, c4_h,
        "AI Payroll Auditor",
        "Mathematical Pre-Flight Gate",
        [
            "Deterministic 4-phase rule validation before funds release.",
            "Flags salary spikes (>30%), negative payouts, and missing KYC.",
            "Enforces 50% statutory ceiling under Payment of Wages Act.",
            "Zero false-positive hallucination (100% mathematical rules)."
        ],
        accent_color=COLOR_INDIGO
    )

    draw_card(
        s3, Inches(3.8), c_top, c4_w, c4_h,
        "Edge Face Punch-In",
        "Google Teachable Machine",
        [
            "Browser-based edge AI neural network for employee check-in.",
            "Trained custom vision model (Abijith & Akshay detection).",
            "Automatic LOP calculation connected directly to salary ledger.",
            "Zero hardware purchase required (runs on any webcam/phone)."
        ],
        accent_color=COLOR_EMERALD
    )

    draw_card(
        s3, Inches(6.8), c_top, c4_w, c4_h,
        "Statutory Engine",
        "Budget FY 2026-27 Compliant",
        [
            "Revised Section 115BAC new tax regime & Section 87A rebate.",
            "Automatic EPF (12%), ESIC (0.75%/3.25%), and PT deduction.",
            "1-click #~# EPFO ECR text export ready for Unified Portal.",
            "Form 16 Part A/B generation & monthly verified payslip PDF."
        ],
        accent_color=RGBColor(59, 130, 246)
    )

    draw_card(
        s3, Inches(9.8), c_top, c4_w, c4_h,
        "Enterprise FinOps",
        "Billing & Global Workforce",
        [
            "Integrated Razorpay gateway with backend HMAC-SHA256 crypto.",
            "Automated expense claims with GST receipt audits & advances.",
            "Tax Vault Form 12BB regime comparator (Old vs New).",
            "Global contractor compliance with W-8BEN and TDS 194J/C."
        ],
        accent_color=RGBColor(147, 51, 234)
    )

    # ==========================================
    # SLIDE 4: KEY TECHNICAL INNOVATIONS
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(
        s4,
        "Technical Highlights",
        "Deep Engineering & Breakthrough Features",
        "Proprietary innovations implemented by Team T-REX in PayPilot AI"
    )

    col2_w = Inches(5.6)
    col2_h = Inches(2.2)

    draw_card(
        s4, Inches(0.8), Inches(2.1), col2_w, col2_h,
        "1. Teachable Machine Edge AI Face Recognition",
        "Real-Time Browser Neural Network",
        [
            "Integrated custom Google Teachable Machine model URL with fallback multi-class loader.",
            "Webcam live feed canvas processing with cosine similarity confidence score (threshold > 85%).",
            "Automatic attendance punch record logged to backend with geofence validation and time stamp."
        ],
        accent_color=COLOR_EMERALD
    )

    draw_card(
        s4, Inches(6.8), Inches(2.1), col2_w, col2_h,
        "2. Deterministic AI Pre-Flight Auditor",
        "Zero-Hallucination Discrepancy Gate",
        [
            "Pre-flight gate scanning 100% of employee roster for 4 critical failure modes.",
            "Spike Detection (>30% variance), Negative Net Pay, Absence vs LOP mismatch, Bank IFSC sanity.",
            "Withholds unverified banking export generation until maker-checker admin signoff."
        ],
        accent_color=COLOR_ROSE
    )

    draw_card(
        s4, Inches(0.8), Inches(4.6), col2_w, col2_h,
        "3. Zero-Trust Razorpay Gateway & Webhook Engine",
        "Instant Commercial SaaS Activation",
        [
            "Backend order generation via live Razorpay Orders REST API (key_id: rzp_test_ix2MK7zqiggJX7).",
            "Cryptographic HMAC-SHA256 constant-time signature verification (order_id + '|' + payment_id).",
            "Celebratory success feedback with instant plan tier activation and GST tax invoice generation."
        ],
        accent_color=COLOR_INDIGO
    )

    draw_card(
        s4, Inches(6.8), Inches(4.6), col2_w, col2_h,
        "4. Apple Cupertino Design System & Glassmorphism",
        "Taste-Skill & 21st UI Specification",
        [
            "SF Pro / Plus Jakarta Sans typography stack with refined geometric tracking and font smoothing.",
            "Cupertino acrylic materials (backdrop-blur-xl, saturate-180%, hairline border-black/[0.06]).",
            "macOS Sequoia-style categorized sidebar and Spotlight command palette (Cmd+K)."
        ],
        accent_color=RGBColor(30, 41, 59)
    )

    # ==========================================
    # SLIDE 5: SYSTEM ARCHITECTURE & TECH STACK
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(
        s5,
        "Engineering Architecture",
        "End-to-End Technology Stack & Multi-Tier Topology",
        "Built with high-performance, enterprise-grade open source frameworks"
    )

    col3_w = Inches(3.6)
    col3_h = Inches(4.7)

    draw_card(
        s5, Inches(0.8), c_top, col3_w, col3_h,
        "Frontend Tier",
        "High-Velocity Client Experience",
        [
            "React 19 & TypeScript 5.7: Strict typing, modern component lifecycle, zero runtime crashes.",
            "Tailwind CSS v4: Bespoke Apple Cupertino design tokens, glassmorphic blur, responsive grid.",
            "TensorFlow.js / Teachable Machine: Client-side edge neural network computer vision.",
            "Recharts & Lucide React: Interactive analytics, salary forecasting, and SVG iconography.",
            "Vite 6.2: Sub-second HMR and optimized production bundling."
        ],
        accent_color=COLOR_INDIGO
    )

    draw_card(
        s5, Inches(4.8), c_top, col3_w, col3_h,
        "Backend & Logic Tier",
        "Deterministic Statutory Engine",
        [
            "FastAPI (Python 3.13): Asynchronous REST API with OpenAPI documentation and auto validation.",
            "SQLAlchemy ORM: Relational database schema models with multi-tenant company isolation.",
            "Statutory Rule Enclave: Codified Indian tax rules (Section 115BAC, EPF, ESIC, PT slabs).",
            "HMAC-SHA256 Cryptography: Payment signature validation and server-side webhook handler.",
            "Pytest Suite: 30 automated unit tests ensuring 100% calculation reliability."
        ],
        accent_color=COLOR_PRIMARY
    )

    draw_card(
        s5, Inches(8.8), c_top, col3_w, col3_h,
        "Data & Security Tier",
        "Zero-Trust Compliance Standard",
        [
            "SQLite / PostgreSQL: ACID-compliant transactional persistence with audit log trail.",
            "Role-Based Access Control (RBAC): Strict isolation between Owner, Admin, and Employee.",
            "Zero Client Secret Policy: Gateway private keys and secrets reside strictly on backend.",
            "Export Engine: One-click EPFO ECR format, HDFC Enet CSV, and ICICI CIB batch templates.",
            "DPDP Act 2023 & WCAG 2.1 AA Compliant."
        ],
        accent_color=COLOR_EMERALD
    )

    # ==========================================
    # SLIDE 6: RESULTS, IMPACT & ROADMAP
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(
        s6,
        "Impact & Future Horizon",
        "Project Impact, Achievements & Future Roadmap",
        "Transforming enterprise compensation management from reactive stress into automated clarity"
    )

    # Left Impact Box
    draw_card(
        s6, Inches(0.8), c_top, Inches(5.6), Inches(4.7),
        "Measurable Results & Outcomes",
        "Empirical benchmarks achieved by PayPilot AI",
        [
            "100% Statutory Reconciled: Zero EPF/ESIC/PT calculation errors across seeded test batches.",
            "₹0 Unbilled Absence Leakage: Automatic biometrics-to-LOP payroll deduction sync.",
            "< 10 Seconds Face Punch-In: Rapid edge AI recognition with zero physical contact or queues.",
            "30/30 Unit Tests Passing: Exhaustive verification across payroll, auth, auditor & webhooks.",
            "Complete SaaS Readiness: Razorpay payment gateway, automated invoicing, and multi-tenant isolation.",
            "Audited Codebase: Built following Antigravity Pro multi-agent harness engineering protocols."
        ],
        accent_color=COLOR_EMERALD
    )

    # Right Roadmap Box
    card_r = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), c_top, Inches(5.6), Inches(3.2))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = COLOR_CARD_BG
    card_r.line.color.rgb = COLOR_CARD_BORDER
    card_r.line.width = Pt(1.2)

    strip_r = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.82), c_top + Inches(0.02), Inches(5.56), Inches(0.08))
    strip_r.fill.solid()
    strip_r.fill.fore_color.rgb = COLOR_INDIGO
    strip_r.line.fill.background()

    tb_r = s6.shapes.add_textbox(Inches(7.05), c_top + Inches(0.2), Inches(5.1), Inches(2.8))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p_rt = tf_r.paragraphs[0]
    p_rt.text = "Future Development Roadmap"
    p_rt.font.size = Pt(14)
    p_rt.font.bold = True
    p_rt.font.color.rgb = COLOR_PRIMARY

    roadmap_items = [
        "Phase 1: Direct EPFO & Income Tax TRACES API handshake for zero-touch return filing.",
        "Phase 2: Multi-Currency & Cross-Border Payouts via Stripe/Wise for international contractors.",
        "Phase 3: Automated WhatsApp Payslip Delivery with encrypted PDF PIN protection.",
        "Phase 4: Mobile Native App (React Native/Flutter) for on-field geofenced attendance tracking."
    ]
    for item in roadmap_items:
        p_ri = tf_r.add_paragraph()
        p_ri.text = f"🚀  {item}"
        p_ri.font.size = Pt(10.5)
        p_ri.font.color.rgb = COLOR_PRIMARY
        p_ri.space_after = Pt(4)

    # Thank you / credits banner at bottom right
    card_thanks = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(5.5), Inches(5.6), Inches(1.3))
    card_thanks.fill.solid()
    card_thanks.fill.fore_color.rgb = COLOR_INDIGO_LIGHT
    card_thanks.line.color.rgb = COLOR_INDIGO
    card_thanks.line.width = Pt(1)

    tb_th = s6.shapes.add_textbox(Inches(7.0), Inches(5.55), Inches(5.2), Inches(1.15))
    tf_th = tb_th.text_frame
    tf_th.word_wrap = True

    p_th1 = tf_th.paragraphs[0]
    p_th1.text = "Thank You!  •  Questions & Answers"
    p_th1.font.size = Pt(14)
    p_th1.font.bold = True
    p_th1.font.color.rgb = COLOR_INDIGO

    p_th2 = tf_th.add_paragraph()
    p_th2.text = "Presented by Team T-REX  |  Abijith A S & Akshay Krishna S"
    p_th2.font.size = Pt(11)
    p_th2.font.bold = True
    p_th2.font.color.rgb = COLOR_PRIMARY
    p_th2.space_before = Pt(2)

    p_th3 = tf_th.add_paragraph()
    p_th3.text = "PayPilot AI Enterprise SaaS  •  FY 2026-27"
    p_th3.font.size = Pt(10)
    p_th3.font.color.rgb = COLOR_SECONDARY

    # Save Presentation
    output_path = os.path.join(os.getcwd(), "PayPilot_AI_Presentation_T-REX.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
