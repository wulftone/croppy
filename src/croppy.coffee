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
    @settings = Util.merge options, @defaults

    @container = document.getElementById id
    @canvas = new Canvas(options)
    @canvas.id = 'croppy-canvas'
    @cropOverlay = @createCropOverlay()
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


  render: ->
    @container.appendChild @canvas.el
    @container.appendChild @cropOverlay


module.exports = Croppy
