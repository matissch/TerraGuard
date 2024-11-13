import { Component, AfterViewInit } from '@angular/core';
import { tileLayer, latLng, marker, Marker, icon, Map } from 'leaflet';
import * as L from 'leaflet'; // Import the L namespace
import * as proj4 from 'proj4';
import 'proj4leaflet';
import { fetchWeatherApi } from 'openmeteo';
import { SharedService } from '../shared.service';

const normalTemperature = 10;
const normalPrecipitation = 0.1;
const normalRain = 0.1;
const normalSnowfall = 0.015;
const normalSnowDepth = 0.1;
const normalWindSpeed10m = 10;
const normalWindSpeed100m = 10;
const normalWindGusts10m = 15;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  address: string = '';
  hail: boolean = true;
  rain: boolean = false;
  wmsLayer: any;

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
    this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
      layers: 'ch.meteoschweiz.hagelgefaehrdung-korngroesse_10_jahre', // Replace with desired geocat.ch layer
      format: 'image/png',
      transparent: true,
      opacity: 0.5,
      attribution: 'Map data © geocat.ch'
    }).addTo(this.map);

    // Listen for the moveend event
    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.options.center = latLng(center.lat, center.lng);
      this.options.zoom = this.map.getZoom();
      console.log('Map moved to center:', this.options.center, 'with zoom:', this.options.zoom);
    });
  }

  async searchAddress() {
    if (!this.address) return;

    console.log('Searching for address:', this.address);

    await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.address}`)
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
    // Create a new marker
    const newMarker = marker([lat, lon], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'assets/images/marker-icon.png',
        iconRetinaUrl: 'assets/images/marker-icon-2x.png',
        shadowUrl: 'assets/images/marker-shadow.png'
      })
    });

    // Add the marker to the map and to the layers array
    newMarker.addTo(this.map);
    this.layers.push(newMarker); // Keep track of all markers

    console.log('Added new marker at:', newCenter);
  }


  async fetchWeather(lat: number, lon: number) {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    var end_date = yyyy + '-' + mm + '-' + dd;
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
    return {
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
  }

  // Function to calculate the average of an array
  average(arr: Float32Array) {
    const numericValues = arr.filter(value => typeof value === 'number' && !isNaN(value));
    if (numericValues.length === 0) return NaN;
    return numericValues.reduce((p, c) => p + c, 0) / numericValues.length;
  };

  calculateScore(value: number, normalValue: number) {
    const ratio = value / normalValue;
    let normalized;

    if (ratio >= 1) {
      normalized = 50 + (ratio - 1) * 50;
    } else {
      normalized = 50 - (1 - ratio) * 50;
    }

    // Begrenze die Skala auf 0 - 100
    return Math.max(0, Math.min(100, normalized));
  }

  async getWeather(lat: number, lon: number) {
    try {
      const weatherData = await this.fetchWeather(lat, lon);

      const avgTemp = this.average(weatherData.hourly.temperature2m);
      const avgPrecipitation = this.average(weatherData.hourly.precipitation);
      const avgRain = this.average(weatherData.hourly.rain);
      const avgSnowfall = this.average(weatherData.hourly.snowfall);
      const avgSnowDepth = this.average(weatherData.hourly.snowDepth);
      const avgWindSpeed10m = this.average(weatherData.hourly.windSpeed10m);
      const avgWindSpeed100m = this.average(weatherData.hourly.windSpeed100m);
      const avgWindGusts10m = this.average(weatherData.hourly.windGusts10m);

      // Log averages
      console.log("Average temperature:", avgTemp);
      console.log("Average precipitation:", avgPrecipitation);
      console.log("Average rain:", avgRain);
      console.log("Average snowfall:", avgSnowfall);
      console.log("Average snow depth:", avgSnowDepth);
      console.log("Average wind speed at 10m:", avgWindSpeed10m);
      console.log("Average wind speed at 100m:", avgWindSpeed100m);
      console.log("Average wind gusts at 10m:", avgWindGusts10m);

      const scoreTemp = this.calculateScore(avgTemp, normalTemperature);
      const scorePrecipitation = this.calculateScore(avgPrecipitation, normalPrecipitation);
      const scoreRain = this.calculateScore(avgRain, normalRain);
      const scoreSnowfall = this.calculateScore(avgSnowfall, normalSnowfall);
      const scoreSnowDepth = this.calculateScore(avgSnowDepth, normalSnowDepth);
      const scoreWindSpeed10m = this.calculateScore(avgWindSpeed10m, normalWindSpeed10m);
      const scoreWindSpeed100m = this.calculateScore(avgWindSpeed100m, normalWindSpeed100m);
      const scoreWindGusts10m = this.calculateScore(avgWindGusts10m, normalWindGusts10m);

      this.sharedService.changeScoreTemp(scoreTemp);
      this.sharedService.changeScorePrecipitation(scorePrecipitation);
      this.sharedService.changeScoreRain(scoreRain);
      this.sharedService.changeScoreSnowfall(scoreSnowfall);
      this.sharedService.changeScoreSnowDepth(scoreSnowDepth);
      this.sharedService.changeScoreWindSpeed10m(scoreWindSpeed10m);
      this.sharedService.changeScoreWindSpeed100m(scoreWindSpeed100m);
      this.sharedService.changeScoreWindGusts10m(scoreWindGusts10m);
    } catch (error) {
      console.error("Error fetching or calculating data:", error);
    }
  }

  toggleLayer(event: any) {
    const layer = event.source.name;
    const isChecked = event.checked;
    console.log(`${layer} layer is ${isChecked ? 'enabled' : 'disabled'}`);

    // Update the state of the variables based on the toggle
    if (layer === 'hailToggle') {
      this.hail = isChecked;
      this.rain = !isChecked;
      this.switchLayer();
    } else if (layer === 'rainToggle') {
      this.hail = !isChecked;
      this.rain = isChecked;
      this.switchLayer();
    }
  }

  switchLayer() {
    if (this.hail) {
      // Clear all alyers from map
      this.map.removeLayer(this.wmsLayer);
      this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
        layers: "ch.meteoschweiz.hagelgefaehrdung-korngroesse_10_jahre",
        maxZoom: 15,
        format: 'image/png',
        transparent: true,
        opacity: 0.5,
        attribution: 'Map data © geocat.ch'
      }).addTo(this.map);
    } else if (this.rain) {
      this.map.removeLayer(this.wmsLayer);
      this.wmsLayer = tileLayer.wms('https://wms.geo.admin.ch/', {
        layers: 'ch.bafu.gefaehrdungskarte-oberflaechenabfluss',
        format: 'image/png',
        maxZoom: 15,
        transparent: true,
        attribution: 'Map data © geocat.ch'
      }).addTo(this.map);
    }
  }

  constructor(private sharedService: SharedService) { }


}
