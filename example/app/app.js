(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// LICENSE : MIT
"use strict";
var input = document.getElementById("js-input"),
    output = document.getElementById("js-output");
var parser = require("../../").parse;
input.addEventListener("keyup", function (event) {
    var value = event.target.value;
    var AST = parser(value);
    output.value = JSON.stringify(AST, null, 4);
});
},{"../../":3}],2:[function(require,module,exports){
// LICENSE : MIT
"use strict";
// Replace key to value mapping
// This is not for Constants.
var exports = {
    "root": "Document",
    "paragraph": "Paragraph",
    "blockquote": "BlockQuote",
    "listItem": "ListItem",
    "list": "List",
    "Bullet": "Bullet", // no need?
    "heading": "Header",
    "code": "CodeBlock",
    "HtmlBlock": "Html",
    "ReferenceDef": "ReferenceDef",
    "thematicBreak": "HorizontalRule",
    // inline block
    'text': 'Str',
    'break': 'Break',
    'emphasis': 'Emphasis',
    'strong': 'Strong',
    'html': 'Html',
    'link': 'Link',
    'image': 'Image',
    'inlineCode': 'Code',
    'yaml': 'Yaml'
};
module.exports = exports;
},{}],3:[function(require,module,exports){
/*eslint-disable */
// LICENSE : MIT

"use strict";
var traverse = require('traverse');
var StructuredSource = require('structured-source');
var debug = require("debug")("markdown-to-ast");
var remarkAbstract = require("remark");
var remark = remarkAbstract();
/**
 * parse markdown text and return ast mapped location info.
 * @param {string} text
 * @returns {TxtNode}
 */
function parse(text) {
    var ast = remark.parse(text);
    var SyntaxMap = require("./mapping/markdown-syntax-map");
    var src = new StructuredSource(text);
    traverse(ast).forEach(function (node) {
        if (this.notLeaf) {
            if (node.type) {
                var replacedType = SyntaxMap[node.type];
                if (!replacedType) {
                    debug("replacedType : " + replacedType + " , node.type: " + node.type);
                } else {
                    node.type = replacedType;
                }
            }
            // map `range`, `loc` and `raw` to node
            if (node.position) {
                var position = node.position;
                var positionCompensated = {
                    start: {line: position.start.line, column: position.start.column - 1},
                    end: {line: position.end.line, column: position.end.column - 1}
                };
                var range = src.locationToRange(positionCompensated);
                node.loc = positionCompensated;
                node.range = range;
                node.raw = text.slice(range[0], range[1]);
                // Compatible for https://github.com/wooorm/unist, but hidden
                Object.defineProperty(node, "position", {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: position
                });

            }
        }
    });
    return ast;
}
module.exports = {
    parse: parse,
    Syntax: require("./union-syntax")
};
},{"./mapping/markdown-syntax-map":2,"./union-syntax":4,"debug":14,"remark":132,"structured-source":138,"traverse":140}],4:[function(require,module,exports){
// LICENSE : MIT
"use strict";
// public key interface
var exports = {
    "Document": "Document", // must
    "Paragraph": "Paragraph",
    "BlockQuote": "BlockQuote",
    "ListItem": "ListItem",
    "List": "List",
    "Header": "Header",
    "CodeBlock": "CodeBlock",
    "HtmlBlock": "HtmlBlock",
    "ReferenceDef": "ReferenceDef",
    "HorizontalRule": "HorizontalRule",
    // inline
    'Str': 'Str', // must
    'Break': 'Break', // must
    'Emphasis': 'Emphasis',
    'Strong': 'Strong',
    'Html': 'Html',
    'Link': 'Link',
    'Image': 'Image',
    'Code': 'Code'
};
module.exports = exports;
},{}],5:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module array-iterate
 * @fileoverview `forEach` with the possibility to change the
 *   next position.
 */

'use strict';

/* Dependencies. */
var has = require('has');

/* Expose. */
module.exports = iterate;

/**
 * `Array#forEach()` with the possibility to change
 * the next position.
 *
 * @param {{length: number}} values - Values.
 * @param {arrayIterate~callback} callback - Callback given to `iterate`.
 * @param {*?} [context] - Context object to use when invoking `callback`.
 */
function iterate(values, callback, context) {
  var index = -1;
  var result;

  if (!values) {
    throw new Error('Iterate requires that |this| not be ' + values);
  }

  if (!has(values, 'length')) {
    throw new Error('Iterate requires that |this| has a `length`');
  }

  if (typeof callback !== 'function') {
    throw new Error('`callback` must be a function');
  }

  /* The length might change, so we do not cache it. */
  while (++index < values.length) {
    /* Skip missing values. */
    if (!(index in values)) {
      continue;
    }

    result = callback.call(context, values[index], index, values);

    /*
     * If `callback` returns a `number`, move `index` over to
     * `number`.
     */

    if (typeof result === 'number') {
      /* Make sure that negative numbers do not break the loop. */
      if (result < 0) {
        index = 0;
      }

      index = result - 1;
    }
  }
}

},{"has":19}],6:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module bail
 * @fileoverview Throw a given error.
 */

'use strict';

/* Expose. */
module.exports = bail;

/**
 * Throw a given error.
 *
 * @example
 *   bail();
 *
 * @example
 *   bail(new Error('failure'));
 *   // Error: failure
 *   //     at repl:1:6
 *   //     at REPLServer.defaultEval (repl.js:154:27)
 *   //     ...
 *
 * @param {Error?} [err] - Optional error.
 * @throws {Error} - `err`, when given.
 */
function bail(err) {
  if (err) {
    throw err;
  }
}

},{}],7:[function(require,module,exports){
"use strict";

/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function compare(v1, v2) {
  return v1 < v2;
}

function upperBound(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var len = array.length;
    var i = 0;

    while (len) {
      var diff = len >>> 1;
      var cursor = i + diff;
      if (comp(value, array[cursor])) {
        len = diff;
      } else {
        i = cursor + 1;
        len -= diff + 1;
      }
    }
    return i;
  })();
}

function lowerBound(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var len = array.length;
    var i = 0;

    while (len) {
      var diff = len >>> 1;
      var cursor = i + diff;
      if (comp(array[cursor], value)) {
        i = cursor + 1;
        len -= diff + 1;
      } else {
        len = diff;
      }
    }
    return i;
  })();
}

function binarySearch(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var cursor = lowerBound(array, value, comp);
    return cursor !== array.length && !comp(value, array[cursor]);
  })();
}

exports.compare = compare;
exports.lowerBound = lowerBound;
exports.upperBound = upperBound;
exports.binarySearch = binarySearch;

},{}],8:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module ccount
 * @fileoverview Count characters.
 */

'use strict';

/* Expose. */
module.exports = ccount;

/**
 * Count how many characters `character` occur in `value`.
 *
 * @example
 *   ccount('foo(bar(baz)', '(') // 2
 *   ccount('foo(bar(baz)', ')') // 1
 *
 * @param {string} value - Content, coerced to string.
 * @param {string} character - Single character to look
 *   for.
 * @return {number} - Count.
 * @throws {Error} - when `character` is not a single
 *   character.
 */
