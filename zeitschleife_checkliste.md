# Zeitschleife V3 – Checkliste aller beschlossenen Ideen

*Stand: 14.10.2026 · Quellen: zeitschleife_konzept.md, raetsel_handbuch.md, zeitschleife_ideen.md, rollenspiel_erzaehltechnik.md, Pete-Festlegungen aus dem Chat · Neuere Petes Entscheidungen schlagen ältere · Gestrichenes (Hotspot-Leuchten/-Anzeige) nicht aufgenommen*

**Leitplanken:** Jugendfrei · nur Anspielungen (keine Original-Logos/-Namen/-Musik/-Ausschnitte) · nichts darf billig wirken · Trefferflächen groß aber unsichtbar · Hinweise nur über Mara/Erzähler (3 Stufen) · Glitch nur dezent VHS

---

## Systeme – Countdown

- [x] Basis-Countdown 20:00 min (Priorität Muss) — V3 timing.timeLimit 1200
- [ ] Blumenkrone gibt +2:00 min (Priorität Muss) — Engine+Daten fertig ({timefx:'blumenkrone'}, getestet 1190→1308 s + 6 leise Uhr-Ticks), aber noch keine Szene im Hauptspiel, die es auslöst
- [x] Easter Egg (Zeitreise-Anspielung) gefunden: +30 s + Rückspul-Sound, 1× pro Spielstand (Priorität Muss) — 3× bonus 30 in game3, V3n 1×/Spielstand via MEM.bonusKeys
- [x] Klassiker-Hommage gefunden: +20 s, 1× pro Spielstand (Priorität Muss) — 2× bonus 20, 1×/Spielstand
- [x] Lustige falsche Dialogantwort: −15 bis −30 s + eigener Clip/Spruch; Abzug nur 1× pro Falle pro Schleife, danach nur Spruch (Priorität Muss) — opt.trap: Abzug 1×/Falle/Schleife, danach Spruch
- [x] Rückkehr ab Glitch-Stufe 5: −30 s pro Eintritt (Priorität Muss) — engine glitchPenaltyFrom 5
- [ ] Baum fällen: −60 s (Priorität Muss) — Engine+Daten fertig (timeFx baum_faellen 60; Hängematte −20 s, 1×/Schleife), Auslöser-Szene fehlt noch
- [x] Hinweis Stufe 3: 0 s, nur Spott-Spruch (Priorität Muss) — kein Zeitabzug, Spott-Spruch (larry)
- [x] Game Over: Schleife neu, Wissen/Tagebuch/Easter-Egg-Bonus bleiben (Priorität Muss) — V3n: Notizen, MEM.know, Bonus-Keys+Bonuszeit bleiben; Neues Spiel setzt zurück
- [x] Bonuszeit gesamt max. +5 min (Priorität Muss) — V3n: Deckel 5:00, Hinweis „Bonuszeit voll“
- [x] Countdown nie unter 1 min nur durch Abzüge (letzte Minute nur echte Zeit) (Priorität Muss) — V3n getestet
- [x] Anzeige kurzes „+0:30“/„−0:20“ am Walkman-Display, kein Extra-Zähler (Priorität Muss) — V3n: Einblendung unter HUD-Uhr + im Walkman, statt Toast

## Systeme – Inventar

- [x] Inventar-Limit 6 Plätze (Priorität Muss) — invLimit 6
- [x] Anker-Items (Walkman, Mauerstück, Glühbirne) zählen nicht mit (Priorität Muss) — invCount ohne anchor
- [x] Köder-Items mit eigenen Benutz-Sprüchen (Priorität Muss) — V3p: 6 Köder × 3 Sprüche (rotierend, mit Stimme)
- [x] Köder klar von Pflicht-Items unterscheidbar (Priorität Muss) — gestrichelter Rahmen + „KRAM“ im Inventar
- [ ] Zufälliger Gegenstands-Pool pro Schleife: Schlüssel-Items fest, Köder/Extras zufällig (Tamagotchi, Kassette mit Bleistift, Gameboy, Furby, Wählscheibentelefon …), je eigener Spruch (Priorität Soll)
- [ ] Inventar-Kombi-Animation: Items fliegen zusammen + Funke/Pop (Priorität Kann)

## Systeme – Hints

