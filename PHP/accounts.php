<?php
require 'connection.php';


class account
{
    public static $responseCode;
    private static $connection;

    public function __construct()
    {
        self::$connection = connect::getConnection();
    }

    public function errorResponse($code, $message)
    {
        http_response_code($code);
        echo $message;
        exit();
    }

    public function requestHandler()
    {
        //create account
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            try {
                $json = mb_convert_encoding(file_get_contents('php://input'), "UTF-8");
                $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
            } catch (Exception $e) {
                $this->errorResponse(500, "Failed to handle request ");
                echo $e;
                exit();
            }

            // one or more of the values are empty
            foreach ($data as $key => $value) {
                if (empty($value) || !isset($value) || strlen($value) === 0) {
                    $this->errorResponse(400, "One or more values are empty");
                    break;
                }
            }

            //username length exceeds maximum
            if ((strlen($data->username) > 20) || (strlen($data->username) < 2)) {
                $this->errorResponse(400, "Username must be between 2 and 20 characters");
            }

            if ($data->password !== $data->confirmPassword) {
                $this->errorResponse(400, "Passwords do not match");
            }

            //check values are between required
            $this->between($data->decor);
            $this->between($data->atmosphere);
            $this->between($data->food);
            $this->between($data->service);
            $this->between($data->facilities);

            $hashedEmail = hash('sha256', $data->email);
            $existing = self::$connection->prepare("SELECT * FROM Users WHERE Email = ? OR Username = ?");
            $existing->bind_param("ss", $hashedEmail, $data->username);

            if (($existing->execute()) === FALSE) { //if fails to connect/execute
                $existing->close();
                $this->errorResponse(500, "Failed to connect to server");
            } else {
                $Results = $existing->get_result();
                if ($Results->num_rows === 0) { //if no results are returned make the account
                    $existing->close();
                    $this->createAccount($data);
                } else {
                    $existing->close();
                    $this->errorResponse(400, "Email or Username already in use");
                }
            }



        } elseif ($_SERVER["REQUEST_METHOD"] == "PUT") {
            try {
                $json = mb_convert_encoding(file_get_contents('php://input'), "UTF-8");
                $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
            } catch (Exception $e) {
                $this->errorResponse(500, "Failed to handle request ");
                echo $e;
                exit();
            }

            // one or more of the values are empty
            foreach ($data as $key => $value) {
                if (empty($value) || !isset($value) || strlen($value) === 0) {
                    $this->errorResponse(400, "One or more values are empty");
                    break;
                }
            }

            $this->between($data->newFood);
            $this->between($data->newService);
            $this->between($data->newDecor);
            $this->between($data->newAtmos);
            $this->between($data->newFacilities);

            $this->updatePrefs($data);
        } else {
            $this->errorResponse(400, "Invalid request type");
        }
    }

    private function updatePrefs($data)
    {
        $newFood = $data->newFood / 100;
        $newService = $data->newService / 100;
        $newDecor = $data->newDecor / 100;
        $newAtmos = $data->newAtmos / 100;
        $newFacilities = $data->newFacilities / 100;

        $updatePrefs = self::$connection->prepare("UPDATE Users SET Food = ?, Service = ?, Decor = ?, Atmosphere = ?, Facilities = ? WHERE UserID = ?");
        $updatePrefs->bind_param("dddddi", $newFood, $newService, $newDecor, $newAtmos, $newFacilities, $data->UserID);
        if ($updatePrefs->execute()) {
            $updatePrefs->close();
            $getNewPrefs = self::$connection->prepare("SELECT Food, Service, Decor, Atmosphere, Facilities FROM Users WHERE UserID = ?");
            $getNewPrefs->bind_param("i", $data->UserID);
            if ($getNewPrefs->execute()) {
                echo json_encode($getNewPrefs->get_result()->fetch_assoc(), JSON_PRETTY_PRINT);
            }
        } else {
            $this->errorResponse(400, "Failed to handle request");
        }
    }
    private function between($value)
    {
        if ((100 < $value) || ($value < 1)) {
            $this->errorResponse(400, "Slider values exceed allowed limits");
        }
    }
    private function createAccount($data)
    {
        $username = $data->username;
        $email = $data->email;
        $password = $data->password;
        $decor = $data->decor / 100;
        $atmosphere = $data->atmosphere / 100;
        $food = $data->food / 100;
        $service = $data->service / 100;
        $facilities = $data->facilities / 100;

        $hashedEmail = hash('sha256', $email);
        $hashedPassword = hash('sha256', $password);

        $createAccount = self::$connection->prepare("INSERT INTO Users (Username, Email, Password, Food, Service, Decor, Atmosphere, Facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $createAccount->bind_param("sssddddd", $username, $hashedEmail, $hashedPassword, $food, $service, $decor, $atmosphere, $facilities);
        if ($createAccount->execute()) {
            self::$responseCode = 201; //success
            http_response_code(self::$responseCode);
            $createAccount->close();
        } else {
            $this->errorResponse(500, "Failed to insert new user");
            $createAccount->close();
        }

    }
}
$accountObj = new account();
$accountObj->requestHandler();
?>