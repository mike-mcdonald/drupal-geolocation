<?php

namespace Drupal\geolocation;

use Drupal\Core\Form\FormStateInterface;

/**
 * Trait GoogleMapsDisplayTrait.
 *
 * @package \Drupal\geolocation
 */
trait GoogleMapsDisplayTrait {

  public static $ROADMAP = 'ROADMAP';
  public static $SATELLITE = 'SATELLITE';
  public static $HYBRID = 'HYBRID';
  public static $TERRAIN = 'TERRAIN';

  /**
   * An array of all available map types.
   *
   * @return array
   *   The map types.
   */
  private function getMapTypes() {
    $mapTypes = [
      static::$ROADMAP => 'Road map view',
      static::$SATELLITE => 'Google Earth satellite images',
      static::$HYBRID => 'A mixture of normal and satellite views',
      static::$TERRAIN => 'A physical map based on terrain information',
    ];

    return array_map([$this, 't'], $mapTypes);
  }

  /**
   * Provide a populated settings array.
   *
   * @return array
   *   The settings array with the default map settings.
   */
  public static function getGoogleMapDefaultSettings() {
    return [
      'type' => static::$ROADMAP,
      'zoom' => 10,
      'mapTypeControl' => TRUE,
      'streetViewControl' => TRUE,
      'zoomControl' => TRUE,
      'scrollwheel' => TRUE,
      'disableDoubleClickZoom' => FALSE,
      'draggable' => TRUE,
      'height' => '400px',
      'width' => '100%',
      'info_auto_display' => TRUE,
      'style' => '',
    ];
  }

  /**
   * Provide settings ready to handover to JS to feed to Google Maps.
   *
   * @param array $settings
   *   Current settings. Might contain unrelated settings as well.
   *
   * @return array
   *   An array only containing keys defined in this trait.
   */
  public function getGoogleMapsSettings($settings = []) {
    $default_settings = self::getGoogleMapDefaultSettings();
    $settings = array_merge($default_settings, $settings);

    foreach ($settings as $key => $setting) {
      if (!isset($default_settings[$key])) {
        unset($settings[$key]);
      }
    }

    // Convert JSON string to actual array before handing to Renderer.
    if (!empty($settings['style'])) {
      $json = json_decode($settings['style']);
      if (is_array($json)) {
        $settings['style'] = $json;
      }
    }

    return $settings;
  }

  /**
   * Provide a summary array to use in field formatters.
   *
   * @param array $settings
   *   The current map settings.
   *
   * @return array
   *   An array to use as field formatter summary.
   */
  public function getGoogleMapsSettingsSummary($settings) {
    $types = $this->getMapTypes();
    $summary = [];
    $summary[] = $this->t('Type: @type', ['@type' => $types[$settings['type']]]);
    $summary[] = $this->t('Zoom level: @zoom', ['@zoom' => $settings['zoom']]);
    $summary[] = $this->t('Height: @height', ['@height' => $settings['height']]);
    $summary[] = $this->t('Width: @width', ['@width' => $settings['width']]);
    $summary[] = $this->t('Hover Title: @type', ['@type' => $settings['title']]);
    return $summary;
  }

  /**
   * Provide a generic map settings form array.
   *
   * @param array $settings
   *   The current map settings.
   *
   * @return array
   *   A form array to be integrated in whatever.
   */
  public function getGoogleMapsSettingsForm($settings = []) {
    $form = [];

    $form['type'] = [
      '#type' => 'select',
      '#title' => $this->t('Default map type'),
      '#options' => $this->getMapTypes(),
      '#default_value' => $settings['type'],
    ];
    $form['zoom'] = [
      '#type' => 'select',
      '#title' => $this->t('Zoom level'),
      '#options' => range(0, 18),
      '#description' => $this->t('The initial resolution at which to display the map, where zoom 0 corresponds to a map of the Earth fully zoomed out, and higher zoom levels zoom in at a higher resolution.'),
      '#default_value' => $settings['zoom'],
    ];
    $form['mapTypeControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Map type control'),
      '#description' => $this->t('Allow the user to change the map type.'),
      '#default_value' => $settings['mapTypeControl'],
    ];
    $form['streetViewControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Street view control'),
      '#description' => $this->t('Allow the user to switch to google street view.'),
      '#default_value' => $settings['streetViewControl'],
    ];
    $form['zoomControl'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Zoom control'),
      '#description' => $this->t('Show zoom controls.'),
      '#default_value' => $settings['zoomControl'],
    ];
    $form['scrollwheel'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Scrollwheel'),
      '#description' => $this->t('Allow the user to zoom the map using the scrollwheel.'),
      '#default_value' => $settings['scrollwheel'],
    ];
    $form['disableDoubleClickZoom'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disable double click zoom'),
      '#description' => $this->t('Disables the double click zoom functionality.'),
      '#default_value' => $settings['disableDoubleClickZoom'],
    ];
    $form['draggable'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Draggable'),
      '#description' => $this->t('Allow the user to change the field of view.'),
      '#default_value' => $settings['draggable'],
    ];
    $form['style'] = [
      '#title' => $this->t('JSON styles'),
      '#type' => 'textarea',
      '#default_value' => $settings['style'],
      '#description' => $this->t('A JSON encoded styles array to customize the presentation of the Google Map. See the <a href="https://developers.google.com/maps/documentation/javascript/styling">Styled Map</a> section of the Google Maps website for further information.'),
    ];
    $form['height'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Height'),
      '#description' => $this->t('Enter the dimensions and the measurement units. E.g. 200px or 100%.'),
      '#size' => 4,
      '#default_value' => $settings['height'],
    ];
    $form['width'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Width'),
      '#description' => $this->t('Enter the dimensions and the measurement units. E.g. 200px or 100%.'),
      '#size' => 4,
      '#default_value' => $settings['width'],
    ];
    $form['info_auto_display'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Automatically show info text'),
      '#default_value' => $settings['info_auto_display'],
    ];

    return $form;
  }

  /**
   * Validate the form elements defined above.
   *
   * @param array $form
   *   Values to validate.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current Formstate.
   * @param string|null $prefix
   *   Form state prefix if needed.
   */
  public function validateGoogleMapsSettingsForm($form, FormStateInterface $form_state, $prefix = NULL) {
    if ($prefix) {
      $values = $form_state->getValues();
      if (!empty($values[$prefix])) {
        $values = $values[$prefix];
        $prefix = $prefix . '][';
      }
      else {
        return;
      }
    }
    else {
      $values = $form_state->getValues();
    }

    $json_style = $values['style'];
    if (!empty($json_style)) {
      if (!is_string($json_style)) {
        $form_state->setErrorByName($prefix . 'style', $this->t('Please enter a JSON string as style.'));
      }
      $json_result = json_decode($json_style);
      if ($json_result === NULL) {
        $form_state->setErrorByName($prefix . 'style', $this->t('Decoding style JSON failed. Error: %error.', ['%error' => json_last_error()]));
      }
      elseif (!is_array($json_result)) {
        $form_state->setErrorByName($prefix . 'style', $this->t('Decoded style JSON is not an array.'));
      }
    }
  }

}
