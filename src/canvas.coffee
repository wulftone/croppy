Util = require './util.coffee'

###
TODO: give @translatePos a reasonable starting point
###
class Canvas


  constructor: (options) ->
    @settings               = Util.merge options, @defaults
    [@cw, @ccw]             = @settings.rot
    [@zoomPlus, @zoomMinus] = @settings.zoomButtons
    @currentAngle           = @settings.currentAngle
    @scaleMultiplier        = @settings.scaleMultiplier
    @mousewheelZoom         = @settings.mousewheelZoom
    @mouseDown              = false
    @startDragOffset        = {}

    # Do these last
    @el    = @createCanvas()
    @image = @loadImage()


  defaults:
    width           : '300'
    height          : '300'
    scaleMultiplier : 1.05
    currentAngle    : 0
    mousewheelZoom  : true

  ###
  Do the actual drawing on the canvas.  Image is drawn with `@translatePos` as the
  image's centerpoint.  The `@scale` is relative to the image's natural size.
  ###
  draw: ->
    cx = @el.getContext("2d")

    # clear canvas
    cx.clearRect(0, 0, @el.width, @el.height)

    cx.save()

    console.log 'translatePos:', @translatePos, ', scale:', parseFloat(@scale.toPrecision 2), ', angle:', @currentAngle if @settings.debug

    cx.translate @translatePos.x + @el.width / 2, @translatePos.y + @el.height / 2
    cx.scale @scale, @scale
    cx.rotate @currentAngle * Math.PI / 180

    # Draw always with the image as the centerpoint, rotation and all coordinates are relative to that.
    cx.drawImage @image, -@image.width / 2, -@image.height / 2

    cx.restore()


  createCanvas: ->
    canvas        = document.createElement 'canvas'
    canvas.id     = 'croppy-canvas'
    canvas.height = @settings.height
    canvas.width  = @settings.width

    # Rotation functions
    if @cw
      rotateCW = =>
        @currentAngle += 90
        @draw()

    if @ccw
      rotateCCW = =>
        @currentAngle -= 90
        @draw()

    # Add rotation handlers
    @cw.addEventListener  "click", rotateCW,  false if @cw
    @ccw.addEventListener "click", rotateCCW, false if @ccw

    # Zoom functions
    if @zoomPlus || @mousewheelZoom
      zoomIn = =>
        @scale *= @scaleMultiplier
        @draw()

    if @zoomMinus || @mousewheelZoom
      zoomOut = =>
        @scale /= @scaleMultiplier
        @draw()

    if @mousewheelZoom
      # Add zoom handlers
      canvas.addEventListener "mousewheel", (e) =>
        if e.wheelDeltaY > 0
          zoomIn()
        else
          zoomOut()
      , false

    if @zoomPlus || @zoomMinus
      zooming = (fn) =>
        @mouseDown = true
        @mouseDownIntervalId = setInterval fn, 50

    if @zoomPlus
      @zoomPlus.addEventListener 'mousedown', (e) =>
        zooming zoomIn if e.button == 0
      , false

      @zoomPlus.addEventListener 'mouseup', =>
        @mouseDown = false
        clearInterval @mouseDownIntervalId
      , false

    if @zoomMinus
      @zoomMinus.addEventListener 'mousedown', (e) =>
        zooming zoomOut if e.button == 0
      , false

      @zoomMinus.addEventListener 'mouseup', =>
        @mouseDown = false
        clearInterval @mouseDownIntervalId
      , false

    # Add drag handlers
    canvas.addEventListener "mousedown", (e) =>
      if e.button == 0
        @mouseDrag true
        @startDragOffset.x = e.clientX - @translatePos.x
        @startDragOffset.y = e.clientY - @translatePos.y

    canvas.addEventListener "mouseup", (e) =>
      @mouseDrag false

    canvas.addEventListener "mouseover", (e) =>
      @mouseDrag false

    canvas.addEventListener "mouseout", (e) =>
      @mouseDrag false, 'initial'

    canvas.addEventListener "mousemove", (e) =>
      if @mouseDown && e.button == 0
        @mouseDrag true
        @translatePos.x = e.clientX - @startDragOffset.x
        @translatePos.y = e.clientY - @startDragOffset.y
        @draw()

    canvas


  ###
  Sets the `@mouseDown` state and the cursor CSS

  @param dragging [Boolean] Whether or not we should be considered currently 'dragging'
  @param cursor   [String]  (optional) Makes a decent CSS choice if there is no argument given.
  ###
  mouseDrag: (dragging, cursor) ->
    if @mouseDown = dragging
      @el.style.cursor = cursor || 'move'
    else
      @el.style.cursor = cursor || 'pointer'


  ###
  Loads an image onto the canvas

  @param src [String] The location (href) of the image source
  ###
  loadImage: (src) ->
    context = @el.getContext '2d'
    @image   = new Image()

    @image.onload = (e) =>
      img = e.srcElement

      console.log 'Image width:', img.width, ', height:', img.height if @settings.debug

      xCorrection = 0
      yCorrection = 0

      # Calculate the scale so that the entire image fills the box.
      # There may be parts of the image out of view, this is okay.
      # This will change its position, so calculate a correction for
      # the appropriate dimension.
      #
      # TODO: The Correction calculation is wrong, it's not exact center, and it should be.
      smallestDimension = if img.width < img.height
        img.width
      else
        img.height

      @scale ||= @el.width / smallestDimension

      @translatePos =
        x: 0
        y: 0

      @draw()

    @image.src = src || @settings.src
    @image


module.exports = Canvas
