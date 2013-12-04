!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Croppy=e():"undefined"!=typeof global?global.Croppy=e():"undefined"!=typeof self&&(self.Croppy=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Canvas, Util;

Util = require('./util.coffee');

/*
TODO: give @translatePos a reasonable starting point
*/


Canvas = (function() {
  function Canvas(options) {
    var _ref, _ref1;
    this.settings = Util.merge(options, this.defaults);
    _ref = this.settings.rot, this.cw = _ref[0], this.ccw = _ref[1];
    _ref1 = this.settings.zoomButtons, this.zoomPlus = _ref1[0], this.zoomMinus = _ref1[1];
    this.currentAngle = this.settings.currentAngle;
    this.scaleMultiplier = this.settings.scaleMultiplier;
    this.mousewheelZoom = this.settings.mousewheelZoom;
    this.mouseDown = false;
    this.startDragOffset = {};
    this.el = this.createCanvas();
    this.image = this.loadImage();
  }

  Canvas.prototype.defaults = {
    width: '300',
    height: '300',
    scaleMultiplier: 1.05,
    currentAngle: 0,
    mousewheelZoom: true
  };

  /*
  Do the actual drawing on the canvas.  Image is drawn with `@translatePos` as the
  image's centerpoint.  The `@scale` is relative to the image's natural size.
  */


  Canvas.prototype.draw = function() {
    var cx;
    cx = this.el.getContext("2d");
    cx.clearRect(0, 0, this.el.width, this.el.height);
    cx.save();
    if (this.settings.debug) {
      console.log('translatePos:', this.translatePos, ', scale:', parseFloat(this.scale.toPrecision(2)), ', angle:', this.currentAngle);
    }
    cx.translate(this.translatePos.x + this.el.width / 2, this.translatePos.y + this.el.height / 2);
    cx.scale(this.scale, this.scale);
    cx.rotate(this.currentAngle * Math.PI / 180);
    cx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    return cx.restore();
  };

  Canvas.prototype.createCanvas = function() {
    var canvas, rotateCCW, rotateCW, zoomIn, zoomOut, zooming,
      _this = this;
    canvas = document.createElement('canvas');
    canvas.id = 'croppy-canvas';
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;
    if (this.cw) {
      rotateCW = function() {
        _this.currentAngle += 90;
        return _this.draw();
      };
    }
    if (this.ccw) {
      rotateCCW = function() {
        _this.currentAngle -= 90;
        return _this.draw();
      };
    }
    if (this.cw) {
      this.cw.addEventListener("click", rotateCW, false);
    }
    if (this.ccw) {
      this.ccw.addEventListener("click", rotateCCW, false);
    }
    if (this.zoomPlus || this.mousewheelZoom) {
      zoomIn = function() {
        _this.scale *= _this.scaleMultiplier;
        return _this.draw();
      };
    }
    if (this.zoomMinus || this.mousewheelZoom) {
      zoomOut = function() {
        _this.scale /= _this.scaleMultiplier;
        return _this.draw();
      };
    }
    if (this.mousewheelZoom) {
      canvas.addEventListener("mousewheel", function(e) {
        if (e.wheelDeltaY > 0) {
          return zoomIn();
        } else {
          return zoomOut();
        }
      }, false);
    }
    if (this.zoomPlus || this.zoomMinus) {
      zooming = function(fn) {
        _this.mouseDown = true;
        return _this.mouseDownIntervalId = setInterval(fn, 50);
      };
    }
    if (this.zoomPlus) {
      this.zoomPlus.addEventListener('mousedown', function(e) {
        if (e.button === 0) {
          return zooming(zoomIn);
        }
      }, false);
      this.zoomPlus.addEventListener('mouseup', function() {
        _this.mouseDown = false;
        return clearInterval(_this.mouseDownIntervalId);
      }, false);
    }
    if (this.zoomMinus) {
      this.zoomMinus.addEventListener('mousedown', function(e) {
        if (e.button === 0) {
          return zooming(zoomOut);
        }
      }, false);
      this.zoomMinus.addEventListener('mouseup', function() {
        _this.mouseDown = false;
        return clearInterval(_this.mouseDownIntervalId);
      }, false);
    }
    canvas.addEventListener("mousedown", function(e) {
      if (e.button === 0) {
        _this.mouseDrag(true);
        _this.startDragOffset.x = e.clientX - _this.translatePos.x;
        return _this.startDragOffset.y = e.clientY - _this.translatePos.y;
      }
    });
    canvas.addEventListener("mouseup", function(e) {
      return _this.mouseDrag(false);
    });
    canvas.addEventListener("mouseover", function(e) {
      return _this.mouseDrag(false);
    });
    canvas.addEventListener("mouseout", function(e) {
      return _this.mouseDrag(false, 'initial');
    });
    canvas.addEventListener("mousemove", function(e) {
      if (_this.mouseDown && e.button === 0) {
        _this.mouseDrag(true);
        _this.translatePos.x = e.clientX - _this.startDragOffset.x;
        _this.translatePos.y = e.clientY - _this.startDragOffset.y;
        return _this.draw();
      }
    });
    return canvas;
  };

  /*
  Sets the `@mouseDown` state and the cursor CSS
  
  @param dragging [Boolean] Whether or not we should be considered currently 'dragging'
  @param cursor   [String]  (optional) Makes a decent CSS choice if there is no argument given.
  */


  Canvas.prototype.mouseDrag = function(dragging, cursor) {
    if (this.mouseDown = dragging) {
      return this.el.style.cursor = cursor || 'move';
    } else {
      return this.el.style.cursor = cursor || 'pointer';
    }
  };

  /*
  Loads an image onto the canvas
  
  @param src [String] The location (href) of the image source
  */


  Canvas.prototype.loadImage = function(src) {
    var context,
      _this = this;
    context = this.el.getContext('2d');
    this.image = new Image();
    this.image.onload = function(e) {
      var img, smallestDimension, xCorrection, yCorrection;
      img = e.srcElement;
      if (_this.settings.debug) {
        console.log('Image width:', img.width, ', height:', img.height);
      }
      xCorrection = 0;
      yCorrection = 0;
      smallestDimension = img.width < img.height ? img.width : img.height;
      _this.scale || (_this.scale = _this.el.width / smallestDimension);
      _this.translatePos = {
        x: 0,
        y: 0
      };
      return _this.draw();
    };
    this.image.src = src || this.settings.src;
    return this.image;
  };

  return Canvas;

})();

module.exports = Canvas;


},{"./util.coffee":3}],2:[function(require,module,exports){
var Canvas, Croppy, Util, createCropOverlay, createCroppyEl, createRotDiv, createRotationButtons, createZoomButtons, createZoomDiv, makeUnselectable;

Util = require('./util.coffee');

Canvas = require('./canvas.coffee');

/*
HTML5 canvas crop zoom library
*/


createCropOverlay = function(settings) {
  var overlay, style;
  overlay = document.createElement('div');
  overlay.id = 'croppy-crop-area';
  style = overlay.style;
  style.width = settings.cropWidth;
  style.height = settings.cropHeight;
  style.border = settings.cropBorder;
  style.top = "" + (parseInt(settings.cropTop) - parseInt(style.borderLeftWidth)) + "px";
  style.left = "" + (parseInt(settings.cropLeft) - parseInt(style.borderTopWidth)) + "px";
  style.position = 'absolute';
  style.pointerEvents = 'none';
  return overlay;
};

makeUnselectable = function(el) {
  var s;
  s = el.style;
  s['-webkit-touch-callout'] = 'none';
  s['-webkit-user-select'] = 'none';
  s['-khtml-user-select'] = 'none';
  s['-moz-user-select'] = 'none';
  s['-ms-user-select'] = 'none';
  return s['user-select'] = 'none';
};

createRotationButtons = function() {
  var ccw, cw;
  cw = document.createElement('span');
  cw.id = 'croppy-rot-cw';
  cw.innerText = '↻';
  cw.style.cursor = 'pointer';
  makeUnselectable(cw);
  ccw = document.createElement('span');
  ccw.id = 'croppy-rot-ccw';
  ccw.innerText = '↺';
  ccw.style.cursor = 'pointer';
  makeUnselectable(ccw);
  return [cw, ccw];
};

createZoomButtons = function() {
  var minus, plus;
  plus = document.createElement('span');
  plus.id = 'croppy-zoom-plus';
  plus.innerText = 'In';
  plus.style.cursor = 'pointer';
  makeUnselectable(plus);
  minus = document.createElement('span');
  minus.id = 'croppy-zoom-minus';
  minus.innerText = 'Out';
  minus.style.cursor = 'pointer';
  makeUnselectable(minus);
  return [plus, minus];
};

createCroppyEl = function(canvas, cropOverlay, settings) {
  var croppyEl;
  croppyEl = document.createElement('div');
  croppyEl.id = 'croppy';
  croppyEl.style.position = 'relative';
  croppyEl.style.width = settings.width;
  croppyEl.style.height = settings.height;
  croppyEl.style.margin = '0 auto';
  croppyEl.appendChild(canvas.el);
  croppyEl.appendChild(cropOverlay);
  return croppyEl;
};

createRotDiv = function(canvas) {
  var rotDiv;
  rotDiv = document.createElement('div');
  rotDiv.id = 'croppy-rot-buttons';
  rotDiv.appendChild(canvas.cw);
  rotDiv.appendChild(canvas.ccw);
  return rotDiv;
};

createZoomDiv = function(canvas) {
  var zoomDiv;
  zoomDiv = document.createElement('div');
  zoomDiv.id = 'croppy-zoom-buttons';
  zoomDiv.appendChild(canvas.zoomPlus);
  zoomDiv.appendChild(canvas.zoomMinus);
  return zoomDiv;
};

Croppy = (function() {
  /*
  @param id      [String] The id of the element to render into.
  @param options [Object] A bunch of options
  */

  function Croppy(id, options) {
    if (options == null) {
      options = {};
    }
    this.settings = Util.merge(options, this.defaults());
    this.container = document.getElementById(id);
    this.canvas = new Canvas(this.settings);
    this.canvas.id = 'croppy-canvas';
    this.cropOverlay = createCropOverlay(this.settings);
    this.render();
  }

  Croppy.prototype.defaults = function() {
    return {
      cropWidth: '150px',
      cropHeight: '150px',
      cropBorder: '2px solid orange',
      cropTop: '75px',
      cropLeft: '75px',
      rot: createRotationButtons(),
      zoomButtons: createZoomButtons()
    };
  };

  Croppy.prototype.render = function() {
    var rotDiv, zoomDiv;
    this.el = createCroppyEl(this.canvas, this.cropOverlay, this.settings);
    makeUnselectable(this.el);
    this.el.appendChild(rotDiv = createRotDiv(this.canvas));
    this.el.appendChild(zoomDiv = createZoomDiv(this.canvas));
    return this.container.appendChild(this.el);
  };

  /*
  @return [Object] A bunch of useful data about the position and size
                   of both image and crop, and image rotation, image
                   scale, and a reference to the source data.
  */


  Croppy.prototype["export"] = function() {
    return {
      rotation: this.canvas.currentAngle,
      scale: this.canvas.scale,
      src: this.settings.src,
      scaled: {
        x: this.canvas.translatePos.x,
        y: this.canvas.translatePos.y,
        width: this.canvas.image.naturalWidth * this.canvas.scale,
        height: this.canvas.image.naturalHeight * this.canvas.scale
      },
      natural: {
        x: this.canvas.translatePos.x / this.canvas.scale,
        y: this.canvas.translatePos.y / this.canvas.scale,
        width: this.canvas.image.naturalWidth,
        height: this.canvas.image.naturalHeight
      },
      crop: {
        x: -this.canvas.translatePos.x,
        y: -this.canvas.translatePos.y,
        width: parseInt(this.cropOverlay.style.width),
        height: parseInt(this.cropOverlay.style.height)
      }
    };
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