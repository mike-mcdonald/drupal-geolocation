<?php

namespace Drupal\geolocation\Plugin\views\style;

use Drupal\views\Plugin\views\style\StylePluginBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\geolocation\Plugin\views\field\GeolocationField;
use Drupal\Component\Utility\Html;

/**
 * Allow to display several field items on a common map.
 *
 * @ingroup views_style_plugins
 *
 * @ViewsStyle(
 *   id = "maps_common",
 *   title = @Translation("Geolocation - CommonMap"),
 *   help = @Translation("Display geolocations on a common map."),
 *   theme = "views_view_list",
 *   display_types = {"normal"},
 * )
 */
class CommonMap extends StylePluginBase {

  protected $usesFields = TRUE;
  protected $usesRowPlugin = TRUE;
  protected $usesRowClass = FALSE;
  protected $usesGrouping = FALSE;

  /**
   * Overrides \Drupal\views\Plugin\views\display\PathPluginBase::render().
   */
  public function render() {

    if (!empty($this->options['geolocation_field'])) {
      $geo_field = $this->options['geolocation_field'];
      $this->view->field[$geo_field]->options['exclude'] = TRUE;
    }
    else {
      \Drupal::logger('geolocation')->error("The geolocation common map views style was called without a geolocation field defined in the views style settings.");
      return [];
    }

    if (!empty($this->options['title_field'])) {
      $title_field = $this->options['title_field'];
      $this->view->field[$title_field]->options['exclude'] = TRUE;
    }

    $id = Html::getUniqueId($this->pluginId);

    $build = [
      '#theme' => 'geolocation_common_map_display',
      '#id' => $id,
      '#attached' => [
        'library' => [
          'geolocation/geolocation.commonmap',
        ],
        'drupalSettings' => [
          'geolocation' => [
            'commonMap' => [],
          ],
        ],
      ],
    ];

    $build['#attached']['drupalSettings']['geolocation']['commonMap'][$id] = [
      'settings' => [],
    ];

    foreach ($this->view->result as $row) {
      if (!empty($title_field)) {
        $title_field_handler = $this->view->field[$title_field];
        $title_build = array(
          '#theme' => $title_field_handler->themeFunctions(),
          '#view' => $title_field_handler->view,
          '#field' => $title_field_handler,
          '#row' => $row,
        );
      }

      if ($this->view->field[$geo_field] instanceof GeolocationField) {
        /** @var \Drupal\geolocation\Plugin\views\field\GeolocationField $geolocation_field */
        $geolocation_field = $this->view->field[$geo_field];
        $geo_items = $geolocation_field->getItems($row);
      }
      else {
        return $build;
      }

      foreach ($geo_items as $delta => $item) {
        $geolocation = $item['raw'];
        $position = [
          'lat' => $geolocation->lat,
          'lng' => $geolocation->lng,
        ];

        $build['#locations'][] = [
          '#theme' => 'geolocation_common_map_location',
          '#content' => $this->view->rowPlugin->render($row),
          '#title' => empty($title_build) ? '' : $title_build,
          '#position' => $position,
        ];
      }
    }

    $centre = NULL;
    $zoom = NULL;
    $fitbounds = FALSE;
    if (!is_array($this->options['centre'])) {
      return $build;
    }

    foreach ($this->options['centre'] as $id => $option) {
      // Ignore if not enabled.
      if (empty($option['enable'])) {
        continue;
      }

      // Ignore if fitBounds is enabled, as it will supersede any other option.
      if ($fitbounds) {
        break;
      }

      // Ignore if center is already set.
      if (!empty($centre['lat']) && !empty($centre['lng'])) {
        break;
      }

      switch ($id) {

        case 'fixed_value':
          $centre = [
            'lat' => (float) $option['settings']['latitude'],
            'lng' => (float) $option['settings']['longitude'],
          ];
          $zoom = (int) $option['settings']['zoom'];
          break;

        case (preg_match('/proximity_filter_*/', $id) ? TRUE : FALSE):
          $filter_id = substr($id, 17);
          /** @var \Drupal\geolocation\Plugin\views\filter\ProximityFilter $handler */
          $handler = $this->displayHandler->getHandler('filter', $filter_id);
          if ($handler->value['lat'] && $handler->value['lng']) {
            $centre = [
              'lat' => (float) $handler->value['lat'],
              'lng' => (float) $handler->value['lng'],
            ];
          }
          break;

        case 'first_row':
          if (!empty($build['#locations'][0]['#position'])) {
            $centre = $build['#locations'][0]['#position'];
          }
          $zoom = (int) $option['settings']['zoom'];
          break;

        case 'fit_bounds':
          // fitBounds will only work when at least one result is available.
          if (!empty($build['#locations'][0]['#position'])) {
            $fitbounds = TRUE;
          }
          break;

      }
    }

    if (!empty($centre)) {
      $build['#centre'] = $centre ?: ['lat' => 0, 'lng' => 0];
      $build['#zoom'] = $zoom ?: 12;
    }
    $build['#fitbounds'] = $fitbounds;

    $build['#mapTypeControl'] = $this->options['mapTypeControl'];
    $build['#streetViewControl'] = $this->options['streetViewControl'];
    $build['#zoomControl'] = $this->options['zoomControl'];
    $build['#scrollwheel'] = $this->options['scrollwheel'];
    $build['#disableDoubleClickZoom'] = $this->options['disableDoubleClickZoom'];
    $build['#draggable'] = $this->options['draggable'];
    $build['#height'] = $this->options['height'];
    $build['#width'] = $this->options['width'];

    return $build;
  }

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['geolocation_field'] = ['default' => ''];
    $options['title_field'] = ['default' => ''];
    $options['centre'] = ['default' => ''];
    $options['mapTypeControl'] = ['default' => TRUE];
    $options['streetViewControl'] = ['default' => TRUE];
    $options['zoomControl'] = ['default' => TRUE];
    $options['scrollwheel'] = ['default' => TRUE];
    $options['disableDoubleClickZoom'] = ['default' => FALSE];
    $options['draggable'] = ['default' => TRUE];
    $options['height'] = ['default' => '400px'];
    $options['width'] = ['default' => '100%'];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $labels = $this->displayHandler->getFieldLabels();
    $fieldMap = \Drupal::service('entity_field.manager')->getFieldMap();
    $geo_options = [];
    $title_options = [];
    $filters = $this->displayHandler->getOption('filters');
    $fields = $this->displayHandler->getOption('fields');
    foreach ($fields as $field_name => $field) {
      if ($field['plugin_id'] == 'geolocation_field') {
        $geo_options[$field_name] = $labels[$field_name];
      }
      if (
        $field['plugin_id'] == 'field'
        && !empty($field['entity_type'])
        && !empty($field['entity_field'])
      ) {
        if (
          !empty($fieldMap[$field['entity_type']][$field['entity_field']]['type'])
          && $fieldMap[$field['entity_type']][$field['entity_field']]['type'] == 'geolocation'
        ) {
          $geo_options[$field_name] = $labels[$field_name];
        }
      }
      if (!empty($field['type']) && $field['type'] == 'string') {
        $title_options[$field_name] = $labels[$field_name];
      }
    }
    $form['geolocation_field'] = [
      '#title' => $this->t('Geolocation source field'),
      '#type' => 'select',
      '#default_value' => $this->options['geolocation_field'],
      '#description' => $this->t("The source of geodata for each entity."),
      '#options' => $geo_options,
    ];

