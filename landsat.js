// A UI to interactively filter a collection, select an individual image
// from the results, display it with a variety of visualizations, and export it.
// To be modified accordingly @shweta @vidhi
// The namespace for our application.  All the state is kept in here.



  var points = {
Gunners_Lake_Maryland: [-77.25512981414795,39.164573608078825,15],
Quarry_Lake_Maryland: [-76.69094324111938,39.38254388916403,15],
Nasty_Pond_Georgia: [-83.860209, 33.821322,16],
Memorial_Lake_Georgia: [-83.385131, 33.92652, 18],
Tybee_Island_Georgia: [-80.89354, 31.99181, 13],
Anne_Lake_Missouri: [-90.20689, 37.94809,15],
Okeechobee_Lake_Florida: [-80.799, 26.9351, 11],
Utah_Lake_Utah: [-111.8134, 40.2257,11],
Chilika_Lake_India: [85.361, 19.7501,11],
Natron_Lake_Tanzania: [36.0324, -2.3455, 10],
Complex_Lakes_Australlia: [143.0804, -33.5939, 11],
Bolsena_Lake_Italy: [11.93939, 42.59495, 13],
Titicaca_Lake_Peru: [-69.4157, -15.7827, 10],
Lobaz_Lake_Russia: [99.5746, 72.2884, 10],
Taihu_Lake_China: [120.2158, 31.2124, 11],
Plata_River_Argentina: [-58.1616, -34.4338,10],
Argentina_Lake_Argentina:[-72.393, -50.2356, 10],
Wekeeti_Lake_Canada: [-114.1885, 64.1763, 11],
Bujumbura_Lake_Burundi: [29.2497, -3.4194, 11],
Lower_Mekong_Aquaculture: [104.55671, 10.3587, 13],
Mississippi_River_Delta: [-89.4246, 29.2445, 10],
Sao_Paulo_Brazil: [-46.4248, -23.8601, 11],
Turbid_Lake_Yellowstone: [-110.3185, 44.5095, 12],
Guayaquil_Ecuador: [-79.7, -2.54, 11],
Congo_Outflow: [12.7009, -6.0136, 11]
};

var app = {};