function ccount(value, character) {
  var count = 0;
  var index;

  value = String(value);

  if (typeof character !== 'string' || character.length !== 1) {
    throw new Error('Expected character');
  }

  index = value.indexOf(character);

  while (index !== -1) {
    count++;
    index = value.indexOf(character, index + 1);
  }

  return count;
}

},{}],9:[function(require,module,exports){
module.exports={
  "nbsp": " ",
  "iexcl": "¡",
  "cent": "¢",
  "pound": "£",
  "curren": "¤",
  "yen": "¥",
  "brvbar": "¦",
  "sect": "§",
  "uml": "¨",
  "copy": "©",
  "ordf": "ª",
  "laquo": "«",
  "not": "¬",
  "shy": "­",
  "reg": "®",
  "macr": "¯",
  "deg": "°",
  "plusmn": "±",
  "sup2": "²",
  "sup3": "³",
  "acute": "´",
  "micro": "µ",
  "para": "¶",
  "middot": "·",
  "cedil": "¸",
  "sup1": "¹",
  "ordm": "º",
  "raquo": "»",
  "frac14": "¼",
  "frac12": "½",
  "frac34": "¾",
  "iquest": "¿",
  "Agrave": "À",
  "Aacute": "Á",
  "Acirc": "Â",
  "Atilde": "Ã",
  "Auml": "Ä",
  "Aring": "Å",
  "AElig": "Æ",
  "Ccedil": "Ç",
  "Egrave": "È",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Euml": "Ë",
  "Igrave": "Ì",
  "Iacute": "Í",
  "Icirc": "Î",
  "Iuml": "Ï",
  "ETH": "Ð",
  "Ntilde": "Ñ",
  "Ograve": "Ò",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "times": "×",
  "Oslash": "Ø",
  "Ugrave": "Ù",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "THORN": "Þ",
  "szlig": "ß",
  "agrave": "à",
  "aacute": "á",
  "acirc": "â",
  "atilde": "ã",
  "auml": "ä",
  "aring": "å",
  "aelig": "æ",
  "ccedil": "ç",
  "egrave": "è",
  "eacute": "é",
  "ecirc": "ê",
  "euml": "ë",
  "igrave": "ì",
  "iacute": "í",
  "icirc": "î",
  "iuml": "ï",
  "eth": "ð",
  "ntilde": "ñ",
  "ograve": "ò",
  "oacute": "ó",
  "ocirc": "ô",
  "otilde": "õ",
  "ouml": "ö",
  "divide": "÷",
  "oslash": "ø",
  "ugrave": "ù",
  "uacute": "ú",
  "ucirc": "û",
  "uuml": "ü",
  "yacute": "ý",
  "thorn": "þ",
  "yuml": "ÿ",
  "fnof": "ƒ",
  "Alpha": "Α",
  "Beta": "Β",
  "Gamma": "Γ",
  "Delta": "Δ",
  "Epsilon": "Ε",
  "Zeta": "Ζ",
  "Eta": "Η",
  "Theta": "Θ",
  "Iota": "Ι",
  "Kappa": "Κ",
  "Lambda": "Λ",
  "Mu": "Μ",
  "Nu": "Ν",
  "Xi": "Ξ",
  "Omicron": "Ο",
  "Pi": "Π",
  "Rho": "Ρ",
  "Sigma": "Σ",
  "Tau": "Τ",
  "Upsilon": "Υ",
  "Phi": "Φ",
  "Chi": "Χ",
  "Psi": "Ψ",
  "Omega": "Ω",
  "alpha": "α",
  "beta": "β",
  "gamma": "γ",
  "delta": "δ",
  "epsilon": "ε",
  "zeta": "ζ",
  "eta": "η",
  "theta": "θ",
  "iota": "ι",
  "kappa": "κ",
  "lambda": "λ",
  "mu": "μ",
  "nu": "ν",
  "xi": "ξ",
  "omicron": "ο",
  "pi": "π",
  "rho": "ρ",
  "sigmaf": "ς",
  "sigma": "σ",
  "tau": "τ",
  "upsilon": "υ",
  "phi": "φ",
  "chi": "χ",
  "psi": "ψ",
  "omega": "ω",
  "thetasym": "ϑ",
  "upsih": "ϒ",
  "piv": "ϖ",
  "bull": "•",
  "hellip": "…",
  "prime": "′",
  "Prime": "″",
  "oline": "‾",
  "frasl": "⁄",
  "weierp": "℘",
  "image": "ℑ",
  "real": "ℜ",
  "trade": "™",
  "alefsym": "ℵ",
  "larr": "←",
  "uarr": "↑",
  "rarr": "→",
  "darr": "↓",
  "harr": "↔",
  "crarr": "↵",
  "lArr": "⇐",
  "uArr": "⇑",
  "rArr": "⇒",
  "dArr": "⇓",
  "hArr": "⇔",
  "forall": "∀",
  "part": "∂",
  "exist": "∃",
  "empty": "∅",
  "nabla": "∇",
  "isin": "∈",
  "notin": "∉",
  "ni": "∋",
  "prod": "∏",
  "sum": "∑",
  "minus": "−",
  "lowast": "∗",
  "radic": "√",
  "prop": "∝",
  "infin": "∞",
  "ang": "∠",
  "and": "∧",
  "or": "∨",
  "cap": "∩",
  "cup": "∪",
  "int": "∫",
  "there4": "∴",
  "sim": "∼",
  "cong": "≅",
  "asymp": "≈",
  "ne": "≠",
  "equiv": "≡",
  "le": "≤",
  "ge": "≥",
  "sub": "⊂",
  "sup": "⊃",
  "nsub": "⊄",
  "sube": "⊆",
  "supe": "⊇",
  "oplus": "⊕",
  "otimes": "⊗",
  "perp": "⊥",
  "sdot": "⋅",
  "lceil": "⌈",
  "rceil": "⌉",
  "lfloor": "⌊",
  "rfloor": "⌋",
  "lang": "〈",
  "rang": "〉",
  "loz": "◊",
  "spades": "♠",
  "clubs": "♣",
  "hearts": "♥",
  "diams": "♦",
  "quot": "\"",
  "amp": "&",
  "lt": "<",
  "gt": ">",
  "OElig": "Œ",
  "oelig": "œ",
  "Scaron": "Š",
  "scaron": "š",
  "Yuml": "Ÿ",
  "circ": "ˆ",
  "tilde": "˜",
  "ensp": " ",
  "emsp": " ",
  "thinsp": " ",
  "zwnj": "‌",
  "zwj": "‍",
  "lrm": "‎",
  "rlm": "‏",
  "ndash": "–",
  "mdash": "—",
  "lsquo": "‘",
  "rsquo": "’",
  "sbquo": "‚",
  "ldquo": "“",
  "rdquo": "”",
  "bdquo": "„",
  "dagger": "†",
  "Dagger": "‡",
  "permil": "‰",
  "lsaquo": "‹",
  "rsaquo": "›",
  "euro": "€"
}

},{}],10:[function(require,module,exports){
module.exports={
  "AElig": "Æ",
  "AMP": "&",
  "Aacute": "Á",
  "Acirc": "Â",
  "Agrave": "À",
  "Aring": "Å",
  "Atilde": "Ã",
  "Auml": "Ä",
  "COPY": "©",
  "Ccedil": "Ç",
  "ETH": "Ð",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Egrave": "È",
  "Euml": "Ë",
  "GT": ">",
  "Iacute": "Í",
  "Icirc": "Î",
  "Igrave": "Ì",
  "Iuml": "Ï",
  "LT": "<",
  "Ntilde": "Ñ",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Ograve": "Ò",
  "Oslash": "Ø",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "QUOT": "\"",
  "REG": "®",
  "THORN": "Þ",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Ugrave": "Ù",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "aacute": "á",
  "acirc": "â",
  "acute": "´",
  "aelig": "æ",
  "agrave": "à",
  "amp": "&",
  "aring": "å",
  "atilde": "ã",
  "auml": "ä",
  "brvbar": "¦",
  "ccedil": "ç",
  "cedil": "¸",
  "cent": "¢",
  "copy": "©",
  "curren": "¤",
  "deg": "°",
  "divide": "÷",
  "eacute": "é",
  "ecirc": "ê",
  "egrave": "è",
  "eth": "ð",
  "euml": "ë",
  "frac12": "½",
  "frac14": "¼",
  "frac34": "¾",
  "gt": ">",
  "iacute": "í",
  "icirc": "î",
  "iexcl": "¡",
  "igrave": "ì",
  "iquest": "¿",
  "iuml": "ï",
  "laquo": "«",
  "lt": "<",
  "macr": "¯",
  "micro": "µ",
  "middot": "·",
  "nbsp": " ",
  "not": "¬",
  "ntilde": "ñ",
  "oacute": "ó",
  "ocirc": "ô",
  "ograve": "ò",
  "ordf": "ª",
  "ordm": "º",
  "oslash": "ø",
  "otilde": "õ",
  "ouml": "ö",
  "para": "¶",
  "plusmn": "±",
  "pound": "£",
  "quot": "\"",
  "raquo": "»",
  "reg": "®",
  "sect": "§",
  "shy": "­",
  "sup1": "¹",
  "sup2": "²",
  "sup3": "³",
  "szlig": "ß",
  "thorn": "þ",
  "times": "×",
  "uacute": "ú",
  "ucirc": "û",
  "ugrave": "ù",
  "uml": "¨",
  "uuml": "ü",
  "yacute": "ý",
  "yen": "¥",
  "yuml": "ÿ"
}

},{}],11:[function(require,module,exports){
module.exports={
  "AEli": "Æ",
  "AElig": "Æ",
  "AM": "&",
  "AMP": "&",
  "Aacut": "Á",
  "Aacute": "Á",
  "Abreve": "Ă",
  "Acir": "Â",
  "Acirc": "Â",
  "Acy": "А",
  "Afr": "𝔄",
  "Agrav": "À",
  "Agrave": "À",
  "Alpha": "Α",
  "Amacr": "Ā",
  "And": "⩓",
  "Aogon": "Ą",
  "Aopf": "𝔸",
  "ApplyFunction": "⁡",
  "Arin": "Å",
  "Aring": "Å",
  "Ascr": "𝒜",
  "Assign": "≔",
  "Atild": "Ã",
  "Atilde": "Ã",
  "Aum": "Ä",
  "Auml": "Ä",
  "Backslash": "∖",
  "Barv": "⫧",
  "Barwed": "⌆",
  "Bcy": "Б",
  "Because": "∵",
  "Bernoullis": "ℬ",
  "Beta": "Β",
  "Bfr": "𝔅",
  "Bopf": "𝔹",
  "Breve": "˘",
  "Bscr": "ℬ",
  "Bumpeq": "≎",
  "CHcy": "Ч",
  "COP": "©",
  "COPY": "©",
  "Cacute": "Ć",
  "Cap": "⋒",
  "CapitalDifferentialD": "ⅅ",
  "Cayleys": "ℭ",
  "Ccaron": "Č",
  "Ccedi": "Ç",
  "Ccedil": "Ç",
  "Ccirc": "Ĉ",
  "Cconint": "∰",
  "Cdot": "Ċ",
  "Cedilla": "¸",
  "CenterDot": "·",
  "Cfr": "ℭ",
  "Chi": "Χ",
  "CircleDot": "⊙",
  "CircleMinus": "⊖",
  "CirclePlus": "⊕",
  "CircleTimes": "⊗",
  "ClockwiseContourIntegral": "∲",
  "CloseCurlyDoubleQuote": "”",
  "CloseCurlyQuote": "’",
  "Colon": "∷",
  "Colone": "⩴",
  "Congruent": "≡",
  "Conint": "∯",
  "ContourIntegral": "∮",
  "Copf": "ℂ",
  "Coproduct": "∐",
  "CounterClockwiseContourIntegral": "∳",
  "Cross": "⨯",
  "Cscr": "𝒞",
  "Cup": "⋓",
  "CupCap": "≍",
  "DD": "ⅅ",
  "DDotrahd": "⤑",
  "DJcy": "Ђ",
  "DScy": "Ѕ",
  "DZcy": "Џ",
  "Dagger": "‡",
  "Darr": "↡",
  "Dashv": "⫤",
  "Dcaron": "Ď",
  "Dcy": "Д",
  "Del": "∇",
  "Delta": "Δ",
  "Dfr": "𝔇",
  "DiacriticalAcute": "´",
  "DiacriticalDot": "˙",
  "DiacriticalDoubleAcute": "˝",
  "DiacriticalGrave": "`",
  "DiacriticalTilde": "˜",
  "Diamond": "⋄",
  "DifferentialD": "ⅆ",
  "Dopf": "𝔻",
  "Dot": "¨",
  "DotDot": "⃜",
  "DotEqual": "≐",
  "DoubleContourIntegral": "∯",
  "DoubleDot": "¨",
  "DoubleDownArrow": "⇓",
  "DoubleLeftArrow": "⇐",
  "DoubleLeftRightArrow": "⇔",
  "DoubleLeftTee": "⫤",
  "DoubleLongLeftArrow": "⟸",
  "DoubleLongLeftRightArrow": "⟺",
  "DoubleLongRightArrow": "⟹",
  "DoubleRightArrow": "⇒",
  "DoubleRightTee": "⊨",
  "DoubleUpArrow": "⇑",
  "DoubleUpDownArrow": "⇕",
  "DoubleVerticalBar": "∥",
  "DownArrow": "↓",
  "DownArrowBar": "⤓",
  "DownArrowUpArrow": "⇵",
  "DownBreve": "̑",
  "DownLeftRightVector": "⥐",
  "DownLeftTeeVector": "⥞",
  "DownLeftVector": "↽",
  "DownLeftVectorBar": "⥖",
  "DownRightTeeVector": "⥟",
  "DownRightVector": "⇁",
  "DownRightVectorBar": "⥗",
  "DownTee": "⊤",
  "DownTeeArrow": "↧",
  "Downarrow": "⇓",
  "Dscr": "𝒟",
  "Dstrok": "Đ",
  "ENG": "Ŋ",
  "ET": "Ð",
  "ETH": "Ð",
  "Eacut": "É",
  "Eacute": "É",
  "Ecaron": "Ě",
  "Ecir": "Ê",
  "Ecirc": "Ê",
  "Ecy": "Э",
  "Edot": "Ė",
  "Efr": "𝔈",
  "Egrav": "È",
  "Egrave": "È",
  "Element": "∈",
  "Emacr": "Ē",
  "EmptySmallSquare": "◻",
  "EmptyVerySmallSquare": "▫",
  "Eogon": "Ę",
  "Eopf": "𝔼",
  "Epsilon": "Ε",
  "Equal": "⩵",
  "EqualTilde": "≂",
  "Equilibrium": "⇌",
  "Escr": "ℰ",
  "Esim": "⩳",
  "Eta": "Η",
  "Eum": "Ë",
  "Euml": "Ë",
  "Exists": "∃",
  "ExponentialE": "ⅇ",
  "Fcy": "Ф",
  "Ffr": "𝔉",
  "FilledSmallSquare": "◼",
  "FilledVerySmallSquare": "▪",
  "Fopf": "𝔽",
  "ForAll": "∀",
  "Fouriertrf": "ℱ",
  "Fscr": "ℱ",
  "GJcy": "Ѓ",
  "G": ">",
  "GT": ">",
  "Gamma": "Γ",
  "Gammad": "Ϝ",
  "Gbreve": "Ğ",
  "Gcedil": "Ģ",
  "Gcirc": "Ĝ",
  "Gcy": "Г",
  "Gdot": "Ġ",
  "Gfr": "𝔊",
  "Gg": "⋙",
  "Gopf": "𝔾",
  "GreaterEqual": "≥",
  "GreaterEqualLess": "⋛",
  "GreaterFullEqual": "≧",
  "GreaterGreater": "⪢",
  "GreaterLess": "≷",
  "GreaterSlantEqual": "⩾",
  "GreaterTilde": "≳",
  "Gscr": "𝒢",
  "Gt": "≫",
  "HARDcy": "Ъ",
  "Hacek": "ˇ",
  "Hat": "^",
  "Hcirc": "Ĥ",
  "Hfr": "ℌ",
  "HilbertSpace": "ℋ",
  "Hopf": "ℍ",
  "HorizontalLine": "─",
  "Hscr": "ℋ",
  "Hstrok": "Ħ",
  "HumpDownHump": "≎",
  "HumpEqual": "≏",
  "IEcy": "Е",
  "IJlig": "Ĳ",
  "IOcy": "Ё",
  "Iacut": "Í",
  "Iacute": "Í",
  "Icir": "Î",
  "Icirc": "Î",
  "Icy": "И",
  "Idot": "İ",
  "Ifr": "ℑ",
  "Igrav": "Ì",
  "Igrave": "Ì",
  "Im": "ℑ",
  "Imacr": "Ī",
  "ImaginaryI": "ⅈ",
  "Implies": "⇒",
  "Int": "∬",
  "Integral": "∫",
  "Intersection": "⋂",
  "InvisibleComma": "⁣",
  "InvisibleTimes": "⁢",
  "Iogon": "Į",
  "Iopf": "𝕀",
  "Iota": "Ι",
  "Iscr": "ℐ",
  "Itilde": "Ĩ",
  "Iukcy": "І",
  "Ium": "Ï",
  "Iuml": "Ï",
  "Jcirc": "Ĵ",
  "Jcy": "Й",
  "Jfr": "𝔍",
  "Jopf": "𝕁",
  "Jscr": "𝒥",
  "Jsercy": "Ј",
  "Jukcy": "Є",
  "KHcy": "Х",
  "KJcy": "Ќ",
  "Kappa": "Κ",
  "Kcedil": "Ķ",
  "Kcy": "К",
  "Kfr": "𝔎",
  "Kopf": "𝕂",
  "Kscr": "𝒦",
  "LJcy": "Љ",
  "L": "<",
  "LT": "<",
  "Lacute": "Ĺ",
  "Lambda": "Λ",
  "Lang": "⟪",
  "Laplacetrf": "ℒ",
  "Larr": "↞",
  "Lcaron": "Ľ",
  "Lcedil": "Ļ",
  "Lcy": "Л",
  "LeftAngleBracket": "⟨",
  "LeftArrow": "←",
  "LeftArrowBar": "⇤",
  "LeftArrowRightArrow": "⇆",
  "LeftCeiling": "⌈",
  "LeftDoubleBracket": "⟦",
  "LeftDownTeeVector": "⥡",
  "LeftDownVector": "⇃",
  "LeftDownVectorBar": "⥙",
  "LeftFloor": "⌊",
  "LeftRightArrow": "↔",
  "LeftRightVector": "⥎",
  "LeftTee": "⊣",
  "LeftTeeArrow": "↤",
  "LeftTeeVector": "⥚",
  "LeftTriangle": "⊲",
  "LeftTriangleBar": "⧏",
  "LeftTriangleEqual": "⊴",
  "LeftUpDownVector": "⥑",
  "LeftUpTeeVector": "⥠",
  "LeftUpVector": "↿",
  "LeftUpVectorBar": "⥘",
  "LeftVector": "↼",
  "LeftVectorBar": "⥒",
  "Leftarrow": "⇐",
  "Leftrightarrow": "⇔",
  "LessEqualGreater": "⋚",
  "LessFullEqual": "≦",
  "LessGreater": "≶",
  "LessLess": "⪡",
  "LessSlantEqual": "⩽",
  "LessTilde": "≲",
  "Lfr": "𝔏",
  "Ll": "⋘",
  "Lleftarrow": "⇚",
  "Lmidot": "Ŀ",
  "LongLeftArrow": "⟵",
  "LongLeftRightArrow": "⟷",
  "LongRightArrow": "⟶",
  "Longleftarrow": "⟸",
  "Longleftrightarrow": "⟺",
  "Longrightarrow": "⟹",
  "Lopf": "𝕃",
  "LowerLeftArrow": "↙",
  "LowerRightArrow": "↘",
  "Lscr": "ℒ",
  "Lsh": "↰",
  "Lstrok": "Ł",
  "Lt": "≪",
  "Map": "⤅",
  "Mcy": "М",
  "MediumSpace": " ",
  "Mellintrf": "ℳ",
  "Mfr": "𝔐",
  "MinusPlus": "∓",
  "Mopf": "𝕄",
  "Mscr": "ℳ",
  "Mu": "Μ",
  "NJcy": "Њ",
  "Nacute": "Ń",
  "Ncaron": "Ň",
  "Ncedil": "Ņ",
  "Ncy": "Н",
  "NegativeMediumSpace": "​",
  "NegativeThickSpace": "​",
  "NegativeThinSpace": "​",
  "NegativeVeryThinSpace": "​",
  "NestedGreaterGreater": "≫",
  "NestedLessLess": "≪",
  "NewLine": "\n",
  "Nfr": "𝔑",
  "NoBreak": "⁠",
  "NonBreakingSpace": " ",
  "Nopf": "ℕ",
  "Not": "⫬",
  "NotCongruent": "≢",
  "NotCupCap": "≭",
  "NotDoubleVerticalBar": "∦",
  "NotElement": "∉",
  "NotEqual": "≠",
  "NotEqualTilde": "≂̸",
  "NotExists": "∄",
  "NotGreater": "≯",
  "NotGreaterEqual": "≱",
  "NotGreaterFullEqual": "≧̸",
  "NotGreaterGreater": "≫̸",
  "NotGreaterLess": "≹",
  "NotGreaterSlantEqual": "⩾̸",
  "NotGreaterTilde": "≵",
  "NotHumpDownHump": "≎̸",
  "NotHumpEqual": "≏̸",
  "NotLeftTriangle": "⋪",
  "NotLeftTriangleBar": "⧏̸",
  "NotLeftTriangleEqual": "⋬",
  "NotLess": "≮",
  "NotLessEqual": "≰",
  "NotLessGreater": "≸",
  "NotLessLess": "≪̸",
  "NotLessSlantEqual": "⩽̸",
  "NotLessTilde": "≴",
  "NotNestedGreaterGreater": "⪢̸",
  "NotNestedLessLess": "⪡̸",
  "NotPrecedes": "⊀",
  "NotPrecedesEqual": "⪯̸",
  "NotPrecedesSlantEqual": "⋠",
  "NotReverseElement": "∌",
  "NotRightTriangle": "⋫",
  "NotRightTriangleBar": "⧐̸",
  "NotRightTriangleEqual": "⋭",
  "NotSquareSubset": "⊏̸",
  "NotSquareSubsetEqual": "⋢",
  "NotSquareSuperset": "⊐̸",
  "NotSquareSupersetEqual": "⋣",
  "NotSubset": "⊂⃒",
  "NotSubsetEqual": "⊈",
  "NotSucceeds": "⊁",
  "NotSucceedsEqual": "⪰̸",
  "NotSucceedsSlantEqual": "⋡",
  "NotSucceedsTilde": "≿̸",
  "NotSuperset": "⊃⃒",
  "NotSupersetEqual": "⊉",
  "NotTilde": "≁",
  "NotTildeEqual": "≄",
  "NotTildeFullEqual": "≇",
  "NotTildeTilde": "≉",
  "NotVerticalBar": "∤",
  "Nscr": "𝒩",
  "Ntild": "Ñ",
  "Ntilde": "Ñ",
  "Nu": "Ν",
  "OElig": "Œ",
  "Oacut": "Ó",
  "Oacute": "Ó",
  "Ocir": "Ô",
  "Ocirc": "Ô",
  "Ocy": "О",
  "Odblac": "Ő",
  "Ofr": "𝔒",
  "Ograv": "Ò",
  "Ograve": "Ò",
  "Omacr": "Ō",
  "Omega": "Ω",
  "Omicron": "Ο",
  "Oopf": "𝕆",
  "OpenCurlyDoubleQuote": "“",
  "OpenCurlyQuote": "‘",
  "Or": "⩔",
  "Oscr": "𝒪",
  "Oslas": "Ø",
  "Oslash": "Ø",
  "Otild": "Õ",
  "Otilde": "Õ",
  "Otimes": "⨷",
  "Oum": "Ö",
  "Ouml": "Ö",
  "OverBar": "‾",
  "OverBrace": "⏞",
  "OverBracket": "⎴",
  "OverParenthesis": "⏜",
  "PartialD": "∂",
  "Pcy": "П",
  "Pfr": "𝔓",
  "Phi": "Φ",
  "Pi": "Π",
  "PlusMinus": "±",
  "Poincareplane": "ℌ",
  "Popf": "ℙ",
  "Pr": "⪻",
  "Precedes": "≺",
  "PrecedesEqual": "⪯",
  "PrecedesSlantEqual": "≼",
  "PrecedesTilde": "≾",
  "Prime": "″",
  "Product": "∏",
  "Proportion": "∷",
  "Proportional": "∝",
  "Pscr": "𝒫",
  "Psi": "Ψ",
  "QUO": "\"",
  "QUOT": "\"",
  "Qfr": "𝔔",
  "Qopf": "ℚ",
  "Qscr": "𝒬",
  "RBarr": "⤐",
  "RE": "®",
  "REG": "®",
  "Racute": "Ŕ",
  "Rang": "⟫",
  "Rarr": "↠",
  "Rarrtl": "⤖",
  "Rcaron": "Ř",
  "Rcedil": "Ŗ",
  "Rcy": "Р",
  "Re": "ℜ",
  "ReverseElement": "∋",
  "ReverseEquilibrium": "⇋",
  "ReverseUpEquilibrium": "⥯",
  "Rfr": "ℜ",
  "Rho": "Ρ",
  "RightAngleBracket": "⟩",
  "RightArrow": "→",
  "RightArrowBar": "⇥",
  "RightArrowLeftArrow": "⇄",
  "RightCeiling": "⌉",
  "RightDoubleBracket": "⟧",
  "RightDownTeeVector": "⥝",
  "RightDownVector": "⇂",
  "RightDownVectorBar": "⥕",
  "RightFloor": "⌋",
  "RightTee": "⊢",
  "RightTeeArrow": "↦",
  "RightTeeVector": "⥛",
  "RightTriangle": "⊳",
  "RightTriangleBar": "⧐",
  "RightTriangleEqual": "⊵",
  "RightUpDownVector": "⥏",
  "RightUpTeeVector": "⥜",
  "RightUpVector": "↾",
  "RightUpVectorBar": "⥔",
  "RightVector": "⇀",
  "RightVectorBar": "⥓",
  "Rightarrow": "⇒",
  "Ropf": "ℝ",
  "RoundImplies": "⥰",
  "Rrightarrow": "⇛",
  "Rscr": "ℛ",
  "Rsh": "↱",
  "RuleDelayed": "⧴",
  "SHCHcy": "Щ",
  "SHcy": "Ш",
  "SOFTcy": "Ь",
  "Sacute": "Ś",
  "Sc": "⪼",
  "Scaron": "Š",
  "Scedil": "Ş",
  "Scirc": "Ŝ",
  "Scy": "С",
  "Sfr": "𝔖",
  "ShortDownArrow": "↓",
  "ShortLeftArrow": "←",
  "ShortRightArrow": "→",
  "ShortUpArrow": "↑",
  "Sigma": "Σ",
  "SmallCircle": "∘",
  "Sopf": "𝕊",
  "Sqrt": "√",
  "Square": "□",
  "SquareIntersection": "⊓",
  "SquareSubset": "⊏",
  "SquareSubsetEqual": "⊑",
  "SquareSuperset": "⊐",
  "SquareSupersetEqual": "⊒",
  "SquareUnion": "⊔",
  "Sscr": "𝒮",
  "Star": "⋆",
  "Sub": "⋐",
  "Subset": "⋐",
  "SubsetEqual": "⊆",
  "Succeeds": "≻",
  "SucceedsEqual": "⪰",
  "SucceedsSlantEqual": "≽",
  "SucceedsTilde": "≿",
  "SuchThat": "∋",
  "Sum": "∑",
  "Sup": "⋑",
  "Superset": "⊃",
  "SupersetEqual": "⊇",
  "Supset": "⋑",
  "THOR": "Þ",
  "THORN": "Þ",
  "TRADE": "™",
  "TSHcy": "Ћ",
  "TScy": "Ц",
  "Tab": "\t",
  "Tau": "Τ",
  "Tcaron": "Ť",
  "Tcedil": "Ţ",
  "Tcy": "Т",
  "Tfr": "𝔗",
  "Therefore": "∴",
  "Theta": "Θ",
  "ThickSpace": "  ",
  "ThinSpace": " ",
  "Tilde": "∼",
  "TildeEqual": "≃",
  "TildeFullEqual": "≅",
  "TildeTilde": "≈",
  "Topf": "𝕋",
  "TripleDot": "⃛",
  "Tscr": "𝒯",
  "Tstrok": "Ŧ",
  "Uacut": "Ú",
  "Uacute": "Ú",
  "Uarr": "↟",
  "Uarrocir": "⥉",
  "Ubrcy": "Ў",
  "Ubreve": "Ŭ",
  "Ucir": "Û",
  "Ucirc": "Û",
  "Ucy": "У",
  "Udblac": "Ű",
  "Ufr": "𝔘",
  "Ugrav": "Ù",
  "Ugrave": "Ù",
  "Umacr": "Ū",
  "UnderBar": "_",
  "UnderBrace": "⏟",
  "UnderBracket": "⎵",
  "UnderParenthesis": "⏝",
  "Union": "⋃",
  "UnionPlus": "⊎",
  "Uogon": "Ų",
  "Uopf": "𝕌",
  "UpArrow": "↑",
  "UpArrowBar": "⤒",
  "UpArrowDownArrow": "⇅",
  "UpDownArrow": "↕",
  "UpEquilibrium": "⥮",
  "UpTee": "⊥",
  "UpTeeArrow": "↥",
  "Uparrow": "⇑",
  "Updownarrow": "⇕",
  "UpperLeftArrow": "↖",
  "UpperRightArrow": "↗",
  "Upsi": "ϒ",
  "Upsilon": "Υ",
  "Uring": "Ů",
  "Uscr": "𝒰",
  "Utilde": "Ũ",
  "Uum": "Ü",
  "Uuml": "Ü",
  "VDash": "⊫",
  "Vbar": "⫫",
  "Vcy": "В",
  "Vdash": "⊩",
  "Vdashl": "⫦",
  "Vee": "⋁",
  "Verbar": "‖",
  "Vert": "‖",
  "VerticalBar": "∣",
  "VerticalLine": "|",
  "VerticalSeparator": "❘",
  "VerticalTilde": "≀",
  "VeryThinSpace": " ",
  "Vfr": "𝔙",
  "Vopf": "𝕍",
  "Vscr": "𝒱",
  "Vvdash": "⊪",
  "Wcirc": "Ŵ",
  "Wedge": "⋀",
  "Wfr": "𝔚",
  "Wopf": "𝕎",
  "Wscr": "𝒲",
  "Xfr": "𝔛",
  "Xi": "Ξ",
  "Xopf": "𝕏",
  "Xscr": "𝒳",
  "YAcy": "Я",
  "YIcy": "Ї",
  "YUcy": "Ю",
  "Yacut": "Ý",
  "Yacute": "Ý",
  "Ycirc": "Ŷ",
  "Ycy": "Ы",
  "Yfr": "𝔜",
  "Yopf": "𝕐",
  "Yscr": "𝒴",
  "Yuml": "Ÿ",
  "ZHcy": "Ж",
  "Zacute": "Ź",
  "Zcaron": "Ž",
  "Zcy": "З",
  "Zdot": "Ż",
  "ZeroWidthSpace": "​",
  "Zeta": "Ζ",
  "Zfr": "ℨ",
  "Zopf": "ℤ",
  "Zscr": "𝒵",
  "aacut": "á",
  "aacute": "á",
  "abreve": "ă",
  "ac": "∾",
  "acE": "∾̳",
  "acd": "∿",
  "acir": "â",
  "acirc": "â",
  "acut": "´",
  "acute": "´",
  "acy": "а",
  "aeli": "æ",
  "aelig": "æ",
  "af": "⁡",
  "afr": "𝔞",
  "agrav": "à",
  "agrave": "à",
  "alefsym": "ℵ",
  "aleph": "ℵ",
  "alpha": "α",
  "amacr": "ā",
  "amalg": "⨿",
  "am": "&",
  "amp": "&",
  "and": "∧",
  "andand": "⩕",
  "andd": "⩜",
  "andslope": "⩘",
  "andv": "⩚",
  "ang": "∠",
  "ange": "⦤",
  "angle": "∠",
  "angmsd": "∡",
  "angmsdaa": "⦨",
  "angmsdab": "⦩",
  "angmsdac": "⦪",
  "angmsdad": "⦫",
  "angmsdae": "⦬",
  "angmsdaf": "⦭",
  "angmsdag": "⦮",
  "angmsdah": "⦯",
  "angrt": "∟",
  "angrtvb": "⊾",
  "angrtvbd": "⦝",
  "angsph": "∢",
  "angst": "Å",
  "angzarr": "⍼",
  "aogon": "ą",
  "aopf": "𝕒",
  "ap": "≈",
  "apE": "⩰",
  "apacir": "⩯",
  "ape": "≊",
  "apid": "≋",
  "apos": "'",
  "approx": "≈",
  "approxeq": "≊",
  "arin": "å",
  "aring": "å",
  "ascr": "𝒶",
  "ast": "*",
  "asymp": "≈",
  "asympeq": "≍",
  "atild": "ã",
  "atilde": "ã",
  "aum": "ä",
  "auml": "ä",
  "awconint": "∳",
  "awint": "⨑",
  "bNot": "⫭",
  "backcong": "≌",
  "backepsilon": "϶",
  "backprime": "‵",
  "backsim": "∽",
  "backsimeq": "⋍",
  "barvee": "⊽",
  "barwed": "⌅",
  "barwedge": "⌅",
  "bbrk": "⎵",
  "bbrktbrk": "⎶",
  "bcong": "≌",
  "bcy": "б",
  "bdquo": "„",
  "becaus": "∵",
  "because": "∵",
  "bemptyv": "⦰",
  "bepsi": "϶",
  "bernou": "ℬ",
  "beta": "β",
  "beth": "ℶ",
  "between": "≬",
  "bfr": "𝔟",
  "bigcap": "⋂",
  "bigcirc": "◯",
  "bigcup": "⋃",
  "bigodot": "⨀",
  "bigoplus": "⨁",
  "bigotimes": "⨂",
  "bigsqcup": "⨆",
  "bigstar": "★",
  "bigtriangledown": "▽",
  "bigtriangleup": "△",
  "biguplus": "⨄",
  "bigvee": "⋁",
  "bigwedge": "⋀",
  "bkarow": "⤍",
  "blacklozenge": "⧫",
  "blacksquare": "▪",
  "blacktriangle": "▴",
  "blacktriangledown": "▾",
  "blacktriangleleft": "◂",
  "blacktriangleright": "▸",
  "blank": "␣",
  "blk12": "▒",
  "blk14": "░",
  "blk34": "▓",
  "block": "█",
  "bne": "=⃥",
  "bnequiv": "≡⃥",
  "bnot": "⌐",
  "bopf": "𝕓",
  "bot": "⊥",
  "bottom": "⊥",
  "bowtie": "⋈",
  "boxDL": "╗",
  "boxDR": "╔",
  "boxDl": "╖",
  "boxDr": "╓",
  "boxH": "═",
  "boxHD": "╦",
  "boxHU": "╩",
  "boxHd": "╤",
  "boxHu": "╧",
  "boxUL": "╝",
  "boxUR": "╚",
  "boxUl": "╜",
  "boxUr": "╙",
  "boxV": "║",
  "boxVH": "╬",
  "boxVL": "╣",
  "boxVR": "╠",
  "boxVh": "╫",
  "boxVl": "╢",
  "boxVr": "╟",
  "boxbox": "⧉",
  "boxdL": "╕",
  "boxdR": "╒",
  "boxdl": "┐",
  "boxdr": "┌",
  "boxh": "─",
  "boxhD": "╥",
  "boxhU": "╨",
  "boxhd": "┬",
  "boxhu": "┴",
  "boxminus": "⊟",
  "boxplus": "⊞",
  "boxtimes": "⊠",
  "boxuL": "╛",
  "boxuR": "╘",
  "boxul": "┘",
  "boxur": "└",
  "boxv": "│",
  "boxvH": "╪",
  "boxvL": "╡",
  "boxvR": "╞",
  "boxvh": "┼",
  "boxvl": "┤",
  "boxvr": "├",
  "bprime": "‵",
  "breve": "˘",
  "brvba": "¦",
  "brvbar": "¦",
  "bscr": "𝒷",
  "bsemi": "⁏",
  "bsim": "∽",
  "bsime": "⋍",
  "bsol": "\\",
  "bsolb": "⧅",
  "bsolhsub": "⟈",
  "bull": "•",
  "bullet": "•",
  "bump": "≎",
  "bumpE": "⪮",
  "bumpe": "≏",
  "bumpeq": "≏",
  "cacute": "ć",
  "cap": "∩",
  "capand": "⩄",
  "capbrcup": "⩉",
  "capcap": "⩋",
  "capcup": "⩇",
  "capdot": "⩀",
  "caps": "∩︀",
  "caret": "⁁",
  "caron": "ˇ",
  "ccaps": "⩍",
  "ccaron": "č",
  "ccedi": "ç",
  "ccedil": "ç",
  "ccirc": "ĉ",
  "ccups": "⩌",
  "ccupssm": "⩐",
  "cdot": "ċ",
  "cedi": "¸",
  "cedil": "¸",
  "cemptyv": "⦲",
  "cen": "¢",
  "cent": "¢",
  "centerdot": "·",
  "cfr": "𝔠",
  "chcy": "ч",
  "check": "✓",
  "checkmark": "✓",
  "chi": "χ",
  "cir": "○",
  "cirE": "⧃",
  "circ": "ˆ",
  "circeq": "≗",
  "circlearrowleft": "↺",
  "circlearrowright": "↻",
  "circledR": "®",
  "circledS": "Ⓢ",
  "circledast": "⊛",
  "circledcirc": "⊚",
  "circleddash": "⊝",
  "cire": "≗",
  "cirfnint": "⨐",
  "cirmid": "⫯",
  "cirscir": "⧂",
  "clubs": "♣",
  "clubsuit": "♣",
  "colon": ":",
  "colone": "≔",
  "coloneq": "≔",
  "comma": ",",
  "commat": "@",
  "comp": "∁",
  "compfn": "∘",
  "complement": "∁",
  "complexes": "ℂ",
  "cong": "≅",
  "congdot": "⩭",
  "conint": "∮",
  "copf": "𝕔",
  "coprod": "∐",
  "cop": "©",
  "copy": "©",
  "copysr": "℗",
  "crarr": "↵",
  "cross": "✗",
  "cscr": "𝒸",
  "csub": "⫏",
  "csube": "⫑",
  "csup": "⫐",
  "csupe": "⫒",
  "ctdot": "⋯",
  "cudarrl": "⤸",
  "cudarrr": "⤵",
  "cuepr": "⋞",
  "cuesc": "⋟",
  "cularr": "↶",
  "cularrp": "⤽",
  "cup": "∪",
  "cupbrcap": "⩈",
  "cupcap": "⩆",
  "cupcup": "⩊",
  "cupdot": "⊍",
  "cupor": "⩅",
  "cups": "∪︀",
  "curarr": "↷",
  "curarrm": "⤼",
  "curlyeqprec": "⋞",
  "curlyeqsucc": "⋟",
  "curlyvee": "⋎",
  "curlywedge": "⋏",
  "curre": "¤",
  "curren": "¤",
  "curvearrowleft": "↶",
  "curvearrowright": "↷",
  "cuvee": "⋎",
  "cuwed": "⋏",
  "cwconint": "∲",
  "cwint": "∱",
  "cylcty": "⌭",
  "dArr": "⇓",
  "dHar": "⥥",
  "dagger": "†",
  "daleth": "ℸ",
  "darr": "↓",
  "dash": "‐",
  "dashv": "⊣",
  "dbkarow": "⤏",
  "dblac": "˝",
  "dcaron": "ď",
  "dcy": "д",
  "dd": "ⅆ",
  "ddagger": "‡",
  "ddarr": "⇊",
  "ddotseq": "⩷",
  "de": "°",
  "deg": "°",
  "delta": "δ",
  "demptyv": "⦱",
  "dfisht": "⥿",
  "dfr": "𝔡",
  "dharl": "⇃",
  "dharr": "⇂",
  "diam": "⋄",
  "diamond": "⋄",
  "diamondsuit": "♦",
  "diams": "♦",
  "die": "¨",
  "digamma": "ϝ",
  "disin": "⋲",
  "div": "÷",
  "divid": "÷",
  "divide": "÷",
  "divideontimes": "⋇",
  "divonx": "⋇",
  "djcy": "ђ",
  "dlcorn": "⌞",
  "dlcrop": "⌍",
  "dollar": "$",
  "dopf": "𝕕",
  "dot": "˙",
  "doteq": "≐",
  "doteqdot": "≑",
  "dotminus": "∸",
  "dotplus": "∔",
  "dotsquare": "⊡",
  "doublebarwedge": "⌆",
  "downarrow": "↓",
  "downdownarrows": "⇊",
  "downharpoonleft": "⇃",
  "downharpoonright": "⇂",
  "drbkarow": "⤐",
  "drcorn": "⌟",
  "drcrop": "⌌",
  "dscr": "𝒹",
  "dscy": "ѕ",
  "dsol": "⧶",
  "dstrok": "đ",
  "dtdot": "⋱",
  "dtri": "▿",
  "dtrif": "▾",
  "duarr": "⇵",
  "duhar": "⥯",
  "dwangle": "⦦",
  "dzcy": "џ",
  "dzigrarr": "⟿",
  "eDDot": "⩷",
  "eDot": "≑",
  "eacut": "é",
  "eacute": "é",
  "easter": "⩮",
  "ecaron": "ě",
  "ecir": "ê",
  "ecirc": "ê",
  "ecolon": "≕",
  "ecy": "э",
  "edot": "ė",
  "ee": "ⅇ",
  "efDot": "≒",
  "efr": "𝔢",
  "eg": "⪚",
  "egrav": "è",
  "egrave": "è",
  "egs": "⪖",
  "egsdot": "⪘",
  "el": "⪙",
  "elinters": "⏧",
  "ell": "ℓ",
  "els": "⪕",
  "elsdot": "⪗",
  "emacr": "ē",
  "empty": "∅",
  "emptyset": "∅",
  "emptyv": "∅",
  "emsp13": " ",
  "emsp14": " ",
  "emsp": " ",
  "eng": "ŋ",
  "ensp": " ",
  "eogon": "ę",
  "eopf": "𝕖",
  "epar": "⋕",
  "eparsl": "⧣",
  "eplus": "⩱",
  "epsi": "ε",
  "epsilon": "ε",
  "epsiv": "ϵ",
  "eqcirc": "≖",
  "eqcolon": "≕",
  "eqsim": "≂",
  "eqslantgtr": "⪖",
  "eqslantless": "⪕",
  "equals": "=",
  "equest": "≟",
  "equiv": "≡",
  "equivDD": "⩸",
  "eqvparsl": "⧥",
  "erDot": "≓",
  "erarr": "⥱",
  "escr": "ℯ",
  "esdot": "≐",
  "esim": "≂",
  "eta": "η",
  "et": "ð",
  "eth": "ð",
  "eum": "ë",
  "euml": "ë",
  "euro": "€",
  "excl": "!",
  "exist": "∃",
  "expectation": "ℰ",
  "exponentiale": "ⅇ",
  "fallingdotseq": "≒",
  "fcy": "ф",
  "female": "♀",
  "ffilig": "ﬃ",
  "fflig": "ﬀ",
  "ffllig": "ﬄ",
  "ffr": "𝔣",
  "filig": "ﬁ",
  "fjlig": "fj",
  "flat": "♭",
  "fllig": "ﬂ",
  "fltns": "▱",
  "fnof": "ƒ",
  "fopf": "𝕗",
  "forall": "∀",
  "fork": "⋔",
  "forkv": "⫙",
  "fpartint": "⨍",
  "frac1": "¼",
  "frac12": "½",
  "frac13": "⅓",
  "frac14": "¼",
  "frac15": "⅕",
  "frac16": "⅙",
  "frac18": "⅛",
  "frac23": "⅔",
  "frac25": "⅖",
  "frac3": "¾",
  "frac34": "¾",
  "frac35": "⅗",
  "frac38": "⅜",
  "frac45": "⅘",
  "frac56": "⅚",
  "frac58": "⅝",
  "frac78": "⅞",
  "frasl": "⁄",
  "frown": "⌢",
  "fscr": "𝒻",
  "gE": "≧",
  "gEl": "⪌",
  "gacute": "ǵ",
  "gamma": "γ",
  "gammad": "ϝ",
  "gap": "⪆",
  "gbreve": "ğ",
  "gcirc": "ĝ",
  "gcy": "г",
  "gdot": "ġ",
  "ge": "≥",
  "gel": "⋛",
  "geq": "≥",
  "geqq": "≧",
  "geqslant": "⩾",
  "ges": "⩾",
  "gescc": "⪩",
  "gesdot": "⪀",
  "gesdoto": "⪂",
  "gesdotol": "⪄",
  "gesl": "⋛︀",
  "gesles": "⪔",
  "gfr": "𝔤",
  "gg": "≫",
  "ggg": "⋙",
  "gimel": "ℷ",
  "gjcy": "ѓ",
  "gl": "≷",
  "glE": "⪒",
  "gla": "⪥",
  "glj": "⪤",
  "gnE": "≩",
  "gnap": "⪊",
  "gnapprox": "⪊",
  "gne": "⪈",
  "gneq": "⪈",
  "gneqq": "≩",
  "gnsim": "⋧",
  "gopf": "𝕘",
  "grave": "`",
  "gscr": "ℊ",
  "gsim": "≳",
  "gsime": "⪎",
  "gsiml": "⪐",
  "g": ">",
  "gt": ">",
  "gtcc": "⪧",
  "gtcir": "⩺",
  "gtdot": "⋗",
  "gtlPar": "⦕",
  "gtquest": "⩼",
  "gtrapprox": "⪆",
  "gtrarr": "⥸",
  "gtrdot": "⋗",
  "gtreqless": "⋛",
  "gtreqqless": "⪌",
  "gtrless": "≷",
  "gtrsim": "≳",
  "gvertneqq": "≩︀",
  "gvnE": "≩︀",
  "hArr": "⇔",
  "hairsp": " ",
  "half": "½",
  "hamilt": "ℋ",
  "hardcy": "ъ",
  "harr": "↔",
  "harrcir": "⥈",
  "harrw": "↭",
  "hbar": "ℏ",
  "hcirc": "ĥ",
  "hearts": "♥",
  "heartsuit": "♥",
  "hellip": "…",
  "hercon": "⊹",
  "hfr": "𝔥",
  "hksearow": "⤥",
  "hkswarow": "⤦",
  "hoarr": "⇿",
  "homtht": "∻",
  "hookleftarrow": "↩",
  "hookrightarrow": "↪",
  "hopf": "𝕙",
  "horbar": "―",
  "hscr": "𝒽",
  "hslash": "ℏ",
  "hstrok": "ħ",
  "hybull": "⁃",
  "hyphen": "‐",
  "iacut": "í",
  "iacute": "í",
  "ic": "⁣",
  "icir": "î",
  "icirc": "î",
  "icy": "и",
  "iecy": "е",
  "iexc": "¡",
  "iexcl": "¡",
  "iff": "⇔",
  "ifr": "𝔦",
  "igrav": "ì",
  "igrave": "ì",
  "ii": "ⅈ",
  "iiiint": "⨌",
  "iiint": "∭",
  "iinfin": "⧜",
  "iiota": "℩",
  "ijlig": "ĳ",
  "imacr": "ī",
  "image": "ℑ",
  "imagline": "ℐ",
  "imagpart": "ℑ",
  "imath": "ı",
  "imof": "⊷",
  "imped": "Ƶ",
  "in": "∈",
  "incare": "℅",
  "infin": "∞",
  "infintie": "⧝",
  "inodot": "ı",
  "int": "∫",
  "intcal": "⊺",
  "integers": "ℤ",
  "intercal": "⊺",
  "intlarhk": "⨗",
  "intprod": "⨼",
  "iocy": "ё",
  "iogon": "į",
  "iopf": "𝕚",
  "iota": "ι",
  "iprod": "⨼",
  "iques": "¿",
  "iquest": "¿",
  "iscr": "𝒾",
  "isin": "∈",
  "isinE": "⋹",
  "isindot": "⋵",
  "isins": "⋴",
  "isinsv": "⋳",
  "isinv": "∈",
  "it": "⁢",
  "itilde": "ĩ",
  "iukcy": "і",
  "ium": "ï",
  "iuml": "ï",
  "jcirc": "ĵ",
  "jcy": "й",
  "jfr": "𝔧",
  "jmath": "ȷ",
  "jopf": "𝕛",
  "jscr": "𝒿",
  "jsercy": "ј",
  "jukcy": "є",
  "kappa": "κ",
  "kappav": "ϰ",
  "kcedil": "ķ",
  "kcy": "к",
  "kfr": "𝔨",
  "kgreen": "ĸ",
  "khcy": "х",
  "kjcy": "ќ",
  "kopf": "𝕜",
  "kscr": "𝓀",
  "lAarr": "⇚",
  "lArr": "⇐",
  "lAtail": "⤛",
  "lBarr": "⤎",
  "lE": "≦",
  "lEg": "⪋",
  "lHar": "⥢",
  "lacute": "ĺ",
  "laemptyv": "⦴",
  "lagran": "ℒ",
  "lambda": "λ",
  "lang": "⟨",
  "langd": "⦑",
  "langle": "⟨",
  "lap": "⪅",
  "laqu": "«",
  "laquo": "«",
  "larr": "←",
  "larrb": "⇤",
  "larrbfs": "⤟",
  "larrfs": "⤝",
  "larrhk": "↩",
  "larrlp": "↫",
  "larrpl": "⤹",
  "larrsim": "⥳",
  "larrtl": "↢",
  "lat": "⪫",
  "latail": "⤙",
  "late": "⪭",
  "lates": "⪭︀",
  "lbarr": "⤌",
  "lbbrk": "❲",
  "lbrace": "{",
  "lbrack": "[",
  "lbrke": "⦋",
  "lbrksld": "⦏",
  "lbrkslu": "⦍",
  "lcaron": "ľ",
  "lcedil": "ļ",
  "lceil": "⌈",
  "lcub": "{",
  "lcy": "л",
  "ldca": "⤶",
  "ldquo": "“",
  "ldquor": "„",
  "ldrdhar": "⥧",
  "ldrushar": "⥋",
  "ldsh": "↲",
  "le": "≤",
  "leftarrow": "←",
  "leftarrowtail": "↢",
  "leftharpoondown": "↽",
  "leftharpoonup": "↼",
  "leftleftarrows": "⇇",
  "leftrightarrow": "↔",
  "leftrightarrows": "⇆",
  "leftrightharpoons": "⇋",
  "leftrightsquigarrow": "↭",
  "leftthreetimes": "⋋",
  "leg": "⋚",
  "leq": "≤",
  "leqq": "≦",
  "leqslant": "⩽",
  "les": "⩽",
  "lescc": "⪨",
  "lesdot": "⩿",
  "lesdoto": "⪁",
  "lesdotor": "⪃",
  "lesg": "⋚︀",
  "lesges": "⪓",
  "lessapprox": "⪅",
  "lessdot": "⋖",
  "lesseqgtr": "⋚",
  "lesseqqgtr": "⪋",
  "lessgtr": "≶",
  "lesssim": "≲",
  "lfisht": "⥼",
  "lfloor": "⌊",
  "lfr": "𝔩",
  "lg": "≶",
  "lgE": "⪑",
  "lhard": "↽",
  "lharu": "↼",
  "lharul": "⥪",
  "lhblk": "▄",
  "ljcy": "љ",
  "ll": "≪",
  "llarr": "⇇",
  "llcorner": "⌞",
  "llhard": "⥫",
  "lltri": "◺",
  "lmidot": "ŀ",
  "lmoust": "⎰",
  "lmoustache": "⎰",
  "lnE": "≨",
  "lnap": "⪉",
  "lnapprox": "⪉",
  "lne": "⪇",
  "lneq": "⪇",
  "lneqq": "≨",
  "lnsim": "⋦",
  "loang": "⟬",
  "loarr": "⇽",
  "lobrk": "⟦",
  "longleftarrow": "⟵",
  "longleftrightarrow": "⟷",
  "longmapsto": "⟼",
  "longrightarrow": "⟶",
  "looparrowleft": "↫",
  "looparrowright": "↬",
  "lopar": "⦅",
  "lopf": "𝕝",
  "loplus": "⨭",
  "lotimes": "⨴",
  "lowast": "∗",
  "lowbar": "_",
  "loz": "◊",
  "lozenge": "◊",
  "lozf": "⧫",
  "lpar": "(",
  "lparlt": "⦓",
  "lrarr": "⇆",
  "lrcorner": "⌟",
  "lrhar": "⇋",
  "lrhard": "⥭",
  "lrm": "‎",
  "lrtri": "⊿",
  "lsaquo": "‹",
  "lscr": "𝓁",
  "lsh": "↰",
  "lsim": "≲",
  "lsime": "⪍",
  "lsimg": "⪏",
  "lsqb": "[",
  "lsquo": "‘",
  "lsquor": "‚",
  "lstrok": "ł",
  "l": "<",
  "lt": "<",
  "ltcc": "⪦",
  "ltcir": "⩹",
  "ltdot": "⋖",
  "lthree": "⋋",
  "ltimes": "⋉",
  "ltlarr": "⥶",
  "ltquest": "⩻",
  "ltrPar": "⦖",
  "ltri": "◃",
  "ltrie": "⊴",
  "ltrif": "◂",
  "lurdshar": "⥊",
  "luruhar": "⥦",
  "lvertneqq": "≨︀",
  "lvnE": "≨︀",
  "mDDot": "∺",
  "mac": "¯",
  "macr": "¯",
  "male": "♂",
  "malt": "✠",
  "maltese": "✠",
  "map": "↦",
  "mapsto": "↦",
  "mapstodown": "↧",
  "mapstoleft": "↤",
  "mapstoup": "↥",
  "marker": "▮",
  "mcomma": "⨩",
  "mcy": "м",
  "mdash": "—",
  "measuredangle": "∡",
  "mfr": "𝔪",
  "mho": "℧",
  "micr": "µ",
  "micro": "µ",
  "mid": "∣",
  "midast": "*",
  "midcir": "⫰",
  "middo": "·",
  "middot": "·",
  "minus": "−",
  "minusb": "⊟",
  "minusd": "∸",
  "minusdu": "⨪",
  "mlcp": "⫛",
  "mldr": "…",
  "mnplus": "∓",
  "models": "⊧",
  "mopf": "𝕞",
  "mp": "∓",
  "mscr": "𝓂",
  "mstpos": "∾",
  "mu": "μ",
  "multimap": "⊸",
  "mumap": "⊸",
  "nGg": "⋙̸",
  "nGt": "≫⃒",
  "nGtv": "≫̸",
  "nLeftarrow": "⇍",
  "nLeftrightarrow": "⇎",
  "nLl": "⋘̸",
  "nLt": "≪⃒",
  "nLtv": "≪̸",
  "nRightarrow": "⇏",
  "nVDash": "⊯",
  "nVdash": "⊮",
  "nabla": "∇",
  "nacute": "ń",
  "nang": "∠⃒",
  "nap": "≉",
  "napE": "⩰̸",
  "napid": "≋̸",
  "napos": "ŉ",
  "napprox": "≉",
  "natur": "♮",
  "natural": "♮",
  "naturals": "ℕ",
  "nbs": " ",
  "nbsp": " ",
  "nbump": "≎̸",
  "nbumpe": "≏̸",
  "ncap": "⩃",
  "ncaron": "ň",
  "ncedil": "ņ",
  "ncong": "≇",
  "ncongdot": "⩭̸",
  "ncup": "⩂",
  "ncy": "н",
  "ndash": "–",
  "ne": "≠",
  "neArr": "⇗",
  "nearhk": "⤤",
  "nearr": "↗",
  "nearrow": "↗",
  "nedot": "≐̸",
  "nequiv": "≢",
  "nesear": "⤨",
  "nesim": "≂̸",
  "nexist": "∄",
  "nexists": "∄",
  "nfr": "𝔫",
  "ngE": "≧̸",
  "nge": "≱",
  "ngeq": "≱",
  "ngeqq": "≧̸",
  "ngeqslant": "⩾̸",
  "nges": "⩾̸",
  "ngsim": "≵",
  "ngt": "≯",
  "ngtr": "≯",
  "nhArr": "⇎",
  "nharr": "↮",
  "nhpar": "⫲",
  "ni": "∋",
  "nis": "⋼",
  "nisd": "⋺",
  "niv": "∋",
  "njcy": "њ",
  "nlArr": "⇍",
  "nlE": "≦̸",
  "nlarr": "↚",
  "nldr": "‥",
  "nle": "≰",
  "nleftarrow": "↚",
  "nleftrightarrow": "↮",
  "nleq": "≰",
  "nleqq": "≦̸",
  "nleqslant": "⩽̸",
  "nles": "⩽̸",
  "nless": "≮",
  "nlsim": "≴",
  "nlt": "≮",
  "nltri": "⋪",
  "nltrie": "⋬",
  "nmid": "∤",
  "nopf": "𝕟",
  "no": "¬",
  "not": "¬",
  "notin": "∉",
  "notinE": "⋹̸",
  "notindot": "⋵̸",
  "notinva": "∉",
  "notinvb": "⋷",
  "notinvc": "⋶",
  "notni": "∌",
  "notniva": "∌",
  "notnivb": "⋾",
  "notnivc": "⋽",
  "npar": "∦",
  "nparallel": "∦",
  "nparsl": "⫽⃥",
  "npart": "∂̸",
  "npolint": "⨔",
  "npr": "⊀",
  "nprcue": "⋠",
  "npre": "⪯̸",
  "nprec": "⊀",
  "npreceq": "⪯̸",
  "nrArr": "⇏",
  "nrarr": "↛",
  "nrarrc": "⤳̸",
  "nrarrw": "↝̸",
  "nrightarrow": "↛",
  "nrtri": "⋫",
  "nrtrie": "⋭",
  "nsc": "⊁",
  "nsccue": "⋡",
  "nsce": "⪰̸",
  "nscr": "𝓃",
  "nshortmid": "∤",
  "nshortparallel": "∦",
  "nsim": "≁",
  "nsime": "≄",
  "nsimeq": "≄",
  "nsmid": "∤",
  "nspar": "∦",
  "nsqsube": "⋢",
  "nsqsupe": "⋣",
  "nsub": "⊄",
  "nsubE": "⫅̸",
  "nsube": "⊈",
  "nsubset": "⊂⃒",
  "nsubseteq": "⊈",
  "nsubseteqq": "⫅̸",
  "nsucc": "⊁",
  "nsucceq": "⪰̸",
  "nsup": "⊅",
  "nsupE": "⫆̸",
  "nsupe": "⊉",
  "nsupset": "⊃⃒",
  "nsupseteq": "⊉",
  "nsupseteqq": "⫆̸",
  "ntgl": "≹",
  "ntild": "ñ",
  "ntilde": "ñ",
  "ntlg": "≸",
  "ntriangleleft": "⋪",
  "ntrianglelefteq": "⋬",
  "ntriangleright": "⋫",
  "ntrianglerighteq": "⋭",
  "nu": "ν",
  "num": "#",
  "numero": "№",
  "numsp": " ",
  "nvDash": "⊭",
  "nvHarr": "⤄",
  "nvap": "≍⃒",
  "nvdash": "⊬",
  "nvge": "≥⃒",
  "nvgt": ">⃒",
  "nvinfin": "⧞",
  "nvlArr": "⤂",
  "nvle": "≤⃒",
  "nvlt": "<⃒",
  "nvltrie": "⊴⃒",
  "nvrArr": "⤃",
  "nvrtrie": "⊵⃒",
  "nvsim": "∼⃒",
  "nwArr": "⇖",
  "nwarhk": "⤣",
  "nwarr": "↖",
  "nwarrow": "↖",
  "nwnear": "⤧",
  "oS": "Ⓢ",
  "oacut": "ó",
  "oacute": "ó",
  "oast": "⊛",
  "ocir": "ô",
  "ocirc": "ô",
  "ocy": "о",
  "odash": "⊝",
  "odblac": "ő",
  "odiv": "⨸",
  "odot": "⊙",
  "odsold": "⦼",
  "oelig": "œ",
  "ofcir": "⦿",
  "ofr": "𝔬",
  "ogon": "˛",
  "ograv": "ò",
  "ograve": "ò",
  "ogt": "⧁",
  "ohbar": "⦵",
  "ohm": "Ω",
  "oint": "∮",
  "olarr": "↺",
  "olcir": "⦾",
  "olcross": "⦻",
  "oline": "‾",
  "olt": "⧀",
  "omacr": "ō",
  "omega": "ω",
  "omicron": "ο",
  "omid": "⦶",
  "ominus": "⊖",
  "oopf": "𝕠",
  "opar": "⦷",
  "operp": "⦹",
  "oplus": "⊕",
  "or": "∨",
  "orarr": "↻",
  "ord": "º",
  "order": "ℴ",
  "orderof": "ℴ",
  "ordf": "ª",
  "ordm": "º",
  "origof": "⊶",
  "oror": "⩖",
  "orslope": "⩗",
  "orv": "⩛",
  "oscr": "ℴ",
  "oslas": "ø",
  "oslash": "ø",
  "osol": "⊘",
  "otild": "õ",
  "otilde": "õ",
  "otimes": "⊗",
  "otimesas": "⨶",
  "oum": "ö",
  "ouml": "ö",
  "ovbar": "⌽",
  "par": "¶",
  "para": "¶",
  "parallel": "∥",
  "parsim": "⫳",
  "parsl": "⫽",
  "part": "∂",
  "pcy": "п",
  "percnt": "%",
  "period": ".",
  "permil": "‰",
  "perp": "⊥",
  "pertenk": "‱",
  "pfr": "𝔭",
  "phi": "φ",
  "phiv": "ϕ",
  "phmmat": "ℳ",
  "phone": "☎",
  "pi": "π",
  "pitchfork": "⋔",
  "piv": "ϖ",
  "planck": "ℏ",
  "planckh": "ℎ",
  "plankv": "ℏ",
  "plus": "+",
  "plusacir": "⨣",
  "plusb": "⊞",
  "pluscir": "⨢",
  "plusdo": "∔",
  "plusdu": "⨥",
  "pluse": "⩲",
  "plusm": "±",
  "plusmn": "±",
  "plussim": "⨦",
  "plustwo": "⨧",
  "pm": "±",
  "pointint": "⨕",
  "popf": "𝕡",
  "poun": "£",
  "pound": "£",
  "pr": "≺",
  "prE": "⪳",
  "prap": "⪷",
  "prcue": "≼",
  "pre": "⪯",
  "prec": "≺",
  "precapprox": "⪷",
  "preccurlyeq": "≼",
  "preceq": "⪯",
  "precnapprox": "⪹",
  "precneqq": "⪵",
  "precnsim": "⋨",
  "precsim": "≾",
  "prime": "′",
  "primes": "ℙ",
  "prnE": "⪵",
  "prnap": "⪹",
  "prnsim": "⋨",
  "prod": "∏",
  "profalar": "⌮",
  "profline": "⌒",
  "profsurf": "⌓",
  "prop": "∝",
  "propto": "∝",
  "prsim": "≾",
  "prurel": "⊰",
  "pscr": "𝓅",
  "psi": "ψ",
  "puncsp": " ",
  "qfr": "𝔮",
  "qint": "⨌",
  "qopf": "𝕢",
  "qprime": "⁗",
  "qscr": "𝓆",
  "quaternions": "ℍ",
  "quatint": "⨖",
  "quest": "?",
  "questeq": "≟",
  "quo": "\"",
  "quot": "\"",
  "rAarr": "⇛",
  "rArr": "⇒",
  "rAtail": "⤜",
  "rBarr": "⤏",
  "rHar": "⥤",
  "race": "∽̱",
  "racute": "ŕ",
  "radic": "√",
  "raemptyv": "⦳",
  "rang": "⟩",
  "rangd": "⦒",
  "range": "⦥",
  "rangle": "⟩",
  "raqu": "»",
  "raquo": "»",
  "rarr": "→",
  "rarrap": "⥵",
  "rarrb": "⇥",
  "rarrbfs": "⤠",
  "rarrc": "⤳",
  "rarrfs": "⤞",
  "rarrhk": "↪",
  "rarrlp": "↬",
  "rarrpl": "⥅",
  "rarrsim": "⥴",
  "rarrtl": "↣",
  "rarrw": "↝",
  "ratail": "⤚",
  "ratio": "∶",
  "rationals": "ℚ",
  "rbarr": "⤍",
  "rbbrk": "❳",
  "rbrace": "}",
  "rbrack": "]",
  "rbrke": "⦌",
  "rbrksld": "⦎",
  "rbrkslu": "⦐",
  "rcaron": "ř",
  "rcedil": "ŗ",
  "rceil": "⌉",
  "rcub": "}",
  "rcy": "р",
  "rdca": "⤷",
  "rdldhar": "⥩",
  "rdquo": "”",
  "rdquor": "”",
  "rdsh": "↳",
  "real": "ℜ",
  "realine": "ℛ",
  "realpart": "ℜ",
  "reals": "ℝ",
  "rect": "▭",
  "re": "®",
  "reg": "®",
  "rfisht": "⥽",
  "rfloor": "⌋",
  "rfr": "𝔯",
  "rhard": "⇁",
  "rharu": "⇀",
  "rharul": "⥬",
  "rho": "ρ",
  "rhov": "ϱ",
  "rightarrow": "→",
  "rightarrowtail": "↣",
  "rightharpoondown": "⇁",
  "rightharpoonup": "⇀",
  "rightleftarrows": "⇄",
  "rightleftharpoons": "⇌",
  "rightrightarrows": "⇉",
  "rightsquigarrow": "↝",
  "rightthreetimes": "⋌",
  "ring": "˚",
  "risingdotseq": "≓",
  "rlarr": "⇄",
  "rlhar": "⇌",
  "rlm": "‏",
  "rmoust": "⎱",
  "rmoustache": "⎱",
  "rnmid": "⫮",
  "roang": "⟭",
  "roarr": "⇾",
  "robrk": "⟧",
  "ropar": "⦆",
  "ropf": "𝕣",
  "roplus": "⨮",
  "rotimes": "⨵",
  "rpar": ")",
  "rpargt": "⦔",
  "rppolint": "⨒",
  "rrarr": "⇉",
  "rsaquo": "›",
  "rscr": "𝓇",
  "rsh": "↱",
  "rsqb": "]",
  "rsquo": "’",
  "rsquor": "’",
  "rthree": "⋌",
  "rtimes": "⋊",
  "rtri": "▹",
  "rtrie": "⊵",
  "rtrif": "▸",
  "rtriltri": "⧎",
  "ruluhar": "⥨",
  "rx": "℞",
  "sacute": "ś",
  "sbquo": "‚",
  "sc": "≻",
  "scE": "⪴",
  "scap": "⪸",
  "scaron": "š",
  "sccue": "≽",
  "sce": "⪰",
  "scedil": "ş",
  "scirc": "ŝ",
  "scnE": "⪶",
  "scnap": "⪺",
  "scnsim": "⋩",
  "scpolint": "⨓",
  "scsim": "≿",
  "scy": "с",
  "sdot": "⋅",
  "sdotb": "⊡",
  "sdote": "⩦",
  "seArr": "⇘",
  "searhk": "⤥",
  "searr": "↘",
  "searrow": "↘",
  "sec": "§",
  "sect": "§",
  "semi": ";",
  "seswar": "⤩",
  "setminus": "∖",
  "setmn": "∖",
  "sext": "✶",
  "sfr": "𝔰",
  "sfrown": "⌢",
  "sharp": "♯",
  "shchcy": "щ",
  "shcy": "ш",
  "shortmid": "∣",
  "shortparallel": "∥",
  "sh": "­",
  "shy": "­",
  "sigma": "σ",
  "sigmaf": "ς",
  "sigmav": "ς",
  "sim": "∼",
  "simdot": "⩪",
  "sime": "≃",
  "simeq": "≃",
  "simg": "⪞",
  "simgE": "⪠",
  "siml": "⪝",
  "simlE": "⪟",
  "simne": "≆",
  "simplus": "⨤",
  "simrarr": "⥲",
  "slarr": "←",
  "smallsetminus": "∖",
  "smashp": "⨳",
  "smeparsl": "⧤",
  "smid": "∣",
  "smile": "⌣",
  "smt": "⪪",
  "smte": "⪬",
  "smtes": "⪬︀",
  "softcy": "ь",
  "sol": "/",
  "solb": "⧄",
  "solbar": "⌿",
  "sopf": "𝕤",
  "spades": "♠",
  "spadesuit": "♠",
  "spar": "∥",
  "sqcap": "⊓",
  "sqcaps": "⊓︀",
  "sqcup": "⊔",
  "sqcups": "⊔︀",
  "sqsub": "⊏",
  "sqsube": "⊑",
  "sqsubset": "⊏",
  "sqsubseteq": "⊑",
  "sqsup": "⊐",
  "sqsupe": "⊒",
  "sqsupset": "⊐",
  "sqsupseteq": "⊒",
  "squ": "□",
  "square": "□",
  "squarf": "▪",
  "squf": "▪",
  "srarr": "→",
  "sscr": "𝓈",
  "ssetmn": "∖",
  "ssmile": "⌣",
  "sstarf": "⋆",
  "star": "☆",
  "starf": "★",
  "straightepsilon": "ϵ",
  "straightphi": "ϕ",
  "strns": "¯",
  "sub": "⊂",
  "subE": "⫅",
  "subdot": "⪽",
  "sube": "⊆",
  "subedot": "⫃",
  "submult": "⫁",
  "subnE": "⫋",
  "subne": "⊊",
  "subplus": "⪿",
  "subrarr": "⥹",
  "subset": "⊂",
  "subseteq": "⊆",
  "subseteqq": "⫅",
  "subsetneq": "⊊",
  "subsetneqq": "⫋",
  "subsim": "⫇",
  "subsub": "⫕",
  "subsup": "⫓",
  "succ": "≻",
  "succapprox": "⪸",
  "succcurlyeq": "≽",
  "succeq": "⪰",
  "succnapprox": "⪺",
  "succneqq": "⪶",
  "succnsim": "⋩",
  "succsim": "≿",
  "sum": "∑",
  "sung": "♪",
  "sup": "⊃",
  "sup1": "¹",
  "sup2": "²",
  "sup3": "³",
  "supE": "⫆",
  "supdot": "⪾",
  "supdsub": "⫘",
  "supe": "⊇",
  "supedot": "⫄",
  "suphsol": "⟉",
  "suphsub": "⫗",
  "suplarr": "⥻",
  "supmult": "⫂",
  "supnE": "⫌",
  "supne": "⊋",
  "supplus": "⫀",
  "supset": "⊃",
  "supseteq": "⊇",
  "supseteqq": "⫆",
  "supsetneq": "⊋",
  "supsetneqq": "⫌",
  "supsim": "⫈",
  "supsub": "⫔",
  "supsup": "⫖",
  "swArr": "⇙",
  "swarhk": "⤦",
  "swarr": "↙",
  "swarrow": "↙",
  "swnwar": "⤪",
  "szli": "ß",
  "szlig": "ß",
  "target": "⌖",
  "tau": "τ",
  "tbrk": "⎴",
  "tcaron": "ť",
  "tcedil": "ţ",
  "tcy": "т",
  "tdot": "⃛",
  "telrec": "⌕",
  "tfr": "𝔱",
  "there4": "∴",
  "therefore": "∴",
  "theta": "θ",
  "thetasym": "ϑ",
  "thetav": "ϑ",
  "thickapprox": "≈",
  "thicksim": "∼",
  "thinsp": " ",
  "thkap": "≈",
  "thksim": "∼",
  "thor": "þ",
  "thorn": "þ",
  "tilde": "˜",
  "time": "×",
  "times": "×",
  "timesb": "⊠",
  "timesbar": "⨱",
  "timesd": "⨰",
  "tint": "∭",
  "toea": "⤨",
  "top": "⊤",
  "topbot": "⌶",
  "topcir": "⫱",
  "topf": "𝕥",
  "topfork": "⫚",
  "tosa": "⤩",
  "tprime": "‴",
  "trade": "™",
  "triangle": "▵",
  "triangledown": "▿",
  "triangleleft": "◃",
  "trianglelefteq": "⊴",
  "triangleq": "≜",
  "triangleright": "▹",
  "trianglerighteq": "⊵",
  "tridot": "◬",
  "trie": "≜",
  "triminus": "⨺",
  "triplus": "⨹",
  "trisb": "⧍",
  "tritime": "⨻",
  "trpezium": "⏢",
  "tscr": "𝓉",
  "tscy": "ц",
  "tshcy": "ћ",
  "tstrok": "ŧ",
  "twixt": "≬",
  "twoheadleftarrow": "↞",
  "twoheadrightarrow": "↠",
  "uArr": "⇑",
  "uHar": "⥣",
  "uacut": "ú",
  "uacute": "ú",
  "uarr": "↑",
  "ubrcy": "ў",
  "ubreve": "ŭ",
  "ucir": "û",
  "ucirc": "û",
  "ucy": "у",
  "udarr": "⇅",
  "udblac": "ű",
  "udhar": "⥮",
  "ufisht": "⥾",
  "ufr": "𝔲",
  "ugrav": "ù",
  "ugrave": "ù",
  "uharl": "↿",
  "uharr": "↾",
  "uhblk": "▀",
  "ulcorn": "⌜",
  "ulcorner": "⌜",
  "ulcrop": "⌏",
  "ultri": "◸",
  "umacr": "ū",
  "um": "¨",
  "uml": "¨",
  "uogon": "ų",
  "uopf": "𝕦",
  "uparrow": "↑",
  "updownarrow": "↕",
  "upharpoonleft": "↿",
  "upharpoonright": "↾",
  "uplus": "⊎",
  "upsi": "υ",
  "upsih": "ϒ",
  "upsilon": "υ",
  "upuparrows": "⇈",
  "urcorn": "⌝",
  "urcorner": "⌝",
  "urcrop": "⌎",
  "uring": "ů",
  "urtri": "◹",
  "uscr": "𝓊",
  "utdot": "⋰",
  "utilde": "ũ",
  "utri": "▵",
  "utrif": "▴",
  "uuarr": "⇈",
  "uum": "ü",
  "uuml": "ü",
  "uwangle": "⦧",
  "vArr": "⇕",
  "vBar": "⫨",
  "vBarv": "⫩",
  "vDash": "⊨",
  "vangrt": "⦜",
  "varepsilon": "ϵ",
  "varkappa": "ϰ",
  "varnothing": "∅",
  "varphi": "ϕ",
  "varpi": "ϖ",
  "varpropto": "∝",
  "varr": "↕",
  "varrho": "ϱ",
  "varsigma": "ς",
  "varsubsetneq": "⊊︀",
  "varsubsetneqq": "⫋︀",
  "varsupsetneq": "⊋︀",
  "varsupsetneqq": "⫌︀",
  "vartheta": "ϑ",
  "vartriangleleft": "⊲",
  "vartriangleright": "⊳",
  "vcy": "в",
  "vdash": "⊢",
  "vee": "∨",
  "veebar": "⊻",
  "veeeq": "≚",
  "vellip": "⋮",
  "verbar": "|",
  "vert": "|",
  "vfr": "𝔳",
  "vltri": "⊲",
  "vnsub": "⊂⃒",
  "vnsup": "⊃⃒",
  "vopf": "𝕧",
  "vprop": "∝",
  "vrtri": "⊳",
  "vscr": "𝓋",
  "vsubnE": "⫋︀",
  "vsubne": "⊊︀",
  "vsupnE": "⫌︀",
  "vsupne": "⊋︀",
  "vzigzag": "⦚",
  "wcirc": "ŵ",
  "wedbar": "⩟",
  "wedge": "∧",
  "wedgeq": "≙",
  "weierp": "℘",
  "wfr": "𝔴",
  "wopf": "𝕨",
  "wp": "℘",
  "wr": "≀",
  "wreath": "≀",
  "wscr": "𝓌",
  "xcap": "⋂",
  "xcirc": "◯",
  "xcup": "⋃",
  "xdtri": "▽",
  "xfr": "𝔵",
  "xhArr": "⟺",
  "xharr": "⟷",
  "xi": "ξ",
  "xlArr": "⟸",
  "xlarr": "⟵",
  "xmap": "⟼",
  "xnis": "⋻",
  "xodot": "⨀",
  "xopf": "𝕩",
  "xoplus": "⨁",
  "xotime": "⨂",
  "xrArr": "⟹",
  "xrarr": "⟶",
  "xscr": "𝓍",
  "xsqcup": "⨆",
  "xuplus": "⨄",
  "xutri": "△",
  "xvee": "⋁",
  "xwedge": "⋀",
  "yacut": "ý",
  "yacute": "ý",
  "yacy": "я",
  "ycirc": "ŷ",
  "ycy": "ы",
  "ye": "¥",
  "yen": "¥",
  "yfr": "𝔶",
  "yicy": "ї",
  "yopf": "𝕪",
  "yscr": "𝓎",
  "yucy": "ю",
  "yum": "ÿ",
  "yuml": "ÿ",
  "zacute": "ź",
  "zcaron": "ž",
  "zcy": "з",
  "zdot": "ż",
  "zeetrf": "ℨ",
  "zeta": "ζ",
  "zfr": "𝔷",
  "zhcy": "ж",
  "zigrarr": "⇝",
  "zopf": "𝕫",
  "zscr": "𝓏",
  "zwj": "‍",
  "zwnj": "‌"
}

},{}],12:[function(require,module,exports){
module.exports={
  "0": "�",
  "128": "€",
  "130": "‚",
  "131": "ƒ",
  "132": "„",
  "133": "…",
  "134": "†",
  "135": "‡",
  "136": "ˆ",
  "137": "‰",
  "138": "Š",
  "139": "‹",
  "140": "Œ",
  "142": "Ž",
  "145": "‘",
  "146": "’",
  "147": "“",
  "148": "”",
  "149": "•",
  "150": "–",
  "151": "—",
  "152": "˜",
  "153": "™",
  "154": "š",
  "155": "›",
  "156": "œ",
  "158": "ž",
  "159": "Ÿ"
}

},{}],13:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module collapse-white-space
 * @fileoverview Replace multiple white-space characters
 *   with a single space.
 */

