<template>
  <div class="container px-6 pb-8">
    <div class="title text-2xl text-center py-4">
      <div class="mb-2">Bodybuilding Data Processing</div>
      <input type="file" @change="handleFileUpload" accept=".csv" class="border text-sm" />
    </div>

    <div v-if="groupedData && groupedData.length">
      <div class="mb-4 flex justify-between">
        <div>
          <UButton @click="goBack" :disabled="currentIndex === 0" class="text-xs mr-2">
            Back
          </UButton>
          <UButton @click="goNext" :disabled="currentIndex === groupedData.length - 1" class="text-xs mr-2">
            Next
          </UButton>
          <span class="mr-2">
            {{ currentIndex + 1 }} / {{ groupedData.length }}
          </span>
        </div>
        <div>
          <UButton @click="exportCSV" class="text-xs">
            Export CSV
          </UButton>
        </div>
      </div>
      <!--test sth-->

      <div class="flex flex-col lg:flex-row">
        <div class="w-full lg:w-1/2 pr-0 lg:pr-4 mb-4 lg:mb-0">
          <img :src="currentGroup.img_url" alt="Competition Image" class="competition-image w-full h-auto object-cover rounded" />
        </div>
        <div class="w-full lg:w-1/2 pl-0 lg:pl-4">
          <h2 class="text-lg font-semibold mb-2">Competition Details:</h2>
          <table class="mb-4 w-full table-auto">
            <tbody>
              <tr v-for="(value, key) in competitionDetails" :key="key">
                <td class="key font-medium pr-2">{{ formatHeader(key) }}:</td>
                <td class="value">{{ value }}</td>
              </tr>
            </tbody>
          </table>

          <h3 class="competitors-title text-lg font-semibold mb-2">Competitors:</h3>
          <table class="text-sm w-full table-auto border-collapse">
            <thead>
              <tr class="border">
                <th class="border-r p-1">Competitor Name</th>
                <th class="border-r p-1">Country</th>
                <th class="border-r p-1">Judging</th>
                <th class="border-r p-1">Finals</th>
                <th class="border-r p-1">Total</th>
                <th class="border-r p-1">Place</th>
                <th class="border-r p-1">Category</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(competitor, index) in currentGroup.competitors" :key="index" class="border">
                <td class="p-1 border-r">
                  <div class="w-40 truncate overflow-hidden" :title="competitor.competitors_name">{{ competitor.competitors_name }}</div>
                </td>
                <td class="p-1 border-r">
                  <div class="w-20 truncate overflow-hidden" :title="competitor.country">{{ competitor.country }}</div>
                </td>
                <td class="border-r p-1">
                  <UInput v-model="competitor.judging" class="text-xs" />
                </td>
                <td class="border-r p-1">
                  <UInput v-model="competitor.finals" class="text-xs" />
                </td>
                <td class="border-r p-1">
                  <UInput v-model="competitor.total" class="text-xs" />
                </td>
                <td class="border-r p-1">
                  <UInput v-model="competitor.place" class="text-xs" />
                </td>
                <td class="border-r p-1">
                  <div class="w-20 truncate overflow-hidden" :title="competitor.competition_type">{{ competitor.competition_type }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="fileError" class="mt-4 text-center">
      <p class="text-red-500">{{ fileError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Papa from 'papaparse';

// Reactive references to hold CSV data and grouped data
const csvData = ref([]);
const groupedData = ref([]);
const fileError = ref('');

// Reactive reference for current index
const currentIndex = ref(0);

// Computed property to get the current group based on currentIndex
const currentGroup = computed(() => {
  return groupedData.value[currentIndex.value] || {};
});

// Computed property to extract competition-level details from the first competitor
const competitionDetails = computed(() => {
  if (currentGroup.value.competitors && currentGroup.value.competitors.length > 0) {
    const { competition, location, date, url } = currentGroup.value.competitors[0];
    return { competition, location, date, url };
  }
  return {};
});

// Function to handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  fileError.value = ''; // Reset any previous errors
  csvData.value = []; // Reset previous data
  groupedData.value = [];
  currentIndex.value = 0;

  if (!file) {
    fileError.value = 'No file selected.';
    return;
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    fileError.value = 'Please upload a valid CSV file.';
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const csvContent = e.target.result;

    Papa.parse(csvContent, {
      header: true, // Treat the first row as headers
      skipEmptyLines: true, // Skip empty lines
      complete: (results) => {
        if (results.errors.length) {
          fileError.value = 'Error parsing CSV file.';
          console.error('PapaParse Errors:', results.errors);
        } else {
          csvData.value = results.data;
          // Check if 'img_url' exists
          if (!results.meta.fields.includes('img_url')) {
            fileError.value = 'CSV must contain "img_url" field.';
            csvData.value = [];
            return;
          }
          groupDataByImage();
        }
      },
      error: (error) => {
        fileError.value = 'Failed to parse CSV file.';
        console.error('PapaParse Error:', error);
      },
    });
  };

  reader.onerror = () => {
    fileError.value = 'Failed to read file.';
  };

  reader.readAsText(file);
}

// Function to group CSV data by img_url
function groupDataByImage() {
  const groups = {};

  csvData.value.forEach((row) => {
    const imgUrl = row.img_url;
    if (!groups[imgUrl]) {
      groups[imgUrl] = {
        img_url: imgUrl,
        competitors: [],
      };
    }
    groups[imgUrl].competitors.push(row);
  });

  // Convert the groups object into an array
  groupedData.value = Object.values(groups);
}

// Navigation functions
function goNext() {
  if (currentIndex.value < groupedData.value.length - 1) {
    currentIndex.value += 1;
  }
}

function goBack() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

// Utility function to format headers (e.g., replace underscores with spaces and capitalize)
function formatHeader(header) {
  const headersToDisplay = {
    competition: 'Competition',
    location: 'Location',
    date: 'Date',
    url: 'URL',
  };

  return headersToDisplay[header] || header
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Function to export CSV
function exportCSV() {
  // Use Papa.unparse to convert JSON to CSV
  const csv = Papa.unparse(csvData.value);

  // Create a Blob from the CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create a link to download the Blob
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const currentDate = new Date();
  const timestamp = currentDate.toISOString().split('T')[0];
  link.setAttribute('download', `exported_data_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

</script>


