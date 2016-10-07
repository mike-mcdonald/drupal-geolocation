<?php

namespace Drupal\geolocation;

use Drupal\Component\Plugin\PluginInspectionInterface;

/**
 * Defines an interface for geolocation geocoder plugins.
 */
interface GeocoderInterface extends PluginInspectionInterface {

  /**
   * Return the name of the JS library.
   *
   * @return string
   *   Library.
   */
  public function getLibraryId();

  /**
   * Return the geocoder object name.
   *
   * @return string
   *   Function name.
   */
  public function getObjectName();

}