    $form['title_field'] = [
      '#title' => $this->t('Title source field'),
      '#type' => 'select',
      '#default_value' => $this->options['title_field'],
      '#description' => $this->t("The source of the title for each entity. Must be string"),
      '#options' => $title_options,
    ];

    $options = [
      'fit_bounds' => $this->t('Automatically fit map bounds to results. Disregards any set center or zoom.'),
      'first_row' => $this->t('Use first row as centre.'),
      'fixed_value' => $this->t('Provide fixed latitude and longitude.'),
    ];

    foreach ($filters as $filter_name => $filter) {
      if (empty($filter['plugin_id']) || $filter['plugin_id'] != 'geolocation_filter_proximity') {
        continue;
      }
      /** @var \Drupal\geolocation\Plugin\views\filter\ProximityFilter $proximity_filter_handler */
      $proximity_filter_handler = $this->displayHandler->getHandler('filter', $filter_name);
      $options['proximity_filter_' . $filter_name] = $proximity_filter_handler->adminLabel();
    }

    $form['centre'] = [
      '#type' => 'table',
      '#prefix' => t('Please note: Each option will, if it can be applied, supersede any following option.'),
      '#header' => [
        t('Enable'),
        t('Option'),
        t('settings'),
        [
          'data' => t('Settings'),
          'colspan' => '1',
        ],
      ],
      '#attributes' => ['id' => 'geolocation-centre-options'],
      '#tabledrag' => [
        [
          'action' => 'order',
          'relationship' => 'sibling',
          'group' => 'geolocation-centre-option-weight',
        ],
      ],
    ];

