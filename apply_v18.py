#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
STYLE = ROOT / "style.css"

def fail(msg):
    print(f"ERREUR: {msg}")
    sys.exit(1)

if not INDEX.exists() or not STYLE.exists():
    fail("Placez ce fichier à la racine du dépôt portfolio-kabakaro, à côté de index.html et style.css.")

backup_index = ROOT / "index.v17-backup.html"
backup_style = ROOT / "style.v17-backup.css"
if not backup_index.exists():
    shutil.copy2(INDEX, backup_index)
if not backup_style.exists():
    shutil.copy2(STYLE, backup_style)

html = INDEX.read_text(encoding="utf-8")
css = STYLE.read_text(encoding="utf-8")

# 1) SEO : domaine officiel
html = html.replace("https://portfolio-kabakaro.vercel.app/", "https://www.kabakarodev.fr/")

# 2) Navigation simplifiée
nav_start = html.find('    <nav class="nav">')
nav_end = html.find('    </nav>', nav_start)
if nav_start == -1 or nav_end == -1:
    fail("Navigation principale introuvable.")
nav_end += len('    </nav>')
new_nav = '''    <nav class="nav">
      <a href="#projets">Projets</a>
      <a href="#services">Services</a>
      <a href="#experience">Expériences</a>
      <a href="#profil">À propos</a>
      <a href="CV_Kabakaro_Keita_Developpeur_Full_Stack.pdf" target="_blank" rel="noopener">CV</a>
      <a href="#contact">Contact</a>
      <a class="nav-cta" href="#devis">Demander un devis</a>
    </nav>'''
html = html[:nav_start] + new_nav + html[nav_end:]

# 3) Hero V18
hero_start = html.find('    <section id="accueil" class="hero section">')
profile_start = html.find('    <section id="profil"', hero_start)
if hero_start == -1 or profile_start == -1:
    fail("Section d'accueil introuvable.")

hero_v18 = '''    <section id="accueil" class="hero section hero-v18">
      <div class="hero-content reveal">
        <p class="eyebrow">DÉVELOPPEUR WEB • MOBILE • IA</p>
        <h1>Je transforme des idées<br><span>en produits numériques.</span></h1>
        <p class="hero-text">
          Développeur Full Stack basé à Amiens. Je conçois des applications web et mobiles modernes,
          des outils métier et des expériences numériques orientées résultats.
        </p>

        <div class="audience-actions">
          <a class="btn primary" href="CV_Kabakaro_Keita_Developpeur_Full_Stack.pdf" target="_blank" rel="noopener">👨‍💻 Recruteur — Voir mon CV</a>
          <a class="btn secondary client-cta" href="#devis">🚀 Entreprise — Demander un devis</a>
        </div>

        <div class="hero-actions sub-actions">
          <a class="btn secondary" href="#projets">Voir mes projets</a>
          <a class="btn appointment-btn" href="#rendezvous">Prendre rendez-vous</a>
        </div>

        <div class="hero-proof" aria-label="Repères professionnels">
          <div><strong>8+</strong><span>projets présentés</span></div>
          <div><strong>Web & Mobile</strong><span>produits responsive</span></div>
          <div><strong>React • Django</strong><span>stack Full Stack</span></div>
          <div><strong>IA</strong><span>assistants & automatisation</span></div>
        </div>
      </div>

      <div class="hero-card reveal">
        <div class="profile-visual">
          <div class="profile-photo-placeholder" id="profilePhoto">
            <img src="photo-kabakaro.jpg" alt="Photo professionnelle de Kabakaro Keita">
          </div>
          <div class="profile-badge">
            <strong>Kabakaro Keita</strong>
            <small>Développeur Full Stack Web & Mobile</small>
          </div>
        </div>
        <div class="code-window">
          <div class="dots"><i></i><i></i><i></i></div>
          <pre><code><b>const</b> developer = {
  name: <em>"Kabakaro Keita"</em>,
  role: <em>"Full Stack Developer"</em>,
  focus: [
    <em>"Web"</em>,
    <em>"Mobile"</em>,
    <em>"APIs"</em>,
    <em>"AI automation"</em>
  ],
  stack: [
    <em>"React"</em>,
    <em>"Django"</em>,
    <em>"Node.js"</em>,
    <em>"PostgreSQL"</em>
  ]
};</code></pre>
        </div>
      </div>
    </section>

'''
html = html[:hero_start] + hero_v18 + html[profile_start:]

# 4) Projets V18
projects_start = html.find('    <section id="projets"')
designs_start = html.find('    <section id="designs"', projects_start)
if projects_start == -1 or designs_start == -1:
    fail("Section Projets ou Designs introuvable.")

