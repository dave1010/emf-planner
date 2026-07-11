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
    settingsPanel.open = !settingsPanel.open;
    settingsToggle.setAttribute('aria-expanded', String(settingsPanel.open));
  });

  settingsPanel.addEventListener('wa-after-hide', () => {
    settingsToggle.setAttribute('aria-expanded', 'false');
  });
};

const formatEventDayTime = (date) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
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

  if (value instanceof Node) {
    description.appendChild(value);
  } else {
    description.innerText = value;
  }

  detailsList.append(term, description);
};

const appendTextSection = (container, className, value) => {
  if (!value) {
    return;
  }

  const section = document.createElement('p');
  section.className = className;
  section.innerText = value;
  container.appendChild(section);
};

const getVenueDetail = (event) => {
  if (!event.mapLink) {
    return event.venue;
  }

  const link = document.createElement('a');
  link.href = event.mapLink;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.innerText = event.venue;
  return link;
};

const attachEventDetailsPanel = () => {
  const splitPanel = document.getElementById('eventSplitPanel');
  const closeButton = document.getElementById('eventDetailsClose');
  const panel = document.getElementById('eventDetailsPanel');
  const title = document.getElementById('eventDetailsTitle');
  const detailsList = document.getElementById('eventDetailsList');
  const time = document.getElementById('eventDetailsTime');
  const text = document.getElementById('eventDetailsText');

  closeButton.addEventListener('click', () => {
    panel.hidden = true;
    splitPanel.classList.add('no-event-selected');
    splitPanel.position = 100;
  });

  return (event) => {
    title.innerHTML = '';
    const titleIcon = document.createElement('wa-icon');
    titleIcon.setAttribute('name', 'arrow-up-right-from-square');
    titleIcon.setAttribute('variant', 'solid');
    title.append(document.createTextNode(`${event.title} `), titleIcon);
    title.href = event.link;
    time.innerText = `${formatEventDayTime(event.start_date)}–${formatEventDayTime(event.end_date)}`;
    detailsList.innerHTML = '';
    text.innerHTML = '';
    appendDetail(detailsList, 'Venue', getVenueDetail(event));
    appendDetail(detailsList, 'Running', event.names);
    appendDetail(detailsList, 'Type', event.type);
    appendDetail(detailsList, 'Official', event.isOfficial ? 'Yes' : 'No');
    appendTextSection(text, 'event-details-short-description', event.shortDescription);
    appendTextSection(text, 'event-details-description', event.description);
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
