window.addEventListener("load", async function () {
    const cookieManager = await import("./cookieManager.js");
    const formManipulation = await import("./formManipulation.js");
    const createAccount = this.document.getElementById("CreateAccountSubmit");
    const loginSubmit = this.document.getElementById("LoginSubmit");
    const userInfo = new Map(); // used to pass the info stored in cookies to different functions

    const updatePrefButton = this.document.getElementById("updatePrefButton");

    createAccount.addEventListener("click", (e) => {
        const username = this.document.getElementById("nameInputCA").value.trim();
        const email = this.document.getElementById("emailInputCA").value.trim();
        const password = this.document.getElementById("passwordInputCA").value.trim();
        const passwordConfirm = this.document.getElementById("confirmPasswordInputCA").value.trim();

        const decor = this.document.getElementById("DecorSldr").value;
        const atmosphere = this.document.getElementById("AtmosphereSldr").value;
        const food = this.document.getElementById("FoodSldr").value;
        const service = this.document.getElementById("ServiceSldr").value;
        const facilities = this.document.getElementById("FacilitiesSldr").value;



        const sliderValues = [decor, atmosphere, food, service, facilities];

        if (validate(username, email, password, passwordConfirm) && validateSliders(sliderValues)) {
            try {
                const CreateAccRequest = new Request('http://localhost/RestaurantRecommender/API/accounts.php', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        confirmPassword: passwordConfirm,
                        decor: decor,
                        atmosphere: atmosphere,
                        food: food,
                        service: service,
                        facilities: facilities
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                (async () => {
                    var response = await fetch(CreateAccRequest);
                    formError.text = await response.text();
                    if (response.ok) {
                        loginRequest(email, password);
                    } else {
                        response.text().then((text) => {
                            console.log(text);
                        })
                    }
                })();
            } catch (error) {
                console.log(error)
            }

        }
        e.preventDefault();
    });

    loginSubmit.addEventListener("click", (e) => {
        const emailInput = this.document.getElementById("LoginEmailInput");
        const passwordInput = this.document.getElementById("LoginPasswordInput");
        let formError = this.document.getElementById("formError");
        formError.textContent = ("");

        if (basicValidate(passwordInput.value.trim(), emailInput.value.trim())) {
            let email = emailInput.value.trim();
            let password = passwordInput.value.trim()
            loginRequest(email, password);
        }
        else {
            formError.textContent = "Email or Password are missing";
        }

        e.preventDefault();
    });

    /**@function
     * @name loginRequest
     * @description - sends a request to login in with the provided email and password
     */
    function loginRequest(email, password) {
        const loginRequest = new Request('http://localhost/RestaurantRecommender/API/login.php', {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                password: password
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        try {
            fetch(loginRequest).then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        if (cookieManager.isLoggedIn()) {
                            formManipulation.populateUserProfile(cookieManager.getAllCookie());
                        }
                        else {
                            for (const key in data) {
                                cookieManager.setCookies(key, data[key]);
                                userInfo.set(key, data[key]);
                            }
                            formManipulation.populateUserProfile(userInfo);
                        }
                    });
                } else {
                    response.text().then((data) => {
                        formError.textContent = data;
                    })

                }
            })
        } catch (error) {
            console.log(error);
        }
    }


    /**@function
     * @name basicValidate
     * @description - validates that the users email and password are present
     */

    function basicValidate(email, password) {
        let formError = this.document.getElementById("formError");
        formError.style.display = "block"
        formError.textContent = ("");

        if ((email == null || email == '') || (password == null || password == '')) {
            formError.textContent = "One or more inputs are empty";
            return false;
        }
        formError.textContent = ""
        return true;
    }

    /**@function
     * @name validate
     * @description fully validates all inputs for all presence, length, matching checks
     */
    function validate(username, email, password, passwordConfirm) {
        let formError = this.document.getElementById("formError");
        formError.style.display = "block"
        formError.textContent = ("");

        if ((username == null || username == '') || (email == null || email == '') ||
            (password == null || password == '') || (passwordConfirm == null || passwordConfirm == '')) {
            formError.textContent = "One or more inputs are empty";
            return false;
        }
        if (!(password === passwordConfirm)) {
            formError.textContent = "Passwords do not match";
            return false;
        }
        if (password.length > 64) {
            formError.textContent = "Password exceeds allowed length";
            return false;
        }
        if (username.length > 20) {
            formError.textContent = "Username exceeds allowed length (20 Characters)";
            return false;
        }
        formError.textContent = ""
        return true;
    }


    function validateSliders(sliderValues) {
        sliderValues.forEach(value => {
            if ((isNaN(value)) || value < 0 || value > 100) {
                return false;
            }
        });
        return true;
    }

    updatePrefButton.addEventListener("click", (e) => {
        let newFood = this.document.getElementById("FoodSldrUpdate").value;
        let newService = this.document.getElementById("ServiceSldrUpdate").value;
        let newDecor = this.document.getElementById("DecorSldrUpdate").value;
        let newAtmos = this.document.getElementById("AtmosphereSldrUpdate").value;
        let newFacilities = this.document.getElementById("FacilitiesSldrUpdate").value;

        const sliderValues = [newFood, newService, newDecor, newAtmos, newFacilities];

        sliderValues.forEach(value => {
            if ((isNaN(value)) || value < 0 || value > 100) {
                return false;
            }
        });

        try {
            const updatePreferences = new Request('http://localhost/RestaurantRecommender/API/accounts.php', {
                method: 'PUT',
                body: JSON.stringify({
                    UserID: cookieManager.getCookie("UserID"),
                    newFood: newFood,
                    newService: newService,
                    newDecor: newDecor,
                    newAtmos: newAtmos,
                    newFacilities: newFacilities

                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            (async () => {
                var response = await fetch(updatePreferences);
                if (response.ok) {
                    response.json().then((data) => {
                        cookieManager.setCookies("Food", data['Food']);
                        cookieManager.setCookies("Service", data['Service']);
                        cookieManager.setCookies("Decor", data['Decor']);
                        cookieManager.setCookies("Atmosphere", data['Atmosphere']);
                        cookieManager.setCookies("Facilities", data['Facilities']);
                        formManipulation.cookiePopulate();
                    });
                } else {
                    formError.textContent = "An unknown error Occurred";
                }
            })();
        } catch (error) {
            console.log(error)
        }
        e.preventDefault();
    });
});