- [x] Hinweistexte in Nodes entschärfen (feste hints auf Stufe 1) (Priorität Muss) — 15.10. geprüft: Enter-/Hotspot-Texte verraten keine Lösung, Stufe 1 bleibt vage
- [x] 3-Stufen-Hinweise: Erzähler vage → Mara Ort → Mara Lösung (kein Leuchten) (Priorität Muss) — hintNow Stufen 1–3
- [x] Stufe 2 erst nach 60–90 s oder 3 Fehlversuchen; Stufe 3 nur auf Wunsch (Walkman-Taste halten) (Priorität Muss) — V3n: Stufe 3 nur per Halten (H/Stick ≥1,1 s) oder zweitem Druck nach Mara-Rückfrage
- [x] Kein Hotspot-Leuchten, keine Hotspot-Anzeige; Trefferflächen groß aber unsichtbar (Priorität Muss) — V3p: Hover-Label/Cursor/Münz-Glow/Laserpunkt nur mit ?debug=1
- [ ] Typische falsche Ideen bekommen eigene Fail-Sprüche (Priorität Soll)
- [ ] Jede Lösung vorher irgendwo angedeutet, nie verraten (Priorität Muss)

## Systeme – Glitch

- [ ] Nur dezenter Fake-VHS-Glitch: leichtes Rauschen, Tracking-Streifen am Rand, kurzer Ton-Leierer (Priorität Muss)
- [ ] Kein RGB-Split, keine springenden Hotspots, kein Flackern im Blickfeld (Priorität Muss)
- [ ] Steigerung über Ton, Erzähler-Sprüche und Zeitkosten statt visuelle Stärke (Priorität Muss)
- [ ] Besuch 1 normal; ab 2+ VHS/Ton/Sprüche; ab 5+ Zeitkosten, nie sperren (Priorität Muss)
- [ ] Glitches können Geheimnisse kurz andeuten (Easter Eggs, Hinweise) (Priorität Soll)
- [x] Optionsschalter „Glitch-Intensität“; keine Kamerabewegung, keine harten Blitze (Priorität Muss) — V3n: AUS/LEISE/NORMAL in Optionen
- [ ] Glitch-Zähler in Backrooms als wachsender Wandriss (Overlay) (Priorität Soll)
- [ ] Szenenübergang: kurzer VHS-Rückspul-Glitch (0,5 s) beim Ärenwechsel (Priorität Soll)

## Systeme – Zustände / Ruf / Wissen

- [ ] Leitidee: Wissen bleibt, Gegenstände nicht (Priorität Muss)
- [ ] Ruf pro Ära: Dialog/Verhalten öffnet oder versperrt Wege (Priorität Soll)
- [ ] Wissens-Flags statt Level-Werte (Codes, Slang, Handzeichen über Schleifen) (Priorität Soll)
- [ ] Mara erinnert sich ab Schleife 3: „Moment, das hatten wir schon“ + Bonushinweis Stufe 2 (Priorität Soll)
- [ ] Lügender Erzähler ab Schleife 3 bei Stufe-1-Hinweisen; Mara korrigiert (Priorität Kann)
- [ ] Maras Vertrauen sinkt leicht bei zu langem Anstarren (Priorität Soll)
- [ ] Drei-Hinweise-Regel pro Engpass (mind. 3 Lösungswege) (Priorität Soll)
- [ ] Branch-and-Bottleneck pro Ära, Loop-and-Grow / Spoke-and-Hub über Backrooms (Priorität Soll)
- [ ] Recap am Loop-Ende (VHS-Rückspul-Liste der Wissens-Flags) (Priorität Kann)
- [ ] Mehrere Enden per Flag-Auswahl am Finale (gut / gefangen / Satire / Baum-Bonus) (Priorität Soll)
- [ ] Speedrun nach erstem Ende: Bestzeit lokal, Rest-Countdown als Score (Priorität Kann)
- [ ] Loop-Variationen: pro Schleife ändert sich ein Szenen-Detail (Priorität Kann)

## Systeme – VR-Interaktion

