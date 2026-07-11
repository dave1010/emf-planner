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


const COMPASS_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 15000,
  timeout: 10000,
};

const toRadians = (degrees) => degrees * Math.PI / 180;
const toDegrees = (radians) => radians * 180 / Math.PI;

const isValidLatlon = (latlon) => Array.isArray(latlon)
  && latlon.length >= 2
  && latlon.every(coordinate => Number.isFinite(coordinate));

const calculateDistanceMeters = ([fromLatitude, fromLongitude], [toLatitude, toLongitude]) => {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);

  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const calculateCompassDirection = ([fromLatitude, fromLongitude], [toLatitude, toLongitude]) => {
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const y = Math.sin(longitudeDelta) * Math.cos(toLatitudeRadians);
  const x = Math.cos(fromLatitudeRadians) * Math.sin(toLatitudeRadians)
    - Math.sin(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.cos(longitudeDelta);
  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;

  return COMPASS_DIRECTIONS[Math.round(bearing / 45) % COMPASS_DIRECTIONS.length];
};

const formatVenueDistance = (userLatlon, venueLatlon) => {
  if (!isValidLatlon(userLatlon) || !isValidLatlon(venueLatlon)) {
    return '';
  }

  const distance = Math.round(calculateDistanceMeters(userLatlon, venueLatlon));
  const direction = calculateCompassDirection(userLatlon, venueLatlon);
  const walkingMinutes = Math.max(1, Math.ceil(distance / 84));
  return `${distance}m ${direction} 🚶${walkingMinutes}min`;
};

const createLocationTracker = () => {
  const listeners = new Set();
  let position = null;
  let error = null;
  let watchId = null;

  const notify = () => listeners.forEach(listener => listener({ position, error, isWatching: watchId !== null }));

  const start = () => {
    if (!('geolocation' in navigator)) {
      error = 'Device location is not supported by this browser.';
      notify();
      return;
    }

    if (watchId !== null) {
      notify();
      return;
    }

    error = null;
    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        position = [coords.latitude, coords.longitude];
        error = null;
        notify();
      },
      (geolocationError) => {
        error = geolocationError.message || 'Unable to get device location.';
        notify();
      },
      GEOLOCATION_OPTIONS,
    );
    notify();
  };

  return {
    start,
    subscribe(listener) {
      listeners.add(listener);
      listener({ position, error, isWatching: watchId !== null });
      return () => listeners.delete(listener);
    },
  };
};

const formatEventDayTime = (date) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
}).format(date);

const formatCountdownDuration = (milliseconds) => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / (60 * 1000)));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }

  if (hours || days) {
    parts.push(`${hours}h`);
  }

  parts.push(`${minutes}m`);
  return parts.join(' ');
};

const formatEventCountdown = (event, now = new Date()) => {
  if (now < event.start_date) {
    return `Starts in ${formatCountdownDuration(event.start_date - now)}`;
  }

  if (now < event.end_date) {
    return `Ends in ${formatCountdownDuration(event.end_date - now)}`;
  }

  return '';
};

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

const getVenueDetail = (event, locationTracker) => {
  const container = document.createElement('span');
  const venueName = event.mapLink ? document.createElement('a') : document.createElement('span');

  if (event.mapLink) {
    venueName.href = event.mapLink;
    venueName.target = '_blank';
    venueName.rel = 'noopener noreferrer';
  }

  venueName.innerText = event.venue;
  container.appendChild(venueName);

  if (!isValidLatlon(event.latlon)) {
    return container;
  }

  const distance = document.createElement('span');
  distance.className = 'venue-distance';
  container.appendChild(distance);

  const unsubscribe = locationTracker.subscribe(({ position, error, isWatching }) => {
    const formattedDistance = formatVenueDistance(position, event.latlon);

    if (formattedDistance) {
      distance.innerText = formattedDistance;
      distance.title = 'Distance and compass direction from your device to the venue';
    } else if (isWatching && !error) {
      distance.innerText = 'locating…';
      distance.title = 'Waiting for your device location';
    } else {
      distance.innerHTML = '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'venue-distance-button';
      button.innerText = error ? 'Retry location' : 'Show distance';
      button.title = error || 'Use your device location to show distance and direction to this venue';
      button.addEventListener('click', locationTracker.start);
      distance.appendChild(button);
    }
  });

  container.unsubscribe = unsubscribe;
  return container;
};

