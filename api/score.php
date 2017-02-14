<?php
header("Access-Control-Allow-Origin: *");

$servername = "localhost";
$username = "richardh_ufvp345";
$password = "3GDN4PW23Cy3z2b2";
$database = "richardh_escape";

// Create connection
$mysqli = new mysqli($servername, $username, $password, $database);

// Check connection
if ($mysqli->connect_errno) {
	die();
} 

if (strlen($_REQUEST["name"]) > 0 && strlen($_REQUEST["name"]) <= 3 && $_REQUEST["score"] > 0)  {

		$stmt = $mysqli->prepare("INSERT INTO `richardh_escape`.`score` (`name`, `score`) VALUES (?, ?)");
		$stmt->bind_param('sd', $_REQUEST["name"], $_REQUEST["score"]);
		$stmt->execute();
		$stmt->close();
		$mysqli->close();

} else {
	if ($result = $mysqli->query("SELECT * FROM score ORDER BY score DESC LIMIT 1")) {

		$score = $result->fetch_assoc();

    	$result->close();
		$mysqli->close();
		
		echo(json_encode($score));

	}
}