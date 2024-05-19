import EventBlock from './EventBlock.js';
import DaysRow from './DaysRow.js';


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
    


    // Create timeline rows for each venue
    for (const venue of this.schedule.getVenues()) {

      // <div class="timeline-row"><div class="venue-details"></div><div class="events"></div></div>

      const row = document.createElement('div');
      row.className = 'timeline-row';
      row.innerHTML = `<h2 class="venue font-semibold mb-2">${venue.name}</h2>`;

      // Place events on the timeline
      venue.events.forEach(event => {
        const eventBlock = new EventBlock(event);

        eventBlock.positionBetween(startTime, endTime);

        row.appendChild(eventBlock.domElement);
      });

      this.domElement.appendChild(row);
    }
  }
}

export default Timeline;
