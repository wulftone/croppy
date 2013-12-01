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
    @container = document.getElementById id
    @canvas = new Canvas(options)
    @render()


  render: ->
    @container.appendChild @canvas.el


module.exports = Croppy
