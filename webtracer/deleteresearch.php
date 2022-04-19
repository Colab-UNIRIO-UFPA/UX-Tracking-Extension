<?php 

function recursiveRemove($dir) {
    $structure = glob(rtrim($dir, "/").'/*');
    if (is_array($structure)) {
        foreach($structure as $file) {
            if (is_dir($file)) recursiveRemove($file);
            elseif (is_file($file)) unlink($file);
        }
    }
    rmdir($dir);
}

if(isset($_POST['delete'])){
    
    $dir = "./Samples";

    $structure = glob(rtrim($dir, "/").'/*');
    if (is_array($structure)) {
        foreach($structure as $file) {
            if (is_dir($file)) recursiveRemove($file);
            elseif (is_file($file)) unlink($file);
        }
    }
    rmdir($dir);
}

?>

<!doctype html>
<html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Delete Research</title> 
      <link href='./style.css' rel='stylesheet' type='text/css'> 
    </head>
    <body>
        <div class='container'>
            <h1>Delete Research</h1>
        <form method='post' action=''>
            <input type='submit' name='delete' value='Delete Research' />&nbsp;
        </form>
        </div>
    </body>
</html>
