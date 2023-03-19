<template>
    <div class="relative flex-1 md:min-w-[350px]">

       
        <label for="jobid">เลขที่ใบงาน:</label>
        <input
          class="pl-9 pr-4 py-3 text-[14px] focus:outline-none w-full shadow-md rounded-md my-2"
          type="text"
          v-model="jobId"
          placeholder="Start your search..."
        />

        <p>สถานะงาน:</p>

        <input type="checkbox" 
            id="checkbox-1"
            v-model="statusAll"
            name="checkbox-1"
            value="Y"
        >
        <label for="checkbox-1" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ทั้งหมด</label><br>

        <input type="checkbox" 
            id="checkbox-2"
            v-model="statusJ02"
            name="checkbox-2"
            value="Y"
        >
        <label for="checkbox-2" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">มอบหมายงาน</label><br>

        <input type="checkbox" 
            id="checkbox-3"
            v-model="statusJ03"
            name="checkbox-3"
            value="Y"
        >
        <label for="checkbox-3" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">เปิดงานภาคสนาม</label><br>

        <input type="checkbox" 
            id="checkbox-4"
            v-model="statusJ04"
            name="checkbox-4"
            value="Y"
        >
        <label for="checkbox-4" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ภาคสนามเสร็จสิ้น</label><br>

        <input type="checkbox" 
            id="checkbox-5"
            v-model="statusJ09"
            name="checkbox-5"
            value="Y"
        >
        <label for="checkbox-5" class="pl-9 pr-4 py-3 text-[14px]  w-full my-1">ปิดงาน</label><br>

        <input type="checkbox" 
            id="checkbox-6"
            v-model="statusJ12"
            name="checkbox-6"
            value="Y"
        >
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
    <div
            v-if="searchResults"
            class="h-[200px] overflow-scroll bg-white rounded-md"
          >
            <!-- Loading Spinner -->
            <LoadingSpinner v-if="searchData" />
            <!-- Display Results -->
            <div v-else>
            </div>
                

            
          </div>
          <div
                class="px-4 py-2 flex gap-x-2 cursor-pointer hover:bg-slate-600 hover:text-white"
                v-for="(result, index) in searchData"
                :key="index"
                @click="selectResult2(result)"
              >
                <i class="fas fa-map-marker-alt"></i>
                <p class="text-[12px]">{{ result.jobCode }}</p>
              </div>
    </div>
    
</template>

<script>
import leaflet from "leaflet";
  import { ref } from "vue";
  import axios from "axios";
  import LoadingSpinner from "./LoadingSpinner.vue";
  export default {
    props: ["fetchCoords", "coords", "searchResults"],
    components: { LoadingSpinner },
    setup(props, { emit }) {
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
      const selectedResult = ref(null);
      const resultMarker = ref(null);
    //   const coords = null;

    // init map
    let map = leaflet
      .map("mapid", {
        zoomControl: false,
      })
      .setView([32.880771864030, -117.23756790425], 10);

      const search = () => {
        clearTimeout(queryTimeout.value);
        // reset data on a new search
        searchData.value = null;
        queryTimeout.value = setTimeout(async () => {
          // Only make search, if there is value in query input
          if (searchQuery.value !== "") {
            const params = new URLSearchParams({
                JOB_CODE: jobId.value,
                JOB_STATUS_ALL: (statusAll.value)?"Y":"N",
                JOB_STATUS_J02: (statusJ02.value)?"Y":"N",
                JOB_STATUS_J03: (statusJ03.value)?"Y":"N",
                JOB_STATUS_J04: (statusJ04.value)?"Y":"N",
                JOB_STATUS_J09: (statusJ09.value)?"Y":"N",
                JOB_STATUS_J12: (statusJ12.value)?"Y":"N",
                proximity: props.coords ? `${props.coords.lng},${props.coords.lat}` : "0,0",
            });
            const data = await axios.get(`http://localhost:3000/api/search/p139/p139?${params}`);
            
            //console.log(data.data.dataList)
            searchData.value = data.data.dataList;
            //console.log(searchData);

            // data.data.dataList.forEach((item, index) => {
            // // has access to outer scope `parentMessage`
            // // but `item` and `index` are only available in here
            // console.log(item.jobCode,index);
            // coords.latitude = item.latitude;
            // coords.longitude = item.longitude;

            // emit("plotResult2", coords);
            // })
            

          }
        }, 750);
      };

      // Select a result from search results
      const selectResult2 = (result) => {

        //alert(JSON.stringify(result))
        selectedResult.value = result;

        alert(JSON.stringify(result));
        
        const customMarker = leaflet.icon({
        iconUrl: require("../assets/map-marker-gold.png"),
        iconSize: [25, 41], // size of the icon
      });
      resultMarker.value = leaflet
      .marker([result.latitude, result.longitude], { icon: customMarker })
      .addTo(map);
      map.setView([result.latitude, result.longitude], 13);

      };

      // Select a result from search results
      const selectResult = (result) => {
        selectedResult.value = result;
        emit("plotResult", result.geometry);
      };
      const removeResult = () => {
        selectedResult.value = null;
        emit("removeResult");
      };
      return {
        jobId,
        statusAll,
        statusJ02,
        statusJ03,
        statusJ04,
        statusJ09,
        statusJ12,
        searchQuery,
        search,
        searchData,
        selectResult,
        selectResult2,
        selectedResult,
        removeResult,
      };
    },
  };
  </script>
<style src="../assets/tailwind.css"></style>