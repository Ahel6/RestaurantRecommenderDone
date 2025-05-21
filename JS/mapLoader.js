window.addEventListener("load", function () {
  (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
    key: "Deleted for security",
    v: "weekly"

  });

  let map;
  let markersArray = [];
  const center = { lat: 50.82926, lng: -0.1356 };

  //AutoComplete
  const input = document.getElementById("pac-input");
  const card = document.getElementById("pac-card");

  //User Menu
  const LoginMenuButton = document.getElementById("LoginMenuButton");
  const CreateAccButton = document.getElementById("CreateAccButton");
  const logoutButton = this.document.getElementById("logoutButton");

  //side Menu
  const closeSideMenuButton = document.getElementById("closeSideMenu");
  const reviewNumber = this.document.getElementById("reviewNumber");
  const sideMenuContent = this.document.getElementById("sideMenuContent");

  //Get feedback buttons
  const feedbackButtons = document.getElementsByClassName("FeedbackButton");


  //autocomplete details
  const defaultBounds = { //default bounds for search
    north: center.lat + 0.1,
    south: center.lat - 0.1,
    east: center.lng + 0.1,
    west: center.lng - 0.1,
  };

  const options = {//options for autocomplete box
    bounds: defaultBounds,
    fields: ["formatted_address", "geometry", "icon", "name"],
    strictBounds: false,
  };




  /**  Adapted from https://developers.google.com/maps/documentation/javascript/examples/place-details
    * @license
    * Copyright 2019 Google LLC. All Rights Reserved.
    * SPDX-License-Identifier: Apache-2.0
    */

  async function initMap() {
    const cookieManager = await import("./cookieManager.js");
    const formManipulation = await import("./formManipulation.js");

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { Place } = await google.maps.importLibrary("places");

    map = new Map(document.getElementById("map"), {
      center: center,
      zoom: 11,
      mapId: "9cec1fe10e3c410d",
      disableDefaultUI: true,
      gestureHandling: "greedy",
    });

    //Controls and Side Menu
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(card);
    const autocomplete = new google.maps.places.Autocomplete(input, options);

    const sideMenu = document.getElementById("RestaurantAside");
    sideMenu.style.backgroundColor = "white";
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(sideMenu);

    const UserMenu = document.getElementById("UserMenu");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(UserMenu);


    closeSideMenuButton.addEventListener('click', () => {
      sideMenu.style.display = "none";
    });


    //userMenuContent - the root node for all forms and userProfile
    //Login Menu Button - acts as the button to show and hide the user menu; the only button shown initially
    //userProfile - displays the users username, aspects and reviews given
    //loginForm - the form used to login to an existing account
    //createAccForm - the form used to create a new account

    if (cookieManager.isLoggedIn()) {
      LoginMenuButton.textContent = "Profile"
    }
    LoginMenuButton.addEventListener('click', () => {
      UserMenuContent = document.getElementById("UserMenuContent");
      loginForm = document.getElementById("loginForm");
      userProfile = document.getElementById("userProfile");
      LoginMenuButton.textContent = "Close"

      if (UserMenuContent.style.display === "block") {
        formManipulation.hideAll();
        CreateAccButton.style.display = "none";

      } else {
        UserMenu.classList.add("background");
        UserMenuContent.style.display = "block";
        if (cookieManager.isLoggedIn()) {
          formManipulation.cookiePopulate();
        } else {
          loginForm.style.display = "block";
          CreateAccButton.style.display = "block"
        }

      };
    });

    //show the createAccount form
    CreateAccButton.addEventListener('click', () => {
      loginForm = document.getElementById("loginForm");
      CreateAccForm = document.getElementById("CreateAccForm");
      loginForm.style.display = "none";
      CreateAccForm.style.display = "block"

    });

    logoutButton.addEventListener('click', () => {
      cookieManager.deleteCookies();
      loginForm = document.getElementById("loginForm");
      userProfile.style.display = "none"
      loginForm.style.display = "block";
      CreateAccButton.style.display = "block";
      LoginMenuButton.textContent = "Login"
    });




    //Perform SearcH
    autocomplete.addListener("place_changed", () => {
      var searchQuery = autocomplete.getPlace();

      if (!searchQuery.geometry || !searchQuery.geometry.location) {
        window.alert("No details available for: '" + searchQuery.name + "'");
        return;
      }
      if (searchQuery.geometry) {
        removeMarkers();
        searchNearby(searchQuery);
        map.fitBounds(searchQuery.geometry.viewport);
      } else {
        map.setCenter(searchQuery.geometry.location);
        map.setZoom(12);
      }
    });



    /**  Adapted from https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
    * @license
    * Copyright 2019 Google LLC. All Rights Reserved.
    * SPDX-License-Identifier: Apache-2.0
    */

    async function searchNearby(searchQuery) {

      var locationPoint = searchQuery.geometry.location;
      const { LatLngBounds } = await google.maps.importLibrary("core");

      const request = {
        fields: ["displayName", "location", "businessStatus", 'reviews'],
        locationRestriction: { //only search for markers in the location, within 100km
          center: locationPoint,
          radius: 1000,
        },

        // optional parameters
        includedPrimaryTypes: ["restaurant"],
        language: "en-US",
      };

      const { places } = await Place.searchNearby(request);

      if (places.length) {
        const bounds = new LatLngBounds();
        places.forEach((place) => {
          if (cookieManager.isLoggedIn()) {
            getAffinity(place);
          } else {
            placePin(place);
          }
          bounds.extend(place.location);//adjust the bounds to accommodate for the location
        });
        map.fitBounds(bounds);//then change the map to match the adjusted bounds 
      } else {
        console.log("No results");
      }
    }

    /**@function getAffinity
     * @name getAffinity used to calculate the affinities ie "how well a restaurants aspects matches a users preferences"
     */
    async function getAffinity(place) {
      let userInfo = cookieManager.getAllCookie();
      let aspectTotal = 0.0;
      let preferenceTotal = 0.0;
      const aspects = new Array("Food", "Service", "Decor", "Atmosphere", "Facilities");

      for (const aspect of aspects) {
        preferenceTotal += parseFloat(userInfo.get(aspect));
      }

      function squareIt(num) {
        return num * num;
      }

      const getRestaurantAspects = new Request('http://localhost/RestaurantRecommender/API/restaurants.php', {
        method: 'POST',
        body: JSON.stringify({
          ID: place.id
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      fetch(getRestaurantAspects).then((response) => response.json()).then((data) => {
        let influence = 0.0;
        let prefAsPercent = 0.0;
        let sumInfluence = 0.0

        //find total for restaurant
        for (const aspect of aspects) {
          aspectTotal += parseFloat(data[aspect]);
        }

        for (const aspect of aspects) {
          prefAsPercent = userInfo.get(aspect) / preferenceTotal;
          influence = parseFloat(data[aspect] * userInfo.get(aspect) + data[aspect]);
          influence = (squareIt(influence) * prefAsPercent);
          sumInfluence += influence;
        }

        sumInfluence = sumInfluence + aspectTotal;
        sumInfluence = (sumInfluence / 9) * 100
        place["affinity"] = (sumInfluence).toFixed(2);
        placePin(place);
      });
    }

    function placePin(place) {
      let restaurantTag = document.createElement("div");
      restaurantTag.className = "restaurantPin";

      const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        content: restaurantTag,
        gmpClickable: true
      });

      if (cookieManager.isLoggedIn()) {
        restaurantTag.textContent = place.affinity + "%";
      } else {
        restaurantTag.textContent = place.displayName;
      };

      marker.addEventListener("mouseover", async () => {
        restaurantTag.style.fontSize = "16px";
        restaurantTag.textContent = place.displayName;
      });

      marker.addEventListener("mouseleave", async () => {
        if (cookieManager.isLoggedIn()) {
          restaurantTag.textContent = place.affinity + "%";
        }
        else {
          restaurantTag.textContent = place.displayName;
        }
        restaurantTag.style.fontSize = "12px";
      });

      markersArray.push(marker);



      /**Get the information from the side menu
       * Gets the information from the place api using the ID of the pin clicked
       * Then requests the corresponding aspect values from the database 
       */

      marker.addListener("gmp-click", async () => {
        const placeToGet = new Place({ id: place.id });
        sideMenu.style.display = "block";
        sideMenuContent.style.display = "none"
        document.getElementById("loader").style.display = "block";


        //disable the buttons if the user isn't logged in - check after each pin as the user can log in between pin clicks
        for (let button of feedbackButtons) {
          if (!cookieManager.isLoggedIn())
            button.disabled = true;
          button.classList.add("buttonDisabled");
          document.getElementById("timeSinceLast").textContent = "Please log in to review restaurants"
        };
        //add Listeners - only do this once
        for (let button of feedbackButtons) {
          if (button.getAttribute('listener') !== 'true') {
            button.setAttribute('listener', 'true');
            button.addEventListener('click', () => {
              sendNewReview(button.id, place.id);
            });
          }
        };



        //populate side menu
        getRestaurantAspects(place.id);

        /**
         *performs the fetchFields request (called getDetails in the legacy version)
         */
        await placeToGet.fetchFields({ fields: ['displayName', 'rating', 'photos'] }).then(() => {
          try {
            let RestaurantImage = document.getElementById("RestaurantImage");
            let imgAttribution = document.getElementById("imgAttribution");
            let RestaurantName = document.getElementById("RestaurantName");
            let RestaurantRating = document.getElementById("RestaurantRating");
            let imageLink = document.getElementById("imageLink")

            RestaurantName.textContent = placeToGet.displayName;

            if (placeToGet.photos[0] === null) {
              RestaurantImage.src = "NoImage.png"
              imgAttribution.textContent = ""
            } else {
              RestaurantImage.src = placeToGet.photos[0].getURI({ maxHeight: 120, maxWidth: 120 });
              //required by google policy as per https://developers.google.com/maps/documentation/places/web-service/place-photos

              //Link on users name to their profile
              imgAttribution.textContent = placeToGet.photos[0].authorAttributions[0].displayName;//author name
              imgAttribution.href = placeToGet.photos[0].authorAttributions[0].uri;

              //link on image to image source
              imageLink.href = placeToGet.photos[0].authorAttributions[0].photoUri;
            }


            if (placeToGet.rating === null) {
              RestaurantRating.textContent = "No rating available"
            } else {
              RestaurantRating.textContent = "Google Rating: " + placeToGet.rating + "/5";
            }
          } catch (e) {
            console.log("Something went wrong: " + e);
          }
        });
      });
    }

    function removeMarkers() {
      for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
      }
      markersArray.length = 0;
    }

    /**@function
     * @name getRestaurantAspects
     * @description gets the aspects and review number for the clicked restaurant pin - then sends the request for the previous review if the user is logged in
     * @param {String} restaurantID 
     */
    async function getRestaurantAspects(restaurantID) {
      const getRestaurantAspects = new Request('http://localhost/RestaurantRecommender/API/restaurants.php', {
        method: 'POST',
        body: JSON.stringify({
          ID: restaurantID
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await fetch(getRestaurantAspects).then((response) => response.json()).then((data) => {

        function setBar(aspectName) {
          var targetName = aspectName + "Rating";
          var targetBar = document.getElementById(targetName);
          targetBar.textContent = aspectName + ": " + Math.trunc(data[aspectName] * 100) + "/100";
          targetBar.style.width = Math.trunc(data[aspectName] * 100) + ("%");
        }

        setBar("Food");
        setBar("Service");
        setBar("Decor");
        setBar("Atmosphere");
        setBar("Facilities")

        reviewNumber.textContent = "Number of reviews received: " + data['ReviewNumber'];
        //get the users previous review if they're logged in, otherwise just show the content
        if (cookieManager.isLoggedIn()) {
          getReview(restaurantID)
        } else {
          document.getElementById("loader").style.display = "none";
          sideMenuContent.style.display = "grid";
        }
      })
        .catch(console.error);
    }

    /**@function 
     * @name sendNewReview
     * @description used to create new reviews in the database - also "cleans" the button of the previous review
     * @param {String} buttonClicked - id of the clicked button
     * @param {String} restaurantID - id of the restaurant the user has currently selected
    */
    async function sendNewReview(buttonClicked, restaurantID) {
      let ReviewRating;
      let buttonArr = Array.from(document.getElementsByClassName("activeFeedback"));
      if (buttonArr.length != 0) {
        buttonArr[0].disabled = false;
        buttonArr[0].classList.remove("activeFeedback");
      }
      switch (buttonClicked) {
        case "LoveFeedbackButton":
          ReviewRating = 6;
          break;
        case "GoodFeedbackButton":
          ReviewRating = 5;
          break;
        case "LikeFeedbackButton":
          ReviewRating = 4;
          break;
        case "DislikeFeedbackButton":
          ReviewRating = 3;
          break;
        case "BadFeedbackButton":
          ReviewRating = 2;
          break;
        case "HateFeedbackButton":
          ReviewRating = 1;
          break;
      }

      let createReview = new Request('http://localhost/RestaurantRecommender/API/feedback.php', {
        method: 'POST',
        body: JSON.stringify({
          RestaurantID: restaurantID,
          UserID: cookieManager.getCookie("UserID"),
          ReviewRating: ReviewRating
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await fetch(createReview).then((response) => {
        if (response.ok) {
          getReview(restaurantID);
        } else {
          throw new Error("Unexpected error occurred");
        }
      }).catch(console.error);

    }

    /**@function
     * @name getReview
     * @description used to get existing reviews from the database, highlights the appropriate button and disables/enables them when necessary - also compares
     * timestamps for previous reviews to current time to prevent spam
     */
    async function getReview(restaurantID) {
      let getReviewReq = new Request('http://localhost/RestaurantRecommender/API/reviews.php', {
        method: 'POST',
        body: JSON.stringify({
          RestaurantID: restaurantID,
          UserID: cookieManager.getCookie("UserID")
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await fetch(getReviewReq).then((response) => response.json()).then((data) => {
        //enable all the buttons that were disabled from previous reviews 
        for (let button of feedbackButtons) {
          button.disabled = false;
          button.classList.remove("buttonDisabled");
        };
        let target;
        let buttonArr = []; //HTML element from getElementsByClassName dynamically updates, array doesn't, so needs to be reset each time
        buttonArr = Array.from(document.getElementsByClassName("activeFeedback"));

        if (buttonArr.length != 0) {
          buttonArr[0].disabled = false;
          buttonArr[0].classList.remove("activeFeedback");
        }

        //if theres a previous review within 7 days disable the buttons 
        if (data['ReviewRating']) {
          switch (data['ReviewRating']) {
            case "6":
              target = document.getElementById("LoveFeedbackButton");
              break;
            case "5":
              target = document.getElementById("GoodFeedbackButton");
              break;
            case "4":
              target = document.getElementById("LikeFeedbackButton");
              break;
            case "3":
              target = document.getElementById("DislikeFeedbackButton");
              break;
            case "2":
              target = document.getElementById("BadFeedbackButton");
              break;
            case "1":
              target = document.getElementById("HateFeedbackButton");
              break;
          }
          target.disabled = true;
          target.classList.add("activeFeedback");
        }

        if (data['time']) {
          document.getElementById("timeSinceLast").textContent = "Time since your last review: \n" + data['time'] + ". Please wait 7 days to review again";
          if (data['code'] == 0) {
            for (let button of feedbackButtons) {
              button.disabled = true;
              button.classList.add("buttonDisabled");
            };
          }
        } else {
          document.getElementById("timeSinceLast").textContent = "You haven't reviewed this restaurant yet"
        }

        document.getElementById("loader").style.display = "none";
        sideMenuContent.style.display = "grid";
      })
        .catch(console.error);
    }

  }
  initMap();
});




