const text = `Explication
LEÇON 3Ce signal routier indique le début d’une zone cyclable.Dans une zone cyclable, les véhicules à moteur (donc aussi les cyclomoteurs) ne peuvent pas dépasser les cyclistes, speed pedelecs et cycles de moins d’1 m de large.Les autres véhicules peuvent être dépassés s’ils roulent trop lentement.La vitesse maximale autorisée dans une zone cyclable est de 30 km/h.`;

function clean(t) {
    return t
        .replace(/^\s*INFO\s*-\s*PERMIS\s*DE\s*CONDUIRE\s*/i, '')
        .replace(/^\s*Signification\s*:\s*/i, '')
        .replace(/^\s*Explication\s*[:,\-]?\s*/i, '')
        .replace(/^\s*LE(?:Ç|C)ON\s*\d+(?:\s*[–-:]\s*[^.\n]*)?(?:[.\n]\s*)?/i, '')
        .trim();
}

const cleaned = clean(text);
console.log("Original:");
console.log(text);
console.log("\nCleaned:");
console.log(cleaned);
