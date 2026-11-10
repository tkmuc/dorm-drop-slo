# Dorm Drop SLO – GitHub Pages

Vollständige statische Website mit Produktpaketen, interaktivem 3D-Konfigurator, optionalem Roommate Planner, Demo-Checkout und Move-in-Dashboard.

Enthalten sind beide Raumtypen (Cerro Vista und Shared Dorm), sechs Farben einschließlich Lila und Rosa sowie Schuhregal und hängender Schrankorganizer. Alle Bilder, das Logo und die Three.js-Dateien liegen lokal im Projekt.

## Auf GitHub Pages veröffentlichen

1. Ein neues Repository anlegen, zum Beispiel `dorm-drop-slo`. Mit GitHub Free ein öffentliches Repository verwenden.
2. Diese ZIP entpacken. Den **Inhalt** des entpackten Ordners über **Add file → Upload files** ins Repository hochladen und committen. `index.html`, `assets/` und `vendor/` müssen direkt im Hauptverzeichnis des Repositorys liegen. Nicht die ZIP-Datei oder einen zusätzlichen übergeordneten Ordner hochladen.
3. **Settings → Pages → Build and deployment** öffnen.
4. Unter **Source** die Option **Deploy from a branch** wählen. Als Branch **main** und als Ordner **/(root)** auswählen. Dann **Save**.
5. Nach Abschluss der Veröffentlichung zeigt GitHub die Adresse unter **Settings → Pages** an.

Die leere Datei `.nojekyll` ist enthalten und sollte ebenfalls hochgeladen werden. Die Website benötigt keinen Build, keine Installation und keine API-Schlüssel. Die relativen Dateipfade und Hash-Routen funktionieren auch unter dem Unterordner eines GitHub-Pages-Projekts.

Offizielle Anleitung: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Lokal ansehen

Den entpackten Ordner in einem Terminal öffnen und einen lokalen Webserver starten:

```bash
python -m http.server 8000
```

Auf manchen Systemen lautet der Befehl `python3 -m http.server 8000`. Anschließend `http://localhost:8000/` im Browser öffnen. Die HTML-Datei nicht nur per Doppelklick öffnen: Der 3D-Planer nutzt JavaScript-Module und benötigt eine HTTP-Adresse.

## Bearbeiten

- `index.html`, `site.js`, `site.css`: Hauptwebsite und Bestellablauf.
- `catalog.js`: Artikel, Beispielpreise und Farben.
- `commerce.js`: Fertigpakete, Auswahl, Mitbewohner-Planung und Demo-Bestellungen.
- `room.html`, `app.js`, `room-model.js`, `room-polish.css`, `styles.css`: 3D-Konfigurator und Raumdarstellung.
- `products.js`, `products.css`, `assets/`: Produktbilder und Bildzuordnung.
- `vendor/`: mitgelieferte Three.js-Module und deren MIT-Lizenz.
- `tests/`: Tests für Bestelllogik und gespeicherte Auswahl.
- `docs/`: Modell- und Bildhinweise.

Optional mit installiertem Node.js prüfen:

```bash
npm run check
npm test
```

Dafür ist kein `npm install` erforderlich.

## Prototyp-Verhalten

Der Checkout erstellt nur eine lokale Demo-Bestätigung. Es werden keine Zahlungen oder echten Bestellungen ausgelöst. Auswahl und Bestellungen bleiben im jeweiligen Browser gespeichert. Buddy-Chat, Check-in, Abholung und Karte sind simuliert. Roommate-Links teilen einen Stand der Planung, keine laufende Zusammenarbeit.

Zimmer, Produkte, Preise und Abholorte dienen der Konzeptdarstellung. Es besteht keine offizielle Verbindung zu Cal Poly. Die Bilder sind generierte Konzeptbilder. Three.js steht unter der mitgelieferten MIT-Lizenz in `vendor/THREE-LICENSE.txt`.

## Export-Prüfung

Der Export wurde mit 7 bestandenen Verhaltenstests, Syntaxprüfungen und 45 lokalen Datei-Verweisen geprüft. Im Browser wurde die Website unter einem verschachtelten Projektpfad mit 3D-Auswahl, Demo-Checkout, Bestätigung und Move-in-Dashboard getestet.
