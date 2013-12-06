Util = require './util.coffee'

###
The canvas where the editing all happens
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
    @cw .addEventListener "click", rotateCW,  false if @cw
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
      mouseWheelZooming = (delta) ->
        if delta > 0
          zoomIn()
        else
          zoomOut()

      # Add zoom handlers
      canvas.addEventListener "mousewheel", (e) =>
        e.preventDefault()
        mouseWheelZooming e.wheelDelta
      , false

      canvas.addEventListener "wheel", (e) =>
        e.preventDefault()
        mouseWheelZooming e.deltaY
      , false

    if @zoomPlus || @zoomMinus
      zooming = (fn) =>
        @mouseDown = true
        @mouseDownIntervalId = setInterval fn, 50

      endZooming = (e) =>
        @mouseDown = false
        clearInterval @mouseDownIntervalId

    if @zoomPlus # Zooming in
      @zoomPlus.addEventListener 'pointerdown', (e) =>
        e.preventDefault()
        zooming zoomIn if e.button == 0
      , false

      @zoomPlus.addEventListener 'pointerup', (e) =>
        e.preventDefault()
        endZooming()
      , false

    if @zoomMinus # Zooming out
      @zoomMinus.addEventListener 'pointerdown', (e) =>
        e.preventDefault()
        zooming zoomOut if e.button == 0
      , false

      @zoomMinus.addEventListener 'pointerup', (e) =>
        e.preventDefault()
        endZooming()
      , false


    ###
    Dragging
    ###
    startDrag = (x, y) =>
      @dragHandler true
      @startTranslatePos =
        x: @translatePos.x
        y: @translatePos.y

      @startDragOffset.x = x - @translatePos.x
      @startDragOffset.y = y - @translatePos.y

    drawDuringDrag = (x, y) =>
      unless @touchZooming
        @dragHandler true

        @translatePos.x = x - @startDragOffset.x
        @translatePos.y = y - @startDragOffset.y

        # console.log 'during drag', @translatePos if @settings.debug

        if @touchDragStarted
          threshold = 10

          unless @touchDragThresholdReached
            # Allow dragging if the current distance traveled is greater than a threshold distance
            @touchDragThresholdReached = Math.abs(@startTranslatePos.x - @translatePos.x) > threshold ||
                                         Math.abs(@startTranslatePos.y - @translatePos.y) > threshold

          @draw() if @touchDragThresholdReached

        else
          @draw()

    getPinchDistance = (x1, y1, x2, y2) ->
      Math.sqrt( (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) )

    touchZoom = (x1, y1, x2, y2) =>
      @touchZooming = true
      pinchDistance = getPinchDistance x1, y1, x2, y2
      delta = pinchDistance / @startPinchDistance
      @scale = @startScale * delta
      @draw()

    updatePointer = (pointer) =>
      @pointers.map (p) ->
        if p.pointerId == pointer.pointerId
          pointer
        else
          p


    stopDrag = (e) =>
      e.preventDefault()
      @dragHandler false

    handlePointerDown = (e) =>
      e.preventDefault()
      @pointers    ||= []
      @pointers.push e

      if @pointers.length == 2
        console.log 'touchstart 2' if @settings.debug
        @touchZooming = true
        @touchDragStarted = false
        @startScale = parseFloat @scale
        @startPinchDistance = getPinchDistance @pointers[0].clientX, @pointers[0].clientY, @pointers[1].clientX, @pointers[1].clientY

      else
        console.log 'touchstart 1' if @settings.debug
        @touchZooming = false
        @touchDragStarted = true
        startDrag @pointers[0].clientX, @pointers[0].clientY

    handlePointerMove = (e) =>
      e.preventDefault()
      return unless @pointers && @pointers.length > 0

      @pointers = updatePointer e

      if @pointers.length == 2
        touchZoom @pointers[0].clientX, @pointers[0].clientY, @pointers[1].clientX, @pointers[1].clientY
        # touchRotate e.touches # TODO!

      else
        drawDuringDrag @pointers[0].clientX, @pointers[0].clientY

    ###
    Canvas drag and zoom events
    ###
    canvas.addEventListener "pointerdown"  , handlePointerDown, false
    canvas.addEventListener "pointermove"  , handlePointerMove, false
    canvas.addEventListener "pointerup"    , stopDrag         , false
    canvas.addEventListener "pointercancel", stopDrag         , false
    canvas.addEventListener "pointerleave" , stopDrag         , false
    canvas


  ###
  Sets and unsets the various states involved in dragging/zooming

  TODO: Probably refactor this.. it's getting messy.

  @param dragging [Boolean] Whether or not we should be considered currently 'dragging'
  @param cursor   [String]  (optional) Makes a decent CSS choice if there is no argument given.
  ###
  dragHandler: (dragging, cursor) ->
    # console.log 'touchZooming', @touchZooming if @settings.debug
    if @mouseDown = dragging
      @el.style.cursor = cursor || 'move'
    else
      @el.style.cursor = cursor || 'pointer'
      @clearTouchState()


  clearTouchState: ->
    console.log 'clearing touch state' if @settings.debug

    # Reset the pointers
    @pointers = []

    # Reset these state variables
    @touchDragStarted = false
    @touchDragThresholdReached = false

    # Prevent zooming from becoming dragging during touch release
    if @touchZooming
      clearTimeout @touchZoomTimeout if @touchZoomTimeout

      @touchZoomTimeout = setTimeout =>
        console.log 'touchzoom timed out!' if @settings.debug
        @touchZooming = false
      , 500


  ###
  Loads an image onto the canvas

  @param src [String] The location (href) of the image source
  ###
  loadImage: (src) ->
    context = @el.getContext '2d'
    @image   = new Image()

    @image.onload = (e) =>
      img = e.target

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
