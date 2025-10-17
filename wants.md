create a pub/sub system for apps to tap into for them to comm with each other, ex the music player controls should show up in the notif area and they interact via events
create a task manager that simlate our mock de, it should be able to kill running apps

simulat eteh same strat for for the taskbar, use pub/sub to connect from taskbar to window controls

next add window resizing
in click of a tile, create an effect where the time flips and sacles into the window, add a spasl screen until the app is ready minimum if 100ms, so openin g an app will play this quick flip scale animation, and display a spash screen until the app is ready
lets create a spash screen api and docs for logos, spinners, loaders, terminals,etc
for the app tile hover, the sheen needs to be on the rights side instead of the center
long press of 3 secs on a tile needs to make all tiles adjustable upto a max ofr 3x3, store this is the persistent storage
fix minimize, maximize and close behaviors as they are very buggy
quick settins needs to overlay the entire working aread, also show battery details in the taskbar and on the notif overla, for each icon add a onhover popover that gives more details such as remainign battery and percentage etc
also notif animate too slow needs to be 2x faster

the toficiation list needs to be powered by a pub sub pattern aswell to simulate a real os