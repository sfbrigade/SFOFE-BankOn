'use strict';

/*!
 * Searchable Map Template with Google Fusion Tables
 * http://derekeder.com/searchable_map_template/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/FusionTable-Map-Template/wiki/License
 *
 * Date: 12/10/2012
 * Modified by Felix Sargent and Marc Chung for SFOFE
 */

var MapsLib = {

  // Setup section - put your Fusion Table details here
  // Using the v1 Fusion Tables API. See https://developers.google.com/fusiontables/docs/v1/migration_guide for more info

  // the encrypted Table ID of your Fusion Table (found under File => About)
  // NOTE: numeric IDs will be depricated soon
  fusionTableId: '1p6c5F6gDT25rEhgcdvVTkDcLiVSaOPSItwhKhxpa',

  //* New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/
  //* Important* this key is for demonstration purposes. please register your own.
  googleApiKey: 'AIzaSyAfEBl25_BrWyfgo2e6JlDdzsmMrLc77vQ',

  // name of the location column in your Fusion Table.
  // NOTE: if your location column name has spaces in it, surround it with single quotes
  // example: locationColumn:     "'my location'",
  locationColumn: '\'Full Address\'',

  map_centroid: new google.maps.LatLng(37.7750, -122.4183), // center that your map defaults to
  locationScope: 'San Francisco', // geographical area appended to all address searches
  recordName: 'result', // for showing number of results
  recordNamePlural: 'results',

  searchRadius: 805, // in meters ~ 1/2 mile
  defaultZoom: 13, // zoom level when map is loaded (bigger is more zoomed in)
  addrMarkerImage: 'http://derekeder.com/images/icons/blue-pushpin.png',
  currentPinpoint: null,

  initialize: function initialize() {
    $('#result_count').html('');

    var myOptions = {
      zoom: MapsLib.defaultZoom,
      center: MapsLib.map_centroid,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map($('#map_canvas')[0], myOptions);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(map, 'idle', function () {
      MapsLib.calculateCenter();
    });

    google.maps.event.addDomListener(window, 'resize', function () {
      map.setCenter(MapsLib.map_centroid);
    });

    MapsLib.searchrecords = null;

    // reset filters
    $('#search_address').val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius !== '') $('#search_radius').val(loadRadius);else $('#search_radius').val(MapsLib.searchRadius);

    $('#result_count').hide();

    // run the default search
    MapsLib.doSearch();
  },
  doSearch: function doSearch() {
    MapsLib.clearSearch();
    var address = $('#search_address').val();
    MapsLib.searchRadius = $('#search_radius').val();

    var whereClause = MapsLib.locationColumn + ' not equal to \'\'';

    // -----custom filters-------
    var typeColumn = 'Minimum Opening Deposit';
    if ($('').is(':checked')) whereClause += ' AND ' + typeColumn + ' < \'$25\'';
    typeColumn = '\'Available to customers who may have been reported to ChexSystems\'';
    if ($('#cbChex').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Accepts alternative forms of IDs (municipal, Consular, etc.)\'';
    if ($('#cbAlternateID').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Accepts ITINs (individual tax identification number)\'';
    if ($('#cbITIN').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Online account openings available (may only be available to US citizens)\'';
    if ($('#cbRemoteAccount').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Free linked savings account to checking accounts\'';
    if ($('#cbSavings').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Free mobile deposits\'';
    if ($('#cbMobileDeposits').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Money orders available\'';
    if ($('#cbMoneyOrders').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Credit building products\'';
    if ($('#cbCreditBuilding').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'Domestic wire transfer\'';
    if ($('#cbDomesticWire').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';
    typeColumn = '\'cbRemittance\'';
    if ($('#cbRemittance').is(':checked')) whereClause += ' AND ' + typeColumn + '= \'Yes\'';

    typeColumn = '\'Minimum Opening Deposit\'';
    // whereClause += " AND " + typeColumn + " >= '" + $("#deposit-selected-start").html() + "'";
    whereClause += ' AND ' + typeColumn + ' <= \'' + $('#deposit-selected-end').html() + '\'';

    /*
    typeColumn = "'Monthly Fee'";
    whereClause += " AND " + typeColumn + " >= '" + $("#monthly-selected-start").html() + "'";
    whereClause += " AND " + typeColumn + " <= '" + $("#monthly-selected-end").html() + "'";
    */

    // -------end of custom filters--------

    if (address !== '') {
      if (address.toLowerCase().indexOf(MapsLib.locationScope) === -1) {
        address = address + ' ' + MapsLib.locationScope;
      }
      var _geocoder = new google.maps.Geocoder();
      _geocoder.geocode({ address: address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);
          map.setZoom(14);

          MapsLib.addrMarker = new google.maps.Marker({
            position: MapsLib.currentPinpoint,
            map: map,
            icon: MapsLib.addrMarkerImage,
            animation: google.maps.Animation.DROP,
            title: address
          });

          whereClause += ' AND ST_INTERSECTS(' + MapsLib.locationColumn + ', CIRCLE(LATLNG' + MapsLib.currentPinpoint.toString() + ',' + MapsLib.searchRadius + '))';

          MapsLib.drawSearchRadiusCircle(MapsLib.currentPinpoint);
          MapsLib.submitSearch(whereClause, map, MapsLib.currentPinpoint);
        } else {
          alert('We could not find your address: ' + status);
        }
      });
    } else {
      // search without geocoding callback
      MapsLib.submitSearch(whereClause, map);
    }
  },
  submitSearch: function submitSearch(whereClause, map) {
    // get using all filters
    // NOTE: styleId and templateId are recently added attributes to load custom marker styles 
    // and info windowsyou can find your Ids inside the link generated by the 'Publish' option 
    // in Fusion Tables for more details, 
    // see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles

    // console.log(whereClause);
    // if (typeof _gaq !== 'undefined') {
    //   _gaq.push(['_trackEvent', 'Search', 'query', whereClause]);
    // }

    MapsLib.searchrecords = new google.maps.FusionTablesLayer({
      query: {
        from: MapsLib.fusionTableId,
        select: MapsLib.locationColumn,
        where: whereClause
      },
      styleId: 2,
      templateId: 2
    });
    MapsLib.searchrecords.setMap(map);
    MapsLib.getList(whereClause);
  },
  clearSearch: function clearSearch() {
    if (MapsLib.searchrecords != null) {
      MapsLib.searchrecords.setMap(null);
    }
    if (MapsLib.addrMarker != null) {
      MapsLib.addrMarker.setMap(null);
    }
    if (MapsLib.searchRadiusCircle != null) {
      MapsLib.searchRadiusCircle.setMap(null);
    }
  },
  findMe: function findMe() {
    // Try W3C Geolocation (Preferred)
    var foundLocation = void 0;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        MapsLib.addrFromLatLng(foundLocation);
      }, null);
    } else {
      alert('Sorry, we could not find your location.');
    }
  },
  setResultsView: function setResultsView(e) {
    var t = $('#view_mode');
    return e === 'map' ? ($('#list_canvas').hide(), $('#map_canvas').show(), google.maps.event.trigger(map, 'resize'), map.setCenter(MapsLib.map_centroid), MapsLib.doSearch(), t.html('Show list <i class="icon-list icon-white"></i>')) : ($('#list_canvas').show(), $('#map_canvas').hide(), t.html('Show map <i class="icon-map-marker icon-white"></i>'));
  },

  addrFromLatLng: function addrFromLatLng(latLngPoint) {
    geocoder.geocode({ latLng: latLngPoint }, function (results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          MapsLib.doSearch();
        }
      } else {
        alert('Geocoder failed due to: ' + status);
      }
    });
  },
  drawSearchRadiusCircle: function drawSearchRadiusCircle(point) {
    var circleOptions = {
      strokeColor: '#4b58a6',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: '#4b58a6',
      fillOpacity: 0.05,
      map: map,
      center: point,
      clickable: false,
      zIndex: -1,
      radius: parseInt(MapsLib.searchRadius, 10)
    };
    MapsLib.searchRadiusCircle = new google.maps.Circle(circleOptions);
  },
  query: function query(selectColumns, whereClause, callback) {
    var queryStr = [];
    queryStr.push('SELECT ' + selectColumns);
    queryStr.push(' FROM ' + MapsLib.fusionTableId);
    queryStr.push(' WHERE ' + whereClause);

    var sql = encodeURIComponent(queryStr.join(' '));
    $.ajax({ url: 'https://www.googleapis.com/fusiontables/v1/query?sql=' + sql + '&callback=' + callback + '&key=' + MapsLib.googleApiKey, dataType: 'jsonp' });
  },
  handleError: function handleError(json) {
    if (json.error !== undefined) {
      var error = json.error.errors;
      console.log('Error in Fusion Table call!');
      error.forEach(function (row) {
        console.log(' Domain: ' + row.domain);
        console.log(' Reason: ' + row.reason);
        console.log(' Message: ' + row.message);
      });
    }
  },
  getList: function getList(whereClause) {
    var selectColumns = '\'Financial Institution\',\'Branch Name\',\'Address\',\'Phone Numbers\',\'Manager\',\'Hours\',\'Minimum Opening Deposit\',\'Minimum Balance\',\'Monthly Fee\',\'Checks included\',\'Check/Debit Card included\',\'Online Bill Pay\',\'Alternative IDs Accepted as Primary Identification\',\'Open Accounts for customers with ChexSystems History\',\'Remittance products available\',\'Wire Transfers\',\'Money Orders\',\'Offer Financial Education\',\'First Overdraft Fees Waived\',\'Overdraft Fee\'';
    selectColumns = '*';
    MapsLib.query(selectColumns, whereClause, 'MapsLib.displayList');
  },
  displayList: function displayList(json) {
    MapsLib.handleError(json);
    var data = json.rows;
    var template = '';

    var results = $('#list_canvas');
    results.empty(); // hide the existing list and empty it out first

    if (data == null) {
      // clear results list
      results.append('<li><span class=\'lead\'>No results found</span></li>');
    } else {
      data.forEach(function (row) {
        template = '<div class=\'row-fluid item-list\'><div class=\'span12\'><br /><h3>' + row[0] + ' <small>' + row[1] + '</small></h3><strong>Address: </strong><a href=\'https://www.google.com/maps/?q=' + row[2] + '\'>' + row[2] + '</a><br /><strong>Phone numbers: </strong><a href=\'tel:' + row[8] + '\'>' + row[8] + '</a><br /><strong>Languages Spoken: </strong>' + row[7] + '<br /><strong>Hours: </strong>' + row[6] + '<br /><strong>Minimum opening deposit: </strong> $' + row[9] + '</div></div>';
        results.append(template);
      }, this);
    }
  },

  calculateCenter: function calculateCenter() {
    var center = map.getCenter();
  },
  // converts a slug or query string in to readable text
  convertToPlainString: function convertToPlainString(text) {
    if (text === undefined) return '';
    return decodeURIComponent(text);
  }
};