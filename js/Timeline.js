import EventBlock from './EventBlock.js';
import DaysRow from './DaysRow.js';
import HoursRow from './HoursRow.js';
import HoursTicksRow from './HoursTicksRow.js';


class Timeline {
  constructor(domElement, schedule) {
    this.domElement = domElement;
    this.schedule = schedule;
    this.render();
  }

  dateToOffset = (date) => {
    const startTime = this.schedule.getStartDate();
    const endTime = this.schedule.getEndDate();
    const timeRange = endTime - startTime;
    return ((date - startTime) / timeRange) * 100;
  }

  render() {
    const startTime = this.schedule.getStartDate();
    const endTime = this.schedule.getEndDate();

    this.domElement.style.width = '16000px';

    const daysRow = new DaysRow(startTime, endTime);
    this.domElement.appendChild(daysRow.domElement);
    
    const hoursRow = new HoursRow(startTime, endTime);
    this.domElement.appendChild(hoursRow.domElement);

    const hoursTicksRow = new HoursTicksRow(startTime, endTime);
    this.domElement.appendChild(hoursTicksRow.domElement);

    // Create timeline rows for each venue
    for (const venue of this.schedule.getVenues()) {

      // <div class="timeline-row"><div class="venue-details"></div><div class="events"></div></div>

      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `<div class="timeline-fixed venue font-semibold mb-2"><h2>${venue.name}</h2></div>`;

      const container = document.createElement('div');
      container.className = 'timeline-events-wrapper';
      row.appendChild(container);

      // Place events on the timeline
      venue.events.forEach(event => {
        const eventBlock = new EventBlock(event);

        eventBlock.positionBetween(startTime, endTime);

        container.appendChild(eventBlock.domElement);
      });

      this.domElement.appendChild(row);
    }
  }
}

export default Timeline;