- [x] VR-first mit 360°-Räumen statt flacher Stills (V3-Ordner /v3/, V2 bleibt) (Priorität Muss) — erledigt V3j: Backrooms als Hybrid-Raum (Pano + Boden/Wand-Proxy)
- [x] Engine aus V2 wiederverwenden (Laser, VR-Frame-Fix, Stimmen, Ducking) (Priorität Muss) — erledigt V3j
- [x] Greifen und Werfen (z. B. Items in den Mülleimer) (Priorität Soll) — erledigt V3j, Regression ok
- [x] Hinschauen / Look-at: NPCs reagieren auf langes Anstarren (Priorität Soll) — erledigt V3j (Gaze-Hotspots)
- [ ] Raumklang / Positions-Audio lockt zu Hotspots (ersetzt sichtbare Hotspots) (Priorität Soll)
- [ ] Gesten und physische Rätsel (Anfassen) wo sinnvoll (Priorität Kann)
- [x] Parallax-/2.5D-Tiefe bei Kopfbewegung (Priorität Kann) — erledigt V3j: Pano auf Tiefen-Proxy projiziert
- [ ] Idle-Loops / Ambient-Leben (Partikel, Silhouetten) ohne billig zu wirken (Priorität Kann)
- [x] Freie Tools: Blender, Poly Haven, Kenney für 3D (Priorität Soll) — erledigt V3i
- [ ] Mehr Videoclips, besonders für 2041 (Priorität Soll)
- [ ] Look-Bibel: Backrooms Found-Footage; 1984 Traum-Neon; 1989 kühl dokumentarisch; 2041 giftgrüner Neon-Smog (Priorität Soll)

## Systeme – Sound

- [ ] Quellen: Freesound (Ambient, UI, Alltagsgeräusche) UND ElevenLabs Sound Effects (Priorität Muss)
- [ ] ElevenLabs Sound Effects für Geräusche, die es so nicht gibt: Vortex, lebendiger Slinky, Glitch (Priorität Muss)
- [ ] Raumklang / Ambience-Loops je Ära + positionierte Geräusche (Priorität Soll)
- [x] Rückspul-Sound bei Easter-Egg-Bonuszeit (Priorität Muss) — addTime bonus → rewind
- [ ] Slinky-Klack-Sound pro Aufsetzen (Priorität Soll)
- [ ] Voice-Linien Mara/Erzähler/NPCs (ElevenLabs TTS), Ducking aus V2 (Priorität Muss)
- [ ] Musik nur eigene Stücke „im Stil von“, keine Originalmusik (Priorität Muss)

## Neon-Slinky

- [ ] In jeder Spiel-Ära (nicht Backrooms) ein versteckter Neon-Slinky (Priorität Soll)
- [ ] Einsatz: purzelt treppenartig ~30–40 % Richtung nächstes wichtiges Ziel, nur Richtung, kein Ziel-Leuchten (Priorität Soll)
- [x] Kostet 1 Min pro Einsatz; höchstens 3 Einsätze; danach wird er lebendig und läuft davon (Priorität Soll) — erledigt V3j, Regression ok
- [ ] Ohne relevantes Ziel: einmal im Kreis, Mara: „Er ist auch ratlos.“ (Priorität Soll)
- [ ] Animation per Code (1 Sprite, ~1,5 s, Klack-Sound); Neonfarbe je Ära (Priorität Soll)
- [ ] Fundorte: 1972 Blumenkranz Festival-Zelt; 1984 Pool-Abfluss; 1989 Grenzerhäuschen Formulare; 2041 Kalles Ramschkiste (Priorität Soll)

## Backrooms

- [x] Hub: Start, Zwischenraum, Ärenwahl über Zeitwalkman (Priorität Muss) — erledigt V3j: B2 mit 3 Türen
- [ ] Mülleimer: Wegwerfen + Durchwühlen; Erzähler-Running-Gag; Fundort-Rückfall ohne Sackgasse (Priorität Muss)
- [ ] Mixtape-Rack: Kassette je Ära; Hinweis nur rückwärts gespult hörbar (Priorität Kann)
- [x] Easter Egg: Zeitreise-Sportwagen-Kennzeichen-Anspielung an der Wand (ohne Original-Schriftzug) (Priorität Soll) — erledigt V3i: Schild „Z-EIT 88“, V3j an echte Wand gesetzt
- [x] Vortex-VFX: Doctor-Who-ähnlicher Tunnel (YouTube-VFX frei mit Credit), warm/dunkel, Hyperraum-Sterne, immer im Blickzentrum (Priorität Muss) — erledigt V3j: Video-Tunnel + Hyperraum, in VR jetzt auch auf Quest aktualisiert
- [ ] Viktorianische Zeitmaschine mit Hebel (Anspielung „Die Zeitmaschine“) (Priorität Kann)
- [ ] Kinderzeichnung an der Wand, füllt sich mit jeder Schleife mehr (Mystery) (Priorität Soll)