/** Creates the UI panels. */
app.createPanels = function() {
  /* The introduction section. */
  app.intro = {
    panel: ui.Panel([
      ui.Label({
        value: 'Landsat 7 Dashboard',
        style: {fontWeight: 'bold', fontSize: '24px', margin: '10px 5px'}
      }),
      ui.Label('This app allows you to filter and export images ' +
               'from the Landsat 7 collection.')
    ])
  };

  app.lakePicker = {
    select: ui.Select({
      placeholder: 'Location',
      items: Object.keys(points),
      onChange: function(key) {
        Map.setCenter(points[key][0], points[key][1], points[key][2]);
      }
    })
  };
  
  app.lakePicker.panel = ui.Panel({
    widgets: [
      ui.Label('1) Select Water', {fontWeight: 'bold'}),
      ui.Panel([app.lakePicker.select], ui.Panel.Layout.flow('horizontal'))]
  });

  /* The collection filter controls. */
  app.filters = {
    mapCenter: ui.Checkbox({label: 'Filter to map center', value: true}),
    startDate: ui.Textbox('YYYY-MM-DD', '2017-05-01'),
    endDate: ui.Textbox('YYYY-MM-DD', '2017-09-01'),
    applyButton: ui.Button('Apply filters', app.applyFilters),
    loadingLabel: ui.Label({
      value: 'Loading...',
      style: {stretch: 'vertical', color: 'gray', shown: false}
    })
  };

  /* The panel for the filter control widgets. */
  app.filters.panel = ui.Panel({
    widgets: [
      ui.Label('2) Select Durarion', {fontWeight: 'bold'}),
      ui.Label('Start date', app.HELPER_TEXT_STYLE), app.filters.startDate,
      ui.Label('End date', app.HELPER_TEXT_STYLE), app.filters.endDate,
      app.filters.mapCenter,
      ui.Panel([
        app.filters.applyButton,
        app.filters.loadingLabel
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });

  /* The image picker section. */
  app.picker = {
    // Create a select with a function that reacts to the "change" event.
    select: ui.Select({
      placeholder: 'Select an image ID',
      onChange: app.refreshMapLayer
    }),
    // Create a button that centers the map on a given object.
    centerButton: ui.Button('Center on map', function() {
      Map.centerObject(Map.layers().get(0).get('eeObject'));
    })
  };

  /* The panel for the picker section with corresponding widgets. */
  app.picker.panel = ui.Panel({
    widgets: [
      ui.Label('3) Select an image', {fontWeight: 'bold'}),
      ui.Panel([
        app.picker.select,
        app.picker.centerButton
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });

  /* The visualization section. */
  app.vis = {
    label: ui.Label(),
    // Create a select with a function that reacts to the "change" event.
    select: ui.Select({
      items: Object.keys(app.VIS_OPTIONS),
      onChange: function() {
        // Update the label's value with the select's description.
        var option = app.VIS_OPTIONS[app.vis.select.getValue()];
        app.vis.label.setValue(option.description);
        // Refresh the map layer.
        app.refreshMapLayer();
      }
    })
  };

  /* The panel for the visualization section with corresponding widgets. */
  app.vis.panel = ui.Panel({
    widgets: [
      ui.Label('4) Select a visualization', {fontWeight: 'bold'}),
      app.vis.select,
      app.vis.label
    ],
    style: app.SECTION_STYLE
  });

  // Default the select to the first value.
  app.vis.select.setValue(app.vis.select.items().get(0));

  /* The export section. */
  app.export = {
    button: ui.Button({
      label: 'Export the current image to Drive',
      // React to the button's click event.
      onClick: function() {
        // Select the full image id.
        var imageIdTrailer = app.picker.select.getValue();
        var imageId = app.COLLECTION_ID + '/' + imageIdTrailer;
        // Get the visualization options.
        var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
        // Export the image to Drive.
        Export.image.toDrive({
          image: ee.Image(imageId).select(visOption.visParams.bands),
          description: 'L8_Export-' + imageIdTrailer,
        });
      }
    })
  };

  /* The panel for the export section with corresponding widgets. */
  app.export.panel = ui.Panel({
    widgets: [
      ui.Label('5) Start an export', {fontWeight: 'bold'}),
      app.export.button
    ],
    style: app.SECTION_STYLE
  });
};

/** Creates the app helper functions. */
app.createHelpers = function() {
  /**
   * Enables or disables loading mode.
   * @param {boolean} enabled Whether loading mode is enabled.
   */
  app.setLoadingMode = function(enabled) {
    // Set the loading label visibility to the enabled mode.
    app.filters.loadingLabel.style().set('shown', enabled);
    // Set each of the widgets to the given enabled mode.
    var loadDependentWidgets = [
      app.lakePicker.select,
      app.vis.select,
      app.filters.startDate,
      app.filters.endDate,
      app.filters.applyButton,
      app.filters.mapCenter,
      app.picker.select,
      app.picker.centerButton,
      app.export.button
    ];
    loadDependentWidgets.forEach(function(widget) {
      widget.setDisabled(enabled);
    });
  };

  /** Applies the selection filters currently selected in the UI. */
  app.applyFilters = function() {
    app.setLoadingMode(true);
    var filtered = ee.ImageCollection(app.COLLECTION_ID);

    // Filter bounds to the map if the checkbox is marked.
    if (app.filters.mapCenter.getValue()) {
      filtered = filtered.filterBounds(Map.getCenter());
    }

    // Set filter variables.
    var start = app.filters.startDate.getValue();
    if (start) start = ee.Date(start);
    var end = app.filters.endDate.getValue();
    if (end) end = ee.Date(end);
    if (start) filtered = filtered.filterDate(start, end);

    // Get the list of computed ids.
    var computedIds = filtered
        .limit(app.IMAGE_COUNT_LIMIT)
        .reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');

    computedIds.evaluate(function(ids) {
      // Update the image picker with the given list of ids.
      app.setLoadingMode(false);
      app.picker.select.items().reset(ids);
      // Default the image picker to the first id.
      app.picker.select.setValue(app.picker.select.items().get(0));
    });
  };

  /** Refreshes the current map layer based on the UI widget states. */
  app.refreshMapLayer = function() {
    Map.clear();
    var imageId = app.picker.select.getValue();
    if (imageId) {
      // If an image id is found, create an image.
      var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
      if(app.vis.select.getValue().toString() == "NDVI") {
        image = ee.ImageCollection(app.EVI_COLLECTION_ID);
        image = image.select('EVI');
      }
      // Add the image to the map with the corresponding visualization options.
      var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
      Map.addLayer(image, visOption.visParams, imageId);
    }
  };
};

/** Creates the app constants. */
app.createConstants = function() {
  app.COLLECTION_ID = 'LANDSAT/LE07/C01/T1_RT_TOA';
  app.EVI_COLLECTION_ID = 'LANDSAT/LE07/C01/T1_8DAY_EVI';
  app.SECTION_STYLE = {margin: '20px 0 0 0'};
  app.HELPER_TEXT_STYLE = {
      margin: '8px 0 -3px 8px',
      fontSize: '12px',
      color: 'gray'
  };
  app.IMAGE_COUNT_LIMIT = 10;
  app.VIS_OPTIONS = {
    'False color (B7/B6/B4)': {
      description: 'Vegetation is shades of red, urban areas are ' +
                   'cyan blue, and soils are browns.',
      visParams: {gamma: 1.3, min: 0, max: 0.3, bands: ['B6_VCID_1', 'B4', 'B3']}
    },
    'Natural color (B4/B3/B2)': {
      description: 'Ground features appear in colors similar to their ' +
                   'appearance to the human visual system.',
      visParams: {gamma: 1.3, min: 0, max: 0.3, bands: ['B4', 'B3', 'B2']}
    },
    'Atmospheric (B7/B6/B5)': {
      description: 'Coast lines and shores are well-defined. ' +
                   'Vegetation appears blue.',
      visParams: {gamma: 1.3, min: 0, max: 0.3, bands: ['B7', 'B6_VCID_2', 'B5']}
    },
    'NDVI': {
      description: 'Vegetation index to detect the NDVI (raw) for the footprint' + 
                   'in focus - works for both land and water areas.',
      visParams: {min: 0.0,
      max: 1.0,
      palette: [
        'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
        '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
        '012E01', '011D01', '011301'
      ]}
    }
  };
};

/** Creates the application interface. */
app.boot = function() {
  app.createConstants();
  app.createHelpers();
  app.createPanels();
  var main = ui.Panel({
    widgets: [
      app.intro.panel,
      app.lakePicker.panel,
      app.filters.panel,
      app.picker.panel,
      app.vis.panel,
      app.export.panel
    ],
    style: {width: '320px', padding: '8px'}
  });
  Map.setCenter(-97, 26, 9);
  ui.root.insert(0, main);
  app.applyFilters();
};

app.boot();
