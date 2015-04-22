var _geofield_gmap_maps = {};

/**
 * Implements hook_install().
 */
function geofield_gmap_install() {
  try {
    var css = drupalgap_get_path('module', 'geofield_gmap') + '/geofield_gmap.css';
    drupalgap_add_css(css);
  }
  catch (error) { console.log('geofield_gmap_install - ' + error); }
}

/**
 * Implements hook_field_widget_form().
 */
function geofield_gmap_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    
    // We'll inherit the default geofield widget for starters.
    geofield_field_widget_form(form, form_state, field, instance, langcode, items, delta, element);
    
    console.log(items[delta].children);
    
    // Replace the 'Get current position' button provided by geofield.
    items[delta].children.splice(0, 1);
    items[delta].children.unshift({
      text: 'Get current position',
      type: 'button',
      options: {
        attributes: {
          onclick: "_geofield_gmap_field_widget_form_click('" + field.field_name + "', " + delta + ", '" + items[delta].id + "')"
        }
      }
    });
    
    // Prepend a geofield map widget onto the item's children.
    items[delta].children.unshift({
      theme: 'geofield_gmap_widget',
      attributes: {
        id: field.field_name + '-gmap-widget-' + delta,
        'class': ' geofield_gmap_widget '
      },
      delta: delta,
      item_id: items[delta].id,
      field_name: field.field_name
    });
    
    // Hide the lat and lon inputs.
    /*items[delta].children[2].type = 'hidden';
    items[delta].children[2].title = '';
    items[delta].children[3].type = 'hidden';
    items[delta].children[3].title = '';*/

  }
  catch (error) { console.log('geofield_gmap_field_widget_form - ' + error); }
}

/**
 *
 */
function theme_geofield_gmap_widget(variables) {
  try {
    console.log(variables);
    return '<div ' + drupalgap_attributes(variables.attributes) + '></div>' +
      drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: 'theme_geofield_gmap_widget_pageshow',
          jqm_page_event_args: JSON.stringify({
              id: variables.attributes.id,
              item_id: variables.item_id,
              field_name: variables.field_name,
              delta: variables.delta
          })
      }, variables.delta);
  }
  catch (error) { console.log('theme_geofield_gmap_widget - ' + error); }
}

/**
 *
 */
function theme_geofield_gmap_widget_pageshow(options) {
  try {
    
    // Prepare the global maps collection for this item.
    if (typeof _geofield_gmap_maps[options.field_name] === 'undefined') {
      _geofield_gmap_maps[options.field_name] = {};
    }
    if (typeof _geofield_gmap_maps[options.field_name][options.delta] === 'undefined') {
      _geofield_gmap_maps[options.field_name][options.delta] = {};
    }
    
    // Success callback.
    var success = function(position) {

      // Set aside the user's position.
      _my_module_user_latitude = position.coords.latitude;
      _my_module_user_longitude = position.coords.longitude;

      // Build the lat lng object from the user's current position.
      var myLatlng = new google.maps.LatLng(
        _my_module_user_latitude,
        _my_module_user_longitude
      );

      // Build the map's options.
      var mapOptions = {
        center: myLatlng,
        zoom: 11,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL
        }
      };

      // Initialize the map, and stick it in the global collection.
      var map = new google.maps.Map(
        document.getElementById(options.id),
        mapOptions
      );
      _geofield_gmap_maps[options.field_name][options.delta].map = map;

      // Set a timeout to operate on the map...
      setTimeout(function() {

          // Resize the map to prevent grayed out areas, and reset the center.
          google.maps.event.trigger(map, 'resize');
          map.setCenter(myLatlng);
  
          // Add a draggable marker for position.
          var marker = new google.maps.Marker({
              draggable: true,
              position: myLatlng,
              map: map,
              icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          });
          _geofield_gmap_maps[options.field_name][options.delta].marker = marker;

          // When the marker has been dragged, place the lat/lon values in their
          // input elements.
          google.maps.event.addListener(marker, 'dragend', function() {

              var pos = marker.getPosition();
              $('#' + options.item_id + '-lat').val(pos.k);
              $('#' + options.item_id + '-lon').val(pos.D).change();

          });

      }, 500);

    };
    
    // Error callback.
    var error = function(error) {
        
      // Provide debug information to developer and user.
      console.log(error);
      drupalgap_alert(error.message);
      
      // Process error code.
      switch (error.code) {

        // PERMISSION_DENIED
        case 1:
          break;

        // POSITION_UNAVAILABLE
        case 2:
          break;

        // TIMEOUT
        case 3:
          break;

      }

    };

    // Get the current position.
    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });

  }
  catch (error) { console.log('theme_geofield_gmap_widget_pageshow - ' + error); }
}

/**
 *
 */
function _geofield_gmap_field_widget_form_click(field_name, delta, item_id) {
  try {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        // Place the coordinate values into the text fields, then force a change
        // event to fire, and then move the marker on the map and re center it.
        $('#' + item_id + '-lat').val(position.coords.latitude);
        $('#' + item_id + '-lon').val(position.coords.longitude).change();
        var latLng = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        _geofield_gmap_maps[field_name][delta].map.setCenter(latLng);
        _geofield_gmap_maps[field_name][delta].marker.setPosition(latLng);
      },
      function(error) {
        console.log('_geofield_gmap_field_widget_form_click - getCurrentPosition - ' + error);
      },
      { enableHighAccuracy: true }
    );
  }
  catch (error) { console.log('_geofield_gmap_field_widget_form_click - ' + error); }
}

