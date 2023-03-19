<template>
  <div class="h-screen relative">
    <GeoErrorModal
    v-if="geoError"
    :geoErrorMsg="geoErrorMsg"
    @closeGeoError="closeGeoError"
    />
    <MapFeatures
    :fetchCoords="fetchCoords"
    :coords="coords"
    @toggleSearchResults="toggleSearchResults"
    @getGeolocation="getGeolocation"
    @plotResult="plotResult"
    @removeResult="removeResult"
    :searchResults="searchResults"
    class="w-full md:w-auto absolute md:top-[40px] md:left-[60px] z-[2]"
    />
    <div class="flex h-full z-[1]">
  <div class="w-1/5 md:w-1/4"><SearchForm /></div>
  <div id="mapid" class="w-4/5 md:w-3/4 h-full z-[1]"></div>
  </div>
</div>
    
</template>

<script>
import leaflet from "leaflet";
import { onMounted, ref } from "vue";
import GeoErrorModal from "../components/GeoErrorModal.vue";
import MapFeatures from "../components/MapFeatures.vue";
import SearchForm from "../components/SearchForm.vue";
export default {
  name: "HomeView",
  components: { GeoErrorModal, MapFeatures, SearchForm },
  setup() {
    let map;
    onMounted(() => {
      // init map
      map = leaflet
      .map("mapid", {
        zoomControl: false,
      })
      .setView([32.880771864030, -117.23756790425], 10);
      // add tile layers
      leaflet
      .tileLayer(
      `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${process.env.VUE_APP_API_KEY}`,
      {
        maxZoom: 18,
        id: "mapbox/streets-v11",
        tileSize: 512,
        zoomOffset: -1,
        accessToken: process.env.VUE_APP_API_KEY,
      }
      )
      .addTo(map);
      map.on("moveend", () => {
        closeSearchResults();
      });
      // get users location
      getGeolocation();
      
      // fetch json file of map marker locations from endpoint
      fetch("https://api.npoint.io/f4dfdf9ddeaee2983915")
      .then(res => res.json())
      .then(data => {
        console.log(JSON.parse(JSON.stringify(data)));
        const arr = (JSON.parse(JSON.stringify(data))).locations;
        
        // loop through each location of array and plot marker
        arr.forEach(location => {
          const greenIcon = leaflet.icon({
            iconUrl: require("../assets/map-marker-green.png"),
            iconSize: [25, 41], // size of the icon
          });
          const marker = leaflet.marker([location.latitude, location.longitude], {icon: greenIcon}).addTo(map);
          // add popup for each marker
          const popupContent = leaflet.popup().setContent(location.name);
          marker.addTo(map).bindPopup(popupContent);
        });
      })
      .catch(err => {
        console.error(err)
      });
      
    });
    const coords = ref(null);
    const fetchCoords = ref(null);
    const geoMarker = ref(null);
    const geoError = ref(null);
    const geoErrorMsg = ref(null);
    
    const getGeolocation = () => {
      // if function is called, only run if we dont have coords
      if (!coords.value) {
        // check to see if we have coods in session sotrage
        if (sessionStorage.getItem("coords")) {
          coords.value = JSON.parse(sessionStorage.getItem("coords"));
          plotGeoLocation(coords.value);
          return;
        }
        // else get coords from geolocation API
        fetchCoords.value = true;
        navigator.geolocation.getCurrentPosition(setCoords, getLocError);
        return;
      }
      // otherwise, remove location
      coords.value = null;
      sessionStorage.removeItem("coords");
      map.removeLayer(geoMarker.value);
    };
    const setCoords = (pos) => {
      // stop fetching
      fetchCoords.value = null;
      // set coords in session storage
      const setSessionCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      sessionStorage.setItem("coords", JSON.stringify(setSessionCoords));
      // set ref coords value
      coords.value = setSessionCoords;
      plotGeoLocation(coords.value);
    };
    const getLocError = (error) => {
      // stop fetching coords
      fetchCoords.value = null;
      geoError.value = true;
      geoErrorMsg.value = error.message;
    };
    const plotGeoLocation = (coords) => {
      // create custom marker
      const customMarker = leaflet.icon({
        iconUrl: require("../assets/map-marker-red.png"),
        iconSize: [25, 41],
      });
      // create new marker with coords and custom marker
      geoMarker.value = leaflet
      .marker([coords.lat, coords.lng], { icon: customMarker })
      .addTo(map);
      // set map view to current location
      map.setView([coords.lat, coords.lng], 10);
    };
    const resultMarker = ref(null);
    const plotResult = (coords) => {
      // If there is already a marker, remove it. Only allow 1
      if (resultMarker.value) {
        map.removeLayer(resultMarker.value);
      }
      const customMarker = leaflet.icon({
        iconUrl: require("../assets/map-marker-gold.png"),
        iconSize: [25, 41], // size of the icon
      });
      resultMarker.value = leaflet
      .marker([coords.coordinates[1], coords.coordinates[0]], { icon: customMarker })
      .addTo(map);
      map.setView([coords.coordinates[1], coords.coordinates[0]], 13);
    };
    // remove result marker 
    const removeResult = () => {
      map.removeLayer(resultMarker.value);
    };
    const closeGeoError = () => {
      geoErrorMsg.value = null;
      geoError.value = null;
    };
    const searchResults = ref(null);
    const toggleSearchResults = () => {
      searchResults.value = !searchResults.value;
    };
    const closeSearchResults = () => {
      searchResults.value = null;
    };
    return {
      geoError,
      closeGeoError,
      geoErrorMsg,
      fetchCoords,
      coords,
      getGeolocation,
      plotResult,
      searchResults,
      toggleSearchResults,
      closeSearchResults,
      removeResult,
    };
  },
  // methods: {
    //   dropMarker(position) {
      //     const marker = new window.H
      //   }
      // }
    };
  </script>
  
  <style src="../assets/tailwind.css"></style>