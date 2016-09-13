'use strict';

// coordinates - { lat: Number, lng: Number }
// zoomLevel - Number
// timeRange - { start: Number, end: Number }

(function () {

    function PokeMap(coordinates, zoomLevel, timeRange, tileLayer, tileLayerOptions) {

        if (!tileLayer) {
            tileLayer = 'http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png';
            tileLayerOptions = {
                attribution: '' +
                             'JS16 <a href="https://github.com/PokemonGoers/PokeMap-1">PokeMap</a>, ' +
                             'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
                             'contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                             'Imagery © <a href="http://thunderforest.com">Thunderforest/OpenCycleMap</a>, ' +
                             'Pokemon Images © <a href="http://pokemondb.net/">Pokémon Database</a>',
                maxZoom:     18
            };
        }

        if (!coordinates) {
            throw new Error('coordinates is not defined');
        }

        if (!zoomLevel) {
            throw new Error('zoomLevel is not defined');
        }

        if (!timeRange) {
            throw new Error('timeRange is not defined');
        }

        var self = this;

        this.goto = goto;
        this.updatePoint = updatePoints;
        this.on = on;
        self.timeRange = JSON.parse(JSON.stringify(timeRange));

        // { eventName: [eventHandlers]
        var eventHandlers = {};
        var mymap = null;
        var dataService = new DataService();

        initMap();

        function initMap() {

            mymap = L.map('mapid');
            L.tileLayer(tileLayer, tileLayerOptions).addTo(mymap);
            self.goto(coordinates, zoomLevel);

            mymap.on('moveend', function (event) {


                var latlng = event.target.getCenter();
                var zoom = event.target.getZoom();

                updatePoints();

                fireEvent('moveend', {

                    latlng: latlng,
                    zoom:   zoom

                });
            });

            updatePoints();

        }

        function fireEvent(eventName, args) {

            var handlers = eventHandlers[eventName];
            if (Array.isArray(handlers)) {

                handlers.map(function (handler) {

                    if (typeof(handler) === 'function') {

                        handler(args);

                    }

                });

            }

        }

        function on(eventName, callback) {

            if (!Array.isArray(eventHandlers[eventName])) {
                eventHandlers[eventName] = [];
            }

            eventHandlers[eventName].push(callback);

        }

        function off(eventName, callback) {

            if (!Array.isArray(eventHandlers[eventName])) {
                return;
            }

            var handlers = eventHandlers[eventName];

            var handlersToRemove = handlers.filter(function (handler) {

                return callback === handler;

            });

            handlersToRemove.map(function (handler) {

                var index = handlers.indexOf(handler);
                handlers.splice(index, 1);

            });

        }

        function updatePoints() {

            // mymap.clearLayers();

            var bounds = {
                from: mymap.getBounds().getNorthWest(),
                to: mymap.getBounds().getSouthEast()
            };

            dataService.getData(bounds, function(response) {

                // TODO: clear the map here

                if(response.data && response.data.length) {

                    response.data.map(addPokemonMarker);

                }

            });

        }

        function goto(coordinates, zoomLevel) {
            if (!zoomLevel) {
                zoomLevel = mymap.getZoom();
            }
            mymap.setView([coordinates.lat, coordinates.lng], zoomLevel);
        }

        function updateTimeRange(timeRange) {

            self.timeRange = timeRange;
            updatePoints();

        }

        var PokemonIcon = L.Icon.extend({
            options: {
                iconSize:     [30, 30],
                shadowSize:   [50, 64],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });

        function addPokemonMarker(pokemon) {

            var rootIconUrl = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/id/' + pokemon.pokemonId + '/icon';

            var icon = new PokemonIcon({iconUrl: rootIconUrl});
            var coordinates = L.latLng(pokemon.location.coordinates[1], pokemon.location.coordinates[0]);
            var marker = L.marker(coordinates, {
                icon: icon
            });

            marker.addTo(mymap);
            //marker.addTo(mymap).on('click', displayBasicPokeData);

            function displayBasicPokeData(event) {

                //TODO: check if the pokemonId of the clicked pokemon can be taken like that or not (probably not :))
                getPokemonDetailsById(pokemon.pokemonId, function(response){



                });

             };

            return marker;

        }

    }

    function DataService() {

        var self = this;

        var dbService = {

            getPastData: function (location, callback) {

                var locationFrom = location.from.lng + ',' + location.from.lat;
                var locationTo = location.to.lng + ',' + location.to.lat;

                var xhr = new XMLHttpRequest();
                var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/coordinates/from/' + locationFrom + '/to/' + locationTo;
                xhr.open("GET", url, true);
                xhr.onreadystatechange = function() {

                    if (xhr.readyState === 4 && xhr.status === 200) {

                        var json = JSON.parse(xhr.responseText);

                        callback(json);

                    } else {

                    }
                };

                xhr.send();

            },


            //supposing that we could get the predicted data through the same api
            getPredictedData: function (location, callback) {

                var locationFrom = location.from.lng + ',' + location.from.lat;
                var locationTo = location.to.lng + ',' + location.to.lat;

                var xhr = new XMLHttpRequest();
                var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/coordinates/from/' + locationFrom + '/to/' + locationTo;
                xhr.open("GET", url, true);
                xhr.onreadystatechange = function() {

                    if (xhr.readyState === 4 && xhr.status === 200) {

                        var json = JSON.parse(xhr.responseText);

                        callback(json);

                    } else {

                    }
                };

                xhr.send();

            },

            getPokemonDetailsById: function (id, callback) {

                var xhr = new XMLHttpRequest();
                var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/id/' + id;
                xhr.open("GET", url, true);
                xhr.onreadystatechange = function() {

                    if (xhr.readyState === 4 && xhr.status === 200) {

                        var json = JSON.parse(xhr.responseText);

                        callback(json);

                    } else {

                    }
                };

                xhr.send();

            },

            getPokemonDataByTimeRange: function(from, to, callback){

                //The way the URL is requested is a bit different from what Catch em All group was thinking. Maybe we
                //need to talk to the Data team to change this API is requested (just in seconds or minutes before and after.

                //TODO: To be rechecked. the range is not clear how should it be specified. Currently not working.

                var currentTime = new Date();
                var startTimeStamp = new Date(currentTime .getTime() + 1000*from);
                var startTimeStampString = startTimeStamp.toUTCString();
                var range = to - from + 's';

                var xhr = new XMLHttpRequest();
                var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/ts/' + startTimeStampString + '/range/' + range;
                xhr.open("GET", url, true);
                xhr.onreadystatechange = function() {

                    if (xhr.readyState === 4 && xhr.status === 200) {

                        var json = JSON.parse(xhr.responseText);

                        callback(json);

                    } else {

                    }
                };

                xhr.send();

            }
        };

        function twitterService() {
            function getTwitterData() {

            }
        }

        self.getData = function (bounds, updateCallback) {

            dbService.getPastData(bounds, updateCallback);
            return;


            if (timeRange.start < 0 && timeRange.end < 0) {

                //get past data from database
                var pokemons = dbService.getPastData(bounds, updateCallback);
                return pokemons;

            } else {

                if (timeRange.start > 0 && timeRange.end > 0) {

                    //get predictions from database
                    var pokemons = dbService.getPredictedData(from, to, updateCallback);
                    return pokemons;

                } else {

                    //get data from database
                    //get data from twitter via sockets
                    var pokemons = dbService.getPastData(bounds, updateCallback);

                    pokemons.push(dbService.getPredictedData(bounds, updateCallback));
                    return pokemons;


                }
            }

            var mockPokemons = [
                {
                    id:          1,
                    name:        'Rattata',
                    coordinates: {
                        lat: 48.262457,
                        lng: 11.669183
                    }
                },
                {
                    id:          2,
                    name:        'Pikachu',
                    coordinates: {
                        lat: 45.245842,
                        lng: 14.674122
                    }
                },
                {
                    id:          3,
                    name:        'Metapod',
                    coordinates: {
                        lat: 47.463472,
                        lng: 12.169228
                    }
                },
                {
                    id:          4,
                    name:        'Kakuna',
                    coordinates: {
                        lat: 46.162539,
                        lng: 13.666696
                    }
                },
                {
                    id:          5,
                    name:        'Arbok',
                    coordinates: {
                        lat: 44.467508,
                        lng: 14.371981
                    }
                },
                {
                    id:          6,
                    name:        'abra',
                    coordinates: {
                        lat: 48.1361,
                        lng: 11.5810
                    }
                },
                {
                    id:          7,
                    name:        'diglett',
                    coordinates: {
                        lat: 48.1471,
                        lng: 11.5820
                    }
                },
                {
                    id:          8,
                    name:        'clefairy',
                    coordinates: {
                        lat: 48.1441,
                        lng: 11.5870
                    }
                },
                {
                    id:          9,
                    name:        'dugtrio',
                    coordinates: {
                        lat: 48.1411,
                        lng: 11.5715
                    }
                }
            ];

            return mockPokemons;

        };

    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], function () { return PokeMap; });
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = PokeMap;
    } else {
        // Browser global
        window.PokeMap = PokeMap;
    }

})();