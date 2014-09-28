<?php

/**
 * @file
 * Contains \Drupal\geolocation\Plugin\Field\FieldWidget\GeolocationLatlngWidget.
 */

namespace Drupal\geolocation\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'geolocation_latlng' widget.
 *
 * @FieldWidget(
 *   id = "geolocation_latlng",
 *   label = @Translation("Geoloaction Lat/Lng"),
 *   field_types = {
 *     "geolocation"
 *   }
 * )
 */
class GeolocationLatlngWidget extends WidgetBase {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return array(
      'placeholder' => '',
    ) + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {

    $element['lat'] = array(
      '#type' => 'textfield',
      '#empty_value' => '',
      '#default_value' => (isset($items[$delta]->value)) ? $items[$delta]->value : NULL,
      '#description' => t('Latitude'),
    );

    $element['lng'] = array(
      '#type' => 'textfield',
      '#empty_value' => '',
      '#default_value' => (isset($items[$delta]->value)) ? $items[$delta]->value : NULL,
      '#description' => t('Longitude'),
    );

    return $element;
  }

}
