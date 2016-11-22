window.setupMap = function(id) {
  var geocoder = new google.maps.Geocoder
  var map = new google.maps.Map(document.getElementById(id), {
    styles: [
      {featureType: "all",                     elementType: "labels", stylers: [{visibility: "off" }]},
      {featureType: "administrative.country",  elementType: "all",    stylers: [{color: "#666666"}]},
      {featureType: "administrative.province", elementType: "all",    stylers: [{visibility: "on" }]},
      {featureType: "road",                    elementType: "all",    stylers: [{visibility: "off" }]},
      {featureType: "transit",                 elementType: "all",    stylers: [{visibility: "off" }]},
      {featureType: "water",                   elementType: "all",    stylers: [{visibility: "on" }, { color: "#D7E4EA" }] },
      {featureType: "landscape",               elementType: "all",    stylers: [{color:      "#CBCBCB" }]},
      {featureType: "poi",                     elementType: "all",    stylers: [{color:      "#CBCBCB" }]},
    ],
    zoom: 4,
    draggable: true,
    center: { lat: 39.82, lng: -98.57 },
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  })

  var getState = function(results) {
    if (!(results || {}).length) { return }
    var addresses = results[0].address_components
    for (var i = 0; i < addresses.length; i++) {
      if (addresses[i].types[0] == 'administrative_area_level_1') {
        return addresses[i].short_name
      }
    }
  }

  var states = null
  var counties = null
  var reorient = function() {
    geocoder.geocode({location: map.getCenter()}, function(results) {
      window.currentState = getState(results) || window.currentState
      if (!!states)   { states.setMap(null) }
      if (!!counties) { counties.setMap(null) }
      counties = getCountyLayer(map, window.currentState)
      states = getStateLayer(map, window.currentState)
    })
  }

  var getStateLayer = function(map, state) {
    var styles
    var whereClause
    if (map.getZoom() <= 5) {
      styles = [{
        where: "winner = 'donald'",
        polygonOptions: { fillColor: "#ff0000", fillOpacity: 0.3 }
      }, {
        where: "winner = 'hillary'",
        polygonOptions: { fillColor: "#0000ff", fillOpacity: 0.3 }
      }]
    } else {
      whereClause = state != null ? "state NOT EQUAL TO '" + state + "'" : null
      styles = [{
        where: whereClause,
        polygonOptions: { fillColor: "#00ff00", fillOpacity: 0.0001 }
      }]
    }

    var states = new google.maps.FusionTablesLayer({
      map: map,
      query: {
        select: "geo",
        from: "1ZxWCBztPbuJqOFulc7OK0k04ycvsEdesLM08zyI5",
        where: whereClause
      },
      styles: styles,
    })
    google.maps.event.addListener(states, 'click', onClick)
    return states
  }

  var getCountyLayer = function(map, state) {
    if (map.getZoom() <= 5) { return false }
    counties = new google.maps.FusionTablesLayer({
      map: map,
      query: {
        select: "geometry",
        from: "191jr9SrmjNE9QOI2--whtS4h3-VXza6ORk-QIj-K",
        where: "state = '" + state + "'"
      },
      styles: [{
        where: "winner = 'hillary'",
        polygonOptions: {
          fillColor: "#0000ff",
          fillOpacity: 0.3
        }
      }, {
        where: "winner = 'donald'",
        polygonOptions: {
          fillColor: "#ff0000",
          fillOpacity: 0.3
        }
      }]
    })
    google.maps.event.addListener(counties, 'click', onClick)
    return counties
  }

  var onClick = function(e) {
    e.infoWindowHtml = "Hello world!"
  }

  google.maps.event.addListener(map, 'dragend', reorient)
  google.maps.event.addListener(map, 'zoom_changed', reorient)
  google.maps.event.addDomListener(document, 'keypress', function(e) {
    var direction
    if (!window.stateData || !window.currentState) { return false }
    switch(e.keyCode) {
      case 119: direction = 'up';    break;
      case 100: direction = 'right'; break;
      case 115: direction = 'down';  break;
      case 97:  direction = 'left';  break;
    }
    var goToState = window.stateData[window.currentState][direction]
    if (!!goToState) {
      window.currentState = goToState
      map.setCenter({
        lat: window.stateData[goToState].latitude,
        lng: window.stateData[goToState].longitude
      })
      google.maps.event.trigger(map, 'dragend')
    }
  })
  google.maps.event.trigger(map, 'zoom_changed')

  return map
}

init = function() {
  window.setupMap('states')
}

setData = function(data) {
  window.stateData = {}
  for (i = 0; i < data.rows.length; i++) {
    obj = {}
    for (j = 1; j < data.columns.length; j++) {
      obj[data.columns[j]] = data.rows[i][j]
    }
    window.stateData[data.rows[i][0]] = obj
  }
}