## 1972 Festival

- [ ] Hippie gibt Walnuss + Schwafel-Spruch („Wurzeln wissen, wo das Metall schläft“) (Priorität Muss)
- [ ] Walnuss am richtigen Platz pflanzen → 2041 heiliger Baum; falsch → Baum im Sperrgebiet; nicht → Tor (Priorität Muss)
- [ ] Brief an sich selbst verstecken → 2041 vergilbt mit Passwort (Schleifenwissen) (Priorität Soll)
- [ ] Peace-Graffiti-Foto aus 1989 → Blumenkrone ohne Tanz (Priorität Kann)
- [ ] Falle: Hängematte → Einschlaf-Clip, −20 s (Priorität Muss)
- [ ] Easter Egg: blaue Notruf-Telefonzelle nur manchmal/im Glitch sichtbar (Priorität Soll)
- [ ] Hommage: spitzer Zaubererhut an Bühnenzelt-Garderobe (Priorität Soll)
- [ ] Köder: Lavalampe (Priorität Soll)
- [ ] Slinky im Blumenkranz eines Festival-Zelts (Priorität Soll)
- [ ] Psychedelischer Song „im Stil von“ The Doors + Poster-Anspielung (keine Originalmusik) (Priorität Kann)
- [ ] Stilles Mädchen malt im Hintergrund Orte der Zukunft (Mystery, unauffällig) (Priorität Soll)

## 1984 Pool / K.I.T.T.Y.

- [ ] Münze → Arcade-Farbfolge → Würfel → Walkman (Charme nur Hinweis, Walkman nicht billig) (Priorität Muss)
- [ ] Polaroidkamera mit 3 Bildern; Fotos in anderen Ären zeigen (Priorität Soll)
- [ ] Kalle jung als Bademeister-Lehrling / Tauscher (Priorität Soll)
- [ ] Falle: K.I.T.T.Y. nach Wahlkampfprogramm fragen → −25 s (Priorität Muss)
- [ ] Easter Egg: stehengebliebene Uhr mit Blitzspur, Erzähler „10:04 Uhr. Interessant.“ (Priorität Soll)
- [ ] Hommage: Hamster + Mikrowelle, nicht kombinierbar („Nein. Einfach nein.“) (Priorität Soll)
- [ ] Köder: Würfel-Schlüsselanhänger, Stirnband, Kassette „Hits 84“ (Priorität Soll)
- [ ] Slinky am Pool-Abfluss (Priorität Soll)
- [ ] Arcade-Minispiele in der Spielhalle (siehe Minispiele) (Priorität Kann)
- [ ] Lichterketten-Buchstaben (Stranger-Things-Anspielung) (Priorität Soll)
- [ ] Protonen-Rucksack-Anspielung; K.I.T.T.Y.s Bruder; Hoverboard / 88-Tacho (Priorität Kann)
- [ ] Flugblatt „Vermisste Kinder“, Militärlaster „Möbius“ (Mystery) (Priorität Soll)
- [ ] Mädchen unauffällig im Hintergrund (Mystery) (Priorität Soll)

## 1989 Mauerfall

- [ ] Stempel-Zwischenschritt vor Begrüßungsgeld (3 Wege: Walkman-Ablenkung, Münze-Souvenir, Beleidigungs-Duell) (Priorität Muss)
- [ ] Kette: Stempel → Begrüßungsgeld → Banane → Hammer → Mauerstück (Priorität Muss)
- [ ] Beleidigungs-Duell: Sprüche vorher bei NPCs aufschnappen (Priorität Soll)
- [x] Falle: „Gibt es dafür ein Formular?“ → Vortrag, −20 s (Priorität Muss) — game3 grenzer_formular 20 s
- [ ] Easter Egg: Karton „Zeitreise-Kram – nicht öffnen“ im Grenzerhäuschen (Priorität Soll)
- [ ] Hommage: Gummihuhn mit Seilrolle als Köder (Priorität Soll)
- [ ] Köder: leere Akte, Trabi-Radkappe (Priorität Soll)
- [ ] Slinky zwischen Formularen im Grenzerhäuschen (Priorität Soll)
- [ ] Rückwärts-Szene ab Besuch 3 (Clips umgekehrt; Mauer „zusammenkleben“) (Priorität Kann)
- [ ] Akte „Teilnehmerin 7“ / Vorahnungen (Mystery) (Priorität Soll)
- [ ] Mädchen unauffällig im Hintergrund (Mystery) (Priorität Soll)
- [ ] Töpferscheibe-Anspielung (Ghost), Mara: „Nein. Einfach nein.“ (Priorität Kann)

