<?php
require 'connection.php';

class Review
{
    private static $connection;

    private static $responseCode;

    public function __construct()
    {
        self::$connection = connect::getConnection();
    }


    /**check the EXISTING restaurants reviews, used to prevent spam/more than one review on the same restaurant from one user
     */

    public function requestHandler()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            try {
                $json = mb_convert_encoding(file_get_contents('php://input'), "UTF-8");
                $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
                $this->getReview($data->RestaurantID, $data->UserID);
            } catch (Exception $e) {
                echo $e;
                $this->errorResponse(500, "Failed to handle request ");
                exit();
            }

        } else {
            $this->errorResponse(400, "Invalid request type");
        }
    }

    private function getReview($restaurantID, $userID)
    {
        if (empty($restaurantID) || !isset($restaurantID) || empty($userID) || !isset($userID)) {
            $this->errorResponse(400, "Missing ID");
        } else {
            $stmt = self::$connection->prepare("SELECT * FROM Reviews WHERE RestaurantID = ? AND UserID = ? ORDER BY ReviewTime DESC");
            $stmt->bind_param("ss", $restaurantID, $userID);
            if ($stmt->execute()) {
                if ($Results = $stmt->get_result()) { //take a look into this (the same in restaurant.php) because im not entirely sure if it works the way i think it does
                    if ($Results->num_rows >= 1) {
                        $firstRow = $Results->fetch_assoc();
                        $stmt->close();
                        //always need the review rating if it exists
                        $arr['ReviewRating'] = $firstRow['ReviewRating'];

                        //check if the previous review was within a week
                        $reviewTimestamp = new DateTime($firstRow['ReviewTime'], new DateTimeZone("GMT"));
                        $currentTime = new DateTime();
                        $currentTime->setTimezone(new DateTimeZone("GMT"));

                        $diff = $currentTime->diff($reviewTimestamp);

                        if ($diff->d > 7) {// can create another review for the restaurant
                            $arr['code'] = 1;
                        } else {// cant create another
                            $arr['code'] = 0;
                        }
                        $arr['time'] = ($diff->format("%d days, %h hours and %m minutes"));
                        echo json_encode($arr, JSON_PRETTY_PRINT);
                        exit();

                    } else {
                        echo json_encode(2);
                        exit();
                    }
                } else {
                    $stmt->close();
                    $this->errorResponse(500, "Failed to connect to server");
                }
            }
        }
    }
    private function errorResponse($code, $message)
    {
        http_response_code((int) $code);
        echo json_encode($message, JSON_PRETTY_PRINT);
        exit();
    }

}
$reviewObj = new Review();
$reviewObj->requestHandler();
?>