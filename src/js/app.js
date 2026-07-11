import Schedule from "./Schedule.js";
import Timeline from "./Timeline.js";
import FavouritesDatabase from "./FavouritesDatabase.js";

const SCHEDULE_URL = 'https://www.emfcamp.org/schedule/2026.json';
const SCHEDULE_STORAGE_KEY = 'emf-planner:schedule-data';
const SCHEDULE_METADATA_STORAGE_KEY = 'emf-planner:schedule-metadata';

const readJsonStorage = (key, fallback = null) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const fetchJson = async (url, { cache = 'default' } = {}) => {
  const response = await fetch(url, { cache });
  return response.ok ? response.json() : null;
};

const loadScheduleData = async ({ forceRefresh = false } = {}) => {
  try {
    const data = await fetchJson(SCHEDULE_URL, { cache: forceRefresh ? 'reload' : 'default' });

    if (data) {
      const metadata = {
        fetchedAt: new Date().toISOString(),
        source: 'network',
      };
      writeJsonStorage(SCHEDULE_STORAGE_KEY, data);
      writeJsonStorage(SCHEDULE_METADATA_STORAGE_KEY, metadata);
      return { data, metadata, fromCache: false };
    }
  } catch (error) {
    // Fall back to the locally stored copy below.
  }

  const data = readJsonStorage(SCHEDULE_STORAGE_KEY);
  const metadata = readJsonStorage(SCHEDULE_METADATA_STORAGE_KEY);
  return data ? { data, metadata: { ...metadata, source: 'local' }, fromCache: true } : null;
};

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('/service-worker.js').catch(() => {
    // Offline support is best-effort on unsupported or restricted browsers.
  });
};


const formatDateTime = (date) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(date);

const formatAge = (date, now = new Date()) => {
  const seconds = Math.max(0, Math.floor((now - date) / 1000));
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, unitSeconds] of units) {
    const value = Math.floor(seconds / unitSeconds);
    if (value >= 1) {
      return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
};

const describeTimestamp = (isoTimestamp, emptyText) => {
  if (!isoTimestamp) {
    return emptyText;
  }

  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return emptyText;
  }

  return `${formatDateTime(date)} (${formatAge(date)})`;
};

const updateScheduleRefreshStatus = (metadata, { fromCache = false, message = '' } = {}) => {
  const status = document.getElementById('scheduleRefreshStatus');
  if (!status) {
    return;
  }

  const timestamp = describeTimestamp(metadata?.fetchedAt, 'No schedule data has been cached on this device yet.');
  const source = fromCache || metadata?.source === 'local' ? 'Using cached schedule data.' : 'Schedule data is up to date.';
  status.innerText = message || `${source} Last refresh: ${timestamp}`;
};

