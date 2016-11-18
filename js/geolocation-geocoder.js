/**
 * @file
 *   Javascript for the plugin-based geocoder function.
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

})(jQuery, Drupal, _);
