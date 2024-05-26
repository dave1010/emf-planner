
/*
List of favourite events.
Note that although favourites.json includes the whole event obejct, this is just uses the event IDs 
*/
class FavouritesDatabase {
  constructor(storage, key, schedule) {
    this.storage = storage; // window.localStorage
    this.key = key;
    this.favourites = []; // list of IDs
    this.schedule = schedule;

    this.load();
  }

  load() {
    const json = this.storage.getItem(this.key);
    this.favourites = json ? JSON.parse(json) : [];
    this.schedule.setFavourites(this.favourites);
  }

  save(listOfIds) {
    const json = JSON.stringify(listOfIds);
    this.favourites = listOfIds;
    this.storage.setItem(this.key, json);
    this.schedule.setFavourites(this.favourites);
  }

  attachToFileInput(fileInput) {
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      const text = await file.text();
      const json = JSON.parse(text);
      const ids = json.map((event) => event.id);
      alert(`Imported ${ids.length} favourites!`);
      this.save(ids);
    });
  }
}

export default FavouritesDatabase;
