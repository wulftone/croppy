###
HTML5 canvas crop zoom library
###
class Croppy


  ###
  @param  options [Object] A bunch of options
  @option id      [String] The id of the element to render into.
  ###
  constructor: (options) ->
    @container = document.getElementById options.id
    @canvas = createCanvas()
    render()


render = ->


createCanvas = ->
  document.createElement 'canvas'
