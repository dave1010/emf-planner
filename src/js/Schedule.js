import Venue from './Venue.js';
import Event from './Event.js';

/**
 * Represents a list of events
 */
class Schedule {
    constructor() {
        this.venues = {}; // grouped by venue
        this.events = [];
    }

    getStartDate() {
        const allEvents = Object.values(this.venues).flatMap(venue => venue.events);
        const startTime = new Date(Math.min(...allEvents.map(event => event.start_date.getTime())));

        // Round down to the nearest day
        startTime.setHours(0, 0, 0, 0);
        return startTime;
    }

    getEndDate() {
        const allEvents = Object.values(this.venues).flatMap(venue => venue.events);
        const endTime = new Date(Math.max(...allEvents.map(event => event.end_date.getTime())));
        // Round up to the nearest day
        endTime.setHours(23, 59, 59, 999);
        return endTime;
    }

    getTimeRange() {
        return this.getEndDate() - this.getStartDate();
    }

    addEvent(event) {
        this.events.push(event);

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

    setFavourites(listOfIds) {
        this.events.forEach(event => {
            event.isFavourite = listOfIds.includes(event.id);
        });
    }

    static createFromJson(events) {
        const schedule = new Schedule();

        events.forEach(event => {
            schedule.addEvent(Event.createFromJson(event));
        });

        return schedule;
    }
}

export default Schedule;