## 2041 Dystopie

- [ ] Zwei parallele Ziele: Batterien und Zentrale-Zugang (Priorität Muss)
- [ ] Ohne Baum: Tor (Mauer-Symbolik), Weiterkommen nur über Kalle teuer/langsam (Priorität Muss)
- [ ] Mit Baum: Tor nie gebaut; Menschen verehren den Baum; Erzähler/Mara-Mauer-Bezug („Ein Baum verbindet mehr …“) (Priorität Muss)
- [ ] Wurzeln drücken Metallkiste hoch (Batterien) bzw. Schatten zeigt Brief/Hotspot (Priorität Muss)
- [ ] Fällen-Option: Holz, aber Hinweis weg, −60 s (Priorität Soll)
- [ ] Aha-Moment: Erzähler zitiert Hippie; Mara „nicht nur verpeilt“ (Priorität Muss)
- [ ] Kalle alt: erkennt Spieler; Polaroid → Rabatt (Priorität Soll)
- [ ] Falle: Kalle nach seiner Geschichte fragen → −30 s (Priorität Muss)
- [ ] Easter Egg: Metallhand in Trümmern, Mara „Die kommt bestimmt wieder.“ (Priorität Soll)
- [ ] Hommage: lila Tentakel-Poster in Disco; Peitsche („Falsches Spiel, Kumpel.“) (Priorität Soll)
- [ ] Köder: Pappbrille, Gutschein „1 Glück“ (Priorität Soll)
- [ ] Slinky in Kalles Ramschkiste (Priorität Soll)
- [ ] Plakat „Weltwirtschaftsforum für Glück und Verzicht“ (bestehende Parodie) (Priorität Soll)
- [ ] Kalle verkauft Projekt-Tonbänder; eins passt in den Walkman (Mystery) (Priorität Soll)
- [ ] Passanten-Gespräch Superreiche/Restaurant/Handtuch/42 (Hitchhiker-Anspielung, Positions-Audio) (Priorität Soll)
- [ ] Mädchen unauffällig im Hintergrund (Mystery) (Priorität Soll)
- [ ] Mehr Clips für 2041 (Priorität Soll)

## Mara

- [ ] Mara ist erwachsen (Priorität Muss)
- [ ] Twist: Mara IST das Mädchen; hat die Schleife erschaffen und vergessen (Priorität Soll)
- [ ] Andeutungen: kritzelt wie Kinderzeichnung, summt Lied von 1972, reagiert auf Akte „Teilnehmerin 7“, vergisst bei knapper Zeit (Priorität Soll)
- [ ] Bestes Ende: Mara erinnert sich, Welt löst sich auf (Priorität Soll)
- [ ] Anstarren-Steigerung (MGS/Larry): Stufe 0 lässig → 1 selbstbewusster posieren → 2 rot werden → 3 Arme verschränken + Spruch (Priorität Soll)
- [ ] Sprüche: „Warum starrst du mich so an …?“ / „Guck mich nicht so an!“ / „Snake… äh, Kumpel. Die Uhr läuft.“ (Priorität Soll)
- [ ] Bonus: „Ruf mich nicht mehr an.“ → 1 Min keine Hinweise (Priorität Soll)
- [ ] 1984-Pool: 80er-Bikini, Retro-Pin-up, unauffällig sexy, keine Nacktheit; Larry-Humor über Erzähler-Sprüche (Priorität Soll)
- [ ] Entdeckbarkeit ohne Körperbetonung außerhalb 1984: oft im Blickfeld, auffälliges Retro-Detail, Erzähler-Köder, Ladebildschirm-Tipp (Priorität Soll)
- [ ] Erzähler-Larry-Sprüche beim Anstarren (Gag auf Kosten des Spielers) (Priorität Soll)

