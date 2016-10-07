<?php

namespace Drupal\geolocation\Plugin\geolocation\Geocoder;

use Drupal\geolocation\GeocoderInterface;
use Drupal\Component\Plugin\PluginBase;

/**
 * Provides the Lawyer search.
 *
 * @Geocoder(
 *   id = "google_geocoding_api",
 *   name = @Translation("Google Geocoding API"),
 * )
 */
class GoogleGeocodingAPI extends PluginBase implements GeocoderInterface {

  /**
   * {@inheritdoc}
   */
  public function getLibraryId() {
    return 'geolocation/geolocation.geocoder.googlegeocodingapi';
  }

  /**
   * {@inheritdoc}
   */
  public function getObjectName() {
    return 'googleGeocodingAPI';
  }

}
