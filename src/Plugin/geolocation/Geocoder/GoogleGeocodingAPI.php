<?php

namespace Drupal\geolocation\Plugin\geolocation\Geocoder;

use Drupal\geolocation\GeocoderInterface;
use Drupal\Component\Plugin\PluginBase;
use Drupal\geolocation\GoogleMapsDisplayTrait;

/**
 * Provides the Lawyer search.
 *
 * @Geocoder(
 *   id = "google_geocoding_api",
 *   name = @Translation("Google Geocoding API"),
 * )
 */
class GoogleGeocodingAPI extends PluginBase implements GeocoderInterface {

  use GoogleMapsDisplayTrait;

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

  /**
   * Attach additional data.
   *
   * @param array $render_array
   *   Render array.
   */
  public function attachGeocoder(array &$render_array) {
    $render_array = array_merge_recursive($render_array, [
      '#attached' => [
        'drupalSettings' => [
          'geolocation' => [
            'google_map_url' => $this->getGoogleMapsApiUrl(),
          ],
        ],
      ],
    ]);
  }

}
