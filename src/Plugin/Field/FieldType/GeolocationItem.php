<?php

/**
 * @file
 * Contains Drupal\geoloaction\Plugin\Field\FieldType\GeolocationItem.
 */

namespace Drupal\geoloaction\Plugin\Field\FieldType;

use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Plugin implementation of the 'geoloaction' field type.
 *
 * @FieldType(
 *   id = "geoloaction",
 *   label = @Translation("Geolocation"),
 *   description = @Translation("This field stores location data (lat, lng)."),
 *   default_widget = "geoloaction_latlng",
 *   default_formatter = "geoloaction_latlng"
 * )
 */
class GeolocationItem extends FieldItemBase {

  /**
   * {@inheritdoc}
   */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return array(
      'columns' = array(
        'lat' => array(
          'description' => 'Stores the latitude value',
          'type' => 'float',
          'size' => 'big',
          'not null' => TRUE,
        ),
        'lng' => array(
          'description' => 'Stores the longitude value',
          'type' => 'float',
          'size' => 'big',
          'not null' => TRUE,
        ),
        'lat_sin' => array(
          'description' => 'Stores the sine of latitude',
          'type' => 'float',
          'size' => 'big',
          'not null' => TRUE,
        ),
        'lat_cos' => array(
          'description' => 'Stores the cosine of latitude',
          'type' => 'float',
          'size' => 'big',
          'not null' => TRUE,
        ),
        'lng_rad' => array(
          'description' => 'Stores the radian longitude',
          'type' => 'float',
          'size' => 'big',
          'not null' => TRUE,
        ),
      ),
      'indexes' = array(
        'lat' => array('lat'),
        'lng' => array('lng'),
      ),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    $lat = $this->get('lat')->getValue();
    $lng = $this->get('lng')->getValue();
    return $lat === NULL || $lat === '' || $lng === '' || $lng === '';
  }

}

