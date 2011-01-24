// $Id$

/**
 * @file
 * Javascript for Goole Map widget of Geolocation field.
 */

// This is still pretty messy DEV-Code.
// TODO: cleanup.
(function ($) {
  var geocoder;
  var map;
  var marker;

  function codeLatLng(latlng, op) {
    if (geocoder) {
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          $("input.geolocation-lat").attr('value', latlng.lat());
          $("input.geolocation-lng").attr('value', latlng.lng());
          if (op == 'mapclick') {
            $(".geolocation-input").val(results[0].formatted_address);
          }
          /*
          // Hide Debug output, cleanup later.
          $("#lat").html("<strong>Lat:</strong> "+latlng.lat());
          $("#lng").html("<strong>Lng:</strong> "+latlng.lng());
          var str = "";
          $.each(results, function(){
            str += "<h4>"+this.formatted_address+"</h4>";
            str += "types: "+this.types.join(", ")+"<br />";
            str += "address components: <ul>"
            $.each(this.address_components, function(){
              str +="<li>"+this.types.join(", ")+": "+this.long_name+"</li>";
            });
            str +="</ul>";
          });
          $("#geocode_info").html(str);
          */
        } else {
          alert(Drupal.t('Geocoder failed due to: ') + status);
        }
      });
    }
  }

  function codeAddress() {
    var address = $(".geolocation-input").val();
    geocoder.geocode( { 'address': address }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        setMapMarker(results[0].geometry.location);
        $("input.geolocation-lat").attr('value', results[0].geometry.location.lat());
        $("input.geolocation-lng").attr('value', results[0].geometry.location.lng());
        codeLatLng(results[0].geometry.location, 'textinput');
      } else {
        alert(Drupal.t('Geocode was not successful for the following reason: ') + status);
      }
    });
  }
  
  function setMapMarker(position) {
    if (marker) {
      marker.setMap(null);
    }
    marker = new google.maps.Marker({
      map: map,
      draggable: false,
      animation: google.maps.Animation.DROP,
      position: position
    });
    $("input.geolocation-lat").attr('value', position.lat());
    $("input.geolocation-lng").attr('value', position.lng());
    codeLatLng(position, 'textinput');
    return false; // if called from <a>-Tag
  }
  
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

  Drupal.behaviors.GoogleMap = {
    attach: function(context, settings) {
      $(".geolocation-input").after('<div id="geocoder">'+ Drupal.t('Set location') +'</div>');
      $("#geocoder").click(function() {
        codeAddress();
      });

      geocoder = new google.maps.Geocoder();

      // START: Autodetect clientlocation.
      if (google.loader.ClientLocation) {
        latlng = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
        $("#address .description").append(Drupal.t(', or use the IP-based location by clicking this link') +': <b><span id="use-client-location">' + getFormattedLocation() + '</span></b>');
      }
      // END: Autodetect clientlocation.

      $("#use-client-location").click(function() {
        if (google.loader.ClientLocation) {
          latlng = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
          $(".geolocation-input").val(getFormattedLocation());
          map.setCenter(latlng);
          setMapMarker(latlng);
        }
      });

      var lat = $('input.geolocation-lat').attr('value') == '' ? Drupal.settings.map_defaults.lat : $('input.geolocation-lat').attr('value');
      var lng = $('input.geolocation-lng').attr('value') == '' ? Drupal.settings.map_defaults.lng : $('input.geolocation-lng').attr('value');

      var latlng = new google.maps.LatLng(lat, lng);
      var myOptions = {
        zoom: 7,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      map = new google.maps.Map(document.getElementById("map"), myOptions);
      
      marker = new google.maps.Marker({
        map: map,
        draggable: false,
        animation: google.maps.Animation.DROP,
        position: latlng
      });
      
      google.maps.event.addListener(map, 'click',function(me){
        codeLatLng(me.latLng, 'mapclick');
        setMapMarker(me.latLng);
      });
    }
  };
})(jQuery);
