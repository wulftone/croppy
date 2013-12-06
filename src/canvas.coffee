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


  ###
  Creates a canvas element and attaches a whole mess of event handlers

  @return [DOMElement] The canvas element
  ###
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
    @cw .addEventListener "click", rotateCW  if @cw
    @ccw.addEventListener "click", rotateCCW if @ccw

    ###
    Zoom functions
    ###
    if @zoomPlus || @mousewheelZoom
      ###
      Does the actual zooming in
      ###
      zoomIn = =>
        @scale *= @scaleMultiplier
        @draw()

      ###
      Attach this to the appropriate event
      ###
      zoomInHandler = (e) =>
        e.preventDefault()
        zooming zoomIn if e.button == 0 || e.button == undefined

    if @zoomMinus || @mousewheelZoom
      ###
      Does the actual zooming out
      ###
      zoomOut = =>
        @scale /= @scaleMultiplier
        @draw()

      ###
      Attach this to the appropriate event
      ###
      zoomOutHandler = (e) =>
        e.preventDefault()
        zooming zoomOut if e.button == 0 || e.button == undefined

    if @mousewheelZoom
      ###
      Determines whether or not to zoom in or out

      @param delta [Number] The mousewheel delta
      ###
      mouseWheelZooming = (delta) ->
        if delta > 0
          zoomIn()
        else
          zoomOut()

      # Add zoom handlers
      # Webkit
      canvas.addEventListener "mousewheel", (e) =>
        e.preventDefault()
        mouseWheelZooming e.wheelDelta

      # Gecko
      canvas.addEventListener "wheel", (e) =>
        e.preventDefault()
        mouseWheelZooming e.deltaY

    if @zoomPlus || @zoomMinus
      ###
      Performs the zooming with the given function and sets a debounce timer
      so dragging doesn't happen immediately after zooming, preventing the image
      from suddenly jumping around after a zoom.

      @param fn [Function] The zoom operation to perform (zoomIn, zoomOut)
      ###
      zooming = (fn) =>
        @mouseDown = true
        @mouseDownIntervalId = setInterval fn, 50

      ###
      Resets the state after zooming is over
      ###
      endZooming = (e) =>
        e.preventDefault()
        @mouseDown = false
        clearInterval @mouseDownIntervalId

    if @zoomPlus # Zooming in
      @zoomPlus.addEventListener  'mousedown' , zoomInHandler
      @zoomPlus.addEventListener  'touchstart', zoomInHandler
      @zoomPlus.addEventListener  'mouseup'   , endZooming
      @zoomPlus.addEventListener  'touchend'  , endZooming

    if @zoomMinus # Zooming out
      @zoomMinus.addEventListener 'mousedown' , zoomOutHandler
      @zoomMinus.addEventListener 'touchstart', zoomOutHandler
      @zoomMinus.addEventListener 'mouseup'   , endZooming
      @zoomMinus.addEventListener 'touchend'  , endZooming


    ###
    Dragging
    ###

    ###
    Set up the proper state variables to keep track of initial drag position

    @param x [Number] The initial pointer state x coordinate
    @param y [Number] The initial pointer state y coordinate
    ###
    startDrag = (x, y) =>
      @dragHandler true
      @startTranslatePos =
        x: @translatePos.x
        y: @translatePos.y

      @startDragOffset.x = x - @translatePos.x
      @startDragOffset.y = y - @translatePos.y


    ###
    Used by either a mouse or touch event handler (this is why it's abstracted out).
    Draws the image according to the current state and the given coordinates.

    @param x [Number] The latest pointer state x coordinate
    @param y [Number] The latest pointer state y coordinate
    ###
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


    ###
    Stop the event and set the appropriate state
    ###
    stopDrag = (e) =>
      e.preventDefault()
      console.log 'stopping drag'
      @dragHandler false


    ###
    Assign mouse dragging events
    ###
    canvas.addEventListener "mousedown", (e) =>
      e.preventDefault()
      startDrag e.clientX, e.clientY if e.button == 0

    canvas.addEventListener "mousemove", (e) =>
      e.preventDefault()
      drawDuringDrag e.clientX, e.clientY if @mouseDown && e.button == 0

    canvas.addEventListener "mouseout", (e) =>
      e.preventDefault()
      @dragHandler false, 'initial'

    canvas.addEventListener "mouseup"  , stopDrag
    canvas.addEventListener "mouseover", stopDrag


    ###
    Standard pythagorean theorem

    @param x1 [Number] The x coordinate of a pair of coordinates
    @param y1 [Number] The y coordinate of a pair of coordinates
    @param x2 [Number] The x coordinate of a pair of coordinates
    @param y2 [Number] The y coordinate of a pair of coordinates

    @return [Number] The distance between the two coordinates
    ###
    getPinchDistance = (x1, y1, x2, y2) ->
      Math.sqrt( (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) )


    ###
    Performs the scaling involved in a "pinch" touch zoom operation

    @param x1 [Number] The x coordinate of a pair of coordinates
    @param y1 [Number] The y coordinate of a pair of coordinates
    @param x2 [Number] The x coordinate of a pair of coordinates
    @param y2 [Number] The y coordinate of a pair of coordinates
    ###
    touchZoom = (x1, y1, x2, y2) =>
      @touchZooming = true
      pinchDistance = getPinchDistance x1, y1, x2, y2
      delta = pinchDistance / @startPinchDistance
      @scale = @startScale * delta
      @draw()


    ###
    Setup the state for beginning either a drag or a zoom
    ###
    startZoomOrDrag = (e) =>
      e.preventDefault()
      t = e.touches

      if t.length == 2
        console.log 'touchstart 2' if @settings.debug
        @touchZooming = true
        @touchDragStarted = false
        @startScale = parseFloat @scale
        @startPinchDistance = getPinchDistance t[0].clientX, t[0].clientY, t[1].clientX, t[1].clientY

      else
        console.log 'touchstart 1' if @settings.debug
        @touchZooming = false
        @touchDragStarted = true
        startDrag t[0].clientX, t[0].clientY


    ###
    When the pointer moves, choose whether we're doing a drag or zoom operation
    ###
    moveZoomOrDrag = (e) =>
      e.preventDefault()
      t = e.touches

      if t.length == 2
        touchZoom t[0].clientX, t[0].clientY, t[1].clientX, t[1].clientY
        # touchRotate e.touches # TODO!

      else
        drawDuringDrag t[0].clientX, t[0].clientY


    ###
    Canvas drag and zoom events
    ###
    canvas.addEventListener "touchstart" , startZoomOrDrag
    canvas.addEventListener "touchmove"  , moveZoomOrDrag
    canvas.addEventListener "touchend"   , stopDrag
    canvas.addEventListener "touchcancel", stopDrag
    canvas.addEventListener "touchleave" , stopDrag
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


  ###
  Clears/resets touch-related state variables
  ###
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
