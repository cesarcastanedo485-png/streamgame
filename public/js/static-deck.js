/* Default deck rows for static hosting (no /api/decks) — mirrors server buildDeck for deckId "default". */
(function (global) {
  var MINOR_NAMES = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "page", "knight", "queen", "king"];
  var SUITS_FOR_KEYS = ["chalices", "pentacles", "wands", "swords"];
  var CARD_KEYS = [];
  for (var i = 0; i < 22; i++) CARD_KEYS.push("major_" + i);
  for (var si = 0; si < SUITS_FOR_KEYS.length; si++) {
    for (var ni = 0; ni < MINOR_NAMES.length; ni++) {
      CARD_KEYS.push(SUITS_FOR_KEYS[si] + "_" + MINOR_NAMES[ni]);
    }
  }

  var MAJOR_FILES_IN_ROOT = [
    "thefool.png.jpg", "themagician.png.jpg", "thehighpriestess.png.jpg", "theempress.png.jpg",
    "theemporer.png.jpg", "thehierophant.png.jpg", "thelovers.png.jpg", "thechariot.png.jpg",
    "strength.jpg", "thehermit.png.jpg", "thewheeloffortune.png.jpg", "justice.png.jpg",
    "thehangedman.png.jpg", "death.png.jpg", "temperance.png.jpg", "thedevil.png.jpg",
    "thetower.png.jpg", "thestar.png.jpg", "themoon.png.jpg", "thesun.png.jpg",
    "judgment.png.jpg", "theworld.png.jpg",
  ];

  var WANDS_BASES = [
    "ace_of_wands", "2_of_wands", "3_of_wands", "4_of_wands", "5_of_wands",
    "6_of_wands", "7_of_wands", "8_of_wands", "9_of_wands", "10_of_wands",
    "page_of_wands", "knight_of_wands", "queen_of_wands", "king_of_wands",
  ];

  function inferSuit(card, index) {
    if (index < 22) return "Major";
    var n = (card.name || "").toLowerCase();
    if (n.indexOf("chalices") !== -1 || n.indexOf("cups") !== -1) return "Cups";
    if (n.indexOf("pentacles") !== -1) return "Pentacles";
    if (n.indexOf("wands") !== -1) return "Wands";
    if (n.indexOf("swords") !== -1) return "Swords";
    return "Major";
  }

  function getWandsFile(i) {
    return WANDS_BASES[i] + ".jpg";
  }

  global.buildStaticDefaultCardRows = function (cardsData) {
    var rawDeck = Array.isArray(cardsData) ? cardsData : cardsData.cards || [];
    var meanings = rawDeck.slice(0, 78);
    return meanings.map(function (c, i) {
      var suit = c.suit || inferSuit(c, i);
      var file = null;
      if (i < 22) file = c.file || MAJOR_FILES_IN_ROOT[i];
      else if (i >= 50 && i < 64) file = c.file || getWandsFile(i - 50);
      return { key: CARD_KEYS[i], name: c.name, file: file, suit: suit };
    });
  };
})(window);
