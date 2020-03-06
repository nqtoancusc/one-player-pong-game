This pong game allows a user to use their mobile to control the game displayed on their computer screen.

Guide for developers:

1. Setup database
CREATE DATABASE pong_oneplayer CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE USER 'pong_oneplayer'@'localhost' IDENTIFIED BY 'pong_oneplayer';

GRANT ALL ON pong_oneplayer.* TO pong_oneplayer@localhost IDENTIFIED BY 'pong_oneplayer';

2. Install dependencies
npm install

3. Run test on local machine

node app/server 2000

—-> screen: http://localhost:2000/pong
—-> remote: http://localhost:2000
