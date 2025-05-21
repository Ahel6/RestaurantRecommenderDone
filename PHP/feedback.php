<?php
require 'connection.php';

class Feedback
{
    private static $connection;

    private static $responseCode;

    public function __construct()
    {
        self::$connection = connect::getConnection();
    }

    //creates NEW reviews
    //Handles feedback reviews given by the user - initial request takes the UserID, Restaurant ID and ReviewRating (from 1-6)
    //includes updating the aspects of the restaurant as well as storing the review in the database 

    public function requestHandler()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            try {
                $json = mb_convert_encoding(file_get_contents('php://input'), "UTF-8");
                $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
                $this->createNew($data);
            } catch (Exception $e) {
                $this->errorResponse(500, $e);
                exit();
            }

        } else {
            $this->errorResponse(400, "Invalid request type");
        }
    }


    //create and store the new review 
    private function createNew($data)
    {
        print ("creating new...");
        //add the review to the database
        $stmt = self::$connection->prepare("INSERT INTO Reviews (RestaurantID, UserID, ReviewRating) VALUES (?,?,?)");
        $stmt->bind_param("sii", $data->RestaurantID, $data->UserID, $data->ReviewRating);
        print ("\n Statement Bound...");
        try {
            if ($stmt->execute()) {
                $stmt->close();
                $updateUserReviewNum = self::$connection->prepare("UPDATE Users SET ReviewNumber = ReviewNumber+1 WHERE UserID=?");
                $updateUserReviewNum->bind_param("i", $data->UserID);

                $updateRestaurantReviewNum = self::$connection->prepare("UPDATE Restaurants SET ReviewNumber = ReviewNumber+1 WHERE ID=?");
                $updateRestaurantReviewNum->bind_param("s", $data->RestaurantID);

                if ($updateUserReviewNum->execute() && $updateRestaurantReviewNum->execute()) {
                    $updateUserReviewNum->close();
                    $updateRestaurantReviewNum->close();
                    $this->updateAspects($data); //update aspect scores
                } else {
                    $updateUserReviewNum->close();
                    $updateRestaurantReviewNum->close();
                    $this->errorResponse(500, "failed to update review number");
                }
            } else {
                print ("insert statement failed");
                $stmt->close();
                $this->errorResponse(500, "Unknown Error Occurred");
            }
        } catch (Exception $e) { //catches errors caused by the table restraints (relational)
            $this->errorResponse(500, "Error occurred: " . $e);
        }

    }

    /**
     * Update the saved aspect scores for the restaurant based on the users number of reviews, current preferences, and the score given in the review
     * @param mixed $data
     * @return void
     */
    private function updateAspects($data)
    {
        //self::updateReviewNumber($data);

        echo "rating {$data->ReviewRating} \n";

        //Determines how effective the users review is based on their number of reviews given
        $reviewScore = match ((int) $data->ReviewRating) {
            1 => -0.03,//Hate
            2 => -0.02,
            3 => -0.01,
            4 => 0.01,
            5 => 0.02,
            6 => 0.03,
        };

        //value based on the number of reviews the user has given
        $stmt = self::$connection->prepare("SELECT ReviewNumber FROM Users WHERE UserID = ?");
        $stmt->bind_param("i", $data->UserID);

        if ($stmt->execute()) {
            $reviewNumber = (int) $stmt->get_result()->fetch_column();
            if ((0 <= $reviewNumber) && ($reviewNumber <= 5)) {
                $reviewNumModifier = 0.33;
            } else if ((5 < $reviewNumber) && ($reviewNumber <= 10)) {
                $reviewNumModifier = 0.5;
            } else if ((10 < $reviewNumber) && ($reviewNumber <= 15)) {
                $reviewNumModifier = 0.75;
            } else if ((15 < $reviewNumber) && ($reviewNumber <= 20)) {
                $reviewNumModifier = 0.80;
            } else {
                $reviewNumModifier = 1;
            }
            $stmt->close();

            //get users Aspects
            $stmt = self::$connection->prepare("SELECT Food, Service, Decor, Atmosphere, Facilities FROM Users WHERE UserID = ?");
            $stmt->bind_param("i", $data->UserID);
            if ($stmt->execute()) {
                if ($userResults = $stmt->get_result()) {
                    if ($userResults->num_rows === 1) {
                        $userResults = $userResults->fetch_row();
                        $stmt->close();

                        //get Restaurant aspects
                        $stmt = self::$connection->prepare("SELECT Food, Service, Decor, Atmosphere, Facilities FROM Restaurants WHERE ID = ?");
                        $stmt->bind_param("s", $data->RestaurantID);
                        if ($stmt->execute()) {
                            if ($Results = $stmt->get_result()->fetch_row()) {
                                $stmt->close();
                                $newAspects = [];
                                for ($i = 0; $i < count($Results); $i++) {
                                    $userPreference = $userResults[$i];
                                    if ($userPreference < 0.01) {
                                        $userPreference = 0.01;
                                    }
                                    $valueChange = $reviewNumModifier * $userPreference * $reviewScore;
                                    if (round($Results[$i] + $valueChange, 2) >= 1) {
                                        $newAspects[] = 1.00;
                                    } elseif (round($Results[$i] + $valueChange, 2) <= 0.00) {
                                        $newAspects[] = 0.00;
                                    } else {
                                        $newAspects[] = round($Results[$i] + $valueChange, 2);
                                    }

                                }

                                $updResAspect = self::$connection->prepare("UPDATE Restaurants SET Food = ?, Service = ?, Decor = ?, Atmosphere = ?, Facilities = ? WHERE ID = ?");
                                $updResAspect->bind_param("ddddds", $newAspects[0], $newAspects[1], $newAspects[2], $newAspects[3], $newAspects[4], $data->RestaurantID);
                                try {
                                    if ($updResAspect->execute()) {
                                        self::$responseCode = 201; //success
                                        http_response_code(self::$responseCode);
                                        $updResAspect->close();
                                    }
                                } catch (exception $e) {
                                    echo ($e);
                                    exit();
                                }

                            }
                        } else {
                            $stmt->close();
                            $this->errorResponse(500, "Failed to connect to server");
                        }
                    }
                } else {
                    $stmt->close();
                    $this->errorResponse(500, "Unknown error occurred");
                }
            } else {
                $stmt->close();
                $this->errorResponse(500, "Failed to connect to server");
            }

        } else {
            $stmt->close();
            $this->errorResponse(500, "Failed to connect to server");
        }

    }

    private function updateReviewNumber($data)
    {
        $stmt = self::$connection->prepare("UPDATE Restaurants SET ReviewNumber = ReviewNumber + 1 WHERE UserID = ?");
        $stmt->bind_param("s", $data->UserID);
        if ($stmt->execute()) { //if fails to connect/execute
            $stmt->close();
            $this->errorResponse(500, "Failed to connect to server");
        } else {
            $stmt = self::$connection->prepare("SELECT ReviewNumber FROM Users WHERE UserID = ?");
            $stmt->bind_param("s", $data->UserID);
            if ($Results = $stmt->get_result()) {
                if ($Results->num_rows === 1) {
                    $stmt->close();
                    echo json_encode($Results->fetch_assoc(), JSON_PRETTY_PRINT);
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
$FeedbackObj = new Feedback();
$FeedbackObj->requestHandler();
?>