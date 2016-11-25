/**
 * @file
 *   Javascript for the plugin-based geocoder function.
 */

/**
 * Callback for results in autocomplete field.
 *
 * @callback geolocationGeocoderResultCallback
 * @param {GoogleAddress} address - Google address.
 */

(function ($, Drupal) {
  'use strict';

  /**
   * @namespace
   */
  Drupal.geolocation = Drupal.geolocation || {};
  Drupal.geolocation.geocoder = Drupal.geolocation.geocoder || {};

  drupalSettings.geolocation.geocoder = drupalSettings.geolocation.geocoder || {};

  /**
   * Provides the callback that is called when geocoded results are found loads.
   *
   * @param {GoogleAddress} result - first returned address
   * @param {string} elementId - Source ID.
   */
  Drupal.geolocation.geocoder.resultCallback = function (result, elementId) {
    // Ensure callbacks array;
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    $.each(Drupal.geolocation.geocoder.resultCallbacks, function (index, callbackContainer) {
      if (callbackContainer.elementId === elementId) {
        callbackContainer.callback(result);
      }
    });
  };

  /**
   * Adds a callback that will be called when results are found.
   *
   * @param {geolocationGeocoderResultCallback} callback - The callback
   * @param {string} elementId - Identify source of result by its element ID.
   */
  Drupal.geolocation.geocoder.addResultCallback = function (callback, elementId) {
    if (typeof elementId === 'undefined') {
      return;
    }
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    Drupal.geolocation.geocoder.resultCallbacks.push({callback: callback, elementId: elementId});
  };

  /**
   * Remove a callback that will be called when results are found.
   *
   * @param {string} elementId - Identify the source
   */
  Drupal.geolocation.geocoder.removeResultCallback = function (elementId) {
    Drupal.geolocation.geocoder.resultCallbacks = Drupal.geolocation.geocoder.resultCallbacks || [];
    $.each(Drupal.geolocation.geocoder.resultCallbacks, function (index, callback) {
      if (callback.elementId === elementId) {
        Drupal.geolocation.geocoder.resultCallbacks.splice(index, 1);
      }
    });
  };

})(jQuery, Drupal);
