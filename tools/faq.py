"""Schreibt die FAQ-Sektion und die strukturierten Daten (JSON-LD) in index.html.

Eine Quelle fuer beides: FAQ unten bearbeiten, dann im Projektordner `python3 tools/faq.py` ausfuehren.
Ersetzt die Bereiche zwischen den Markern <!-- faq:start --> / <!-- faq:end --> und <!-- ld:start --> / <!-- ld:end -->.
Quellen: Vorentwurf EUROPROJECT ZT GmbH (09.09.2026), Bau- und Ausstattungsbeschreibung (Oktober 2026),
Kosten- und Energie-Vorabschaetzung (06.10.2026), Entfernungen Luftlinie laut OpenStreetMap.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FAQ = [
    ("Wo liegt das Projekt Am Steinbach?",
     "In der Berggasse 17-19 in 3001 Mauerbach, im Ortsteil Steinbach am Wienerwald, westlich von Wien. Die Bushaltestelle Steinbach Berggasse ist rund 170 m entfernt, die Wiener Stadtgrenze bei der Trollwiese im 14. Bezirk rund 1,1 km, das Auhof Center mit der Westautobahn A1 rund 4,8 km und die U4 in Hütteldorf rund 7,4 km (Luftlinie)."),
    ("Wie viele Häuser gibt es und wie groß sind sie?",
     "Es entstehen zwei freistehende Einfamilienhäuser auf zwei eigenen Bauplätzen: Haus 1 auf rund 950 m², Haus 2 auf rund 930 m². Jedes Haus hat laut Vorentwurf 187,20 m² Nutzfläche auf zwei Ebenen, davon 89,47 m² im Erdgeschoss und 97,73 m² im Gartengeschoss. Die Grundrisse beider Ebenen finden Sie im Hausfinder auf dieser Seite."),
    ("Wie sind die Häuser aufgeteilt?",
     "Das Erdgeschoss ist bei beiden Häusern gleich: Eingang mit Garderobe, Wohnen mit 31,35 m², Küche und Essen mit 25,90 m², Büro mit 10,36 m² und WC, dazu die Terrasse mit 36,40 m². Im Gartengeschoss hat Haus 1 vier Zimmer, ein Bad, ein Duschbad und ein WC, Haus 2 drei Zimmer mit je rund 15 m² und je einem eigenen Duschbad. Keller und Technikraum sind in beiden Häusern vorhanden."),
    ("Welche Freiflächen gibt es?",
     "Jedes Haus hat drei Terrassen: 36,40 m² im Erdgeschoss mit Holzpergola, 26,00 m² und eine überdachte Terrasse mit 30,00 m² im Gartengeschoss. Dazu kommen der Garten auf dem eigenen Bauplatz mit rund 930 bzw. 950 m² und laut Vorentwurf zwei PKW-Stellplätze an der Straße. Bebaut sind davon im Erdgeschoss 163,5 m², also weniger als ein Fünftel."),
    ("Was kostet ein Haus?",
     "Die Kaufpreise nennt Ihnen der Vertrieb, Marcus Weiss, powered by UNIO, gerne persönlich. Am schnellsten fragen Sie das gewünschte Haus direkt im Hausfinder auf dieser Seite an."),
    ("Wann sind die Häuser bezugsfertig?",
     "Die Häuser sind in Planung, aktuell liegt der Vorentwurf vom 09.09.2026 vor. Den Zeitplan für Einreichung, Bau und Übergabe erhalten Sie mit Ihrer Anfrage vom Vertrieb."),
    ("Wie werden die Häuser gebaut?",
     "Das Erdgeschoss entsteht aus Hochlochziegeln mit 16 cm Wärmedämmung und einer hinterlüfteten Fassade aus Lärchenholz, das Gartengeschoss in Stahlbeton mit Wärmedämmung und Putz. Den Abschluss bildet ein extensiv begrüntes Flachdach. Fenster und Schiebetüren sind in Holz-Alu mit 3-fach-Verglasung geplant."),
    ("Wie wird geheizt und wie energieeffizient sind die Häuser?",
     "Geplant sind eine Luft-Wasser-Wärmepumpe mit Fußbodenheizung und eine Photovoltaikanlage am Flachdach mit rund 10 bis 12 kWp je Haus. Der Energieausweis wird nachgereicht. Die energetische Vorabschätzung des Planers vom 06.10.2026 nennt einen Heizwärmebedarf von ca. 24 bis 27 kWh/m²a und einen fGEE von ca. 0,50 bis 0,56. Das sind Planungswerte, kein Energieausweis."),
    ("Welche Ausstattung ist vorgesehen?",
     "Laut Bau- und Ausstattungsbeschreibung: Landhausdielen in Eiche rustikal, geölt, in Wohnräumen und Zimmern, Feinsteinzeug im Format 60 × 60 cm in Vorraum, Bad und Technik, Sanitär von Laufen, Grohe und Geberit mit bodenebenen Duschen, elektrische Außenjalousien, Glasbrüstungen und eine Hauseingangstür in Widerstandsklasse WK 3."),
    ("Wie komme ich von Mauerbach nach Wien?",
     "Die Bushaltestelle Steinbach Berggasse liegt rund 170 m vom Haus entfernt. Bis zur Wiener Stadtgrenze bei der Trollwiese sind es rund 1,1 km, bis zum Auhof Center und zur Auffahrt auf die Westautobahn A1 rund 5 km und bis zur U4-Endstation Hütteldorf rund 7,4 km, jeweils Luftlinie."),
    ("Wer verkauft die Häuser und wie frage ich an?",
     "Der Verkauf erfolgt durch Marcus Weiss, powered by UNIO. Am schnellsten fragen Sie das gewünschte Haus direkt im Hausfinder auf dieser Seite an: Sie erhalten Pläne, Kaufpreis und Zeitplan persönlich."),
]

ADDRESS = {"@type": "PostalAddress", "streetAddress": "Berggasse 17-19", "postalCode": "3001", "addressLocality": "Mauerbach", "addressRegion": "Niederösterreich", "addressCountry": "AT"}
GEO = {"@type": "GeoCoordinates", "latitude": 48.24689, "longitude": 16.19405}


def house(n, lot, rooms):
    return {
        "@type": "SingleFamilyResidence", "@id": f"#haus-{n}", "name": f"Haus {n}, Einfamilienhaus Am Steinbach",
        "address": ADDRESS, "geo": GEO,
        "floorSize": {"@type": "QuantitativeValue", "value": 187.20, "unitCode": "MTK"},
        "numberOfRooms": rooms,
        "amenityFeature": [
            {"@type": "LocationFeatureSpecification", "name": "Bauplatz", "value": f"{lot} m²"},
            {"@type": "LocationFeatureSpecification", "name": "Terrasse Erdgeschoss mit Pergola", "value": "36,40 m²"},
            {"@type": "LocationFeatureSpecification", "name": "Terrassen Gartengeschoss", "value": "26,00 m² und 30,00 m² überdacht"},
            {"@type": "LocationFeatureSpecification", "name": "Luft-Wasser-Wärmepumpe und Fußbodenheizung", "value": True},
            {"@type": "LocationFeatureSpecification", "name": "Lärchenholzfassade, begrüntes Flachdach", "value": True},
        ],
    }


def ld():
    seller = {"@type": "RealEstateAgent", "@id": "#vertrieb", "name": "Marcus Weiss, powered by UNIO",
              "employee": {"@type": "Person", "name": "Marcus Weiss"},
              "brand": {"@type": "Brand", "name": "UNIO", "url": "https://www.unio.at"}}
    listing = {"@type": "RealEstateListing", "@id": "#angebot", "name": "Einfamilienhäuser Am Steinbach, Berggasse 17-19, 3001 Mauerbach",
               "description": "Zwei freistehende Einfamilienhäuser am Wienerwald in Mauerbach, je 187,20 m² Nutzfläche auf zwei Ebenen, eigener Bauplatz mit rund 930 und 950 m², drei Terrassen, Lärchenholzfassade. In Planung.",
               "datePosted": "2026-10-26", "inLanguage": "de-AT",
               "image": ["assets/img/og-image.jpg", "assets/img/r/garten-1-1680.jpg", "assets/img/r/strasse-1680.jpg"],
               "about": [house(1, 950, 6), house(2, 930, 5)],
               "offers": [{"@type": "Offer", "name": f"Haus {n}", "availability": "https://schema.org/PreSale",
                           "itemOffered": {"@id": f"#haus-{n}"}, "seller": {"@id": "#vertrieb"}} for n in (1, 2)]}
    faq = {"@type": "FAQPage", "@id": "#fragen", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
    return {"@context": "https://schema.org", "@graph": [listing, seller, faq]}


def faq_html():
    items = "\n".join(
        f'''      <details class="qa__item"{' open' if i == 0 else ''}>
        <summary><h3>{html.escape(q)}</h3><svg aria-hidden="true"><use href="#plus"/></svg></summary>
        <p>{html.escape(a)}</p>
      </details>''' for i, (q, a) in enumerate(FAQ))
    return f'''<!-- faq:start -->
<!-- 06 Fragen (Inhalt aus tools/faq.py) -->
<section class="section wrap qa" id="fragen">
  <div class="section-rule"><span class="label">06</span><span class="label">Fragen und Antworten</span></div>
  <div class="qa__grid">
    <div class="qa__intro">
      <h2 class="display-2" data-reveal="words">Häufige <em>Fragen.</em></h2>
      <p class="muted" data-reveal>Die wichtigsten Antworten zu Lage, Flächen, Grund, Bauweise und Anfrage auf einen Blick.</p>
      <div class="cta-inline" data-reveal><a class="btn" href="#haeuser">Zum Hausfinder <svg class="arr"><use href="#arrow"/></svg></a></div>
    </div>
    <div class="qa__list">
{items}
    </div>
  </div>
</section>
<!-- faq:end -->'''


if __name__ == "__main__":
    p = ROOT / "index.html"
    t = p.read_text(encoding="utf-8")
    block = faq_html()
    if "<!-- faq:start -->" in t:
        t = re.sub(r"<!-- faq:start -->.*?<!-- faq:end -->", lambda m: block, t, flags=re.S)
    else:
        t = t.replace("</main>", block + "\n\n</main>", 1)
    ld_block = '<!-- ld:start -->\n<script type="application/ld+json">' + json.dumps(ld(), ensure_ascii=False, separators=(",", ":")) + "</script>\n<!-- ld:end -->"
    if "<!-- ld:start -->" in t:
        t = re.sub(r"<!-- ld:start -->.*?<!-- ld:end -->", lambda m: ld_block, t, flags=re.S)
    else:
        t = t.replace("</head>", ld_block + "\n</head>", 1)
    p.write_text(t, encoding="utf-8")
    print("FAQ:", len(FAQ), "Fragen geschrieben")
