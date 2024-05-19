class Event {
    constructor(title, start_date, end_date, venue) {
      this.title = title;
      this.start_date = new Date(start_date);
      this.end_date = new Date(end_date);
      this.venue = venue;
    }
  }

export default Event;