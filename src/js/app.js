import Schedule from "./Schedule.js";
import Timeline from "./Timeline.js";
import FavouritesDatabase from "./FavouritesDatabase.js";

const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    return await response.ok ? response.json() : null;
  } catch (error) {
    return null;
  }
};

const addOptions = (selectElement, values) => {
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.innerText = value;
    selectElement.appendChild(option);
  });
};

const attachEventFilters = (timeline, schedule) => {
  const favouritesOnlyInput = document.getElementById('filterFavouritesOnly');
  const typeInput = document.getElementById('filterType');
  const officialInput = document.getElementById('filterOfficial');
  const venueInput = document.getElementById('filterVenue');
  const resetButton = document.getElementById('resetFilters');

  addOptions(typeInput, schedule.getEventTypes());
  addOptions(venueInput, schedule.getVenueNames());

  const applyFilters = () => {
    timeline.setFilters({
      favouritesOnly: favouritesOnlyInput.checked,
      type: typeInput.value,
      official: officialInput.value,
      venue: venueInput.value,
    });
  };

  [favouritesOnlyInput, typeInput, officialInput, venueInput].forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  resetButton.addEventListener('click', () => {
    favouritesOnlyInput.checked = false;
    typeInput.value = '';
    officialInput.value = '';
    venueInput.value = '';
    applyFilters();
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchData('https://www.emfcamp.org/schedule/2026.json');

  if (!data) {
    alert('Failed to load schedule data')
  }

  const schedule = Schedule.createFromJson(data);

  const favouritesDatabase = new FavouritesDatabase(window.localStorage, 'favourites', schedule);
  
  const favouritesFileInput = document.getElementById('favouritesJsonFileInput');
  favouritesDatabase.attachToFileInput(favouritesFileInput, () => timeline.render());

  const timelineElement = document.getElementById('timeline');
  const timeline = new Timeline(timelineElement, schedule);
  attachEventFilters(timeline, schedule);

  // go to 1 hour ago
  timeline.goToTime(Date.now() - 60 * 60 * 1000);

  //favouritesDatabase.save([412]);
});
