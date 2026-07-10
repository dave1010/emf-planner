import EventBlock from './EventBlock.js';
import DaysRow from './DaysRow.js';
import HoursRow from './HoursRow.js';
import HoursTicksRow from './HoursTicksRow.js';


class Timeline {
  constructor(domElement, schedule) {
    this.domElement = domElement;
    this.schedule = schedule;
    this.filters = {
      favouritesOnly: false,
      type: '',
      official: '',
      venue: '',
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

    // Create timeline rows for each venue
    for (const venue of this.schedule.getVenues()) {
      const filteredEvents = venue.events.filter(event => this.eventMatchesFilters(event));

      if (filteredEvents.length === 0) {
        continue;
      }

      // <div class="timeline-row"><div class="venue-details"></div><div class="events"></div></div>

      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `<div class="timeline-fixed venue font-semibold mb-2"><h2>${venue.name}</h2></div>`;

      const container = document.createElement('div');
      container.className = 'timeline-events-wrapper';
      row.appendChild(container);

      // Place events on the timeline
      filteredEvents.forEach(event => {
        const eventBlock = new EventBlock(event);

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
