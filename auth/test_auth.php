<?php
$_POST['action'] = 'register';
$_POST['role'] = 'patient';
$_POST['name'] = 'Nilesh Gale';
$_POST['email'] = 'nileshgale520@gmail.com';
$_POST['password'] = 'password123';

try {
    ob_start();
    require 'auth.php';
    $output = ob_get_clean();
    echo "OUTPUT STARTS HERE:\n" . $output . "\nOUTPUT ENDS HERE";
} catch (Throwable $e) {
    echo "FATAL EXCEPTION:\n" . $e->getMessage();
}
