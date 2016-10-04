/**
 * @file
 *   Javascript for the Google geocoder function, specifically the views filter.
 */



(function ($, Drupal) {
  'use strict';

  /* global google */

  /**
   * @namespace
   */
  Drupal.geolocation = Drupal.geolocation || {};
  Drupal.geolocation.geocoder = Drupal.geolocation.geocoder || {};

  /**
   * Attach common map style functionality.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches views geolocation filter geocoder to relevant elements.
   */
  Drupal.behaviors.geolocationViewsFilterGeocoder = {
    attach: function (context) {
      var geocoder = new google.maps.Geocoder();

      $('input.geolocation-views-filter-geocoder', context)
        .autocomplete({
          autoFocus: true,
          source: function (request, response) {
            var responseData = [];
            geocoder.geocode({address: request.term}, function (results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                $.each(results, function (index, item) {
                  responseData.push({
                    value: item.formatted_address,
                    address: item
                  });
                });
              }
              response(responseData);
            });
          },
          select: function (event, ui) {
            setGeolocationFilterValues(ui.item.address.geometry, $(this), context);
          }
        })
        .change(function () {
          var $input = $(this);
          geocoder.geocode({address: $input.val()}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              setGeolocationFilterValues(results[0].geometry, $input, context);
            }
            else {
              // Alert of the error geocoding.
              alert(Drupal.t('Geocode was not successful for the following reason: ') + status);
            }
          });
        })
        .submit(function (e) {
          var $input = $(this);
          geocoder.geocode({address: $input.val()}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              setGeolocationFilterValues(results[0].geometry, $input, context);
            }
            else {
              // Alert of the error geocoding.
              e.preventDefault();
              alert(Drupal.t('Geocode was not successful for the following reason: ') + status);
            }
          });
        });
    }
  };

  /**
   * Depending on filter type, set values from google geometry.
   *
   * @param {GoogleGeometry} geometry
   * @param {jQuery} $input
   * @param {HTMLElement} context
   */
  function setGeolocationFilterValues(geometry, $input, context) {
    if ($input.data('geolocation-filter-type') == 'boundary') {
      var identifier = $input.data('geolocation-filter-identifier');
      $(context).find("input[name='" + identifier + "[lat_north_east]']").val(geometry.viewport.getNorthEast().lat);
      $(context).find("input[name='" + identifier + "[lng_north_east]']").val(geometry.viewport.getNorthEast().lng);
      $(context).find("input[name='" + identifier + "[lat_south_west]']").val(geometry.viewport.getSouthWest().lat);
      $(context).find("input[name='" + identifier + "[lng_south_west]']").val(geometry.viewport.getSouthWest().lng);
      $input.toggleClass('geolocation-filters-set');
    }
  }

})(jQuery, Drupal);