projects_v18 = '''    <section id="projets" class="section alt projects-v18-section">
      <div class="section-heading reveal">
        <p class="eyebrow">PROJETS SÉLECTIONNÉS</p>
        <h2>Des projets qui montrent ce que je sais construire.</h2>
        <p class="services-intro">Trois réalisations mises en avant pour comprendre rapidement ma façon de concevoir un produit, structurer ses données et créer une expérience utilisateur exploitable.</p>
      </div>

      <div class="featured-projects-v18">
        <article class="project-v18 project-v18-main reveal">
          <div class="project-media">
            <img src="assets/designs/g-transport.webp" alt="Interface du projet G-Transport" loading="lazy">
          </div>
          <div class="project-v18-body">
            <span class="project-kicker">MOBILITÉ • WEB & MOBILE</span>
            <h3>G-Transport</h3>
            <p>Plateforme de gestion du transport urbain et interurbain : voyageurs, compagnies, gares, réservations, billets QR, paiements et administration.</p>
            <div class="mini-tags"><span>Next.js</span><span>PostgreSQL</span><span>QR Code</span><span>Mobile Money</span><span>Dashboard</span></div>
            <a class="text-link" href="#etude-gtransport">Voir l’étude de cas ↓</a>
          </div>
        </article>

        <article class="project-v18 reveal">
          <div class="project-v18-icon">3D</div>
          <div class="project-v18-body">
            <span class="project-kicker">SERVICES • WORKFLOW MÉTIER</span>
            <h3>3D Services</h3>
            <p>Gestion de devis, comptes clients, paiement, notifications, affectation des interventions et suivi après prestation.</p>
            <div class="mini-tags"><span>Web</span><span>Devis</span><span>Paiement</span><span>Notifications</span></div>
          </div>
        </article>

        <article class="project-v18 reveal">
          <div class="project-v18-icon">KK</div>
          <div class="project-v18-body">
            <span class="project-kicker">PORTFOLIO • AUTOMATISATION</span>
            <h3>Kabakaro Dev</h3>
            <p>Portfolio avec devis, prise de rendez-vous, Google Calendar/Meet, assistant, SEO, administration et formulaires métier.</p>
            <div class="mini-tags"><span>GitHub</span><span>Vercel</span><span>SEO</span><span>Calendar</span><span>Meet</span></div>
            <a class="text-link" href="https://github.com/kabakaro12/portfolio-kabakaro" target="_blank" rel="noopener">Voir le dépôt ↗</a>
          </div>
        </article>
      </div>

      <div class="case-study-v18 reveal" id="etude-gtransport">
        <div class="case-study-head">
          <p class="eyebrow">ÉTUDE DE CAS</p>
          <h3>Comment j’ai structuré G-Transport.</h3>
        </div>
        <div class="case-study-grid">
          <article><span>01</span><h4>Problème</h4><p>Centraliser les trajets, réservations, gares, compagnies et paiements dans une seule expérience.</p></article>
          <article><span>02</span><h4>Solution</h4><p>Une plateforme multi-rôles avec parcours voyageur, espaces opérationnels et administration.</p></article>
          <article><span>03</span><h4>Architecture</h4><p>Front web/mobile, API métier, PostgreSQL, QR code et intégrations de paiement prévues.</p></article>
          <article><span>04</span><h4>Résultat</h4><p>Un prototype extensible pouvant évoluer vers plusieurs compagnies et plusieurs villes.</p></article>
        </div>
      </div>

      <div class="other-projects-v18 reveal">
        <div><span>JAVA • POO</span><h3>Jeu d’échecs Full Stack</h3><a href="https://github.com/kabakaro12/ProjetStageDevFullStack" target="_blank" rel="noopener">GitHub ↗</a></div>
        <div><span>STREAMING • PRODUIT</span><h3>FlexMusic</h3><p>Plateforme musicale pensée pour les artistes guinéens.</p></div>
        <div><span>MAINTENANCE WEB</span><h3>Proptech Solutions</h3><p>Maintenance, corrections et améliorations techniques.</p></div>
        <div><span>WEB • GITHUB</span><h3>CINELAND</h3><a href="https://github.com/kabakaro12/CINELAND" target="_blank" rel="noopener">GitHub ↗</a></div>
      </div>

      <div class="projects-all-link reveal">
        <a class="btn secondary" href="https://github.com/kabakaro12" target="_blank" rel="noopener">Voir tous mes dépôts GitHub ↗</a>
      </div>
    </section>

'''
html = html[:projects_start] + projects_v18 + html[designs_start:]

