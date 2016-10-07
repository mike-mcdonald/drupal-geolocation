<?php

namespace Drupal\geolocation\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\geolocation\GoogleMapsDisplayTrait;
use Symfony\Component\Validator\ConstraintViolationListInterface;

/**
 * Plugin implementation of the 'geolocation_googlegeocoder' widget.
 *
 * @FieldWidget(
 *   id = "geolocation_googlegeocoder",
 *   label = @Translation("Geolocation Google Geocoder"),
 *   field_types = {
 *     "geolocation"
 *   }
 * )
 */
class GeolocationGooglegeocoderWidget extends WidgetBase {

  use GoogleMapsDisplayTrait;

  /**
   * {@inheritdoc}
   */
  public function flagErrors(FieldItemListInterface $items, ConstraintViolationListInterface $violations, array $form, FormStateInterface $form_state) {
    foreach ($violations as $offset => $violation) {
      if ($violation->getMessageTemplate() == 'This value should not be null.') {
        $form_state->setErrorByName($items->getName(), t('No location has been selected yet for required field %field.', ['%field' => $items->getFieldDefinition()->getLabel()]));
      }
    }
    parent::flagErrors($items, $violations, $form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    $settings = [
      'populate_address_field' => FALSE,
      'target_address_field' => NULL,
      'default_longitude' => NULL,
      'default_latitude' => NULL,
      'auto_client_location' => FALSE,
      'auto_client_location_marker' => FALSE,
      'allow_override_map_settings' => FALSE,
    ];
    $settings += parent::defaultSettings();
    $settings += self::getGoogleMapDefaultSettings();

    return $settings;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $settings = $this->getSettings();
    $element = [];

    $element['default_longitude'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Default Longitude'),
      '#description' => $this->t('The default center point, before a value is set.'),
      '#default_value' => $settings['default_longitude'],
    ];

    $element['default_latitude'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Default Latitude'),
      '#description' => $this->t('The default center point, before a value is set.'),
      '#default_value' => $settings['default_latitude'],
    ];

    $element['auto_client_location'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Automatically use client location, when no value is set'),
      '#default_value' => $settings['auto_client_location'],
    ];
    $element['auto_client_location_marker'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Automatically set marker to client location as well'),
      '#default_value' => $settings['auto_client_location_marker'],
      '#states' => [
        'visible' => [
          ':input[name="fields[' . $this->fieldDefinition->getName() . '][settings_edit_form][settings][auto_client_location]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    /** @var \Drupal\Core\Entity\EntityFieldManager $field_manager */
    $field_manager = \Drupal::service('entity_field.manager');

    /** @var \Drupal\Core\Field\FieldDefinitionInterface[] $field_definitions */
    $field_definitions = $field_manager->getFieldDefinitions($this->fieldDefinition->getTargetEntityTypeId(), $this->fieldDefinition->getTargetBundle());

    $address_fields = [];
    foreach ($field_definitions as $field_definition) {
      if ($field_definition->getType() == 'address' && $field_definition->getFieldStorageDefinition()->getCardinality() == 1) {
        $address_fields[$field_definition->getName()] = $field_definition->getLabel();
      }
    }

    if (!empty($address_fields)) {
      $element['populate_address_field'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Store retrieved address data in address field?'),
        '#default_value' => $settings['populate_address_field'],
      ];

      $element['target_address_field'] = [
        '#type' => 'select',
        '#title' => $this->t('Select target field to append address data.'),
        '#description' => $this->t('Only fields of type "address" with a cardinality of 1 are available.'),
        '#options' => $address_fields,
        '#default_value' => $settings['target_address_field'],
        '#states' => [
          'visible' => [
            ':input[name="fields[' . $this->fieldDefinition->getName() . '][settings_edit_form][settings][populate_address_field]"]' => ['checked' => TRUE],
          ],
        ],
      ];
    }

    $element['allow_override_map_settings'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Allow override the map settings when create/edit an content.'),
      '#default_value' => $settings['allow_override_map_settings'],
    ];
    $element += $this->getGoogleMapsSettingsForm($settings);

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $settings = $this->getSettings();

    $summary[] = t('Default center longitude @default_longitude and latitude @default_latitude', [
      '@default_longitude' => $settings['default_longitude'],
      '@default_latitude' => $settings['default_latitude'],
    ]);

    if (!empty($settings['auto_client_location'])) {
      $summary[] = t('Will use client location automatically by default');
      if (!empty($settings['auto_client_location_marker'])) {
        $summary[] = t('Will set client location marker automatically by default');
      }
    }

    if (!empty($settings['populate_address_field'])) {
      $summary[] = t('Geocoded address will be stored in @field', ['@field' => $settings['target_address_field']]);
    }

    if (!empty($settings['allow_override_map_settings'])) {
      $summary[] = t('Users will be allowed to override the map settings for each content.');
    }

    $summary = array_merge($summary, $this->getGoogleMapsSettingsSummary($settings));

    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    $settings = $this->getGoogleMapsSettings($this->getSettings()) + $this->getSettings();

    // Get this field name and parent.
    $field_name = $this->fieldDefinition->getName();
    $parents = $form['#parents'];
    // Get the field state.
    $field_state = static::getWidgetState($parents, $field_name, $form_state);

    // Create a unique canvas id for each map of each geolocation field
    // instance.
    $field_id = preg_replace('/[^a-zA-Z0-9\-]/', '-', $this->fieldDefinition->getName());
    $canvas_id = !empty($field_state['canvas_ids'][$delta])
      ? $field_state['canvas_ids'][$delta]
      : uniqid("map-canvas-{$field_id}-");

    // Add the canvas id for this field.
    $field_state['canvas_ids'] = isset($field_state['canvas_ids'])
      ? $field_state['canvas_ids'] + [$delta => $canvas_id]
      : [$delta => $canvas_id];

    // Save the field state for this field.
    static::setWidgetState($parents, $field_name, $form_state, $field_state);

    // Get the geolocation value for this element.
    $lat = $items[$delta]->lat;
    $lng = $items[$delta]->lng;

    // Get the default values for existing field.
    $lat_default_value = isset($lat) ? $lat : $settings['default_latitude'];
    $lng_default_value = isset($lng) ? $lng : $settings['default_longitude'];

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

    // Add the map container.
    $element['map_canvas'] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#attributes' => [
        'id' => $canvas_id,
        'class' => ['geolocation-map-canvas'],
      ],
      '#attached' => [
        'library' => ['geolocation/geolocation.widgets.googlegeocoder'],
        'drupalSettings' => [
          'geolocation' => [
            'widgetSettings' => [
              $canvas_id => [
                'autoClientLocation' => $settings['auto_client_location'] ? TRUE : FALSE,
                'autoClientLocationMarker' => $settings['auto_client_location_marker'] ? TRUE : FALSE,
                'locationSet' => (!empty($lat) && !empty($lng)),
              ],
            ],
            'widgetMaps' => [
              $canvas_id => [
                'id' => $canvas_id,
                'lat' => (float) $lat_default_value,
                'lng' => (float) $lng_default_value,
                'settings' => $settings,
              ],
            ],
            'google_map_url' => $this->getGoogleMapsApiUrl(),
          ],
        ],
      ],
    ];
    \Drupal::service('geolocation.core')->attachGeocoder($element);

    if ($settings['populate_address_field']) {
      $element['map_canvas']['#attached']['drupalSettings']['geolocation']['widgetSettings'][$canvas_id]['addressFieldTarget'] = $settings['target_address_field'];

      foreach ([
        'country_code',
        'administrative_area',
        'locality',
        'dependent_locality',
        'postal_code',
        'address_line1',
      ] as $component) {
        $element[$component] = [
          '#type' => 'hidden',
          '#attributes' => [
            'class' => ['geolocation-hidden-' . $component],
          ],
        ];
      }
    }

    if ($settings['allow_override_map_settings']) {
      if (!empty($items[$delta]->data['google_map_settings'])) {
        $map_settings = [
          'google_map_settings' => $items[$delta]->data['google_map_settings'],
        ];
      }
      else {
        $map_settings = $settings;
      }
      $element += $this->getGoogleMapsSettingsForm($map_settings);
    }

    // Wrap the whole form in a container.
    $element += [
      '#type' => 'fieldset',
      '#title' => $element['#title'],
      '#attributes' => [
        'class' => ['canvas-' . $canvas_id],
      ],
    ];

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function massageFormValues(array $values, array $form, FormStateInterface $form_state) {
    $values = parent::massageFormValues($values, $form, $form_state);

    if ($this->settings['allow_override_map_settings']) {
      foreach ($values as $delta => $item_values) {
        if (!empty($item_values['google_map_settings'])) {
          $values[$delta]['data']['google_map_settings'] = $item_values['google_map_settings'];
        }
      }
    }

    return $values;
  }

}
