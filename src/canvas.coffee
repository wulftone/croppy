Util = require './util.coffee'

###
TODO: give @translatePos a reasonable starting point
###
class Canvas


  constructor: (options) ->
    @settings        = Util.merge options, @defaults
    [@cw, @ccw]      = @settings.rot
    @zoomSlider      = @settings.zoomSlider
    @currentAngle    = 0
    @mouseDown       = false
    @scale           = @settings.scale || 1.0
    @scaleMultiplier = @settings.scaleMultiplier || 0.95
    @startDragOffset = {}
    # @translatePos  = {} # gets set in loadImage

    # Do these last
    @el              = @createCanvas()
    @image           = @loadImage()


  defaults:
      width : '300'
      height: '300'


  draw: ->
    cx = @el.getContext("2d")

    # clear canvas
    cx.clearRect(0, 0, @el.width, @el.height)

    cx.save()

    console.log 'translatePos:', @translatePos, ', scale:', @scale.toPrecision(2), ', angle:', @currentAngle if @settings.debug

    cx.translate @translatePos.x, @translatePos.y
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

    # Add rotation handlers
    if @cw
      @cw.addEventListener "click", =>
        @currentAngle += 90
        @draw()
      , false

    if @ccw
      @ccw.addEventListener "click", =>
        @currentAngle -= 90
        @draw()
      , false

    # Add zoom handlers
    canvas.addEventListener "mousewheel", (e) =>
      if e.wheelDeltaY > 0
        @scale *= @scaleMultiplier
      else
        @scale /= @scaleMultiplier

      @draw()
    , false

    if @slider
      @slider.addEventListener 'change', (e) =>
        scale *= @scaleMultiplier
        scale /= @scaleMultiplier

        @draw()
      , false

    # Add drag handlers
    canvas.addEventListener "mousedown", (e) =>
      @mouseDown = true
      @startDragOffset.x = e.clientX - @translatePos.x
      @startDragOffset.y = e.clientY - @translatePos.y

    canvas.addEventListener "mouseup", (e) =>
      @mouseDown = false

    canvas.addEventListener "mouseover", (e) =>
      @mouseDown = false

    canvas.addEventListener "mouseout", (e) =>
      @mouseDown = false

    canvas.addEventListener "mousemove", (e) =>
      if @mouseDown
        @translatePos.x = e.clientX - @startDragOffset.x
        @translatePos.y = e.clientY - @startDragOffset.y
        @draw()

    canvas


  loadImage: (src) ->
    context = @el.getContext '2d'
    image   = new Image()

    image.onload = (e) =>
      img = e.srcElement

      console.log 'Image width:', img.width, ', height:', img.height

      xCorrection = 0
      yCorrection = 0

      # Calculate the scale so that the entire image fills the box.
      # There may be parts of the image out of view, this is okay.
      smallestDimension = if img.width < img.height
        yCorrection = @el.height / 2
        img.width
      else
        xCorrection = @el.width / 2
        img.height


      @scale = @el.width / smallestDimension

      @translatePos =
        # x: (@el.width  + @scale * img.width)  / 2
        # y: (@el.height + @scale * img.height) / 2
        x: (@scale * img.width  - xCorrection) / 2
        y: (@scale * img.height - yCorrection) / 2

      @draw()

    image.src = src || @settings.src
    image


module.exports = Canvas