'use strict';

/* Expose. */
module.exports = collapse;

/**
 * Replace multiple white-space characters with a single space.
 *
 * @example
 *   collapse(' \t\nbar \nbaz\t'); // ' bar baz '
 *
 * @param {string} value - Value with uncollapsed white-space,
 *   coerced to string.
 * @return {string} - Value with collapsed white-space.
 */
function collapse(value) {
  return String(value).replace(/\s+/g, ' ');
}

},{}],14:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":15,"_process":37}],15:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":34}],16:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],17:[function(require,module,exports){
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],18:[function(require,module,exports){
var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":17}],19:[function(require,module,exports){
var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":18}],20:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],21:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-alphabetical
 * @fileoverview Check if a character is alphabetical.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = alphabetical;

/**
 * Check whether the given character code, or the character
 * code at the first character, is alphabetical.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is alphabetical.
 */
function alphabetical(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return (code >= 97 && code <= 122) || /* a-z */
    (code >= 65 && code <= 90); /* A-Z */
}

},{}],22:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return !/[^0-9a-z\xDF-\xFF]/.test(str.toLowerCase());
};

},{}],23:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-alphanumerical
 * @fileoverview Check if a character is alphanumerical.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var alphabetical = require('is-alphabetical');
var decimal = require('is-decimal');

/* Expose. */
module.exports = alphanumerical;

/**
 * Check whether the given character code, or the character
 * code at the first character, is alphanumerical.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is alphanumerical.
 */
function alphanumerical(character) {
  return alphabetical(character) || decimal(character);
}

},{"is-alphabetical":21,"is-decimal":25}],24:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],25:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-decimal
 * @fileoverview Check if a character is decimal.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = decimal;

/**
 * Check whether the given character code, or the character
 * code at the first character, is decimal.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is decimal.
 */
function decimal(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return code >= 48 && code <= 57; /* 0-9 */
}

},{}],26:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-hexadecimal
 * @fileoverview Check if a character is hexadecimal.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = hexadecimal;

/**
 * Check whether the given character code, or the character
 * code at the first character, is hexadecimal.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is hexadecimal.
 */
function hexadecimal(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return (code >= 97 /* a */ && code <= 102 /* z */) ||
    (code >= 65 /* A */ && code <= 70 /* Z */) ||
    (code >= 48 /* A */ && code <= 57 /* Z */);
}

},{}],27:[function(require,module,exports){
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};

},{}],28:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-whitespace-character
 * @fileoverview Check if a character is a whitespace character.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = whitespace;

/* Methods. */
var fromCode = String.fromCharCode;

/* Constants. */
var re = /\s/;

/**
 * Check whether the given character code, or the character
 * code at the first character, is a whitespace character.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is a whitespaces character.
 */
function whitespace(character) {
  return re.test(
    typeof character === 'number' ? fromCode(character) : character.charAt(0)
  );
}

},{}],29:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-word-character
 * @fileoverview Check if a character is a word character.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = wordCharacter;

/* Methods. */
var fromCode = String.fromCharCode;

/* Constants. */
var re = /\w/;

/**
 * Check whether the given character code, or the character
 * code at the first character, is a word character.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is a word character.
 */
function wordCharacter(character) {
  return re.test(
    typeof character === 'number' ? fromCode(character) : character.charAt(0)
  );
}

},{}],30:[function(require,module,exports){
'use strict';

/* Expose. */
module.exports = longestStreak;

/* Get the count of the longest repeating streak of
 * `character` in `value`. */
function longestStreak(value, character) {
  var count = 0;
  var maximum = 0;
  var expected;
  var index;

  if (typeof character !== 'string' || character.length !== 1) {
    throw new Error('Expected character');
  }

  value = String(value);
  expected = index = value.indexOf(character);

  while (index !== -1) {
    count++;

    if (index === expected) {
      if (count > maximum) {
        maximum = count;
      }
    } else {
      count = 1;
    }

    expected = index + 1;
    index = value.indexOf(character, expected);
  }

  return maximum;
}

},{}],31:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module markdown-escapes
 * @fileoverview List of escapable characters in markdown.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = escapes;

/* Characters. */
var defaults = [
  '\\',
  '`',
  '*',
  '{',
  '}',
  '[',
  ']',
  '(',
  ')',
  '#',
  '+',
  '-',
  '.',
  '!',
  '_',
  '>'
];

var gfm = defaults.concat(['~', '|']);

var commonmark = gfm.concat([
  '\n',
  '"',
  '$',
  '%',
  '&',
  '\'',
  ',',
  '/',
  ':',
  ';',
  '<',
  '=',
  '?',
  '@',
  '^'
]);

/* Expose characters. */
escapes.default = defaults;
escapes.gfm = gfm;
escapes.commonmark = commonmark;

/**
 * Get markdown escapes.
 *
 * @param {Object?} [options] - Configuration.
 * @return {Array.<string>} - Escapes.
 */
function escapes(options) {
  var settings = options || {};

  if (settings.commonmark) {
    return commonmark;
  }

  return settings.gfm ? gfm : defaults;
}

},{}],32:[function(require,module,exports){
'use strict';

/* Expose. */
module.exports = markdownTable;

/* Expressions. */
var EXPRESSION_DOT = /\./;
var EXPRESSION_LAST_DOT = /\.[^.]*$/;

/* Allowed alignment values. */
var LEFT = 'l';
var RIGHT = 'r';
var CENTER = 'c';
var DOT = '.';
var NULL = '';

var ALLIGNMENT = [LEFT, RIGHT, CENTER, DOT, NULL];
var MIN_CELL_SIZE = 3;

/* Characters. */
var COLON = ':';
var DASH = '-';
var PIPE = '|';
var SPACE = ' ';
var NEW_LINE = '\n';

/* Create a table from a matrix of strings. */
function markdownTable(table, options) {
  var settings = options || {};
  var delimiter = settings.delimiter;
  var start = settings.start;
  var end = settings.end;
  var alignment = settings.align;
  var calculateStringLength = settings.stringLength || lengthNoop;
  var cellCount = 0;
  var rowIndex = -1;
  var rowLength = table.length;
  var sizes = [];
  var align;
  var rule;
  var rows;
  var row;
  var cells;
  var index;
  var position;
  var size;
  var value;
  var spacing;
  var before;
  var after;

  alignment = alignment ? alignment.concat() : [];

  if (delimiter === null || delimiter === undefined) {
    delimiter = SPACE + PIPE + SPACE;
  }

  if (start === null || start === undefined) {
    start = PIPE + SPACE;
  }

  if (end === null || end === undefined) {
    end = SPACE + PIPE;
  }

  while (++rowIndex < rowLength) {
    row = table[rowIndex];

    index = -1;

    if (row.length > cellCount) {
      cellCount = row.length;
    }

    while (++index < cellCount) {
      position = row[index] ? dotindex(row[index]) : null;

      if (!sizes[index]) {
        sizes[index] = MIN_CELL_SIZE;
      }

      if (position > sizes[index]) {
        sizes[index] = position;
      }
    }
  }

  if (typeof alignment === 'string') {
    alignment = pad(cellCount, alignment).split('');
  }

  /* Make sure only valid alignments are used. */
  index = -1;

  while (++index < cellCount) {
    align = alignment[index];

    if (typeof align === 'string') {
      align = align.charAt(0).toLowerCase();
    }

    if (ALLIGNMENT.indexOf(align) === -1) {
      align = NULL;
    }

    alignment[index] = align;
  }

  rowIndex = -1;
  rows = [];

  while (++rowIndex < rowLength) {
    row = table[rowIndex];

    index = -1;
    cells = [];

    while (++index < cellCount) {
      value = row[index];

      value = stringify(value);

      if (alignment[index] === DOT) {
        position = dotindex(value);

        size = sizes[index] +
          (EXPRESSION_DOT.test(value) ? 0 : 1) -
          (calculateStringLength(value) - position);

        cells[index] = value + pad(size - 1);
      } else {
        cells[index] = value;
      }
    }

    rows[rowIndex] = cells;
  }

  sizes = [];
  rowIndex = -1;

  while (++rowIndex < rowLength) {
    cells = rows[rowIndex];

    index = -1;

    while (++index < cellCount) {
      value = cells[index];

      if (!sizes[index]) {
        sizes[index] = MIN_CELL_SIZE;
      }

      size = calculateStringLength(value);

      if (size > sizes[index]) {
        sizes[index] = size;
      }
    }
  }

  rowIndex = -1;

  while (++rowIndex < rowLength) {
    cells = rows[rowIndex];

    index = -1;

    if (settings.pad !== false) {
      while (++index < cellCount) {
        value = cells[index];

        position = sizes[index] - (calculateStringLength(value) || 0);
        spacing = pad(position);

        if (alignment[index] === RIGHT || alignment[index] === DOT) {
          value = spacing + value;
        } else if (alignment[index] === CENTER) {
          position /= 2;

          if (position % 1 === 0) {
            before = position;
            after = position;
          } else {
            before = position + 0.5;
            after = position - 0.5;
          }

          value = pad(before) + value + pad(after);
        } else {
          value += spacing;
        }

        cells[index] = value;
      }
    }

    rows[rowIndex] = cells.join(delimiter);
  }

  if (settings.rule !== false) {
    index = -1;
    rule = [];

    while (++index < cellCount) {
      /* When `pad` is false, make the rule the same size as the first row. */
      if (settings.pad === false) {
        value = table[0][index];
        spacing = calculateStringLength(stringify(value));
        spacing = spacing > MIN_CELL_SIZE ? spacing : MIN_CELL_SIZE;
      } else {
        spacing = sizes[index];
      }

      align = alignment[index];

      /* When `align` is left, don't add colons. */
      value = align === RIGHT || align === NULL ? DASH : COLON;
      value += pad(spacing - 2, DASH);
      value += align !== LEFT && align !== NULL ? COLON : DASH;

      rule[index] = value;
    }

    rows.splice(1, 0, rule.join(delimiter));
  }

  return start + rows.join(end + NEW_LINE + start) + end;
}

function stringify(value) {
  return (value === null || value === undefined) ? '' : String(value);
}

/* Get the length of `value`. */
function lengthNoop(value) {
  return String(value).length;
}

/* Get a string consisting of `length` `character`s. */
function pad(length, character) {
  return Array(length + 1).join(character || SPACE);
}

/* Get the position of the last dot in `value`. */
function dotindex(value) {
  var match = EXPRESSION_LAST_DOT.exec(value);

  return match ? match.index + 1 : value.length;
}

},{}],33:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module mdast:util:compact
 * @fileoverview Make an MDAST tree compact.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var visit = require('unist-util-visit');
var modify = require('unist-util-modify-children');

/* Expose. */
module.exports = compact;

/**
 * Make an MDAST tree compact by merging adjacent text
 * nodes.
 *
 * @param {Node} tree - Node.
 * @return {Node} - Node without `position`s.
 */
function compact(tree, commonmark) {
  var modifier = modify(iterator);

  visit(tree, visitor);

  return tree;

  function visitor(node) {
    if (node.children) {
      modifier(node);
    }
  }

  function iterator(child, index, parent) {
    var siblings = parent.children;
    var prev = index && siblings[index - 1];

    if (
      prev &&
      child.type === prev.type &&
      mergeable(prev, commonmark) &&
      mergeable(child, commonmark)
    ) {
      if (child.value) {
        prev.value += child.value;
      }

      if (child.children) {
        prev.children = prev.children.concat(child.children);
      }

      siblings.splice(index, 1);

      if (prev.position && child.position) {
        prev.position.end = child.position.end;
      }

      return index;
    }
  }
}

function mergeable(node, commonmark) {
  var start;
  var end;

  if (node.type === 'text') {
    if (!node.position) {
      return true;
    }

    start = node.position.start;
    end = node.position.end;

    /* Only merge nodes which occupy the same size as their `value`. */
    return start.line !== end.line ||
      end.column - start.column === node.value.length;
  }

  return commonmark && node.type === 'blockquote';
}

},{"unist-util-modify-children":146,"unist-util-visit":149}],34:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],35:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module parse-entities
 * @fileoverview Parse HTML character references: fast, spec-compliant,
 *   positional information.
 */

'use strict';

/* Dependencies. */
var has = require('has');
var characterEntities = require('character-entities');
var legacy = require('character-entities-legacy');
var invalid = require('character-reference-invalid');
var decimal = require('is-decimal');
var hexadecimal = require('is-hexadecimal');
var alphanumerical = require('is-alphanumerical');

/* Expose. */
module.exports = wrapper;

/* Methods. */
var fromCharCode = String.fromCharCode;
var noop = Function.prototype;

/* Characters. */
var REPLACEMENT = '\uFFFD';
var FORM_FEED = '\f';
var AMPERSAND = '&';
var OCTOTHORP = '#';
var SEMICOLON = ';';
var NEWLINE = '\n';
var X_LOWER = 'x';
var X_UPPER = 'X';
var SPACE = ' ';
var LESS_THAN = '<';
var EQUAL = '=';
var EMPTY = '';
var TAB = '\t';

/* Default settings. */
var defaults = {
  warning: null,
  reference: null,
  text: null,
  warningContext: null,
  referenceContext: null,
  textContext: null,
  position: {},
  additional: null,
  attribute: false,
  nonTerminated: true
};

/* Reference types. */
var NAMED = 'named';
var HEXADECIMAL = 'hexadecimal';
var DECIMAL = 'decimal';

/* Map of bases. */
var BASE = {};

BASE[HEXADECIMAL] = 16;
BASE[DECIMAL] = 10;

/* Map of types to tests. Each type of character reference
 * accepts different characters. This test is used to
 * detect whether a reference has ended (as the semicolon
 * is not strictly needed). */
var TESTS = {};

TESTS[NAMED] = alphanumerical;
TESTS[DECIMAL] = decimal;
TESTS[HEXADECIMAL] = hexadecimal;

/* Warning messages. */
var NAMED_NOT_TERMINATED = 1;
var NUMERIC_NOT_TERMINATED = 2;
var NAMED_EMPTY = 3;
var NUMERIC_EMPTY = 4;
var NAMED_UNKNOWN = 5;
var NUMERIC_DISALLOWED = 6;
var NUMERIC_PROHIBITED = 7;

var NUMERIC_REFERENCE = 'Numeric character references';
var NAMED_REFERENCE = 'Named character references';
var TERMINATED = ' must be terminated by a semicolon';
var VOID = ' cannot be empty';

var MESSAGES = {};

MESSAGES[NAMED_NOT_TERMINATED] = NAMED_REFERENCE + TERMINATED;
MESSAGES[NUMERIC_NOT_TERMINATED] = NUMERIC_REFERENCE + TERMINATED;
MESSAGES[NAMED_EMPTY] = NAMED_REFERENCE + VOID;
MESSAGES[NUMERIC_EMPTY] = NUMERIC_REFERENCE + VOID;
MESSAGES[NAMED_UNKNOWN] = NAMED_REFERENCE + ' must be known';
MESSAGES[NUMERIC_DISALLOWED] = NUMERIC_REFERENCE + ' cannot be disallowed';
MESSAGES[NUMERIC_PROHIBITED] = NUMERIC_REFERENCE + ' cannot be outside the ' +
    'permissible Unicode range';

/**
 * Wrap to ensure clean parameters are given to `parse`.
 *
 * @param {string} value - Value with entities.
 * @param {Object?} [options] - Configuration.
 */
function wrapper(value, options) {
  var settings = {};
  var key;

  if (!options) {
    options = {};
  }

  for (key in defaults) {
    settings[key] = options[key] == null ? defaults[key] : options[key];
  }

  if (settings.position.indent || settings.position.start) {
    settings.indent = settings.position.indent || [];
    settings.position = settings.position.start;
  }

  return parse(value, settings);
}

/**
 * Parse entities.
 *
 * @param {string} value - Value to tokenise.
 * @param {Object?} [settings] - Configuration.
 */
function parse(value, settings) {
  var additional = settings.additional;
  var nonTerminated = settings.nonTerminated;
  var handleText = settings.text;
  var handleReference = settings.reference;
  var handleWarning = settings.warning;
  var textContext = settings.textContext;
  var referenceContext = settings.referenceContext;
  var warningContext = settings.warningContext;
  var pos = settings.position;
  var indent = settings.indent || [];
  var length = value.length;
  var index = 0;
  var lines = -1;
  var column = pos.column || 1;
  var line = pos.line || 1;
  var queue = EMPTY;
  var result = [];
  var entityCharacters;
  var terminated;
  var characters;
  var character;
  var reference;
  var following;
  var warning;
  var reason;
  var output;
  var entity;
  var begin;
  var start;
  var type;
  var test;
  var prev;
  var next;
  var diff;
  var end;

  /* Cache the current point. */
  prev = now();

  /* Wrap `handleWarning`. */
  warning = handleWarning ? parseError : noop;

  /* Ensure the algorithm walks over the first character
   * and the end (inclusive). */
  index--;
  length++;

  while (++index < length) {
    /* If the previous character was a newline. */
    if (character === NEWLINE) {
      column = indent[lines] || 1;
    }

    character = at(index);

    /* Handle anything other than an ampersand,
     * including newlines and EOF. */
    if (character !== AMPERSAND) {
      if (character === NEWLINE) {
        line++;
        lines++;
        column = 0;
      }

      if (character) {
        queue += character;
        column++;
      } else {
        flush();
      }
    } else {
      following = at(index + 1);

      /* The behaviour depends on the identity of the next
       * character. */
      if (
        following === TAB ||
        following === NEWLINE ||
        following === FORM_FEED ||
        following === SPACE ||
        following === LESS_THAN ||
        following === AMPERSAND ||
        following === EMPTY ||
        (additional && following === additional)
      ) {
        /* Not a character reference. No characters
         * are consumed, and nothing is returned.
         * This is not an error, either. */
        queue += character;
        column++;

        continue;
      }

      start = begin = end = index + 1;

      /* Numerical entity. */
      if (following !== OCTOTHORP) {
        type = NAMED;
      } else {
        end = ++begin;

        /* The behaviour further depends on the
         * character after the U+0023 NUMBER SIGN. */
        following = at(end);

        if (following === X_LOWER || following === X_UPPER) {
          /* ASCII hex digits. */
          type = HEXADECIMAL;
          end = ++begin;
        } else {
          /* ASCII digits. */
          type = DECIMAL;
        }
      }

      entityCharacters = entity = characters = EMPTY;
      test = TESTS[type];
      end--;

      while (++end < length) {
        following = at(end);

        if (!test(following)) {
          break;
        }

        characters += following;

        /* Check if we can match a legacy named
         * reference.  If so, we cache that as the
         * last viable named reference.  This
         * ensures we do not need to walk backwards
         * later. */
        if (type === NAMED && has(legacy, characters)) {
          entityCharacters = characters;
          entity = legacy[characters];
        }
      }

      terminated = at(end) === SEMICOLON;

      if (terminated) {
        end++;

        if (type === NAMED && has(characterEntities, characters)) {
          entityCharacters = characters;
          entity = characterEntities[characters];
        }
      }

      diff = 1 + end - start;

      if (!terminated && !nonTerminated) {
        /* Empty. */
      } else if (!characters) {
        /* An empty (possible) entity is valid, unless
         * its numeric (thus an ampersand followed by
         * an octothorp). */
        if (type !== NAMED) {
          warning(NUMERIC_EMPTY, diff);
        }
      } else if (type === NAMED) {
        /* An ampersand followed by anything
         * unknown, and not terminated, is invalid. */
        if (terminated && !entity) {
          warning(NAMED_UNKNOWN, 1);
        } else {
          /* If theres something after an entity
           * name which is not known, cap the
           * reference. */
          if (entityCharacters !== characters) {
            end = begin + entityCharacters.length;
            diff = 1 + end - begin;
            terminated = false;
          }

          /* If the reference is not terminated,
           * warn. */
          if (!terminated) {
            reason = entityCharacters ?
              NAMED_NOT_TERMINATED :
              NAMED_EMPTY;

            if (!settings.attribute) {
              warning(reason, diff);
            } else {
              following = at(end);

              if (following === EQUAL) {
                warning(reason, diff);
                entity = null;
              } else if (alphanumerical(following)) {
                entity = null;
              } else {
                warning(reason, diff);
              }
            }
          }
        }

        reference = entity;
      } else {
        if (!terminated) {
          /* All non-terminated numeric entities are
           * not rendered, and trigger a warning. */
          warning(NUMERIC_NOT_TERMINATED, diff);
        }

        /* When terminated and number, parse as
         * either hexadecimal or decimal. */
        reference = parseInt(characters, BASE[type]);

        /* Trigger a warning when the parsed number
         * is prohibited, and replace with
         * replacement character. */
        if (isProhibited(reference)) {
          warning(NUMERIC_PROHIBITED, diff);

          reference = REPLACEMENT;
        } else if (reference in invalid) {
          /* Trigger a warning when the parsed number
           * is disallowed, and replace by an
           * alternative. */
          warning(NUMERIC_DISALLOWED, diff);

          reference = invalid[reference];
        } else {
          /* Parse the number. */
          output = EMPTY;

          /* Trigger a warning when the parsed
           * number should not be used. */
          if (isWarning(reference)) {
            warning(NUMERIC_DISALLOWED, diff);
          }

          /* Stringify the number. */
          if (reference > 0xFFFF) {
            reference -= 0x10000;
            output += fromCharCode((reference >>> (10 & 0x3FF)) | 0xD800);
            reference = 0xDC00 | (reference & 0x3FF);
          }

          reference = output + fromCharCode(reference);
        }
      }

      /* If we could not find a reference, queue the
       * checked characters (as normal characters),
       * and move the pointer to their end. This is
       * possible because we can be certain neither
       * newlines nor ampersands are included. */
      if (!reference) {
        characters = value.slice(start - 1, end);
        queue += characters;
        column += characters.length;
        index = end - 1;
      } else {
        /* Found it! First eat the queued
         * characters as normal text, then eat
         * an entity. */
        flush();

        prev = now();
        index = end - 1;
        column += end - start + 1;
        result.push(reference);
        next = now();
        next.offset++;

        if (handleReference) {
          handleReference.call(referenceContext, reference, {
            start: prev,
            end: next
          }, value.slice(start - 1, end));
        }

        prev = next;
      }
    }
  }

  /* Return the reduced nodes, and any possible warnings. */
  return result.join(EMPTY);

  /**
   * Get current position.
   *
   * @return {Object} - Positional information of a
   *   single point.
   */
  function now() {
    return {
      line: line,
      column: column,
      offset: index + (pos.offset || 0)
    };
  }

  /**
   * “Throw” a parse-error: a warning.
   *
   * @param {number} code - Identifier of reason for
   *   failing.
   * @param {number} offset - Offset in characters from
   *   the current position point at which the
   *   parse-error ocurred, cannot point past newlines.
   */
  function parseError(code, offset) {
    var position = now();

    position.column += offset;
    position.offset += offset;

    handleWarning.call(warningContext, MESSAGES[code], position, code);
  }

  /**
   * Get character at position.
   *
   * @param {number} position - Indice of character in `value`.
   * @return {string} - Character at `position` in
   *   `value`.
   */
  function at(position) {
    return value.charAt(position);
  }

  /**
   * Flush `queue` (normal text). Macro invoked before
   * each entity and at the end of `value`.
   *
   * Does nothing when `queue` is empty.
   */
  function flush() {
    if (queue) {
      result.push(queue);

      if (handleText) {
        handleText.call(textContext, queue, {
          start: prev,
          end: now()
        });
      }

      queue = EMPTY;
    }
  }
}

/**
 * Check whether `character` is outside the permissible
 * unicode range.
 *
 * @param {number} code - Value.
 * @return {boolean} - Whether `character` is an
 *   outside the permissible unicode range.
 */
function isProhibited(code) {
  return (code >= 0xD800 && code <= 0xDFFF) || (code > 0x10FFFF);
}

/**
 * Check whether `character` is disallowed.
 *
 * @param {number} code - Value.
 * @return {boolean} - Whether `character` is disallowed.
 */
