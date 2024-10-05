if not defined in_subprocess (cmd /k set in_subprocess=y ^& %0 %*) & exit )
npm run tauri icon ./src-tauri/icons/icon.png