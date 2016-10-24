<?php

namespace Drupal\geolocation\Plugin\views\filter;

use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Plugin\views\display\DisplayPluginBase;
use Drupal\views\Plugin\views\filter\FilterPluginBase;
use Drupal\views\ViewExecutable;
use Drupal\views\Plugin\views\query\Sql;

/**
 * Filter handler for search keywords.
 *
 * @ingroup views_filter_handlers
 *
 * @ViewsFilter("geolocation_filter_boundary")
 */
class BoundaryFilter extends FilterPluginBase {

  /**
   * {@inheritdoc}
   */
  public $no_operator = TRUE;

  /**
   * {@inheritdoc}
   */
  protected $alwaysMultiple = TRUE;

  /**
   * The field alias.
   *
   * @var string
   */
  protected $fieldAlias;

  /**
   * {@inheritdoc}
   */
  public function init(ViewExecutable $view, DisplayPluginBase $display, array &$options = NULL) {
    parent::init($view, $display, $options);

    // Set the field alias.
    $this->fieldAlias = $this->options['id'] . '_filter';
  }

  /**
   * {@inheritdoc}
   */
  public function adminSummary() {
    return $this->t("Boundary filter");
  }

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['expose']['contains']['input_by_geocoding_widget'] = ['default' => FALSE];

    $options['value']['contains'] = [
      'lat_north_east' => ['default' => ''],
      'lng_north_east' => ['default' => ''],
      'lat_south_west' => ['default' => ''],
      'lng_south_west' => ['default' => ''],
    ];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultExposeOptions() {
    parent::defaultExposeOptions();

    $this->options['expose']['input_by_geocoding_widget'] = FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function buildExposeForm(&$form, FormStateInterface $form_state) {
    $form['expose']['input_by_geocoding_widget'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Use Google Geocoding Widget instead of boundary value form'),
      '#default_value' => $this->options['expose']['input_by_geocoding_widget'],
    ];

    parent::buildExposeForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function buildExposedForm(&$form, FormStateInterface $form_state) {
    parent::buildExposedForm($form, $form_state);

    if (
      $this->options['expose']['input_by_geocoding_widget']
      && !empty($form[$this->field])
    ) {
      $form[$this->field]['lat_north_east']['#type'] = 'hidden';
      $form[$this->field]['lng_north_east']['#type'] = 'hidden';
      $form[$this->field]['lat_south_west']['#type'] = 'hidden';
      $form[$this->field]['lng_south_west']['#type'] = 'hidden';

      $form[$this->field]['boundary_geocoding_widget'] = [
        '#type' => 'textfield',
        '#title' => $this->options['expose']['label'],
        '#description' => $this->t('Enter an address to filter results.'),
        '#attributes' => [
          'class' => [
            'form-autocomplete',
            'geolocation-views-filter-geocoder',
          ],
          'data-geolocation-filter-identifier' => $this->options['expose']['identifier'],
          'data-geolocation-filter-type' => 'boundary',
        ],
        '#attached' => [
          'library' => [
            'geolocation/geolocation.views.filter.geocoder',
          ],
        ],
      ];

      \Drupal::service('geolocation.core')->attachGeocoder($form[$this->field]['boundary_geocoding_widget']);
    }
  }

  /**
   * {@inheritdoc}
   */
  protected function valueForm(&$form, FormStateInterface $form_state) {

    parent::valueForm($form, $form_state);

    $form['value']['#tree'] = TRUE;
    $value_element = &$form['value'];

    // Add the Latitude and Longitude elements.
    $value_element += [
      'lat_north_east' => [
        '#type' => 'textfield',
        '#title' => $this->t('North East Boundary - Latitude'),
        '#default_value' => $this->value['lat_north_east'],
        '#weight' => 10,
      ],
      'lng_north_east' => [
        '#type' => 'textfield',
        '#title' => $this->t('North East Boundary - Longitude'),
        '#default_value' => $this->value['lng_north_east'],
        '#weight' => 20,
      ],
      'lat_south_west' => [
        '#type' => 'textfield',
        '#title' => $this->t('South West Boundary - Latitude'),
        '#default_value' => $this->value['lat_south_west'],
        '#weight' => 30,
      ],
      'lng_south_west' => [
        '#type' => 'textfield',
        '#title' => $this->t('South West Boundary - Longitude'),
        '#default_value' => $this->value['lng_south_west'],
        '#weight' => 40,
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    if (!($this->query instanceof Sql)) {
      return;
    }

    // Get the field alias.
    $lat_north_east = $this->value['lat_north_east'];
    $lng_north_east = $this->value['lng_north_east'];
    $lat_south_west = $this->value['lat_south_west'];
    $lng_south_west = $this->value['lng_south_west'];

    if (
      !is_numeric($lat_north_east)
      || !is_numeric($lng_north_east)
      || !is_numeric($lat_south_west)
      || !is_numeric($lng_south_west)
    ) {
      return;
    }

    $this->query->addWhereExpression(
      $this->options['group'],
      \Drupal::service('geolocation.core')->getBoundaryQueryFragment($this->ensureMyTable(), $this->realField, $lat_north_east, $lng_north_east, $lat_south_west, $lng_south_west)
    );
  }

}
