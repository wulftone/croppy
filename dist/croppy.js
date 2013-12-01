!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Croppy=e():"undefined"!=typeof global?global.Croppy=e():"undefined"!=typeof self&&(self.Croppy=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Canvas,
  __hasProp = {}.hasOwnProperty;

Canvas = (function() {
  function Canvas(options) {
    this.settings = this.mergeObj(options, this.defaults);
    this.el = this.createCanvas();
    this.image = this.loadImage();
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

  Canvas.prototype.createCanvas = function() {
    var canvas, draw, mouseDown, scale, scaleMultiplier, startDragOffset, translatePos,
      _this = this;
    draw = function(scale, translatePos) {
      var cx;
      cx = _this.el.getContext("2d");
      cx.clearRect(0, 0, _this.el.width, _this.el.height);
      cx.save();
      console.log(translatePos);
      cx.translate(translatePos.x, translatePos.y);
      cx.scale(scale, scale);
      cx.rotate(_this.el.currentAngle * Math.PI / 180);
      cx.drawImage(_this.image, -_this.image.width / 2, -_this.image.width / 2);
      return cx.restore();
    };
    canvas = document.createElement('canvas');
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;
    translatePos = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };
    scale = 1.0;
    scaleMultiplier = 0.8;
    startDragOffset = {};
    mouseDown = false;
    document.getElementById("plus").addEventListener("click", function() {
      scale /= scaleMultiplier;
      return draw(scale, translatePos);
    }, false);
    document.getElementById("minus").addEventListener("click", function() {
      scale *= scaleMultiplier;
      return draw(scale, translatePos);
    }, false);
    canvas.addEventListener("mousedown", function(e) {
      mouseDown = true;
      console.log('start', translatePos);
      startDragOffset.x = e.clientX - translatePos.x;
      startDragOffset.y = e.clientY - translatePos.y;
      return console.log('startDragOffset', startDragOffset);
    });
    canvas.addEventListener("mouseup", function(e) {
      return mouseDown = false;
    });
    canvas.addEventListener("mouseover", function(e) {
      return mouseDown = false;
    });
    canvas.addEventListener("mouseout", function(e) {
      return mouseDown = false;
    });
    canvas.addEventListener("mousemove", function(e) {
      if (mouseDown) {
        translatePos.x = e.clientX - startDragOffset.x;
        translatePos.y = e.clientY - startDragOffset.y;
        return draw(scale, translatePos);
      }
    });
    canvas.addEventListener("mousewheel", function(e) {
      if (e.wheelDeltaY > 0) {
        scale += 0.1;
      } else {
        scale -= 0.1;
      }
      return draw(scale, translatePos);
    }, false);
    canvas.currentAngle = 0;
    return canvas;
  };

  Canvas.prototype.loadImage = function() {
    var context, image,
      _this = this;
    context = this.el.getContext('2d');
    image = new Image();
    image.onload = function(e) {
      var img;
      img = e.srcElement;
      return context.drawImage(image, _this.el.width / 2 - img.width / 2, _this.el.height / 2 - img.height / 2);
    };
    image.src = this.settings.src;
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