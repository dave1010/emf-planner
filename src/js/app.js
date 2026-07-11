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

const attachSettingsToggle = () => {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');

  settingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.hidden;
    settingsPanel.hidden = !isHidden;
    settingsToggle.setAttribute('aria-expanded', String(isHidden));
  });
};


const formatEventDate = (date) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
}).format(date);

const appendDetail = (detailsList, label, value) => {
  if (!value) {
    return;
  }

  const term = document.createElement('dt');
  term.innerText = label;
  const description = document.createElement('dd');
  description.innerText = value;
  detailsList.append(term, description);
};

const attachEventDetailsPanel = () => {
  const splitPanel = document.getElementById('eventSplitPanel');
  const closeButton = document.getElementById('eventDetailsClose');
  const panel = document.getElementById('eventDetailsPanel');
  const title = document.getElementById('eventDetailsTitle');
  const detailsList = document.getElementById('eventDetailsList');
  const link = document.getElementById('eventDetailsLink');

  closeButton.addEventListener('click', () => {
    panel.hidden = true;
    splitPanel.classList.add('no-event-selected');
    splitPanel.position = 100;
  });

  return (event) => {
    title.innerText = event.title;
    detailsList.innerHTML = '';
    appendDetail(detailsList, 'Starts', formatEventDate(event.start_date));
    appendDetail(detailsList, 'Ends', formatEventDate(event.end_date));
    appendDetail(detailsList, 'Venue', event.venue);
    appendDetail(detailsList, 'Type', event.type);
    appendDetail(detailsList, 'Official', event.isOfficial ? 'Yes' : 'No');
    link.href = event.link;
    panel.hidden = false;
    splitPanel.classList.remove('no-event-selected');
    splitPanel.position = 60;
  };
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
  attachSettingsToggle();

  const data = await fetchData('https://www.emfcamp.org/schedule/2026.json');

  if (!data) {
    alert('Failed to load schedule data')
  }

  const schedule = Schedule.createFromJson(data);

  const favouritesDatabase = new FavouritesDatabase(window.localStorage, 'favourites', schedule);
  
  const favouritesFileInput = document.getElementById('favouritesJsonFileInput');
  favouritesDatabase.attachToFileInput(favouritesFileInput, () => timeline.render());

  const showEventDetails = attachEventDetailsPanel();
  const timelineElement = document.getElementById('timeline');
  const timeline = new Timeline(timelineElement, schedule, showEventDetails);
  attachEventFilters(timeline, schedule);

  // go to 1 hour ago
  timeline.goToTime(Date.now() - 60 * 60 * 1000);

  //favouritesDatabase.save([412]);
});
