<?php

$resultID = rtrim($_POST['resultID']);
$data = stripslashes($_POST['data']);

$dir = "../data/";

$fh = fopen($dir . $resultID . ".csv", 'w') or die("Error opening file!");
fwrite($fh, $data);
fclose($fh);

echo "Success " . $resultID;
?>
