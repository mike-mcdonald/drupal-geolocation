/**
 * @file
 *   Javascript for the Google geocoder function.
 */

/**
 * Callback for geocoded results in autocomplete field.
 *
 * @callback GeolocationGeocoderAutocompleteCallback
 * @param {GoogleAddress[]} results - Retrieved geocoded results for autocomplete use.
 */

/**
 * Callback for geocoded results in autocomplete field.
 *
 * @callback GeolocationGeocoderGeocodeCallback
 * @param {(GoogleAddress|boolean)} result - Retrieved geocoded result or false.
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
   * Generic autocomplete support with geocoded results.
   *
   * @param {String} location - Single string address to retrieve results for
   * @param {GeolocationGeocoderAutocompleteCallback} callback - callback to execute when done
   */
  Drupal.geolocation.geocoder.autocomplete = function (location, callback) {
    if (typeof drupalSettings.geolocation.default_geocoder === 'undefined') {
      // Fallback
      drupalSettings.geolocation.default_geocoder = 'googleGeocodingAPI';
    }

    if (typeof Drupal.geolocation.geocoder[drupalSettings.geolocation.default_geocoder].autocomplete !== 'undefined') {
      Drupal.geolocation.geocoder[drupalSettings.geolocation.default_geocoder].autocomplete(location, callback);
    }
  };

  /**
   * Generic autocomplete support with geocoded results.
   *
   * @param {String} location - Single string address to retrieve results for
   * @param {GeolocationGeocoderGeocodeCallback} callback - execute when done.
   */
  Drupal.geolocation.geocoder.geocode = function (location, callback) {
    if (typeof drupalSettings.geolocation.default_geocoder === 'undefined') {
      // Fallback
      drupalSettings.geolocation.default_geocoder = 'googleGeocodingAPI';
    }

    if (typeof Drupal.geolocation.geocoder[drupalSettings.geolocation.default_geocoder].geocode !== 'undefined') {
      Drupal.geolocation.geocoder[drupalSettings.geolocation.default_geocoder].geocode(location, callback);
    }
  };


  /**
   * Attach geocoder form and functionality to existing map.
   *
   * @param {object} map - The Google Map object
   */
  Drupal.geolocation.geocoder.add = function (map) {
    map.controls = $('<form class="geocode-controls-wrapper" />')
      .append($('<input id="geocoder-input-' + map.id + '" type="text" class="input" placeholder="Enter a location" />'))
      // Create submit button
      .append($('<button class="submit" />'))
      // Create clear button
      .append($('<button class="clear" />'))
      // Create indicator
      .append($('<div class="geolocation-map-indicator" />'));

    map.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(map.controls.get(0));

    map.controls.children('input.input').first().autocomplete({
      autoFocus: true,
      source: function (request, response) {
        Drupal.geolocation.geocoder.autocomplete(request.term, response);
      },
      select: function (event, ui) {
        // Set the map viewport.
        map.googleMap.fitBounds(ui.item.address.geometry.viewport);
        // Set the map marker.
        Drupal.geolocation.geocoder.setMapMarker(ui.item.address.geometry.location, map);
        Drupal.geolocation.geocoder.resultCallback(ui.item.address, map);
      }
    });

    map.controls.submit(function (e) {
      e.preventDefault();
      Drupal.geolocation.geocoder.geocode($(this).children('input.input').val(), function (result) {
        if (result) {
          map.googleMap.fitBounds(result.geometry.viewport);
          // Set the map marker.
          Drupal.geolocation.geocoder.setMapMarker(result.geometry.location, map);
          Drupal.geolocation.geocoder.resultCallback(result, map);
        }
      });
    });

    google.maps.event.addDomListener(map.controls.children('button.clear')[0], 'click', function (e) {
      // Stop all that bubbling and form submitting.
      e.preventDefault();
      // Remove the coordinates.
      map.controls.children('.geolocation-map-indicator').text('').removeClass('has-location');
      // Clear the map point.
      map.marker.setMap();
      // Clear the input text.
      map.controls.children('input.input').val('');
    });

    // If the browser supports W3C Geolocation API.
    if (navigator.geolocation) {
      map.controls.children('button.clear').first().before($('<button class="locate" />'));

      google.maps.event.addDomListener(map.controls.children('button.locate')[0], 'click', function (e) {
        // Stop all that bubbling and form submitting.
        e.preventDefault();

        // Get the geolocation from the browser.
        navigator.geolocation.getCurrentPosition(function (position) {
          map.googleMap.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        });
      });
    }
  };

  /**
   * Provides the callback that is called when geocoded results are found loads.
   *
   * @param {object} result - first returned address
   * @param {Object} map - The settings object that contains all of the necessary metadata for this map.
   */
  Drupal.geolocation.geocoder.resultCallback = function (result, map) {
    // Ensure callbacks array;
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    _.invoke(Drupal.geolocation.geocoder.resultCallbacks, 'callback', result, map);
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

  /**
   * Extend geolocation core setMapMarker to also add text to indicator.
   *
   * @param {Object} latLng - A location (latLng) object from google maps API.
   * @param {Object} map - The settings object that contains all of the necessary metadata for this map.
   */
  Drupal.geolocation.geocoder.setMapMarker = function (latLng, map) {
    Drupal.geolocation.setMapMarker(latLng, map);
    // Add a visual indicator.
    $(map.controls).children('.geolocation-map-indicator')
      .text(Drupal.t('Latitude') + ': ' + latLng.lat() + ' ' + Drupal.t('Longitude') + ': ' + latLng.lng())
      .addClass('has-location');
  };

})(jQuery, Drupal, _);
