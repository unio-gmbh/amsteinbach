# Am Steinbach, Berggasse 17-19, Mauerbach

Projekt-Landingpage und Meta-Sujets für zwei freistehende Einfamilienhäuser in 3001 Mauerbach (Ortsteil Steinbach), Verkauf durch Marcus Weiss, powered by UNIO. Projektname "Am Steinbach" ist ein Vorschlag (Projekt-Branding laut Angebot 2026-180901), bitte bestätigen.
Aufbau 1:1 nach Am Wolfersberg (Repo `Ad-Boutique/ag22`, Branch `claude/kind-gauss-2s4r1g`): nummerierte Kapitel auf Haarlinien, Headlines in Cormorant Garamond (SIL Open Font License, siehe `assets/fonts/OFL-Cormorant-Garamond.txt`), Text und Labels in URW Gothic. Farben aus den Renderings: Weiß, Putzgrau, Sand #ebe5da, Lärche #8a5b38, Waldgrün #1d2620. Projektzeichen: zwei auskragende Kuben über einer Geländelinie (`assets/img/mark.svg`, Symbol `#mark` im HTML).

Statische Seite ohne Build-Zwang: `index.html`, `assets/css/style.css`, `assets/js/main.js`, Bibliotheken lokal unter `assets/js/vendor` (GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13).
Lokal ansehen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

Quellen: Vorentwurf EUROPROJECT ZT GmbH vom 09.09.2026 (Lageplan, Grundrisse EG und UG, Flächenaufstellung), Bau- und Ausstattungsbeschreibung allgemein und detailliert (19.10.2026), Kosten- und Energie-Vorabschätzung (06.10.2026), Renderings 2EFH_Mauerbach (6 Bilder). Ein Exposé, eine Preisliste, Verkaufspläne und ein Energieausweis lagen nicht vor.

Hausfinder: Daten je Haus im Block `UNITS` in `assets/js/main.js` (Haus 1 = Bauplatz I, Haus 2 = Bauplatz II). Grundrisse aus dem Vorentwurf vom 09.09.2026 (Seiten 01.7, 01.8, 01.11, 01.12), einheitlich zugeschnitten unter `assets/plaene/haus-<n>-<eg|ug>.jpg`, dazu die Planseite als PDF. `npm run images` erzeugt die Varianten 800, 1400 und 2400 px unter `assets/plaene/r/`. Kommen Verkaufspläne, die Dateien gleich benannt ersetzen. Anfragen gehen an `CONTACT.mail` (derzeit office@unio.at als Zwischenlösung).
Die Lage ist bewusst ohne Karte umgesetzt: Distanzleiste mit logarithmischem Maßstab plus Liste. Entfernungen Luftlinie ab 48.24689, 16.19405 (OpenStreetMap, Nominatim).

Offen vor Livegang: siehe `docs/vault/Am Steinbach.md`, Abschnitt "Offen".

## Performance und SEO

- Bilder: `npm run images` (bzw. `python3 tools/images.py`) erzeugt aus `assets/img/*.jpg` Varianten in AVIF, WebP und JPG unter `assets/img/r/`. Im HTML stehen sie als `<picture>` mit `srcset`, `sizes`, Breite und Höhe; alles außer dem Startbild lädt verzögert.
- CSS und JS: Quellen sind `assets/css/style.css` und `assets/js/main.js`. Nach jeder Änderung `npm install` (einmalig) und `npm run build`, das erzeugt `style.min.css` und `main.min.js`.
- Schriften: URW Gothic und Cormorant Garamond (lateinisch) als WOFF2, vorgeladen.
- Fragen und Antworten sowie JSON-LD (RealEstateListing mit zwei SingleFamilyResidence, RealEstateAgent, FAQPage) kommen aus `tools/faq.py`: Fragen dort bearbeiten, dann `npm run faq`.
- Lage-Orte, Alltagswege und Häuser-Tabelle stehen statisch im HTML, damit Suchmaschinen und KI-Crawler sie ohne JavaScript lesen. Bei Änderungen an Preis oder Status sowohl die Tabellenzeilen in `index.html` als auch `UNITS` in `main.js` anpassen.
- `llms.txt` fasst das Projekt für KI-Assistenten zusammen, `robots.txt` erlaubt alles außer `/ads/`.
- `vercel.json` setzt Cache- und Sicherheits-Header.
- Lighthouse mobil (lokal mit Gzip, 26.10.2026): Performance 93 bis 94, Accessibility 100, Best Practices 100, SEO 100; LCP 2,4 bis 2,6 s, CLS 0.

Offen, sobald die Domain feststeht: `<link rel="canonical">`, `og:url` und absolute `og:image`-URL, `sitemap.xml` und Sitemap-Zeile in `robots.txt`, Google Search Console.

## Meta-Sujets

`ads/index.html` enthält 15 Sujets in 3 Batches (je 4:5 und 9:16) als Daten im Array `BATCHES`. Einzelansicht: `ads/index.html?only=1.1&f=45` bzw. `&f=916`. PNG-Export: `python3 -m http.server 8777` im Repo-Root, dann `node tools/render_ads.js <Zielordner> 1.1,1.2,...`.
