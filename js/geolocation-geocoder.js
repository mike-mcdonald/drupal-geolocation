/**
 * @file
 *   Javascript for the Google geocoder function.
 */

/**
 * @name AddressComponent
 * @property {String} long_name - Long component name
 * @property {String} short_name - Short component name
 * @property {String[]} types - Compontent type
 * @property {Object} geometry
 * @property {Object} geometry.location
 */

/**
 * @name GoogleAddress
 * @property {AddressComponent[]} address_components - Compontents
 */

(function ($, Drupal, _) {
  'use strict';

  /* global google */

  /**
   * @namespace
   */
  Drupal.geolocation = Drupal.geolocation || {};
  Drupal.geolocation.geocoder = Drupal.geolocation.geocoder || {};

  /**
   * Load google maps and set a callback to run when it's ready.
   *
   * @param {object} map - The Google Map object
   */
  Drupal.geolocation.geocoder.add = function (map) {

    /**
     * Callback for geocoder controls click submit.
     *
     * @param {object} e - The event from input keypress or the click of the submit button.
     */
    var handleControlEvent = function (e) {
      if (typeof e.keyCode === 'undefined' || e.keyCode === 13 || e.keyCode === 0) {
        // We don't any forms submitting.
        e.preventDefault();
        // Get the address from the input value.
        var address = $(e.target).parent().children('input.input').val();
        // Make sure there are at least 2 characters for geocoding.
        if (address.length > 1) {
          // Run the geocode function with google maps.
          map.geocoder.geocode({address: address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              // Set the map viewport.
              map.googleMap.fitBounds(results[0].geometry.viewport);
              // Set the map marker.
              Drupal.geolocation.setMapMarker(results[0].geometry.location, map);

              Drupal.geolocation.geocoder.resultCallback(results[0]);
            }
            else {
              // Alert of the error geocoding.
              alert(Drupal.t('Geocode was not successful for the following reason: ') + status);
            }
          });
        }
      }
    };

    map.geocoder = new google.maps.Geocoder();
    map.controls = $('<div class="geocode-controls-wrapper" />')
      .append($('<input type="text" class="input" placeholder="Enter a location" />'))
      // Create submit button
      .append($('<button class="submit" />'))
      // Create clear button
      .append($('<button class="clear" />'))
      // Create clear button
      .append($('<div class="geolocation-map-indicator" />'))
      // Use the DOM element.
      .get(0);

    // Add the default indicator if the values aren't blank.
    if (map.lat !== '' && map.lng !== '') {
      $(map.controls).children('.geolocation-map-indicator')
        .addClass('has-location')
        .text(map.lat + ', ' + map.lng);
    }

    map.controls.index = 1;

    map.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(map.controls);

    google.maps.event.addDomListener($(map.controls).children('button.submit')[0], 'click', handleControlEvent);
    google.maps.event.addDomListener($(map.controls).children('input.input')[0], 'keyup', handleControlEvent);
    google.maps.event.addDomListener($(map.controls).children('button.clear')[0], 'click', function (e) {
      // Stop all that bubbling and form submitting.
      e.preventDefault();
      // Remove the coordinates.
      $(map.controls).children('.geolocation-map-indicator').text('').removeClass('has-location');
      // Clear the map point.
      map.marker.setMap();
      // Clear the input text.
      $(map.controls).children('input.input').val('');
    });
  };

  /**
   * Provides the callback that is called when geocoded results are found loads.
   *
   * @param {object} result - first returned address
   */
  Drupal.geolocation.geocoder.resultCallback = function (result) {
    // Ensure callbacks array;
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    _.invoke(Drupal.geolocation.geocoder.resultCallbacks, 'callback', result);
  };

  /**
   * Adds a callback that will be called when results are found.
   *
   * @param {geolocationCallback} callback - The callback
   * @param {string} [id] - Identify the callback
   */
  Drupal.geolocation.geocoder.addResultCallback = function (callback, id) {
    if (typeof id === 'undefined') {
      id = 'none';
    }
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    Drupal.geolocation.geocoder.resultCallbacks.push({callback: callback, id: id});
  };

  /**
   * Remove a callback that will be called when results are found.
   *
   * @param {string} id - Identify the callback
   */
  Drupal.geolocation.geocoder.removeResultCallback = function (id) {
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    $.each(Drupal.geolocation.geocoder.resultCallbacks, function (index, callback) {
      if (callback.id !== 'none' && callback.id === id) {
        Drupal.geolocation.geocoder.resultCallbacks.splice(index, 1);
      }
    });
  };

})(jQuery, Drupal, _);
