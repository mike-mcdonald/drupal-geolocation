<?php

namespace Drupal\geolocation;

use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Trait GeoCoreInjectionTrait.
 *
 * @package \Drupal\geolocation
 */
trait GeoCoreInjectionTrait {

  /**
   * The geolocation core service.
   *
   * @var \Drupal\geolocation\GeolocationCore
   */
  protected $geolocationCore;

  /**
   * Constructs a new Date instance.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\geolocation\GeolocationCore $geolocation_core
   *   The geolocation core helper.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, GeolocationCore $geolocation_core) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);

    $this->geolocationCore = $geolocation_core;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    /** @var \Drupal\geolocation\GeolocationCore $geolocation_core */
    $geolocation_core = $container->get('geolocation.core');
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $geolocation_core
    );
  }

}