function isWarning(code) {
  if (
    (code >= 0x0001 && code <= 0x0008) ||
    code === 0x000B ||
    (code >= 0x000D && code <= 0x001F) ||
    (code >= 0x007F && code <= 0x009F) ||
    (code >= 0xFDD0 && code <= 0xFDEF) ||
    (code & 0xFFFF) === 0xFFFF ||
    (code & 0xFFFF) === 0xFFFE
  ) {
    return true;
  }

  return false;
}

},{"character-entities":11,"character-entities-legacy":10,"character-reference-invalid":12,"has":19,"is-alphanumerical":23,"is-decimal":25,"is-hexadecimal":26}],36:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":37}],37:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],38:[function(require,module,exports){
'use strict';

var unherit = require('unherit');
var xtend = require('xtend');
var Parser = require('./lib/parser.js');

module.exports = parse;
parse.Parser = Parser;

function parse(options) {
  var Local = unherit(Parser);
  Local.prototype.options = xtend(Local.prototype.options, this.data('settings'), options);
  this.Parser = Local;
}

},{"./lib/parser.js":52,"unherit":144,"xtend":154}],39:[function(require,module,exports){
module.exports=[
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "meta",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "pre",
  "section",
  "source",
  "title",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
]

},{}],40:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:decode
 * @fileoverview Decode entities.
 */

'use strict';

var entities = require('parse-entities');

module.exports = factory;

/* Factory to create an entity decoder. */
function factory(ctx) {
  decoder.raw = decodeRaw;

  return decoder;

  /* Normalize `position` to add an `indent`. */
  function normalize(position) {
    var offsets = ctx.offset;
    var line = position.line;
    var result = [];

    while (++line) {
      if (!(line in offsets)) {
        break;
      }

      result.push((offsets[line] || 0) + 1);
    }

    return {
      start: position,
      indent: result
    };
  }

  /* Handle a warning.
   * See https://github.com/wooorm/parse-entities
   * for the warnings. */
  function handleWarning(reason, position, code) {
    if (code === 3) {
      return;
    }

    ctx.file.message(reason, position);
  }

  /* Decode `value` (at `position`) into text-nodes. */
  function decoder(value, position, handler) {
    entities(value, {
      position: normalize(position),
      warning: handleWarning,
      text: handler,
      reference: handler,
      textContext: ctx,
      referenceContext: ctx
    });
  }

  /* Decode `value` (at `position`) into a string. */
  function decodeRaw(value, position) {
    return entities(value, {
      position: normalize(position),
      warning: handleWarning
    });
  }
}

},{"parse-entities":35}],41:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:defaults
 * @fileoverview Default options for `parse`.
 */

'use strict';

/* Expose. */
module.exports = {
  position: true,
  gfm: true,
  yaml: true,
  commonmark: false,
  footnotes: false,
  pedantic: false,
  blocks: require('./block-elements'),
  breaks: false
};

},{"./block-elements":39}],42:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:break
 * @fileoverview Locate a break.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  var index = value.indexOf('\n', fromIndex);

  while (index > fromIndex) {
    if (value.charAt(index - 1) !== ' ') {
      break;
    }

    index--;
  }

  return index;
}

},{}],43:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:code-inline
 * @fileoverview Locate inline code.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  return value.indexOf('`', fromIndex);
}

},{}],44:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:delete
 * @fileoverview Locate strikethrough.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  return value.indexOf('~~', fromIndex);
}

},{}],45:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:emphasis
 * @fileoverview Locate italics / emphasis.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  var asterisk = value.indexOf('*', fromIndex);
  var underscore = value.indexOf('_', fromIndex);

  if (underscore === -1) {
    return asterisk;
  }

  if (asterisk === -1) {
    return underscore;
  }

  return underscore < asterisk ? underscore : asterisk;
}

},{}],46:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:escape
 * @fileoverview Locate an escape.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  return value.indexOf('\\', fromIndex);
}

},{}],47:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:link
 * @fileoverview Locate a link.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  var link = value.indexOf('[', fromIndex);
  var image = value.indexOf('![', fromIndex);

  if (image === -1) {
    return link;
  }

  /* Link can never be `-1` if an image is found, so we don’t need
   * to check for that :) */
  return link < image ? link : image;
}

},{}],48:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:strong
 * @fileoverview Locate bold / strong / importance.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  var asterisk = value.indexOf('**', fromIndex);
  var underscore = value.indexOf('__', fromIndex);

  if (underscore === -1) {
    return asterisk;
  }

  if (asterisk === -1) {
    return underscore;
  }

  return underscore < asterisk ? underscore : asterisk;
}

},{}],49:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:tag
 * @fileoverview Locate a tag.
 */

'use strict';

module.exports = locate;

function locate(value, fromIndex) {
  return value.indexOf('<', fromIndex);
}

},{}],50:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:locate:url
 * @fileoverview Locate a URL.
 */

'use strict';

module.exports = locate;

var PROTOCOLS = ['https://', 'http://', 'mailto:'];

function locate(value, fromIndex) {
  var length = PROTOCOLS.length;
  var index = -1;
  var min = -1;
  var position;

  if (!this.options.gfm) {
    return -1;
  }

  while (++index < length) {
    position = value.indexOf(PROTOCOLS[index], fromIndex);

    if (position !== -1 && (position < min || min === -1)) {
      min = position;
    }
  }

  return min;
}

},{}],51:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:parse
 * @fileoverview Parse the document
 */

'use strict';

var xtend = require('xtend');
var removePosition = require('unist-util-remove-position');

module.exports = parse;

var C_NEWLINE = '\n';
var EXPRESSION_LINE_BREAKS = /\r\n|\r/g;

/* Parse the bound file. */
function parse() {
  var self = this;
  var value = String(self.file);
  var start = {line: 1, column: 1, offset: 0};
  var content = xtend(start);
  var node;

  /* Clean non-unix newlines: `\r\n` and `\r` are all
   * changed to `\n`.  This should not affect positional
   * information. */
  value = value.replace(EXPRESSION_LINE_BREAKS, C_NEWLINE);

  if (value.charCodeAt(0) === 0xFEFF) {
    value = value.slice(1);

    content.column++;
    content.offset++;
  }

  node = {
    type: 'root',
    children: self.tokenizeBlock(value, content),
    position: {
      start: start,
      end: self.eof || xtend(start)
    }
  };

  if (!self.options.position) {
    removePosition(node, true);
  }

  return node;
}

},{"unist-util-remove-position":147,"xtend":154}],52:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse
 * @fileoverview Markdown parser.
 */

'use strict';

var xtend = require('xtend');
var toggle = require('state-toggle');
var vfileLocation = require('vfile-location');
var unescape = require('./unescape');
var decode = require('./decode');
var tokenizer = require('./tokenizer');

module.exports = Parser;

/* Construct a new parser. */
function Parser(doc, file) {
  this.file = file;
  this.offset = {};
  this.options = xtend(this.options);
  this.setOptions({});

  this.inList = false;
  this.inBlock = false;
  this.inLink = false;
  this.atStart = true;

  this.toOffset = vfileLocation(file).toOffset;
  this.unescape = unescape(this, 'escape');
  this.decode = decode(this);
}

/* Prototype. */
var proto = Parser.prototype;

/* Expose core. */
proto.setOptions = require('./set-options');
proto.parse = require('./parse');

/* Expose `defaults`. */
proto.options = require('./defaults');

/* Enter and exit helpers. */
proto.exitStart = toggle('atStart', true);
proto.enterList = toggle('inList', false);
proto.enterLink = toggle('inLink', false);
proto.enterBlock = toggle('inBlock', false);

/* Nodes that can interupt a paragraph:
 *
 * ```markdown
 * A paragraph, followed by a thematic break.
 * ___
 * ```
 *
 * In the above example, the thematic break “interupts”
 * the paragraph. */
proto.interruptParagraph = [
  ['thematicBreak'],
  ['atxHeading'],
  ['fencedCode'],
  ['blockquote'],
  ['html'],
  ['setextHeading', {commonmark: false}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
];

/* Nodes that can interupt a list:
 *
 * ```markdown
 * - One
 * ___
 * ```
 *
 * In the above example, the thematic break “interupts”
 * the list. */
proto.interruptList = [
  ['fencedCode', {pedantic: false}],
  ['thematicBreak', {pedantic: false}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
];

/* Nodes that can interupt a blockquote:
 *
 * ```markdown
 * > A paragraph.
 * ___
 * ```
 *
 * In the above example, the thematic break “interupts”
 * the blockquote. */
proto.interruptBlockquote = [
  ['indentedCode', {commonmark: true}],
  ['fencedCode', {commonmark: true}],
  ['atxHeading', {commonmark: true}],
  ['setextHeading', {commonmark: true}],
  ['thematicBreak', {commonmark: true}],
  ['html', {commonmark: true}],
  ['list', {commonmark: true}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
];

/* Handlers. */
proto.blockTokenizers = {
  yamlFrontMatter: require('./tokenize/yaml'),
  newline: require('./tokenize/newline'),
  indentedCode: require('./tokenize/code-indented'),
  fencedCode: require('./tokenize/code-fenced'),
  blockquote: require('./tokenize/blockquote'),
  atxHeading: require('./tokenize/heading-atx'),
  thematicBreak: require('./tokenize/thematic-break'),
  list: require('./tokenize/list'),
  setextHeading: require('./tokenize/heading-setext'),
  html: require('./tokenize/html-block'),
  footnote: require('./tokenize/footnote-definition'),
  definition: require('./tokenize/definition'),
  table: require('./tokenize/table'),
  paragraph: require('./tokenize/paragraph')
};

proto.inlineTokenizers = {
  escape: require('./tokenize/escape'),
  autoLink: require('./tokenize/auto-link'),
  url: require('./tokenize/url'),
  html: require('./tokenize/html-inline'),
  link: require('./tokenize/link'),
  reference: require('./tokenize/reference'),
  strong: require('./tokenize/strong'),
  emphasis: require('./tokenize/emphasis'),
  deletion: require('./tokenize/delete'),
  code: require('./tokenize/code-inline'),
  break: require('./tokenize/break'),
  text: require('./tokenize/text')
};

/* Expose precedence. */
proto.blockMethods = keys(proto.blockTokenizers);
proto.inlineMethods = keys(proto.inlineTokenizers);

/* Tokenizers. */
proto.tokenizeBlock = tokenizer('block');
proto.tokenizeInline = tokenizer('inline');
proto.tokenizeFactory = tokenizer;

/* Get all keys in `value`. */
function keys(value) {
  var result = [];
  var key;

  for (key in value) {
    result.push(key);
  }

  return result;
}

},{"./decode":40,"./defaults":41,"./parse":51,"./set-options":53,"./tokenize/auto-link":54,"./tokenize/blockquote":55,"./tokenize/break":56,"./tokenize/code-fenced":57,"./tokenize/code-indented":58,"./tokenize/code-inline":59,"./tokenize/definition":60,"./tokenize/delete":61,"./tokenize/emphasis":62,"./tokenize/escape":63,"./tokenize/footnote-definition":64,"./tokenize/heading-atx":65,"./tokenize/heading-setext":66,"./tokenize/html-block":67,"./tokenize/html-inline":68,"./tokenize/link":69,"./tokenize/list":70,"./tokenize/newline":71,"./tokenize/paragraph":72,"./tokenize/reference":73,"./tokenize/strong":74,"./tokenize/table":75,"./tokenize/text":76,"./tokenize/thematic-break":77,"./tokenize/url":78,"./tokenize/yaml":79,"./tokenizer":80,"./unescape":81,"state-toggle":135,"vfile-location":150,"xtend":154}],53:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse
 * @fileoverview Markdown parser.
 */

'use strict';

var xtend = require('xtend');
var escapes = require('markdown-escapes');
var defaults = require('./defaults');

module.exports = setOptions;

/* Set options. */
function setOptions(options) {
  var self = this;
  var current = self.options;
  var key;
  var value;

  if (options == null) {
    options = {};
  } else if (typeof options === 'object') {
    options = xtend(options);
  } else {
    throw new Error(
      'Invalid value `' + options + '` ' +
      'for setting `options`'
    );
  }

  for (key in defaults) {
    value = options[key];

    if (value == null) {
      value = current[key];
    }

    if (
      (key !== 'blocks' && typeof value !== 'boolean') ||
      (key === 'blocks' && typeof value !== 'object')
    ) {
      throw new Error(
        'Invalid value `' + value + '` ' +
        'for setting `options.' + key + '`'
      );
    }

    options[key] = value;
  }

  self.options = options;
  self.escape = escapes(options);

  return self;
}

},{"./defaults":41,"markdown-escapes":31,"xtend":154}],54:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:auto-link
 * @fileoverview Tokenise an auto-link.
 */

'use strict';

var decode = require('parse-entities');
var locate = require('../locate/tag');

module.exports = autoLink;
autoLink.locator = locate;
autoLink.notInLink = true;

var C_LT = '<';
var C_GT = '>';
var C_AT_SIGN = '@';
var C_SLASH = '/';
var MAILTO = 'mailto:';
var MAILTO_LENGTH = MAILTO.length;

/* Tokenise a link. */
function autoLink(eat, value, silent) {
  var self;
  var subvalue;
  var length;
  var index;
  var queue;
  var character;
  var hasAtCharacter;
  var link;
  var now;
  var content;
  var tokenize;
  var exit;

  if (value.charAt(0) !== C_LT) {
    return;
  }

  self = this;
  subvalue = '';
  length = value.length;
  index = 0;
  queue = '';
  hasAtCharacter = false;
  link = '';

  index++;
  subvalue = C_LT;

  while (index < length) {
    character = value.charAt(index);

    if (
      character === ' ' ||
      character === C_GT ||
      character === C_AT_SIGN ||
      (character === ':' && value.charAt(index + 1) === C_SLASH)
    ) {
      break;
    }

    queue += character;
    index++;
  }

  if (!queue) {
    return;
  }

  link += queue;
  queue = '';

  character = value.charAt(index);
  link += character;
  index++;

  if (character === C_AT_SIGN) {
    hasAtCharacter = true;
  } else {
    if (
      character !== ':' ||
      value.charAt(index + 1) !== C_SLASH
    ) {
      return;
    }

    link += C_SLASH;
    index++;
  }

  while (index < length) {
    character = value.charAt(index);

    if (character === ' ' || character === C_GT) {
      break;
    }

    queue += character;
    index++;
  }

  character = value.charAt(index);

  if (!queue || character !== C_GT) {
    return;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  link += queue;
  content = link;
  subvalue += link + character;
  now = eat.now();
  now.column++;
  now.offset++;

  if (hasAtCharacter) {
    if (link.slice(0, MAILTO_LENGTH).toLowerCase() === MAILTO) {
      content = content.substr(MAILTO_LENGTH);
      now.column += MAILTO_LENGTH;
      now.offset += MAILTO_LENGTH;
    } else {
      link = MAILTO + link;
    }
  }

  /* Temporarily remove support for escapes in autolinks. */
  tokenize = self.inlineTokenizers.escape;
  self.inlineTokenizers.escape = null;
  exit = self.enterLink();

  content = self.tokenizeInline(content, now);

  self.inlineTokenizers.escape = tokenize;
  exit();

  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(link),
    children: content
  });
}

},{"../locate/tag":49,"parse-entities":35}],55:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:blockquote
 * @fileoverview Tokenise blockquote.
 */

'use strict';

var trim = require('trim');
var interrupt = require('../util/interrupt');

module.exports = blockquote;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_GT = '>';

/* Tokenise a blockquote. */
function blockquote(eat, value, silent) {
  var self = this;
  var offsets = self.offset;
  var tokenizers = self.blockTokenizers;
  var interruptors = self.interruptBlockquote;
  var now = eat.now();
  var currentLine = now.line;
  var length = value.length;
  var values = [];
  var contents = [];
  var indents = [];
  var add;
  var index = 0;
  var character;
  var rest;
  var nextIndex;
  var content;
  var line;
  var startIndex;
  var prefixed;
  var exit;

  while (index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      break;
    }

    index++;
  }

  if (value.charAt(index) !== C_GT) {
    return;
  }

  if (silent) {
    return true;
  }

  index = 0;

  while (index < length) {
    nextIndex = value.indexOf(C_NEWLINE, index);
    startIndex = index;
    prefixed = false;

    if (nextIndex === -1) {
      nextIndex = length;
    }

    while (index < length) {
      character = value.charAt(index);

      if (character !== C_SPACE && character !== C_TAB) {
        break;
      }

      index++;
    }

    if (value.charAt(index) === C_GT) {
      index++;
      prefixed = true;

      if (value.charAt(index) === C_SPACE) {
        index++;
      }
    } else {
      index = startIndex;
    }

    content = value.slice(index, nextIndex);

    if (!prefixed && !trim(content)) {
      index = startIndex;
      break;
    }

    if (!prefixed) {
      rest = value.slice(index);

      /* Check if the following code contains a possible
       * block. */
      if (interrupt(interruptors, tokenizers, self, [eat, rest, true])) {
        break;
      }
    }

    line = startIndex === index ? content : value.slice(startIndex, nextIndex);

    indents.push(index - startIndex);
    values.push(line);
    contents.push(content);

    index = nextIndex + 1;
  }

  index = -1;
  length = indents.length;
  add = eat(values.join(C_NEWLINE));

  while (++index < length) {
    offsets[currentLine] = (offsets[currentLine] || 0) + indents[index];
    currentLine++;
  }

  exit = self.enterBlock();
  contents = self.tokenizeBlock(contents.join(C_NEWLINE), now);
  exit();

  return add({
    type: 'blockquote',
    children: contents
  });
}

},{"../util/interrupt":84,"trim":142}],56:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:break
 * @fileoverview Tokenise a break.
 */

'use strict';

var locate = require('../locate/break');

module.exports = hardBreak;
hardBreak.locator = locate;

var MIN_BREAK_LENGTH = 2;

/* Tokenise a break. */
function hardBreak(eat, value, silent) {
  var self = this;
  var breaks = self.options.breaks;
  var length = value.length;
  var index = -1;
  var queue = '';
  var character;

  while (++index < length) {
    character = value.charAt(index);

    if (character === '\n') {
      if (!breaks && index < MIN_BREAK_LENGTH) {
        return;
      }

      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true;
      }

      queue += character;

      return eat(queue)({type: 'break'});
    }

    if (character !== ' ') {
      return;
    }

    queue += character;
  }
}

},{"../locate/break":42}],57:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:code-fenced
 * @fileoverview Tokenise fenced code.
 */

'use strict';

var trim = require('trim-trailing-lines');

module.exports = fencedCode;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_TILDE = '~';
var C_TICK = '`';

var MIN_FENCE_COUNT = 3;
var CODE_INDENT_COUNT = 4;

/* Tokenise fenced code. */
function fencedCode(eat, value, silent) {
  var self = this;
  var settings = self.options;
  var length = value.length + 1;
  var index = 0;
  var subvalue = '';
  var fenceCount;
  var marker;
  var character;
  var flag;
  var queue;
  var content;
  var exdentedContent;
  var closing;
  var exdentedClosing;
  var indent;
  var now;

  if (!settings.gfm) {
    return;
  }

  /* Eat initial spacing. */
  while (index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      break;
    }

    subvalue += character;
    index++;
  }

  indent = index;

  /* Eat the fence. */
  character = value.charAt(index);

  if (character !== C_TILDE && character !== C_TICK) {
    return;
  }

  index++;
  marker = character;
  fenceCount = 1;
  subvalue += character;

  while (index < length) {
    character = value.charAt(index);

    if (character !== marker) {
      break;
    }

    subvalue += character;
    fenceCount++;
    index++;
  }

  if (fenceCount < MIN_FENCE_COUNT) {
    return;
  }

  /* Eat spacing before flag. */
  while (index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      break;
    }

    subvalue += character;
    index++;
  }

  /* Eat flag. */
  flag = '';
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (
      character === C_NEWLINE ||
      character === C_TILDE ||
      character === C_TICK
    ) {
      break;
    }

    if (character === C_SPACE || character === C_TAB) {
      queue += character;
    } else {
      flag += queue + character;
      queue = '';
    }

    index++;
  }

  character = value.charAt(index);

  if (character && character !== C_NEWLINE) {
    return;
  }

  if (silent) {
    return true;
  }

  now = eat.now();
  now.column += subvalue.length;
  now.offset += subvalue.length;

  subvalue += flag;
  flag = self.decode.raw(self.unescape(flag), now);

  if (queue) {
    subvalue += queue;
  }

  queue = '';
  closing = '';
  exdentedClosing = '';
  content = '';
  exdentedContent = '';

  /* Eat content. */
  while (index < length) {
    character = value.charAt(index);
    content += closing;
    exdentedContent += exdentedClosing;
    closing = '';
    exdentedClosing = '';

    if (character !== C_NEWLINE) {
      content += character;
      exdentedClosing += character;
      index++;
      continue;
    }

    /* Add the newline to `subvalue` if its the first
     * character.  Otherwise, add it to the `closing`
     * queue. */
    if (content) {
      closing += character;
      exdentedClosing += character;
    } else {
      subvalue += character;
    }

    queue = '';
    index++;

    while (index < length) {
      character = value.charAt(index);

      if (character !== C_SPACE) {
        break;
      }

      queue += character;
      index++;
    }

    closing += queue;
    exdentedClosing += queue.slice(indent);

    if (queue.length >= CODE_INDENT_COUNT) {
      continue;
    }

    queue = '';

    while (index < length) {
      character = value.charAt(index);

      if (character !== marker) {
        break;
      }

      queue += character;
      index++;
    }

    closing += queue;
    exdentedClosing += queue;

    if (queue.length < fenceCount) {
      continue;
    }

    queue = '';

    while (index < length) {
      character = value.charAt(index);

      if (character !== C_SPACE && character !== C_TAB) {
        break;
      }

      closing += character;
      exdentedClosing += character;
      index++;
    }

    if (!character || character === C_NEWLINE) {
      break;
    }
  }

  subvalue += content + closing;

  return eat(subvalue)({
    type: 'code',
    lang: flag || null,
    value: trim(exdentedContent)
  });
}

},{"trim-trailing-lines":141}],58:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:code-indented
 * @fileoverview Tokenise indented code.
 */

'use strict';

var repeat = require('repeat-string');
var trim = require('trim-trailing-lines');

module.exports = indentedCode;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';

var CODE_INDENT_COUNT = 4;
var CODE_INDENT = repeat(C_SPACE, CODE_INDENT_COUNT);

/* Tokenise indented code. */
function indentedCode(eat, value, silent) {
  var index = -1;
  var length = value.length;
  var subvalue = '';
  var content = '';
  var subvalueQueue = '';
  var contentQueue = '';
  var character;
  var blankQueue;
  var indent;

  while (++index < length) {
    character = value.charAt(index);

    if (indent) {
      indent = false;

      subvalue += subvalueQueue;
      content += contentQueue;
      subvalueQueue = '';
      contentQueue = '';

      if (character === C_NEWLINE) {
        subvalueQueue = character;
        contentQueue = character;
      } else {
        subvalue += character;
        content += character;

        while (++index < length) {
          character = value.charAt(index);

          if (!character || character === C_NEWLINE) {
            contentQueue = character;
            subvalueQueue = character;
            break;
          }

          subvalue += character;
          content += character;
        }
      }
    } else if (
      character === C_SPACE &&
      value.charAt(index + 1) === character &&
      value.charAt(index + 2) === character &&
      value.charAt(index + 3) === character
    ) {
      subvalueQueue += CODE_INDENT;
      index += 3;
      indent = true;
    } else if (character === C_TAB) {
      subvalueQueue += character;
      indent = true;
    } else {
      blankQueue = '';

      while (character === C_TAB || character === C_SPACE) {
        blankQueue += character;
        character = value.charAt(++index);
      }

      if (character !== C_NEWLINE) {
        break;
      }

      subvalueQueue += blankQueue + character;
      contentQueue += character;
    }
  }

  if (content) {
    if (silent) {
      return true;
    }

    return eat(subvalue)({
      type: 'code',
      lang: null,
      value: trim(content)
    });
  }
}

},{"repeat-string":133,"trim-trailing-lines":141}],59:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:code-inline
 * @fileoverview Tokenise inline code.
 */

'use strict';

var whitespace = require('is-whitespace-character');
var locate = require('../locate/code-inline');

module.exports = inlineCode;
inlineCode.locator = locate;

var C_TICK = '`';

/* Tokenise inline code. */
function inlineCode(eat, value, silent) {
  var length = value.length;
  var index = 0;
  var queue = '';
  var tickQueue = '';
  var contentQueue;
  var subqueue;
  var count;
  var openingCount;
  var subvalue;
  var character;
  var found;
  var next;

  while (index < length) {
    if (value.charAt(index) !== C_TICK) {
      break;
    }

    queue += C_TICK;
    index++;
  }

  if (!queue) {
    return;
  }

  subvalue = queue;
  openingCount = index;
  queue = '';
  next = value.charAt(index);
  count = 0;

  while (index < length) {
    character = next;
    next = value.charAt(index + 1);

    if (character === C_TICK) {
      count++;
      tickQueue += character;
    } else {
      count = 0;
      queue += character;
    }

    if (count && next !== C_TICK) {
      if (count === openingCount) {
        subvalue += queue + tickQueue;
        found = true;
        break;
      }

      queue += tickQueue;
      tickQueue = '';
    }

    index++;
  }

  if (!found) {
    if (openingCount % 2 !== 0) {
      return;
    }

    queue = '';
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  contentQueue = '';
  subqueue = '';
  length = queue.length;
  index = -1;

  while (++index < length) {
    character = queue.charAt(index);

    if (whitespace(character)) {
      subqueue += character;
      continue;
    }

    if (subqueue) {
      if (contentQueue) {
        contentQueue += subqueue;
      }

      subqueue = '';
    }

    contentQueue += character;
  }

  return eat(subvalue)({
    type: 'inlineCode',
    value: contentQueue
  });
}

},{"../locate/code-inline":43,"is-whitespace-character":28}],60:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:definition
 * @fileoverview Tokenise a definition.
 */

'use strict';

var whitespace = require('is-whitespace-character');
var normalize = require('../util/normalize');

module.exports = definition;
definition.notInList = true;
definition.notInBlock = true;

var C_DOUBLE_QUOTE = '"';
var C_SINGLE_QUOTE = '\'';
var C_BACKSLASH = '\\';
var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';
var C_PAREN_OPEN = '(';
var C_PAREN_CLOSE = ')';
var C_COLON = ':';
var C_LT = '<';
var C_GT = '>';

/* Tokenise a definition. */
function definition(eat, value, silent) {
  var self = this;
  var commonmark = self.options.commonmark;
  var index = 0;
  var length = value.length;
  var subvalue = '';
  var beforeURL;
  var beforeTitle;
  var queue;
  var character;
  var test;
  var identifier;
  var url;
  var title;

  while (index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      break;
    }

    subvalue += character;
    index++;
  }

  character = value.charAt(index);

  if (character !== C_BRACKET_OPEN) {
    return;
  }

  index++;
  subvalue += character;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (character === C_BRACKET_CLOSE) {
      break;
    } else if (character === C_BACKSLASH) {
      queue += character;
      index++;
      character = value.charAt(index);
    }

    queue += character;
    index++;
  }

  if (
    !queue ||
    value.charAt(index) !== C_BRACKET_CLOSE ||
    value.charAt(index + 1) !== C_COLON
  ) {
    return;
  }

  identifier = queue;
  subvalue += queue + C_BRACKET_CLOSE + C_COLON;
  index = subvalue.length;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (
      character !== C_TAB &&
      character !== C_SPACE &&
      character !== C_NEWLINE
    ) {
      break;
    }

    subvalue += character;
    index++;
  }

  character = value.charAt(index);
  queue = '';
  beforeURL = subvalue;

  if (character === C_LT) {
    index++;

    while (index < length) {
      character = value.charAt(index);

      if (!isEnclosedURLCharacter(character)) {
        break;
      }

      queue += character;
      index++;
    }

    character = value.charAt(index);

    if (character === isEnclosedURLCharacter.delimiter) {
      subvalue += C_LT + queue + character;
      index++;
    } else {
      if (commonmark) {
        return;
      }

      index -= queue.length + 1;
      queue = '';
    }
  }

  if (!queue) {
    while (index < length) {
      character = value.charAt(index);

      if (!isUnclosedURLCharacter(character)) {
        break;
      }

      queue += character;
      index++;
    }

    subvalue += queue;
  }

  if (!queue) {
    return;
  }

  url = queue;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (
      character !== C_TAB &&
      character !== C_SPACE &&
      character !== C_NEWLINE
    ) {
      break;
    }

    queue += character;
    index++;
  }

  character = value.charAt(index);
  test = null;

  if (character === C_DOUBLE_QUOTE) {
    test = C_DOUBLE_QUOTE;
  } else if (character === C_SINGLE_QUOTE) {
    test = C_SINGLE_QUOTE;
  } else if (character === C_PAREN_OPEN) {
    test = C_PAREN_CLOSE;
  }

  if (!test) {
    queue = '';
    index = subvalue.length;
  } else if (queue) {
    subvalue += queue + character;
    index = subvalue.length;
    queue = '';

    while (index < length) {
      character = value.charAt(index);

      if (character === test) {
        break;
      }

      if (character === C_NEWLINE) {
        index++;
        character = value.charAt(index);

        if (character === C_NEWLINE || character === test) {
          return;
        }

        queue += C_NEWLINE;
      }

      queue += character;
      index++;
    }

    character = value.charAt(index);

    if (character !== test) {
      return;
    }

    beforeTitle = subvalue;
    subvalue += queue + character;
    index++;
    title = queue;
    queue = '';
  } else {
    return;
  }

  while (index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    subvalue += character;
    index++;
  }

  character = value.charAt(index);

  if (!character || character === C_NEWLINE) {
    if (silent) {
      return true;
    }

    beforeURL = eat(beforeURL).test().end;
    url = self.decode.raw(self.unescape(url), beforeURL);

    if (title) {
      beforeTitle = eat(beforeTitle).test().end;
      title = self.decode.raw(self.unescape(title), beforeTitle);
    }

    return eat(subvalue)({
      type: 'definition',
      identifier: normalize(identifier),
      title: title || null,
      url: url
    });
  }
}

/* Check if `character` can be inside an enclosed URI. */
function isEnclosedURLCharacter(character) {
  return character !== C_GT &&
    character !== C_BRACKET_OPEN &&
    character !== C_BRACKET_CLOSE;
}

isEnclosedURLCharacter.delimiter = C_GT;

/* Check if `character` can be inside an unclosed URI. */
function isUnclosedURLCharacter(character) {
  return character !== C_BRACKET_OPEN &&
    character !== C_BRACKET_CLOSE &&
    !whitespace(character);
}

},{"../util/normalize":85,"is-whitespace-character":28}],61:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:delete
 * @fileoverview Tokenise strikethrough.
 */

'use strict';

var whitespace = require('is-whitespace-character');
var locate = require('../locate/delete');

module.exports = strikethrough;
strikethrough.locator = locate;

var C_TILDE = '~';
var DOUBLE = '~~';

/* Tokenise strikethrough. */
function strikethrough(eat, value, silent) {
  var self = this;
  var character = '';
  var previous = '';
  var preceding = '';
  var subvalue = '';
  var index;
  var length;
  var now;

  if (
    !self.options.gfm ||
    value.charAt(0) !== C_TILDE ||
    value.charAt(1) !== C_TILDE ||
    whitespace(value.charAt(2))
  ) {
    return;
  }

  index = 1;
  length = value.length;
  now = eat.now();
  now.column += 2;
  now.offset += 2;

  while (++index < length) {
    character = value.charAt(index);

    if (
      character === C_TILDE &&
      previous === C_TILDE &&
      (!preceding || !whitespace(preceding))
    ) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true;
      }

      return eat(DOUBLE + subvalue + DOUBLE)({
        type: 'delete',
        children: self.tokenizeInline(subvalue, now)
      });
    }

    subvalue += previous;
    preceding = previous;
    previous = character;
  }
}

},{"../locate/delete":44,"is-whitespace-character":28}],62:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:emphasis
 * @fileoverview Tokenise emphasis.
 */

'use strict';

var trim = require('trim');
var word = require('is-word-character');
var whitespace = require('is-whitespace-character');
var locate = require('../locate/emphasis');

module.exports = emphasis;
emphasis.locator = locate;

var C_ASTERISK = '*';
var C_UNDERSCORE = '_';

/* Tokenise emphasis. */
function emphasis(eat, value, silent) {
  var self = this;
  var index = 0;
  var character = value.charAt(index);
  var now;
  var pedantic;
  var marker;
  var queue;
  var subvalue;
  var length;
  var prev;

  if (character !== C_ASTERISK && character !== C_UNDERSCORE) {
    return;
  }

  pedantic = self.options.pedantic;
  subvalue = character;
  marker = character;
  length = value.length;
  index++;
  queue = '';
  character = '';

  if (pedantic && whitespace(value.charAt(index))) {
    return;
  }

  while (index < length) {
    prev = character;
    character = value.charAt(index);

    if (character === marker && (!pedantic || !whitespace(prev))) {
      character = value.charAt(++index);

      if (character !== marker) {
        if (!trim(queue) || prev === marker) {
          return;
        }

        if (!pedantic && marker === C_UNDERSCORE && word(character)) {
          queue += marker;
          continue;
        }

        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true;
        }

        now = eat.now();
        now.column++;
        now.offset++;

        return eat(subvalue + queue + marker)({
          type: 'emphasis',
          children: self.tokenizeInline(queue, now)
        });
      }

      queue += marker;
    }

    if (!pedantic && character === '\\') {
      queue += character;
      character = value.charAt(++index);
    }

    queue += character;
    index++;
  }
}

},{"../locate/emphasis":45,"is-whitespace-character":28,"is-word-character":29,"trim":142}],63:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:escape
 * @fileoverview Tokenise an escape.
 */

'use strict';

var locate = require('../locate/escape');

module.exports = escape;
escape.locator = locate;

/* Tokenise an escape. */
function escape(eat, value, silent) {
  var self = this;
  var character;
  var node;

  if (value.charAt(0) === '\\') {
    character = value.charAt(1);

    if (self.escape.indexOf(character) !== -1) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true;
      }

      if (character === '\n') {
        node = {type: 'break'};
      } else {
        node = {
          type: 'text',
          value: character
        };
      }

      return eat('\\' + character)(node);
    }
  }
}

},{"../locate/escape":46}],64:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:footnote-definition
 * @fileoverview Tokenise footnote definition.
 */

'use strict';

var whitespace = require('is-whitespace-character');
var normalize = require('../util/normalize');

module.exports = footnoteDefinition;
footnoteDefinition.notInList = true;
footnoteDefinition.notInBlock = true;

var C_BACKSLASH = '\\';
var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';
var C_CARET = '^';
var C_COLON = ':';

var EXPRESSION_INITIAL_TAB = /^( {4}|\t)?/gm;

/* Tokenise a footnote definition. */
function footnoteDefinition(eat, value, silent) {
  var self = this;
  var offsets = self.offset;
  var index;
  var length;
  var subvalue;
  var now;
  var currentLine;
  var content;
  var queue;
  var subqueue;
  var character;
  var identifier;
  var add;
  var exit;

  if (!self.options.footnotes) {
    return;
  }

  index = 0;
  length = value.length;
  subvalue = '';
  now = eat.now();
  currentLine = now.line;

  while (index < length) {
    character = value.charAt(index);

    if (!whitespace(character)) {
      break;
    }

    subvalue += character;
    index++;
  }

  if (
    value.charAt(index) !== C_BRACKET_OPEN ||
    value.charAt(index + 1) !== C_CARET
  ) {
    return;
  }

  subvalue += C_BRACKET_OPEN + C_CARET;
  index = subvalue.length;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (character === C_BRACKET_CLOSE) {
      break;
    } else if (character === C_BACKSLASH) {
      queue += character;
      index++;
      character = value.charAt(index);
    }

    queue += character;
    index++;
  }

  if (
    !queue ||
    value.charAt(index) !== C_BRACKET_CLOSE ||
    value.charAt(index + 1) !== C_COLON
  ) {
    return;
  }

  if (silent) {
    return true;
  }

  identifier = normalize(queue);
  subvalue += queue + C_BRACKET_CLOSE + C_COLON;
  index = subvalue.length;

  while (index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    subvalue += character;
    index++;
  }

  now.column += subvalue.length;
  now.offset += subvalue.length;
  queue = '';
  content = '';
  subqueue = '';

  while (index < length) {
    character = value.charAt(index);

    if (character === C_NEWLINE) {
      subqueue = character;
      index++;

      while (index < length) {
        character = value.charAt(index);

        if (character !== C_NEWLINE) {
          break;
        }

        subqueue += character;
        index++;
      }

      queue += subqueue;
      subqueue = '';

      while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE) {
          break;
        }

        subqueue += character;
        index++;
      }

      if (subqueue.length === 0) {
        break;
      }

      queue += subqueue;
    }

    if (queue) {
      content += queue;
      queue = '';
    }

    content += character;
    index++;
  }

  subvalue += content;

  content = content.replace(EXPRESSION_INITIAL_TAB, function (line) {
    offsets[currentLine] = (offsets[currentLine] || 0) + line.length;
    currentLine++;

    return '';
  });

  add = eat(subvalue);

  exit = self.enterBlock();
  content = self.tokenizeBlock(content, now);
  exit();

  return add({
    type: 'footnoteDefinition',
    identifier: identifier,
    children: content
  });
}

},{"../util/normalize":85,"is-whitespace-character":28}],65:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:heading-atx
 * @fileoverview Tokenise an ATX-style heading.
 */

