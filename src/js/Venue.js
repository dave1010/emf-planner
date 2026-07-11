class Venue {
    constructor(name) {
      this.name = name;
      this.events = [];
    }

    addEvent(event) {
      this.events.push(event);
    }

    get isOfficial() {
      return this.events.some(event => event.isOfficial);
    }

    get latlon() {
      return this.events.find(event => event.latlon)?.latlon || null;
    }

    nextEventAfter(date, events = this.events) {
      const timestamp = date instanceof Date ? date.getTime() : Number(date);
      const futureEvents = events.filter(event => event.start_date.getTime() >= timestamp);

      if (futureEvents.length === 0) {
        return null;
      }

      return futureEvents.reduce((earliest, event) => (
        event.start_date < earliest.start_date ? event : earliest
      ));
    }
}

export default Venue;