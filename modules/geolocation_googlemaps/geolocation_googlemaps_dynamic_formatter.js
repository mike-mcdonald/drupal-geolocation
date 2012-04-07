/**
 * @file Javascript for Goole Map Dynamic API Formatter javascript code.
 * 
 * @author Lukasz Klimek http://www.klimek.ws
 */
(function($) {

  Drupal.geolocation = new Object();
  Drupal.geolocation.maps = new Array();
  Drupal.geolocation.markers = new Array();

  Drupal.behaviors.geolocationDynamicMapFormatter = {

    attach : function(context, settings) {

      // Work on each map
      $.each(settings.geolocation, function(i, mapDefaults) {

        // Only make this once ;)
        $("#geolocation-googlemaps-dynamic-" + i).once('geolocationDynamicMapFormatter', function() {

          var map_type;
          var mapOptions;

          var lat = mapDefaults.position.lat;
          var lng = mapDefaults.position.lng;
          var latLng = new google.maps.LatLng(lat, lng);

          switch (mapDefaults.settings.map_maptype) {
            case 'satellite':
              map_type = google.maps.MapTypeId.SATELLITE;
              break;

            case 'terrain':
              map_type = google.maps.MapTypeId.TERRAIN;
              break;

            case 'hybrid':
              map_type = google.maps.MapTypeId.HYBRID;
              break;

            default:
              map_type = google.maps.MapTypeId.ROADMAP;
              break;
          }

          mapOptions = {
            zoom : parseInt(mapDefaults.settings.map_zoomlevel) + 0,
            center : latLng,
            mapTypeId : map_type,
            scrollwheel : true
          };

          // Create map
          Drupal.geolocation.maps[i] = new google.maps.Map(document.getElementById("geolocation-googlemaps-dynamic-" + i), mapOptions);

          // Create and place marker
          Drupal.geolocation.markers[i] = new google.maps.Marker({
            map : Drupal.geolocation.maps[i],
            draggable : false,
            icon : mapDefaults.settings.marker_icon,
            position : latLng
          });
        });
      });
    }
  };
}(jQuery));