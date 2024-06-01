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

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchData('https://www.emfcamp.org/schedule/2024.json');

  if (!data) {
    alert('Failed to load schedule data')
  }

  const schedule = Schedule.createFromJson(data);
  const timelineElement = document.getElementById('timeline');
  const timeline = new Timeline(timelineElement, schedule);

  const favouritesDatabase = new FavouritesDatabase(window.localStorage, 'favourites', schedule);
  
  const favouritesFileInput = document.getElementById('favouritesJsonFileInput');
  favouritesDatabase.attachToFileInput(favouritesFileInput);

  // go to 1 hour ago
  timeline.goToTime(Date.now() - 60 * 60 * 1000);

  //favouritesDatabase.save([412]);
});