
/**
 * @file
 * Javascript for Goole Map widget of Geolocation field.
 */

// This is still pretty messy DEV-Code.
// TODO: cleanup.
(function ($) {
  var geocoder;
  Drupal.Geolocation = new Object();
  Drupal.Geolocation.maps = new Array();
  Drupal.Geolocation.markers = new Array();

  /**
   * Set the latitude and longitud values to the input fields
   * And optionaly update the address field
   *
   * @param latLng
   *   a location (latLng) object from google maps api
   * @param i
   *   the index from the maps array we are working on
   * @param op
   *   the op that was performed
   */
  function codeLatLng(latLng, i, op) {
    // Update the lat and lng input fields
    $('#geolocation-lat-' + i + ' input').attr('value', latLng.lat());
    $('#geolocation-lng-' + i + ' input').attr('value', latLng.lng());
 
    // Update the address field
    if ((op == 'mapclick' || op == 'geocoder') && geocoder) {
      geocoder.geocode({'latLng': latLng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          $('#geolocation-address-' + i + ' input').val(results[0].formatted_address);
          if (op == 'geocoder') {
            setZoom(i, results[0].geometry.location_type);
          }
        }
        else {
          $('#geolocation-address-' + i + ' input').val('');
          if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
            alert(Drupal.t('Geocoder failed due to: ') + status);
          }
        }
      });
    }
  }
 
  /**
   * Get the location from the address field
   *
   * @param i
   *   the index from the maps array we are working on
   */
  function codeAddress(i) {
    var address = $('#geolocation-address-' + i + ' input').val();
    geocoder.geocode( { 'address': address }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        Drupal.Geolocation.maps[i].setCenter(results[0].geometry.location);
        setMapMarker(results[0].geometry.location, i);
        codeLatLng(results[0].geometry.location, i, 'textinput');
        setZoom(i, results[0].geometry.location_type);
      } else {
        alert(Drupal.t('Geocode was not successful for the following reason: ') + status);
      }
    });
  }

  /**
   * Set zoom level depending on accuracy (location_type)
   *
   * @param location_type
   *   location type as provided by google maps after geocoding a location
   */
   function setZoom(i, location_type) {
     if (location_type == 'APPROXIMATE') {
       Drupal.Geolocation.maps[i].setZoom(10);
     }
     else if (location_type == 'GEOMETRIC_CENTER') {
       Drupal.Geolocation.maps[i].setZoom(12);
     }
     else if (location_type == 'RANGE_INTERPOLATED' || location_type == 'ROOFTOP') {
       Drupal.Geolocation.maps[i].setZoom(16);
     }
   }

   
  /**
   * Set/Update a marker on a map
   *
   * @param latLng
   *   a location (latLng) object from google maps api
   * @param i
   *   the index from the maps array we are working on
   */
  function setMapMarker(latLng, i) {
    if (Drupal.Geolocation.markers[i]) {
      Drupal.Geolocation.markers[i].setMap(null);
    }
    Drupal.Geolocation.markers[i] = new google.maps.Marker({
      map: Drupal.Geolocation.maps[i],
      draggable: false,
      animation: google.maps.Animation.DROP,
      position: latLng
    });
    return false; // if called from <a>-Tag
  }
 
  /**
   * Get the current user location if one is given
   * @return
   *   Formatted location
   */
  function getFormattedLocation() {
    if (google.loader.ClientLocation.address.country_code == "US" &&
      google.loader.ClientLocation.address.region) {
      return google.loader.ClientLocation.address.city + ", " 
          + google.loader.ClientLocation.address.region.toUpperCase();
    } else {
      return  google.loader.ClientLocation.address.city + ", "
          + google.loader.ClientLocation.address.country_code;
    }
  }
 
  function clearLocation(i) {
    $('#geolocation-lat-' + i + ' input').attr('value', '');
    $('#geolocation-lng-' + i + ' input').attr('value', '');
    $('#geolocation-address-' + i + ' input').attr('value', '');
    Drupal.Geolocation.markers[i].setMap();
  }
 
  function handleNoGeolocation(errorFlag, i) {
    var siberia = new google.maps.LatLng(60, 105);
    var newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687);
    if (errorFlag == true) {
      alert("Geolocation service failed. We've placed you in NewYork.");
      initialLocation = newyork;
    } else {
      alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
      initialLocation = siberia;
    }
    Drupal.Geolocation.maps[i].setCenter(initialLocation);
    setMapMarker(initialLocation, i);
  }

  Drupal.behaviors.GoogleMap = {
    attach: function(context, settings) {
      geocoder = new google.maps.Geocoder();

      var lat;
      var lng;
      var latLng;
      var myOptions;
      var browserSupportFlag =  new Boolean();
      var singleClick;

      $.each(Drupal.settings.map_defaults, function(i, e){

        $('#geolocation-address-' + i + ' input').keypress(function(e){
          if(e.which == 13){
            e.preventDefault();
            codeAddress(i);
          }
        });
        $('#geolocation-geocode-' + i).click(function(e) {
          codeAddress(i);
        });

        $('#geolocation-remove-' + i).click(function(e) {
          clearLocation(i);
        });
        // START: Autodetect clientlocation.
        // First use browser geolocation
        if(navigator.geolocation) {
          browserSupportFlag = true;
          $('#geolocation-help-' + i + ':not(.geolocation-processed)').addClass('geolocation-processed').append(Drupal.t(', or use your browser geolocation system by clicking this link') +': <b><span id="geolocation-client-location-' + i + '" class="geolocation-client-location">My Location</span></b>');
          // Set current user location, if available
          $('#geolocation-client-location-' + i + ':not(.geolocation-processed)').addClass('geolocation-processed').click(function() {
            navigator.geolocation.getCurrentPosition(function(position) {
              latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
              Drupal.Geolocation.maps[i].setCenter(latLng);
              setMapMarker(latLng, i);
              codeLatLng(latLng, i, 'geocoder');
            }, function() {
              handleNoGeolocation(browserSupportFlag, i);
            });
          });
        }
        // If browser geolication is not supoprted, try ip location
        else if (google.loader.ClientLocation) {
          latLng = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
          $('#geolocation-help-' + i + ':not(.geolocation-processed)').addClass('geolocation-processed').append(Drupal.t(', or use the IP-based location by clicking this link') +': <b><span id="geolocation-client-location-' + i + '" class="geolocation-client-location">' + getFormattedLocation() + '</span></b>');

          // Set current user location, if available
          $('#geolocation-client-location-' + i + ':not(.geolocation-processed)').addClass('geolocation-processed').click(function() {
            latLng = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
            Drupal.Geolocation.maps[i].setCenter(latLng);
            setMapMarker(latLng, i);
            codeLatLng(latLng, i, 'geocoder');
          });
        }
        // END: Autodetect clientlocation.
        // Get current/default values

        lat = $('#geolocation-lat-' + i + ' input').attr('value') == '' ? e.lat : $('#geolocation-lat-' + i + ' input').attr('value');
        lng = $('#geolocation-lng-' + i + ' input').attr('value') == '' ? e.lng : $('#geolocation-lng-' + i + ' input').attr('value');
        latLng = new google.maps.LatLng(lat, lng);

        // Set map options
        myOptions = {
          zoom: 7,
          center: latLng,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          scrollwheel: false
        }

        // Create map
        Drupal.Geolocation.maps[i] = new google.maps.Map(document.getElementById("geolocation-map-" + i), myOptions);

        // Set initial marker
        codeLatLng(latLng, i, 'mapclick');
        setMapMarker(latLng, i);

        // Listener to set marker
        google.maps.event.addListener(Drupal.Geolocation.maps[i], 'click', function(me){
          // Set a timeOut so that it doesn't execute if dbclick is detected
          singleClick = setTimeout(function(){
            codeLatLng(me.latLng, i, 'mapclick');
            setMapMarker(me.latLng, i);
          }, 500);
        });

        // Detect double click to avoid setting marker
        google.maps.event.addListener(Drupal.Geolocation.maps[i], 'dblclick', function(me){
          clearTimeout(singleClick);
        });
      });
    }
  };
})(jQuery);
