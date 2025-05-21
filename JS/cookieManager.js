
//https://www.w3schools.com/js/js_cookies.asp
const userInfo = new Map();
const allCookie = new Array("UserID", "Username", "Email", "Password", "ReviewNumber", "Food", "Service", "Decor", "Atmosphere", "Facilities");

function setCookies(key, value) {
    const d = new Date();
    d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000)); //expire after 30 days
    let expires = "expires=" + d.toUTCString();
    document.cookie = key + "=" + value + ";" + expires + ";path=/";
}



function getCookie(cookieName) {
    //https://stackoverflow.com/questions/10730362/get-cookie-by-name
    let cookieValue = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`))?.at(2);
    return cookieValue;
}

function getAllCookie() {
    if (getCookie("Username") != "" || getCookie("Username") != null) {
        userInfo.set("Username", getCookie("Username"));
        userInfo.set("ReviewNumber", getCookie("ReviewNumber"));
        userInfo.set("Food", getCookie("Food"));
        userInfo.set("Service", getCookie("Service"));
        userInfo.set("Decor", getCookie("Decor"));
        userInfo.set("Atmosphere", getCookie("Atmosphere"));
        userInfo.set("Facilities", getCookie("Facilities"));
        return userInfo;
    }
    return false;
}

function deleteCookies() {
    for (const item in allCookie) {
        document.cookie = allCookie[item] + "=;" + "expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      }
    
}

function isLoggedIn(){
    for (const cookieName of allCookie){
        let cookieValue = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`))?.at(2);
        if (cookieValue == null || cookieValue == ""){
            return false;
        }
    }
    return true;
}

export { setCookies, getCookie, getAllCookie, deleteCookies, isLoggedIn }