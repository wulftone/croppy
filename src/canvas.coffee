class Canvas


  constructor: (options) ->
    @settings = @mergeObj options, @defaults
    @el = @createCanvas()
    @image = @loadImage()


  mergeObj: (mergee, merger) ->
    for own k, v of merger
      mergee[k] = v unless mergee.hasOwnProperty k

    mergee


  defaults:
      width : '300'
      height: '300'


  createCanvas: ->


    draw = (scale, translatePos) =>
      cx = @el.getContext("2d")
      # clear canvas
      cx.clearRect(0, 0, @el.width, @el.height)

      cx.save()

      console.log translatePos
      cx.translate(translatePos.x, translatePos.y)
      cx.scale(scale, scale)
      cx.rotate(@el.currentAngle * Math.PI / 180);
      cx.drawImage(@image, -@image.width / 2, -@image.width / 2);
      cx.restore()


    canvas = document.createElement 'canvas'
    canvas.height = @settings.height
    canvas.width = @settings.width

    # TODO: Make translatePos correlate to the actual image location
    translatePos =
      x: canvas.width / 2
      y: canvas.height / 2

    scale = 1.0
    scaleMultiplier = 0.8
    startDragOffset = {}
    mouseDown = false

    # add button event listeners
    document.getElementById("plus").addEventListener "click", =>
      scale /= scaleMultiplier
      draw scale, translatePos
    , false

    document.getElementById("minus").addEventListener "click", =>
      scale *= scaleMultiplier
      draw scale, translatePos
    , false

    # add event listeners to handle screen drag
    canvas.addEventListener "mousedown", (e) =>
      mouseDown = true
      console.log 'start', translatePos
      startDragOffset.x = e.clientX - translatePos.x
      startDragOffset.y = e.clientY - translatePos.y
      console.log 'startDragOffset', startDragOffset

    canvas.addEventListener "mouseup", (e) ->
      mouseDown = false

    canvas.addEventListener "mouseover", (e) ->
      mouseDown = false

    canvas.addEventListener "mouseout", (e) ->
      mouseDown = false

    canvas.addEventListener "mousemove", (e) =>
      if mouseDown
        translatePos.x = e.clientX - startDragOffset.x
        translatePos.y = e.clientY - startDragOffset.y
        draw scale, translatePos

    canvas.addEventListener "mousewheel", (e) =>
      if e.wheelDeltaY > 0
        scale += 0.1
      else
        scale -= 0.1

      draw scale, translatePos
    , false
    canvas.currentAngle = 0
    # draw scale, translatePos

    canvas


  loadImage: ->
    context = @el.getContext '2d'
    image = new Image()

    image.onload = (e) =>
      img = e.srcElement
      # draw cropped image
      # sourceCropX = 150
      # sourceCropY = 0
      # sourceCropWidth = 150
      # sourceCropHeight = 150
      # destWidth = sourceCropWidth
      # destHeight = sourceCropHeight

      # Center the image on the canvas
      # destX = @el.width / 2 - destWidth / 2
      # destY = @el.height / 2 - destHeight / 2

      context.drawImage image, @el.width / 2 - img.width / 2, @el.height / 2 - img.height / 2
      # context.drawImage image, sourceCropX, sourceCropY, sourceCropWidth, sourceCropHeight, destX, destY, destWidth, destHeight

    image.src = @settings.src
    image



module.exports = Canvas
