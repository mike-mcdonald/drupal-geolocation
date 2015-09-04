<?php
/**
 * @file
 * Contains \Drupal\geolocation\Plugin\Field\FieldWidget\GeolocationGooglegeocoderWidget.
 */

namespace Drupal\geolocation\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'geolocation_googlegeocoder' widget.
 *
 * @FieldWidget(
 *   id = "geolocation_googlegeocoder",
 *   label = @Translation("Geoloaction Google Geocoder"),
 *   field_types = {
 *     "geolocation"
 *   }
 * )
 */
class GeolocationGooglegeocoderWidget extends WidgetBase {

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {

    // Create a unique canvas id for each map of each geolocation field instance.
    $field_name = $this->fieldDefinition->getName();
    $canvas_id = 'map_canvas_' . $field_name . '_' . $delta;

    $lat = $items[$delta]->lat;
    $lng = $items[$delta]->lng;

    // Get the default values for existing field.
    $lat_default_value = isset($lat) ? $lat : NULL;
    $lng_default_value = isset($lng) ? $lng : NULL;

    // The map container.
    $element['map_canvas'] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#attributes' => [
        'id' => $canvas_id,
        'class' => ['geolocation-map-canvas'],
      ],
    ];

    // Hidden lat,lng input fields.
    $element['lat'] = [
      '#type' => 'hidden',
      '#default_value' => $lat_default_value,
      '#attributes' => ['class' => ['geolocation-hidden-lat']],
    ];
    $element['lng'] = [
      '#type' => 'hidden',
      '#default_value' => $lng_default_value,
      '#attributes' => ['class' => ['geolocation-hidden-lng']],
    ];

    // Make default values available as javascript settings. Example: To access
    // the default lat value via javascript use: drupalSettings.mapDefaults.lat
    $data = [
      'defaults' => [
        "$canvas_id" => [
          'lat' => $lat_default_value,
          'lng' => $lng_default_value,
        ],
      ],
    ];

    // Attach widget library and js settings
    $element['#attached'] = [
      'library' => [
        'geolocation/geolocation.widgets.googlegeocoder',
      ],
      'drupalSettings' => [
        'geolocation' => $data
      ],
    ];

    // Wrap the whole form in a container.
    $element += [
      '#type' => 'item',
      '#title' => $element['#title'],
    ];

    return $element;
  }
}
