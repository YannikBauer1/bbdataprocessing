<template>
  <div class="container px-6 pb-8">
    <div class="title text-2xl text-center py-4">
      <div class="mb-2">Bodybuilding Data Verification</div>
      <!--
      <input type="file" @change="handleFileUpload" accept=".csv" class="border text-sm" />-->
    </div>

    <div v-if="file.length > 0 && !loading && !error">
      <div class="mb-4 flex justify-between">
        <UButton class="text-xs mr-2" disabled>
          Check corrected Files
        </UButton>
        <div class="border-2 border-solid border-yellow-500 px-2 py-1 rounded">
          Files to correct: <span class="font-bold text-yellow-500">{{ files.length }}</span>
        </div>
        <UButton class="text-xs" @click="saveFile">
          Save File
        </UButton>
      </div>

      <div class="flex flex-col lg:flex-row">
        <div class="w-full lg:w-1/2 pr-0 lg:pr-4 mb-4 lg:mb-0">
          <img :src="image_url" alt="Competition Image"
            class="competition-image w-full h-auto object-cover rounded" />
        </div>
        <div class="w-full lg:w-1/2 pl-0 lg:pl-4">
          <table class="mb-4 w-full table-auto text-sm">
            <tbody>
              <tr>
                <td class="key font-medium w-28">Competition:</td>
                <td class="value"><UInput v-model="competition" size="2xs"/></td>
              </tr>
              <tr>
                <td class="key font-medium">Location:</td>
                <td class="value"><UInput v-model="location" size="2xs"/></td>
              </tr>
              <tr>
                <td class="key font-medium">Date:</td>
                <td class="value"><UInput v-model="date" size="2xs"/></td>
              </tr>
            </tbody>
          </table>

          <table class="text-sm w-full table-auto border-collapse">
            <thead>
              <tr class="border text-xs">
                <th class="border-r p-1">Athlete</th>
                <th class="border-r p-1">Country</th>
                <th class="border-r p-1">PreJu</th>
                <th class="border-r p-1">Finals</th>
                <th class="border-r p-1">Total</th>
                <th class="border-r p-1">Place</th>
                <th class="border-r p-1">Category</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(competitor, index) in file" :key="index" class="border">
                <td class="p-1 border-r">
                  <UInput v-model="competitor.competitors_name" size="2xs"/>
                </td>
                <td class="p-1 border-r">
                  <UInput v-model="competitor.country" size="2xs"/>
                </td>
                <td class="border-r p-1 w-12">
                  <UInput v-model="competitor.judging" size="2xs"/>
                </td>
                <td class="border-r p-1 w-12">
                  <UInput v-model="competitor.finals" size="2xs"/>
                </td>
                <td class="border-r p-1 w-12">
                  <UInput v-model="competitor.total" size="2xs"/>
                </td>
                <td class="border-r p-1 w-12">
                  <UInput v-model="competitor.place" size="2xs"/>
                </td>
                <td class="border-r p-1">
                  <UInput v-model="competitor.competition_type" size="2xs"/>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="file.length === 0 && !loading && !error" class="my-6 text-center">
      <p>No files to correct</p>
    </div>

    <div v-else-if="loading && !error" class="my-6 text-center">
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="mt-4 text-center">
      <p class="text-red-500">Error</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Papa from 'papaparse';
import { supabase } from '~/utils/supabase';

const baseUrl = "https://qesnrciwmhxfhdaojwwo.supabase.co/storage/v1/object/public/pipeline/jsons-fromGPT/"
const imageBaseUrl = "https://qesnrciwmhxfhdaojwwo.supabase.co/storage/v1/object/public/resultImages/"

const files = ref([]);
const file = ref([])
const image_url = ref('');
const competition = ref('');
const location = ref('');
const date = ref('');

const loading = ref(false);
const error = ref(false)

onMounted(async () => {
  await myFetch();
});

const myFetch = async () => {
  loading.value = true;
  try {
    await fetchData();
  } catch (error) {
    console.error(error);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const fetchData = async () => {
  const { data: subfolders, error: subfoldersError } = await supabase.storage.from("pipeline").list("jsons-fromGPT", {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (subfoldersError) throw new Error(subfoldersError.message);

  for (const folder of subfolders) {
    let { data: fromGPTData, error: fromGPTError } = await supabase.storage.from("pipeline").list(`jsons-fromGPT/${folder.name}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (fromGPTError) throw new Error(fromGPTError.message);

    let { data: cleanData, error: cleanError } = await supabase.storage.from("pipeline").list(`jsons-clean/${folder.name}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (cleanError) throw new Error(cleanError.message);
    fromGPTData = fromGPTData.filter(file => file.name != ".emptyFolderPlaceholder");
    cleanData = cleanData.filter(file => file.name != ".emptyFolderPlaceholder");

    const cleanFileNames = cleanData.map(file => file.name);

    for (const file of fromGPTData) {
      if (!cleanFileNames.includes(file.name)) {
        const publicURL = baseUrl + `/${folder.name}/` + file.name;
        files.value.push(publicURL);
      }
    }
  }
  console.log(files.value); 
  if (files.value.length > 0) {
    await addFile();
  }
};

const addFile = async () => {
  if (files.value.length > 0) {
    const publicURL = files.value[0];
    const fileName = publicURL.split('/').pop();
    const year = publicURL.split('/')[10];
    const response = await fetch(publicURL);
    const jsonData = await response.json();

    const keys = Object.keys(jsonData);
    const length = Object.keys(jsonData[keys[0]]).length;
    const convertedData = {};

    keys.forEach(key => {
      convertedData[key] = [];
      for (let index in jsonData[key]) {
        if (jsonData[key].hasOwnProperty(index)) {
          convertedData[key].push(jsonData[key][index]);
        }
      }
    });

    const listOfObjects = [];
    for (let i = 0; i < length; i++) {
      const obj = {};
      keys.forEach(key => {
        obj[key] = convertedData[key][i];
      });
      listOfObjects.push(obj);
    }

    file.value = listOfObjects;
    competition.value = file.value[0].competition;
    location.value = file.value[0].location;
    date.value = file.value[0].date;
    image_url.value = imageBaseUrl + "/" + year + '/' + fileName.replace('.json', '');
  }
};

const saveFile = async () => {
  if (file.value.length > 0) {
    const jsonData = {
      competition: [],
      location: [],
      date: [],
      competitors_name: [],
      country: [],
      judging: [],
      finals: [],
      total: [],
      place: [],
      competition_type: []
    };

    file.value.forEach(competitor => {
      jsonData.competition.push(competition.value || null);
      jsonData.location.push(location.value || null);
      jsonData.date.push(date.value || null);
      jsonData.competitors_name.push(competitor.competitors_name || null);
      jsonData.country.push(competitor.country || null);
      jsonData.judging.push(competitor.judging || null);
      jsonData.finals.push(competitor.finals || null);
      jsonData.total.push(competitor.total || null);
      jsonData.place.push(competitor.place || null);
      jsonData.competition_type.push(competitor.competition_type || null);
    });

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const publicURL = files.value[0];
    const fileName = publicURL.split('/').pop();
    const year = publicURL.split('/')[10];
    const filePath = `jsons-clean/${year}/${fileName}`;

    const { data, error } = await supabase.storage.from('pipeline').upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) {
      console.error('Error uploading file:', error.message);
    } else {
      console.log('File uploaded successfully:', data);
      resetData();
      await myFetch();
    }
  }
};

const resetData = () => {
  file.value = [];
  files.value = [];
  competition.value = '';
  location.value = '';
  date.value = '';
  image_url.value = '';
};
</script>
