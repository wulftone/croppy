Util = require './util.coffee'
Canvas = require './canvas.coffee'

###
HTML5 canvas crop zoom library
###
createCropOverlay = (settings) ->
  overlay = document.createElement 'div'
  overlay.id = 'croppy-crop-area'

  # The following event listener causes `pointer-events` to work like it should.
  # Don't ask me why it works this way.
  overlay.addEventListener 'touchstart', (e) ->
    e.preventDefault()

  style = overlay.style
  style.width         = settings.cropWidth
  style.height        = settings.cropHeight
  style.border        = settings.cropBorder
  style.top           = "#{parseInt(settings.cropTop) - parseInt(style.borderLeftWidth)}px"
  style.left          = "#{parseInt(settings.cropLeft) - parseInt(style.borderTopWidth)}px"
  style.position      = 'absolute'
  style.pointerEvents = 'none'

  overlay


makeUnselectable = (el) ->
  s = el.style
  s['-webkit-touch-callout'] = 'none'
  s['-webkit-user-select']   = 'none'
  s['-khtml-user-select']    = 'none'
  s['-moz-user-select']      = 'none'
  s['-ms-user-select']       = 'none'
  s['user-select']           = 'none'


createRotationButtons = ->
  cw              = document.createElement 'span'
  cw.id           = 'croppy-rot-cw'
  cw.textContent  = '↻'
  cw.style.cursor = 'pointer'
  makeUnselectable cw

  ccw              = document.createElement 'span'
  ccw.id           = 'croppy-rot-ccw'
  ccw.textContent  = '↺'
  ccw.style.cursor = 'pointer'
  makeUnselectable ccw

  [cw, ccw]


createZoomButtons = ->
  plus              = document.createElement 'span'
  plus.id           = 'croppy-zoom-plus'
  plus.textContent  = 'In'
  plus.style.cursor = 'pointer'
  makeUnselectable plus

  minus              = document.createElement 'span'
  minus.id           = 'croppy-zoom-minus'
  minus.textContent  = 'Out'
  minus.style.cursor = 'pointer'
  makeUnselectable minus

  [plus, minus]


createCroppyEl = (canvas, cropOverlay, settings) ->
  croppyEl                = document.createElement 'div'
  croppyEl.id             = 'croppy'
  croppyEl.style.position = 'relative'
  croppyEl.style.width    = settings.width
  croppyEl.style.height   = settings.height
  croppyEl.style.margin   = '0 auto'
  croppyEl.appendChild canvas.el
  croppyEl.appendChild cropOverlay
  makeUnselectable croppyEl
  croppyEl


createRotDiv = (canvas) ->
  rotDiv = document.createElement 'div'
  rotDiv.id = 'croppy-rot-buttons'
  rotDiv.appendChild canvas.cw
  rotDiv.appendChild canvas.ccw
  rotDiv


createZoomDiv = (canvas) ->
  zoomDiv = document.createElement 'div'
  zoomDiv.id = 'croppy-zoom-buttons'
  zoomDiv.appendChild canvas.zoomPlus
  zoomDiv.appendChild canvas.zoomMinus
  zoomDiv


class Croppy


  ###
  @param id      [String] The id of the element to render into.
  @param options [Object] A bunch of options
  ###
  constructor: (id, options = {}) ->
    @settings    = Util.merge options, @defaults()
    @container   = document.getElementById id
    @cropOverlay = createCropOverlay @settings
    @canvas      = new Canvas @settings
    @canvas.id   = 'croppy-canvas'

    @el = createCroppyEl @canvas, @cropOverlay, @settings
    @el.appendChild( rotDiv = createRotDiv(@canvas) )
    @el.appendChild( zoomDiv = createZoomDiv(@canvas) )

    @render()


  defaults: ->
    cropWidth   : '150px'
    cropHeight  : '150px'
    cropBorder  : '2px solid orange'
    cropTop     : '75px'
    cropLeft    : '75px'
    rot         : createRotationButtons()
    zoomButtons : createZoomButtons()


  render: ->
    @container.innerHTML = ''
    @container.appendChild @el


  ###
  A more public shortcut to load an image onto the canvas

  @param src [String] A file path, URL, or base64 image
  ###
  load: (src, autoload = false) ->
    @canvas.loadImage src, autoload


  ###
  Exports all useful data about the crop and image.  All coordinates are
  relative to the center of the canvas, except the crop data, which is
  relative to the center of the image as if its angle of rotation was 0.
  We do this because it works nicely with ImageMagick.

  @return [Object] A bunch of useful data about the position and size
                   of both image and crop, and image rotation, image
                   scale, and a reference to the source data.
  ###
  export: ->
    if @canvas.image
      rotation : @canvas.currentAngle # Degrees
      scale    : @canvas.scale        # i.e. zoom
      src      : @settings.src        # The original image source

      # Image position an dimensions as appears on screen
      scaled:
        x      : @canvas.translatePos.x
        y      : @canvas.translatePos.y
        width  : @canvas.image.naturalWidth  * @canvas.scale
        height : @canvas.image.naturalHeight * @canvas.scale

      # Image position an dimensions as if it were not zoomed
      natural:
        x      : @canvas.translatePos.x / @canvas.scale
        y      : @canvas.translatePos.y / @canvas.scale
        width  : @canvas.image.naturalWidth
        height : @canvas.image.naturalHeight

      # Center of crop is relative to center of image
      crop:
        x      : -@canvas.translatePos.x
        y      : -@canvas.translatePos.y
        width  : parseInt @cropOverlay.style.width
        height : parseInt @cropOverlay.style.height


module.exports = Croppy
