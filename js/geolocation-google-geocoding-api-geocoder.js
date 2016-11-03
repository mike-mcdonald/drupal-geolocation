/**
 * @file
 *   Javascript for the Google Geocoding PAI geocoder.
 */

(function ($, Drupal) {
  'use strict';

  if (typeof Drupal.geolocation.geocoder === 'undefined') {
    return false;
  }

  Drupal.geolocation.geocoder.googleGeocodingAPI = {};

  if (typeof Drupal.geolocation.loadGoogle === 'function') {
    // First load the library from google.
    Drupal.geolocation.loadGoogle(function () {
      console.log("Google loaded");
    });
  }

  if (typeof google === 'undefined') {
    return false;
  }

  /**
   * Retrieve geocoded results for autocomplete.
   *
   * @param {string} location - String to geocode
   * @param {GeolocationGeocoderAutocompleteCallback} callback - callback to execute when done
   */
  Drupal.geolocation.geocoder.googleGeocodingAPI.autocomplete = function (location, callback) {
    if (typeof Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder === 'undefined') {
      Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder = new google.maps.Geocoder();
    }
    var autocompleteResults = [];
    Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder.geocode(
      {address: location},

      /**
       * Google Geocoding API geocode.
       *
       * @param {GoogleAddress[]} results - Returned results
       * @param {String} status - Whether geocoding was successful
       * @return {Array} - Results readied for autocomplete
       */
      function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          $.each(results, function (index, result) {
            autocompleteResults.push({
              value: result.formatted_address,
              address: result
            });
          });
        }
        callback(autocompleteResults);
      }
    );
  };

  /**
   * Retrieve single geocoded result.
   *
   * @param {String} location - String to geocode
   * @param {GeolocationGeocoderGeocodeCallback} callback - callback to execute when done
   */
  Drupal.geolocation.geocoder.googleGeocodingAPI.geocode = function (location, callback) {
    if (typeof Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder === 'undefined') {
      Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder = new google.maps.Geocoder();
    }

    Drupal.geolocation.geocoder.googleGeocodingAPI.geocoder.geocode({address: location}, function (results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        callback(results[0]);
      }
      else {
        callback(false);
      }
    });
  };

})(jQuery, Drupal);
