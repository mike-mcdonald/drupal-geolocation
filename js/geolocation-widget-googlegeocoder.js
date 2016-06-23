/**
 * @file
 *   Javascript for the Google geocoder widget.
 */

(function ($, Drupal, drupalSettings) {
  'use strict';

  /* global google */

  /**
   * @namespace
   */
  Drupal.geolocation = Drupal.geolocation || {};

  /**
   * Attach geocoder functionality.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches geocoder functionality to relevant elements.
   */
  Drupal.behaviors.geolocationGooglemaps = {
    attach: function (context, settings) {
      // Ensure iterables.
      settings.geolocation = settings.geolocation || {widget_maps: []};
      // Make sure the lazy loader is available.
      if (typeof Drupal.geolocation.loadGoogle === 'function') {
        // First load the library from google.
        Drupal.geolocation.loadGoogle(function () {
          // This won't fire until window load.
          initialize(settings.geolocation.widget_maps, context);
        });
      }
    }
  };

  /**
   * Adds the click listeners to the map.
   *
   * @param {object} map - The current map object.
   */
  Drupal.geolocation.addClickListener = function (map) {
    // Used for a single click timeout.
    var singleClick;
    // Add the click listener.
    google.maps.event.addListener(map.googleMap, 'click', function (e) {
      // Create 500ms timeout to wait for double click.
      singleClick = setTimeout(function () {
        Drupal.geolocation.codeLatLng(e.latLng, map);
        Drupal.geolocation.setMapMarker(e.latLng, map);
      }, 500);
    });
    // Add a doubleclick listener.
    google.maps.event.addListener(map.googleMap, 'dblclick', function (e) {
      clearTimeout(singleClick);
    });
  };

  /**
   * Runs after the google maps api is available
   *
   * @param {object} maps - The google map object.
   * @param {object} context - The html context.
   */
  function initialize(maps, context) {
    // Process drupalSettings for every Google map present on the current page.
    $.each(maps, function (widget_id, map) {

      // Get the container object.
      map.container = $('#' + map.id, context).first();

      if ($(map.container).length >= 1
        && !$(map.container).hasClass('geolocation-processed')
        && typeof google !== 'undefined'
        && typeof google.maps !== 'undefined'
      ) {
        // Add any missing settings.
        map.settings = $.extend(Drupal.geolocation.defaultSettings(), map.settings);

        // Set the lat / lng if not already set.
        if (map.lat === 0 || map.lng === 0) {
          map.lat = $('.geolocation-hidden-lat.for-' + map.id).attr('value');
          map.lng = $('.geolocation-hidden-lng.for-' + map.id).attr('value');
        }

        // Add the map by ID with settings.
        Drupal.geolocation.addMap(map);

        // Add the geocoder to the map.
        Drupal.geolocation.addGeocoder(map);

        // Add the click responders for setting the value.
        Drupal.geolocation.addClickListener(map);

        // Set the already processed flag.
        $(map.container).addClass('geolocation-processed');
      }
    });
  }

})(jQuery, Drupal, drupalSettings);
