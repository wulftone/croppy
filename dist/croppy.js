!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Croppy=e():"undefined"!=typeof global?global.Croppy=e():"undefined"!=typeof self&&(self.Croppy=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Canvas,
  __hasProp = {}.hasOwnProperty;

Canvas = (function() {
  function Canvas(options) {
    this.settings = this.mergeObj(options, this.defaults);
    this.el = this.createCanvas();
    this.image = this.loadImage();
    this.currentAngle = 0;
    this.mouseDown = false;
    this.scale = 1.0;
    this.scaleMultiplier = 0.8;
    this.startDragOffset = {};
  }

  Canvas.prototype.mergeObj = function(mergee, merger) {
    var k, v;
    for (k in merger) {
      if (!__hasProp.call(merger, k)) continue;
      v = merger[k];
      if (!mergee.hasOwnProperty(k)) {
        mergee[k] = v;
      }
    }
    return mergee;
  };

  Canvas.prototype.defaults = {
    width: '300',
    height: '300'
  };

  Canvas.prototype.draw = function() {
    var cx;
    cx = this.el.getContext("2d");
    cx.clearRect(0, 0, this.el.width, this.el.height);
    cx.save();
    cx.translate(this.translatePos.x, this.translatePos.y);
    cx.scale(this.scale, this.scale);
    cx.rotate(this.currentAngle * Math.PI / 180);
    cx.drawImage(this.image, -this.image.width / 2, -this.image.width / 2);
    return cx.restore();
  };

  Canvas.prototype.createCanvas = function() {
    var canvas,
      _this = this;
    canvas = document.createElement('canvas');
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;
    document.getElementById("plus").addEventListener("click", function() {
      _this.currentAngle += 90;
      return _this.draw();
    }, false);
    document.getElementById("minus").addEventListener("click", function() {
      _this.currentAngle -= 90;
      return _this.draw();
    }, false);
    canvas.addEventListener("mousewheel", function(e) {
      if (e.wheelDeltaY > 0) {
        _this.scale *= _this.scaleMultiplier;
      } else {
        _this.scale /= _this.scaleMultiplier;
      }
      console.log(_this.scale);
      return _this.draw();
    }, false);
    canvas.addEventListener("mousedown", function(e) {
      _this.mouseDown = true;
      console.log('start', _this.translatePos);
      _this.startDragOffset.x = e.clientX - _this.translatePos.x;
      _this.startDragOffset.y = e.clientY - _this.translatePos.y;
      return console.log('startDragOffset', _this.startDragOffset);
    });
    canvas.addEventListener("mouseup", function(e) {
      return _this.mouseDown = false;
    });
    canvas.addEventListener("mouseover", function(e) {
      return _this.mouseDown = false;
    });
    canvas.addEventListener("mouseout", function(e) {
      return _this.mouseDown = false;
    });
    canvas.addEventListener("mousemove", function(e) {
      if (_this.mouseDown) {
        _this.translatePos.x = e.clientX - _this.startDragOffset.x;
        _this.translatePos.y = e.clientY - _this.startDragOffset.y;
        return _this.draw();
      }
    });
    return canvas;
  };

  Canvas.prototype.loadImage = function(src) {
    var context, image,
      _this = this;
    context = this.el.getContext('2d');
    image = new Image();
    image.onload = function(e) {
      var img;
      img = e.srcElement;
      _this.translatePos = {
        x: img.width / 2,
        y: img.height / 2
      };
      return _this.draw();
    };
    image.src = src || this.settings.src;
    return image;
  };

  return Canvas;

})();

module.exports = Canvas;


},{}],2:[function(require,module,exports){
var Canvas, Croppy;

Canvas = require('./canvas.coffee');

/*
HTML5 canvas crop zoom library
*/


Croppy = (function() {
  /*
  @param id      [String] The id of the element to render into.
  @param options [Object] A bunch of options
  */

  function Croppy(id, options) {
    if (options == null) {
      options = {};
    }
    this.container = document.getElementById(id);
    this.canvas = new Canvas(options);
    this.render();
  }

  Croppy.prototype.render = function() {
    return this.container.appendChild(this.canvas.el);
  };

  return Croppy;

})();

module.exports = Croppy;


},{"./canvas.coffee":1}]},{},[2])
(2)
});
;