## Mystery-Strang (Projekt Möbius)

- [ ] Erfundenes Geheimprojekt „Projekt Möbius“ (kein Montauk-Name) (Priorität Soll)
- [ ] Hinweise über alle Ären verteilt (Three Clue / Revelation) (Priorität Soll)
- [ ] Mädchen nur unauffällig im Hintergrund verschiedener Szenen, nie handelnde Figur neben Mara (Priorität Muss)
- [ ] Auflösung nur im besten Ende bei genug Hinweisen (Priorität Soll)
- [ ] Vergessen-Regel: je länger in der Schleife, desto mehr vergisst man; dadurch entsteht die Welt (Priorität Soll)

## Anspielungen und Easter Eggs

- [ ] Endbildschirm: „X von 20 Anspielungen gefunden“; jede einmalig Bonuszeit (Priorität Soll)
- [ ] Zurück in die Zukunft: Uhr/Blitz, Hoverboard, 88 (Priorität Soll)
- [ ] Und täglich grüßt das Murmeltier: Radiowecker 6:00, Song „Babe, I Got You“, Murmeltier (Priorität Soll)
- [ ] Terminator: Metallhand, „Ich komme wieder“ (Priorität Soll)
- [ ] Doctor Who: blaue Telefonzelle (Priorität Soll)
- [ ] Ghostbusters: Protonen-Rucksack 1984 (Priorität Kann)
- [ ] Knight Rider: K.I.T.T.Y.s Bruder (Priorität Kann)
- [ ] Monkey Island: Gummihuhn, Beleidigungs-Duell (Priorität Soll)
- [ ] Stranger Things: Lichterketten 1984 (Priorität Soll)
- [ ] Matrix: rote/blaue Smarties-Pillen (Priorität Kann)
- [ ] Spaceballs: Vortex-Spruch „wahnsinnige Geschwindigkeit“ (Priorität Kann)
- [ ] Rambo: Stirnband/Messer bei Kalle 2041 (Priorität Kann)
- [ ] Star Wars: Hyperraum-Sterne, Hologramm-Notruf 2041 (Priorität Kann)
- [ ] Die Zeitmaschine: viktorianische Maschine in Backrooms (Priorität Kann)
- [ ] Twilight Zone: Schwarz-Weiß-Szene, Intro-Ton Erzähler (Priorität Kann)
- [ ] Indiana Jones: Peitsche, Hut unter Tür (Priorität Soll)
- [ ] The Doors: Stil-Song + Poster 1972 (Priorität Kann)
- [ ] Point-and-Click-Klassiker: Tentakel-Poster, Hamster/Mikrowelle, Zaubererhut, Larry-Spruch (Priorität Soll)
- [ ] Ghost (1990): Töpferscheibe 1989 (Priorität Kann)
- [ ] E.T.: Fahrrad/Vollmond-Poster, Süßigkeiten-Köder (Priorität Kann)
- [ ] Tetris: Gameboy-Melodie im Stil von Korobeiniki (gemeinfrei) (Priorität Kann)
- [ ] Pac-Man: Automat frisst beim Zeitsprung rückwärts (Priorität Kann)
- [ ] Jurassic Park: vibrierendes Wasserglas 2041 (Priorität Kann)
- [ ] Inception: Kreisel, der nicht aufhört (Priorität Kann)
- [ ] Lola rennt: rote Haare + Zeit-Spruch 2041 (Priorität Kann)
- [ ] Dark: Höhleneingang „nicht wo, sondern wann“ (Priorität Kann)
- [ ] Zurück in die Zukunft II: Zukunfts-Zeitung (Priorität Kann)
- [ ] Hitchhiker's Guide: Handtuch, 42, Passanten-Gespräch 2041 (Priorität Soll)
- [ ] Aus der Liste ~20 für den End-Zähler auswählen (Priorität Soll)

## Minispiele

- [ ] „Zeit-Fresser“ (Pac-Man-Stil): Sekunden fressen, Glitch-Geistern ausweichen; Sieg = Bonuszeit (Priorität Kann)
- [ ] Retro-Ego-Shooter (Wolfenstein-Stil): durch Forum-Zentrale; Gegner Anzugträger/Datenbrille; Munition = Bananen; Sieg verändert 2041-Plakat (Priorität Kann)
- [ ] Eigene Spiele ohne Original-Namen/-Grafiken; Canvas auf Automaten in A-Frame (Priorität Kann)
- [ ] Standort: Spielhalle 1984 (Priorität Kann)

