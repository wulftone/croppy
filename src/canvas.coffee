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

    ###
    Rotation functions
    ###
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

    ###
    Zoom functions
    ###
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

      endZooming = (e) =>
        @mouseDown = false
        clearInterval @mouseDownIntervalId

    if @zoomPlus # Zooming in
      @zoomPlus.addEventListener 'mousedown', (e) =>
        zooming zoomIn if e.button == 0
      , false

      @zoomPlus.addEventListener 'mouseup', =>
        endZooming()
      , false

      @zoomPlus.addEventListener "touchstart", (e) =>
        e.preventDefault()
        zooming zoomIn
      , false

      @zoomPlus.addEventListener "touchend", (e) =>
        e.preventDefault()
        endZooming()
      , false

    if @zoomMinus # Zooming out
      @zoomMinus.addEventListener 'mousedown', (e) =>
        zooming zoomOut if e.button == 0
      , false

      @zoomMinus.addEventListener 'mouseup', =>
        endZooming()
      , false

      @zoomMinus.addEventListener "touchstart", (e) =>
        e.preventDefault()
        zooming zoomOut
      , false

      @zoomMinus.addEventListener "touchend", (e) =>
        e.preventDefault()
        endZooming()
      , false


    ###
    Dragging
    ###
    startDrag = (e) =>
      @dragHandler true
      @startTranslatePos =
        x: @translatePos.x
        y: @translatePos.y

      @startDragOffset.x = e.clientX - @translatePos.x
      @startDragOffset.y = e.clientY - @translatePos.y

    drawDuringDrag = (e) =>
      @dragHandler true
      @translatePos.x = e.clientX - @startDragOffset.x
      @translatePos.y = e.clientY - @startDragOffset.y

      if @touchDragStarted
        buffer = 20
        @touchDragThresholdReached = Math.abs(@startTranslatePos.x - @translatePos.x) > buffer ||
                    Math.abs(@startTranslatePos.y - @translatePos.y) > buffer unless @touchDragThresholdReached

        @draw() if @touchDragThresholdReached && !@touchZooming

      else
        @draw()

    # Add drag handlers
    canvas.addEventListener "mousedown", (e) =>
      e.preventDefault()
      startDrag(e) if e.button == 0

    canvas.addEventListener "mouseup", (e) =>
      e.preventDefault()
      @dragHandler false

    canvas.addEventListener "mouseover", (e) =>
      e.preventDefault()
      @dragHandler false

    canvas.addEventListener "mouseout", (e) =>
      e.preventDefault()
      @dragHandler false, 'initial'

    canvas.addEventListener "mousemove", (e) =>
      e.preventDefault()
      drawDuringDrag(e) if @mouseDown && e.button == 0

    ###
    Canvas touch drag and zoom events
    ###
    canvas.addEventListener "touchstart", (e) =>
      e.preventDefault()

      if e.touches.length == 2
        @touchZooming = true
        @startPinchDistance = getPinchDistance e.touches
      else
        @touchDragStarted = true
        startDrag e.touches[0]
    , false

    canvas.addEventListener "touchend", (e) =>
      e.preventDefault()
      @dragHandler false
    , false

    canvas.addEventListener "touchcancel", (e) =>
      e.preventDefault()
      @dragHandler false
    , false

    canvas.addEventListener "touchleave", (e) =>
      e.preventDefault()
      @dragHandler false
    , false

    getPinchDistance = (touches) ->
      Math.sqrt(
        (touches[0].clientX - touches[1].clientX) * (touches[0].clientX - touches[1].clientX) +
        (touches[0].clientY - touches[1].clientY) * (touches[0].clientY - touches[1].clientY))

    touchZoom = (touches) =>
      pinchDistance = getPinchDistance touches
      console.log delta = pinchDistance - @startPinchDistance

      # TODO: Make this better... based off of actual delta distance somehow
      if delta > 0
        @scale *= @scaleMultiplier
      else
        @scale /= @scaleMultiplier

      # TODO: Change `@translatePos` during zoom to keep it centered on the same spot
      @draw()

    canvas.addEventListener "touchmove", (e) =>
      e.preventDefault()

      if e.touches.length == 2
        touchZoom e.touches
      else
        drawDuringDrag e.touches[0]
    , false

    canvas


  ###
  Sets and unsets the various states involved in dragging/zooming

  TODO: Probably refactor this.. it's getting messy.

  @param dragging [Boolean] Whether or not we should be considered currently 'dragging'
  @param cursor   [String]  (optional) Makes a decent CSS choice if there is no argument given.
  ###
  dragHandler: (dragging, cursor) ->
    if @mouseDown = dragging
      @el.style.cursor = cursor || 'move'
    else
      @el.style.cursor = cursor || 'pointer'
      @touchDragStarted = false
      @touchDragThresholdReached = false

      # Prevent zooming from becoming dragging during touch release
      setTimeout =>
        @touchZooming = false
      , 200


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
