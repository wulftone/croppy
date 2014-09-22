# Croppy

A simple HTML5 canvas crop and zoom utility.

# Example

http://wulftone.github.io/croppy

# Usage

Bare minimum usage like so:

    var c = new Croppy({
      container: 'element-id'
    });


# Options

* `src` [String] The path to the image file you wish croppy to start up with
* `scale` [Number] The initial zoom factor
* `x` [Number] The x position of the image, center weighted
* `y` [Number] The y position of the image, center weighted

More options TBD... customization things!

# Development

## Installing

    npm install

## Building

    grunt browserify

## Testing

    grunt

## Watching

    grunt watch
