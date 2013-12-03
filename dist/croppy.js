!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Croppy=e():"undefined"!=typeof global?global.Croppy=e():"undefined"!=typeof self&&(self.Croppy=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Canvas, Util;

Util = require('./util.coffee');

/*
TODO: give @translatePos a reasonable starting point
*/


Canvas = (function() {
  function Canvas(options) {
    var _ref;
    this.settings = Util.merge(options, this.defaults);
    _ref = this.settings.rot, this.cw = _ref[0], this.ccw = _ref[1];
    this.zoomSlider = this.settings.zoomSlider;
    this.currentAngle = 0;
    this.mouseDown = false;
    this.scale = this.settings.scale || 1.0;
    this.scaleMultiplier = this.settings.scaleMultiplier || 0.95;
    this.startDragOffset = {};
    this.el = this.createCanvas();
    this.image = this.loadImage();
  }

  Canvas.prototype.defaults = {
    width: '300',
    height: '300'
  };

  Canvas.prototype.draw = function() {
    var cx;
    cx = this.el.getContext("2d");
    cx.clearRect(0, 0, this.el.width, this.el.height);
    cx.save();
    if (this.settings.debug) {
      console.log('translatePos:', this.translatePos, ', scale:', this.scale.toPrecision(2), ', angle:', this.currentAngle);
    }
    cx.translate(this.translatePos.x, this.translatePos.y);
    cx.scale(this.scale, this.scale);
    cx.rotate(this.currentAngle * Math.PI / 180);
    cx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    return cx.restore();
  };

  Canvas.prototype.createCanvas = function() {
    var canvas,
      _this = this;
    canvas = document.createElement('canvas');
    canvas.id = 'croppy-canvas';
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;
    if (this.cw) {
      this.cw.addEventListener("click", function() {
        _this.currentAngle += 90;
        return _this.draw();
      }, false);
    }
    if (this.ccw) {
      this.ccw.addEventListener("click", function() {
        _this.currentAngle -= 90;
        return _this.draw();
      }, false);
    }
    canvas.addEventListener("mousewheel", function(e) {
      if (e.wheelDeltaY > 0) {
        _this.scale *= _this.scaleMultiplier;
      } else {
        _this.scale /= _this.scaleMultiplier;
      }
      _this.updateZoomSlider();
      return _this.draw();
    }, false);
    if (this.zoomSlider) {
      this.zoomSlider.addEventListener('change', function(e) {
        _this.scale = _this.convertSliderToScale(e.target.value);
        return _this.draw();
      }, false);
    }
    canvas.addEventListener("mousedown", function(e) {
      _this.mouseDown = true;
      _this.startDragOffset.x = e.clientX - _this.translatePos.x;
      return _this.startDragOffset.y = e.clientY - _this.translatePos.y;
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

  /*
  Loads an image onto the canvas
  
  @param src [String] The location (href) of the image source
  */


  Canvas.prototype.loadImage = function(src) {
    var context, image,
      _this = this;
    context = this.el.getContext('2d');
    image = new Image();
    image.onload = function(e) {
      var img, smallestDimension, xCorrection, yCorrection;
      img = e.srcElement;
      console.log('Image width:', img.width, ', height:', img.height);
      xCorrection = 0;
      yCorrection = 0;
      smallestDimension = img.width < img.height ? (yCorrection = _this.el.height / 2, img.width) : (xCorrection = _this.el.width / 2, img.height);
      _this.scale = _this.el.width / smallestDimension;
      _this.updateZoomSlider();
      _this.translatePos = {
        x: (_this.scale * img.width - xCorrection) / 2,
        y: (_this.scale * img.height - yCorrection) / 2
      };
      return _this.draw();
    };
    image.src = src || this.settings.src;
    return image;
  };

  /*
  Sets the zoomSlider value to the correct spot
  */


  Canvas.prototype.updateZoomSlider = function(value) {
    return this.zoomSlider.value = this.convertScaleToSlider(value || this.scale);
  };

  /*
  Inverse of {convertScaleToSlider}.
  
  TODO: Make this a better scale
  */


  Canvas.prototype.convertSliderToScale = function(y) {
    return y / 1000;
  };

  /*
  Inverse of {convertSliderToScale}
  */


  Canvas.prototype.convertScaleToSlider = function(x) {
    return x * 1000;
  };

  return Canvas;

})();

module.exports = Canvas;


},{"./util.coffee":3}],2:[function(require,module,exports){
var Canvas, Croppy, Util;

Util = require('./util.coffee');

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
    this.settings = Util.merge(options, this.defaults);
    this.settings.rot = this.createRotationButtons();
    this.settings.zoomSlider = this.createZoomSlider();
    this.container = document.getElementById(id);
    this.canvas = new Canvas(this.settings);
    this.canvas.id = 'croppy-canvas';
    this.cropOverlay = this.createCropOverlay();
    this.render();
  }

  Croppy.prototype.defaults = {
    cropWidth: '150px',
    cropHeight: '150px',
    cropBorder: '2px solid orange',
    cropTop: '75px',
    cropLeft: '75px'
  };

  Croppy.prototype.createCropOverlay = function() {
    var overlay, style;
    overlay = document.createElement('div');
    overlay.id = 'croppy-crop-area';
    style = overlay.style;
    style.width = this.settings.cropWidth;
    style.height = this.settings.cropHeight;
    style.border = this.settings.cropBorder;
    style.top = this.settings.cropTop;
    style.left = this.settings.cropLeft;
    style.position = 'absolute';
    style.pointerEvents = 'none';
    return overlay;
  };

  Croppy.prototype.makeUnselectable = function(el) {
    var s;
    s = el.style;
    s['-webkit-touch-callout'] = 'none';
    s['-webkit-user-select'] = 'none';
    s['-khtml-user-select'] = 'none';
    s['-moz-user-select'] = 'none';
    s['-ms-user-select'] = 'none';
    return s['user-select'] = 'none';
  };

  Croppy.prototype.createRotationButtons = function() {
    var ccw, cw;
    cw = document.createElement('span');
    cw.id = 'croppy-rot-cw';
    cw.innerText = '↻';
    this.makeUnselectable(cw);
    ccw = document.createElement('span');
    ccw.id = 'croppy-rot-ccw';
    ccw.innerText = '↺';
    this.makeUnselectable(ccw);
    return [cw, ccw];
  };

  Croppy.prototype.createZoomSlider = function() {
    var slider;
    slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'croppy-zoom-slider';
    slider.min = 1;
    slider.max = 1000;
    slider.step = 1;
    return slider;
  };

  Croppy.prototype.createCroppyEl = function() {
    var croppyEl;
    croppyEl = document.createElement('div');
    croppyEl.id = 'croppy';
    croppyEl.style.position = 'relative';
    croppyEl.style.width = this.settings.width;
    croppyEl.style.height = this.settings.height;
    croppyEl.style.margin = '0 auto';
    croppyEl.appendChild(this.canvas.el);
    croppyEl.appendChild(this.cropOverlay);
    return croppyEl;
  };

  Croppy.prototype.createRotDiv = function() {
    var rotDiv;
    rotDiv = document.createElement('div');
    rotDiv.id = 'croppy-rot';
    return rotDiv;
  };

  Croppy.prototype.render = function() {
    var rotDiv;
    this.el = this.createCroppyEl();
    rotDiv = this.createRotDiv();
    rotDiv.appendChild(this.canvas.cw);
    rotDiv.appendChild(this.canvas.ccw);
    this.el.appendChild(rotDiv);
    this.el.appendChild(this.canvas.zoomSlider);
    return this.container.appendChild(this.el);
  };

  return Croppy;

})();

module.exports = Croppy;


},{"./canvas.coffee":1,"./util.coffee":3}],3:[function(require,module,exports){
var Util,
  __hasProp = {}.hasOwnProperty;

Util = (function() {
  function Util() {}

  Util.merge = function(mergee, merger) {
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

  return Util;

})();

module.exports = Util;


},{}]},{},[2])
(2)
});
;