# [Puzzlaika](https://crydy.github.io/Puzzlaika/)

## Description

This is a jigsaw-like puzzle game (with square elements), developed in native Java Script. The game supposes uploading a user image, but without it the game can work with the inner image. The size of the playing field is calculated from the browser viewport size, the image is cropped from short sides to implement square details.

Live-game available [here](https://crydy.github.io/Puzzlaika/).

## Browser support

The game was developed only for Google Chrome, support for other browsers is not guaranteed.

## Project structure

Project files are stored in **/source**, the **Gulp** automatization is implied, minified work files are stored in **/docs** (for GitHub Pages servise). Quick adjustment of transition durations, sensitivity coefficients of search for adjacent elements, restrictions on the maximum number of parts, and more are customizable in the start of script.