'use strict';

module.exports = atxHeading;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_HASH = '#';

var MAX_ATX_COUNT = 6;

/* Tokenise an ATX-style heading. */
function atxHeading(eat, value, silent) {
  var self = this;
  var settings = self.options;
  var length = value.length + 1;
  var index = -1;
  var now = eat.now();
  var subvalue = '';
  var content = '';
  var character;
  var queue;
  var depth;

  /* Eat initial spacing. */
  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      index--;
      break;
    }

    subvalue += character;
  }

  /* Eat hashes. */
  depth = 0;

  while (++index <= length) {
    character = value.charAt(index);

    if (character !== C_HASH) {
      index--;
      break;
    }

    subvalue += character;
    depth++;
  }

  if (depth > MAX_ATX_COUNT) {
    return;
  }

  if (
    !depth ||
    (!settings.pedantic && value.charAt(index + 1) === C_HASH)
  ) {
    return;
  }

  length = value.length + 1;

  /* Eat intermediate white-space. */
  queue = '';

  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE && character !== C_TAB) {
      index--;
      break;
    }

    queue += character;
  }

  /* Exit when not in pedantic mode without spacing. */
  if (
    !settings.pedantic &&
    queue.length === 0 &&
    character &&
    character !== C_NEWLINE
  ) {
    return;
  }

  if (silent) {
    return true;
  }

  /* Eat content. */
  subvalue += queue;
  queue = '';
  content = '';

  while (++index < length) {
    character = value.charAt(index);

    if (!character || character === C_NEWLINE) {
      break;
    }

    if (
      character !== C_SPACE &&
      character !== C_TAB &&
      character !== C_HASH
    ) {
      content += queue + character;
      queue = '';
      continue;
    }

    while (character === C_SPACE || character === C_TAB) {
      queue += character;
      character = value.charAt(++index);
    }

    while (character === C_HASH) {
      queue += character;
      character = value.charAt(++index);
    }

    while (character === C_SPACE || character === C_TAB) {
      queue += character;
      character = value.charAt(++index);
    }

    index--;
  }

  now.column += subvalue.length;
  now.offset += subvalue.length;
  subvalue += content + queue;

  return eat(subvalue)({
    type: 'heading',
    depth: depth,
    children: self.tokenizeInline(content, now)
  });
}

},{}],66:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:heading-setext
 * @fileoverview Tokenise an setext-style heading.
 */

'use strict';

module.exports = setextHeading;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_EQUALS = '=';
var C_DASH = '-';

var MAX_HEADING_INDENT = 3;

/* Map of characters which can be used to mark setext
 * headers, mapping to their corresponding depth. */
var SETEXT_MARKERS = {};

SETEXT_MARKERS[C_EQUALS] = 1;
SETEXT_MARKERS[C_DASH] = 2;

/* Tokenise an setext-style heading. */
function setextHeading(eat, value, silent) {
  var self = this;
  var now = eat.now();
  var length = value.length;
  var index = -1;
  var subvalue = '';
  var content;
  var queue;
  var character;
  var marker;
  var depth;

  /* Eat initial indentation. */
  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_SPACE || index >= MAX_HEADING_INDENT) {
      index--;
      break;
    }

    subvalue += character;
  }

  /* Eat content. */
  content = '';
  queue = '';

  while (++index < length) {
    character = value.charAt(index);

    if (character === C_NEWLINE) {
      index--;
      break;
    }

    if (character === C_SPACE || character === C_TAB) {
      queue += character;
    } else {
      content += queue + character;
      queue = '';
    }
  }

  now.column += subvalue.length;
  now.offset += subvalue.length;
  subvalue += content + queue;

  /* Ensure the content is followed by a newline and a
   * valid marker. */
  character = value.charAt(++index);
  marker = value.charAt(++index);

  if (character !== C_NEWLINE || !SETEXT_MARKERS[marker]) {
    return;
  }

  subvalue += character;

  /* Eat Setext-line. */
  queue = marker;
  depth = SETEXT_MARKERS[marker];

  while (++index < length) {
    character = value.charAt(index);

    if (character !== marker) {
      if (character !== C_NEWLINE) {
        return;
      }

      index--;
      break;
    }

    queue += character;
  }

  if (silent) {
    return true;
  }

  return eat(subvalue + queue)({
    type: 'heading',
    depth: depth,
    children: self.tokenizeInline(content, now)
  });
}

},{}],67:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:html-block
 * @fileoverview Tokenise block HTML.
 */

'use strict';

var openCloseTag = require('../util/html').openCloseTag;

module.exports = blockHTML;

var C_TAB = '\t';
var C_SPACE = ' ';
var C_NEWLINE = '\n';
var C_LT = '<';

/* Tokenise block HTML. */
function blockHTML(eat, value, silent) {
  var self = this;
  var blocks = self.options.blocks;
  var length = value.length;
  var index = 0;
  var next;
  var line;
  var offset;
  var character;
  var count;
  var sequence;
  var subvalue;

  var sequences = [
    [/^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true],
    [/^<!--/, /-->/, true],
    [/^<\?/, /\?>/, true],
    [/^<![A-Za-z]/, />/, true],
    [/^<!\[CDATA\[/, /\]\]>/, true],
    [new RegExp('^</?(' + blocks.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true],
    [new RegExp(openCloseTag.source + '\\s*$'), /^$/, false]
  ];

  /* Eat initial spacing. */
  while (index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    index++;
  }

  if (value.charAt(index) !== C_LT) {
    return;
  }

  next = value.indexOf(C_NEWLINE, index + 1);
  next = next === -1 ? length : next;
  line = value.slice(index, next);
  offset = -1;
  count = sequences.length;

  while (++offset < count) {
    if (sequences[offset][0].test(line)) {
      sequence = sequences[offset];
      break;
    }
  }

  if (!sequence) {
    return;
  }

  if (silent) {
    return sequence[2];
  }

  index = next;

  if (!sequence[1].test(line)) {
    while (index < length) {
      next = value.indexOf(C_NEWLINE, index + 1);
      next = next === -1 ? length : next;
      line = value.slice(index + 1, next);

      if (sequence[1].test(line)) {
        if (line) {
          index = next;
        }

        break;
      }

      index = next;
    }
  }

  subvalue = value.slice(0, index);

  return eat(subvalue)({type: 'html', value: subvalue});
}

},{"../util/html":83}],68:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:html-inline
 * @fileoverview Tokenise inline HTML.
 */

'use strict';

var alphabetical = require('is-alphabetical');
var locate = require('../locate/tag');
var tag = require('../util/html').tag;

module.exports = inlineHTML;
inlineHTML.locator = locate;

var EXPRESSION_HTML_LINK_OPEN = /^<a /i;
var EXPRESSION_HTML_LINK_CLOSE = /^<\/a>/i;

/* Tokenise inline HTML. */
function inlineHTML(eat, value, silent) {
  var self = this;
  var length = value.length;
  var character;
  var subvalue;

  if (value.charAt(0) !== '<' || length < 3) {
    return;
  }

  character = value.charAt(1);

  if (
    !alphabetical(character) &&
    character !== '?' &&
    character !== '!' &&
    character !== '/'
  ) {
    return;
  }

  subvalue = value.match(tag);

  if (!subvalue) {
    return;
  }

  /* istanbul ignore if - not used yet. */
  if (silent) {
    return true;
  }

  subvalue = subvalue[0];

  if (!self.inLink && EXPRESSION_HTML_LINK_OPEN.test(subvalue)) {
    self.inLink = true;
  } else if (self.inLink && EXPRESSION_HTML_LINK_CLOSE.test(subvalue)) {
    self.inLink = false;
  }

  return eat(subvalue)({type: 'html', value: subvalue});
}

},{"../locate/tag":49,"../util/html":83,"is-alphabetical":21}],69:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:link
 * @fileoverview Tokenise a link.
 */

'use strict';

var has = require('has');
var whitespace = require('is-whitespace-character');
var locate = require('../locate/link');

module.exports = link;
link.locator = locate;

var C_BACKSLASH = '\\';
var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';
var C_PAREN_OPEN = '(';
var C_PAREN_CLOSE = ')';
var C_LT = '<';
var C_GT = '>';
var C_TICK = '`';
var C_DOUBLE_QUOTE = '"';
var C_SINGLE_QUOTE = '\'';

/* Map of characters, which can be used to mark link
 * and image titles. */
var LINK_MARKERS = {};

LINK_MARKERS[C_DOUBLE_QUOTE] = C_DOUBLE_QUOTE;
LINK_MARKERS[C_SINGLE_QUOTE] = C_SINGLE_QUOTE;

/* Map of characters, which can be used to mark link
 * and image titles in commonmark-mode. */
var COMMONMARK_LINK_MARKERS = {};

COMMONMARK_LINK_MARKERS[C_DOUBLE_QUOTE] = C_DOUBLE_QUOTE;
COMMONMARK_LINK_MARKERS[C_SINGLE_QUOTE] = C_SINGLE_QUOTE;
COMMONMARK_LINK_MARKERS[C_PAREN_OPEN] = C_PAREN_CLOSE;

/* Tokenise a link. */
function link(eat, value, silent) {
  var self = this;
  var subvalue = '';
  var index = 0;
  var character = value.charAt(0);
  var commonmark = self.options.commonmark;
  var gfm = self.options.gfm;
  var closed;
  var count;
  var opening;
  var beforeURL;
  var beforeTitle;
  var subqueue;
  var hasMarker;
  var markers;
  var isImage;
  var content;
  var marker;
  var length;
  var title;
  var depth;
  var queue;
  var url;
  var now;
  var exit;
  var node;

  /* Detect whether this is an image. */
  if (character === '!') {
    isImage = true;
    subvalue = character;
    character = value.charAt(++index);
  }

  /* Eat the opening. */
  if (character !== C_BRACKET_OPEN) {
    return;
  }

  /* Exit when this is a link and we’re already inside
   * a link. */
  if (!isImage && self.inLink) {
    return;
  }

  subvalue += character;
  queue = '';
  index++;

  /* Eat the content. */
  length = value.length;
  now = eat.now();
  depth = 0;

  now.column += index;
  now.offset += index;

  while (index < length) {
    character = value.charAt(index);
    subqueue = character;

    if (character === C_TICK) {
      /* Inline-code in link content. */
      count = 1;

      while (value.charAt(index + 1) === C_TICK) {
        subqueue += character;
        index++;
        count++;
      }

      if (!opening) {
        opening = count;
      } else if (count >= opening) {
        opening = 0;
      }
    } else if (character === C_BACKSLASH) {
      /* Allow brackets to be escaped. */
      index++;
      subqueue += value.charAt(index);
    /* In GFM mode, brackets in code still count.
     * In all other modes, they don’t.  This empty
     * block prevents the next statements are
     * entered. */
    } else if ((!opening || gfm) && character === C_BRACKET_OPEN) {
      depth++;
    } else if ((!opening || gfm) && character === C_BRACKET_CLOSE) {
      if (depth) {
        depth--;
      } else {
        /* Allow white-space between content and
         * url in GFM mode. */
        if (gfm) {
          while (index < length) {
            character = value.charAt(index + 1);

            if (!whitespace(character)) {
              break;
            }

            subqueue += character;
            index++;
          }
        }

        if (value.charAt(index + 1) !== C_PAREN_OPEN) {
          return;
        }

        subqueue += C_PAREN_OPEN;
        closed = true;
        index++;

        break;
      }
    }

    queue += subqueue;
    subqueue = '';
    index++;
  }

  /* Eat the content closing. */
  if (!closed) {
    return;
  }

  content = queue;
  subvalue += queue + subqueue;
  index++;

  /* Eat white-space. */
  while (index < length) {
    character = value.charAt(index);

    if (!whitespace(character)) {
      break;
    }

    subvalue += character;
    index++;
  }

  /* Eat the URL. */
  character = value.charAt(index);
  markers = commonmark ? COMMONMARK_LINK_MARKERS : LINK_MARKERS;
  queue = '';
  beforeURL = subvalue;

  if (character === C_LT) {
    index++;
    beforeURL += C_LT;

    while (index < length) {
      character = value.charAt(index);

      if (character === C_GT) {
        break;
      }

      if (commonmark && character === '\n') {
        return;
      }

      queue += character;
      index++;
    }

    if (value.charAt(index) !== C_GT) {
      return;
    }

    subvalue += C_LT + queue + C_GT;
    url = queue;
    index++;
  } else {
    character = null;
    subqueue = '';

    while (index < length) {
      character = value.charAt(index);

      if (subqueue && has(markers, character)) {
        break;
      }

      if (whitespace(character)) {
        if (commonmark) {
          break;
        }

        subqueue += character;
      } else {
        if (character === C_PAREN_OPEN) {
          depth++;
        } else if (character === C_PAREN_CLOSE) {
          if (depth === 0) {
            break;
          }

          depth--;
        }

        queue += subqueue;
        subqueue = '';

        if (character === C_BACKSLASH) {
          queue += C_BACKSLASH;
          character = value.charAt(++index);
        }

        queue += character;
      }

      index++;
    }

    subvalue += queue;
    url = queue;
    index = subvalue.length;
  }

  /* Eat white-space. */
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (!whitespace(character)) {
      break;
    }

    queue += character;
    index++;
  }

  character = value.charAt(index);
  subvalue += queue;

  /* Eat the title. */
  if (queue && has(markers, character)) {
    index++;
    subvalue += character;
    queue = '';
    marker = markers[character];
    beforeTitle = subvalue;

    /* In commonmark-mode, things are pretty easy: the
     * marker cannot occur inside the title.
     *
     * Non-commonmark does, however, support nested
     * delimiters. */
    if (commonmark) {
      while (index < length) {
        character = value.charAt(index);

        if (character === marker) {
          break;
        }

        if (character === C_BACKSLASH) {
          queue += C_BACKSLASH;
          character = value.charAt(++index);
        }

        index++;
        queue += character;
      }

      character = value.charAt(index);

      if (character !== marker) {
        return;
      }

      title = queue;
      subvalue += queue + character;
      index++;

      while (index < length) {
        character = value.charAt(index);

        if (!whitespace(character)) {
          break;
        }

        subvalue += character;
        index++;
      }
    } else {
      subqueue = '';

      while (index < length) {
        character = value.charAt(index);

        if (character === marker) {
          if (hasMarker) {
            queue += marker + subqueue;
            subqueue = '';
          }

          hasMarker = true;
        } else if (!hasMarker) {
          queue += character;
        } else if (character === C_PAREN_CLOSE) {
          subvalue += queue + marker + subqueue;
          title = queue;
          break;
        } else if (whitespace(character)) {
          subqueue += character;
        } else {
          queue += marker + subqueue + character;
          subqueue = '';
          hasMarker = false;
        }

        index++;
      }
    }
  }

  if (value.charAt(index) !== C_PAREN_CLOSE) {
    return;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  subvalue += C_PAREN_CLOSE;

  url = self.decode.raw(self.unescape(url), eat(beforeURL).test().end);

  if (title) {
    beforeTitle = eat(beforeTitle).test().end;
    title = self.decode.raw(self.unescape(title), beforeTitle);
  }

  node = {
    type: isImage ? 'image' : 'link',
    title: title || null,
    url: url
  };

  if (isImage) {
    node.alt = self.decode.raw(self.unescape(content), now) || null;
  } else {
    exit = self.enterLink();
    node.children = self.tokenizeInline(content, now);
    exit();
  }

  return eat(subvalue)(node);
}

},{"../locate/link":47,"has":19,"is-whitespace-character":28}],70:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:list
 * @fileoverview Tokenise a list.
 */

'use strict';

/* eslint-disable max-params */

var trim = require('trim');
var repeat = require('repeat-string');
var decimal = require('is-decimal');
var getIndent = require('../util/get-indentation');
var removeIndent = require('../util/remove-indentation');
var interrupt = require('../util/interrupt');

module.exports = list;

var C_ASTERISK = '*';
var C_UNDERSCORE = '_';
var C_PLUS = '+';
var C_DASH = '-';
var C_DOT = '.';
var C_SPACE = ' ';
var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_PAREN_CLOSE = ')';
var C_X_LOWER = 'x';

var TAB_SIZE = 4;
var EXPRESSION_LOOSE_LIST_ITEM = /\n\n(?!\s*$)/;
var EXPRESSION_TASK_ITEM = /^\[([ \t]|x|X)][ \t]/;
var EXPRESSION_BULLET = /^([ \t]*)([*+-]|\d+[.)])( {1,4}(?! )| |\t|$|(?=\n))([^\n]*)/;
var EXPRESSION_PEDANTIC_BULLET = /^([ \t]*)([*+-]|\d+[.)])([ \t]+)/;
var EXPRESSION_INITIAL_INDENT = /^( {1,4}|\t)?/gm;

/* Map of characters which can be used to mark
 * list-items. */
var LIST_UNORDERED_MARKERS = {};

LIST_UNORDERED_MARKERS[C_ASTERISK] = true;
LIST_UNORDERED_MARKERS[C_PLUS] = true;
LIST_UNORDERED_MARKERS[C_DASH] = true;

/* Map of characters which can be used to mark
 * list-items after a digit. */
var LIST_ORDERED_MARKERS = {};

LIST_ORDERED_MARKERS[C_DOT] = true;

/* Map of characters which can be used to mark
 * list-items after a digit. */
var LIST_ORDERED_COMMONMARK_MARKERS = {};

LIST_ORDERED_COMMONMARK_MARKERS[C_DOT] = true;
LIST_ORDERED_COMMONMARK_MARKERS[C_PAREN_CLOSE] = true;

/* Tokenise a list. */
function list(eat, value, silent) {
  var self = this;
  var commonmark = self.options.commonmark;
  var pedantic = self.options.pedantic;
  var tokenizers = self.blockTokenizers;
  var interuptors = self.interruptList;
  var markers;
  var index = 0;
  var length = value.length;
  var start = null;
  var size = 0;
  var queue;
  var ordered;
  var character;
  var marker;
  var nextIndex;
  var startIndex;
  var prefixed;
  var currentMarker;
  var content;
  var line;
  var prevEmpty;
  var empty;
  var items;
  var allLines;
  var emptyLines;
  var item;
  var enterTop;
  var exitBlockquote;
  var isLoose;
  var node;
  var now;
  var end;
  var indented;

  while (index < length) {
    character = value.charAt(index);

    if (character === C_TAB) {
      size += TAB_SIZE - (size % TAB_SIZE);
    } else if (character === C_SPACE) {
      size++;
    } else {
      break;
    }

    index++;
  }

  if (size >= TAB_SIZE) {
    return;
  }

  character = value.charAt(index);

  markers = commonmark ?
    LIST_ORDERED_COMMONMARK_MARKERS :
    LIST_ORDERED_MARKERS;

  if (LIST_UNORDERED_MARKERS[character] === true) {
    marker = character;
    ordered = false;
  } else {
    ordered = true;
    queue = '';

    while (index < length) {
      character = value.charAt(index);

      if (!decimal(character)) {
        break;
      }

      queue += character;
      index++;
    }

    character = value.charAt(index);

    if (!queue || markers[character] !== true) {
      return;
    }

    start = parseInt(queue, 10);
    marker = character;
  }

  character = value.charAt(++index);

  if (character !== C_SPACE && character !== C_TAB) {
    return;
  }

  if (silent) {
    return true;
  }

  index = 0;
  items = [];
  allLines = [];
  emptyLines = [];

  while (index < length) {
    nextIndex = value.indexOf(C_NEWLINE, index);
    startIndex = index;
    prefixed = false;
    indented = false;

    if (nextIndex === -1) {
      nextIndex = length;
    }

    end = index + TAB_SIZE;
    size = 0;

    while (index < length) {
      character = value.charAt(index);

      if (character === C_TAB) {
        size += TAB_SIZE - (size % TAB_SIZE);
      } else if (character === C_SPACE) {
        size++;
      } else {
        break;
      }

      index++;
    }

    if (size >= TAB_SIZE) {
      indented = true;
    }

    if (item && size >= item.indent) {
      indented = true;
    }

    character = value.charAt(index);
    currentMarker = null;

    if (!indented) {
      if (LIST_UNORDERED_MARKERS[character] === true) {
        currentMarker = character;
        index++;
        size++;
      } else {
        queue = '';

        while (index < length) {
          character = value.charAt(index);

          if (!decimal(character)) {
            break;
          }

          queue += character;
          index++;
        }

        character = value.charAt(index);
        index++;

        if (queue && markers[character] === true) {
          currentMarker = character;
          size += queue.length + 1;
        }
      }

      if (currentMarker) {
        character = value.charAt(index);

        if (character === C_TAB) {
          size += TAB_SIZE - (size % TAB_SIZE);
          index++;
        } else if (character === C_SPACE) {
          end = index + TAB_SIZE;

          while (index < end) {
            if (value.charAt(index) !== C_SPACE) {
              break;
            }

            index++;
            size++;
          }

          if (index === end && value.charAt(index) === C_SPACE) {
            index -= TAB_SIZE - 1;
            size -= TAB_SIZE - 1;
          }
        } else if (character !== C_NEWLINE && character !== '') {
          currentMarker = null;
        }
      }
    }

    if (currentMarker) {
      if (!pedantic && marker !== currentMarker) {
        break;
      }

      prefixed = true;
    } else {
      if (!commonmark && !indented && value.charAt(startIndex) === C_SPACE) {
        indented = true;
      } else if (commonmark && item) {
        indented = size >= item.indent || size > TAB_SIZE;
      }

      prefixed = false;
      index = startIndex;
    }

    line = value.slice(startIndex, nextIndex);
    content = startIndex === index ? line : value.slice(index, nextIndex);

    if (
      currentMarker === C_ASTERISK ||
      currentMarker === C_UNDERSCORE ||
      currentMarker === C_DASH
    ) {
      if (tokenizers.thematicBreak.call(self, eat, line, true)) {
        break;
      }
    }

    prevEmpty = empty;
    empty = !trim(content).length;

    if (indented && item) {
      item.value = item.value.concat(emptyLines, line);
      allLines = allLines.concat(emptyLines, line);
      emptyLines = [];
    } else if (prefixed) {
      if (emptyLines.length !== 0) {
        item.value.push('');
        item.trail = emptyLines.concat();
      }

      item = {
        value: [line],
        indent: size,
        trail: []
      };

      items.push(item);
      allLines = allLines.concat(emptyLines, line);
      emptyLines = [];
    } else if (empty) {
      if (prevEmpty) {
        break;
      }

      emptyLines.push(line);
    } else {
      if (prevEmpty) {
        break;
      }

      if (interrupt(interuptors, tokenizers, self, [eat, line, true])) {
        break;
      }

      item.value = item.value.concat(emptyLines, line);
      allLines = allLines.concat(emptyLines, line);
      emptyLines = [];
    }

    index = nextIndex + 1;
  }

  node = eat(allLines.join(C_NEWLINE)).reset({
    type: 'list',
    ordered: ordered,
    start: start,
    loose: null,
    children: []
  });

  enterTop = self.enterList();
  exitBlockquote = self.enterBlock();
  isLoose = false;
  index = -1;
  length = items.length;

  while (++index < length) {
    item = items[index].value.join(C_NEWLINE);
    now = eat.now();

    item = eat(item)(listItem(self, item, now), node);

    if (item.loose) {
      isLoose = true;
    }

    item = items[index].trail.join(C_NEWLINE);

    if (index !== length - 1) {
      item += C_NEWLINE;
    }

    eat(item);
  }

  enterTop();
  exitBlockquote();

  node.loose = isLoose;

  return node;
}

/**
 * Create a list-item node.
 *
 * @example
 *   listItem('- _foo_', now());
 *
 * @param {Object} ctx - Parser.
 * @param {Object} value - List-item.
 * @param {Object} position - List-item location.
 * @return {Object} - `listItem` node.
 */
function listItem(ctx, value, position) {
  var offsets = ctx.offset;
  var fn = ctx.options.pedantic ? pedanticListItem : normalListItem;
  var checked = null;
  var task;
  var indent;

  value = fn.apply(null, arguments);

  if (ctx.options.gfm) {
    task = value.match(EXPRESSION_TASK_ITEM);

    if (task) {
      indent = task[0].length;
      checked = task[1].toLowerCase() === C_X_LOWER;
      offsets[position.line] += indent;
      value = value.slice(indent);
    }
  }

  return {
    type: 'listItem',
    loose: EXPRESSION_LOOSE_LIST_ITEM.test(value) ||
      value.charAt(value.length - 1) === C_NEWLINE,
    checked: checked,
    children: ctx.tokenizeBlock(value, position)
  };
}

/* Create a list-item using overly simple mechanics. */
function pedanticListItem(ctx, value, position) {
  var offsets = ctx.offset;
  var line = position.line;

  /* Remove the list-item’s bullet. */
  value = value.replace(EXPRESSION_PEDANTIC_BULLET, replacer);

  /* The initial line was also matched by the below, so
   * we reset the `line`. */
  line = position.line;

  return value.replace(EXPRESSION_INITIAL_INDENT, replacer);

  /* A simple replacer which removed all matches,
   * and adds their length to `offset`. */
  function replacer($0) {
    offsets[line] = (offsets[line] || 0) + $0.length;
    line++;

    return '';
  }
}

/* Create a list-item using sane mechanics. */
function normalListItem(ctx, value, position) {
  var offsets = ctx.offset;
  var line = position.line;
  var max;
  var bullet;
  var rest;
  var lines;
  var trimmedLines;
  var index;
  var length;

  /* Remove the list-item’s bullet. */
  value = value.replace(EXPRESSION_BULLET, replacer);

  lines = value.split(C_NEWLINE);

  trimmedLines = removeIndent(value, getIndent(max).indent).split(C_NEWLINE);

  /* We replaced the initial bullet with something
   * else above, which was used to trick
   * `removeIndentation` into removing some more
   * characters when possible.  However, that could
   * result in the initial line to be stripped more
   * than it should be. */
  trimmedLines[0] = rest;

  offsets[line] = (offsets[line] || 0) + bullet.length;
  line++;

  index = 0;
  length = lines.length;

  while (++index < length) {
    offsets[line] = (offsets[line] || 0) +
      lines[index].length - trimmedLines[index].length;
    line++;
  }

  return trimmedLines.join(C_NEWLINE);

  function replacer($0, $1, $2, $3, $4) {
    bullet = $1 + $2 + $3;
    rest = $4;

    /* Make sure that the first nine numbered list items
     * can indent with an extra space.  That is, when
     * the bullet did not receive an extra final space. */
    if (Number($2) < 10 && bullet.length % 2 === 1) {
      $2 = C_SPACE + $2;
    }

    max = $1 + repeat(C_SPACE, $2.length) + $3;

    return max + rest;
  }
}

},{"../util/get-indentation":82,"../util/interrupt":84,"../util/remove-indentation":86,"is-decimal":25,"repeat-string":133,"trim":142}],71:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:newline
 * @fileoverview Tokenise a newline.
 */

'use strict';

var whitespace = require('is-whitespace-character');

module.exports = newline;

/* Tokenise newline. */
function newline(eat, value, silent) {
  var character = value.charAt(0);
  var length;
  var subvalue;
  var queue;
  var index;

  if (character !== '\n') {
    return;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  index = 1;
  length = value.length;
  subvalue = character;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (!whitespace(character)) {
      break;
    }

    queue += character;

    if (character === '\n') {
      subvalue += queue;
      queue = '';
    }

    index++;
  }

  eat(subvalue);
}

},{"is-whitespace-character":28}],72:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:paragraph
 * @fileoverview Tokenise a paragraph.
 */

'use strict';

var trim = require('trim');
var decimal = require('is-decimal');
var trimTrailingLines = require('trim-trailing-lines');
var interrupt = require('../util/interrupt');

module.exports = paragraph;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';

var TAB_SIZE = 4;

/* Tokenise paragraph. */
function paragraph(eat, value, silent) {
  var self = this;
  var settings = self.options;
  var commonmark = settings.commonmark;
  var gfm = settings.gfm;
  var tokenizers = self.blockTokenizers;
  var interruptors = self.interruptParagraph;
  var index = value.indexOf(C_NEWLINE);
  var length = value.length;
  var position;
  var subvalue;
  var character;
  var size;
  var now;

  while (index < length) {
    /* Eat everything if there’s no following newline. */
    if (index === -1) {
      index = length;
      break;
    }

    /* Stop if the next character is NEWLINE. */
    if (value.charAt(index + 1) === C_NEWLINE) {
      break;
    }

    /* In commonmark-mode, following indented lines
     * are part of the paragraph. */
    if (commonmark) {
      size = 0;
      position = index + 1;

      while (position < length) {
        character = value.charAt(position);

        if (character === C_TAB) {
          size = TAB_SIZE;
          break;
        } else if (character === C_SPACE) {
          size++;
        } else {
          break;
        }

        position++;
      }

      if (size >= TAB_SIZE) {
        index = value.indexOf(C_NEWLINE, index + 1);
        continue;
      }
    }

    subvalue = value.slice(index + 1);

    /* Check if the following code contains a possible
     * block. */
    if (interrupt(interruptors, tokenizers, self, [eat, subvalue, true])) {
      break;
    }

    /* Break if the following line starts a list, when
     * already in a list, or when in commonmark, or when
     * in gfm mode and the bullet is *not* numeric. */
    if (
      tokenizers.list.call(self, eat, subvalue, true) &&
      (
        self.inList ||
        commonmark ||
        (gfm && !decimal(trim.left(subvalue).charAt(0)))
      )
    ) {
      break;
    }

    position = index;
    index = value.indexOf(C_NEWLINE, index + 1);

    if (index !== -1 && trim(value.slice(position, index)) === '') {
      index = position;
      break;
    }
  }

  subvalue = value.slice(0, index);

  if (trim(subvalue) === '') {
    eat(subvalue);

    return null;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  now = eat.now();
  subvalue = trimTrailingLines(subvalue);

  return eat(subvalue)({
    type: 'paragraph',
    children: self.tokenizeInline(subvalue, now)
  });
}

},{"../util/interrupt":84,"is-decimal":25,"trim":142,"trim-trailing-lines":141}],73:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:reference
 * @fileoverview Tokenise a reference.
 */

'use strict';

var whitespace = require('is-whitespace-character');
var locate = require('../locate/link');
var normalize = require('../util/normalize');

module.exports = reference;
reference.locator = locate;

var T_LINK = 'link';
var T_IMAGE = 'image';
var T_FOOTNOTE = 'footnote';
var REFERENCE_TYPE_SHORTCUT = 'shortcut';
var REFERENCE_TYPE_COLLAPSED = 'collapsed';
var REFERENCE_TYPE_FULL = 'full';
var C_CARET = '^';
var C_BACKSLASH = '\\';
var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';

/* Tokenise a reference. */
function reference(eat, value, silent) {
  var self = this;
  var character = value.charAt(0);
  var index = 0;
  var length = value.length;
  var subvalue = '';
  var intro = '';
  var type = T_LINK;
  var referenceType = REFERENCE_TYPE_SHORTCUT;
  var content;
  var identifier;
  var now;
  var node;
  var exit;
  var queue;
  var bracketed;
  var depth;

  /* Check whether we’re eating an image. */
  if (character === '!') {
    type = T_IMAGE;
    intro = character;
    character = value.charAt(++index);
  }

  if (character !== C_BRACKET_OPEN) {
    return;
  }

  index++;
  intro += character;
  queue = '';

  /* Check whether we’re eating a footnote. */
  if (
    self.options.footnotes &&
    type === T_LINK &&
    value.charAt(index) === C_CARET
  ) {
    intro += C_CARET;
    index++;
    type = T_FOOTNOTE;
  }

  /* Eat the text. */
  depth = 0;

  while (index < length) {
    character = value.charAt(index);

    if (character === C_BRACKET_OPEN) {
      bracketed = true;
      depth++;
    } else if (character === C_BRACKET_CLOSE) {
      if (!depth) {
        break;
      }

      depth--;
    }

    if (character === C_BACKSLASH) {
      queue += C_BACKSLASH;
      character = value.charAt(++index);
    }

    queue += character;
    index++;
  }

  subvalue = queue;
  content = queue;
  character = value.charAt(index);

  if (character !== C_BRACKET_CLOSE) {
    return;
  }

  index++;
  subvalue += character;
  queue = '';

  while (index < length) {
    character = value.charAt(index);

    if (!whitespace(character)) {
      break;
    }

    queue += character;
    index++;
  }

  character = value.charAt(index);

  if (character === C_BRACKET_OPEN) {
    identifier = '';
    queue += character;
    index++;

    while (index < length) {
      character = value.charAt(index);

      if (character === C_BRACKET_OPEN || character === C_BRACKET_CLOSE) {
        break;
      }

      if (character === C_BACKSLASH) {
        identifier += C_BACKSLASH;
        character = value.charAt(++index);
      }

      identifier += character;
      index++;
    }

    character = value.charAt(index);

    if (character === C_BRACKET_CLOSE) {
      referenceType = identifier ? REFERENCE_TYPE_FULL : REFERENCE_TYPE_COLLAPSED;
      queue += identifier + character;
      index++;
    } else {
      identifier = '';
    }

    subvalue += queue;
    queue = '';
  } else {
    if (!content) {
      return;
    }

    identifier = content;
  }

  /* Brackets cannot be inside the identifier. */
  if (referenceType !== REFERENCE_TYPE_FULL && bracketed) {
    return;
  }

  /* Inline footnotes cannot have an identifier. */
  if (type === T_FOOTNOTE && referenceType !== REFERENCE_TYPE_SHORTCUT) {
    type = T_LINK;
    intro = C_BRACKET_OPEN + C_CARET;
    content = C_CARET + content;
  }

  subvalue = intro + subvalue;

  if (type === T_LINK && self.inLink) {
    return null;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  if (type === T_FOOTNOTE && content.indexOf(' ') !== -1) {
    return eat(subvalue)({
      type: 'footnote',
      children: this.tokenizeInline(content, eat.now())
    });
  }

  now = eat.now();
  now.column += intro.length;
  now.offset += intro.length;
  identifier = referenceType === REFERENCE_TYPE_FULL ? identifier : content;

  node = {
    type: type + 'Reference',
    identifier: normalize(identifier)
  };

  if (type === T_LINK || type === T_IMAGE) {
    node.referenceType = referenceType;
  }

  if (type === T_LINK) {
    exit = self.enterLink();
    node.children = self.tokenizeInline(content, now);
    exit();
  } else if (type === T_IMAGE) {
    node.alt = self.decode.raw(self.unescape(content), now) || null;
  }

  return eat(subvalue)(node);
}

},{"../locate/link":47,"../util/normalize":85,"is-whitespace-character":28}],74:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:strong
 * @fileoverview Tokenise strong.
 */

'use strict';

var trim = require('trim');
var whitespace = require('is-whitespace-character');
var locate = require('../locate/strong');

module.exports = strong;
strong.locator = locate;

var C_ASTERISK = '*';
var C_UNDERSCORE = '_';

