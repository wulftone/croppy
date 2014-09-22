!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Croppy=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    var canvas, drawDuringDrag, endZooming, getPinchDistance, mouseWheelZooming, moveZoomOrDrag, rotateCCW, rotateCW, startDrag, startZoomOrDrag, stopDrag, touchZoom, updatePointer, zoomIn, zoomInHandler, zoomOut, zoomOutHandler, zooming;
    canvas = document.createElement('canvas');
    canvas.id = 'croppy-canvas';
    canvas.height = this.settings.height;
    canvas.width = this.settings.width;

    /*
    Rotation functions
     */
    if (this.cw) {
      rotateCW = (function(_this) {
        return function() {
          _this.currentAngle += 90;
          return _this.draw();
        };
      })(this);
    }
    if (this.ccw) {
      rotateCCW = (function(_this) {
        return function() {
          _this.currentAngle -= 90;
          return _this.draw();
        };
      })(this);
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
      zoomIn = (function(_this) {
        return function() {
          _this.scale *= _this.scaleMultiplier;
          return _this.draw();
        };
      })(this);

      /*
      Attach this to the appropriate event
       */
      zoomInHandler = (function(_this) {
        return function(e) {
          e.preventDefault();
          if (e.button === 0 || e.button === void 0) {
            return zooming(zoomIn);
          }
        };
      })(this);
    }
    if (this.zoomMinus || this.mousewheelZoom) {

      /*
      Does the actual zooming out
       */
      zoomOut = (function(_this) {
        return function() {
          _this.scale /= _this.scaleMultiplier;
          return _this.draw();
        };
      })(this);

      /*
      Attach this to the appropriate event
       */
      zoomOutHandler = (function(_this) {
        return function(e) {
          e.preventDefault();
          if (e.button === 0 || e.button === void 0) {
            return zooming(zoomOut);
          }
        };
      })(this);
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
      canvas.addEventListener("mousewheel", (function(_this) {
        return function(e) {
          e.preventDefault();
          return mouseWheelZooming(e.wheelDelta);
        };
      })(this));
      canvas.addEventListener("wheel", (function(_this) {
        return function(e) {
          e.preventDefault();
          return mouseWheelZooming(e.deltaY);
        };
      })(this));
    }
    if (this.zoomPlus || this.zoomMinus) {

      /*
      Performs the zooming with the given function and sets a debounce timer
      so dragging doesn't happen immediately after zooming, preventing the image
      from suddenly jumping around after a zoom.
      
      @param fn [Function] The zoom operation to perform (zoomIn, zoomOut)
       */
      zooming = (function(_this) {
        return function(fn) {
          _this.mouseDown = true;
          return _this.mouseDownIntervalId = setInterval(fn, 50);
        };
      })(this);

      /*
      Resets the state after zooming is over
       */
      endZooming = (function(_this) {
        return function(e) {
          e.preventDefault();
          _this.mouseDown = false;
          return clearInterval(_this.mouseDownIntervalId);
        };
      })(this);
    }
    if (this.zoomPlus) {
      this.zoomPlus.addEventListener('pointerdown', zoomInHandler);
      this.zoomPlus.addEventListener('pointerup', endZooming);
    }
    if (this.zoomMinus) {
      this.zoomMinus.addEventListener('pointerdown', zoomOutHandler);
      this.zoomMinus.addEventListener('pointerup', endZooming);
    }

    /*
    Dragging
     */

    /*
    Set up the proper state variables to keep track of initial drag position
    
    @param x [Number] The initial pointer state x coordinate
    @param y [Number] The initial pointer state y coordinate
     */
    startDrag = (function(_this) {
      return function(x, y) {
        _this.dragHandler(true);
        _this.startTranslatePos = {
          x: _this.translatePos.x,
          y: _this.translatePos.y
        };
        _this.startDragOffset.x = x - _this.translatePos.x;
        return _this.startDragOffset.y = y - _this.translatePos.y;
      };
    })(this);

    /*
    Used by either a mouse or touch event handler (this is why it's abstracted out).
    Draws the image according to the current state and the given coordinates.
    
    @param x [Number] The latest pointer state x coordinate
    @param y [Number] The latest pointer state y coordinate
     */
    drawDuringDrag = (function(_this) {
      return function(x, y) {
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
    })(this);

    /*
    Stop the event and set the appropriate state
     */
    stopDrag = (function(_this) {
      return function(e) {
        e.preventDefault();
        console.log('stopping drag');
        return _this.dragHandler(false);
      };
    })(this);

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
    touchZoom = (function(_this) {
      return function(x1, y1, x2, y2) {
        var delta, pinchDistance;
        _this.touchZooming = true;
        pinchDistance = getPinchDistance(x1, y1, x2, y2);
        delta = pinchDistance / _this.startPinchDistance;
        _this.scale = _this.startScale * delta;
        return _this.draw();
      };
    })(this);

    /*
    Keep the state `@pointers` up to date with the current values
     */
    updatePointer = (function(_this) {
      return function(pointer) {
        return _this.pointers.map(function(p) {
          if (p.pointerId === pointer.pointerId) {
            return pointer;
          } else {
            return p;
          }
        });
      };
    })(this);

    /*
    Setup the state for beginning either a drag or a zoom
     */
    startZoomOrDrag = (function(_this) {
      return function(e) {
        e.preventDefault();
        _this.pointers || (_this.pointers = []);
        _this.pointers.push(e);
        if (_this.pointers.length === 2) {
          if (_this.settings.debug) {
            console.log('touchstart 2');
          }
          _this.touchZooming = true;
          _this.touchDragStarted = false;
          _this.startScale = parseFloat(_this.scale);
          return _this.startPinchDistance = getPinchDistance(_this.pointers[0].clientX, _this.pointers[0].clientY, _this.pointers[1].clientX, _this.pointers[1].clientY);
        } else {
          if (_this.settings.debug) {
            console.log('touchstart 1');
          }
          _this.touchZooming = false;
          _this.touchDragStarted = true;
          return startDrag(_this.pointers[0].clientX, _this.pointers[0].clientY);
        }
      };
    })(this);

    /*
    When the pointer moves, choose whether we're doing a drag or zoom operation
     */
    moveZoomOrDrag = (function(_this) {
      return function(e) {
        e.preventDefault();
        if (!(_this.pointers && _this.pointers.length > 0)) {
          return;
        }
        _this.pointers = updatePointer(e);
        if (_this.pointers.length === 2) {
          return touchZoom(_this.pointers[0].clientX, _this.pointers[0].clientY, _this.pointers[1].clientX, _this.pointers[1].clientY);
        } else {
          return drawDuringDrag(_this.pointers[0].clientX, _this.pointers[0].clientY);
        }
      };
    })(this);

    /*
    Canvas drag and zoom events
     */
    canvas.addEventListener("pointerdown", startZoomOrDrag);
    canvas.addEventListener("pointermove", moveZoomOrDrag);
    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);
    canvas.addEventListener("pointerleave", stopDrag);
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
      return this.touchZoomTimeout = setTimeout((function(_this) {
        return function() {
          if (_this.settings.debug) {
            console.log('touchzoom timed out!');
          }
          return _this.touchZooming = false;
        };
      })(this), 500);
    }
  };


  /*
  Loads an image onto the canvas
  
  @param src [String] The location (href) of the image source
   */

  Canvas.prototype.loadImage = function(src) {
    var context;
    context = this.el.getContext('2d');
    this.image = new Image();
    this.image.onload = (function(_this) {
      return function(e) {
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
    })(this);
    this.image.src = src || this.settings.src;
    return this.image;
  };

  return Canvas;

})();

