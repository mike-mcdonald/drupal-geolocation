// $Id$

/**
 * @file
 * Javascript for Geolocation Field.
 */
(function ($) {
  function latitudeToMercator(latitude) {
    return Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180));
  }

  Drupal.html5UserGeolocationLongitudeToPx = function (longitude, leftLongitude, width) {
    return (longitude - leftLongitude + 360) / 360 % 1 * width;
  }

  Drupal.html5UserGeolocationLatitudeToPx = function (latitude, topLatitude, bottomLatitude, height) {
    return (latitudeToMercator(latitude) - latitudeToMercator(bottomLatitude)) / (latitudeToMercator(topLatitude) - latitudeToMercator(bottomLatitude)) * height;
  }

  function plot() {
    var $map = $('#geolocation-html5-map'),
      latitude = $('#geolat input').attr('value'),
      longitude = $('#geolng input').attr('value');

    if (latitude == 0 && longitude == 0) {
      return;
    }

    // Plot coords
    $('#geolocation-html5-map .dot').css({
      left: '' + Drupal.html5UserGeolocationLongitudeToPx(longitude, -168, $map.width()) + 'px',
      bottom: '' + Drupal.html5UserGeolocationLatitudeToPx(latitude, 78, -58, $map.height()) + 'px'
    }).show();

    /*
    // Show precision
    $map.siblings('.description').find('span').html(
      (Math.acos(
        Math.sin(latitude * Math.PI / 180)
          * Math.sin((latitude) * Math.PI / 180)
        + Math.cos(latitude * Math.PI / 180)
          * Math.cos((latitude) * Math.PI / 180)
          * Math.cos(Math.pow(10, -1 * Drupal.settings.html5UserGeolocationPrecision) * Math.PI / 180)
      ) * 6371).toPrecision(3)
    );
    */
  }

  function getLocation() {
    if ($('#edit-field-geolocation-und-0-save').attr('checked')) {
      var $busy = $('#geolocation-html5-messages .geolocating');
      $('#geolocation-html5-map').slideDown('fast');
      $('#geolocation-html5-map .dot').hide();

      // Get position
      $busy.show();
      navigator.geolocation.getCurrentPosition(function (position) {
        // Save coords
        $('#geolat input').attr('value', position.coords.latitude);
        $('#geolng input').attr('value', position.coords.longitude);

        plot();
        $busy.hide();
      }, function () { // getCurrentPosition error callback
        $busy.hide();
        $('#geolocation-html5-messages .not-supported').show();
        $('#edit-field-geolocation-und-0-save').attr('checked', false).change();
        $('#edit-field-geolocation-und-0-save').attr('disabled', true);
      },
      {
        maximumAge: Infinity
      });
    }
    else { // Location not checked
      $('#geolat input').val('');
      $('#geolng input').val('');
      $('#geolocation-html5-map').slideUp('fast');
    }
  }

  Drupal.behaviors.GeolocationHTML5 = {
    attach: function(context, settings) {
      if (navigator.geolocation) {
        $('#edit-field-geolocation-und-0-save:not(.geolocation-html5-processed)', context)
        .addClass('geolocation-html5-processed')
        .change(function () {
          getLocation();
        })
        .each(function () {
          $('#geolocation-html5-messages .not-supported').hide();
          if ($('#edit-field-geolocation-und-0-save').attr('checked')) {
            $('#geolocation-html5-map').slideDown('fast');
            plot();
          }
          getLocation();
        });
      }
      else { // HTML5 Geolocation not supported
        $('#edit-field-geolocation-und-0-save').attr('disabled', true);
      }
    }
  };
})(jQuery);
