<?php
require 'connection.php';

class Restaurant
{
    private static $connection;

    private static $responseCode;

    public function __construct()
    {
        self::$connection = connect::getConnection();
    }

    public function requestHandler()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            try {
                $json = mb_convert_encoding(file_get_contents('php://input'), "UTF-8");
                $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
                $this->getRestaurant($data->ID);
            } catch (Exception $e) {
                $this->errorResponse(500, "Failed to handle request ");
                echo $e;
                exit();
            }

        } else {
            $this->errorResponse(400, "Invalid request type");
        }
    }

    private function getRestaurant($ID)
    {
        if (empty($ID) || !isset($ID)) {
            $this->errorResponse(400, "No ID provided");
        } else {
            $stmt = self::$connection->prepare("SELECT * FROM Restaurants WHERE ID = ?");
            $stmt->bind_param("s", $ID);
            if ($stmt->execute()) {
                if ($Results = $stmt->get_result()) {
                    if ($Results->num_rows === 1) {
                        $stmt->close();
                        echo json_encode($Results->fetch_assoc(), JSON_PRETTY_PRINT);
                    } else {
                        $this->createNew($ID);
                        $stmt->close();
                    }
                }
            } else {
                $stmt->close();
                $this->errorResponse(500, "Failed to connect to server");

            }
        }
    }

    private function createNew($ID)
    {
        $stmt = self::$connection->prepare("INSERT INTO Restaurants (ID) VALUES (?)");
        $stmt->bind_param("s", $ID);
        if ($stmt->execute()) {
            self::$responseCode = 201; //success
            http_response_code(self::$responseCode);
            $stmt->close();
            $this->getRestaurant($ID);
            exit();
        }
    }
    private function errorResponse($code, $message)
    {
        http_response_code((int) $code);
        echo json_encode($message, JSON_PRETTY_PRINT);
        exit();
    }

}
$restaurantObj = new Restaurant();
$restaurantObj->requestHandler();
?>