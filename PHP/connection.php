<?php
class connect
{
    private $responseCode;
    public static $connection;
    final private function __construct()
    {
    }

    public static function getConnection()
    {
        if (!isset(self::$connection)) {
            self::$connection = new mysqli("Deleted for Security");
            if (self::$connection->connect_error) {
                self::$responseCode = 500; //failed connection
                http_response_code(self::$responseCode);
                exit();
            }
        }
        return self::$connection;
    }
}

?>