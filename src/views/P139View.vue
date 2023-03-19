<template>
  <div class="h-screen relative">
    <GeoErrorModal v-if="geoError" :geoErrorMsg="geoErrorMsg" @closeGeoError="closeGeoError" />
    <div class="flex h-full z-[1]">
      <div class="w-1/5 md:w-1/5 m-3">
        <div class="relative flex-1 md:min-w-[350px]">


          <label for="jobid">เลขที่ใบงาน:</label>
          <input class="pl-9 pr-4 py-3 text-[14px] focus:outline-none w-full shadow-md rounded-md my-2" type="text"
            v-model="jobId" placeholder="Start your search..." />

          <p>สถานะงาน:</p>

          <input type="checkbox" id="checkbox-1" v-model="statusAll" name="checkbox-1" value="Y">
          <label for="checkbox-1" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ทั้งหมด</label><br>

          <input type="checkbox" id="checkbox-2" v-model="statusJ02" name="checkbox-2" value="Y">
          <label for="checkbox-2" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">มอบหมายงาน</label><br>

          <input type="checkbox" id="checkbox-3" v-model="statusJ03" name="checkbox-3" value="Y">
          <label for="checkbox-3" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">เปิดงานภาคสนาม</label><br>

          <input type="checkbox" id="checkbox-4" v-model="statusJ04" name="checkbox-4" value="Y">
          <label for="checkbox-4" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ภาคสนามเสร็จสิ้น</label><br>

          <input type="checkbox" id="checkbox-5" v-model="statusJ09" name="checkbox-5" value="Y">
          <label for="checkbox-5" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ปิดงาน</label><br>

          <input type="checkbox" id="checkbox-6" v-model="statusJ12" name="checkbox-6" value="Y">
          <label for="checkbox-6" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ยกเลิกงาน</label><br>

          <label for="divisions">กองงาน:</label>

          <select name="divisions" id="divisions"
            class="pl-9 pr-4 py-3 text-[14px] focus:outline-none w-full shadow-md rounded-md my-2">
            <option value="">no</option>
          </select>

          <label for="areas">พื้นที่เฝ้าระวัง:</label>

          <select name="areas" id="areas"
            class="pl-9 pr-4 py-3 text-[14px] focus:outline-none w-full shadow-md rounded-md my-2">
            <option value="">no</option>
          </select>

          <button class="p-3 text-[14px] focus:outline-none w-full shadow-md rounded-md my-2"
            @click="search">Search</button>

          <!-- Search Queries -->
          <div v-if="searchResults" class="h-[200px] overflow-scroll bg-white rounded-md">
            <!-- Loading Spinner -->
            <LoadingSpinner v-if="searchData" />
            <!-- Display Results -->
            <div v-else>
            </div>
          </div>
          
          <div class="px-4 py-2 flex gap-x-2 cursor-pointer hover:bg-slate-600 hover:text-white"
            v-for="(result, index) in searchData" :key="index" @click="plotResult2(result)">
            <i class="fas fa-map-marker-alt"></i>
            <p class="text-[12px]">{{ result.jobCode }}</p>
          </div>
        </div>

      </div>
      <div id="mapid" class="w-4/5 md:w-4/5 h-full z-[1]"></div>
    </div>
  </div>
</template>

<script>
import leaflet from "leaflet";
import { onMounted, ref } from "vue";
import axios from "axios";
import GeoErrorModal from "../components/GeoErrorModal.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";