/* Tokenise strong. */
function strong(eat, value, silent) {
  var self = this;
  var index = 0;
  var character = value.charAt(index);
  var now;
  var pedantic;
  var marker;
  var queue;
  var subvalue;
  var length;
  var prev;

  if (
    (character !== C_ASTERISK && character !== C_UNDERSCORE) ||
    value.charAt(++index) !== character
  ) {
    return;
  }

  pedantic = self.options.pedantic;
  marker = character;
  subvalue = marker + marker;
  length = value.length;
  index++;
  queue = '';
  character = '';

  if (pedantic && whitespace(value.charAt(index))) {
    return;
  }

  while (index < length) {
    prev = character;
    character = value.charAt(index);

    if (
      character === marker &&
      value.charAt(index + 1) === marker &&
      (!pedantic || !whitespace(prev))
    ) {
      character = value.charAt(index + 2);

      if (character !== marker) {
        if (!trim(queue)) {
          return;
        }

        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true;
        }

        now = eat.now();
        now.column += 2;
        now.offset += 2;

        return eat(subvalue + queue + subvalue)({
          type: 'strong',
          children: self.tokenizeInline(queue, now)
        });
      }
    }

    if (!pedantic && character === '\\') {
      queue += character;
      character = value.charAt(++index);
    }

    queue += character;
    index++;
  }
}

},{"../locate/strong":48,"is-whitespace-character":28,"trim":142}],75:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:table
 * @fileoverview Tokenise a table.
 */

'use strict';

var whitespace = require('is-whitespace-character');

module.exports = table;
table.notInList = true;

var C_BACKSLASH = '\\';
var C_TICK = '`';
var C_DASH = '-';
var C_PIPE = '|';
var C_COLON = ':';
var C_SPACE = ' ';
var C_NEWLINE = '\n';
var C_TAB = '\t';

var MIN_TABLE_COLUMNS = 1;
var MIN_TABLE_ROWS = 2;

var TABLE_ALIGN_LEFT = 'left';
var TABLE_ALIGN_CENTER = 'center';
var TABLE_ALIGN_RIGHT = 'right';
var TABLE_ALIGN_NONE = null;

/* Tokenise a table. */
function table(eat, value, silent) {
  var self = this;
  var index;
  var alignments;
  var alignment;
  var subvalue;
  var row;
  var length;
  var lines;
  var queue;
  var character;
  var hasDash;
  var align;
  var cell;
  var preamble;
  var count;
  var opening;
  var now;
  var position;
  var lineCount;
  var line;
  var rows;
  var table;
  var lineIndex;
  var pipeIndex;
  var first;

  /* Exit when not in gfm-mode. */
  if (!self.options.gfm) {
    return;
  }

  /* Get the rows.
   * Detecting tables soon is hard, so there are some
   * checks for performance here, such as the minimum
   * number of rows, and allowed characters in the
   * alignment row. */
  index = 0;
  lineCount = 0;
  length = value.length + 1;
  lines = [];

  while (index < length) {
    lineIndex = value.indexOf(C_NEWLINE, index);
    pipeIndex = value.indexOf(C_PIPE, index + 1);

    if (lineIndex === -1) {
      lineIndex = value.length;
    }

    if (pipeIndex === -1 || pipeIndex > lineIndex) {
      if (lineCount < MIN_TABLE_ROWS) {
        return;
      }

      break;
    }

    lines.push(value.slice(index, lineIndex));
    lineCount++;
    index = lineIndex + 1;
  }

  /* Parse the alignment row. */
  subvalue = lines.join(C_NEWLINE);
  alignments = lines.splice(1, 1)[0] || [];
  index = 0;
  length = alignments.length;
  lineCount--;
  alignment = false;
  align = [];

  while (index < length) {
    character = alignments.charAt(index);

    if (character === C_PIPE) {
      hasDash = null;

      if (alignment === false) {
        if (first === false) {
          return;
        }
      } else {
        align.push(alignment);
        alignment = false;
      }

      first = false;
    } else if (character === C_DASH) {
      hasDash = true;
      alignment = alignment || TABLE_ALIGN_NONE;
    } else if (character === C_COLON) {
      if (alignment === TABLE_ALIGN_LEFT) {
        alignment = TABLE_ALIGN_CENTER;
      } else if (hasDash && alignment === TABLE_ALIGN_NONE) {
        alignment = TABLE_ALIGN_RIGHT;
      } else {
        alignment = TABLE_ALIGN_LEFT;
      }
    } else if (!whitespace(character)) {
      return;
    }

    index++;
  }

  if (alignment !== false) {
    align.push(alignment);
  }

  /* Exit when without enough columns. */
  if (align.length < MIN_TABLE_COLUMNS) {
    return;
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  /* Parse the rows. */
  position = -1;
  rows = [];

  table = eat(subvalue).reset({
    type: 'table',
    align: align,
    children: rows
  });

  while (++position < lineCount) {
    line = lines[position];
    row = {type: 'tableRow', children: []};

    /* Eat a newline character when this is not the
     * first row. */
    if (position) {
      eat(C_NEWLINE);
    }

    /* Eat the row. */
    eat(line).reset(row, table);

    length = line.length + 1;
    index = 0;
    queue = '';
    cell = '';
    preamble = true;
    count = null;
    opening = null;

    while (index < length) {
      character = line.charAt(index);

      if (character === C_TAB || character === C_SPACE) {
        if (cell) {
          queue += character;
        } else {
          eat(character);
        }

        index++;
        continue;
      }

      if (character === '' || character === C_PIPE) {
        if (preamble) {
          eat(character);
        } else {
          if (character && opening) {
            queue += character;
            index++;
            continue;
          }

          if ((cell || character) && !preamble) {
            subvalue = cell;

            if (queue.length > 1) {
              if (character) {
                subvalue += queue.slice(0, queue.length - 1);
                queue = queue.charAt(queue.length - 1);
              } else {
                subvalue += queue;
                queue = '';
              }
            }

            now = eat.now();

            eat(subvalue)({
              type: 'tableCell',
              children: self.tokenizeInline(cell, now)
            }, row);
          }

          eat(queue + character);

          queue = '';
          cell = '';
        }
      } else {
        if (queue) {
          cell += queue;
          queue = '';
        }

        cell += character;

        if (character === C_BACKSLASH && index !== length - 2) {
          cell += line.charAt(index + 1);
          index++;
        }

        if (character === C_TICK) {
          count = 1;

          while (line.charAt(index + 1) === character) {
            cell += character;
            index++;
            count++;
          }

          if (!opening) {
            opening = count;
          } else if (count >= opening) {
            opening = 0;
          }
        }
      }

      preamble = false;
      index++;
    }

    /* Eat the alignment row. */
    if (!position) {
      eat(C_NEWLINE + alignments);
    }
  }

  return table;
}

},{"is-whitespace-character":28}],76:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:text
 * @fileoverview Tokenise text.
 */

'use strict';

module.exports = text;

/* Tokenise text. */
function text(eat, value, silent) {
  var self = this;
  var methods;
  var tokenizers;
  var index;
  var length;
  var subvalue;
  var position;
  var tokenizer;
  var name;
  var min;
  var now;

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  methods = self.inlineMethods;
  length = methods.length;
  tokenizers = self.inlineTokenizers;
  index = -1;
  min = value.length;

  while (++index < length) {
    name = methods[index];

    if (name === 'text' || !tokenizers[name]) {
      continue;
    }

    tokenizer = tokenizers[name].locator;

    if (!tokenizer) {
      eat.file.fail('Missing locator: `' + name + '`');
    }

    position = tokenizer.call(self, value, 1);

    if (position !== -1 && position < min) {
      min = position;
    }
  }

  subvalue = value.slice(0, min);
  now = eat.now();

  self.decode(subvalue, now, function (content, position, source) {
    eat(source || content)({
      type: 'text',
      value: content
    });
  });
}

},{}],77:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:thematic-break
 * @fileoverview Tokenise a thematic break.
 */

'use strict';

module.exports = thematicBreak;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_ASTERISK = '*';
var C_UNDERSCORE = '_';
var C_DASH = '-';

var THEMATIC_BREAK_MARKER_COUNT = 3;

/* Tokenise a thematic break. */
function thematicBreak(eat, value, silent) {
  var index = -1;
  var length = value.length + 1;
  var subvalue = '';
  var character;
  var marker;
  var markerCount;
  var queue;

  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    subvalue += character;
  }

  if (
    character !== C_ASTERISK &&
    character !== C_DASH &&
    character !== C_UNDERSCORE
  ) {
    return;
  }

  marker = character;
  subvalue += character;
  markerCount = 1;
  queue = '';

  while (++index < length) {
    character = value.charAt(index);

    if (character === marker) {
      markerCount++;
      subvalue += queue + marker;
      queue = '';
    } else if (character === C_SPACE) {
      queue += character;
    } else if (
      markerCount >= THEMATIC_BREAK_MARKER_COUNT &&
      (!character || character === C_NEWLINE)
    ) {
      subvalue += queue;

      if (silent) {
        return true;
      }

      return eat(subvalue)({type: 'thematicBreak'});
    } else {
      return;
    }
  }
}

},{}],78:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:url
 * @fileoverview Tokenise a URL.
 */

'use strict';

var decode = require('parse-entities');
var whitespace = require('is-whitespace-character');
var locate = require('../locate/url');

module.exports = url;
url.locator = locate;
url.notInLink = true;

var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';
var C_PAREN_OPEN = '(';
var C_PAREN_CLOSE = ')';
var C_LT = '<';
var C_AT_SIGN = '@';

var HTTP_PROTOCOL = 'http://';
var HTTPS_PROTOCOL = 'https://';
var MAILTO_PROTOCOL = 'mailto:';

var PROTOCOLS = [
  HTTP_PROTOCOL,
  HTTPS_PROTOCOL,
  MAILTO_PROTOCOL
];

var PROTOCOLS_LENGTH = PROTOCOLS.length;

/* Tokenise a URL. */
function url(eat, value, silent) {
  var self = this;
  var subvalue;
  var content;
  var character;
  var index;
  var position;
  var protocol;
  var match;
  var length;
  var queue;
  var parenCount;
  var nextCharacter;
  var exit;

  if (!self.options.gfm) {
    return;
  }

  subvalue = '';
  index = -1;
  length = PROTOCOLS_LENGTH;

  while (++index < length) {
    protocol = PROTOCOLS[index];
    match = value.slice(0, protocol.length);

    if (match.toLowerCase() === protocol) {
      subvalue = match;
      break;
    }
  }

  if (!subvalue) {
    return;
  }

  index = subvalue.length;
  length = value.length;
  queue = '';
  parenCount = 0;

  while (index < length) {
    character = value.charAt(index);

    if (whitespace(character) || character === C_LT) {
      break;
    }

    if (
      character === '.' ||
      character === ',' ||
      character === ':' ||
      character === ';' ||
      character === '"' ||
      character === '\'' ||
      character === ')' ||
      character === ']'
    ) {
      nextCharacter = value.charAt(index + 1);

      if (!nextCharacter || whitespace(nextCharacter)) {
        break;
      }
    }

    if (character === C_PAREN_OPEN || character === C_BRACKET_OPEN) {
      parenCount++;
    }

    if (character === C_PAREN_CLOSE || character === C_BRACKET_CLOSE) {
      parenCount--;

      if (parenCount < 0) {
        break;
      }
    }

    queue += character;
    index++;
  }

  if (!queue) {
    return;
  }

  subvalue += queue;
  content = subvalue;

  if (protocol === MAILTO_PROTOCOL) {
    position = queue.indexOf(C_AT_SIGN);

    if (position === -1 || position === length - 1) {
      return;
    }

    content = content.substr(MAILTO_PROTOCOL.length);
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true;
  }

  exit = self.enterLink();
  content = self.tokenizeInline(content, eat.now());
  exit();

  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(subvalue),
    children: content
  });
}

},{"../locate/url":50,"is-whitespace-character":28,"parse-entities":35}],79:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenize:yaml
 * @fileoverview Tokenise YAML.
 */

'use strict';

module.exports = yaml;
yaml.onlyAtStart = true;

var FENCE = '---';
var C_DASH = '-';
var C_NEWLINE = '\n';

/* Tokenise YAML. */
function yaml(eat, value, silent) {
  var self = this;
  var subvalue;
  var content;
  var index;
  var length;
  var character;
  var queue;

  if (
    !self.options.yaml ||
    value.charAt(0) !== C_DASH ||
    value.charAt(1) !== C_DASH ||
    value.charAt(2) !== C_DASH ||
    value.charAt(3) !== C_NEWLINE
  ) {
    return;
  }

  subvalue = FENCE + C_NEWLINE;
  content = '';
  queue = '';
  index = 3;
  length = value.length;

  while (++index < length) {
    character = value.charAt(index);

    if (
      character === C_DASH &&
      (queue || !content) &&
      value.charAt(index + 1) === C_DASH &&
      value.charAt(index + 2) === C_DASH
    ) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true;
      }

      subvalue += queue + FENCE;

      return eat(subvalue)({
        type: 'yaml',
        value: content
      });
    }

    if (character === C_NEWLINE) {
      queue += character;
    } else {
      subvalue += queue + character;
      content += queue + character;
      queue = '';
    }
  }
}

},{}],80:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:tokenizer
 * @fileoverview Markdown tokenizer.
 */

'use strict';

module.exports = factory;

var MERGEABLE_NODES = {
  text: mergeText,
  blockquote: mergeBlockquote
};

/* Check whether a node is mergeable with adjacent nodes. */
function mergeable(node) {
  var start;
  var end;

  if (node.type !== 'text' || !node.position) {
    return true;
  }

  start = node.position.start;
  end = node.position.end;

  /* Only merge nodes which occupy the same size as their
   * `value`. */
  return start.line !== end.line ||
      end.column - start.column === node.value.length;
}

/* Merge two text nodes: `node` into `prev`. */
function mergeText(prev, node) {
  prev.value += node.value;

  return prev;
}

/* Merge two blockquotes: `node` into `prev`, unless in
 * CommonMark mode. */
function mergeBlockquote(prev, node) {
  if (this.options.commonmark) {
    return node;
  }

  prev.children = prev.children.concat(node.children);

  return prev;
}

/* Construct a tokenizer.  This creates both
 * `tokenizeInline` and `tokenizeBlock`. */
function factory(type) {
  return tokenize;

  /* Tokenizer for a bound `type`. */
  function tokenize(value, location) {
    var self = this;
    var offset = self.offset;
    var tokens = [];
    var methods = self[type + 'Methods'];
    var tokenizers = self[type + 'Tokenizers'];
    var line = location.line;
    var column = location.column;
    var index;
    var length;
    var method;
    var name;
    var matched;
    var valueLength;

    /* Trim white space only lines. */
    if (!value) {
      return tokens;
    }

    /* Expose on `eat`. */
    eat.now = now;
    eat.file = self.file;

    /* Sync initial offset. */
    updatePosition('');

    /* Iterate over `value`, and iterate over all
     * tokenizers.  When one eats something, re-iterate
     * with the remaining value.  If no tokenizer eats,
     * something failed (should not happen) and an
     * exception is thrown. */
    while (value) {
      index = -1;
      length = methods.length;
      matched = false;

      while (++index < length) {
        name = methods[index];
        method = tokenizers[name];

        if (
          method &&
          (!method.onlyAtStart || self.atStart) &&
          (!method.notInList || !self.inList) &&
          (!method.notInBlock || !self.inBlock) &&
          (!method.notInLink || !self.inLink)
        ) {
          valueLength = value.length;

          method.apply(self, [eat, value]);

          matched = valueLength !== value.length;

          if (matched) {
            break;
          }
        }
      }

      /* istanbul ignore if */
      if (!matched) {
        self.file.fail(new Error('Infinite loop'), eat.now());
      }
    }

    self.eof = now();

    return tokens;

    /**
     * Update line, column, and offset based on
     * `value`.
     *
     * @example
     *   updatePosition('foo');
     *
     * @param {string} subvalue - Subvalue to eat.
     */
    function updatePosition(subvalue) {
      var lastIndex = -1;
      var index = subvalue.indexOf('\n');

      while (index !== -1) {
        line++;
        lastIndex = index;
        index = subvalue.indexOf('\n', index + 1);
      }

      if (lastIndex === -1) {
        column += subvalue.length;
      } else {
        column = subvalue.length - lastIndex;
      }

      if (line in offset) {
        if (lastIndex !== -1) {
          column += offset[line];
        } else if (column <= offset[line]) {
          column = offset[line] + 1;
        }
      }
    }

    /**
     * Get offset.  Called before the first character is
     * eaten to retrieve the range's offsets.
     *
     * @return {Function} - `done`, to be called when
     *   the last character is eaten.
     */
    function getOffset() {
      var indentation = [];
      var pos = line + 1;

      /**
       * Done.  Called when the last character is
       * eaten to retrieve the range’s offsets.
       *
       * @return {Array.<number>} - Offset.
       */
      return function () {
        var last = line + 1;

        while (pos < last) {
          indentation.push((offset[pos] || 0) + 1);

          pos++;
        }

        return indentation;
      };
    }

    /**
     * Get the current position.
     *
     * @example
     *   position = now(); // {line: 1, column: 1, offset: 0}
     *
     * @return {Object} - Current Position.
     */
    function now() {
      var pos = {line: line, column: column};

      pos.offset = self.toOffset(pos);

      return pos;
    }

    /**
     * Store position information for a node.
     *
     * @example
     *   start = now();
     *   updatePosition('foo');
     *   location = new Position(start);
     *   // {
     *   //   start: {line: 1, column: 1, offset: 0},
     *   //   end: {line: 1, column: 3, offset: 2}
     *   // }
     *
     * @param {Object} start - Starting position.
     */
    function Position(start) {
      this.start = start;
      this.end = now();
    }

    /**
     * Throw when a value is incorrectly eaten.
     * This shouldn’t happen but will throw on new,
     * incorrect rules.
     *
     * @example
     *   // When the current value is set to `foo bar`.
     *   validateEat('foo');
     *   eat('foo');
     *
     *   validateEat('bar');
     *   // throws, because the space is not eaten.
     *
     * @param {string} subvalue - Value to be eaten.
     * @throws {Error} - When `subvalue` cannot be eaten.
     */
    function validateEat(subvalue) {
      /* istanbul ignore if */
      if (value.substring(0, subvalue.length) !== subvalue) {
        /* Capture stack-trace. */
        self.file.fail(
          new Error(
            'Incorrectly eaten value: please report this ' +
            'warning on http://git.io/vg5Ft'
          ),
          now()
        );
      }
    }

    /**
     * Mark position and patch `node.position`.
     *
     * @example
     *   var update = position();
     *   updatePosition('foo');
     *   update({});
     *   // {
     *   //   position: {
     *   //     start: {line: 1, column: 1, offset: 0},
     *   //     end: {line: 1, column: 3, offset: 2}
     *   //   }
     *   // }
     *
     * @returns {Function} - Updater.
     */
    function position() {
      var before = now();

      return update;

      /**
       * Add the position to a node.
       *
       * @example
       *   update({type: 'text', value: 'foo'});
       *
       * @param {Node} node - Node to attach position
       *   on.
       * @param {Array} [indent] - Indentation for
       *   `node`.
       * @return {Node} - `node`.
       */
      function update(node, indent) {
        var prev = node.position;
        var start = prev ? prev.start : before;
        var combined = [];
        var n = prev && prev.end.line;
        var l = before.line;

        node.position = new Position(start);

        /* If there was already a `position`, this
         * node was merged.  Fixing `start` wasn’t
         * hard, but the indent is different.
         * Especially because some information, the
         * indent between `n` and `l` wasn’t
         * tracked.  Luckily, that space is
         * (should be?) empty, so we can safely
         * check for it now. */
        if (prev && indent && prev.indent) {
          combined = prev.indent;

          if (n < l) {
            while (++n < l) {
              combined.push((offset[n] || 0) + 1);
            }

            combined.push(before.column);
          }

          indent = combined.concat(indent);
        }

        node.position.indent = indent || [];

        return node;
      }
    }

    /**
     * Add `node` to `parent`s children or to `tokens`.
     * Performs merges where possible.
     *
     * @example
     *   add({});
     *
     *   add({}, {children: []});
     *
     * @param {Object} node - Node to add.
     * @param {Object} [parent] - Parent to insert into.
     * @return {Object} - Added or merged into node.
     */
    function add(node, parent) {
      var children = parent ? parent.children : tokens;
      var prev = children[children.length - 1];

      if (
        prev &&
        node.type === prev.type &&
        node.type in MERGEABLE_NODES &&
        mergeable(prev) &&
        mergeable(node)
      ) {
        node = MERGEABLE_NODES[node.type].call(self, prev, node);
      }

      if (node !== prev) {
        children.push(node);
      }

      if (self.atStart && tokens.length !== 0) {
        self.exitStart();
      }

      return node;
    }

    /**
     * Remove `subvalue` from `value`.
     * `subvalue` must be at the start of `value`.
     *
     * @example
     *   eat('foo')({type: 'text', value: 'foo'});
     *
     * @param {string} subvalue - Removed from `value`,
     *   and passed to `updatePosition`.
     * @return {Function} - Wrapper around `add`, which
     *   also adds `position` to node.
     */
    function eat(subvalue) {
      var indent = getOffset();
      var pos = position();
      var current = now();

      validateEat(subvalue);

      apply.reset = reset;
      reset.test = test;
      apply.test = test;

      value = value.substring(subvalue.length);

      updatePosition(subvalue);

      indent = indent();

      return apply;

      /**
       * Add the given arguments, add `position` to
       * the returned node, and return the node.
       *
       * @param {Object} node - Node to add.
       * @param {Object} [parent] - Node to insert into.
       * @return {Node} - Added node.
       */
      function apply(node, parent) {
        return pos(add(pos(node), parent), indent);
      }

      /**
       * Functions just like apply, but resets the
       * content:  the line and column are reversed,
       * and the eaten value is re-added.
       *
       * This is useful for nodes with a single
       * type of content, such as lists and tables.
       *
       * See `apply` above for what parameters are
       * expected.
       *
       * @return {Node} - Added node.
       */
      function reset() {
        var node = apply.apply(null, arguments);

        line = current.line;
        column = current.column;
        value = subvalue + value;

        return node;
      }

      /**
       * Test the position, after eating, and reverse
       * to a not-eaten state.
       *
       * @return {Position} - Position after eating `subvalue`.
       */
      function test() {
        var result = pos({});

        line = current.line;
        column = current.column;
        value = subvalue + value;

        return result.position;
      }
    }
  }
}

},{}],81:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:unescape
 * @fileoverview Unescape escapes.
 */

'use strict';

/* Expose. */
module.exports = factory;

/* Factory to de-escape a value, based on a list at `key`
 * in `ctx`. */
function factory(ctx, key) {
  return unescape;

  /* De-escape a string using the expression at `key`
   * in `ctx`. */
  function unescape(value) {
    var prev = 0;
    var index = value.indexOf('\\');
    var escape = ctx[key];
    var queue = [];
    var character;

    while (index !== -1) {
      queue.push(value.slice(prev, index));
      prev = index + 1;
      character = value.charAt(prev);

      /* If the following character is not a valid escape,
       * add the slash. */
      if (!character || escape.indexOf(character) === -1) {
        queue.push('\\');
      }

      index = value.indexOf('\\', prev);
    }

    queue.push(value.slice(prev));

    return queue.join('');
  }
}

},{}],82:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:util:get-indentation
 * @fileoverview Get indentation.
 */

'use strict';

/* Expose. */
module.exports = indentation;

/* Map of characters, and their column length,
 * which can be used as indentation. */
var characters = {' ': 1, '\t': 4};

/**
 * Gets indentation information for a line.
 *
 * @param {string} value - Indented line.
 * @return {Object} - Indetation information.
 */
function indentation(value) {
  var index = 0;
  var indent = 0;
  var character = value.charAt(index);
  var stops = {};
  var size;

  while (character in characters) {
    size = characters[character];

    indent += size;

    if (size > 1) {
      indent = Math.floor(indent / size) * size;
    }

    stops[indent] = index;

    character = value.charAt(++index);
  }

  return {indent: indent, stops: stops};
}

},{}],83:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:util:html
 * @fileoverview HTML regexes.
 */

'use strict';

var attributeName = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
var unquoted = '[^"\'=<>`\\u0000-\\u0020]+';
var singleQuoted = '\'[^\']*\'';
var doubleQuoted = '"[^"]*"';
var attributeValue = '(?:' + unquoted + '|' + singleQuoted + '|' + doubleQuoted + ')';
var attribute = '(?:\\s+' + attributeName + '(?:\\s*=\\s*' + attributeValue + ')?)';
var openTag = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';
var closeTag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
var comment = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
var processing = '<[?].*?[?]>';
var declaration = '<![A-Za-z]+\\s+[^>]*>';
var cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';

exports.openCloseTag = new RegExp('^(?:' + openTag + '|' + closeTag + ')');

exports.tag = new RegExp('^(?:' +
  openTag + '|' +
  closeTag + '|' +
  comment + '|' +
  processing + '|' +
  declaration + '|' +
  cdata +
')');

},{}],84:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:util:get-indentation
 * @fileoverview Get indentation.
 */

'use strict';

module.exports = interrupt;

function interrupt(interruptors, tokenizers, ctx, params) {
  var bools = ['pedantic', 'commonmark'];
  var count = bools.length;
  var length = interruptors.length;
  var index = -1;
  var interruptor;
  var config;
  var fn;
  var offset;
  var bool;
  var ignore;

  while (++index < length) {
    interruptor = interruptors[index];
    config = interruptor[1] || {};
    fn = interruptor[0];
    offset = -1;
    ignore = false;

    while (++offset < count) {
      bool = bools[offset];

      if (config[bool] !== undefined && config[bool] !== ctx.options[bool]) {
        ignore = true;
        break;
      }
    }

    if (ignore) {
      continue;
    }

    if (tokenizers[fn].apply(ctx, params)) {
      return true;
    }
  }

  return false;
}

},{}],85:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:util:normalize
 * @fileoverview Normalize an identifier.
 */

'use strict';

/* Dependencies. */
var collapseWhiteSpace = require('collapse-white-space');

/* Expose. */
module.exports = normalize;

/**
 * Normalize an identifier.  Collapses multiple white space
 * characters into a single space, and removes casing.
 *
 * @example
 *   normalizeIdentifier('FOO\t bar'); // 'foo bar'
 *
 * @param {string} value - Content to normalize.
 * @return {string} - Normalized content.
 */
function normalize(value) {
  return collapseWhiteSpace(value).toLowerCase();
}

},{"collapse-white-space":13}],86:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:parse:util:remove-indentation
 * @fileoverview Remove indentation.
 */

'use strict';

/* Dependencies. */
var trim = require('trim');
var repeat = require('repeat-string');
var getIndent = require('./get-indentation');

/* Expose. */
module.exports = indentation;

/* Characters. */
var C_SPACE = ' ';
var C_NEWLINE = '\n';
var C_TAB = '\t';

/**
 * Remove the minimum indent from every line in `value`.
 * Supports both tab, spaced, and mixed indentation (as
 * well as possible).
 *
 * @example
 *   removeIndentation('  foo'); // 'foo'
 *   removeIndentation('    foo', 2); // '  foo'
 *   removeIndentation('\tfoo', 2); // '  foo'
 *   removeIndentation('  foo\n bar'); // ' foo\n bar'
 *
 * @param {string} value - Value to trim.
 * @param {number?} [maximum] - Maximum indentation
 *   to remove.
 * @return {string} - Unindented `value`.
 */
function indentation(value, maximum) {
  var values = value.split(C_NEWLINE);
  var position = values.length + 1;
  var minIndent = Infinity;
  var matrix = [];
  var index;
  var indentation;
  var stops;
  var padding;

  values.unshift(repeat(C_SPACE, maximum) + '!');

  while (position--) {
    indentation = getIndent(values[position]);

    matrix[position] = indentation.stops;

    if (trim(values[position]).length === 0) {
      continue;
    }

    if (indentation.indent) {
      if (indentation.indent > 0 && indentation.indent < minIndent) {
        minIndent = indentation.indent;
      }
    } else {
      minIndent = Infinity;

      break;
    }
  }

  if (minIndent !== Infinity) {
    position = values.length;

    while (position--) {
      stops = matrix[position];
      index = minIndent;

      while (index && !(index in stops)) {
        index--;
      }

      if (
        trim(values[position]).length !== 0 &&
        minIndent &&
        index !== minIndent
      ) {
        padding = C_TAB;
      } else {
        padding = '';
      }

      values[position] = padding + values[position].slice(
        index in stops ? stops[index] + 1 : 0
      );
    }
  }

  values.shift();

  return values.join(C_NEWLINE);
}

},{"./get-indentation":82,"repeat-string":133,"trim":142}],87:[function(require,module,exports){
'use strict';

var unherit = require('unherit');
var xtend = require('xtend');
var Compiler = require('./lib/compiler.js');

module.exports = stringify;
stringify.Compiler = Compiler;

function stringify(options) {
  var Local = unherit(Compiler);
  Local.prototype.options = xtend(Local.prototype.options, this.data('settings'), options);
  this.Compiler = Local;
}

},{"./lib/compiler.js":88,"unherit":144,"xtend":154}],88:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify
 * @fileoverview Markdown compiler
 */

'use strict';

/* Dependencies. */
var xtend = require('xtend');
var toggle = require('state-toggle');

/* Expose. */
module.exports = Compiler;

/**
 * Construct a new compiler.
 *
 * @constructor
 * @class {Compiler}
 * @param {File} file - Virtual file.
 */
function Compiler(tree, file) {
  this.inLink = false;
  this.inTable = false;
  this.tree = tree;
  this.file = file;
  this.options = xtend(this.options);
  this.setOptions({});
}

/* Cache prototype. */
var proto = Compiler.prototype;

/* Enter and exit helpers. */
proto.enterLink = toggle('inLink', false);
proto.enterTable = toggle('inTable', false);
proto.enterLinkReference = require('./util/enter-link-reference');

/* Configuration. */
proto.options = require('./defaults');
proto.setOptions = require('./set-options');

proto.compile = require('./macro/compile');
proto.visit = require('./macro/one');
proto.all = require('./macro/all');
proto.block = require('./macro/block');
proto.visitOrderedItems = require('./macro/ordered-items');
proto.visitUnorderedItems = require('./macro/unordered-items');

/* Expose visitors. */
proto.visitors = {
  root: require('./visitors/root'),
  text: require('./visitors/text'),
  heading: require('./visitors/heading'),
  paragraph: require('./visitors/paragraph'),
  blockquote: require('./visitors/blockquote'),
  list: require('./visitors/list'),
  listItem: require('./visitors/list-item'),
  inlineCode: require('./visitors/inline-code'),
  yaml: require('./visitors/yaml'),
  code: require('./visitors/code'),
  html: require('./visitors/html'),
  thematicBreak: require('./visitors/thematic-break'),
  strong: require('./visitors/strong'),
  emphasis: require('./visitors/emphasis'),
  break: require('./visitors/break'),
  delete: require('./visitors/delete'),
  link: require('./visitors/link'),
  linkReference: require('./visitors/link-reference'),
  imageReference: require('./visitors/image-reference'),
  definition: require('./visitors/definition'),
  image: require('./visitors/image'),
  footnote: require('./visitors/footnote'),
  footnoteReference: require('./visitors/footnote-reference'),
  footnoteDefinition: require('./visitors/footnote-definition'),
  table: require('./visitors/table'),
  tableCell: require('./visitors/table-cell')
};

},{"./defaults":89,"./macro/all":91,"./macro/block":92,"./macro/compile":93,"./macro/one":94,"./macro/ordered-items":95,"./macro/unordered-items":96,"./set-options":97,"./util/enter-link-reference":101,"./visitors/blockquote":106,"./visitors/break":107,"./visitors/code":108,"./visitors/definition":109,"./visitors/delete":110,"./visitors/emphasis":111,"./visitors/footnote":114,"./visitors/footnote-definition":112,"./visitors/footnote-reference":113,"./visitors/heading":115,"./visitors/html":116,"./visitors/image":118,"./visitors/image-reference":117,"./visitors/inline-code":119,"./visitors/link":121,"./visitors/link-reference":120,"./visitors/list":123,"./visitors/list-item":122,"./visitors/paragraph":124,"./visitors/root":125,"./visitors/strong":126,"./visitors/table":128,"./visitors/table-cell":127,"./visitors/text":129,"./visitors/thematic-break":130,"./visitors/yaml":131,"state-toggle":135,"xtend":154}],89:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:defaults
 * @fileoverview Default options for `stringify`.
 */

'use strict';

module.exports = {
  gfm: true,
  commonmark: false,
  pedantic: false,
  entities: 'false',
  setext: false,
  closeAtx: false,
  looseTable: false,
  spacedTable: true,
  paddedTable: true,
  incrementListMarker: true,
  fences: false,
  fence: '`',
  bullet: '-',
  listItemIndent: 'tab',
  rule: '*',
  ruleSpaces: true,
  ruleRepetition: 3,
  strong: '*',
  emphasis: '_'
};

},{}],90:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:escape
 * @fileoverview Escape text to prevent it turning
 *   into markdown syntax.
 */

'use strict';

/* Dependencies. */
var decimal = require('is-decimal');
var alphanumeric = require('is-alphanumeric');
var whitespace = require('is-whitespace-character');
var escapes = require('markdown-escapes');
var prefix = require('./util/entity-prefix-length');

/* Expose. */
module.exports = factory;

/* Constants. */
var BACKSLASH = '\\';
var BULLETS = ['*', '-', '+'];
var ALLIGNMENT = [':', '-', ' ', '|'];
var entities = {'<': '&lt;', ':': '&#x3A;', '&': '&amp;', '|': '&#x7C;', '~': '&#x7E;'};

/**
 * Factory to escape characters.
 *
 * @example
 *   var escape = escapeFactory({ commonmark: true });
 *   escape('x*x', { type: 'text', value: 'x*x' }) // 'x\\*x'
 *
 * @param {Object} options - Compiler options.
 * @return {function(value, node, parent): string} - Function which
 *   takes a value and a node and (optionally) its parent and returns
 *   its escaped value.
 */
function factory(options) {
  return escape;

  /**
   * Escape punctuation characters in a node's value.
   *
   * @param {string} value - Value to escape.
   * @param {Object} node - Node in which `value` exists.
   * @param {Object} [parent] - Parent of `node`.
   * @return {string} - Escaped `value`.
   */
  function escape(value, node, parent) {
    var self = this;
    var gfm = options.gfm;
    var commonmark = options.commonmark;
    var pedantic = options.pedantic;
    var markers = commonmark ? ['.', ')'] : ['.'];
    var siblings = parent && parent.children;
    var index = siblings && siblings.indexOf(node);
    var prev = siblings && siblings[index - 1];
    var next = siblings && siblings[index + 1];
    var length = value.length;
    var escapable = escapes(options);
    var position = -1;
    var queue = [];
    var escaped = queue;
    var afterNewLine;
    var character;
    var wordCharBefore;
    var wordCharAfter;
    var offset;
    var replace;

    if (prev) {
      afterNewLine = text(prev) && /\n\s*$/.test(prev.value);
    } else {
      afterNewLine = !parent || parent.type === 'root' || parent.type === 'paragraph';
    }

    function one(character) {
      return escapable.indexOf(character) === -1 ?
        entities[character] : BACKSLASH + character;
    }

    while (++position < length) {
      character = value.charAt(position);
      replace = false;

      if (character === '\n') {
        afterNewLine = true;
      } else if (
        character === BACKSLASH ||
        character === '`' ||
        character === '*' ||
        character === '[' ||
        character === '<' ||
        (character === '&' && prefix(value.slice(position)) > 0) ||
        (character === ']' && self.inLink) ||
        (gfm && character === '~' && value.charAt(position + 1) === '~') ||
        (gfm && character === '|' && (self.inTable || alignment(value, position))) ||
        (
          character === '_' &&
          /* Delegate leading/trailing underscores
           * to the multinode version below. */
          position > 0 &&
          position < length - 1 &&
          (
              pedantic ||
              !alphanumeric(value.charAt(position - 1)) ||
              !alphanumeric(value.charAt(position + 1))
          )
        ) ||
        (gfm && !self.inLink && character === ':' && protocol(queue.join('')))
      ) {
        replace = true;
      } else if (afterNewLine) {
        if (
          character === '>' ||
          character === '#' ||
          BULLETS.indexOf(character) !== -1
        ) {
          replace = true;
        } else if (decimal(character)) {
          offset = position + 1;

          while (offset < length) {
            if (!decimal(value.charAt(offset))) {
              break;
            }

            offset++;
          }

          if (markers.indexOf(value.charAt(offset)) !== -1) {
            next = value.charAt(offset + 1);

            if (!next || next === ' ' || next === '\t' || next === '\n') {
              queue.push(value.slice(position, offset));
              position = offset;
              character = value.charAt(position);
              replace = true;
            }
          }
        }
      }

      if (afterNewLine && !whitespace(character)) {
        afterNewLine = false;
      }

      queue.push(replace ? one(character) : character);
    }

    /* Multi-node versions. */
    if (siblings && text(node)) {
      /* Check for an opening parentheses after a
       * link-reference (which can be joined by
       * white-space). */
      if (prev && prev.referenceType === 'shortcut') {
        position = -1;
        length = escaped.length;

        while (++position < length) {
          character = escaped[position];

          if (character === ' ' || character === '\t') {
            continue;
          }

          if (character === '(' || character === ':') {
            escaped[position] = one(character);
          }

          break;
        }

        /* If the current node is all spaces / tabs,
         * preceded by a shortcut, and followed by
         * a text starting with `(`, escape it. */
        if (
          text(next) &&
          position === length &&
          next.value.charAt(0) === '('
        ) {
          escaped.push(BACKSLASH);
        }
      }

      /* Ensure non-auto-links are not seen as links.
       * This pattern needs to check the preceding
       * nodes too. */
      if (
        gfm &&
        !self.inLink &&
        text(prev) &&
        value.charAt(0) === ':' &&
        protocol(prev.value.slice(-6))
      ) {
        escaped[0] = one(':');
      }

      /* Escape ampersand if it would otherwise
       * start an entity. */
      if (
        text(next) &&
        value.charAt(length - 1) === '&' &&
        prefix('&' + next.value) !== 0
      ) {
        escaped[escaped.length - 1] = one('&');
      }

      /* Escape double tildes in GFM. */
      if (
        gfm &&
        text(next) &&
        value.charAt(length - 1) === '~' &&
        next.value.charAt(0) === '~'
      ) {
        escaped.splice(escaped.length - 1, 0, BACKSLASH);
      }

      /* Escape underscores, but not mid-word (unless
       * in pedantic mode). */
      wordCharBefore = text(prev) && alphanumeric(prev.value.slice(-1));
      wordCharAfter = text(next) && alphanumeric(next.value.charAt(0));

      if (length === 1) {
        if (value === '_' && (pedantic || !wordCharBefore || !wordCharAfter)) {
          escaped.unshift(BACKSLASH);
        }
      } else {
        if (
          value.charAt(0) === '_' &&
          (pedantic || !wordCharBefore || !alphanumeric(value.charAt(1)))
        ) {
          escaped.unshift(BACKSLASH);
        }

        if (
          value.charAt(length - 1) === '_' &&
          (pedantic || !wordCharAfter || !alphanumeric(value.charAt(length - 2)))
        ) {
          escaped.splice(escaped.length - 1, 0, BACKSLASH);
        }
      }
    }

    return escaped.join('');
  }
}

