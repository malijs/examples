/*
 * Random route / feature utils
 */

const COORD_FACTOR = 1e7

function toRadians (num) {
  return num * Math.PI / 180
}

/**
 * Calculate the distance between two points using the "haversine" formula.
 * This code was taken from http://www.movable-type.co.uk/scripts/latlong.html.
 * @param start The starting point
 * @param end The end point
 * @return The distance between the points in meters
 */
function getDistance (start, end) {
  var lat1 = start.latitude / COORD_FACTOR
  var lat2 = end.latitude / COORD_FACTOR
  var lon1 = start.longitude / COORD_FACTOR
  var lon2 = end.longitude / COORD_FACTOR
  var R = 6371000 // metres
  var φ1 = toRadians(lat1)
  var φ2 = toRadians(lat2)
  var Δφ = toRadians(lat2 - lat1)
  var Δλ = toRadians(lon2 - lon1)

  var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Turn the point into a dictionary key.
 * @param {point} point The point to use
 * @return {string} The key for an object
 */
function pointKey (point) {
  return point.latitude + ' ' + point.longitude
}

exports.toRadians = toRadians
exports.getDistance = getDistance
exports.pointKey = pointKey