export default {
  name: "HomeView",
  props: [],
  components: { GeoErrorModal, LoadingSpinner },
  setup(props) {
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
      // fetch("https://api.npoint.io/f4dfdf9ddeaee2983915")
      // .then(res => res.json())
      // .then(data => {
      //   console.log(JSON.parse(JSON.stringify(data)));
      //   const arr = (JSON.parse(JSON.stringify(data))).locations;

      //   // loop through each location of array and plot marker
      //   arr.forEach(location => {
      //     const greenIcon = leaflet.icon({
      //       iconUrl: require("../assets/map-marker-green.png"),
      //       iconSize: [25, 41], // size of the icon
      //     });
      //     const marker = leaflet.marker([location.latitude, location.longitude], {icon: greenIcon}).addTo(map);
      //     // add popup for each marker
      //     const popupContent = leaflet.popup().setContent(location.name);
      //     marker.addTo(map).bindPopup(popupContent);
      //   });
      // })
      // .catch(err => {
      //   console.error(err)
      // });

    });
    const coords = ref(null);
    const fetchCoords = ref(null);
    const geoMarker = ref(null);
    const geoError = ref(null);
    const geoErrorMsg = ref(null);

    const searchQuery = ref(null);
    const jobId = ref(null);
    const statusAll = ref(null);
    const statusJ02 = ref(null);
    const statusJ03 = ref(null);
    const statusJ04 = ref(null);
    const statusJ09 = ref(null);
    const statusJ12 = ref(null);
    const searchData = ref(null);
    const queryTimeout = ref(null);


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

    const plotResult2 = (datas) => {
      alert(JSON.stringify(datas));
      // If there is already a marker, remove it. Only allow 1
      if (resultMarker.value) {
        map.removeLayer(resultMarker.value);
      }
      const customMarker = leaflet.icon({
        iconUrl: require("../assets/map-marker-gold.png"),
        iconSize: [25, 41], // size of the icon
      });
      resultMarker.value = leaflet
        .marker([datas.latitude, datas.longitude], { icon: customMarker })
        .addTo(map);
      map.setView([datas.latitude, datas.longitude], 13);

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
    const resultSearchMarker = ref(null);
    const search = () => {

      //console.log(resultSearchMarker.value);
      
      // If there is already a marker, remove it. Only allow 1
      if (resultSearchMarker.value) {
        map.removeLayer(resultSearchMarker.value);
      }
      clearTimeout(queryTimeout.value);
      // reset data on a new search
      searchData.value = null;
      queryTimeout.value = setTimeout(async () => {
        // Only make search, if there is value in query input
        if (searchQuery.value !== "") {
          const params = new URLSearchParams({
            JOB_CODE: jobId.value,
            JOB_STATUS_ALL: (statusAll.value) ? "Y" : "N",
            JOB_STATUS_J02: (statusJ02.value) ? "Y" : "N",
            JOB_STATUS_J03: (statusJ03.value) ? "Y" : "N",
            JOB_STATUS_J04: (statusJ04.value) ? "Y" : "N",
            JOB_STATUS_J09: (statusJ09.value) ? "Y" : "N",
            JOB_STATUS_J12: (statusJ12.value) ? "Y" : "N",
            proximity: props.coords ? `${props.coords.lng},${props.coords.lat}` : "0,0",
          });
          const data = await axios.get(`http://localhost:3000/api/search/p139/p139?${params}`);

          //console.log(data.data.dataList)
          searchData.value = data.data.dataList;

          data.data.dataList.forEach(location => {
            const greenIcon = leaflet.icon({
              iconUrl: require("../assets/map-marker-green.png"),
              iconSize: [25, 41], // size of the icon
            });
            resultSearchMarker.value = leaflet.marker([location.latitude, location.longitude], { icon: greenIcon }).addTo(map);
            // add popup for each marker
            const popupContent = leaflet.popup().setContent(location.jobCode);
            resultSearchMarker.value.addTo(map).bindPopup(popupContent);
          });
        }
      }, 750);
    };

    return {
      geoError,
      closeGeoError,
      geoErrorMsg,
      fetchCoords,
      coords,
      getGeolocation,
      plotResult,
      plotResult2,
      searchResults,
      toggleSearchResults,
      closeSearchResults,
      removeResult,
      jobId,
      statusAll,
      statusJ02,
      statusJ03,
      statusJ04,
      statusJ09,
      statusJ12,
      searchQuery,
      search,
      searchData
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