/**
 * Check if `index` in `value` is inside an alignment row.
 */
function alignment(value, index) {
  var start = value.lastIndexOf('\n', index);
  var end = value.indexOf('\n', index);

  start = start === -1 ? -1 : start;
  end = end === -1 ? value.length : end;

  while (++start < end) {
    if (ALLIGNMENT.indexOf(value.charAt(start)) === -1) {
      return false;
    }
  }

  return true;
}

/**
 * Check if `node` is a text node.
 */
function text(node) {
  return node && node.type === 'text';
}

/**
 * Check if `value` ends in a protocol.
 */
function protocol(value) {
  var val = value.slice(-6).toLowerCase();
  return val === 'mailto' || val.slice(-5) === 'https' || val.slice(-4) === 'http';
}

},{"./util/entity-prefix-length":102,"is-alphanumeric":22,"is-decimal":25,"is-whitespace-character":28,"markdown-escapes":31}],91:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:all
 * @fileoverview Stringify children in a node.
 */

'use strict';

/* Expose. */
module.exports = all;

/**
 * Visit all children of `parent`.
 *
 * @param {Object} parent - Parent node of children.
 * @return {Array.<string>} - List of compiled children.
 */
function all(parent) {
  var self = this;
  var children = parent.children;
  var length = children.length;
  var results = [];
  var index = -1;

  while (++index < length) {
    results[index] = self.visit(children[index], parent);
  }

  return results;
}

},{}],92:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:block
 * @fileoverview Stringify a block.
 */

'use strict';

/* Expose. */
module.exports = block;

/**
 * Stringify a block node with block children (e.g., `root`
 * or `blockquote`).
 *
 * Knows about code following a list, or adjacent lists
 * with similar bullets, and places an extra newline
 * between them.
 *
 * @param {Object} node
 * @return {string} - Compiled children.
 */
function block(node) {
  var self = this;
  var values = [];
  var children = node.children;
  var length = children.length;
  var index = -1;
  var child;
  var prev;

  while (++index < length) {
    child = children[index];

    if (prev) {
      /* Duplicate nodes, such as a list
       * directly following another list,
       * often need multiple new lines.
       *
       * Additionally, code blocks following a list
       * might easily be mistaken for a paragraph
       * in the list itself. */
      if (child.type === prev.type && prev.type === 'list') {
        values.push(prev.ordered === child.ordered ? '\n\n\n' : '\n\n');
      } else if (prev.type === 'list' && child.type === 'code' && !child.lang) {
        values.push('\n\n\n');
      } else {
        values.push('\n\n');
      }
    }

    values.push(self.visit(child, node));

    prev = child;
  }

  return values.join('');
}

},{}],93:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:compile
 * @fileoverview Compile the given node.
 */

'use strict';

/* Dependencies. */
var compact = require('mdast-util-compact');

/* Expose. */
module.exports = compile;

/**
 * Stringify the given tree.
 *
 * @param {Node} node - Syntax tree.
 * @return {string} - Markdown document.
 */
function compile() {
  return this.visit(compact(this.tree, this.options.commonmark));
}

},{"mdast-util-compact":33}],94:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:one
 * @fileoverview Stringify a node.
 */

'use strict';

/* Expose. */
module.exports = one;

/**
 * Visit a node.
 *
 * @param {Object} node - Node.
 * @param {Object?} [parent] - `node`s parent.
 * @return {string} - Compiled `node`.
 */
function one(node, parent) {
  var self = this;
  var visitors = self.visitors;

  /* Fail on unknown nodes. */
  if (typeof visitors[node.type] !== 'function') {
    self.file.fail(
      new Error(
        'Missing compiler for node of type `' +
        node.type + '`: `' + node + '`'
      ),
      node
    );
  }

  return visitors[node.type].call(self, node, parent);
}

},{}],95:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:ordered-items
 * @fileoverview Stringify ordered list items.
 */

'use strict';

/* Expose. */
module.exports = orderedItems;

/**
 * Visit ordered list items.
 *
 * Starts the list with
 * `node.start` and increments each following list item
 * bullet by one:
 *
 *     2. foo
 *     3. bar
 *
 * In `incrementListMarker: false` mode, does not increment
 * each marker and stays on `node.start`:
 *
 *     1. foo
 *     1. bar
 *
 * Adds an extra line after an item if it has
 * `loose: true`.
 *
 * @param {Object} node - `list` node with
 *   `ordered: true`.
 * @return {string} - Compiled children.
 */
function orderedItems(node) {
  var self = this;
  var fn = self.visitors.listItem;
  var increment = self.options.incrementListMarker;
  var values = [];
  var start = node.start;
  var children = node.children;
  var length = children.length;
  var index = -1;
  var bullet;

  while (++index < length) {
    bullet = (increment ? start + index : start) + '.';
    values[index] = fn.call(self, children[index], node, index, bullet);
  }

  return values.join('\n');
}

},{}],96:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:macro:unordered-items
 * @fileoverview Stringify unordered list items.
 */

'use strict';

/* Expose. */
module.exports = unorderedItems;

/**
 * Visit unordered list items.
 *
 * Uses `options.bullet` as each item's bullet.
 *
 * @param {Object} node - `list` node with
 *   `ordered: false`.
 * @return {string} - Compiled children.
 */
function unorderedItems(node) {
  var self = this;
  var bullet = self.options.bullet;
  var fn = self.visitors.listItem;
  var children = node.children;
  var length = children.length;
  var index = -1;
  var values = [];

  while (++index < length) {
    values[index] = fn.call(self, children[index], node, index, bullet);
  }

  return values.join('\n');
}

},{}],97:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:set-options
 * @fileoverview Set configuration.
 */

'use strict';

/* Dependencies. */
var xtend = require('xtend');
var encode = require('stringify-entities');
var defaults = require('./defaults');
var escapeFactory = require('./escape');
var returner = require('./util/returner');

/* Expose. */
module.exports = setOptions;

/* Map of applicable enum's. */
var maps = {
  entities: {true: true, false: true, numbers: true, escape: true},
  bullet: {'*': true, '-': true, '+': true},
  rule: {'-': true, _: true, '*': true},
  listItemIndent: {tab: true, mixed: true, 1: true},
  emphasis: {_: true, '*': true},
  strong: {_: true, '*': true},
  fence: {'`': true, '~': true}
};

/* Expose `validate`. */
var validate = {
  boolean: validateBoolean,
  string: validateString,
  number: validateNumber
};

/**
 * Set options.  Does not overwrite previously set
 * options.
 *
 * @this {Compiler}
 * @throws {Error} - When an option is invalid.
 * @param {Object?} [options] - Stringify settings.
 * @return {Compiler} - `self`.
 */
function setOptions(options) {
  var self = this;
  var current = self.options;
  var ruleRepetition;
  var key;

  if (options == null) {
    options = {};
  } else if (typeof options === 'object') {
    options = xtend(options);
  } else {
    throw new Error('Invalid value `' + options + '` for setting `options`');
  }

  for (key in defaults) {
    validate[typeof defaults[key]](options, key, current[key], maps[key]);
  }

  ruleRepetition = options.ruleRepetition;

  if (ruleRepetition && ruleRepetition < 3) {
    raise(ruleRepetition, 'options.ruleRepetition');
  }

  self.encode = encodeFactory(String(options.entities));
  self.escape = escapeFactory(options);

  self.options = options;

  return self;
}

/**
 * Throw an exception with in its `message` `value`
 * and `name`.
 *
 * @param {*} value - Invalid value.
 * @param {string} name - Setting name.
 */
function raise(value, name) {
  throw new Error('Invalid value `' + value + '` for setting `' + name + '`');
}

/**
 * Validate a value to be boolean. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * a boolean.
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   a boolean.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {boolean} def - Default value.
 */
function validateBoolean(context, name, def) {
  var value = context[name];

  if (value == null) {
    value = def;
  }

  if (typeof value !== 'boolean') {
    raise(value, 'options.' + name);
  }

  context[name] = value;
}

/**
 * Validate a value to be boolean. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * a boolean.
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   a number.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {number} def - Default value.
 */
function validateNumber(context, name, def) {
  var value = context[name];

  if (value == null) {
    value = def;
  }

  if (isNaN(value)) {
    raise(value, 'options.' + name);
  }

  context[name] = value;
}

/**
 * Validate a value to be in `map`. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * in `map`.
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   in `map`.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {string} def - Default value.
 * @param {Object} map - Enum.
 */
function validateString(context, name, def, map) {
  var value = context[name];

  if (value == null) {
    value = def;
  }

  value = String(value);

  if (!(value in map)) {
    raise(value, 'options.' + name);
  }

  context[name] = value;
}

/**
 * Factory to encode HTML entities.
 * Creates a no-operation function when `type` is
 * `'false'`, a function which encodes using named
 * references when `type` is `'true'`, and a function
 * which encodes using numbered references when `type` is
 * `'numbers'`.
 *
 * @param {string} type - Either `'true'`, `'false'`, or
 *   `'numbers'`.
 * @return {function(string): string} - Function which
 *   takes a value and returns its encoded version.
 */
function encodeFactory(type) {
  var options = {};

  if (type === 'false') {
    return returner;
  }

  if (type === 'true') {
    options.useNamedReferences = true;
  }

  if (type === 'escape') {
    options.escapeOnly = true;
    options.useNamedReferences = true;
  }

  return wrapped;

  /**
   * Encode HTML entities using the bound options.
   *
   * @param {string} value - Content.
   * @param {Object} [node] - Node which is compiled.
   * @return {string} - Encoded content.
   */
  function wrapped(value) {
    return encode(value, options);
  }
}

},{"./defaults":89,"./escape":90,"./util/returner":105,"stringify-entities":137,"xtend":154}],98:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:copy-identifier-encoding
 * @fileoverview Encode based on the identifier.
 */

'use strict';

/* Dependencies. */
var entityPrefixLength = require('./entity-prefix-length');

/* Expose. */
module.exports = copy;

/* Punctuation characters. */
var PUNCTUATION = /[-!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~_]/;

/**
 * For shortcut and collapsed reference links, the contents
 * is also an identifier, so we need to restore the original
 * encoding and escaping that were present in the source
 * string.
 *
 * This function takes the unescaped & unencoded value from
 * shortcut's child nodes and the identifier and encodes
 * the former according to the latter.
 *
 * @example
 *   copyIdentifierEncoding('a*b', 'a\\*b*c')
 *   // 'a\\*b*c'
 *
 * @param {string} value - Unescaped and unencoded stringified
 *   link value.
 * @param {string} identifier - Link identifier.
 * @return {string} - Encoded link value.
 */
function copy(value, identifier) {
  var length = value.length;
  var count = identifier.length;
  var result = [];
  var position = 0;
  var index = 0;
  var start;

  while (index < length) {
    /* Take next non-punctuation characters from `value`. */
    start = index;

    while (index < length && !PUNCTUATION.test(value.charAt(index))) {
      index += 1;
    }

    result.push(value.slice(start, index));

    /* Advance `position` to the next punctuation character. */
    while (position < count && !PUNCTUATION.test(identifier.charAt(position))) {
      position += 1;
    }

    /* Take next punctuation characters from `identifier`. */
    start = position;

    while (position < count && PUNCTUATION.test(identifier.charAt(position))) {
      if (identifier.charAt(position) === '&') {
        position += entityPrefixLength(identifier.slice(position));
      }

      position += 1;
    }

    result.push(identifier.slice(start, position));

    /* Advance `index` to the next non-punctuation character. */
    while (index < length && PUNCTUATION.test(value.charAt(index))) {
      index += 1;
    }
  }

  return result.join('');
}

},{"./entity-prefix-length":102}],99:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:enclose-title
 * @fileoverview Quote a `title` the best way possible.
 */

'use strict';

/* Expose. */
module.exports = enclose;

/**
 * There is currently no way to support nested delimiters
 * across Markdown.pl, CommonMark, and GitHub (RedCarpet).
 * The following code supports Markdown.pl and GitHub.
 * CommonMark is not supported when mixing double- and
 * single quotes inside a title.
 *
 * @see https://github.com/vmg/redcarpet/issues/473
 * @see https://github.com/jgm/CommonMark/issues/308
 *
 * @example
 *   encloseTitle('foo') // '"foo"'
 *   encloseTitle('foo \'bar\' baz') // '"foo \'bar\' baz"'
 *   encloseTitle('foo "bar" baz') // '\'foo "bar" baz\''
 *   encloseTitle('foo "bar" \'baz\'') // '"foo "bar" \'baz\'"'
 *
 * @param {string} title - Content.
 * @return {string} - Properly enclosed title.
 */
function enclose(title) {
  var delimiter = title.indexOf('"') === -1 ? '"' : '\'';
  return delimiter + title + delimiter;
}

},{}],100:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:enclose-uri
 * @fileoverview Wrap `url` in angle brackets when needed.
 */

'use strict';

/* Dependencies. */
var count = require('ccount');

/* Expose. */
module.exports = enclose;

/* Constants. */
var re = /\s/;

/**
 * Wrap `url` in angle brackets when needed, or when
 * forced.
 *
 * In links, images, and definitions, the URL part needs
 * to be enclosed when it:
 *
 * - has a length of `0`;
 * - contains white-space;
 * - has more or less opening than closing parentheses.
 *
 * @example
 *   encloseURI('foo bar') // '<foo bar>'
 *   encloseURI('foo(bar(baz)') // '<foo(bar(baz)>'
 *   encloseURI('') // '<>'
 *   encloseURI('example.com') // 'example.com'
 *   encloseURI('example.com', true) // '<example.com>'
 *
 * @param {string} uri - URI to enclose.
 * @param {boolean?} [always] - Force enclosing.
 * @return {boolean} - Properly enclosed `uri`.
 */
function enclose(uri, always) {
  if (always || uri.length === 0 || re.test(uri) || count(uri, '(') !== count(uri, ')')) {
    return '<' + uri + '>';
  }

  return uri;
}

},{"ccount":8}],101:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:enter-link-reference
 * @fileoverview Enter a reference.
 */

'use strict';

/* Dependencies. */
var returner = require('./returner');

/* Expose. */
module.exports = enter;

/**
 * Shortcut and collapsed link references need no escaping
 * and encoding during the processing of child nodes (it
 * must be implied from identifier).
 *
 * This toggler turns encoding and escaping off for shortcut
 * and collapsed references.
 *
 * Implies `enterLink`.
 *
 * @param {Compiler} compiler - Compiler instance.
 * @param {LinkReference} node - LinkReference node.
 * @return {Function} - Exit state.
 */
function enter(compiler, node) {
  var encode = compiler.encode;
  var escape = compiler.escape;
  var exit = compiler.enterLink();

  if (
    node.referenceType !== 'shortcut' &&
    node.referenceType !== 'collapsed'
  ) {
    return exit;
  }

  compiler.escape = returner;
  compiler.encode = returner;

  return function () {
    compiler.encode = encode;
    compiler.escape = escape;
    exit();
  };
}

},{"./returner":105}],102:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:entity-prefix-length
 * @fileoverview Encode based on the identifier.
 */

'use strict';

/* Dependencies. */
var decode = require('parse-entities');

/* Expose. */
module.exports = length;

/**
 * Returns the length of HTML entity that is a prefix of
 * the given string (excluding the ampersand), 0 if it
 * does not start with an entity.
 *
 * @example
 *   entityPrefixLength('&copycat') // 4
 *   entityPrefixLength('&foo &amp &bar') // 0
 *
 * @param {string} value - Input string.
 * @return {number} - Length of an entity.
 */
function length(value) {
  var prefix;

  /* istanbul ignore if - Currently also tested for at
   * implemention, but we keep it here because that’s
   * proper. */
  if (value.charAt(0) !== '&') {
    return 0;
  }

  prefix = value.split('&', 2).join('&');

  return prefix.length - decode(prefix).length;
}

},{"parse-entities":35}],103:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:label
 * @fileoverview Stringify a reference label.
 */

'use strict';

/* Expose. */
module.exports = label;

/**
 * Stringify a reference label.
 *
 * Because link references are easily, mistakingly,
 * created (for example, `[foo]`), reference nodes have
 * an extra property depicting how it looked in the
 * original document, so stringification can cause minimal
 * changes.
 *
 * @param {Object} node - `linkReference` or
 *   `imageReference` node.
 * @return {string} - Markdown label reference.
 */
function label(node) {
  var type = node.referenceType;
  var value = type === 'full' ? node.identifier : '';

  return type === 'shortcut' ? value : '[' + value + ']';
}

},{}],104:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:pad
 * @fileoverview Pad a given value.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = pad;

/* Constants. */
var INDENT = 4;

/**
 * Pad `value` with `level * INDENT` spaces.  Respects
 * lines. Ignores empty lines.
 *
 * @example
 *   pad('foo', 1) // '    foo'
 *
 * @param {string} value - Content.
 * @param {number} level - Indentation level.
 * @return {string} - Padded `value`.
 */
function pad(value, level) {
  var index;
  var padding;

  value = value.split('\n');

  index = value.length;
  padding = repeat(' ', level * INDENT);

  while (index--) {
    if (value[index].length !== 0) {
      value[index] = padding + value[index];
    }
  }

  return value.join('\n');
}

},{"repeat-string":133}],105:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:util:returner
 * @fileoverview Return the given value.
 */

'use strict';

/* Expose. */
module.exports = returner;

/**
 * @param {*} value - Anything.
 * @return {*} - Given `value`.
 */
function returner(value) {
  return value;
}

},{}],106:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:blockquote
 * @fileoverview Stringify a blockquote.
 */

'use strict';

/* Expose. */
module.exports = blockquote;

/**
 * Stringify a blockquote.
 *
 * @param {Object} node - `blockquote` node.
 * @return {string} - Markdown blockquote.
 */
function blockquote(node) {
  var values = this.block(node).split('\n');
  var result = [];
  var length = values.length;
  var index = -1;
  var value;

  while (++index < length) {
    value = values[index];
    result[index] = (value ? ' ' : '') + value;
  }

  return '>' + result.join('\n>');
}

},{}],107:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:break
 * @fileoverview Stringify a break.
 */

'use strict';

/* Expose. */
module.exports = lineBreak;

/* Constants. */
var map = {true: '\\\n', false: '  \n'};

/**
 * Stringify a hard break.
 *
 * In Commonmark mode, trailing backslash form is used in order
 * to preserve trailing whitespace that the line may end with,
 * and also for better visibility.
 *
 * @return {string} - Markdown break.
 */
function lineBreak() {
  return map[this.options.commonmark];
}

},{}],108:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:code
 * @fileoverview Stringify code.
 */

'use strict';

/* Dependencies. */
var streak = require('longest-streak');
var repeat = require('repeat-string');
var pad = require('../util/pad');

/* Expose. */
module.exports = code;

/* Constants. */
var FENCE = /([`~])\1{2}/;

/**
 * Stringify code.
 *
 * Creates indented code when:
 *
 * - No language tag exists;
 * - Not in `fences: true` mode;
 * - A non-empty value exists.
 *
 * Otherwise, GFM fenced code is created:
 *
 *     ```js
 *     foo();
 *     ```
 *
 * When in ``fence: `~` `` mode, uses tildes as fences:
 *
 *     ~~~js
 *     foo();
 *     ~~~
 *
 * Knows about internal fences (Note: GitHub/Kramdown does
 * not support this):
 *
 *     ````javascript
 *     ```markdown
 *     foo
 *     ```
 *     ````
 *
 * Supports named entities in the language flag with
 * `settings.encode` mode.
 *
 * @param {Object} node - `code` node.
 * @param {Object} parent - Parent of `node`.
 * @return {string} - Markdown code.
 */
function code(node, parent) {
  var self = this;
  var value = node.value;
  var options = self.options;
  var marker = options.fence;
  var language = self.encode(node.lang || '', node);
  var fence;

  /* Without (needed) fences. */
  if (!language && !options.fences && value) {
    /* Throw when pedantic, in a list item which
     * isn’t compiled using a tab. */
    if (
      parent &&
      parent.type === 'listItem' &&
      options.listItemIndent !== 'tab' &&
      options.pedantic
    ) {
      self.file.fail(
        'Cannot indent code properly. See http://git.io/vgFvT',
        node.position
      );
    }

    return pad(value, 1);
  }

  fence = streak(value, marker) + 1;

  /* Fix GFM / RedCarpet bug, where fence-like characters
   * inside fenced code can exit a code-block.
   * Yes, even when the outer fence uses different
   * characters, or is longer.
   * Thus, we can only pad the code to make it work. */
  if (FENCE.test(value)) {
    value = pad(value, 1);
  }

  fence = repeat(marker, Math.max(fence, 3));

  return fence + language + '\n' + value + '\n' + fence;
}

},{"../util/pad":104,"longest-streak":30,"repeat-string":133}],109:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:definition
 * @fileoverview Stringify a definition.
 */

'use strict';

/* Dependencies. */
var uri = require('../util/enclose-uri');
var title = require('../util/enclose-title');

/* Expose. */
module.exports = definition;

/**
 * Stringify an URL definition.
 *
 * Is smart about enclosing `url` (see `encloseURI()`) and
 * `title` (see `encloseTitle()`).
 *
 *    [foo]: <foo at bar dot com> 'An "example" e-mail'
 *
 * @param {Object} node - `definition` node.
 * @return {string} - Markdown definition.
 */
function definition(node) {
  var content = uri(node.url);

  if (node.title) {
    content += ' ' + title(node.title);
  }

  return '[' + node.identifier + ']: ' + content;
}

},{"../util/enclose-title":99,"../util/enclose-uri":100}],110:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:delete
 * @fileoverview Stringify a delete.
 */

'use strict';

/* Expose. */
module.exports = strikethrough;

/**
 * Stringify a `delete`.
 *
 * @param {Object} node - `delete` node.
 * @return {string} - Markdown strikethrough.
 */
function strikethrough(node) {
  return '~~' + this.all(node).join('') + '~~';
}

},{}],111:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:emphasis
 * @fileoverview Stringify a emphasis.
 */

'use strict';

/* Expose. */
module.exports = emphasis;

/**
 * Stringify a `emphasis`.
 *
 * The marker used is configurable through `emphasis`, which
 * defaults to an underscore (`'_'`) but also accepts an
 * asterisk (`'*'`):
 *
 *     *foo*
 *
 * @param {Object} node - `emphasis` node.
 * @return {string} - Markdown emphasis.
 */
function emphasis(node) {
  var marker = this.options.emphasis;
  return marker + this.all(node).join('') + marker;
}

},{}],112:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:footnote-definition
 * @fileoverview Stringify a footnote-definition.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = footnoteDefinition;

/**
 * Stringify a footnote definition.
 *
 * @param {Object} node - `footnoteDefinition` node.
 * @return {string} - Markdown footnote definition.
 */
function footnoteDefinition(node) {
  var id = node.identifier.toLowerCase();
  var content = this.all(node).join('\n\n' + repeat(' ', 4));

  return '[^' + id + ']: ' + content;
}

},{"repeat-string":133}],113:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:footnote-reference
 * @fileoverview Stringify a footnote reference.
 */

'use strict';

/* Expose. */
module.exports = footnoteReference;

/**
 * Stringify a footnote reference.
 *
 * @param {Object} node - `footnoteReference` node.
 * @return {string} - Markdown footnote reference.
 */
function footnoteReference(node) {
  return '[^' + node.identifier + ']';
}

},{}],114:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:footnote
 * @fileoverview Stringify a footnote.
 */

'use strict';

/* Expose. */
module.exports = footnote;

/**
 * Stringify a footnote.
 *
 * @param {Object} node - `footnote` node.
 * @return {string} - Markdown footnote.
 */
function footnote(node) {
  return '[^' + this.all(node).join('') + ']';
}

},{}],115:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:heading
 * @fileoverview Stringify a heading.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = heading;

/**
 * Stringify heading.
 *
 * In `setext: true` mode and when `depth` is smaller than
 * three, creates a setext header:
 *
 *     Foo
 *     ===
 *
 * Otherwise, an ATX header is generated:
 *
 *     ### Foo
 *
 * In `closeAtx: true` mode, the header is closed with
 * hashes:
 *
 *     ### Foo ###
 *
 * @param {Object} node - `heading` node.
 * @return {string} - Markdown heading.
 */
function heading(node) {
  var self = this;
  var depth = node.depth;
  var setext = self.options.setext;
  var closeAtx = self.options.closeAtx;
  var content = self.all(node).join('');
  var prefix;

  if (setext && depth < 3) {
    return content + '\n' + repeat(depth === 1 ? '=' : '-', content.length);
  }

  prefix = repeat('#', node.depth);

  return prefix + ' ' + content + (closeAtx ? ' ' + prefix : '');
}

},{"repeat-string":133}],116:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:html
 * @fileoverview Stringify html.
 */

'use strict';

/* Expose. */
module.exports = html;

/**
 * Stringify html.
 *
 * @param {Object} node - `html` node.
 * @return {string} - html.
 */
function html(node) {
  return node.value;
}

},{}],117:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:image-reference
 * @fileoverview Stringify an image reference.
 */

'use strict';

/* Dependencies. */
var label = require('../util/label');

/* Expose. */
module.exports = imageReference;

/**
 * Stringify an image reference.
 *
 * @param {Object} node - `imageReference` node.
 * @return {string} - Markdown image reference.
 */
function imageReference(node) {
  return '![' + (this.encode(node.alt, node) || '') + ']' + label(node);
}

},{"../util/label":103}],118:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:image
 * @fileoverview Stringify an image.
 */

'use strict';

/* Dependencies. */
var uri = require('../util/enclose-uri');
var title = require('../util/enclose-title');

/* Expose. */
module.exports = image;

/**
 * Stringify an image.
 *
 * Is smart about enclosing `url` (see `encloseURI()`) and
 * `title` (see `encloseTitle()`).
 *
 *    ![foo](</fav icon.png> 'My "favourite" icon')
 *
 * Supports named entities in `url`, `alt`, and `title`
 * when in `settings.encode` mode.
 *
 * @param {Object} node - `image` node.
 * @return {string} - Markdown image.
 */
function image(node) {
  var self = this;
  var content = uri(self.encode(node.url || '', node));
  var exit = self.enterLink();
  var alt = self.encode(self.escape(node.alt || '', node));

  exit();

  if (node.title) {
    content += ' ' + title(self.encode(node.title, node));
  }

  return '![' + alt + '](' + content + ')';
}

},{"../util/enclose-title":99,"../util/enclose-uri":100}],119:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:inline-code
 * @fileoverview Stringify inline code.
 */

'use strict';

/* Dependencies. */
var streak = require('longest-streak');
var repeat = require('repeat-string');

/* Expose. */
module.exports = inlineCode;

/**
 * Stringify inline code.
 *
 * Knows about internal ticks (`\``), and ensures one more
 * tick is used to enclose the inline code:
 *
 *     ```foo ``bar`` baz```
 *
 * Even knows about inital and final ticks:
 *
 *     `` `foo ``
 *     `` foo` ``
 *
 * @param {Object} node - `inlineCode` node.
 * @return {string} - Markdown inline code.
 */
function inlineCode(node) {
  var value = node.value;
  var ticks = repeat('`', streak(value, '`') + 1);
  var start = ticks;
  var end = ticks;

  if (value.charAt(0) === '`') {
    start += ' ';
  }

  if (value.charAt(value.length - 1) === '`') {
    end = ' ' + end;
  }

  return start + value + end;
}

},{"longest-streak":30,"repeat-string":133}],120:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:link-reference
 * @fileoverview Stringify a link reference.
 */

'use strict';

/* Dependencies. */
var copy = require('../util/copy-identifier-encoding');
var label = require('../util/label');

/* Expose. */
module.exports = linkReference;

/**
 * Stringify a link reference.
 *
 * @param {Object} node - `linkReference` node.
 * @return {string} - Markdown link reference.
 */
function linkReference(node) {
  var self = this;
  var type = node.referenceType;
  var exit = self.enterLinkReference(self, node);
  var value = self.all(node).join('');

  exit();

  if (type === 'shortcut' || type === 'collapsed') {
    value = copy(value, node.identifier);
  }

  return '[' + value + ']' + label(node);
}

},{"../util/copy-identifier-encoding":98,"../util/label":103}],121:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:link
 * @fileoverview Stringify a link.
 */

'use strict';

/* Dependencies. */
var uri = require('../util/enclose-uri');
var title = require('../util/enclose-title');

/* Expose. */
module.exports = link;

/* Expression for a protocol:
 * http://en.wikipedia.org/wiki/URI_scheme#Generic_syntax */
var PROTOCOL = /^[a-z][a-z+.-]+:\/?/i;

/**
 * Stringify a link.
 *
 * When no title exists, the compiled `children` equal
 * `url`, and `url` starts with a protocol, an auto
 * link is created:
 *
 *     <http://example.com>
 *
 * Otherwise, is smart about enclosing `url` (see
 * `encloseURI()`) and `title` (see `encloseTitle()`).
 *
 *    [foo](<foo at bar dot com> 'An "example" e-mail')
 *
 * Supports named entities in the `url` and `title` when
 * in `settings.encode` mode.
 *
 * @param {Object} node - `link` node.
 * @return {string} - Markdown link.
 */
function link(node) {
  var self = this;
  var content = self.encode(node.url || '', node);
  var exit = self.enterLink();
  var escaped = self.encode(self.escape(node.url || '', node));
  var value = self.all(node).join('');

  exit();

  if (
    node.title == null &&
    PROTOCOL.test(content) &&
    (escaped === value || escaped === 'mailto:' + value)
  ) {
    /* Backslash escapes do not work in autolinks,
     * so we do not escape. */
    return uri(self.encode(node.url), true);
  }

  content = uri(content);

  if (node.title) {
    content += ' ' + title(self.encode(self.escape(node.title, node), node));
  }

  return '[' + value + '](' + content + ')';
}

},{"../util/enclose-title":99,"../util/enclose-uri":100}],122:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:list-item
 * @fileoverview Stringify a list item.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');
var pad = require('../util/pad');

/* Expose. */
module.exports = listItem;

/* Which checkbox to use. */
var CHECKBOX_MAP = {
  undefined: '',
  null: '',
  true: '[x] ',
  false: '[ ] '
};

/**
 * Stringify a list item.
 *
 * Prefixes the content with a checked checkbox when
 * `checked: true`:
 *
 *     [x] foo
 *
 * Prefixes the content with an unchecked checkbox when
 * `checked: false`:
 *
 *     [ ] foo
 *
 * @param {Object} node - `listItem` node.
 * @param {Object} parent - `list` node.
 * @param {number} position - Index of `node` in `parent`.
 * @param {string} bullet - Bullet to use.  This, and the
 *   `listItemIndent` setting define the used indent.
 * @return {string} - Markdown list item.
 */
function listItem(node, parent, position, bullet) {
  var self = this;
  var style = self.options.listItemIndent;
  var loose = node.loose;
  var children = node.children;
  var length = children.length;
  var values = [];
  var index = -1;
  var value;
  var indent;
  var spacing;

  while (++index < length) {
    values[index] = self.visit(children[index], node);
  }

  value = CHECKBOX_MAP[node.checked] + values.join(loose ? '\n\n' : '\n');

  if (style === '1' || (style === 'mixed' && value.indexOf('\n') === -1)) {
    indent = bullet.length + 1;
    spacing = ' ';
  } else {
    indent = Math.ceil((bullet.length + 1) / 4) * 4;
    spacing = repeat(' ', indent - bullet.length);
  }

  value = bullet + spacing + pad(value, indent / 4).slice(indent);

  if (loose && parent.children.length - 1 !== position) {
    value += '\n';
  }

  return value;
}

},{"../util/pad":104,"repeat-string":133}],123:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:list
 * @fileoverview Stringify a list.
 */

'use strict';

/* Expose. */
module.exports = list;

/* Which method to use based on `list.ordered`. */
var ORDERED_MAP = {
  true: 'visitOrderedItems',
  false: 'visitUnorderedItems'
};

/**
 * Stringify a list. See `Compiler#visitOrderedList()` and
 * `Compiler#visitUnorderedList()` for internal working.
 *
 * @param {Object} node - `list` node.
 * @return {string} - Markdown list.
 */
function list(node) {
  return this[ORDERED_MAP[node.ordered]](node);
}

},{}],124:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:paragraph
 * @fileoverview Stringify a paragraph.
 */

'use strict';

/* Expose. */
module.exports = paragraph;

/**
 * Stringify a paragraph.
 *
 * @param {Object} node - `paragraph` node.
 * @return {string} - Markdown paragraph.
 */
function paragraph(node) {
  return this.all(node).join('');
}

},{}],125:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:root
 * @fileoverview Stringify a root.
 */

'use strict';

/* Expose. */
module.exports = root;

/**
 * Stringify a root.
 *
 * Adds a final newline to ensure valid POSIX files.
 *
 * @param {Object} node - `root` node.
 * @return {string} - Document.
 */
function root(node) {
  return this.block(node) + '\n';
}

},{}],126:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:strong
 * @fileoverview Stringify a strong.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = strong;

/**
 * Stringify a `strong`.
 *
 * The marker used is configurable by `strong`, which
 * defaults to an asterisk (`'*'`) but also accepts an
 * underscore (`'_'`):
 *
 *     __foo__
 *
 * @param {Object} node - `strong` node.
 * @return {string} - Markdown strong.
 */
function strong(node) {
  var marker = repeat(this.options.strong, 2);
  return marker + this.all(node).join('') + marker;
}

},{"repeat-string":133}],127:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:table-cell
 * @fileoverview Stringify a table-cell.
 */

'use strict';

/* Expose. */
module.exports = tableCell;

/**
 * Stringify a table cell.
 *
 * @param {Object} node - `tableCell` node.
 * @return {string} - Markdown table cell.
 */
function tableCell(node) {
  return this.all(node).join('');
}

},{}],128:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:table
 * @fileoverview Stringify a table.
 */

'use strict';

/* Dependencies. */
var markdownTable = require('markdown-table');

/* Expose. */
module.exports = table;

/**
 * Stringify table.
 *
 * Creates a fenced table by default, but not in
 * `looseTable: true` mode:
 *
 *     Foo | Bar
 *     :-: | ---
 *     Baz | Qux
 *
 * NOTE: Be careful with `looseTable: true` mode, as a
 * loose table inside an indented code block on GitHub
 * renders as an actual table!
 *
 * Creates a spaced table by default, but not in
 * `spacedTable: false`:
 *
 *     |Foo|Bar|
 *     |:-:|---|
 *     |Baz|Qux|
 *
 * @param {Object} node - `table` node.
 * @return {string} - Markdown table.
 */
