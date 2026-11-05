/* v17 Mara-Andeutungen (Pete 05.11.) – nur auf Nachfrage, nie automatisch.
   Regeln: kein Tipp beim Betreten, nach Wartezeit oder nach Fehlversuchen. Nur wenn der Spieler anruft/sie fragt.
   Höchstens zwei Andeutungen je Thema, nie Gegenstand + Ziel + Aktion zusammen. Dritte Nachfrage = Absage.
   Sie sagt nie „Wartenummer“, „Feuerzeug“ oder „erhitzen“. Anstarren bleibt der Verlegenheits-Gag ohne Hinweis.
   ZSMARA_HINT.ask(thema) → Text (Zähler pro Schleife in zs_loop.flag.mara_<thema>). Noch an keinen Anruf-Knopf gebunden. */
(function(){ if(window.ZSMARA_HINT) return;
const H={ kostuem:['Der im Pelz klingt, als fehlte ihm irgendeine Kleinigkeit. Nicht das große Glück. Das dumme Kleine.','Ich würde ihm nochmal zuhören. Dem Satz ganz am Ende.'],
 akte:['Die Seite sieht aus, als hätte jemand Angst vor Lesern.','Schwärze ist nicht immer für immer. Kommt aufs Papier an.'] };
const NEIN='Nee. Du bist kein Kind. Denk nach.';
const ask=t=>{ const Z=window.ZSN; let L=Z?Z.loop():{flag:{}}; const k='mara_'+t, n=(L.flag[k]||0); L.flag[k]=n+1; if(Z) Z.saveLoop(L); const A=H[t]; return A&&n<A.length?A[n]:NEIN; };
window.ZSMARA_HINT={ask,topics:Object.keys(H),NEIN};
})();
