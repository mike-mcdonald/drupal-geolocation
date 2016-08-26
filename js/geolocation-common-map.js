/**
 * @file
 * Handle the common map.
 */

/**
 * @name CommonMapUpdateSettings
 * @property {String} settings.client_location.boundary_filter
 * @property {String} settings.client_location.parameter_identifier
 */

/**
 * @name CommonMapSettings
 * @property {String} view_id
 * @property {String} current_display_id
 * @property {Object} settings
 *
 * @property {CommonMapUpdateSettings} settings.client_location
 * @property {String} settings.client_location.enable
 * @property {String} settings.client_location.update_map
 *
 * @property {CommonMapUpdateSettings} settings.dynamic_map
 * @property {String} settings.dynamic_map.enable
 * @property {String} settings.dynamic_map.hide_form
 * @property {String} settings.dom_id
 *
 * @property {GoogleMapSettings} settings.google_map_settings
 */

/**
 * @property {CommonMapSettings[]} drupalSettings.geolocation.commonMap
 */

(function ($, Drupal) {
  'use strict';

  /* global google */

  var bubble; // Keep track if a bubble is currently open.
  var currentMarkers = []; // Keep track of all currently attached markers.
  var lastMapBounds = null; // Keep track of all currently attached markers.

  /**
   * @namespace
   */
  Drupal.geolocation = Drupal.geolocation || {};

  /**
   * Attach common map style functionality.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches common map style functionality to relevant elements.
   */
  Drupal.behaviors.geolocationCommonMap = {
    attach: function (context, settings) {
      if (typeof Drupal.geolocation.loadGoogle === 'function') {
        // First load the library from google.
        Drupal.geolocation.loadGoogle(function () {
          initialize(settings.geolocation, context);
        });
      }
    }
  };

  function initialize(settings, context) {
    // Their could be several maps/views present. Go over each entry.
    /**
     * @param {String} mapId
     * @param {CommonMapSettings} mapSettings
     */
    $.each(settings.commonMap, function (mapId, mapSettings) {

      var ajaxViewsEnabled = false;
      if (
        typeof Drupal.views !== 'undefined'
        && typeof Drupal.views.ajaxView !== 'undefined'
      ) {
        ajaxViewsEnabled = true;
      }

      // The DOM-node the map and everything else resides in.
      var map = $('#' + mapId, context);

      // If the map is not present, we can go to the next entry.
      if (!map.length) {
        return;
      }

      var exposedForm = $('form[id^=views-exposed-form-' + mapSettings.view_id.replace(/_/g, '-') + ']');
      if (exposedForm.length) {
        exposedForm = exposedForm.first();
      }
      else {
        exposedForm = null;
      }

      // Hide the graceful-fallback HTML list; map will propably work now.
      // Map-container is not hidden by default in case of graceful-fallback.
      map.children('.geolocation-common-map-locations').hide();

      var geolocationMap = {};
      geolocationMap.settings = mapSettings.settings;

      geolocationMap.container = map.children('.geolocation-common-map-container');
      geolocationMap.container.show();

      var googleMap = null;

      if (typeof Drupal.geolocation.maps !== 'undefined') {
        $.each(Drupal.geolocation.maps, function (index, item) {
          if (typeof item.container !== 'undefined') {
            if (item.container.is(geolocationMap.container)) {
              googleMap = item.googleMap;
            }
          }
        });
      }

      if (typeof googleMap !== 'undefined' && googleMap !== null) {
        // Nothing to do right now.
      }
      else if (map.data('centre-lat') && map.data('centre-lng')) {
        geolocationMap.lat = map.data('centre-lat');
        geolocationMap.lng = map.data('centre-lng');

        googleMap = Drupal.geolocation.addMap(geolocationMap);
      }
      else {
        geolocationMap.lat = geolocationMap.lng = 0;

        googleMap = Drupal.geolocation.addMap(geolocationMap);
      }

      /**
       * Update the view depending on settings and capability.
       *
       * One of several states might occur now. Possible state depends on whether:
       * - view using AJAX is enabled
       * - map view is the containing (page) view or an attachment
       * - the exposed form is present and contains the boundary filter
       * - map settings are consistent
       *
       * Given these factors, map boundary changes can be handled in one of three ways:
       * - trigger the views AJAX "RefreshView" command
       * - trigger the exposed form causing a regular POST reload
       * - fully reload the website
       *
       * These possibilities are ordered by UX preference.
       *
       * @param {Object} settings The settings to update the map.
       * @param {Boolean} mapReset Whether this update is triggered by the map itself or not.
       */
      if (typeof googleMap.updateDrupalView === 'undefined') {
        googleMap.updateDrupalView = function (settings, mapReset) {
          var currentBounds = googleMap.getBounds();
          var update_path = '';

          if (
            typeof settings.boundary_filter !== 'undefined'
          ) {
            if (ajaxViewsEnabled === true) {
              var view = $('.js-view-dom-id-' + settings.dom_id).first();

              if (typeof Drupal.views.instances['views_dom_id:' + settings.dom_id] === 'undefined') {
                return;
              }

              if (mapReset === true) {
                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings['geolocation_common_map_dynamic_map_reset'] = true;
              }
              else {

                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lat_north_east]'] = currentBounds.getNorthEast().lat();
                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lng_north_east]'] = currentBounds.getNorthEast().lng();
                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lat_south_west]'] = currentBounds.getSouthWest().lat();
                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lng_south_west]'] = currentBounds.getSouthWest().lng();

                Drupal.views.instances['views_dom_id:' + settings.dom_id].settings['geolocation_common_map_dynamic_map_reset'] = false;
              }

              view.trigger('RefreshView');

              delete Drupal.views.instances['views_dom_id:' + settings.dom_id].settings['geolocation_common_map_dynamic_map_reset'];

              delete Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lat_north_east]'];
              delete Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lng_north_east]'];
              delete Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lat_south_west]'];
              delete Drupal.views.instances['views_dom_id:' + settings.dom_id].settings[settings.parameter_identifier + '[lng_south_west]'];
            }
            // AJAX disabled, form available. Set boundary values and trigger.
            else if (exposedForm) {

              if (mapReset === true) {
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lat_north_east]"]').val('');
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lng_north_east]"]').val('');
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lat_south_west]"]').val('');
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lng_south_west]"]').val('');
              }
              else {
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lat_north_east]"]').val(currentBounds.getNorthEast().lat());
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lng_north_east]"]').val(currentBounds.getNorthEast().lng());
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lat_south_west]"]').val(currentBounds.getSouthWest().lat());
                exposedForm.find('input[name="' + settings.parameter_identifier + '[lng_south_west]"]').val(currentBounds.getSouthWest().lng());
              }

              exposedForm.find('.form-submit').trigger('click');
            }
            // No AJAX, no form, just enforce a page reload with GET parameters set.
            else {
              if (window.location.search.length) {
                update_path = window.location.search + '&';
              }
              else {
                update_path = '?';
              }
              if (mapReset !== true) {
                update_path += settings.parameter_identifier + '[lat_north_east]=' + currentBounds.getNorthEast().lat();
                update_path += '&' + settings.parameter_identifier + '[lng_north_east]=' + currentBounds.getNorthEast().lng();
                update_path += '&' + settings.parameter_identifier + '[lat_south_west]=' + currentBounds.getSouthWest().lat();
                update_path += '&' + settings.parameter_identifier + '[lng_south_west]=' + currentBounds.getSouthWest().lng();
              }
              window.location = update_path;
            }
          }
        };
      }

      if (typeof map.data('clientlocation') !== 'undefined') {
        // Only act when location still unknown.
        if (typeof map.data('centre-lat') === 'undefined' || typeof map.data('centre-lng') === 'undefined') {
          if (
            navigator.geolocation
            && typeof mapSettings.client_location !== 'undefined'
            && mapSettings.client_location.enable === true
          ) {
            navigator.geolocation.getCurrentPosition(function (position) {
              map.data('centre-lat', position.coords.latitude);
              map.data('centre-lng', position.coords.longitude);
              googleMap.setCenter({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              googleMap.setZoom(parseInt(mapSettings.settings.google_map_settings.zoom));

              if (
                map.data('geolocationAjaxProcessed') !== 1
                && typeof mapSettings.client_location.update_map !== 'undefined'
                && mapSettings.client_location.update_map === true
              ) {
                googleMap.updateDrupalView(mapSettings.client_location, true);
              }
            });
          }
        }
      }
      $.each(currentMarkers, function (markerIndex, marker) {
        marker.setMap(null);
      });

      // A google maps API tool to re-center the map on its content.
      var bounds = new google.maps.LatLngBounds();

      // Add the locations to the map.
      map.find('.geolocation-common-map-locations .geolocation').each(function (key, location) {
        location = $(location);
        var position = new google.maps.LatLng(location.data('lat'), location.data('lng'));

        bounds.extend(position);

        var marker = new google.maps.Marker({
          position: position,
          map: googleMap,
          title: location.children('h2').text(),
          content: location.html()
        });

        currentMarkers.push(marker);

        marker.addListener('click', function () {
          if (bubble) {
            bubble.close();
          }
          bubble = new google.maps.InfoWindow({
            content: marker.content,
            maxWidth: 200
          });
          bubble.open(googleMap, marker);
        });
      });

      if (
        (
          map.data('fitbounds') === 1
          && map.data('geolocationAjaxProcessed') !== 1
        )
        || map.data('mapReset') === 1
      ) {
        // Fit map center and zoom to all currently loaded markers.
        googleMap.fitBounds(bounds);
      }

      /**
       * Dynamic map handling aka "AirBnB mode".
       */
      if (
        typeof mapSettings.dynamic_map !== 'undefined'
        && mapSettings.dynamic_map.enable
      ) {
        if (
          exposedForm
          && mapSettings.dynamic_map.hide_form
          && typeof mapSettings.dynamic_map.parameter_identifier !== 'undefined'
        ) {
          exposedForm.find('input[name^="' + mapSettings.dynamic_map.parameter_identifier + '"]').each(function (index, item) {
            $(item).parent().hide();
          });

          // Hide entire form if it's empty now, except form-submit.
          if (exposedForm.find('input:visible:not(.form-submit)').length === 0) {
            exposedForm.hide();
          }
        }

        if (map.data('geolocationAjaxProcessed') !== 1) {

          googleMap.addListener('idle', function () {
            var currentMapBounds = googleMap.getBounds();
            if (
              typeof lastMapBounds === 'undefined'
              || lastMapBounds === null
              || lastMapBounds.equals(currentMapBounds)
            ) {
              lastMapBounds = currentMapBounds;
              return;
            }
            lastMapBounds = currentMapBounds;
            googleMap.updateDrupalView(mapSettings.dynamic_map);
          });
        }
      }
    });
  }

  /**
   * Insert updated map contents into the document.
   *
   * @param {Drupal.Ajax} ajax
   *   {@link Drupal.Ajax} object created by {@link Drupal.ajax}.
   * @param {object} response
   *   The response from the Ajax request.
   * @param {string} response.data
   *   The data to use with the jQuery method.
   * @param {string} [response.method]
   *   The jQuery DOM manipulation method to be used.
   * @param {string} [response.selector]
   *   A optional jQuery selector string.
   * @param {object} [response.settings]
   *   An optional array of settings that will be used.
   * @param {number} [status]
   *   The XMLHttpRequest status.
   */
  var detachedMap = null;
  Drupal.AjaxCommands.prototype.geolocationCommonMapsUpdate = function (ajax, response, status) {
    // Get information from the response. If it is not there, default to our presets.
    var $wrapper = response.selector ? $(response.selector) : $(ajax.wrapper);
    var settings = response.settings || ajax.settings || drupalSettings;
    var fitBounds = response.fitBounds ? true : false;
    var $new_content_wrapped = $('<div></div>').html(response.data);
    var $new_content = $new_content_wrapped.contents();

    if ($new_content.length !== 1 || $new_content.get(0).nodeType !== 1) {
      $new_content = $new_content_wrapped;
    }

    Drupal.detachBehaviors($wrapper.get(0), settings);

    detachedMap = $wrapper.find('.geolocation-common-map-container').detach();
    $new_content.find('.geolocation-common-map-container').replaceWith(detachedMap);
    $new_content.find('.geolocation-common-map').data('geolocation-ajax-processed', 1);

    $wrapper.replaceWith($new_content);

    /**
     * @param {GoogleMap} item.googleMap
     */
    $.each(Drupal.geolocation.maps, function (index, item) {
      if (item.container[0] === detachedMap[0]) {
        if (fitBounds) {
          $wrapper.find('.geolocation-common-map').data('map-reset', 1);
        }
      }
    });

    // Attach all JavaScript behaviors to the new content, if it was
    // successfully added to the page, this if statement allows
    // `#ajax['wrapper']` to be optional.
    if ($new_content.parents('html').length > 0) {
      Drupal.attachBehaviors($new_content.get(0), settings);
    }
  };

})(jQuery, Drupal);
