import EventBlock from './EventBlock.js';
import DaysRow from './DaysRow.js';
import HoursRow from './HoursRow.js';
import HoursTicksRow from './HoursTicksRow.js';


class Timeline {
  constructor(domElement, schedule, onEventSelect = null) {
    this.domElement = domElement;
    this.schedule = schedule;
    this.onEventSelect = onEventSelect;
    this.userLatlon = null;
    this.filters = {
      favouritesOnly: false,
      type: '',
      official: '',
      venue: '',
      venueSort: 'official',
    };
    this.render();
  }

  dateToOffset = (date) => {
    const startTime = this.schedule.getStartDate();
    const endTime = this.schedule.getEndDate();
    const timeRange = endTime - startTime;
    return ((date - startTime) / timeRange) * 100;
  }

  setFilters(filters) {
    this.filters = {
      ...this.filters,
      ...filters,
    };
    this.render();
  }

  setUserLatlon(userLatlon) {
    this.userLatlon = userLatlon;

    if (this.filters.venueSort === 'distance') {
      this.render();
    }
  }

  getVenueDistance(venue) {
    if (!this.userLatlon || !venue.latlon) {
      return Number.POSITIVE_INFINITY;
    }

    const [fromLatitude, fromLongitude] = this.userLatlon;
    const [toLatitude, toLongitude] = venue.latlon;
    const latitudeDelta = toLatitude - fromLatitude;
    const longitudeDelta = toLongitude - fromLongitude;

    return (latitudeDelta ** 2) + (longitudeDelta ** 2);
  }

  sortVenues(venuesWithEvents) {
    const sortByName = (a, b) => a.venue.name.localeCompare(b.venue.name);

    return [...venuesWithEvents].sort((a, b) => {
      if (this.filters.venueSort === 'az') {
        return sortByName(a, b);
      }

      if (this.filters.venueSort === 'distance') {
        return this.getVenueDistance(a.venue) - this.getVenueDistance(b.venue) || sortByName(a, b);
      }

      if (this.filters.venueSort === 'next-event') {
        const now = Date.now();
        const aNext = a.venue.nextEventAfter(now, a.events);
        const bNext = b.venue.nextEventAfter(now, b.events);
        const aTime = aNext ? aNext.start_date.getTime() : Number.POSITIVE_INFINITY;
        const bTime = bNext ? bNext.start_date.getTime() : Number.POSITIVE_INFINITY;

        return aTime - bTime || sortByName(a, b);
      }

      if (a.venue.isOfficial !== b.venue.isOfficial) {
        return a.venue.isOfficial ? -1 : 1;
      }

      return sortByName(a, b);
    });
  }

  eventMatchesFilters(event) {
    if (this.filters.favouritesOnly && !event.isFavourite) {
      return false;
    }

    if (this.filters.type && event.type !== this.filters.type) {
      return false;
    }

    if (this.filters.official !== '' && String(event.isOfficial) !== this.filters.official) {
      return false;
    }

    if (this.filters.venue && event.venue !== this.filters.venue) {
      return false;
    }

    return true;
  }

  render() {
    const startTime = this.schedule.getStartDate();
    const endTime = this.schedule.getEndDate();

    this.domElement.innerHTML = ''; // remove loading message

    this.domElement.style.width = '16000px';

    const daysRow = new DaysRow(startTime, endTime);
    this.domElement.appendChild(daysRow.domElement);
    
    const hoursRow = new HoursRow(startTime, endTime);
    this.domElement.appendChild(hoursRow.domElement);

    const hoursTicksRow = new HoursTicksRow(startTime, endTime);
    this.domElement.appendChild(hoursTicksRow.domElement);

    const venuesWithEvents = this.schedule.getVenues()
      .map(venue => ({
        venue,
        events: venue.events.filter(event => this.eventMatchesFilters(event)),
      }))
      .filter(({ events }) => events.length > 0);

    // Create timeline rows for each venue
    for (const { venue, events: filteredEvents } of this.sortVenues(venuesWithEvents)) {

      // <div class="timeline-row"><div class="venue-details"></div><div class="events"></div></div>

      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `<div class="timeline-fixed venue font-semibold mb-2"><h2>${venue.name}</h2></div>`;

      const container = document.createElement('div');
      container.className = 'timeline-events-wrapper';
      row.appendChild(container);

      // Place events on the timeline
      filteredEvents.forEach(event => {
        const eventBlock = new EventBlock(event, this.onEventSelect);

        eventBlock.positionBetween(startTime, endTime);

        container.appendChild(eventBlock.domElement);
      });

      this.domElement.appendChild(row);
    }
  }

  goToTime(date) {
    console.log('goToTime', date);
    const offset = this.dateToOffset(date);
    console.log('offset', offset);
    this.domElement.parentElement.scrollLeft = (offset * this.domElement.scrollWidth) / 100;
  }
}

export default Timeline;