# 5) Supprimer l'affichage 0 visites
counter = ' <span class="page-views" id="pageViewCounter" hidden>• <strong id="pageViewCount">0</strong> visites</span>'
html = html.replace(counter, "")

# 6) CSS
marker = "/* ===== V18 — recruteur + conversion client ===== */"
if marker not in css:
    css += '''

/* ===== V18 — recruteur + conversion client ===== */
.hero-v18{padding-top:128px}
.audience-actions{display:flex;gap:13px;flex-wrap:wrap;margin-top:30px}
.audience-actions .btn{min-height:48px}
.client-cta{border-color:rgba(49,208,170,.34)}
.sub-actions{margin-top:12px}
.hero-proof{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:30px;max-width:760px}
.hero-proof div{border:1px solid var(--border);background:rgba(255,255,255,.025);border-radius:12px;padding:14px 15px}
.hero-proof strong{display:block;font:700 15px "Space Grotesk";color:#fff}
.hero-proof span{display:block;color:var(--muted);font-size:10px;margin-top:2px}

.projects-v18-section .section-heading{max-width:820px}
.featured-projects-v18{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.project-v18{border:1px solid var(--border);border-radius:18px;background:linear-gradient(145deg,#0f1d31,#0b1728);overflow:hidden;min-height:310px;display:flex;flex-direction:column}
.project-v18-main{grid-row:span 2;min-height:636px}
.project-media{height:315px;overflow:hidden;border-bottom:1px solid var(--border);background:#091523}
.project-media img{width:100%;height:100%;object-fit:cover;object-position:top center}
.project-v18-body{padding:28px;display:flex;flex-direction:column;gap:11px;flex:1}
.project-v18-body h3{font-size:30px;line-height:1.08}
.project-v18-body p{color:var(--muted);font-size:14px}
.project-kicker{font-size:10px;letter-spacing:.14em;color:var(--accent);font-weight:800}
.project-v18-icon{margin:28px 28px 0;width:58px;height:58px;border-radius:15px;display:grid;place-items:center;background:rgba(49,208,170,.09);border:1px solid rgba(49,208,170,.22);color:var(--accent);font:700 18px "Space Grotesk"}
.text-link{margin-top:auto;color:var(--accent);font-size:12px;font-weight:800}

.case-study-v18{margin-top:24px;border:1px solid rgba(49,208,170,.22);border-radius:20px;padding:32px;background:linear-gradient(145deg,rgba(49,208,170,.06),rgba(255,255,255,.018))}
.case-study-head{max-width:650px;margin-bottom:25px}
.case-study-head h3{font-size:32px}
.case-study-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.case-study-grid article{border:1px solid var(--border);background:rgba(7,17,31,.62);border-radius:14px;padding:20px}
.case-study-grid article>span{color:var(--accent);font-size:11px;font-weight:800}
.case-study-grid h4{font:700 18px "Space Grotesk";margin:10px 0 7px}
.case-study-grid p{font-size:12px;color:var(--muted)}

.other-projects-v18{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}
.other-projects-v18>div{border:1px solid var(--border);border-radius:14px;padding:20px;background:rgba(255,255,255,.02)}
.other-projects-v18 span{font-size:9px;letter-spacing:.12em;color:var(--accent);font-weight:800}
.other-projects-v18 h3{font-size:18px;margin:8px 0}
.other-projects-v18 p,.other-projects-v18 a{font-size:11px;color:var(--muted)}
.other-projects-v18 a{color:var(--accent);font-weight:700}
.projects-all-link{margin-top:22px}

@media(max-width:900px){
  .hero-proof{grid-template-columns:repeat(2,1fr)}
  .featured-projects-v18{grid-template-columns:1fr}
  .project-v18-main{grid-row:auto;min-height:auto}
  .case-study-grid{grid-template-columns:repeat(2,1fr)}
  .other-projects-v18{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:600px){
  .audience-actions .btn,.sub-actions .btn{width:100%}
  .hero-proof{grid-template-columns:1fr 1fr}
  .hero-proof strong{font-size:13px}
  .project-media{height:245px}
  .project-v18-body{padding:23px}
  .project-v18-body h3{font-size:26px}
  .case-study-v18{padding:22px}
  .case-study-grid,.other-projects-v18{grid-template-columns:1fr}
}
'''

INDEX.write_text(html, encoding="utf-8")
STYLE.write_text(css, encoding="utf-8")

print("V18 appliquée avec succès.")
print("Sauvegardes créées : index.v17-backup.html et style.v17-backup.css")
print("Fichiers modifiés : index.html et style.css")