function table(node) {
  var self = this;
  var loose = self.options.looseTable;
  var spaced = self.options.spacedTable;
  var pad = self.options.paddedTable;
  var rows = node.children;
  var index = rows.length;
  var exit = self.enterTable();
  var result = [];
  var start;
  var end;

  while (index--) {
    result[index] = self.all(rows[index]);
  }

  exit();

  if (loose) {
    start = '';
    end = '';
  } else if (spaced) {
    start = '| ';
    end = ' |';
  } else {
    start = '|';
    end = '|';
  }

  return markdownTable(result, {
    align: node.align,
    pad: pad,
    start: start,
    end: end,
    delimiter: spaced ? ' | ' : '|'
  });
}

},{"markdown-table":32}],129:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:text
 * @fileoverview Stringify a text.
 */

'use strict';

/* Expose. */
module.exports = text;

/**
 * Stringify text.
 *
 * Supports named entities in `settings.encode: true` mode:
 *
 *     AT&amp;T
 *
 * Supports numbered entities in `settings.encode: numbers`
 * mode:
 *
 *     AT&#x26;T
 *
 * @param {Object} node - `text` node.
 * @param {Object?} [parent] - Parent of `node`.
 * @return {string} - Markdown text.
 */
function text(node, parent) {
  return this.encode(this.escape(node.value, node, parent), node);
}

},{}],130:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:thematic-break
 * @fileoverview Stringify a thematic-break.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = thematic;

/**
 * Stringify a `thematic-break`.
 *
 * The character used is configurable through `rule`: (`'_'`)
 *
 *     ___
 *
 * The number of repititions is defined through
 * `ruleRepetition`: (`6`)
 *
 *     ******
 *
 * Whether spaces delimit each character, is configured
 * through `ruleSpaces`: (`true`)
 *
 *     * * *
 *
 * @return {string} - Markdown thematic break.
 */
function thematic() {
  var options = this.options;
  var rule = repeat(options.rule, options.ruleRepetition);
  return options.ruleSpaces ? rule.split('').join(' ') : rule;
}

},{"repeat-string":133}],131:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:stringify:visitors:yaml
 * @fileoverview Stringify yaml.
 */

'use strict';

/* Dependencies. */
var repeat = require('repeat-string');

/* Expose. */
module.exports = yaml;

/**
 * Stringify `yaml`.
 *
 * @param {Object} node - `yaml` node.
 * @return {string} - Markdown yaml.
 */
function yaml(node) {
  var marker = repeat('-', 3);
  return marker + (node.value ? '\n' + node.value : '') + '\n' + marker;
}

},{"repeat-string":133}],132:[function(require,module,exports){
'use strict';

var unified = require('unified');
var parse = require('remark-parse');
var stringify = require('remark-stringify');

module.exports = unified().use(parse).use(stringify).freeze();

},{"remark-parse":38,"remark-stringify":87,"unified":145}],133:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  } else if (res.length >= max) {
    return res.substr(0, max);
  }

  while (max > res.length && num > 1) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    str += str;
  }

  res += str;
  res = res.substr(0, max);
  return res;
}

},{}],134:[function(require,module,exports){
'use strict';

var path = require('path');

function replaceExt(npath, ext) {
  if (typeof npath !== 'string') {
    return npath;
  }

  if (npath.length === 0) {
    return npath;
  }

  var nFileName = path.basename(npath, path.extname(npath)) + ext;
  return path.join(path.dirname(npath), nFileName);
}

module.exports = replaceExt;

},{"path":36}],135:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module state-toggle
 * @fileoverview Enter/exit a state.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = factory;

/**
 * Construct a state `toggler`: a function which inverses
 * `property` in context based on its current value.
 * The by `toggler` returned function restores that value.
 *
 * @param {string} key - Property to toggle.
 * @param {boolean} state - Default state.
 * @param {Object?} [ctx] - Context object.
 * @return {Function} - Enter.
 */
function factory(key, state, ctx) {
  /**
   * Enter a state.
   *
   * @return {Function} - Exit state.
   */
  return function () {
    var context = ctx || this;
    var current = context[key];

    context[key] = !state;

    /**
     * Cancel state to its value before entering.
     */
    return function () {
      context[key] = current;
    };
  };
}

},{}],136:[function(require,module,exports){
module.exports=[
  "cent",
  "copy",
  "divide",
  "gt",
  "lt",
  "not",
  "para",
  "times"
]

},{}],137:[function(require,module,exports){
'use strict';

var entities = require('character-entities-html4');
var legacy = require('character-entities-legacy');
var has = require('has');
var hexadecimal = require('is-hexadecimal');
var alphanumerical = require('is-alphanumerical');
var dangerous = require('./dangerous.json');

/* Expose. */
module.exports = encode;

encode.escape = escape;

/* List of enforced escapes. */
var escapes = ['"', '\'', '<', '>', '&', '`'];

/* Map of characters to names. */
var characters = construct();

/* Default escapes. */
var EXPRESSION_ESCAPE = toExpression(escapes);

/* Surrogate pairs. */
var EXPRESSION_SURROGATE_PAIR = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

/* Non-ASCII characters. */
// eslint-disable-next-line no-control-regex
var EXPRESSION_BMP = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

/* Encode special characters in `value`. */
function encode(value, options) {
  var settings = options || {};
  var subset = settings.subset;
  var set = subset ? toExpression(subset) : EXPRESSION_ESCAPE;
  var escapeOnly = settings.escapeOnly;
  var omit = settings.omitOptionalSemicolons;

  value = value.replace(set, function (char, pos, val) {
    return one(char, val.charAt(pos + 1), settings);
  });

  if (subset || escapeOnly) {
    return value;
  }

  return value
    .replace(EXPRESSION_SURROGATE_PAIR, function (pair, pos, val) {
      return toHexReference(
        ((pair.charCodeAt(0) - 0xD800) * 0x400) +
        pair.charCodeAt(1) - 0xDC00 + 0x10000,
        val.charAt(pos + 2),
        omit
      );
    })
    .replace(EXPRESSION_BMP, function (char, pos, val) {
      return one(char, val.charAt(pos + 1), settings);
    });
}

/* Shortcut to escape special characters in HTML. */
function escape(value) {
  return encode(value, {
    escapeOnly: true,
    useNamedReferences: true
  });
}

/* Encode `char` according to `options`. */
function one(char, next, options) {
  var shortest = options.useShortestReferences;
  var omit = options.omitOptionalSemicolons;
  var named;
  var numeric;

  if (
    (shortest || options.useNamedReferences) &&
    has(characters, char)
  ) {
    named = toNamed(characters[char], next, omit, options.attribute);
  }

  if (shortest || !named) {
    numeric = toHexReference(char.charCodeAt(0), next, omit);
  }

  if (named && (!shortest || named.length < numeric.length)) {
    return named;
  }

  return numeric;
}

/* Transform `code` into an entity. */
function toNamed(name, next, omit, attribute) {
  var value = '&' + name;

  if (
    omit &&
    has(legacy, name) &&
    dangerous.indexOf(name) === -1 &&
    (!attribute || (next && next !== '=' && !alphanumerical(next)))
  ) {
    return value;
  }

  return value + ';';
}

/* Transform `code` into a hexadecimal character reference. */
function toHexReference(code, next, omit) {
  var value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !hexadecimal(next) ? value : value + ';';
}

/* Create an expression for `characters`. */
function toExpression(characters) {
  return new RegExp('[' + characters.join('') + ']', 'g');
}

/* Construct the map. */
function construct() {
  var chars = {};
  var name;

  for (name in entities) {
    chars[entities[name]] = name;
  }

  return chars;
}

},{"./dangerous.json":136,"character-entities-html4":9,"character-entities-legacy":10,"has":19,"is-alphanumerical":23,"is-hexadecimal":26}],138:[function(require,module,exports){
"use strict";

var StructuredSource = require('./structured-source.js')["default"];


module.exports = StructuredSource;

/* vim: set sw=4 ts=4 et tw=80 : */

},{"./structured-source.js":139}],139:[function(require,module,exports){
"use strict";

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var upperBound = require('boundary').upperBound;
var Position = function Position(line, column) {
  this.line = line;
  this.column = column;
};

exports.Position = Position;
var SourceLocation = function SourceLocation(start, end) {
  this.start = start;
  this.end = end;
};

exports.SourceLocation = SourceLocation;
var StructuredSource = (function () {
  var StructuredSource =
  /**
   * @constructs StructuredSource
   * @param {string} source - source code text.
   */
  function StructuredSource(source) {
    this.indice = [0];
    var regexp = /[\r\n\u2028\u2029]/g;
    var length = source.length;
    regexp.lastIndex = 0;
    while (true) {
      var result = regexp.exec(source);
      if (!result) {
        break;
      }
      var index = result.index;
      if (source.charCodeAt(index) === 13 /* '\r' */ && source.charCodeAt(index + 1) === 10 /* '\n' */) {
        index += 1;
      }
      var nextIndex = index + 1;
      // If there's a last line terminator, we push it to the indice.
      // So use < instead of <=.
      if (length < nextIndex) {
        break;
      }
      this.indice.push(nextIndex);
      regexp.lastIndex = nextIndex;
    }
  };

  StructuredSource.prototype.locationToRange = function (loc) {
    return [this.positionToIndex(loc.start), this.positionToIndex(loc.end)];
  };

  StructuredSource.prototype.rangeToLocation = function (range) {
    return new SourceLocation(this.indexToPosition(range[0]), this.indexToPosition(range[1]));
  };

  StructuredSource.prototype.positionToIndex = function (pos) {
    // Line number starts with 1.
    // Column number starts with 0.
    var start = this.indice[pos.line - 1];
    return start + pos.column;
  };

  StructuredSource.prototype.indexToPosition = function (index) {
    var startLine = upperBound(this.indice, index);
    return new Position(startLine, index - this.indice[startLine - 1]);
  };

  _classProps(StructuredSource, null, {
    line: {
      get: function () {
        return this.indice.length;
      }
    }
  });

  return StructuredSource;
})();

exports["default"] = StructuredSource;

},{"boundary":7}],140:[function(require,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src.getTime ? src.getTime() : src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],141:[function(require,module,exports){
'use strict';

module.exports = trimTrailingLines;

var line = '\n';

/* Remove final newline characters from `value`. */
function trimTrailingLines(value) {
  var val = String(value);
  var index = val.length;

  while (val.charAt(--index) === line) { /* empty */ }

  return val.slice(0, index + 1);
}

},{}],142:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],143:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module trough
 * @fileoverview Middleware.  Inspired by `segmentio/ware`,
 *   but able to change the values from transformer to
 *   transformer.
 */

'use strict';

/* Expose. */
module.exports = trough;

/* Methods. */
var slice = [].slice;

/**
 * Create new middleware.
 *
 * @return {Object} - Middlewre.
 */
function trough() {
  var fns = [];
  var middleware = {};

  middleware.run = run;
  middleware.use = use;

  return middleware;

  /**
   * Run `fns`.  Last argument must be
   * a completion handler.
   *
   * @param {...*} input - Parameters
   */
  function run() {
    var index = -1;
    var input = slice.call(arguments, 0, -1);
    var done = arguments[arguments.length - 1];

    if (typeof done !== 'function') {
      throw new Error('Expected function as last argument, not ' + done);
    }

    next.apply(null, [null].concat(input));

    return;

    /**
     * Run the next `fn`, if any.
     *
     * @param {Error?} err - Failure.
     * @param {...*} values - Other input.
     */
    function next(err) {
      var fn = fns[++index];
      var params = slice.call(arguments, 0);
      var values = params.slice(1);
      var length = input.length;
      var pos = -1;

      if (err) {
        done(err);
        return;
      }

      /* Copy non-nully input into values. */
      while (++pos < length) {
        if (values[pos] === null || values[pos] === undefined) {
          values[pos] = input[pos];
        }
      }

      input = values;

      /* Next or done. */
      if (fn) {
        wrap(fn, next).apply(null, input);
      } else {
        done.apply(null, [null].concat(input));
      }
    }
  }

  /**
   * Add `fn` to the list.
   *
   * @param {Function} fn - Anything `wrap` accepts.
   */
  function use(fn) {
    if (typeof fn !== 'function') {
      throw new Error('Expected `fn` to be a function, not ' + fn);
    }

    fns.push(fn);

    return middleware;
  }
}

/**
 * Wrap `fn`.  Can be sync or async; return a promise,
 * receive a completion handler, return new values and
 * errors.
 *
 * @param {Function} fn - Thing to wrap.
 * @param {Function} next - Completion handler.
 * @return {Function} - Wrapped `fn`.
 */
function wrap(fn, next) {
  var invoked;

  return wrapped;

  function wrapped() {
    var params = slice.call(arguments, 0);
    var callback = fn.length > params.length;
    var result;

    if (callback) {
      params.push(done);
    }

    try {
      result = fn.apply(null, params);
    } catch (err) {
      /* Well, this is quite the pickle.  `fn` received
       * a callback and invoked it (thus continuing the
       * pipeline), but later also threw an error.
       * We’re not about to restart the pipeline again,
       * so the only thing left to do is to throw the
       * thing instea. */
      if (callback && invoked) {
        throw err;
      }

      return done(err);
    }

    if (!callback) {
      if (result && typeof result.then === 'function') {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }

  /**
   * Invoke `next`, only once.
   *
   * @param {Error?} err - Optional error.
   */
  function done() {
    if (!invoked) {
      invoked = true;

      next.apply(null, arguments);
    }
  }

  /**
   * Invoke `done` with one value.
   * Tracks if an error is passed, too.
   *
   * @param {*} value - Optional value.
   */
  function then(value) {
    done(null, value);
  }
}

},{}],144:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module unherit
 * @fileoverview Create a custom constructor which can be modified
 *   without affecting the original class.
 */

'use strict';

/* Dependencies. */
var xtend = require('xtend');
var inherits = require('inherits');

/* Expose. */
module.exports = unherit;

/**
 * Create a custom constructor which can be modified
 * without affecting the original class.
 *
 * @param {Function} Super - Super-class.
 * @return {Function} - Constructor acting like `Super`,
 *   which can be modified without affecting the original
 *   class.
 */
function unherit(Super) {
  var result;
  var key;
  var value;

  inherits(Of, Super);
  inherits(From, Of);

  /* Clone values. */
  result = Of.prototype;

  for (key in result) {
    value = result[key];

    if (value && typeof value === 'object') {
      result[key] = 'concat' in value ? value.concat() : xtend(value);
    }
  }

  return Of;

  /**
   * Constructor accepting a single argument,
   * which itself is an `arguments` object.
   */
  function From(parameters) {
    return Super.apply(this, parameters);
  }

  /**
   * Constructor accepting variadic arguments.
   */
  function Of() {
    if (!(this instanceof Of)) {
      return new From(arguments);
    }

    return Super.apply(this, arguments);
  }
}

},{"inherits":20,"xtend":154}],145:[function(require,module,exports){
'use strict';

/* Dependencies. */
var has = require('has');
var extend = require('extend');
var bail = require('bail');
var vfile = require('vfile');
var trough = require('trough');
var string = require('x-is-string');
var func = require('x-is-function');
var plain = require('is-plain-obj');

/* Expose a frozen processor. */
module.exports = unified().freeze();

var slice = [].slice;

/* Process pipeline. */
var pipeline = trough().use(pipelineParse).use(pipelineRun).use(pipelineStringify);

function pipelineParse(p, ctx) {
  ctx.tree = p.parse(ctx.file);
}

function pipelineRun(p, ctx, next) {
  p.run(ctx.tree, ctx.file, done);

  function done(err, tree, file) {
    if (err) {
      next(err);
    } else {
      ctx.tree = tree;
      ctx.file = file;
      next();
    }
  }
}

function pipelineStringify(p, ctx) {
  ctx.file.contents = p.stringify(ctx.tree, ctx.file);
}

/* Function to create the first processor. */
function unified() {
  var attachers = [];
  var transformers = trough();
  var namespace = {};
  var frozen = false;
  var freezeIndex = -1;

  /* Data management. */
  processor.data = data;

  /* Lock. */
  processor.freeze = freeze;

  /* Plug-ins. */
  processor.attachers = attachers;
  processor.use = use;

  /* API. */
  processor.parse = parse;
  processor.stringify = stringify;
  processor.run = run;
  processor.runSync = runSync;
  processor.process = process;
  processor.processSync = processSync;

  /* Expose. */
  return processor;

  /* Create a new processor based on the processor
   * in the current scope. */
  function processor() {
    var destination = unified();
    var length = attachers.length;
    var index = -1;

    while (++index < length) {
      destination.use.apply(null, attachers[index]);
    }

    destination.data(extend(true, {}, namespace));

    return destination;
  }

  /* Freeze: used to signal a processor that has finished
   * configuration.
   *
   * For example, take unified itself.  It’s frozen.
   * Plug-ins should not be added to it.  Rather, it should
   * be extended, by invoking it, before modifying it.
   *
   * In essence, always invoke this when exporting a
   * processor. */
  function freeze() {
    var values;
    var plugin;
    var options;
    var transformer;

    if (frozen) {
      return processor;
    }

    while (++freezeIndex < attachers.length) {
      values = attachers[freezeIndex];
      plugin = values[0];
      options = values[1];
      transformer = null;

      if (options === false) {
        continue;
      }

      if (options === true) {
        values[1] = undefined;
      }

      transformer = plugin.apply(processor, values.slice(1));

      if (func(transformer)) {
        transformers.use(transformer);
      }
    }

    frozen = true;
    freezeIndex = Infinity;

    return processor;
  }

  /* Data management.
   * Getter / setter for processor-specific informtion. */
  function data(key, value) {
    if (string(key)) {
      /* Set `key`. */
      if (arguments.length === 2) {
        assertUnfrozen('data', frozen);

        namespace[key] = value;

        return processor;
      }

      /* Get `key`. */
      return (has(namespace, key) && namespace[key]) || null;
    }

    /* Set space. */
    if (key) {
      assertUnfrozen('data', frozen);
      namespace = key;
      return processor;
    }

    /* Get space. */
    return namespace;
  }

  /* Plug-in management.
   *
   * Pass it:
   * *   an attacher and options,
   * *   a preset,
   * *   a list of presets, attachers, and arguments (list
   *     of attachers and options). */
  function use(value) {
    var settings;

    assertUnfrozen('use', frozen);

    if (value === null || value === undefined) {
      /* Empty */
    } else if (func(value)) {
      addPlugin.apply(null, arguments);
    } else if (typeof value === 'object') {
      if ('length' in value) {
        addList(value);
      } else {
        addPreset(value);
      }
    } else {
      throw new Error('Expected usable value, not `' + value + '`');
    }

    if (settings) {
      namespace.settings = extend(namespace.settings || {}, settings);
    }

    return processor;

    function addPreset(result) {
      addList(result.plugins);

      if (result.settings) {
        settings = extend(settings || {}, result.settings);
      }
    }

    function add(value) {
      if (func(value)) {
        addPlugin(value);
      } else if (typeof value === 'object') {
        if ('length' in value) {
          addPlugin.apply(null, value);
        } else {
          addPreset(value);
        }
      } else {
        throw new Error('Expected usable value, not `' + value + '`');
      }
    }

    function addList(plugins) {
      var length;
      var index;

      if (plugins === null || plugins === undefined) {
        /* Empty */
      } else if (typeof plugins === 'object' && 'length' in plugins) {
        length = plugins.length;
        index = -1;

        while (++index < length) {
          add(plugins[index]);
        }
      } else {
        throw new Error('Expected a list of plugins, not `' + plugins + '`');
      }
    }

    function addPlugin(plugin, value) {
      var entry = find(plugin);

      if (entry) {
        if (plain(entry[1]) && plain(value)) {
          value = extend(entry[1], value);
        }

        entry[1] = value;
      } else {
        attachers.push(slice.call(arguments));
      }
    }
  }

  function find(plugin) {
    var length = attachers.length;
    var index = -1;
    var entry;

    while (++index < length) {
      entry = attachers[index];

      if (entry[0] === plugin) {
        return entry;
      }
    }
  }

  /* Parse a file (in string or VFile representation)
   * into a Unist node using the `Parser` on the
   * processor. */
  function parse(doc) {
    var file = vfile(doc);
    var Parser;

    freeze();
    Parser = processor.Parser;
    assertParser('parse', Parser);

    if (newable(Parser)) {
      return new Parser(String(file), file).parse();
    }

    return Parser(String(file), file); // eslint-disable-line new-cap
  }

  /* Run transforms on a Unist node representation of a file
   * (in string or VFile representation), async. */
  function run(node, file, cb) {
    assertNode(node);
    freeze();

    if (!cb && func(file)) {
      cb = file;
      file = null;
    }

    if (!cb) {
      return new Promise(executor);
    }

    executor(null, cb);

    function executor(resolve, reject) {
      transformers.run(node, vfile(file), done);

      function done(err, tree, file) {
        tree = tree || node;
        if (err) {
          reject(err);
        } else if (resolve) {
          resolve(tree);
        } else {
          cb(null, tree, file);
        }
      }
    }
  }

  /* Run transforms on a Unist node representation of a file
   * (in string or VFile representation), sync. */
  function runSync(node, file) {
    var complete = false;
    var result;

    run(node, file, done);

    assertDone('runSync', 'run', complete);

    return result;

    function done(err, tree) {
      complete = true;
      bail(err);
      result = tree;
    }
  }

  /* Stringify a Unist node representation of a file
   * (in string or VFile representation) into a string
   * using the `Compiler` on the processor. */
  function stringify(node, doc) {
    var file = vfile(doc);
    var Compiler;

    freeze();
    Compiler = processor.Compiler;
    assertCompiler('stringify', Compiler);
    assertNode(node);

    if (newable(Compiler)) {
      return new Compiler(node, file).compile();
    }

    return Compiler(node, file); // eslint-disable-line new-cap
  }

  /* Parse a file (in string or VFile representation)
   * into a Unist node using the `Parser` on the processor,
   * then run transforms on that node, and compile the
   * resulting node using the `Compiler` on the processor,
   * and store that result on the VFile. */
  function process(doc, cb) {
    freeze();
    assertParser('process', processor.Parser);
    assertCompiler('process', processor.Compiler);

    if (!cb) {
      return new Promise(executor);
    }

    executor(null, cb);

    function executor(resolve, reject) {
      var file = vfile(doc);

      pipeline.run(processor, {file: file}, done);

      function done(err) {
        if (err) {
          reject(err);
        } else if (resolve) {
          resolve(file);
        } else {
          cb(null, file);
        }
      }
    }
  }

  /* Process the given document (in string or VFile
   * representation), sync. */
  function processSync(doc) {
    var complete = false;
    var file;

    freeze();
    assertParser('processSync', processor.Parser);
    assertCompiler('processSync', processor.Compiler);
    file = vfile(doc);

    process(file, done);

    assertDone('processSync', 'process', complete);

    return file;

    function done(err) {
      complete = true;
      bail(err);
    }
  }
}

/* Check if `func` is a constructor. */
function newable(value) {
  return func(value) && keys(value.prototype);
}

/* Check if `value` is an object with keys. */
function keys(value) {
  var key;
  for (key in value) {
    return true;
  }
  return false;
}

/* Assert a parser is available. */
function assertParser(name, Parser) {
  if (!func(Parser)) {
    throw new Error('Cannot `' + name + '` without `Parser`');
  }
}

/* Assert a compiler is available. */
function assertCompiler(name, Compiler) {
  if (!func(Compiler)) {
    throw new Error('Cannot `' + name + '` without `Compiler`');
  }
}

/* Assert the processor is not frozen. */
function assertUnfrozen(name, frozen) {
  if (frozen) {
    throw new Error(
      'Cannot invoke `' + name + '` on a frozen processor.\n' +
      'Create a new processor first, by invoking it: ' +
      'use `processor()` instead of `processor`.'
    );
  }
}

/* Assert `node` is a Unist node. */
function assertNode(node) {
  if (!node || !string(node.type)) {
    throw new Error('Expected node, got `' + node + '`');
  }
}

/* Assert that `complete` is `true`. */
function assertDone(name, asyncName, complete) {
  if (!complete) {
    throw new Error('`' + name + '` finished async. Use `' + asyncName + '` instead');
  }
}

},{"bail":6,"extend":16,"has":19,"is-plain-obj":27,"trough":143,"vfile":151,"x-is-function":152,"x-is-string":153}],146:[function(require,module,exports){
'use strict';

var iterate = require('array-iterate');

module.exports = modifierFactory;

/* Turn `callback` into a child-modifier accepting a parent.
 * See `array-iterate` for more info. */
function modifierFactory(callback) {
  return iteratorFactory(wrapperFactory(callback));
}

/* Turn `callback` into a `iterator' accepting a parent. */
function iteratorFactory(callback) {
  return iterator;

  function iterator(parent) {
    var children = parent && parent.children;

    if (!children) {
      throw new Error('Missing children in `parent` for `modifier`');
    }

    return iterate(children, callback, parent);
  }
}

/* Pass the context as the third argument to `callback`. */
function wrapperFactory(callback) {
  return wrapper;

  function wrapper(value, index) {
    return callback(value, index, this);
  }
}

},{"array-iterate":5}],147:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unist:util:remove-position
 * @fileoverview Remove `position`s from a unist tree.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var visit = require('unist-util-visit');

/* Expose. */
module.exports = removePosition;

/**
 * Remove `position`s from `tree`.
 *
 * @param {Node} tree - Node.
 * @return {Node} - Node without `position`s.
 */
function removePosition(node, force) {
  visit(node, force ? hard : soft);
  return node;
}

/**
 * Delete `position`.
 */
function hard(node) {
  delete node.position;
}

/**
 * Remove `position` softly.
 */
function soft(node) {
  node.position = undefined;
}

},{"unist-util-visit":149}],148:[function(require,module,exports){
'use strict';

var has = require('has');

module.exports = stringify;

function stringify(value) {
  /* Nothing. */
  if (!value || typeof value !== 'object') {
    return null;
  }

  /* Node. */
  if (has(value, 'position') || has(value, 'type')) {
    return location(value.position);
  }

  /* Location. */
  if (has(value, 'start') || has(value, 'end')) {
    return location(value);
  }

  /* Position. */
  if (has(value, 'line') || has(value, 'column')) {
    return position(value);
  }

  /* ? */
  return null;
}

function position(pos) {
  if (!pos || typeof pos !== 'object') {
    pos = {};
  }

  return index(pos.line) + ':' + index(pos.column);
}

function location(loc) {
  if (!loc || typeof loc !== 'object') {
    loc = {};
  }

  return position(loc.start) + '-' + position(loc.end);
}

function index(value) {
  return value && typeof value === 'number' ? value : 1;
}

},{"has":19}],149:[function(require,module,exports){
'use strict';

/* Expose. */
module.exports = visit;

/* Visit. */
function visit(tree, type, visitor, reverse) {
  if (typeof type === 'function') {
    reverse = visitor;
    visitor = type;
    type = null;
  }

  one(tree);

  return;

  /* Visit a single node. */
  function one(node, index, parent) {
    var result;

    index = index || (parent ? 0 : null);

    if (!type || node.type === type) {
      result = visitor(node, index, parent || null);
    }

    if (node.children && result !== false) {
      return all(node.children, node);
    }

    return result;
  }

  /* Visit children in `parent`. */
  function all(children, parent) {
    var step = reverse ? -1 : 1;
    var max = children.length;
    var min = -1;
    var index = (reverse ? max : min) + step;
    var child;

    while (index > min && index < max) {
      child = children[index];

      if (child && one(child, index, parent) === false) {
        return false;
      }

      index += step;
    }

    return true;
  }
}

},{}],150:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module vfile-location
 * @fileoverview Convert between positions (line and column-based)
 *   and offsets (range-based) locations in a virtual file.
 */

'use strict';

/* Expose. */
module.exports = factory;

/**
 * Factory.
 *
 * @param {VFile|string|Buffer} file - Virtual file or document.
 */
function factory(file) {
  var contents = indices(String(file));

  return {
    toPosition: offsetToPositionFactory(contents),
    toOffset: positionToOffsetFactory(contents)
  };
}

/**
 * Factory to get the line and column-based `position` for
 * `offset` in the bound indices.
 *
 * @param {Array.<number>} indices - Indices of
 *   line-breaks in `value`.
 * @return {Function} - Bound method.
 */
function offsetToPositionFactory(indices) {
  return offsetToPosition;

  /**
   * Get the line and column-based `position` for
   * `offset` in the bound indices.
   *
   * @param {number} offset - Offset.
   * @return {Position} - Object with `line`, `column`,
   *   and `offset` properties based on the bound
   *   `indices`.  An empty object when given invalid
   *   or out of bounds input.
   */
  function offsetToPosition(offset) {
    var index = -1;
    var length = indices.length;

    if (offset < 0) {
      return {};
    }

    while (++index < length) {
      if (indices[index] > offset) {
        return {
          line: index + 1,
          column: (offset - (indices[index - 1] || 0)) + 1,
          offset: offset
        };
      }
    }

    return {};
  }
}

/**
 * Factory to get the `offset` for a line and column-based
 * `position` in the bound indices.
 *
 * @param {Array.<number>} indices - Indices of
 *   line-breaks in `value`.
 * @return {Function} - Bound method.
 */
function positionToOffsetFactory(indices) {
  return positionToOffset;

  /**
   * Get the `offset` for a line and column-based
   * `position` in the bound indices.
   *
   * @param {Position} position - Object with `line` and
   *   `column` properties.
   * @return {number} - Offset. `-1` when given invalid
   *   or out of bounds input.
   */
  function positionToOffset(position) {
    var line = position && position.line;
    var column = position && position.column;

    if (!isNaN(line) && !isNaN(column) && line - 1 in indices) {
      return ((indices[line - 2] || 0) + column - 1) || 0;
    }

    return -1;
  }
}

/**
 * Get indices of line-breaks in `value`.
 *
 * @param {string} value - Value.
 * @return {Array.<number>} - List of indices of
 *   line-breaks.
 */
function indices(value) {
  var result = [];
  var index = value.indexOf('\n');

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf('\n', index + 1);
  }

  result.push(value.length + 1);

  return result;
}

},{}],151:[function(require,module,exports){
(function (process){
'use strict';

var path = require('path');
var has = require('has');
var replace = require('replace-ext');
var stringify = require('unist-util-stringify-position');
var buffer = require('is-buffer');
var string = require('x-is-string');

module.exports = VFile;

var proto = VFile.prototype;

proto.toString = toString;
proto.message = message;
proto.fail = fail;

/* Slight backwards compatibility.  Remove in the future. */
proto.warn = message;

/* Order of setting (least specific to most), we need this because
 * otherwise `{stem: 'a', path: '~/b.js'}` would throw, as a path
 * is needed before a stem can be set. */
var order = [
  'history',
  'path',
  'basename',
  'stem',
  'extname',
  'dirname'
];

/* Construct a new file. */
function VFile(options) {
  var prop;
  var index;
  var length;

  if (!options) {
    options = {};
  } else if (string(options) || buffer(options)) {
    options = {contents: options};
  } else if ('message' in options && 'messages' in options) {
    return options;
  }

  if (!(this instanceof VFile)) {
    return new VFile(options);
  }

  this.data = {};
  this.messages = [];
  this.history = [];
  this.cwd = process.cwd();

  /* Set path related properties in the correct order. */
  index = -1;
  length = order.length;

  while (++index < length) {
    prop = order[index];

    if (has(options, prop)) {
      this[prop] = options[prop];
    }
  }

  /* Set non-path related properties. */
  for (prop in options) {
    if (order.indexOf(prop) === -1) {
      this[prop] = options[prop];
    }
  }
}

/* Access full path (`~/index.min.js`). */
Object.defineProperty(proto, 'path', {
  get: function () {
    return this.history[this.history.length - 1];
  },
  set: function (path) {
    assertNonEmpty(path, 'path');

    if (path !== this.path) {
      this.history.push(path);
    }
  }
});

/* Access parent path (`~`). */
Object.defineProperty(proto, 'dirname', {
  get: function () {
    return string(this.path) ? path.dirname(this.path) : undefined;
  },
  set: function (dirname) {
    assertPath(this.path, 'dirname');
    this.path = path.join(dirname || '', this.basename);
  }
});

/* Access basename (`index.min.js`). */
Object.defineProperty(proto, 'basename', {
  get: function () {
    return string(this.path) ? path.basename(this.path) : undefined;
  },
  set: function (basename) {
    assertNonEmpty(basename, 'basename');
    assertPart(basename, 'basename');
    this.path = path.join(this.dirname || '', basename);
  }
});

/* Access extname (`.js`). */
Object.defineProperty(proto, 'extname', {
  get: function () {
    return string(this.path) ? path.extname(this.path) : undefined;
  },
  set: function (extname) {
    var ext = extname || '';

    assertPart(ext, 'extname');
    assertPath(this.path, 'extname');

    if (ext) {
      if (ext.charAt(0) !== '.') {
        throw new Error('`extname` must start with `.`');
      }

      if (ext.indexOf('.', 1) !== -1) {
        throw new Error('`extname` cannot contain multiple dots');
      }
    }

    this.path = replace(this.path, ext);
  }
});

/* Access stem (`index.min`). */
Object.defineProperty(proto, 'stem', {
  get: function () {
    return string(this.path) ? path.basename(this.path, this.extname) : undefined;
  },
  set: function (stem) {
    assertNonEmpty(stem, 'stem');
    assertPart(stem, 'stem');
    this.path = path.join(this.dirname || '', stem + (this.extname || ''));
  }
});

/* Get the value of the file. */
function toString(encoding) {
  var value = this.contents || '';
  return buffer(value) ? value.toString(encoding) : String(value);
}

/* Create a message with `reason` at `position`.
 * When an error is passed in as `reason`, copies the
 * stack.  This does not add a message to `messages`. */
function message(reason, position, ruleId) {
  var filePath = this.path;
  var range = stringify(position) || '1:1';
  var location;
  var err;

  location = {
    start: {line: null, column: null},
    end: {line: null, column: null}
  };

  if (position && position.position) {
    position = position.position;
  }

  if (position) {
    /* Location. */
    if (position.start) {
      location = position;
      position = position.start;
    } else {
      /* Position. */
      location.start = position;
    }
  }

  err = new VMessage(reason.message || reason);

  err.name = (filePath ? filePath + ':' : '') + range;
  err.file = filePath || '';
  err.reason = reason.message || reason;
  err.line = position ? position.line : null;
  err.column = position ? position.column : null;
  err.location = location;
  err.ruleId = ruleId || null;
  err.source = null;
  err.fatal = false;

  if (reason.stack) {
    err.stack = reason.stack;
  }

  this.messages.push(err);

  return err;
}

/* Fail. Creates a vmessage, associates it with the file,
 * and throws it. */
function fail() {
  var message = this.message.apply(this, arguments);

  message.fatal = true;

  throw message;
}

/* Inherit from `Error#`. */
function VMessagePrototype() {}
VMessagePrototype.prototype = Error.prototype;
VMessage.prototype = new VMessagePrototype();

/* Message properties. */
proto = VMessage.prototype;

proto.file = proto.name = proto.reason = proto.message = proto.stack = '';
proto.fatal = proto.column = proto.line = null;

/* Construct a new file message.
 *
 * Note: We cannot invoke `Error` on the created context,
 * as that adds readonly `line` and `column` attributes on
 * Safari 9, thus throwing and failing the data. */
function VMessage(reason) {
  this.message = reason;
}

/* Assert that `part` is not a path (i.e., does
 * not contain `path.sep`). */
function assertPart(part, name) {
  if (part.indexOf(path.sep) !== -1) {
    throw new Error('`' + name + '` cannot be a path: did not expect `' + path.sep + '`');
  }
}

/* Assert that `part` is not empty. */
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty');
  }
}

/* Assert `path` exists. */
function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too');
  }
}

}).call(this,require('_process'))
},{"_process":37,"has":19,"is-buffer":24,"path":36,"replace-ext":134,"unist-util-stringify-position":148,"x-is-string":153}],152:[function(require,module,exports){
module.exports = function isFunction (fn) {
  return Object.prototype.toString.call(fn) === '[object Function]'
}

},{}],153:[function(require,module,exports){
var toString = Object.prototype.toString

module.exports = isString

function isString(obj) {
    return toString.call(obj) === "[object String]"
}

},{}],154:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1]);
