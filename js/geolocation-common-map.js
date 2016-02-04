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

            var bubble; // Keep track if a bubble is currently open.
            var center; // Map center point.
            // The DOM-node the map and everything else resides in.
            var map = $('#' + drupalSettings.geolocation.commonMap.id, context);
            // A google maps API tool to re-center the map on its content.
            var bounds = new google.maps.LatLngBounds();

            // Hide the graceful-fallback HTML list; map will propably work now.
            map.children('.geolocation-common-map-locations').hide();
            // Map-container is hidden by default in case of graceful-fallback.
            var container = map.children('.geolocation-common-map-container');
            container.show();

            if (map.data('centre-lat') && map.data('centre-lng')) {
                center = new google.maps.LatLng(map.data('centre-lat'), map.data('centre-lng'));
                bounds.extend(center);
            }
            else {
                center = new google.maps.LatLng(0, 0);
            }

            // Load the actual map.
            var googleMap = new google.maps.Map(container[0], {
                center: center,
                zoom: 12 // The fitBounds() later overrides this.
            });

            // Add the locations to the map.
            map.find('.geolocation-common-map-locations .geolocation').each(function(index, item) {
                item = $(item);
                var position = new google.maps.LatLng(item.data('lat'), item.data('lng'));

                bounds.extend(position);

                var marker = new google.maps.Marker({
                    position: position,
                    map: googleMap,
                    title: item.children('h2').text(),
                    content: item.html()
                });

                marker.addListener('click', function() {
                    if (bubble) bubble.close();
                    bubble = new google.maps.InfoWindow({
                        content: marker.content,
                        maxWidth: 200
                    });
                    bubble.open(googleMap, marker);
                });
            });

            // Fit map center and zoom to all currently loaded markers.
            googleMap.fitBounds(bounds);
        }
    };

})(jQuery);
