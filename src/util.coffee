class Util

  @merge: (mergee, merger) ->
    for own k, v of merger
      mergee[k] = v unless mergee.hasOwnProperty k

    mergee


module.exports = Util