## Dialoge V3

- [x] Multiple Choice in Dialogen (Priorität Muss) — erledigt V3j
- [ ] Pro Dialog eine lustige falsche Antwort mit Zeitabzug (Priorität Muss)

## Kalle über die Ären

- [ ] Kalle in jeder Ära (mind. jung 1984 + alt 2041; ideal auch 1972/1989) (Priorität Soll)
- [ ] Wiedererkennen über Schleifen / Polaroid-Reaktion (Priorität Soll)

## Fairness & Qualität

- [ ] Keine Sackgassen; Pflicht-Items immer zurückholbar (Priorität Muss)
- [ ] Keine Pixel-Suche; große Collider VR + Handy (Priorität Muss)
- [ ] Nichts darf billig wirken (Assets, Animationen, Clips) (Priorität Muss)
- [ ] Jugendfrei; Hippie „verpeilt“ nicht „bekifft“; Grenzer/DDR respektvoll (Priorität Muss)
- [ ] Hommagen nur Anspielungen: eigene Gestaltung (Priorität Muss)
- [ ] Testlauf mit Fremden; Quest + Handy (Priorität Muss)

## Stimmen und Figuren

- [ ] Eigene ElevenLabs-Stimme pro Figur: Hippie 1972, Grenzer 1989, K.I.T.T.Y., Kalle jung und alt, zwei Passanten 2041, Händler, Leute in der Spielhalle, das Mädchen nur geflüstert (Priorität Muss)
- [ ] 2–3 Hintergrundstimmen pro Ära mit Positional Audio (Priorität Muss)


---
## Nicht/kaum machbar (Stand 14.10., Grok Bot)
- **Gaussian Splats / DA3-Gaussians:** brauchen eine GPU, auf dem Box-Rechner nicht machbar. Nur wenn es eine fertige Splat-Quelle gibt.
- **Gebackene Lightmaps für ganze Räume:** Cycles läuft nur auf der CPU, also langsam. Für einzelne Props geht es, ganze Ären sind nicht realistisch.
- **Eigene ElevenLabs-Stimme pro Figur + 2–3 Hintergrundstimmen pro Ära:** Budget. Es sind nur noch ca. 3,3k von 20k Zeichen übrig. Laut Pete gehen sie nur an Mara → Erzähler → Kalle → K.I.T.T.Y. Nebenstimmen erst nach Budget-Freigabe, bis dahin Untertitel + Gemurmel.
- **ElevenLabs-SFX:** nur Vortex und lebendiger Slinky (Pete). Glitch und Rest kommen prozedural oder von Freesound.
- **Retro-Ego-Shooter in VR:** auf der Quest im Browser möglich, aber Aufwand und Motion-Sickness im Verhältnis zum Nutzen hoch. Höchstens als flacher Automaten-Bildschirm (Canvas).
- **Pano-Schärfe 6K + KTX2:** Real-ESRGAN auf der CPU geht, dauert aber lange. KTX2 braucht toktx/basis. Ist noch offen und machbar, aber nicht in dieser Runde.
- **Testlauf mit Fremden, Quest-Check:** kann ich nicht selbst machen, nur Pete.

## Tests / Props (14.10.2026)
- [x] Poster/Cover-Tippfehler korrigiert (*_fix.png, sheet_fix.jpg unter v3/assets/posters_fixed/) — erledigt V3l
- [x] Basketball-Hinterhof-Prototyp v3/test/basket.html + Hub — erledigt V3l
- [x] Kirmes-Test (Dosenwerfen/Schießbude/Pferderennen) mit PBR/Glow/Plüsch — erledigt V3l
- [x] Grünriegel dunkler + lesbares Label (assets/items/2041/) — erledigt V3l (Platzierung erst in 2041)
- [x] Kirmes: Bude-Klick → davor stellen; Preise+Zeitbonus (1×) mit leisem Tick — V3l
- [x] Basketball: L-Stick/Teleport/R-Snap; Serie → Zeitbonus+Tick — V3l