const updateFavouritesSyncStatus = (favouritesDatabase) => {
  const status = document.getElementById('favouritesSyncStatus');
  if (!status) {
    return;
  }

  status.innerText = `Last favourites import: ${describeTimestamp(favouritesDatabase.getSyncedAt(), 'never on this device')}.`;
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
const FILTERS_STORAGE_KEY = 'emf-planner:event-filters';
const DEFAULT_FILTERS = {
  favouritesOnly: false,
  type: '',
  official: '',
  venue: '',
  venueSort: 'official',
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

  const buttonDates = [];

  while (currentDate < endTime) {
    buttonDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // The final schedule day only contains events spilling past midnight, so omit it from the jump picker.
  buttonDates.slice(0, -1).forEach(buttonDate => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'midday-jump-button';
    button.innerText = buttonDate.toLocaleDateString('en-GB', { weekday: 'narrow' });
    button.title = `Skip to midday on ${buttonDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    button.addEventListener('click', () => timeline.goToTime(buttonDate));
    container.appendChild(button);
  });
};

const loadStoredFilters = () => {
  try {
    return {
      ...DEFAULT_FILTERS,
      ...JSON.parse(window.localStorage.getItem(FILTERS_STORAGE_KEY) || '{}'),
    };
  } catch (error) {
    return { ...DEFAULT_FILTERS };
  }
};

const saveFilters = (filters) => {
  window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
};

const setVenueSortValue = (venueSortInput, value) => {
  const buttons = [...venueSortInput.querySelectorAll('.venue-sort-button')];
  const nextValue = buttons.some(button => button.dataset.value === value) ? value : DEFAULT_FILTERS.venueSort;
  venueSortInput.dataset.value = nextValue;
  buttons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.value === nextValue));
  });
};

const getVenueSortValue = (venueSortInput) => venueSortInput.dataset.value || DEFAULT_FILTERS.venueSort;

const attachEventFilters = (timeline, schedule, locationTracker) => {
  const favouritesOnlyInput = document.getElementById('filterFavouritesOnly');
  const typeInput = document.getElementById('filterType');
  const officialInput = document.getElementById('filterOfficial');
  const venueInput = document.getElementById('filterVenue');
  const venueSortInput = document.getElementById('venueSort');
  const filtersActiveIndicator = document.getElementById('filtersActiveIndicator');
  const resetButton = document.getElementById('resetFilters');

  addOptions(typeInput, schedule.getEventTypes());
  addOptions(venueInput, schedule.getVenueNames());

  const applyFilters = ({ persist = true } = {}) => {
    const filters = {
      favouritesOnly: favouritesOnlyInput.checked,
      type: typeInput.value,
      official: officialInput.value,
      venue: venueInput.value,
      venueSort: getVenueSortValue(venueSortInput),
    };

    timeline.setFilters(filters);

    const hasActiveFilters = filters.favouritesOnly || filters.type || filters.official || filters.venue;
    filtersActiveIndicator.hidden = !hasActiveFilters;
    filtersActiveIndicator.title = hasActiveFilters ? 'Events are currently filtered' : '';

    if (persist) {
      saveFilters(filters);
    }

    if (filters.venueSort === 'distance') {
      locationTracker.start();
    }
  };

  const storedFilters = loadStoredFilters();
  favouritesOnlyInput.checked = Boolean(storedFilters.favouritesOnly);
  typeInput.value = storedFilters.type;
  officialInput.value = storedFilters.official;
  venueInput.value = storedFilters.venue;
  setVenueSortValue(venueSortInput, storedFilters.venueSort || DEFAULT_FILTERS.venueSort);

  [favouritesOnlyInput, typeInput, officialInput, venueInput].forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  venueSortInput.querySelectorAll('.venue-sort-button').forEach(button => {
    button.addEventListener('click', () => {
      setVenueSortValue(venueSortInput, button.dataset.value);
      applyFilters();
    });
  });

  resetButton.addEventListener('click', () => {
    favouritesOnlyInput.checked = DEFAULT_FILTERS.favouritesOnly;
    typeInput.value = DEFAULT_FILTERS.type;
    officialInput.value = DEFAULT_FILTERS.official;
    venueInput.value = DEFAULT_FILTERS.venue;
    setVenueSortValue(venueSortInput, DEFAULT_FILTERS.venueSort);
    applyFilters();
  });

  applyFilters({ persist: false });
};

document.addEventListener('DOMContentLoaded', async () => {
  registerServiceWorker();
  attachSettingsToggle();

  const scheduleResult = await loadScheduleData();

  if (!scheduleResult) {
    updateScheduleRefreshStatus(null, { message: 'Schedule data could not be loaded. Connect to the internet and try Refresh schedule now.' });
    document.getElementById('timeline').innerText = 'Failed to load schedule data.';
    return;
  }

  updateScheduleRefreshStatus(scheduleResult.metadata, { fromCache: scheduleResult.fromCache });

  const schedule = Schedule.createFromJson(scheduleResult.data);

  const favouritesDatabase = new FavouritesDatabase(window.localStorage, 'favourites', schedule);
  updateFavouritesSyncStatus(favouritesDatabase);
  
  const favouritesFileInput = document.getElementById('favouritesJsonFileInput');
  favouritesDatabase.attachToFileInput(favouritesFileInput, () => {
    updateFavouritesSyncStatus(favouritesDatabase);
    timeline.render();
  });

  const locationTracker = createLocationTracker();
  const showEventDetails = attachEventDetailsPanel(locationTracker);
  const timelineElement = document.getElementById('timeline');
  const timeline = new Timeline(timelineElement, schedule, showEventDetails);
  attachMiddayJumpButtons(timeline, schedule);
  locationTracker.subscribe(({ position }) => timeline.setUserLatlon(position));
  attachEventFilters(timeline, schedule, locationTracker);

  const refreshScheduleButton = document.getElementById('refreshSchedule');
  refreshScheduleButton.addEventListener('click', async () => {
    refreshScheduleButton.disabled = true;
    updateScheduleRefreshStatus(scheduleResult.metadata, { message: 'Refreshing schedule data…' });
    const refreshed = await loadScheduleData({ forceRefresh: true });

    if (!refreshed || refreshed.fromCache) {
      refreshScheduleButton.disabled = false;
      updateScheduleRefreshStatus(scheduleResult.metadata, { fromCache: true, message: 'Could not refresh while offline. Keeping the cached schedule data.' });
      return;
    }

    window.location.reload();
  });

  // go to 1 hour ago
  timeline.goToTime(Date.now() - 60 * 60 * 1000);
});
