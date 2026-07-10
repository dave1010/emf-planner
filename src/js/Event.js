class Event {
  constructor(id, title, start_date, end_date, venue, link, occurrence = null, type = null, isOfficial = false) {
    this.id = id;
    this.title = title;
    this.start_date = new Date(start_date);
    this.end_date = new Date(end_date);
    this.venue = venue;
    this.link = link;
    this.occurrence = occurrence;
    this.type = type;
    this.isOfficial = isOfficial;
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
    const occurrence = json.occurrence || json;

    return new Event(
      json.id,
      json.title,
      occurrence.start_date,
      occurrence.end_date,
      occurrence.venue,
      json.link,
      json.occurrence || null,
      json.type || null,
      Boolean(json.is_official)
    );
  }
}

export default Event;
