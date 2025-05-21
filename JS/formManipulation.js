const cookieManager = await import("./cookieManager.js");
/**
 * @description function to populate the profile menu - called when the user logs in, or if the users cookies have already been set when clickin
 * the profile/login button - exists here as its required by both the map loader (showing the profile) and the forms (after a user logs in)
 * @param {Map} userInfo takes a map with the users profle info; name, reviews given, aspect preferences etc
 */
function populateUserProfile(userInfo) {

    CreateAccForm.style.display = "none";

    const userProfile = document.getElementById("userProfile");
    const loginForm = document.getElementById("loginForm");


    userProfile.style.display = "grid";
    CreateAccButton.style.display = "none";
    loginForm.style.display = "none";
    LoginMenuButton.textContent = "Close";

    
    const loggedUsername = document.getElementById("loggedUsername");
    const userReviewsTotal = document.getElementById("userReviewsTotal")

    loggedUsername.textContent = "Hello " + userInfo.get("Username");
    userReviewsTotal.textContent = "Total reviews given: " + userInfo.get("ReviewNumber");

    setBar(userInfo, "Food");
    setBar(userInfo, "Service");
    setBar(userInfo, "Decor");
    setBar(userInfo, "Atmosphere");
    setBar(userInfo, "Facilities");
}

function hideAll() {
    UserMenu.classList.remove("background");
    UserMenuContent.style.display = "none";
    CreateAccForm.style.display = "none";
    userProfile.style.display = "none";
    if (cookieManager.isLoggedIn()) {
        LoginMenuButton.textContent = "Profile";
    } else {
        LoginMenuButton.textContent = "Login";
    }
    CreateAccForm.style.display = "none";
}

function cookiePopulate() {
    UserMenu.classList.add("background");
    CreateAccButton.style.display = "none";
    loginForm.style.display = "none";
    LoginMenuButton.textContent = "Close"
    userProfile.style.display = "block";
    populateUserProfile(cookieManager.getAllCookie());
}

function setBar(userInfo, barName) {
    let value = parseFloat(userInfo.get(barName));
    let targetName = "user" + barName + "Rating";
    let targetBar = document.getElementById(targetName);
    targetBar.textContent = barName + ": " + Math.trunc(value * 100) + "/100";
    targetBar.style.width = Math.trunc(value * 100) + ("%");
}


export { populateUserProfile, hideAll, cookiePopulate }