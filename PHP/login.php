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

            foreach ($data as $key => $value) {
                if (empty($value) || !isset($value) || strlen($value) === 0) {
                    $this->errorResponse(400, "One or more values are empty");
                    break;
                }
            }

            $hashedEmail = hash('sha256', $data->email);
            $emailCheck = self::$connection->prepare("SELECT Email FROM Users WHERE Email = ?");
            $emailCheck->bind_param("s", $hashedEmail);

            if (!($emailCheck->execute())) { //if fails to connect/execute
                $emailCheck->close();
                $this->errorResponse(500, "Failed to connect to server");
            } else {
                $Results = $emailCheck->get_result();
                if ($Results->num_rows === 1) { //if result is returned
                    $emailCheck->close();

                    $getPassword = self::$connection->prepare("SELECT Password FROM Users WHERE Email = ?");
                    $getPassword->bind_param("s", $hashedEmail);
                    if ($getPassword->execute()) {
                        $retrievedPassword = mysqli_fetch_assoc($getPassword->get_result());
                        $retrievedPassword = $retrievedPassword["Password"];

                        if (hash_equals(hash('sha256', $data->password), $retrievedPassword)) {
                            $getPassword->close();

                            $getAspects = self::$connection->prepare("SELECT * FROM Users WHERE Email = ?");
                            $getAspects->bind_param("s", $hashedEmail);
                            if ($getAspects->execute() === TRUE) {
                                $aspects = mysqli_fetch_assoc($getAspects->get_result());
                                echo json_encode($aspects, JSON_PRETTY_PRINT);
                                $getAspects->close();
                                exit();
                            } else {
                                $getAspects->close();
                                $this->errorResponse(500, "Failed to connect to server");
                            }
                        } else {
                            $getPassword->close();
                            $this->errorResponse(400, "Email or password is incorrect");
                        }
                    } else {
                        $getPassword->close();
                        $this->errorResponse(500, "Failed to connect to server");
                    }

                } else {
                    $emailCheck->close();
                    $this->errorResponse(400, "Email or password is incorrect");
                }
            }
        } else {
            $this->errorResponse(400, "Invalid request type");
        }
    }

}
$accountObj = new account();
$accountObj->requestHandler();
?>