class Event {
  constructor(id, title, start_date, end_date, venue, link) {
    this.id = id;
    this.title = title;
    this.start_date = new Date(start_date);
    this.end_date = new Date(end_date);
    this.venue = venue;
    this.link = link;
    this._isFavourite = false;
    this.onFavouriteChange = null; // Callback for changes
  }

  get isFavourite() {
    return this._isFavourite;
  }

  set isFavourite(value) {
    // handle noop
    if (this._isFavourite === value) {
      return;
    }

    this._isFavourite = value;
    if (this.onFavouriteChange) {
      this.onFavouriteChange(value);
    }
  }

  static createFromJson(json) {
    return new Event(
      json.id,
      json.title,
      json.start_date,
      json.end_date,
      json.venue,
      json.link
    );
  }
}

export default Event;