const attachEventDetailsPanel = (locationTracker) => {
  const splitPanel = document.getElementById('eventSplitPanel');
  const closeButton = document.getElementById('eventDetailsClose');
  const panel = document.getElementById('eventDetailsPanel');
  const title = document.getElementById('eventDetailsTitle');
  const detailsList = document.getElementById('eventDetailsList');
  const time = document.getElementById('eventDetailsTime');
  const text = document.getElementById('eventDetailsText');

  let unsubscribeVenueDetail = null;

  closeButton.addEventListener('click', () => {
    if (unsubscribeVenueDetail) {
      unsubscribeVenueDetail();
      unsubscribeVenueDetail = null;
    }
    panel.hidden = true;
    splitPanel.classList.add('no-event-selected');
    splitPanel.position = 100;
  });

  return (event) => {
    if (unsubscribeVenueDetail) {
      unsubscribeVenueDetail();
      unsubscribeVenueDetail = null;
    }
    title.innerHTML = '';
    const titleIcon = document.createElement('wa-icon');
    titleIcon.setAttribute('name', 'arrow-up-right-from-square');
    titleIcon.setAttribute('variant', 'solid');
    title.append(document.createTextNode(`${event.title} `), titleIcon);
    title.href = event.link;
    const countdown = formatEventCountdown(event);
    time.innerText = [
      `${formatEventDayTime(event.start_date)}–${formatEventDayTime(event.end_date)}`,
      countdown,
    ].filter(Boolean).join(' · ');
    detailsList.innerHTML = '';
    text.innerHTML = '';
    const venueDetail = getVenueDetail(event, locationTracker);
    unsubscribeVenueDetail = venueDetail.unsubscribe || null;
    appendDetail(detailsList, 'Venue', venueDetail);
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


const attachMiddayJumpButtons = (timeline, schedule) => {
  const container = document.getElementById('middayJumpButtons');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const startTime = schedule.getStartDate();
  const endTime = schedule.getEndDate();
  const currentDate = new Date(startTime);
  currentDate.setHours(12, 0, 0, 0);

  if (currentDate < startTime) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  while (currentDate < endTime) {
    const buttonDate = new Date(currentDate);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'midday-jump-button';
    button.innerText = buttonDate.toLocaleDateString('en-GB', { weekday: 'narrow' });
    button.title = `Skip to midday on ${buttonDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    button.addEventListener('click', () => timeline.goToTime(buttonDate));
    container.appendChild(button);
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

const attachEventFilters = (timeline, schedule, locationTracker) => {
  const favouritesOnlyInput = document.getElementById('filterFavouritesOnly');
  const typeInput = document.getElementById('filterType');
  const officialInput = document.getElementById('filterOfficial');
  const venueInput = document.getElementById('filterVenue');
  const venueSortInput = document.getElementById('venueSort');
  const resetButton = document.getElementById('resetFilters');

  addOptions(typeInput, schedule.getEventTypes());
  addOptions(venueInput, schedule.getVenueNames());

  const applyFilters = () => {
    timeline.setFilters({
      favouritesOnly: favouritesOnlyInput.checked,
      type: typeInput.value,
      official: officialInput.value,
      venue: venueInput.value,
      venueSort: venueSortInput.value,
    });

    if (venueSortInput.value === 'distance') {
      locationTracker.start();
    }
  };

  [favouritesOnlyInput, typeInput, officialInput, venueInput, venueSortInput].forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  resetButton.addEventListener('click', () => {
    favouritesOnlyInput.checked = false;
    typeInput.value = '';
    officialInput.value = '';
    venueInput.value = '';
    venueSortInput.value = 'official';
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

  const locationTracker = createLocationTracker();
  const showEventDetails = attachEventDetailsPanel(locationTracker);
  const timelineElement = document.getElementById('timeline');
  const timeline = new Timeline(timelineElement, schedule, showEventDetails);
  attachMiddayJumpButtons(timeline, schedule);
  locationTracker.subscribe(({ position }) => timeline.setUserLatlon(position));
  attachEventFilters(timeline, schedule, locationTracker);

  // go to 1 hour ago
  timeline.goToTime(Date.now() - 60 * 60 * 1000);

  //favouritesDatabase.save([412]);
});
