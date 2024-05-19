import Venue from './Venue.js';
import Event from './Event.js';

/**
 * Represents a list of events grouped by venue
 */
class Schedule {
    constructor() {
      this.venues = {};
    }
  
    getStartDate() {
      const allEvents = Object.values(this.venues).flatMap(venue => venue.events);
      return new Date(Math.min(...allEvents.map(event => event.start_date.getTime())));
    }
  
    getEndDate() {
      const allEvents = Object.values(this.venues).flatMap(venue => venue.events);
      return new Date(Math.max(...allEvents.map(event => event.end_date.getTime())));
    }
  
    getTimeRange() {
      return this.getEndDate() - this.getStartDate();
    }
  
    addEvent(event) {
      // Group events by venue
      const venueName = event.venue;
      if (!this.venues[venueName]) {
        this.venues[venueName] = new Venue(venueName);
        this.venues[venueName].events = [];
      }
      this.venues[venueName].events.push(event);
    }
  
    getVenues() {
      return Object.values(this.venues);
    }

    static createFromJson(events) {
        const schedule = new Schedule();
    
        events.forEach(event => {
          const eventObj = new Event(event.title, event.start_date, event.end_date, event.venue);
          schedule.addEvent(eventObj);
        });
    
        return schedule;
    }
}

  
  export default Schedule;
