/**
 * @file
 *   Javascript for the Google geocoder function, specifically the views filter.
 */

(function ($, Drupal) {
  'use strict';

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

      $('input.geolocation-views-filter-geocoder', context).each(function (index, input) {
        input = $(input);
        input.autocomplete({
          autoFocus: true,
          source: function (request, response) {
            Drupal.geolocation.geocoder.autocomplete(request.term, response);
          },

          /**
           * Option form autocomplete selected.
           *
           * @param {Object} event - See jquery doc
           * @param {Object} ui - See jquery doc
           * @param {Object} ui.item - See jquery doc
           * @param {GoogleAddress} ui.item.address - Google address compatible
           */
          select: function (event, ui) {
            setGeolocationFilterValues(ui.item.address.geometry, input, context);
          }
        })
        .change(function () {
          Drupal.geolocation.geocoder.geocode(input.val(), function (result) {
            if (result) {
              setGeolocationFilterValues(result.geometry, input, context);
            }
          });
        })
        .submit(function (e) {
          Drupal.geolocation.geocoder.geocode(input.val(), function (result) {
            if (result) {
              setGeolocationFilterValues(result.geometry, input, context);
            }
          });
        });
      });
    }
  };

  /**
   * Depending on filter type, set values from google geometry.
   *
   * @param {GoogleGeometry} geometry - retrieved geocoded geometry
   * @param {jQuery} $input - input selector to fill
   * @param {HTMLElement} context - context to work on
   */
  function setGeolocationFilterValues(geometry, $input, context) {
    if ($input.data('geolocation-filter-type') === 'boundary') {
      var identifier = $input.data('geolocation-filter-identifier');
      $(context).find("input[name='" + identifier + "[lat_north_east]']").val(geometry.viewport.getNorthEast().lat);
      $(context).find("input[name='" + identifier + "[lng_north_east]']").val(geometry.viewport.getNorthEast().lng);
      $(context).find("input[name='" + identifier + "[lat_south_west]']").val(geometry.viewport.getSouthWest().lat);
      $(context).find("input[name='" + identifier + "[lng_south_west]']").val(geometry.viewport.getSouthWest().lng);
      $input.toggleClass('geolocation-filters-set');
    }
  }

})(jQuery, Drupal);
