import { Component, AfterViewInit } from '@angular/core';
import { tileLayer, latLng, marker, Marker, icon, Map } from 'leaflet';
import * as L from 'leaflet'; // Import the L namespace
import * as proj4 from 'proj4';
import 'proj4leaflet';
import { fetchWeatherApi } from 'openmeteo';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  address: string = '';
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 200, attribution: '© OpenStreetMap contributors' })
    ],
    zoom: 12,
    center: latLng(47.499950, 8.737565)
  };
  layers: Marker<any>[] = [];
  private map: Map;

  ngAfterViewInit() {
    this.map = new Map('map').setView(this.options.center, this.options.zoom);

    // Add OpenStreetMap base layer
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add WMS layer from geocat.ch (Switzerland maps)
    tileLayer.wms('https://wms.geo.admin.ch/', {
      layers: 'ch.bafu.gefaehrdungskarte-oberflaechenabfluss', // Replace with desired geocat.ch layer
      format: 'image/png',
      transparent: true,
      attribution: 'Map data © geocat.ch'
    }).addTo(this.map);

    // Fetch and add GeoJSON layer
    this.addGeoJSONLayer();

    // Listen for the moveend event
    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.options.center = latLng(center.lat, center.lng);
      this.options.zoom = this.map.getZoom();
      console.log('Map moved to center:', this.options.center, 'with zoom:', this.options.zoom);
    });
  }

  private addGeoJSONLayer(): void {
    const geojsonUrl = 'https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-10min/ch.meteoschweiz.messwerte-niederschlag-10min_de.json';

    // Define the EPSG:2056 projection
    const crs = new L.Proj.CRS('EPSG:2056',
      '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      {
        resolutions: [4000, 2000, 1000, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5]
      }
    );

    fetch(geojsonUrl)
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            // Transform coordinates from EPSG:2056 to EPSG:4326
            const transformedLatLng = crs.projection.unproject(L.point(latlng.lng, latlng.lat));
            return L.marker(transformedLatLng, {
              icon: L.icon({
                iconSize: [25, 41],
                iconAnchor: [13, 41],
                iconUrl: 'assets/images/marker-icon.png',
                iconRetinaUrl: 'assets/images/marker-icon-2x.png',
                shadowUrl: 'assets/images/marker-shadow.png'
              })
            });
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.description) {
              layer.bindPopup(feature.properties.description);
            }
          }
        }).addTo(this.map);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  }

  searchAddress() {
    if (!this.address) return;

    console.log('Searching for address:', this.address);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.address}`)
      .then(response => response.json())
      .then(data => {
        console.log('Search results:', data);
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          this.updateMap(lat, lon);
          this.getWeather(lat, lon);
        } else {
          alert('Address not found');
        }
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        alert('Error fetching address');
      });
  }

  updateMap(lat: number, lon: number) {
    const newCenter = latLng(lat, lon);
    this.map.setView(newCenter, 15); // Directly update the map center and zoom
    this.layers = [marker([lat, lon], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'assets/images/marker-icon.png',
        iconRetinaUrl: 'assets/images/marker-icon-2x.png',
        shadowUrl: 'assets/images/marker-shadow.png'
      })
    })];
    console.log('Map updated to center:', newCenter);
  }

  async getWeather(lat: number, lon: number) {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    var end_date  = yyyy + '-' + mm + '-' + dd;
    var start_date = yyyy - 10 + '-' + mm + '-' + dd;

    const params = {
      "latitude": lat,
      "longitude": lon,
      "start_date": start_date,
      "end_date": end_date,
      "hourly": ["temperature_2m", "precipitation", "rain", "snowfall", "snow_depth", "wind_speed_10m", "wind_speed_100m", "wind_gusts_10m"]
    };
    const url = "https://archive-api.open-meteo.com/v1/archive";
    const responses = await fetchWeatherApi(url, params);

    // Helper function to form time ranges
    const range = (start: number, stop: number, step: number) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    // Attributes for timezone and location
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const latitude = response.latitude();
    const longitude = response.longitude();

    const hourly = response.hourly()!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {

      hourly: {
        time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
          (t) => new Date((t + utcOffsetSeconds) * 1000)
        ),
        temperature2m: hourly.variables(0)!.valuesArray()!,
        precipitation: hourly.variables(1)!.valuesArray()!,
        rain: hourly.variables(2)!.valuesArray()!,
        snowfall: hourly.variables(3)!.valuesArray()!,
        snowDepth: hourly.variables(4)!.valuesArray()!,
        windSpeed10m: hourly.variables(5)!.valuesArray()!,
        windSpeed100m: hourly.variables(6)!.valuesArray()!,
        windGusts10m: hourly.variables(7)!.valuesArray()!,
      },

    };

    console.log("Weather data number: " + weatherData.hourly.time.length);

    await this.printAverage(weatherData);
    console.log("Weather data: ", weatherData);
  }

  async printAverage(weatherData) {
    //get average of each parameter
    var sumTemp = 0;
    var sumPrec = 0;
    var sumRain = 0;
    var sumSnow = 0;
    var sumSnowDepth = 0;
    var sumWindSpeed10m = 0;
    var sumWindSpeed100m = 0;
    var sumWindGusts10m = 0;

    for (let i = 0; i < weatherData.hourly.time.length; i++) {
      sumTemp += weatherData.hourly.temperature2m[i];
      sumPrec += weatherData.hourly.precipitation[i];
      sumRain += weatherData.hourly.rain[i];
      sumSnow += weatherData.hourly.snowfall[i];
      sumSnowDepth += weatherData.hourly.snowDepth[i];
      sumWindSpeed10m += weatherData.hourly.windSpeed10m[i];
      sumWindSpeed100m += weatherData.hourly.windSpeed100m[i];
      sumWindGusts10m += weatherData.hourly.windGusts10m[i];
    }

    var avgTemp = sumTemp / weatherData.hourly.time.length;
    var avgPrec = sumPrec / weatherData.hourly.time.length;
    var avgRain = sumRain / weatherData.hourly.time.length;
    var avgSnow = sumSnow / weatherData.hourly.time.length;
    var avgSnowDepth = sumSnowDepth / weatherData.hourly.time.length;
    var avgWindSpeed10m = sumWindSpeed10m / weatherData.hourly.time.length;
    var avgWindSpeed100m = sumWindSpeed100m / weatherData.hourly.time.length;
    var avgWindGusts10m = sumWindGusts10m / weatherData.hourly.time.length;

    console.log("Weather data of the last 20 years average: ");
    console.log("Average temperature: " + avgTemp);
    console.log("Average precipitation: " + avgPrec);
    console.log("Average rain: " + avgRain);
    console.log("Average snow: " + avgSnow);
    console.log("Average snow depth: " + avgSnowDepth);
    console.log("Average wind speed 10m: " + avgWindSpeed10m);
    console.log("Average wind speed 100m: " + avgWindSpeed100m);
    console.log("Average wind gusts 10m: " + avgWindGusts10m);
  }
}
