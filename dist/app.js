window.setupMap = function(id) {
  var geocoder = new google.maps.Geocoder
  var map = new google.maps.Map(document.getElementById(id), {
    styles: [
      {featureType: "all",                     elementType: "labels", stylers: [{visibility: "off" }]},
      {featureType: "administrative.country",  elementType: "all",    stylers: [{color: "#BCBCBC" }]},
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
      if (counties) { google.maps.event.addListener(counties, 'click', onClick) }
      states = getStateLayer(map, window.currentState)
      if (states) { google.maps.event.addListener(states, 'click', onClick) }

    })
    if (window.currentState) {
      onClick({ row: window.stateData[window.currentState] })
    }
  }

  var onClick = function(e) {
    var title
    if (map.getZoom() <= 5) {
      document.getElementById('resultLink').style.display = 'inline-block';
      document.getElementById('navHelp').style.display = 'none';
    } else {
      document.getElementById('resultLink').style.display = 'none';
      document.getElementById('navHelp').style.display = 'block';
    }

    if (e.row.county) {
      title = e.row.county.value + " County (" + e.row.state.value + ")"
    } else {
      title = e.row.state_name.value
    }
    document.getElementById('resultTitle').innerHTML = title
    document.getElementById('resultTitle').style['font-size'] = '20px'
    var cands = ['hillary', 'donald', 'johnson', 'stein', 'mcmullin']
    for (i = 0; i < cands.length; i++) {
      var pct = (parseFloat(e.row[cands[i] + '_pct'].value) * 100).toFixed(1) + '%'
      var total = parseInt(e.row[cands[i]].value) || null
      document.getElementById(cands[i] + '_total').innerHTML = total
      document.getElementById(cands[i] + '_pct').innerHTML = pct
      document.getElementById(cands[i] + '_slider').style.width = pct
    }

    if (e.row.state) { window.currentState = e.row.state.value }
  }

  var getStateLayer = function(map) {
    var styles
    if (map.getZoom() > 5) { return false }
    return new google.maps.FusionTablesLayer({
      map: map,
      suppressInfoWindows: true,
      query: {
        select: "geo",
        from: "1ZxWCBztPbuJqOFulc7OK0k04ycvsEdesLM08zyI5",
      },
      styles: [{
        where: "winner = 'donald'",
        polygonOptions: { fillColor: "#ff0000", fillOpacity: 0.3 }
      }, {
        where: "winner = 'hillary'",
        polygonOptions: { fillColor: "#0000ff", fillOpacity: 0.3 }
      }],
    })
  }

  var getCountyLayer = function(map, state) {
    if (map.getZoom() <= 5) { return false }
    return new google.maps.FusionTablesLayer({
      map: map,
      suppressInfoWindows: true,
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
    var goToState = window.stateData[window.currentState][direction].value
    if (!!goToState) {
      window.currentState = goToState
      map.setCenter({
        lat: window.stateData[goToState].latitude.value,
        lng: window.stateData[goToState].longitude.value
      })
      google.maps.event.trigger(map, 'dragend')
    }
  })
  google.maps.event.trigger(map, 'zoom_changed')

  return map
}

init = function() {
  map = window.setupMap('states')
  results = document.getElementById('stateResult')
  results.addEventListener('mousedown', function(e) { window.draggable.start(this, 'body', e) })
  results.addEventListener('mouseup', function(e) { window.draggable.stop('body') })
  document.getElementById('resultLink').addEventListener('click', function() {
    map.setCenter({
      lat: window.stateData[window.currentState].latitude.value,
      lng: window.stateData[window.currentState].longitude.value
    })
    map.setZoom(6)
  })
}

setData = function(data) {
  if (data.error) { console.log(data.error); return false; }
  window.stateData = {}
  for (i = 0; i < data.rows.length; i++) {
    obj = {}
    for (j = 1; j < data.columns.length; j++) {
      obj[data.columns[j]] = { name: data.columns[j], value: data.rows[i][j] }
    }
    window.stateData[data.rows[i][0]] = obj
  }
}
