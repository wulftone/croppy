Util = require './util.coffee'
Canvas = require './canvas.coffee'

###
HTML5 canvas crop zoom library
###
class Croppy


  ###
  @param id      [String] The id of the element to render into.
  @param options [Object] A bunch of options
  ###
  constructor: (id, options = {}) ->
    @settings            = Util.merge options, @defaults
    @settings.rot        = @createRotationButtons()
    @settings.zoomSlider = @createZoomSlider()
    @container           = document.getElementById id
    @canvas              = new Canvas @settings
    @canvas.id           = 'croppy-canvas'
    @cropOverlay         = @createCropOverlay()
    @render()


  defaults:
    cropWidth :  '150px'
    cropHeight: '150px'
    cropBorder: '2px solid orange'
    cropTop   :    '75px'
    cropLeft  :   '75px'


  createCropOverlay: ->
    overlay = document.createElement 'div'
    overlay.id = 'croppy-crop-area'

    style = overlay.style
    style.width         = @settings.cropWidth
    style.height        = @settings.cropHeight
    style.border        = @settings.cropBorder
    style.top           = @settings.cropTop
    style.left          = @settings.cropLeft
    style.position      = 'absolute'
    style.pointerEvents = 'none'

    overlay


  createRotationButtons: ->
    cw            = document.createElement 'span'
    cw.id         = 'croppy-rot-cw'
    cw.innerText  = '↻'

    ccw           = document.createElement 'span'
    ccw.id        = 'croppy-rot-ccw'
    ccw.innerText = '↺'

    [cw, ccw]


  createZoomSlider: ->
    slider      = document.createElement 'input'
    slider.type = 'range'
    slider.id   = 'croppy-zoom-slider'
    slider


  createCroppyEl: ->
    croppyEl = document.createElement 'div'
    croppyEl.id = 'croppy'
    croppyEl.style.position = 'relative'
    croppyEl.style.width = @settings.width
    croppyEl.style.height = @settings.height
    croppyEl.style.margin = '0 auto'
    croppyEl.appendChild @canvas.el
    croppyEl.appendChild @cropOverlay
    croppyEl


  createRotDiv: ->
    rotDiv = document.createElement 'div'
    rotDiv.id = 'croppy-rot'
    rotDiv


  render: ->
    @el = @createCroppyEl()
    rotDiv = @createRotDiv()
    rotDiv.appendChild @canvas.cw
    rotDiv.appendChild @canvas.ccw
    @el.appendChild rotDiv
    @el.appendChild @canvas.zoomSlider
    @container.appendChild @el

module.exports = Croppy
