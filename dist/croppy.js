!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Croppy=e():"undefined"!=typeof global?global.Croppy=e():"undefined"!=typeof self&&(self.Croppy=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Canvas, Util;

Util = require('./util.coffee');

/*
The canvas where the editing all happens
*/


Canvas = (function() {
  function Canvas(options) {
    var _ref, _ref1;
    this.settings = Util.merge(options, this.defaults);
    _ref = this.settings.rot, this.cw = _ref[0], this.ccw = _ref[1];
    _ref1 = this.settings.zoomButtons, this.zoomPlus = _ref1[0], this.zoomMinus = _ref1[1];
    this.currentAngle = this.settings.currentAngle;
    this.scale = this.settings.scale;
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

  /*
  Creates a canvas element and attaches a whole mess of event handlers
  
  @return [DOMElement] The canvas element
  */


  Canvas.prototype.createCanvas = function() {
    var canvas, drawDuringDrag, endZooming, getPinchDistance, mouseWheelZooming, moveZoomOrDrag, rotateCCW, rotateCW, startDrag, startZoomOrDrag, stopDrag, touchZoom, zoomIn, zoomInHandler, zoomOut, zoomOutHandler, zooming,
      _this = this;
    canvas = document.createElement('canvas');
    canvas.id = 'croppy-canvas';
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;
    /*
    Rotation functions
    */

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
      this.cw.addEventListener("click", rotateCW);
    }
    if (this.ccw) {
      this.ccw.addEventListener("click", rotateCCW);
    }
    /*
    Zoom functions
    */

    if (this.zoomPlus || this.mousewheelZoom) {
      /*
      Does the actual zooming in
      */

      zoomIn = function() {
        _this.scale *= _this.scaleMultiplier;
        return _this.draw();
      };
      /*
      Attach this to the appropriate event
      */

      zoomInHandler = function(e) {
        e.preventDefault();
        if (e.button === 0 || e.button === void 0) {
          return zooming(zoomIn);
        }
      };
    }
    if (this.zoomMinus || this.mousewheelZoom) {
      /*
      Does the actual zooming out
      */

      zoomOut = function() {
        _this.scale /= _this.scaleMultiplier;
        return _this.draw();
      };
      /*
      Attach this to the appropriate event
      */

      zoomOutHandler = function(e) {
        e.preventDefault();
        if (e.button === 0 || e.button === void 0) {
          return zooming(zoomOut);
        }
      };
    }
    if (this.mousewheelZoom) {
      /*
      Determines whether or not to zoom in or out
      
      @param delta [Number] The mousewheel delta
      */

      mouseWheelZooming = function(delta) {
        if (delta > 0) {
          return zoomIn();
        } else {
          return zoomOut();
        }
      };
      canvas.addEventListener("mousewheel", function(e) {
        e.preventDefault();
        return mouseWheelZooming(e.wheelDelta);
      });
      canvas.addEventListener("wheel", function(e) {
        e.preventDefault();
        return mouseWheelZooming(e.deltaY);
      });
    }
    if (this.zoomPlus || this.zoomMinus) {
      /*
      Performs the zooming with the given function and sets a debounce timer
      so dragging doesn't happen immediately after zooming, preventing the image
      from suddenly jumping around after a zoom.
      
      @param fn [Function] The zoom operation to perform (zoomIn, zoomOut)
      */

      zooming = function(fn) {
        _this.mouseDown = true;
        return _this.mouseDownIntervalId = setInterval(fn, 50);
      };
      /*
      Resets the state after zooming is over
      */

      endZooming = function(e) {
        e.preventDefault();
        _this.mouseDown = false;
        return clearInterval(_this.mouseDownIntervalId);
      };
    }
    if (this.zoomPlus) {
      this.zoomPlus.addEventListener('mousedown', zoomInHandler);
      this.zoomPlus.addEventListener('touchstart', zoomInHandler);
      this.zoomPlus.addEventListener('mouseup', endZooming);
      this.zoomPlus.addEventListener('touchend', endZooming);
    }
    if (this.zoomMinus) {
      this.zoomMinus.addEventListener('mousedown', zoomOutHandler);
      this.zoomMinus.addEventListener('touchstart', zoomOutHandler);
      this.zoomMinus.addEventListener('mouseup', endZooming);
      this.zoomMinus.addEventListener('touchend', endZooming);
    }
    /*
    Dragging
    */

    /*
    Set up the proper state variables to keep track of initial drag position
    
    @param x [Number] The initial pointer state x coordinate
    @param y [Number] The initial pointer state y coordinate
    */

    startDrag = function(x, y) {
      _this.dragHandler(true);
      _this.startTranslatePos = {
        x: _this.translatePos.x,
        y: _this.translatePos.y
      };
      _this.startDragOffset.x = x - _this.translatePos.x;
      return _this.startDragOffset.y = y - _this.translatePos.y;
    };
    /*
    Used by either a mouse or touch event handler (this is why it's abstracted out).
    Draws the image according to the current state and the given coordinates.
    
    @param x [Number] The latest pointer state x coordinate
    @param y [Number] The latest pointer state y coordinate
    */

    drawDuringDrag = function(x, y) {
      var threshold;
      if (!_this.touchZooming) {
        _this.dragHandler(true);
        _this.translatePos.x = x - _this.startDragOffset.x;
        _this.translatePos.y = y - _this.startDragOffset.y;
        if (_this.touchDragStarted) {
          threshold = 10;
          if (!_this.touchDragThresholdReached) {
            _this.touchDragThresholdReached = Math.abs(_this.startTranslatePos.x - _this.translatePos.x) > threshold || Math.abs(_this.startTranslatePos.y - _this.translatePos.y) > threshold;
          }
          if (_this.touchDragThresholdReached) {
            return _this.draw();
          }
        } else {
          return _this.draw();
        }
      }
    };
    /*
    Stop the event and set the appropriate state
    */

    stopDrag = function(e) {
      e.preventDefault();
      console.log('stopping drag');
      return _this.dragHandler(false);
    };
    /*
    Assign mouse dragging events
    */

    canvas.addEventListener("mousedown", function(e) {
      e.preventDefault();
      if (e.button === 0) {
        return startDrag(e.clientX, e.clientY);
      }
    });
    canvas.addEventListener("mousemove", function(e) {
      e.preventDefault();
      if (_this.mouseDown && e.button === 0) {
        return drawDuringDrag(e.clientX, e.clientY);
      }
    });
    canvas.addEventListener("mouseout", function(e) {
      e.preventDefault();
      return _this.dragHandler(false, 'initial');
    });
    canvas.addEventListener("mouseup", stopDrag);
    canvas.addEventListener("mouseover", stopDrag);
    /*
    Standard pythagorean theorem
    
    @param x1 [Number] The x coordinate of a pair of coordinates
    @param y1 [Number] The y coordinate of a pair of coordinates
    @param x2 [Number] The x coordinate of a pair of coordinates
    @param y2 [Number] The y coordinate of a pair of coordinates
    
    @return [Number] The distance between the two coordinates
    */

    getPinchDistance = function(x1, y1, x2, y2) {
      return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    };
    /*
    Performs the scaling involved in a "pinch" touch zoom operation
    
    @param x1 [Number] The x coordinate of a pair of coordinates
    @param y1 [Number] The y coordinate of a pair of coordinates
    @param x2 [Number] The x coordinate of a pair of coordinates
    @param y2 [Number] The y coordinate of a pair of coordinates
    */

    touchZoom = function(x1, y1, x2, y2) {
      var delta, pinchDistance;
      _this.touchZooming = true;
      pinchDistance = getPinchDistance(x1, y1, x2, y2);
      delta = pinchDistance / _this.startPinchDistance;
      _this.scale = _this.startScale * delta;
      return _this.draw();
    };
    /*
    Setup the state for beginning either a drag or a zoom
    */

    startZoomOrDrag = function(e) {
      var t;
      e.preventDefault();
      t = e.touches;
      if (t.length === 2) {
        if (_this.settings.debug) {
          console.log('touchstart 2');
        }
        _this.touchZooming = true;
        _this.touchDragStarted = false;
        _this.startScale = parseFloat(_this.scale);
        return _this.startPinchDistance = getPinchDistance(t[0].clientX, t[0].clientY, t[1].clientX, t[1].clientY);
      } else {
        if (_this.settings.debug) {
          console.log('touchstart 1');
        }
        _this.touchZooming = false;
        _this.touchDragStarted = true;
        return startDrag(t[0].clientX, t[0].clientY);
      }
    };
    /*
    When the pointer moves, choose whether we're doing a drag or zoom operation
    */

    moveZoomOrDrag = function(e) {
      var t;
      e.preventDefault();
      t = e.touches;
      if (t.length === 2) {
        return touchZoom(t[0].clientX, t[0].clientY, t[1].clientX, t[1].clientY);
      } else {
        return drawDuringDrag(t[0].clientX, t[0].clientY);
      }
    };
    /*
    Canvas drag and zoom events
    */

    canvas.addEventListener("touchstart", startZoomOrDrag);
    canvas.addEventListener("touchmove", moveZoomOrDrag);
    canvas.addEventListener("touchend", stopDrag);
    canvas.addEventListener("touchcancel", stopDrag);
    canvas.addEventListener("touchleave", stopDrag);
    return canvas;
  };

  /*
  Sets and unsets the various states involved in dragging/zooming
  
  TODO: Probably refactor this.. it's getting messy.
  
  @param dragging [Boolean] Whether or not we should be considered currently 'dragging'
  @param cursor   [String]  (optional) Makes a decent CSS choice if there is no argument given.
  */


  Canvas.prototype.dragHandler = function(dragging, cursor) {
    if (this.mouseDown = dragging) {
      return this.el.style.cursor = cursor || 'move';
    } else {
      this.el.style.cursor = cursor || 'pointer';
      return this.clearTouchState();
    }
  };

  /*
  Clears/resets touch-related state variables
  */


  Canvas.prototype.clearTouchState = function() {
    var _this = this;
    if (this.settings.debug) {
      console.log('clearing touch state');
    }
    this.pointers = [];
    this.touchDragStarted = false;
    this.touchDragThresholdReached = false;
    if (this.touchZooming) {
      if (this.touchZoomTimeout) {
        clearTimeout(this.touchZoomTimeout);
      }
      return this.touchZoomTimeout = setTimeout(function() {
        if (_this.settings.debug) {
          console.log('touchzoom timed out!');
        }
        return _this.touchZooming = false;
      }, 500);
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
      img = e.target;
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
  overlay.addEventListener('touchstart', function(e) {
    return e.preventDefault();
  });
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
  cw.textContent = '↻';
  cw.style.cursor = 'pointer';
  makeUnselectable(cw);
  ccw = document.createElement('span');
  ccw.id = 'croppy-rot-ccw';
  ccw.textContent = '↺';
  ccw.style.cursor = 'pointer';
  makeUnselectable(ccw);
  return [cw, ccw];
};

createZoomButtons = function() {
  var minus, plus;
  plus = document.createElement('span');
  plus.id = 'croppy-zoom-plus';
  plus.textContent = 'In';
  plus.style.cursor = 'pointer';
  makeUnselectable(plus);
  minus = document.createElement('span');
  minus.id = 'croppy-zoom-minus';
  minus.textContent = 'Out';
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
  makeUnselectable(croppyEl);
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
    var rotDiv, zoomDiv;
    if (options == null) {
      options = {};
    }
    this.settings = Util.merge(options, this.defaults());
    this.container = document.getElementById(id);
    this.cropOverlay = createCropOverlay(this.settings);
    this.canvas = new Canvas(this.settings);
    this.canvas.id = 'croppy-canvas';
    this.el = createCroppyEl(this.canvas, this.cropOverlay, this.settings);
    this.el.appendChild(rotDiv = createRotDiv(this.canvas));
    this.el.appendChild(zoomDiv = createZoomDiv(this.canvas));
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
    this.container.innerHTML = '';
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