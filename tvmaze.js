'use strict';

const nullImg = 'https://tinyurl.com/tv-missing';

const $showsList = $('#showsList');
const $episodesArea = $('#episodesArea h3');
const $searchForm = $('#searchForm');

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term) {
  let response = await axios.get('https://api.tvmaze.com/search/shows', {
    params: {
      q: term,
    },
  });

  //Map response data to a return obj containing the show id, name, genres, summary, and image URL
  return response.data.map((result) => {
    const show = result.show;
    
    //Use medium sized image URL if found, else use the tinyurl nullImg
    const imageUrl = show.image ? show.image.medium : nullImg

    return {
      id: show.id,
      name: show.name,
      genres: show.genres,
      summary: show.summary,
      image: imageUrl,
    };
  });
}

/** Given list of shows, create markup for each and to DOM */
function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <p class="text-primary">${show.genres}</p>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `
    );

    $showsList.append($show);
  }
}

/*
  Handle search form submission: get shows from API and display.
  Hide episodes area (that only gets shown if they ask for episodes)
 */
async function searchForShowAndDisplay() {
  const term = $('#searchForm-term').val();
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on('submit', async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

/* 
Given a show ID, get from API and return (promise) array of episodes:
    { id, name, season, number }
*/
async function getEpisodesOfShow(id) {
  let response = await axios.get(`http://api.tvmaze.com/shows/${id}/episodes`);
  return response.data.map((episode) => {
    return {
      id: episode.id,
      name: episode.name,
      season: episode.season,
      number: episode.number,
    };
  });
}

//Takes in the episodes array and appends a list of episodes
function populateEpisodes(episodes) {
  //Reset episodes list to prepare for new episode data
  $('#episodesList').empty();
  $episodesArea.show();

  //For each episode, append li elements containing ep name, season, number 
  for (let ep of episodes) {
    $('#episodesList').append(
      $(`<li>${ep.name} (Season:${ep.season} Episode:${ep.number})</li>`)
    );
  }
}

//Handles click event on episodes button 
$showsList.on('click', '.Show-getEpisodes', async function (evt) {
  evt.preventDefault();

  //Finds the closest parent Show div containing the 'data-show-id' attribute and stores the id in showId
  //Context of 'this' is constrained to the .Show-getEpisodes button!
  let showId = $(this).closest('.Show').data('show-id');

  //Pass showId to getEpisodesOfShow() -> waits for response -> then passes episodes to populateEpisodes()
  const episodes = await getEpisodesOfShow(showId);
  populateEpisodes(episodes);
});