    foreach ($options as $id => $label) {
      $weight = isset($this->options['centre'][$id]['weight']) ? $this->options['centre'][$id]['weight'] : 0;
      $form['centre'][$id]['#weight'] = $weight;

      $form['centre'][$id]['enable'] = [
        '#type' => 'checkbox',
        '#default_value' => isset($this->options['centre'][$id]['enable']) ? $this->options['centre'][$id]['enable'] : TRUE,
      ];

      $form['centre'][$id]['option'] = [
        '#markup' => $label,
      ];

      // Optionally, to add tableDrag support:
      $form['centre'][$id]['#attributes']['class'][] = 'draggable';
      $form['centre'][$id]['weight'] = [
        '#type' => 'weight',
        '#title' => t('Weight for @option', ['@option' => $label]),
        '#title_display' => 'invisible',
        '#size' => 4,
        '#default_value' => $weight,
        '#attributes' => ['class' => ['geolocation-centre-option-weight']],
      ];
    }

    $form['centre']['fixed_value']['settings'] = [
      '#type' => 'container',
      'latitude' => [
        '#type' => 'textfield',
        '#title' => t('Latitude'),
        '#default_value' => isset($this->options['centre']['fixed_value']['settings']['latitude']) ? $this->options['centre']['fixed_value']['settings']['latitude'] : '',
        '#size' => 60,
        '#maxlength' => 128,
      ],
      'longitude' => [
        '#type' => 'textfield',
        '#title' => t('Longitude'),
        '#default_value' => isset($this->options['centre']['fixed_value']['settings']['longitude']) ? $this->options['centre']['fixed_value']['settings']['longitude'] : '',
        '#size' => 60,
        '#maxlength' => 128,
      ],
      'zoom' => [
        '#type' => 'select',
        '#title' => t('Zoom level'),
        '#description' => t('1 = world, 20 = maximum zoom'),
        '#options' => range(1, 20),
        '#default_value' => empty($this->options['centre']['fixed_value']['settings']['zoom']) ? 12 : $this->options['centre']['fixed_value']['settings']['zoom'],
      ],
      '#states' => [
        'visible' => [
          ':input[name="style_options[centre][fixed_value][enable]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['centre']['first_row']['settings'] = [
      '#type' => 'container',
      'zoom' => [
        '#type' => 'select',
        '#title' => t('Zoom level'),
        '#description' => t('1 = world, 20 = maximum zoom'),
        '#options' => range(1, 20),
        '#default_value' => empty($this->options['centre']['first_row']['settings']['zoom']) ? 12 : $this->options['centre']['first_row']['settings']['zoom'],
      ],
      '#states' => [
        'visible' => [
          ':input[name="style_options[centre][first_row][enable]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    uasort($form['centre'], 'Drupal\Component\Utility\SortArray::sortByWeightProperty');

    $form['mapTypeControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Map type control'),
      '#description' => $this->t('Allow the user to change the map type.'),
      '#default_value' => $this->options['mapTypeControl'],
    ];
    $form['streetViewControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Street view control'),
      '#description' => $this->t('Allow the user to switch to google street view.'),
      '#default_value' => $this->options['streetViewControl'],
    ];
    $form['zoomControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Zoom control'),
      '#description' => $this->t('Show zoom controls.'),
      '#default_value' => $this->options['zoomControl'],
    ];
    $form['scrollwheel'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Scrollwheel'),
      '#description' => $this->t('Allow the user to zoom the map using the scrollwheel.'),
      '#default_value' => $this->options['scrollwheel'],
    ];
    $form['disableDoubleClickZoom'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disable double click zoom'),
      '#description' => $this->t('Disables the double click zoom functionality.'),
      '#default_value' => $this->options['disableDoubleClickZoom'],
    ];
    $form['draggable'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Draggable'),
      '#description' => $this->t('Allow the user to change the field of view.'),
      '#default_value' => $this->options['draggable'],
    ];
    $form['height'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Height'),
      '#description' => $this->t('Enter the dimensions and the measurement units. E.g. 200px or 100%.'),
      '#size' => 4,
      '#default_value' => $this->options['height'],
      '#required' => TRUE,
    ];
    $form['width'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Width'),
      '#description' => $this->t('Enter the dimensions and the measurement units. E.g. 200px or 100%.'),
      '#size' => 4,
      '#default_value' => $this->options['width'],
      '#required' => TRUE,
    ];
  }

}