module.exports = Canvas;



},{"./util.coffee":4}],2:[function(require,module,exports){
var Canvas, Croppy, Hand, Util, createCropOverlay, createCroppyEl, createRotDiv, createRotationButtons, createZoomButtons, createZoomDiv, makeUnselectable;

Hand = require('./hand-1.2.2.js');

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
    this.cropOverlay = createCropOverlay(this.settings);
    this.canvas = new Canvas(this.settings);
    this.canvas.id = 'croppy-canvas';
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



},{"./canvas.coffee":1,"./hand-1.2.2.js":3,"./util.coffee":4}],3:[function(require,module,exports){
var HANDJS = HANDJS || {};

(function () {
    // Polyfilling indexOf for old browsers
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    // Installing Hand.js
    var supportedEventsNames = ["pointerdown", "pointerup", "pointermove", "pointerover", "pointerout", "pointercancel", "pointerenter", "pointerleave"];
    var upperCaseEventsNames = ["PointerDown", "PointerUp", "PointerMove", "PointerOver", "PointerOut", "PointerCancel", "PointerEnter", "PointerLeave"];

    var POINTER_TYPE_TOUCH = "touch";
    var POINTER_TYPE_PEN = "pen";
    var POINTER_TYPE_MOUSE = "mouse";

    var previousTargets = {};

    var _checkPreventDefault = function (object) {
        while (object && !object.handjs_forcePreventDefault) {
            object = object.parentNode;
        }
        return !!object;
    };

    var checkPreventDefault = function(node) {
        return _checkPreventDefault(node) || _checkPreventDefault(window);
    };

    // Touch events
    var generateTouchClonedEvent = function (sourceEvent, newName, canBubble) {
        // Considering touch events are almost like super mouse events
        var evObj;

        if (document.createEvent) {
            evObj = document.createEvent('MouseEvents');
            evObj.initMouseEvent(newName, canBubble, true, window, 1, sourceEvent.screenX, sourceEvent.screenY,
                sourceEvent.clientX, sourceEvent.clientY, sourceEvent.ctrlKey, sourceEvent.altKey,
                sourceEvent.shiftKey, sourceEvent.metaKey, sourceEvent.button, null);
        }
        else {
            evObj = document.createEventObject();
            evObj.screenX = sourceEvent.screenX;
            evObj.screenY = sourceEvent.screenY;
            evObj.clientX = sourceEvent.clientX;
            evObj.clientY = sourceEvent.clientY;
            evObj.ctrlKey = sourceEvent.ctrlKey;
            evObj.altKey = sourceEvent.altKey;
            evObj.shiftKey = sourceEvent.shiftKey;
            evObj.metaKey = sourceEvent.metaKey;
            evObj.button = sourceEvent.button;
        }
        // offsets
        if (evObj.offsetX === undefined) {
            if (sourceEvent.offsetX !== undefined) {

                // For Opera which creates readonly properties
                if (Object && Object.defineProperty !== undefined) {
                    Object.defineProperty(evObj, "offsetX", {
                        writable: true
                    });
                    Object.defineProperty(evObj, "offsetY", {
                        writable: true
                    });
                }

                evObj.offsetX = sourceEvent.offsetX;
                evObj.offsetY = sourceEvent.offsetY;
            }
            else if (sourceEvent.layerX !== undefined) {
                evObj.offsetX = sourceEvent.layerX - sourceEvent.currentTarget.offsetLeft;
                evObj.offsetY = sourceEvent.layerY - sourceEvent.currentTarget.offsetTop;
            }
        }

        // adding missing properties

        if (sourceEvent.isPrimary !== undefined)
            evObj.isPrimary = sourceEvent.isPrimary;
        else
            evObj.isPrimary = true;

        if (sourceEvent.pressure)
            evObj.pressure = sourceEvent.pressure;
        else {
            var button = 0;

            if (sourceEvent.which !== undefined)
                button = sourceEvent.which;
            else if (sourceEvent.button !== undefined) {
                button = sourceEvent.button;
            }
            evObj.pressure = (button == 0) ? 0 : 0.5;
        }


        if (sourceEvent.rotation)
            evObj.rotation = sourceEvent.rotation;
        else
            evObj.rotation = 0;

        // Timestamp
        if (sourceEvent.hwTimestamp)
            evObj.hwTimestamp = sourceEvent.hwTimestamp;
        else
            evObj.hwTimestamp = 0;

        // Tilts
        if (sourceEvent.tiltX)
            evObj.tiltX = sourceEvent.tiltX;
        else
            evObj.tiltX = 0;

        if (sourceEvent.tiltY)
            evObj.tiltY = sourceEvent.tiltY;
        else
            evObj.tiltY = 0;

        // Width and Height
        if (sourceEvent.height)
            evObj.height = sourceEvent.height;
        else
            evObj.height = 0;

        if (sourceEvent.width)
            evObj.width = sourceEvent.width;
        else
            evObj.width = 0;

        // preventDefault
        evObj.preventDefault = function () {
            if (sourceEvent.preventDefault !== undefined)
                sourceEvent.preventDefault();
        };

        // stopPropagation
        if (evObj.stopPropagation !== undefined) {
            var current = evObj.stopPropagation;
            evObj.stopPropagation = function () {
                if (sourceEvent.stopPropagation !== undefined)
                    sourceEvent.stopPropagation();
                current.call(this);
            };
        }

        // Constants
        evObj.POINTER_TYPE_TOUCH = POINTER_TYPE_TOUCH;
        evObj.POINTER_TYPE_PEN = POINTER_TYPE_PEN;
        evObj.POINTER_TYPE_MOUSE = POINTER_TYPE_MOUSE;

        // Pointer values
        evObj.pointerId = sourceEvent.pointerId;
        evObj.pointerType = sourceEvent.pointerType;

        switch (evObj.pointerType) {// Old spec version check
            case 2:
                evObj.pointerType = evObj.POINTER_TYPE_TOUCH;
                break;
            case 3:
                evObj.pointerType = evObj.POINTER_TYPE_PEN;
                break;
            case 4:
                evObj.pointerType = evObj.POINTER_TYPE_MOUSE;
                break;
        }

        // If force preventDefault
        if (sourceEvent.currentTarget && checkPreventDefault(sourceEvent.currentTarget) === true) {
            evObj.preventDefault();
        }

        // Fire event
        if (sourceEvent.target) {
            sourceEvent.target.dispatchEvent(evObj);
        } else {
            sourceEvent.srcElement.fireEvent("on" + getMouseEquivalentEventName(newName), evObj); // We must fallback to mouse event for very old browsers
        }
    };

    var generateMouseProxy = function (evt, eventName) {
        evt.pointerId = 1;
        evt.pointerType = POINTER_TYPE_MOUSE;
        generateTouchClonedEvent(evt, eventName, false);
    };

    var generateTouchEventProxy = function (name, touchPoint, target, eventObject) {
        var touchPointId = touchPoint.identifier + 2; // Just to not override mouse id

        touchPoint.pointerId = touchPointId;
        touchPoint.pointerType = POINTER_TYPE_TOUCH;
        touchPoint.currentTarget = target;
        touchPoint.target = target;

        if (eventObject.preventDefault !== undefined) {
            touchPoint.preventDefault = function () {
                eventObject.preventDefault();
            };
        }

        generateTouchClonedEvent(touchPoint, name, true);
    };

    var _checkRegisteredEvents = function (object, eventName) {
        while (object && !(object.__handjsGlobalRegisteredEvents && object.__handjsGlobalRegisteredEvents[eventName])) {
            object = object.parentNode;
        }
        return !!object;
    };

    var checkRegisteredEvents = function (node, eventName) {
        return _checkRegisteredEvents(node, eventName) || _checkRegisteredEvents(window, eventName);
    };

    var generateTouchEventProxyIfRegistered = function (eventName, touchPoint, target, eventObject) { // Check if user registered this event
        if (checkRegisteredEvents(target, eventName)) {
            generateTouchEventProxy(eventName, touchPoint, target, eventObject);
        }
    };

    var handleOtherEvent = function (eventObject, name, useLocalTarget, checkRegistration) {
        if (eventObject.preventManipulation)
            eventObject.preventManipulation();

        for (var i = 0; i < eventObject.changedTouches.length; ++i) {
            var touchPoint = eventObject.changedTouches[i];

            if (useLocalTarget) {
                previousTargets[touchPoint.identifier] = touchPoint.target;
            }

            if (checkRegistration) {
                generateTouchEventProxyIfRegistered(name, touchPoint, previousTargets[touchPoint.identifier], eventObject);
            } else {
                generateTouchEventProxy(name, touchPoint, previousTargets[touchPoint.identifier], eventObject);
            }
        }
    };

    var getMouseEquivalentEventName = function (eventName) {
        return eventName.toLowerCase().replace("pointer", "mouse");
    };

    var getPrefixEventName = function (item, prefix, eventName) {
        var upperCaseIndex = supportedEventsNames.indexOf(eventName);
        var newEventName = prefix + upperCaseEventsNames[upperCaseIndex];

        // Fallback to PointerOver if PointerEnter is not currently supported
        if (newEventName === prefix + "PointerEnter" && item["on" + prefix.toLowerCase() + "pointerenter"] === undefined) {
            newEventName = prefix + "PointerOver";
        }

        // Fallback to PointerOut if PointerLeave is not currently supported
        if (newEventName === prefix + "PointerLeave" && item["on" + prefix.toLowerCase() + "pointerleave"] === undefined) {
            newEventName = prefix + "PointerOut";
        }

        return newEventName;
    };

    var registerOrUnregisterEvent = function (item, name, func, enable) {
        if (item.__handjsRegisteredEvents === undefined) {
            item.__handjsRegisteredEvents = [];
        }

        if (enable) {
            if (item.__handjsRegisteredEvents[name] !== undefined) {
                item.__handjsRegisteredEvents[name]++;
                return;
            }

            item.__handjsRegisteredEvents[name] = 1;
            item.addEventListener(name, func, false);
        } else {

            if (item.__handjsRegisteredEvents.indexOf(name) !== -1) {
                item.__handjsRegisteredEvents[name]--;

                if (item.__handjsRegisteredEvents[name] != 0) {
                    return;
                }
            }
            item.removeEventListener(name, func);
            item.__handjsRegisteredEvents[name] = 0;
        }
    };

    var setTouchAware = function (item, eventName, enable) {
        // If item is already touch aware, do nothing
        if (item.onpointerdown !== undefined) {
            return;
        }

        // IE 10
        if (item.onmspointerdown !== undefined) {
            var msEventName = getPrefixEventName(item, "MS", eventName);

            registerOrUnregisterEvent(item, msEventName, function (evt) { generateTouchClonedEvent(evt, eventName, true); }, enable);

            // We can return because MSPointerXXX integrate mouse support
            return;
        }

        // Chrome, Firefox
        if (item.ontouchstart !== undefined) {
            switch (eventName) {
                case "pointermove":
                    registerOrUnregisterEvent(item, "touchmove", function (evt) { handleOtherEvent(evt, eventName); }, enable);
                    break;
                case "pointercancel":
                    registerOrUnregisterEvent(item, "touchcancel", function (evt) { handleOtherEvent(evt, eventName); }, enable);
                    break;
                case "pointerdown":
                case "pointerup":
                case "pointerout":
                case "pointerover":
                case "pointerleave":
                case "pointerenter":
                    // These events will be handled by the window.ontouchmove function
                    if (!item.__handjsGlobalRegisteredEvents) {
                        item.__handjsGlobalRegisteredEvents = [];
                    }

                    if (enable) {
                        if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                            item.__handjsGlobalRegisteredEvents[eventName]++;
                            return;
                        }
                        item.__handjsGlobalRegisteredEvents[eventName] = 1;
                    } else {
                        if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                            item.__handjsGlobalRegisteredEvents[eventName]--;
                            if (item.__handjsGlobalRegisteredEvents[eventName] < 0) {
                                item.__handjsGlobalRegisteredEvents[eventName] = 0;
                            }
                        }
                    }
                    break;
            }
        }

        // Fallback to mouse
        switch (eventName) {
            case "pointerdown":
                registerOrUnregisterEvent(item, "mousedown", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                break;
            case "pointermove":
                registerOrUnregisterEvent(item, "mousemove", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                break;
            case "pointerup":
                registerOrUnregisterEvent(item, "mouseup", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                break;
            case "pointerover":
                registerOrUnregisterEvent(item, "mouseover", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                break;
            case "pointerout":
                registerOrUnregisterEvent(item, "mouseout", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                break;
            case "pointerenter":
                if (item.onmouseenter === undefined) { // Fallback to mouseover
                    registerOrUnregisterEvent(item, "mouseover", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                } else {
                    registerOrUnregisterEvent(item, "mouseenter", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                }
                break;
            case "pointerleave":
                if (item.onmouseleave === undefined) { // Fallback to mouseout
                    registerOrUnregisterEvent(item, "mouseout", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                } else {
                    registerOrUnregisterEvent(item, "mouseleave", function (evt) { generateMouseProxy(evt, eventName); }, enable);
                }
                break;
        }
    };

    // Intercept addEventListener calls by changing the prototype
    var interceptAddEventListener = function (root) {
        var current = root.prototype ? root.prototype.addEventListener : root.addEventListener;

        var customAddEventListener = function (name, func, capture) {
            // Branch when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, true);
            }

            if (current === undefined) {
                this.attachEvent("on" + getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };

        if (root.prototype) {
            root.prototype.addEventListener = customAddEventListener;
        } else {
            root.addEventListener = customAddEventListener;
        }
    };

    // Intercept removeEventListener calls by changing the prototype
    var interceptRemoveEventListener = function (root) {
        var current = root.prototype ? root.prototype.removeEventListener : root.removeEventListener;

        var customRemoveEventListener = function (name, func, capture) {
            // Release when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, false);
            }

            if (current === undefined) {
                this.detachEvent(getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };
        if (root.prototype) {
            root.prototype.removeEventListener = customRemoveEventListener;
        } else {
            root.removeEventListener = customRemoveEventListener;
        }
    };

    // Hooks
    interceptAddEventListener(window);
    interceptAddEventListener(HTMLElement);
    interceptAddEventListener(document);
    interceptAddEventListener(HTMLBodyElement);
    interceptAddEventListener(HTMLDivElement);
    interceptAddEventListener(HTMLImageElement);
    interceptAddEventListener(HTMLUListElement);
    interceptAddEventListener(HTMLAnchorElement);
    interceptAddEventListener(HTMLLIElement);
    interceptAddEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptAddEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptAddEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptAddEventListener(SVGElement);
    }

    interceptRemoveEventListener(window);
    interceptRemoveEventListener(HTMLElement);
    interceptRemoveEventListener(document);
    interceptRemoveEventListener(HTMLBodyElement);
    interceptRemoveEventListener(HTMLDivElement);
    interceptRemoveEventListener(HTMLImageElement);
    interceptRemoveEventListener(HTMLUListElement);
    interceptRemoveEventListener(HTMLAnchorElement);
    interceptRemoveEventListener(HTMLLIElement);
    interceptRemoveEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptRemoveEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptRemoveEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptRemoveEventListener(SVGElement);
    }

    // Handling move on window to detect pointerleave/out/over
    if (window.ontouchstart !== undefined) {
        window.addEventListener('touchstart', function (eventObject) {
            for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                var touchPoint = eventObject.changedTouches[i];
                previousTargets[touchPoint.identifier] = touchPoint.target;

                generateTouchEventProxyIfRegistered("pointerenter", touchPoint, touchPoint.target, eventObject);
                generateTouchEventProxyIfRegistered("pointerover", touchPoint, touchPoint.target, eventObject);
                generateTouchEventProxyIfRegistered("pointerdown", touchPoint, touchPoint.target, eventObject);
            }
        });

        window.addEventListener('touchend', function (eventObject) {
            for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                var touchPoint = eventObject.changedTouches[i];
                var currentTarget = previousTargets[touchPoint.identifier];

                generateTouchEventProxyIfRegistered("pointerup", touchPoint, currentTarget, eventObject);
                generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject);
                generateTouchEventProxyIfRegistered("pointerleave", touchPoint, currentTarget, eventObject);
            }
        });

        window.addEventListener('touchmove', function (eventObject) {
            for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                var touchPoint = eventObject.changedTouches[i];
                var newTarget = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
                var currentTarget = previousTargets[touchPoint.identifier];

                if (currentTarget === newTarget) {
                    continue; // We can skip this as the pointer is effectively over the current target
                }

                if (currentTarget) {
                    // Raise out
                    generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject);

                    // Raise leave
                    if (!currentTarget.contains(newTarget)) { // Leave must be called if the new target is not a child of the current
                        generateTouchEventProxyIfRegistered("pointerleave", touchPoint, currentTarget, eventObject);
                    }
                }

                if (newTarget) {
                    // Raise over
                    generateTouchEventProxyIfRegistered("pointerover", touchPoint, newTarget, eventObject);

                    // Raise enter
                    if (!newTarget.contains(currentTarget)) { // Leave must be called if the new target is not the parent of the current
                        generateTouchEventProxyIfRegistered("pointerenter", touchPoint, newTarget, eventObject);
                    }
                }
                previousTargets[touchPoint.identifier] = newTarget;
            }
        });
    }

    // Extension to navigator
    if (navigator.pointerEnabled === undefined) {

        // Indicates if the browser will fire pointer events for pointing input
        navigator.pointerEnabled = true;

        // IE
        if (navigator.msPointerEnabled) {
            navigator.maxTouchPoints = navigator.msMaxTouchPoints;
        }
    }

    // Handling touch-action css rule
    if (document.styleSheets && document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function () {

            if (HANDJS.doNotProcessCSS) {
                return;
            }

            var trim = function (string) {
                return string.replace(/^\s+|\s+$/, '');
            };

            var processStylesheet = function (unfilteredSheet) {
                var globalRegex = new RegExp(".+?{.*?}", "m");
                var selectorRegex = new RegExp(".+?{", "m");

                while (unfilteredSheet != "") {
                    var filter = globalRegex.exec(unfilteredSheet);
                    if (!filter) {
                        break;
                    }
                    var block = filter[0];
                    unfilteredSheet = trim(unfilteredSheet.replace(block, ""));
                    var selectorText = trim(selectorRegex.exec(block)[0].replace("{", ""));

                    // Checking if the user wanted to deactivate the default behavior
                    if (block.replace(/\s/g, "").indexOf("touch-action:none") != -1) {
                        var elements = document.querySelectorAll(selectorText);

                        for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                            var element = elements[elementIndex];

                            if (element.style.msTouchAction !== undefined) {
                                element.style.msTouchAction = "none";
                            }
                            else {
                                element.handjs_forcePreventDefault = true;
                            }
                        }
                    }
                }
            }; // Looking for touch-action in referenced stylesheets
            try {
                for (var index = 0; index < document.styleSheets.length; index++) {
                    var sheet = document.styleSheets[index];

                    if (sheet.href == undefined) { // it is an inline style
                        continue;
                    }

                    // Loading the original stylesheet
                    var xhr = new XMLHttpRequest();
                    xhr.open("get", sheet.href, false);
                    xhr.send();

                    var unfilteredSheet = xhr.responseText.replace(/(\n|\r)/g, "");

                    processStylesheet(unfilteredSheet);
                }
            } catch (e) {
                // Silently fail...
            }

            // Looking for touch-action in inline styles
            var styles = document.getElementsByTagName("style");
            for (var index = 0; index < styles.length; index++) {
                var inlineSheet = styles[index];

                var inlineUnfilteredSheet = trim(inlineSheet.innerHTML.replace(/(\n|\r)/g, ""));

                processStylesheet(inlineUnfilteredSheet);
            }
        }, false);
    }

})();

module.exports = HANDJS

},{}],4:[function(require,module,exports){
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



},{}]},{},[2])(2)
});