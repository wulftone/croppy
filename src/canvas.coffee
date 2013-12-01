class Canvas


  constructor: (options) ->
    @settings = @mergeObj options, @defaults
    @el = @createCanvas()
    @image = @loadImage()
    # Set state variables
    @currentAngle = 0
    @mouseDown = false
    @scale = 1.0
    @scaleMultiplier = 0.8
    @startDragOffset = {}
    # @translatePos =
    #   x: canvas.width / 2
    #   y: canvas.height / 2



  mergeObj: (mergee, merger) ->
    for own k, v of merger
      mergee[k] = v unless mergee.hasOwnProperty k

    mergee


  defaults:
      width : '300'
      height: '300'


  draw: ->
    cx = @el.getContext("2d")
    # clear canvas
    cx.clearRect(0, 0, @el.width, @el.height)

    cx.save()

    cx.translate(@translatePos.x, @translatePos.y)
    cx.scale(@scale, @scale)
    cx.rotate(@currentAngle * Math.PI / 180);

    cx.drawImage(@image, -@image.width / 2, -@image.width / 2);
    cx.restore()


  createCanvas: ->
    canvas = document.createElement 'canvas'
    canvas.height = @settings.height
    canvas.width = @settings.width

    # Add rotation handlers
    document.getElementById("plus").addEventListener "click", =>
      @currentAngle += 90
      @draw()
    , false

    document.getElementById("minus").addEventListener "click", =>
      @currentAngle -= 90
      @draw()
    , false

    # Add zoom handlers
    canvas.addEventListener "mousewheel", (e) =>
      if e.wheelDeltaY > 0
        @scale *= @scaleMultiplier
      else
        @scale /= @scaleMultiplier

      console.log @scale

      @draw()
    , false

    # Add drag handlers
    canvas.addEventListener "mousedown", (e) =>
      @mouseDown = true
      console.log 'start', @translatePos
      @startDragOffset.x = e.clientX - @translatePos.x
      @startDragOffset.y = e.clientY - @translatePos.y
      console.log 'startDragOffset', @startDragOffset

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
    image = new Image()

    image.onload = (e) =>
      img = e.srcElement
      @translatePos =
        x: img.width / 2
        y: img.height / 2
      @draw()

    image.src = src || @settings.src
    image



module.exports = Canvas
