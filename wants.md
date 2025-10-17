every app needs to have a manifest so we can mock features and perms
some apps can launch multi windows and some cant
we need to create a tile spec that talk about tile features such as icons, text, char count, controls, widgets, hide, show, grid snapping, scaling 1x1 2x1 2x2 etc
we should have a tile app that explain the features with toggles and configs
add a global registry component that track user prefs and sotre them to local storage for persistence
add a quick way to delete this state
add quick and subtle animates to the entire project
I like springy and sub 100ms animations
create a standardized way to handle errors and log out only relevant errors
the quick settings area in the taskbara should be clickable with toggles check boxes for relevant controls
on click it shoud take over the entire working area and show a gaussian blurred background so the notificaitons and quick ettings can be highlighted
create a pub/sub system for apps to tap into for them to comm with each other, ex the music player controls should show up in the notif area and they interact via events
create a task manager that simlate our mock de, it should be able to kill running apps

