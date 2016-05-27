/**
 * @file
 * Handle the common map.
 */

(function ($) {
    "use strict";

    Drupal.behaviors.geolocationCommonMap = {
        attach: function (context, settings) {
            if (typeof google !== 'object' || typeof google.maps !== 'object') {
              // If google maps api is not present, we can already stop.
              return;
            }

            // Their could be several maps/views present. Go over each entry.
            $.each(drupalSettings.geolocation.commonMap, function(index, settings) {

                var bubble; // Keep track if a bubble is currently open.
                var center; // Map center point.
                var zoom = 12; // Map zoom level (1-20).
                var fitBounds = false; // Whether to execute fitBounds().
                var mapTypeControl = true;
                var streetViewControl = true;
                var zoomControl = true;
                var scrollwheel = true;
                var disableDoubleClickZoom = false;
                var draggable = true;
                var height = '400px';
                var width = '100%';

                // The DOM-node the map and everything else resides in.
                var map = $('#' + index, context);

                // If the map is not present, we can go to the next entry.
                if (!map.length) {
                    return;
                }

                // A google maps API tool to re-center the map on its content.
                var bounds = new google.maps.LatLngBounds();

                // Hide the graceful-fallback HTML list; map will propably work now.
                map.children('.geolocation-common-map-locations').hide();
                // Map-container is hidden by default in case of graceful-fallback.
                var container = map.children('.geolocation-common-map-container');
                container.css({
                  height: map.data('height'),
                  width: map.data('width')
                });
                container.show();

                if (map.data('centre-lat') && map.data('centre-lng')) {
                    center = new google.maps.LatLng(map.data('centre-lat'), map.data('centre-lng'));
                }
                else {
                    center = new google.maps.LatLng(0, 0);
                }

                if (map.data('zoom')) {
                    // Drupal value is offset 0 instead of 1.
                    zoom = 1 + map.data('zoom');
                }

                if (map.data('fitbounds')) {
                    fitBounds = map.data('fitbounds');
                }

                if (map.data('maptypecontrol')) {
                    mapTypeControl = map.data('maptypecontrol');
                }
                else {
                  mapTypeControl = false;
                }

                if (map.data('streetviewcontrol')) {
                    streetViewControl = map.data('streetviewcontrol');
                }
                else {
                  streetViewControl = false;
                }

                if (map.data('zoomcontrol')) {
                    zoomControl = map.data('zoomcontrol');
                }
                else {
                  zoomControl = false;
                }

                if (map.data('scrollwheel')) {
                    scrollwheel = map.data('scrollwheel');
                }
                else {
                  scrollwheel = false;
                }

                if (map.data('disabledoubleclickzoom')) {
                    disableDoubleClickZoom = map.data('disabledoubleclickzoom');
                }
                else {
                  disableDoubleClickZoom = false;
                }

                if (map.data('draggable')) {
                    draggable = map.data('draggable');
                }
                else {
                  draggable = false;
                }

                // Load the actual map.
                // If enabled, the fitBounds() will later override these values.
                var googleMap = new google.maps.Map(container[0], {
                    center: center,
                    zoom: zoom,
                    mapTypeControl: mapTypeControl,
                    streetViewControl: streetViewControl,
                    zoomControl: zoomControl,
                    scrollwheel: scrollwheel,
                    disableDoubleClickZoom: disableDoubleClickZoom,
                    draggable: draggable
                });

                // Add the locations to the map.
                map.find('.geolocation-common-map-locations .geolocation').each(function (index, item) {
                    item = $(item);
                    var position = new google.maps.LatLng(item.data('lat'), item.data('lng'));

                    if (fitBounds) {
                        bounds.extend(position);
                    }

                    var marker = new google.maps.Marker({
                        position: position,
                        map: googleMap,
                        title: item.children('h2').text(),
                        content: item.html()
                    });

                    marker.addListener('click', function () {
                        if (bubble) bubble.close();
                        bubble = new google.maps.InfoWindow({
                            content: marker.content,
                            maxWidth: 200
                        });
                        bubble.open(googleMap, marker);
                    });
                });

                if (fitBounds) {
                    // Fit map center and zoom to all currently loaded markers.
                    googleMap.fitBounds(bounds);
                }
            });
        }
    };

})(jQuery);
