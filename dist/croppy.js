!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Trickster=e():"undefined"!=typeof global?global.Trickster=e():"undefined"!=typeof self&&(self.Trickster=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
HTML5 canvas crop zoom library
*/

var Croppy, createCanvas, render;

Croppy = (function() {
  /*
  @param  options [Object] A bunch of options
  @option id      [String] The id of the element to render into.
  */

  function Croppy(options) {
    this.container = document.getElementById(options.id);
    this.canvas = createCanvas();
    render();
  }

  return Croppy;

})();

render = function() {};

createCanvas = function() {
  return document.createElement('canvas');
};


},{}]},{},[1])
(1)
});
;